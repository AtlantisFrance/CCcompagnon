<?php
/**
 * ============================================
 * 🚀 INITIALISATION API ATLANTIS
 * ============================================
 * 
 * Fichier: /api/config/init.php
 * À inclure au début de chaque script API
 */

// Définir la constante de sécurité
define('ATLANTIS_API', true);

// Démarrer la session
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

// Charger la configuration
require_once __DIR__ . '/database.php';

// ============================================
// 🌐 GESTION CORS
// ============================================

function handleCORS() {
    $origin = $_SERVER['HTTP_ORIGIN'] ?? '';
    
    // Vérifier si l'origine est autorisée
    if (in_array($origin, ALLOWED_ORIGINS)) {
        header("Access-Control-Allow-Origin: $origin");
    } else {
        // En développement, autoriser toutes les origines (à retirer en production)
        header("Access-Control-Allow-Origin: *");
    }
    
    header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
    header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
    header("Access-Control-Allow-Credentials: true");
    header("Access-Control-Max-Age: 86400");
    
    // Gérer les requêtes OPTIONS (preflight)
    if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
        http_response_code(200);
        exit;
    }
}

// Appliquer CORS
handleCORS();

// ============================================
// 📨 RÉCUPÉRATION DES DONNÉES
// ============================================

/**
 * Récupérer les données POST (JSON ou form-data)
 */
function getPostData() {
    $contentType = $_SERVER['CONTENT_TYPE'] ?? '';
    
    if (strpos($contentType, 'application/json') !== false) {
        $json = file_get_contents('php://input');
        $data = json_decode($json, true);
        return $data ?: [];
    }
    
    return $_POST;
}

/**
 * Récupérer un champ obligatoire
 */
function getRequired($data, $field) {
    if (!isset($data[$field]) || trim($data[$field]) === '') {
        errorResponse("Le champ '$field' est obligatoire", 400);
    }
    return trim($data[$field]);
}

/**
 * Récupérer un champ optionnel
 */
function getOptional($data, $field, $default = null) {
    if (!isset($data[$field]) || trim($data[$field]) === '') {
        return $default;
    }
    return trim($data[$field]);
}

// ============================================
// 🔐 GESTION DE L'AUTHENTIFICATION
// ============================================

/**
 * Créer une session utilisateur
 */
