<?php
/**
 * ============================================
 * 💾 API - SAUVEGARDE POPUP (v2 - Simplifié)
 * ============================================
 */

// Activer les erreurs pour debug
error_reporting(E_ALL);
ini_set('display_errors', 0);
ini_set('log_errors', 1);

// Headers CORS
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

// OPTIONS preflight
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Uniquement POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'error' => 'Méthode non autorisée']);
    exit;
}

// Charger config
define('ATLANTIS_API', true);

try {
    require_once __DIR__ . '/../config/database.php';
    require_once __DIR__ . '/../config/init.php';
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Erreur config: ' . $e->getMessage()]);
    exit;
}

// Récupérer les données POST
$rawInput = file_get_contents('php://input');
$data = json_decode($rawInput, true);

if (!$data) {
    errorResponse('Données JSON invalides', 400);
}

// Champs requis
if (empty($data['space_slug'])) {
    errorResponse('space_slug requis', 400);
}
if (empty($data['object_name'])) {
    errorResponse('object_name requis', 400);
}

$spaceSlug = trim($data['space_slug']);
$objectName = trim($data['object_name']);
$htmlContent = $data['html_content'] ?? '';
$templateType = $data['template_type'] ?? null;
$templateConfig = $data['template_config'] ?? null;

// ============================================
// 🔐 AUTH (simplifié pour OVH)
// ============================================

$token = null;

// 1. Token dans body
if (!empty($data['auth_token'])) {
    $token = $data['auth_token'];
}

// 2. Cookie
if (!$token && !empty($_COOKIE['atlantis_token'])) {
    $token = $_COOKIE['atlantis_token'];
}

// 3. Header (probablement bloqué par OVH)
if (!$token) {
    $headers = getallheaders();
    $authHeader = $headers['Authorization'] ?? $headers['authorization'] ?? '';
    if (preg_match('/Bearer\s+(.+)$/i', $authHeader, $matches)) {
        $token = $matches[1];
    }
}

if (!$token) {
    errorResponse('Token requis', 401);
}

// Valider token
$user = validateToken($token);
if (!$user) {
    errorResponse('Session invalide', 401);
}

// ============================================
// 💾 SAUVEGARDE
// ============================================

try {
    $db = getDB();
    
    // Récupérer l'espace
    $stmt = $db->prepare("SELECT id FROM spaces WHERE slug = :slug AND is_active = 1");
    $stmt->execute([':slug' => $spaceSlug]);
    $space = $stmt->fetch();
    
    if (!$space) {
        errorResponse('Espace non trouvé: ' . $spaceSlug, 404);
    }
    
    $spaceId = (int)$space['id'];
    
    // Vérifier permissions (super_admin ou rôle dans l'espace)
    $hasPermission = ($user['global_role'] === 'super_admin');
    
    if (!$hasPermission) {
        $stmt = $db->prepare("SELECT role FROM user_space_roles WHERE user_id = :uid AND space_id = :sid");
        $stmt->execute([':uid' => $user['id'], ':sid' => $spaceId]);
        $role = $stmt->fetch();
        $hasPermission = ($role && in_array($role['role'], ['space_admin', 'zone_admin']));
    }
    
    if (!$hasPermission) {
        errorResponse('Permission insuffisante', 403);
    }
    
    // Préparer template_config JSON
    $configJson = null;
    if ($templateConfig !== null) {
        $configJson = is_string($templateConfig) ? $templateConfig : json_encode($templateConfig);
    }
    
    // Vérifier si popup existe
    $stmt = $db->prepare("SELECT id FROM popup_contents WHERE space_id = :sid AND object_name = :obj");
    $stmt->execute([':sid' => $spaceId, ':obj' => $objectName]);
    $existing = $stmt->fetch();
    
    if ($existing) {
        // UPDATE
        $stmt = $db->prepare("
            UPDATE popup_contents SET
                html_content = :html,
                template_type = :ttype,
                template_config = :tconfig,
                updated_by = :uid,
                updated_at = NOW()
            WHERE id = :id
        ");
        $stmt->execute([
            ':html' => $htmlContent,
            ':ttype' => $templateType,
            ':tconfig' => $configJson,
            ':uid' => $user['id'],
            ':id' => $existing['id']
        ]);
        
        $popupId = (int)$existing['id'];
        $action = 'updated';
        
    } else {
        // INSERT
        $stmt = $db->prepare("
            INSERT INTO popup_contents 
                (space_id, object_name, html_content, template_type, template_config, is_active, updated_by, created_at, updated_at)
            VALUES 
                (:sid, :obj, :html, :ttype, :tconfig, 1, :uid, NOW(), NOW())
        ");
        $stmt->execute([
            ':sid' => $spaceId,
            ':obj' => $objectName,
            ':html' => $htmlContent,
            ':ttype' => $templateType,
            ':tconfig' => $configJson,
            ':uid' => $user['id']
        ]);
        
        $popupId = (int)$db->lastInsertId();
        $action = 'created';
    }
    
    // Log activité
    logActivity($user['id'], 'popup_' . $action, 'popup_contents', $popupId, [
        'space_slug' => $spaceSlug,
        'object_name' => $objectName,
        'template_type' => $templateType
    ]);
    
    // Succès
    echo json_encode([
        'success' => true,
        'message' => 'Popup sauvegardé',
        'data' => [
            'popup_id' => $popupId,
            'action' => $action,
            'object_name' => $objectName
        ]
    ]);
    
} catch (PDOException $e) {
    error_log("Save popup PDO error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'success' => false, 
        'error' => 'Erreur BDD: ' . $e->getMessage()
    ]);
}