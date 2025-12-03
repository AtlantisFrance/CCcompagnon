<?php
/**
 * ============================================
 * 💾 API - SAUVEGARDE POPUP
 * ============================================
 * 
 * POST /api/popups/save.php
 * 
 * Body JSON:
 * {
 *   "space_slug": "mon-espace",
 *   "object_name": "c1_obj",
 *   "template_type": "contact",
 *   "template_config": {...},
 *   "html_content": "<div>...</div>",
 *   "auth_token": "xxx"  // Token auth (workaround OVH)
 * }
 */

require_once __DIR__ . '/../config/init.php';

// Uniquement POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    errorResponse('Méthode non autorisée', 405);
}

// Récupérer les données
$data = getPostData();

// Champs requis
$spaceSlug = getRequired($data, 'space_slug');
$objectName = getRequired($data, 'object_name');
$htmlContent = getOptional($data, 'html_content', '');
$templateType = getOptional($data, 'template_type');
$templateConfig = getOptional($data, 'template_config');

// ============================================
// 🔐 AUTHENTIFICATION (workaround OVH)
// ============================================

// Essayer de récupérer le token depuis plusieurs sources
$token = null;

// 1. Token dans le body POST (prioritaire pour OVH)
if (!empty($data['auth_token'])) {
    $token = $data['auth_token'];
}

// 2. Header Authorization (si pas bloqué)
if (!$token) {
    $token = getAuthToken();
}

// 3. Cookie
if (!$token && isset($_COOKIE['atlantis_token'])) {
    $token = $_COOKIE['atlantis_token'];
}

if (!$token) {
    errorResponse('Token d\'authentification requis', 401);
}

// Valider le token
$user = validateToken($token);

if (!$user) {
    errorResponse('Session invalide ou expirée', 401);
}

try {
    $db = getDB();
    
    // ============================================
    // 📍 RÉCUPÉRER L'ESPACE
    // ============================================
    
    $stmt = $db->prepare("SELECT id, name FROM spaces WHERE slug = :slug AND is_active = 1");
    $stmt->execute([':slug' => $spaceSlug]);
    $space = $stmt->fetch();
    
    if (!$space) {
        errorResponse('Espace non trouvé ou inactif', 404);
    }
    
    $spaceId = $space['id'];
    
    // ============================================
    // 🔐 VÉRIFICATION DES PERMISSIONS
    // ============================================
    
    $hasPermission = false;
    
    // Super admin = accès total
    if ($user['global_role'] === 'super_admin') {
        $hasPermission = true;
    }
    
    // Sinon vérifier les rôles dans l'espace
    if (!$hasPermission) {
        $stmt = $db->prepare("
            SELECT role, zone_id 
            FROM user_space_roles 
            WHERE user_id = :user_id AND space_id = :space_id
        ");
        $stmt->execute([':user_id' => $user['id'], ':space_id' => $spaceId]);
        $roles = $stmt->fetchAll();
        
        foreach ($roles as $role) {
            // Space admin = accès à tout l'espace
            if ($role['role'] === 'space_admin' && $role['zone_id'] === null) {
                $hasPermission = true;
                break;
            }
            
            // Zone admin = accès à sa zone (on vérifie si l'objet appartient à cette zone)
            if ($role['role'] === 'zone_admin' && $role['zone_id'] !== null) {
                // Pour l'instant on autorise les zone_admin à modifier dans leur espace
                // Une vérification plus fine nécessiterait de connaître la zone de l'objet
                $hasPermission = true;
                break;
            }
        }
    }
    
    if (!$hasPermission) {
        errorResponse('Permission insuffisante pour modifier ce contenu', 403);
    }
    
    // ============================================
    // 💾 SAUVEGARDE
    // ============================================
    
    // Vérifier si le popup existe déjà
    $stmt = $db->prepare("
        SELECT id FROM popup_contents 
        WHERE space_id = :space_id AND object_name = :object_name
    ");
    $stmt->execute([':space_id' => $spaceId, ':object_name' => $objectName]);
    $existing = $stmt->fetch();
    
    // Préparer le JSON de la config
    $templateConfigJson = null;
    if ($templateConfig) {
        $templateConfigJson = is_string($templateConfig) ? $templateConfig : json_encode($templateConfig);
    }
    
    if ($existing) {
        // UPDATE
        $stmt = $db->prepare("
            UPDATE popup_contents 
            SET html_content = :html_content,
                template_type = :template_type,
                template_config = :template_config,
                updated_by = :updated_by,
                updated_at = NOW()
            WHERE id = :id
        ");
        $stmt->execute([
            ':html_content' => $htmlContent,
            ':template_type' => $templateType,
            ':template_config' => $templateConfigJson,
            ':updated_by' => $user['id'],
            ':id' => $existing['id']
        ]);
        
        $popupId = $existing['id'];
        $action = 'updated';
    } else {
        // INSERT
        $stmt = $db->prepare("
            INSERT INTO popup_contents (space_id, object_name, html_content, template_type, template_config, updated_by, created_at, updated_at)
            VALUES (:space_id, :object_name, :html_content, :template_type, :template_config, :updated_by, NOW(), NOW())
        ");
        $stmt->execute([
            ':space_id' => $spaceId,
            ':object_name' => $objectName,
            ':html_content' => $htmlContent,
            ':template_type' => $templateType,
            ':template_config' => $templateConfigJson,
            ':updated_by' => $user['id']
        ]);
        
        $popupId = $db->lastInsertId();
        $action = 'created';
    }
    
    // Logger l'activité
    logActivity($user['id'], 'popup_' . $action, 'popup_contents', $popupId, [
        'space_slug' => $spaceSlug,
        'object_name' => $objectName,
        'template_type' => $templateType
    ]);
    
    successResponse([
        'popup_id' => (int)$popupId,
        'action' => $action,
        'object_name' => $objectName
    ], 'Popup sauvegardé');
    
} catch (PDOException $e) {
    error_log("Erreur popups/save: " . $e->getMessage());
    errorResponse('Erreur serveur: ' . $e->getMessage(), 500);
}