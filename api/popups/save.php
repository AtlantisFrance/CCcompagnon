<?php
/**
 * ============================================
 * 📝 POPUP - SAVE CONTENT
 * ============================================
 * 
 * POST /api/popups/save.php
 * 
 * Body JSON:
 * {
 *   "space_slug": "showroom-demo",
 *   "zone_slug": "zone1",        // optionnel
 *   "object_name": "c1_obj",
 *   "shader_name": "c1_shdr",    // optionnel
 *   "format": "carre",           // optionnel
 *   "html_content": "<div>...</div>"
 * }
 * 
 * Permissions: super_admin, space_admin, zone_admin (si zone_slug fourni)
 */

require_once __DIR__ . '/../config/init.php';

// Vérifier la méthode
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    errorResponse('Méthode non autorisée', 405);
}

// Récupérer le token (multi-méthodes pour OVH)
$token = getAuthToken();

// Fallback POST body (OVH bloque Authorization header)
$data = getPostData();
if (!$token && isset($data['auth_token']) && !empty($data['auth_token'])) {
    $token = trim($data['auth_token']);
}

// Vérifier l'authentification
if (!$token) {
    errorResponse('Authentification requise', 401);
}

$user = validateToken($token);
if (!$user) {
    errorResponse('Session invalide ou expirée', 401);
}

// Récupérer les données
$spaceSlug = isset($data['space_slug']) ? trim($data['space_slug']) : '';
$zoneSlug = isset($data['zone_slug']) ? trim($data['zone_slug']) : null;
$objectName = isset($data['object_name']) ? trim($data['object_name']) : '';
$shaderName = isset($data['shader_name']) ? trim($data['shader_name']) : null;
$format = isset($data['format']) ? trim($data['format']) : 'carre';
$htmlContent = isset($data['html_content']) ? $data['html_content'] : '';

// Validation des champs requis
if (empty($spaceSlug) || empty($objectName)) {
    errorResponse('Paramètres space_slug et object_name requis', 400);
}

// Validation des formats
if (!preg_match('/^[a-z0-9_-]+$/', $spaceSlug)) {
    errorResponse('Format space_slug invalide', 400);
}

if (!preg_match('/^[a-z0-9_]+$/', $objectName)) {
    errorResponse('Format object_name invalide', 400);
}

if ($zoneSlug && !preg_match('/^[a-z0-9_-]+$/', $zoneSlug)) {
    errorResponse('Format zone_slug invalide', 400);
}

if (!in_array($format, ['carre', 'paysage', 'portrait'])) {
    $format = 'carre';
}

// Générer shader_name si non fourni
if (empty($shaderName)) {
    $shaderName = str_replace('_obj', '_shdr', $objectName);
}

try {
    $db = getDB();

    // Récupérer l'espace
    $stmt = $db->prepare("SELECT id, name FROM spaces WHERE slug = :slug AND is_active = 1");
    $stmt->execute([':slug' => $spaceSlug]);
    $space = $stmt->fetch();

    if (!$space) {
        errorResponse('Espace non trouvé', 404);
    }

    $spaceId = $space['id'];
    $zoneId = null;

    // Récupérer la zone si fournie
    if ($zoneSlug) {
        $stmt = $db->prepare("SELECT id, name FROM zones WHERE space_id = :space_id AND slug = :slug AND is_active = 1");
        $stmt->execute([':space_id' => $spaceId, ':slug' => $zoneSlug]);
        $zone = $stmt->fetch();

        if (!$zone) {
            errorResponse('Zone non trouvée', 404);
        }
        $zoneId = $zone['id'];
    }

    // Vérifier les permissions
    $userRole = getUserSpaceRole($user['id'], $spaceId, $zoneId);

    if (!$userRole) {
        errorResponse('Vous n\'avez pas accès à cet espace', 403);
    }

    // Vérifier que le rôle permet la modification
    $canEdit = in_array($userRole, ['super_admin', 'space_admin', 'zone_admin']);
    
    if (!$canEdit) {
        errorResponse('Permission insuffisante pour modifier le contenu', 403);
    }

    // Vérifier si le contenu existe déjà
    $stmt = $db->prepare("
        SELECT id FROM popup_contents 
        WHERE space_id = :space_id AND object_name = :object_name
    ");
    $stmt->execute([
        ':space_id' => $spaceId,
        ':object_name' => $objectName
    ]);
    $existing = $stmt->fetch();

    if ($existing) {
        // UPDATE
        $stmt = $db->prepare("
            UPDATE popup_contents 
            SET html_content = :html_content,
                zone_id = :zone_id,
                shader_name = :shader_name,
                format = :format,
                updated_by = :updated_by,
                updated_at = NOW()
            WHERE id = :id
        ");
        $stmt->execute([
            ':id' => $existing['id'],
            ':html_content' => $htmlContent,
            ':zone_id' => $zoneId,
            ':shader_name' => $shaderName,
            ':format' => $format,
            ':updated_by' => $user['id']
        ]);

        $popupId = $existing['id'];
        $action = 'popup_updated';

    } else {
        // INSERT
        $stmt = $db->prepare("
            INSERT INTO popup_contents 
            (space_id, zone_id, object_name, shader_name, format, html_content, is_active, updated_by)
            VALUES 
            (:space_id, :zone_id, :object_name, :shader_name, :format, :html_content, 1, :updated_by)
        ");
        $stmt->execute([
            ':space_id' => $spaceId,
            ':zone_id' => $zoneId,
            ':object_name' => $objectName,
            ':shader_name' => $shaderName,
            ':format' => $format,
            ':html_content' => $htmlContent,
            ':updated_by' => $user['id']
        ]);

        $popupId = $db->lastInsertId();
        $action = 'popup_created';
    }

    // Logger l'action
    logActivity($user['id'], $action, 'popup_contents', $popupId, [
        'space' => $space['name'],
        'zone' => $zoneSlug,
        'object_name' => $objectName,
        'content_length' => strlen($htmlContent)
    ]);

    successResponse([
        'id' => (int)$popupId,
        'object_name' => $objectName,
        'action' => $action
    ], $action === 'popup_created' ? 'Contenu créé' : 'Contenu mis à jour');

} catch (PDOException $e) {
    error_log("Erreur popups/save: " . $e->getMessage());
    errorResponse('Erreur serveur', 500);
}