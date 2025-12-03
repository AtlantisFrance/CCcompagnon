<?php
/**
 * ============================================
 * 📋 API POPUPS - LISTE DES POPUPS
 * ============================================
 * 
 * GET /api/popups/list.php?space_slug=X
 * 
 * Retourne tous les popups d'un espace
 * Pas d'authentification requise (lecture seule)
 */

// Headers CORS
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Content-Type: application/json; charset=utf-8");

// Gérer preflight
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Uniquement GET
if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(['success' => false, 'error' => 'Méthode non autorisée']);
    exit;
}

// Paramètre requis
$spaceSlug = isset($_GET['space_slug']) ? trim($_GET['space_slug']) : '';

if (empty($spaceSlug)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Paramètre space_slug requis']);
    exit;
}

// Connexion base de données
try {
    $dbHost = 'atlantetechnique.mysql.db';
    $dbName = 'atlantetechnique';
    $dbUser = 'atlantetechnique';
    $dbPass = 'xyNHBPh6AHEJ9Dv';
    
    $pdo = new PDO(
        "mysql:host=$dbHost;dbname=$dbName;charset=utf8mb4",
        $dbUser,
        $dbPass,
        [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC
        ]
    );
} catch (PDOException $e) {
    error_log("Erreur DB popups/list: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Erreur connexion base de données']);
    exit;
}

try {
    // Récupérer l'ID de l'espace
    $stmt = $pdo->prepare("SELECT id FROM spaces WHERE slug = :slug AND is_active = 1");
    $stmt->execute([':slug' => $spaceSlug]);
    $space = $stmt->fetch();
    
    if (!$space) {
        // Espace non trouvé - retourner liste vide (pas d'erreur)
        echo json_encode([
            'success' => true,
            'data' => [
                'popups' => new stdClass(),
                'count' => 0,
                'space_slug' => $spaceSlug
            ]
        ]);
        exit;
    }
    
    $spaceId = $space['id'];
    
    // Récupérer tous les popups de cet espace
    $stmt = $pdo->prepare("
        SELECT 
            id,
            object_name,
            html_content,
            template_type,
            template_config,
            updated_by,
            created_at,
            updated_at
        FROM popup_contents 
        WHERE space_id = :space_id
        ORDER BY object_name ASC
    ");
    $stmt->execute([':space_id' => $spaceId]);
    $rows = $stmt->fetchAll();
    
    // Formater en objet indexé par object_name
    $popups = [];
    foreach ($rows as $row) {
        $objectName = $row['object_name'];
        
        // Décoder template_config si présent
        $templateConfig = null;
        if (!empty($row['template_config'])) {
            $templateConfig = json_decode($row['template_config'], true);
        }
        
        $popups[$objectName] = [
            'id' => (int)$row['id'],
            'object_name' => $objectName,
            'has_content' => !empty($row['html_content']),
            'template_type' => $row['template_type'] ?: null,
            'template_config' => $templateConfig,
            'html_content' => $row['html_content'] ?: '',
            'updated_at' => $row['updated_at']
        ];
    }
    
    echo json_encode([
        'success' => true,
        'data' => [
            'popups' => empty($popups) ? new stdClass() : $popups,
            'count' => count($popups),
            'space_slug' => $spaceSlug
        ]
    ]);
    
} catch (PDOException $e) {
    error_log("Erreur popups/list: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Erreur lors de la récupération']);
}