<?php
/**
 * ============================================
 * 📤 API PLV - UPLOAD D'IMAGES
 * ============================================
 * 
 * POST /api/plv/upload.php (multipart/form-data)
 *   - slot_id: ID du slot
 *   - image: Fichier image
 */

require_once __DIR__ . '/../config/init.php';

// Configuration upload
define('PLV_MAX_FILE_SIZE', 10 * 1024 * 1024); // 10 Mo
define('PLV_ALLOWED_TYPES', ['image/jpeg', 'image/png', 'image/webp']);

$method = $_SERVER['REQUEST_METHOD'];

if ($method !== 'POST') {
    errorResponse('Méthode non autorisée', 405);
}

/**
 * Vérifie si l'utilisateur peut accéder à un projet PLV
 */
function canAccessPLVProject($userId, $spaceId, $zoneId = null) {
    $db = getDB();
    
    $stmt = $db->prepare("SELECT global_role FROM users WHERE id = :id");
    $stmt->execute([':id' => $userId]);
    $user = $stmt->fetch();
    
    if ($user && $user['global_role'] === 'super_admin') {
        return true;
    }
    
    $stmt = $db->prepare("
        SELECT role FROM user_space_roles 
        WHERE user_id = :user_id AND space_id = :space_id AND zone_id IS NULL AND role = 'space_admin'
    ");
    $stmt->execute([':user_id' => $userId, ':space_id' => $spaceId]);
    if ($stmt->fetch()) {
        return true;
    }
    
    if ($zoneId) {
        $stmt = $db->prepare("
            SELECT role FROM user_space_roles 
            WHERE user_id = :user_id AND space_id = :space_id AND zone_id = :zone_id AND role = 'zone_admin'
        ");
        $stmt->execute([':user_id' => $userId, ':space_id' => $spaceId, ':zone_id' => $zoneId]);
        if ($stmt->fetch()) {
            return true;
        }
    }
    
    return false;
}

try {
    $db = getDB();
    $currentUser = requireAuth();

    // Vérifier que slot_id est fourni
    if (!isset($_POST['slot_id'])) {
        errorResponse('slot_id requis', 400);
    }

    $slotId = $_POST['slot_id'];

    // Vérifier que le fichier est fourni
    if (!isset($_FILES['image']) || $_FILES['image']['error'] === UPLOAD_ERR_NO_FILE) {
        errorResponse('Fichier image requis', 400);
    }

    $file = $_FILES['image'];

    // Vérifier les erreurs d'upload
    if ($file['error'] !== UPLOAD_ERR_OK) {
        $errors = [
            UPLOAD_ERR_INI_SIZE => 'Fichier trop volumineux (limite serveur)',
            UPLOAD_ERR_FORM_SIZE => 'Fichier trop volumineux',
            UPLOAD_ERR_PARTIAL => 'Upload incomplet',
            UPLOAD_ERR_NO_TMP_DIR => 'Dossier temporaire manquant',
            UPLOAD_ERR_CANT_WRITE => 'Erreur écriture disque',
        ];
        errorResponse($errors[$file['error']] ?? 'Erreur upload', 400);
    }

    // Vérifier la taille
    if ($file['size'] > PLV_MAX_FILE_SIZE) {
        errorResponse('Fichier trop volumineux (max 10 Mo)', 400);
    }

    // Vérifier le type MIME
    $finfo = finfo_open(FILEINFO_MIME_TYPE);
    $mimeType = finfo_file($finfo, $file['tmp_name']);
    finfo_close($finfo);

    if (!in_array($mimeType, PLV_ALLOWED_TYPES)) {
        errorResponse('Type de fichier non autorisé. Formats acceptés: JPG, PNG, WebP', 400);
    }

    // Vérifier que c'est une image valide
    $imageInfo = getimagesize($file['tmp_name']);
    if ($imageInfo === false) {
        errorResponse('Fichier image invalide', 400);
    }

    // Récupérer le slot et son projet
    $stmt = $db->prepare("
        SELECT s.*, p.id as project_id, p.space_id, p.zone_id
        FROM plv_slots s
        JOIN plv_projects p ON p.id = s.project_id
        WHERE s.id = :id
    ");
    $stmt->execute([':id' => $slotId]);
    $slot = $stmt->fetch();

    if (!$slot) {
        errorResponse('Slot non trouvé', 404);
    }

    // Vérifier permissions
    if (!canAccessPLVProject($currentUser['id'], $slot['space_id'], $slot['zone_id'])) {
        errorResponse('Accès non autorisé', 403);
    }

    // Construire le chemin de destination
    $folderName = 'plvid' . str_pad($slot['project_id'], 6, '0', STR_PAD_LEFT);
    $filename = 'template_' . $slot['format'] . $slot['slot_number'] . '.png';
    $basePath = dirname(dirname(__DIR__)) . '/plv/';
    $destPath = $basePath . $folderName . '/' . $filename;

    // Vérifier que le dossier existe
    $folderPath = $basePath . $folderName . '/';
    if (!file_exists($folderPath)) {
        mkdir($folderPath, 0755, true);
    }

    // Avertissement si slot transparent mais image JPG (pas de canal alpha)
    $warning = null;
    if ($slot['is_transparent'] && $mimeType === 'image/jpeg') {
        $warning = 'Attention: Ce slot est marqué transparent mais le fichier JPG ne supporte pas la transparence.';
    }

    // Déplacer le fichier (écrase l'existant)
    if (!move_uploaded_file($file['tmp_name'], $destPath)) {
        errorResponse('Erreur lors de l\'enregistrement du fichier', 500);
    }

    // Mettre à jour le slot
    $stmt = $db->prepare("
        UPDATE plv_slots 
        SET is_uploaded = 1, last_upload_at = NOW(), uploaded_by = :user_id
        WHERE id = :id
    ");
    $stmt->execute([
        ':user_id' => $currentUser['id'],
        ':id' => $slotId
    ]);

    // Logger l'action
    logActivity($currentUser['id'], 'plv_image_uploaded', 'plv_slots', $slotId, [
        'project_id' => $slot['project_id'],
        'filename' => $filename,
        'size' => $file['size'],
        'mime_type' => $mimeType
    ]);

    $response = [
        'message' => 'Image uploadée avec succès',
        'filename' => $filename,
        'image_url' => 'https://compagnon.atlantis-city.com/plv/' . $folderName . '/' . $filename . '?v=' . time()
    ];

    if ($warning) {
        $response['warning'] = $warning;
    }

    successResponse($response);

} catch (PDOException $e) {
    error_log("Erreur plv/upload: " . $e->getMessage());
    errorResponse('Erreur serveur', 500);
}