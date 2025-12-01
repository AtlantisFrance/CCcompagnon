<?php
/**
 * ============================================
 * 🎰 API PLV - GESTION DES SLOTS
 * ============================================
 * 
 * GET /api/plv/slots.php?project_id=X  → Liste slots d'un projet
 * PUT /api/plv/slots.php               → Modifier un slot (label)
 */

require_once __DIR__ . '/../config/init.php';

$method = $_SERVER['REQUEST_METHOD'];

/**
 * Vérifie si l'utilisateur peut accéder à un projet PLV
 */
function canAccessPLVProject($userId, $spaceId, $zoneId = null) {
    $db = getDB();
    
    $stmt = $db->prepare("SELECT global_role FROM users WHERE id = :id");
    $stmt->execute([':id' => $userId]);
    $user = $stmt->fetch();
    
    if ($user && $user['global_role'] === 'super_admin') {
        return true;
    }
    
    $stmt = $db->prepare("
        SELECT role FROM user_space_roles 
        WHERE user_id = :user_id AND space_id = :space_id AND zone_id IS NULL AND role = 'space_admin'
    ");
    $stmt->execute([':user_id' => $userId, ':space_id' => $spaceId]);
    if ($stmt->fetch()) {
        return true;
    }
    
    if ($zoneId) {
        $stmt = $db->prepare("
            SELECT role FROM user_space_roles 
            WHERE user_id = :user_id AND space_id = :space_id AND zone_id = :zone_id AND role = 'zone_admin'
        ");
        $stmt->execute([':user_id' => $userId, ':space_id' => $spaceId, ':zone_id' => $zoneId]);
        if ($stmt->fetch()) {
            return true;
        }
    }
    
    return false;
}

try {
    $db = getDB();
    $currentUser = requireAuth();

    switch ($method) {
        // ============================================
        // GET - Liste des slots d'un projet
        // ============================================
        case 'GET':
            if (!isset($_GET['project_id'])) {
                errorResponse('project_id requis', 400);
            }

            $projectId = $_GET['project_id'];

            // Récupérer le projet pour vérifier permissions
            $stmt = $db->prepare("SELECT * FROM plv_projects WHERE id = :id");
            $stmt->execute([':id' => $projectId]);
            $project = $stmt->fetch();

            if (!$project) {
                errorResponse('Projet non trouvé', 404);
            }

            if (!canAccessPLVProject($currentUser['id'], $project['space_id'], $project['zone_id'])) {
                errorResponse('Accès non autorisé', 403);
            }

            // Récupérer les slots
            $stmt = $db->prepare("
                SELECT s.*, u.first_name as uploader_first_name, u.last_name as uploader_last_name
                FROM plv_slots s
                LEFT JOIN users u ON u.id = s.uploaded_by
                WHERE s.project_id = :project_id
                ORDER BY s.format, s.slot_number
            ");
            $stmt->execute([':project_id' => $projectId]);
            $slots = $stmt->fetchAll();

            // Ajouter filename et shader_name, grouper par format
            $folderName = 'plvid' . str_pad($projectId, 6, '0', STR_PAD_LEFT);
            $grouped = ['C' => [], 'P' => [], 'L' => []];

            foreach ($slots as &$slot) {
                $slot['filename'] = 'template_' . $slot['format'] . $slot['slot_number'] . '.png';
                $slot['shader_name'] = 'plv_' . strtolower($slot['format']) . '_' . str_pad($slot['slot_number'], 2, '0', STR_PAD_LEFT) . '_shdr';
                $slot['image_url'] = 'https://compagnon.atlantis-city.com/plv/' . $folderName . '/' . $slot['filename'];
                $grouped[$slot['format']][] = $slot;
            }

            successResponse([
                'slots' => $slots,
                'by_format' => [
                    'carres' => $grouped['C'],
                    'portraits' => $grouped['P'],
                    'paysages' => $grouped['L']
                ],
                'folder_name' => $folderName
            ]);
            break;

        // ============================================
        // PUT - Modifier un slot (label uniquement)
        // ============================================
        case 'PUT':
            $data = getPostData();
            $slotId = getRequired($data, 'id');

            // Récupérer le slot et son projet
            $stmt = $db->prepare("
                SELECT s.*, p.space_id, p.zone_id
                FROM plv_slots s
                JOIN plv_projects p ON p.id = s.project_id
                WHERE s.id = :id
            ");
            $stmt->execute([':id' => $slotId]);
            $slot = $stmt->fetch();

            if (!$slot) {
                errorResponse('Slot non trouvé', 404);
            }

            if (!canAccessPLVProject($currentUser['id'], $slot['space_id'], $slot['zone_id'])) {
                errorResponse('Accès non autorisé', 403);
            }

            // Mise à jour du label uniquement
            if (isset($data['label'])) {
                $stmt = $db->prepare("UPDATE plv_slots SET label = :label WHERE id = :id");
                $stmt->execute([
                    ':label' => trim($data['label']) ?: null,
                    ':id' => $slotId
                ]);
            }

            successResponse(['message' => 'Slot mis à jour']);
            break;

        default:
            errorResponse('Méthode non autorisée', 405);
    }

} catch (PDOException $e) {
    error_log("Erreur plv/slots: " . $e->getMessage());
    errorResponse('Erreur serveur', 500);
}