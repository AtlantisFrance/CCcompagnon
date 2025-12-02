<?php
/**
 * ============================================
 * 📤 PLV UPLOAD - ATLANTIS CITY
 * ============================================
 * 
 * POST /api/plv/upload.php
 * Content-Type: multipart/form-data
 * 
 * Params:
 *   - space_slug (string) : slug de l'espace
 *   - zone_slug (string|null) : slug de la zone (optionnel)
 *   - shader_name (string) : nom du shader (ex: c1_shdr)
 *   - image (file) : fichier PNG < 5 Mo
 */

require_once __DIR__ . '/../config/init.php';

// Uniquement POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    errorResponse('Méthode non autorisée', 405);
}

// ============================================
// 🔐 AUTHENTIFICATION
// ============================================
$token = getAuthToken();
if (!$token) {
    errorResponse('Token manquant', 401);
}

$user = validateToken($token);
if (!$user) {
    errorResponse('Session invalide ou expirée', 401);
}

// ============================================
// 📥 RÉCUPÉRATION DES PARAMÈTRES
// ============================================
$spaceSlug = isset($_POST['space_slug']) ? trim($_POST['space_slug']) : '';
$zoneSlug = isset($_POST['zone_slug']) ? trim($_POST['zone_slug']) : null;
$shaderName = isset($_POST['shader_name']) ? trim($_POST['shader_name']) : '';

// Zone slug vide = null
if (empty($zoneSlug)) {
    $zoneSlug = null;
}

// Validation paramètres
if (empty($spaceSlug)) {
    errorResponse('space_slug requis', 400);
}

if (empty($shaderName)) {
    errorResponse('shader_name requis', 400);
}

// Validation format shader (ex: c1_shdr, l1_shdr, p1_shdr)
if (!preg_match('/^[clp]\d+_shdr$/', $shaderName)) {
    errorResponse('Format shader_name invalide (attendu: c1_shdr, l1_shdr, p1_shdr...)', 400);
}

