<?php
/**
 * ============================================
 * ⚙️ API PLV - CONFIG (Version JSON)
 * ============================================
 * * GET /api/plv/config.php?project_id=X
 * * Appelé par Shapespark pour charger les textures.
 * Lit la configuration depuis le JSON de plv_projects
 * au lieu de la table plv_slots obsolète.
 */

require_once __DIR__ . '/../config/database.php';

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json; charset=utf-8");
header("Cache-Control: public, max-age=60");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

try {
    $db = getDB();
    $projectId = isset($_GET['project_id']) ? $_GET['project_id'] : null;

    if (!$projectId) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'project_id requis']);
        exit;
    }

    // 1. Récupérer le projet et le JSON slots_config
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

    // 2. Décoder le JSON des slots
    // Le JSON est stocké dans la colonne 'slots_config'
    $slots = json_decode($project['slots_config'], true);
    
    if (!is_array($slots)) {
        $slots = [];
    }
    
    // 3. Construire la config pour autotextures.js
    $textures = [];
    $opaqueList = [];
    
    // Nom du dossier où sont stockées les images (slug de l'espace)
    $folderName = $project['space_slug']; 
    
    foreach ($slots as $slot) {
        // Format attendu du slot dans le JSON :
        // { "format": "carre", "index": 1, "shader": "c1_shdr", "file": "template_C1.png", "transparent": true }
        
        $shaderName = isset($slot['shader']) ? $slot['shader'] : (isset($slot['shader_name']) ? $slot['shader_name'] : '');
        $filename = isset($slot['file']) ? $slot['file'] : '';
        $isTransparent = isset($slot['transparent']) && $slot['transparent'] == true;
        
        if ($shaderName && $filename) {
            $textures[$shaderName] = $filename;
            
            // Si le slot n'est PAS transparent, on l'ajoute à la liste opaque
            if (!$isTransparent) {
                $opaqueList[] = $shaderName;
            }
        }
    }

    $response = [
        'success' => true,
        'projectId' => $folderName, // Utilisé pour construire l'URL des images
        'projectName' => $project['name'],
        'space' => $project['space_slug'],
        'zone' => $project['zone_slug'],
        'textures' => $textures,
        'opaqueList' => $opaqueList,
        'batchSize' => 3
    ];

    echo json_encode($response, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);

} catch (Exception $e) {
    error_log("Erreur plv/config: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Erreur serveur: ' . $e->getMessage()]);
}