function createSession($userId) {
    $db = getDB();
    $token = generateToken(64);
    $expiresAt = date('Y-m-d H:i:s', time() + JWT_EXPIRY);
    
    // Supprimer les anciennes sessions expirées de cet utilisateur
    $stmt = $db->prepare("DELETE FROM user_sessions WHERE user_id = :user_id AND expires_at < NOW()");
    $stmt->execute([':user_id' => $userId]);
    
    // Créer la nouvelle session
    $stmt = $db->prepare("
        INSERT INTO user_sessions (user_id, token, ip_address, user_agent, expires_at)
        VALUES (:user_id, :token, :ip, :user_agent, :expires_at)
    ");
    $stmt->execute([
        ':user_id' => $userId,
        ':token' => $token,
        ':ip' => getClientIP(),
        ':user_agent' => substr($_SERVER['HTTP_USER_AGENT'] ?? '', 0, 500),
        ':expires_at' => $expiresAt
    ]);
    
    return $token;
}

/**
 * Valider un token et récupérer l'utilisateur
 */
function validateToken($token) {
    if (empty($token)) {
        return null;
    }
    
    $db = getDB();
    $stmt = $db->prepare("
        SELECT s.*, u.*
        FROM user_sessions s
        JOIN users u ON s.user_id = u.id
        WHERE s.token = :token 
        AND s.expires_at > NOW()
        AND s.is_active = 1
        AND u.status = 'active'
    ");
    $stmt->execute([':token' => $token]);
    $result = $stmt->fetch();
    
    if ($result) {
        // Mettre à jour last_activity
        $updateStmt = $db->prepare("UPDATE user_sessions SET last_activity = NOW() WHERE token = :token");
        $updateStmt->execute([':token' => $token]);
        
        // Retirer les infos sensibles
        unset($result['password_hash']);
        unset($result['token']);
        unset($result['email_verification_token']);
        unset($result['password_reset_token']);
        
        return $result;
    }
    
    return null;
}

/**
 * Récupérer le token depuis les headers ou cookies
 */
function getAuthToken() {
    // Vérifier le header Authorization
    $headers = getallheaders();
    $authHeader = $headers['Authorization'] ?? $headers['authorization'] ?? '';
    
    if (preg_match('/Bearer\s+(.+)$/i', $authHeader, $matches)) {
        return $matches[1];
    }
    
    // Vérifier le cookie
    if (isset($_COOKIE['atlantis_token'])) {
        return $_COOKIE['atlantis_token'];
    }
    
    // Vérifier le paramètre GET (pour certains cas)
    if (isset($_GET['token'])) {
        return $_GET['token'];
    }
    
    return null;
}

/**
 * Exiger une authentification
 */
function requireAuth() {
    $token = getAuthToken();
    $user = validateToken($token);
    
    if (!$user) {
        errorResponse('Non authentifié', 401);
    }
    
    return $user;
}

/**
 * Exiger un rôle global minimum
 */
function requireGlobalRole($requiredRole) {
    $user = requireAuth();
    
    $roleHierarchy = ['user' => 1, 'super_admin' => 2];
    
    $userLevel = $roleHierarchy[$user['global_role']] ?? 0;
    $requiredLevel = $roleHierarchy[$requiredRole] ?? 99;
    
    if ($userLevel < $requiredLevel) {
        errorResponse('Permission insuffisante', 403);
    }
    
    return $user;
}

/**
 * Vérifier si l'utilisateur a un rôle dans un espace
 */
function getUserSpaceRole($userId, $spaceId, $zoneId = null) {
    $db = getDB();
    
    // D'abord vérifier si super_admin (accès à tout)
    $stmt = $db->prepare("SELECT global_role FROM users WHERE id = :id");
    $stmt->execute([':id' => $userId]);
    $user = $stmt->fetch();
    
    if ($user && $user['global_role'] === 'super_admin') {
        return 'super_admin';
    }
    
    // Vérifier le rôle space_admin (accès à tout l'espace)
    $stmt = $db->prepare("
        SELECT role FROM user_space_roles 
        WHERE user_id = :user_id AND space_id = :space_id AND zone_id IS NULL
    ");
    $stmt->execute([':user_id' => $userId, ':space_id' => $spaceId]);
    $spaceRole = $stmt->fetch();
    
    if ($spaceRole && $spaceRole['role'] === 'space_admin') {
        return 'space_admin';
    }
    
    // Vérifier le rôle zone spécifique
    if ($zoneId) {
        $stmt = $db->prepare("
            SELECT role FROM user_space_roles 
            WHERE user_id = :user_id AND space_id = :space_id AND zone_id = :zone_id
        ");
        $stmt->execute([':user_id' => $userId, ':space_id' => $spaceId, ':zone_id' => $zoneId]);
        $zoneRole = $stmt->fetch();
        
        if ($zoneRole) {
            return $zoneRole['role'];
        }
    }
    
    return null;
}

/**
 * Exiger un rôle dans un espace/zone
 */
function requireSpaceRole($spaceId, $requiredRole, $zoneId = null) {
    $user = requireAuth();
    
    $role = getUserSpaceRole($user['id'], $spaceId, $zoneId);
    
    if (!$role) {
        errorResponse('Accès non autorisé à cet espace', 403);
    }
    
    $roleHierarchy = ['viewer' => 1, 'zone_admin' => 2, 'space_admin' => 3, 'super_admin' => 4];
    
    $userLevel = $roleHierarchy[$role] ?? 0;
    $requiredLevel = $roleHierarchy[$requiredRole] ?? 99;
    
    if ($userLevel < $requiredLevel) {
        errorResponse('Permission insuffisante pour cette action', 403);
    }
    
    return $user;
}

// ============================================
// 📧 VALIDATION EMAIL
// ============================================

/**
 * Valider le format d'un email
 */
function isValidEmail($email) {
    return filter_var($email, FILTER_VALIDATE_EMAIL) !== false;
}

/**
 * Valider la force d'un mot de passe
 */
function isValidPassword($password) {
    // Minimum 8 caractères
    if (strlen($password) < 8) {
        return false;
    }
    return true;
}