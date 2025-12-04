<?php
/**
 * ============================================
 * 📥 API POPUPS - GET
 * Récupère un template popup existant
 * 
 * GET /api/popups/get.php?space_slug=X&object_name=Y
 * ============================================
 */

define('ATLANTIS_API', true);
require_once __DIR__ . '/../config/init.php';

// CORS
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Content-Type: application/json; charset=utf-8");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    errorResponse('Méthode non autorisée', 405);
}

try {
    $spaceSlug = isset($_GET['space_slug']) ? trim($_GET['space_slug']) : null;
    $objectName = isset($_GET['object_name']) ? trim($_GET['object_name']) : null;

    if (!$spaceSlug || !$objectName) {
        errorResponse('space_slug et object_name requis', 400);
    }

    $db = getDB();

    // Récupérer le space_id
    $stmt = $db->prepare("SELECT id FROM spaces WHERE slug = :slug");
    $stmt->execute([':slug' => $spaceSlug]);
    $space = $stmt->fetch();

    if (!$space) {
        errorResponse('Espace non trouvé', 404);
    }

    // Récupérer le template
    $stmt = $db->prepare("
        SELECT pc.*, 
               z.slug as zone_slug, 
               z.name as zone_name,
               u.first_name as updated_by_first_name,
               u.last_name as updated_by_last_name
        FROM popup_contents pc
        LEFT JOIN zones z ON z.id = pc.zone_id
        LEFT JOIN users u ON u.id = pc.updated_by
        WHERE pc.space_id = :space_id 
        AND pc.object_name = :object_name
        AND pc.is_active = 1
    ");
    $stmt->execute([
        ':space_id' => $space['id'],
        ':object_name' => $objectName
    ]);
    $template = $stmt->fetch();

    if (!$template) {
        // Pas de template existant - retourner un objet vide
        successResponse([
            'exists' => false,
            'template' => null,
            'message' => 'Aucun template trouvé pour cet objet'
        ]);
    }

    successResponse([
        'exists' => true,
        'template' => [
            'id' => (int)$template['id'],
            'object_name' => $template['object_name'],
            'template_type' => $template['template_type'],
            'template_config' => $template['template_config'],
            'shader_name' => $template['shader_name'],
            'format' => $template['format'],
            'zone_slug' => $template['zone_slug'],
            'zone_name' => $template['zone_name'],
            'is_active' => (bool)$template['is_active'],
            'created_at' => $template['created_at'],
            'updated_at' => $template['updated_at'],
            'updated_by' => $template['updated_by_first_name'] 
                ? $template['updated_by_first_name'] . ' ' . $template['updated_by_last_name'] 
                : null
        ]
    ]);

} catch (Exception $e) {
    error_log("Erreur popups/get: " . $e->getMessage());
    errorResponse('Erreur serveur: ' . $e->getMessage(), 500);
}
