<?php
/**
 * ============================================
 * 📋 API POPUPS - TEMPLATES
 * ============================================
 * 
 * GET /api/popups/templates.php           → Tous les templates actifs
 * GET /api/popups/templates.php?key=X     → Un template spécifique
 * 
 * Retourne les templates depuis la table popup_templates
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
    error_log("Erreur DB popups/templates: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Erreur connexion base de données']);
    exit;
}

try {
    // Template spécifique demandé ?
    $templateKey = isset($_GET['key']) ? trim($_GET['key']) : null;
    
    if ($templateKey) {
        // Récupérer un template spécifique
        $stmt = $pdo->prepare("
            SELECT 
                id,
                template_key,
                name,
                description,
                icon,
                default_config,
                css_styles,
                is_active,
                created_at,
                updated_at
            FROM popup_templates 
            WHERE template_key = :key AND is_active = 1
        ");
        $stmt->execute([':key' => $templateKey]);
        $template = $stmt->fetch();
        
        if (!$template) {
            http_response_code(404);
            echo json_encode(['success' => false, 'error' => 'Template non trouvé']);
            exit;
        }
        
        // Décoder les JSON
        $template['default_config'] = $template['default_config'] 
            ? json_decode($template['default_config'], true) 
            : null;
        $template['id'] = (int)$template['id'];
        $template['is_active'] = (bool)$template['is_active'];
        
        echo json_encode([
            'success' => true,
            'data' => [
                'template' => $template
            ]
        ]);
        
    } else {
        // Récupérer tous les templates actifs
        $stmt = $pdo->query("
            SELECT 
                id,
                template_key,
                name,
                description,
                icon,
                default_config,
                css_styles,
                is_active,
                created_at,
                updated_at
            FROM popup_templates 
            WHERE is_active = 1
            ORDER BY id ASC
        ");
        $rows = $stmt->fetchAll();
        
        // Formater les templates
        $templates = [];
        foreach ($rows as $row) {
            $row['default_config'] = $row['default_config'] 
                ? json_decode($row['default_config'], true) 
                : null;
            $row['id'] = (int)$row['id'];
            $row['is_active'] = (bool)$row['is_active'];
            
            $templates[$row['template_key']] = $row;
        }
        
        echo json_encode([
            'success' => true,
            'data' => [
                'templates' => $templates,
                'count' => count($templates)
            ]
        ]);
    }
    
} catch (PDOException $e) {
    error_log("Erreur popups/templates: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Erreur lors de la récupération']);
}