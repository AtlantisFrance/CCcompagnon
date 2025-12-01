<?php
/**
 * ============================================
 * 🔐 CONFIGURATION BASE DE DONNÉES ATLANTIS
 * ============================================
 * 
 * Fichier: /api/config/database.php
 * À ne JAMAIS exposer publiquement !
 */

// Empêcher l'accès direct
if (!defined('ATLANTIS_API')) {
    http_response_code(403);
    die('Accès interdit');
}

// ============================================
// 📝 CONFIGURATION À MODIFIER
// ============================================

define('DB_HOST', 'atlantetechnique.mysql.db');     // Hôte MySQL OVH
define('DB_NAME', 'atlantetechnique');               // Nom de ta base (à vérifier)
define('DB_USER', 'atlantetechnique');                // ⚠️ REMPLACE PAR TON USER
define('DB_PASS', 'xyNHBPh6AHEJ9Dv');               // ⚠️ REMPLACE PAR TON MDP
define('DB_CHARSET', 'utf8mb4');

// ============================================
// 🔑 CLÉ SECRÈTE POUR LES TOKENS
// ============================================
// Génère une clé unique : https://randomkeygen.com/
define('JWT_SECRET', 'Hc1sCpxovtqE8KLYLCz8wguCUUpbzG2zY2t0gKIqkf4GZeyC3sKnYnWFWqNzNHoa');
define('JWT_EXPIRY', 86400 * 7); // 7 jours en secondes

// ============================================
// 🌐 CONFIGURATION CORS (domaines autorisés)
// ============================================
define('ALLOWED_ORIGINS', [
    'https://atlantis-city.com',
    'https://www.atlantis-city.com',
    'https://compagnon.atlantis-city.com',
    'https://maps.atlantis-city.com',          // ✅ AJOUTÉ - Shapespark
    'https://idea-services.re',
    'http://localhost',
    'http://127.0.0.1',
]);

// ============================================
// 📧 CONFIGURATION EMAIL (pour vérification)
// ============================================
define('SMTP_ENABLED', false);  // Passer à true quand tu auras configuré SMTP
define('SMTP_HOST', 'ssl0.ovh.net');
define('SMTP_PORT', 465);
define('SMTP_USER', 'noreply@atlantis-city.com');
define('SMTP_PASS', '');
define('SMTP_FROM_NAME', 'Atlantis City');

// ============================================
// 🔧 CLASSE DE CONNEXION PDO
// ============================================

class Database {
    private static $instance = null;
    private $connection;

    private function __construct() {
        try {
            $dsn = "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=" . DB_CHARSET;
            
            $options = [
                PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES   => false,
                PDO::MYSQL_ATTR_INIT_COMMAND => "SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci"
            ];

            $this->connection = new PDO($dsn, DB_USER, DB_PASS, $options);
            
        } catch (PDOException $e) {
            // En production, ne pas afficher les détails de l'erreur
            error_log("Erreur connexion DB: " . $e->getMessage());
            http_response_code(500);
            die(json_encode([
                'success' => false,
                'error' => 'Erreur de connexion à la base de données'
            ]));
        }
    }

    public static function getInstance() {
        if (self::$instance === null) {
            self::$instance = new self();
        }
        return self::$instance;
    }

    public function getConnection() {
        return $this->connection;
    }

    // Empêcher le clonage
    private function __clone() {}

    // Empêcher la désérialisation
    public function __wakeup() {
        throw new Exception("Cannot unserialize singleton");
    }
}

// ============================================
// 🛠️ FONCTIONS UTILITAIRES
// ============================================

/**
 * Obtenir la connexion PDO
 */
function getDB() {
    return Database::getInstance()->getConnection();
}

/**
 * Générer un token sécurisé
 */
function generateToken($length = 64) {
    return bin2hex(random_bytes($length / 2));
}

/**
 * Hasher un mot de passe
 */
function hashPassword($password) {
    return password_hash($password, PASSWORD_BCRYPT, ['cost' => 12]);
}

/**
 * Vérifier un mot de passe
 */
function verifyPassword($password, $hash) {
    return password_verify($password, $hash);
}

/**
 * Réponse JSON standardisée
 */
function jsonResponse($data, $statusCode = 200) {
    http_response_code($statusCode);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode($data, JSON_UNESCAPED_UNICODE);
    exit;
}

/**
 * Réponse d'erreur
 */
function errorResponse($message, $statusCode = 400) {
    jsonResponse([
        'success' => false,
        'error' => $message
    ], $statusCode);
}

/**
 * Réponse de succès
 */
function successResponse($data = [], $message = 'OK') {
    jsonResponse([
        'success' => true,
        'message' => $message,
        'data' => $data
    ]);
}

/**
 * Logger une activité
 */
function logActivity($userId, $action, $entityType = null, $entityId = null, $details = null) {
    try {
        $db = getDB();
        $stmt = $db->prepare("
            INSERT INTO activity_logs (user_id, action, entity_type, entity_id, details, ip_address)
            VALUES (:user_id, :action, :entity_type, :entity_id, :details, :ip)
        ");
        $stmt->execute([
            ':user_id' => $userId,
            ':action' => $action,
            ':entity_type' => $entityType,
            ':entity_id' => $entityId,
            ':details' => $details ? json_encode($details) : null,
            ':ip' => $_SERVER['REMOTE_ADDR'] ?? null
        ]);
    } catch (Exception $e) {
        error_log("Erreur log activité: " . $e->getMessage());
    }
}

/**
 * Obtenir l'IP du client
 */
function getClientIP() {
    $headers = ['HTTP_CF_CONNECTING_IP', 'HTTP_X_FORWARDED_FOR', 'HTTP_X_REAL_IP', 'REMOTE_ADDR'];
    foreach ($headers as $header) {
        if (!empty($_SERVER[$header])) {
            $ip = $_SERVER[$header];
            if (strpos($ip, ',') !== false) {
                $ip = trim(explode(',', $ip)[0]);
            }
            if (filter_var($ip, FILTER_VALIDATE_IP)) {
                return $ip;
            }
        }
    }
    return 'unknown';
}