// ============================================
// 🔒 VÉRIFICATION DES PERMISSIONS
// ============================================
function canUploadPLV($user, $spaceSlug, $zoneSlug) {
    // Super admin = accès total
    if ($user['global_role'] === 'super_admin') {
        return true;
    }
    
    // Récupérer les rôles de l'utilisateur
    $db = getDB();
    $stmt = $db->prepare("
        SELECT usr.role, s.slug as space_slug, z.slug as zone_slug
        FROM user_space_roles usr
        JOIN spaces s ON s.id = usr.space_id
        LEFT JOIN zones z ON z.id = usr.zone_id
        WHERE usr.user_id = :user_id
    ");
    $stmt->execute([':user_id' => $user['id']]);
    $roles = $stmt->fetchAll();
    
    foreach ($roles as $role) {
        // Space admin de cet espace = accès à tout l'espace
        if ($role['space_slug'] === $spaceSlug && $role['role'] === 'space_admin') {
            return true;
        }
        
        // Zone admin de cette zone spécifique
        if ($role['space_slug'] === $spaceSlug && 
            $role['zone_slug'] === $zoneSlug && 
            $role['role'] === 'zone_admin' &&
            !empty($zoneSlug)) {
            return true;
        }
    }
    
    return false;
}

if (!canUploadPLV($user, $spaceSlug, $zoneSlug)) {
    errorResponse('Permission refusée pour cet espace/zone', 403);
}

// ============================================
// 📁 VÉRIFICATION DU FICHIER
// ============================================
if (!isset($_FILES['image']) || $_FILES['image']['error'] !== UPLOAD_ERR_OK) {
    $uploadErrors = [
        UPLOAD_ERR_INI_SIZE => 'Fichier trop volumineux (limite serveur)',
        UPLOAD_ERR_FORM_SIZE => 'Fichier trop volumineux (limite formulaire)',
        UPLOAD_ERR_PARTIAL => 'Fichier partiellement uploadé',
        UPLOAD_ERR_NO_FILE => 'Aucun fichier envoyé',
        UPLOAD_ERR_NO_TMP_DIR => 'Dossier temporaire manquant',
        UPLOAD_ERR_CANT_WRITE => 'Erreur d\'écriture disque',
        UPLOAD_ERR_EXTENSION => 'Extension PHP a bloqué l\'upload'
    ];
    
    $errorCode = $_FILES['image']['error'] ?? UPLOAD_ERR_NO_FILE;
    $errorMsg = $uploadErrors[$errorCode] ?? 'Erreur upload inconnue';
    errorResponse($errorMsg, 400);
}

$file = $_FILES['image'];
$originalName = $file['name'];
$tmpPath = $file['tmp_name'];
$fileSize = $file['size'];

// Vérifier la taille (5 Mo max)
$maxSize = 5 * 1024 * 1024; // 5 Mo
if ($fileSize > $maxSize) {
    errorResponse('Fichier trop volumineux (max 5 Mo)', 400);
}

// Vérifier le type MIME
$finfo = new finfo(FILEINFO_MIME_TYPE);
$mimeType = $finfo->file($tmpPath);

if ($mimeType !== 'image/png') {
    errorResponse('Seuls les fichiers PNG sont autorisés (reçu: ' . $mimeType . ')', 400);
}

// Vérifier l'extension
$extension = strtolower(pathinfo($originalName, PATHINFO_EXTENSION));
if ($extension !== 'png') {
    errorResponse('Extension invalide (attendu: .png)', 400);
}

// ============================================
// 📝 GÉNÉRATION DU NOM DE FICHIER
// ============================================
// Extraire préfixe et numéro du shader: c1_shdr → C1, l2_shdr → L2
preg_match('/^([clp])(\d+)_shdr$/', $shaderName, $matches);
$prefix = strtoupper($matches[1]); // c → C, l → L, p → P
$number = $matches[2];
$targetFileName = "template_{$prefix}{$number}.png";

// ============================================
// 📂 CRÉATION DU DOSSIER SI NÉCESSAIRE
// ============================================
$uploadDir = dirname(dirname(__DIR__)) . '/plv/' . $spaceSlug;

// Sécurité : valider le slug (pas de path traversal)
if (!preg_match('/^[a-z0-9_-]+$/', $spaceSlug)) {
    errorResponse('space_slug invalide', 400);
}

if (!is_dir($uploadDir)) {
    if (!mkdir($uploadDir, 0755, true)) {
        errorResponse('Impossible de créer le dossier de destination', 500);
    }
}

// ============================================
// 💾 SAUVEGARDE DU FICHIER
// ============================================
$targetPath = $uploadDir . '/' . $targetFileName;

// Supprimer l'ancien fichier s'il existe
if (file_exists($targetPath)) {
    unlink($targetPath);
}

// Déplacer le fichier uploadé
if (!move_uploaded_file($tmpPath, $targetPath)) {
    errorResponse('Erreur lors de la sauvegarde du fichier', 500);
}

// ============================================
// 📊 LOG DANS LA BASE DE DONNÉES
// ============================================
try {
    $db = getDB();
    $stmt = $db->prepare("
        INSERT INTO plv_upload_logs 
        (user_id, space_slug, zone_slug, shader_name, file_name, original_name, file_size, ip_address)
        VALUES 
        (:user_id, :space_slug, :zone_slug, :shader_name, :file_name, :original_name, :file_size, :ip_address)
    ");
    $stmt->execute([
        ':user_id' => $user['id'],
        ':space_slug' => $spaceSlug,
        ':zone_slug' => $zoneSlug,
        ':shader_name' => $shaderName,
        ':file_name' => $targetFileName,
        ':original_name' => $originalName,
        ':file_size' => $fileSize,
        ':ip_address' => getClientIP()
    ]);
    
    // Log dans activity_logs aussi
    logActivity($user['id'], 'plv_upload', 'plv', null, [
        'space_slug' => $spaceSlug,
        'zone_slug' => $zoneSlug,
        'shader_name' => $shaderName,
        'file_name' => $targetFileName
    ]);
    
} catch (PDOException $e) {
    error_log("Erreur log upload PLV: " . $e->getMessage());
    // On ne fait pas échouer l'upload pour un problème de log
}

// ============================================
// ✅ RÉPONSE SUCCÈS
// ============================================
successResponse([
    'file_name' => $targetFileName,
    'shader_name' => $shaderName,
    'space_slug' => $spaceSlug,
    'file_size' => $fileSize,
    'url' => "https://compagnon.atlantis-city.com/plv/{$spaceSlug}/{$targetFileName}?v=" . time()
], 'Image uploadée avec succès');