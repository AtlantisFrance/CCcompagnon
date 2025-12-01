<?php
/**
 * ============================================
 * ⚙️ API PLV - CONFIG POUR SHAPESPARK
 * ============================================
 * 
 * GET /api/plv/config.php?project_id=X
 * 
 * Endpoint PUBLIC (pas d'auth) pour récupérer
 * la config d'un projet PLV au format autotextures.js
 */

require_once __DIR__ . '/../config/database.php';

// CORS permissif pour Shapespark
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json; charset=utf-8");
header("Cache-Control: public, max-age=60");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(['success' => false, 'error' => 'Méthode non autorisée']);
    exit;
}

if (!isset($_GET['project_id'])) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'project_id requis']);
    exit;
}

try {
    $db = getDB();
    $projectId = $_GET['project_id'];

    // Récupérer le projet
    $stmt = $db->prepare("
        SELECT p.*, s.slug as space_slug, z.slug as zone_slug
        FROM plv_projects p
        JOIN spaces s ON s.id = p.space_id
        LEFT JOIN zones z ON z.id = p.zone_id
        WHERE p.id = :id AND p.is_active = 1
    ");
    $stmt->execute([':id' => $projectId]);
    $project = $stmt->fetch();

    if (!$project) {
        http_response_code(404);
        echo json_encode(['success' => false, 'error' => 'Projet non trouvé ou inactif']);
        exit;
    }

    // Récupérer les slots
    $stmt = $db->prepare("
        SELECT * FROM plv_slots 
        WHERE project_id = :project_id
        ORDER BY format, slot_number
    ");
    $stmt->execute([':project_id' => $projectId]);
    $slots = $stmt->fetchAll();

    // Construire la config pour autotextures.js
    $folderName = 'plvid' . str_pad($projectId, 6, '0', STR_PAD_LEFT);
    $textures = [];
    $opaqueList = [];

    foreach ($slots as $slot) {
        $filename = 'template_' . $slot['format'] . $slot['slot_number'] . '.png';
        $shaderName = 'plv_' . strtolower($slot['format']) . '_' . str_pad($slot['slot_number'], 2, '0', STR_PAD_LEFT) . '_shdr';
        
        $textures[$shaderName] = $filename;
        
        if (!$slot['is_transparent']) {
            $opaqueList[] = $shaderName;
        }
    }

    $config = [
        'success' => true,
        'projectId' => $folderName,
        'projectName' => $project['name'],
        'space' => $project['space_slug'],
        'zone' => $project['zone_slug'],
        'textures' => $textures,
        'opaqueList' => $opaqueList,
        'batchSize' => 3
    ];

    echo json_encode($config, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);

} catch (PDOException $e) {
    error_log("Erreur plv/config: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Erreur serveur']);
}