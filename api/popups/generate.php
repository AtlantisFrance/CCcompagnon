<?php
/**
 * ============================================
 * 📝 POPUPS - GÉNÉRATION FICHIERS JS/CSS
 * ============================================
 * 
 * POST /api/popups/generate.php
 * 
 * Génère les fichiers popup_xxx.js et popup_xxx.css
 * dans /script/{space_slug}/
 */

require_once __DIR__ . '/../config/init.php';

// Vérifier la méthode
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    errorResponse('Méthode non autorisée', 405);
}

// Récupérer les données
$data = getPostData();

// Auth via POST body (workaround OVH)
$token = $data['auth_token'] ?? getAuthToken();
$user = validateToken($token);

if (!$user) {
    errorResponse('Non authentifié', 401);
}

// Validation des champs obligatoires
$spaceSlug = getRequired($data, 'space_slug');
$objectName = getRequired($data, 'object_name');
$templateType = getRequired($data, 'template_type');
$templateConfig = $data['template_config'] ?? [];
$jsContent = getRequired($data, 'js_content');
$cssContent = getRequired($data, 'css_content');

// Valider le space_slug (sécurité)
if (!preg_match('/^[a-z0-9_-]+$/', $spaceSlug)) {
    errorResponse('space_slug invalide', 400);
}

// Valider l'object_name (sécurité)
if (!preg_match('/^[a-z0-9_-]+$/', $objectName)) {
    errorResponse('object_name invalide', 400);
}

// Nettoyer object_name (retirer _obj si présent pour le nom de fichier)
$cleanName = preg_replace('/_obj$/', '', $objectName);

try {
    $db = getDB();
    
    // Vérifier que l'espace existe
    $stmt = $db->prepare("SELECT id FROM spaces WHERE slug = :slug");
    $stmt->execute([':slug' => $spaceSlug]);
    $space = $stmt->fetch();
    
    if (!$space) {
        errorResponse('Espace non trouvé', 404);
    }
    
    $spaceId = $space['id'];
    
    // Vérifier les permissions (super_admin ou space_admin ou zone_admin)
    $role = getUserSpaceRole($user['id'], $spaceId);
    if (!$role || !in_array($role, ['super_admin', 'space_admin', 'zone_admin'])) {
        errorResponse('Permission insuffisante', 403);
    }
    
    // === CRÉER LE DOSSIER SI NÉCESSAIRE ===
    $scriptDir = $_SERVER['DOCUMENT_ROOT'] . '/script/' . $spaceSlug;
    
    if (!is_dir($scriptDir)) {
        if (!mkdir($scriptDir, 0755, true)) {
            errorResponse('Impossible de créer le dossier', 500);
        }
    }
    
    // === ÉCRIRE LES FICHIERS ===
    $jsFile = $scriptDir . '/popup_' . $cleanName . '.js';
    $cssFile = $scriptDir . '/popup_' . $cleanName . '.css';
    
    // Écrire le fichier JS
    $jsWritten = file_put_contents($jsFile, $jsContent);
    if ($jsWritten === false) {
        errorResponse('Erreur écriture fichier JS', 500);
    }
    
    // Écrire le fichier CSS
    $cssWritten = file_put_contents($cssFile, $cssContent);
    if ($cssWritten === false) {
        errorResponse('Erreur écriture fichier CSS', 500);
    }
    
    // === SAUVEGARDER EN BDD (backup + historique) ===
    $stmt = $db->prepare("
        INSERT INTO popup_contents (space_id, object_name, template_type, template_config, html_content, updated_by)
        VALUES (:space_id, :object_name, :template_type, :template_config, :html_content, :updated_by)
        ON DUPLICATE KEY UPDATE
            template_type = VALUES(template_type),
            template_config = VALUES(template_config),
            html_content = VALUES(html_content),
            updated_by = VALUES(updated_by),
            updated_at = NOW()
    ");
    
    $stmt->execute([
        ':space_id' => $spaceId,
        ':object_name' => $objectName,
        ':template_type' => $templateType,
        ':template_config' => json_encode($templateConfig),
        ':html_content' => json_encode(['js' => $jsContent, 'css' => $cssContent]),
        ':updated_by' => $user['id']
    ]);
    
    // Logger l'action
    logActivity($user['id'], 'popup_generated', 'popup_contents', $spaceId, [
        'space_slug' => $spaceSlug,
        'object_name' => $objectName,
        'template_type' => $templateType
    ]);
    
    // Réponse succès
    successResponse([
        'js_path' => '/script/' . $spaceSlug . '/popup_' . $cleanName . '.js',
        'css_path' => '/script/' . $spaceSlug . '/popup_' . $cleanName . '.css',
        'js_size' => $jsWritten,
        'css_size' => $cssWritten
    ], 'Fichiers générés avec succès');
    
} catch (PDOException $e) {
    error_log("Erreur popups/generate: " . $e->getMessage());
    errorResponse('Erreur serveur', 500);
}