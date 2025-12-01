<?php
/**
 * ============================================
 * 🖼️ API PLV - GESTION DES PROJETS
 * ============================================
 * 
 * GET    /api/plv/projects.php              → Liste tous les projets (selon permissions)
 * GET    /api/plv/projects.php?id=X         → Détails d'un projet + slots
 * GET    /api/plv/projects.php?space_id=X   → Projets d'un espace
 * POST   /api/plv/projects.php              → Créer un projet + slots
 * PUT    /api/plv/projects.php              → Modifier un projet
 * DELETE /api/plv/projects.php?id=X         → Supprimer un projet
 */

require_once __DIR__ . '/../config/init.php';

$method = $_SERVER['REQUEST_METHOD'];

/**
 * Vérifie si l'utilisateur peut accéder à un projet PLV
 */
function canAccessPLVProject($userId, $spaceId, $zoneId = null) {
    $db = getDB();
    
    // Vérifier si super_admin
    $stmt = $db->prepare("SELECT global_role FROM users WHERE id = :id");
    $stmt->execute([':id' => $userId]);
    $user = $stmt->fetch();
    
    if ($user && $user['global_role'] === 'super_admin') {
        return true;
    }
    
    // Vérifier si space_admin de cet espace
    $stmt = $db->prepare("
        SELECT role FROM user_space_roles 
        WHERE user_id = :user_id AND space_id = :space_id AND zone_id IS NULL AND role = 'space_admin'
    ");
    $stmt->execute([':user_id' => $userId, ':space_id' => $spaceId]);
    if ($stmt->fetch()) {
        return true;
    }
    
    // Si projet lié à une zone, vérifier si zone_admin de cette zone
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

/**
 * Génère le nom du dossier PLV (plvid000001)
 */
function getPLVFolderName($projectId) {
    return 'plvid' . str_pad($projectId, 6, '0', STR_PAD_LEFT);
}

/**
 * Crée le dossier PLV et copie les templates
 */
function createPLVFolder($projectId, $slots) {
    $folderName = getPLVFolderName($projectId);
    $basePath = dirname(dirname(__DIR__)) . '/plv/';
    $projectPath = $basePath . $folderName . '/';
    $templatePath = $basePath . 'templates/';
    
    // Créer le dossier du projet
    if (!file_exists($projectPath)) {
        mkdir($projectPath, 0755, true);
    }
    
    // Mapping format -> dossier template
    $formatDirs = [
        'C' => 'carre',
        'P' => 'portrait',
        'L' => 'paysage'
    ];
    
    // Copier les templates pour chaque slot
    foreach ($slots as $slot) {
        $format = $slot['format'];
        $number = $slot['slot_number'];
        $transparent = $slot['is_transparent'];
        
        $typeDir = $transparent ? 'transparent' : 'opaque';
        $formatDir = $formatDirs[$format];
        
        $sourceFile = $templatePath . $formatDir . '/' . $typeDir . '/template_' . $format . $number . '.png';
        $destFile = $projectPath . 'template_' . $format . $number . '.png';
        
        if (file_exists($sourceFile)) {
            copy($sourceFile, $destFile);
        }
    }
    
    return $folderName;
}

/**
 * Supprime le dossier PLV et son contenu
 */
function deletePLVFolder($projectId) {
    $folderName = getPLVFolderName($projectId);
    $projectPath = dirname(dirname(__DIR__)) . '/plv/' . $folderName . '/';
    
    if (file_exists($projectPath)) {
        $files = glob($projectPath . '*');
        foreach ($files as $file) {
            if (is_file($file)) {
                unlink($file);
            }
        }
        rmdir($projectPath);
    }
}

try {
    $db = getDB();
    $currentUser = requireAuth();

    switch ($method) {
        // ============================================
        // GET - Liste ou détails projet
        // ============================================
        case 'GET':
            if (isset($_GET['id'])) {
                // Détails d'un projet
                $stmt = $db->prepare("
                    SELECT p.*, s.name as space_name, s.slug as space_slug,
                           z.name as zone_name, z.slug as zone_slug,
                           u.first_name as creator_first_name, u.last_name as creator_last_name
                    FROM plv_projects p
                    JOIN spaces s ON s.id = p.space_id
                    LEFT JOIN zones z ON z.id = p.zone_id
                    LEFT JOIN users u ON u.id = p.created_by
                    WHERE p.id = :id
                ");
                $stmt->execute([':id' => $_GET['id']]);
                $project = $stmt->fetch();

                if (!$project) {
                    errorResponse('Projet non trouvé', 404);
                }

                // Vérifier permissions
                if (!canAccessPLVProject($currentUser['id'], $project['space_id'], $project['zone_id'])) {
                    errorResponse('Accès non autorisé', 403);
                }

                // Ajouter folder_name
                $project['folder_name'] = getPLVFolderName($project['id']);

                // Récupérer les slots
                $stmt = $db->prepare("
                    SELECT * FROM plv_slots 
                    WHERE project_id = :project_id
                    ORDER BY format, slot_number
                ");
                $stmt->execute([':project_id' => $_GET['id']]);
                $project['slots'] = $stmt->fetchAll();

                // Ajouter filename et shader_name pour chaque slot
                foreach ($project['slots'] as &$slot) {
                    $slot['filename'] = 'template_' . $slot['format'] . $slot['slot_number'] . '.png';
                    $slot['shader_name'] = 'plv_' . strtolower($slot['format']) . '_' . str_pad($slot['slot_number'], 2, '0', STR_PAD_LEFT) . '_shdr';
                }

                successResponse(['project' => $project]);

            } elseif (isset($_GET['space_id'])) {
                // Projets d'un espace
                $spaceId = $_GET['space_id'];
                
                // Vérifier permissions sur l'espace
                if (!canAccessPLVProject($currentUser['id'], $spaceId, null)) {
                    errorResponse('Accès non autorisé', 403);
                }

                $stmt = $db->prepare("
                    SELECT p.*, s.name as space_name, z.name as zone_name,
                           (SELECT COUNT(*) FROM plv_slots WHERE project_id = p.id) as slot_count,
                           (SELECT COUNT(*) FROM plv_slots WHERE project_id = p.id AND is_uploaded = 1) as uploaded_count
                    FROM plv_projects p
                    JOIN spaces s ON s.id = p.space_id
                    LEFT JOIN zones z ON z.id = p.zone_id
                    WHERE p.space_id = :space_id
                    ORDER BY p.name
                ");
                $stmt->execute([':space_id' => $spaceId]);
                $projects = $stmt->fetchAll();

                // Ajouter folder_name
                foreach ($projects as &$proj) {
                    $proj['folder_name'] = getPLVFolderName($proj['id']);
                }

                successResponse(['projects' => $projects]);

            } else {
                // Liste tous les projets accessibles
                // Récupérer les espaces avec leurs projets
                
                if ($currentUser['global_role'] === 'super_admin') {
                    // Super admin : tous les espaces
                    $stmt = $db->query("
                        SELECT s.id, s.name, s.slug
                        FROM spaces s
                        WHERE s.is_active = 1
                        ORDER BY s.name
                    ");
                } else {
                    // Autres : seulement les espaces où ils ont un rôle
                    $stmt = $db->prepare("
                        SELECT DISTINCT s.id, s.name, s.slug
                        FROM spaces s
                        JOIN user_space_roles usr ON usr.space_id = s.id
                        WHERE usr.user_id = :user_id AND s.is_active = 1
                        ORDER BY s.name
                    ");
                    $stmt->execute([':user_id' => $currentUser['id']]);
                }
                
                $spaces = $stmt->fetchAll();
                $bySpace = [];
                
                foreach ($spaces as $space) {
                    // Récupérer les projets de cet espace
                    $stmt = $db->prepare("
                        SELECT p.*, z.name as zone_name, z.slug as zone_slug,
                               (SELECT COUNT(*) FROM plv_slots WHERE project_id = p.id) as slot_count,
                               (SELECT COUNT(*) FROM plv_slots WHERE project_id = p.id AND is_uploaded = 1) as uploaded_count
                        FROM plv_projects p
                        LEFT JOIN zones z ON z.id = p.zone_id
                        WHERE p.space_id = :space_id AND p.is_active = 1
                        ORDER BY p.name
                    ");
                    $stmt->execute([':space_id' => $space['id']]);
                    $projects = $stmt->fetchAll();
                    
                    // Ajouter folder_name à chaque projet
                    foreach ($projects as &$proj) {
                        $proj['folder_name'] = getPLVFolderName($proj['id']);
                    }
                    
                    // Récupérer les zones de l'espace
                    $stmt = $db->prepare("
                        SELECT id, name, slug FROM zones 
                        WHERE space_id = :space_id AND is_active = 1
                        ORDER BY name
                    ");
                    $stmt->execute([':space_id' => $space['id']]);
                    $zones = $stmt->fetchAll();
                    
                    $bySpace[] = [
                        'space' => $space,
                        'zones' => $zones,
                        'projects' => $projects
                    ];
                }
                
                successResponse(['by_space' => $bySpace]);
            }
            break;

        // ============================================
        // POST - Créer un projet
        // ============================================
        case 'POST':
            $data = getPostData();
            
            $name = getRequired($data, 'name');
            $spaceId = getRequired($data, 'space_id');
            $zoneId = getOptional($data, 'zone_id');
            $description = getOptional($data, 'description');
            $slots = getRequired($data, 'slots');

            // Vérifier que l'espace existe
            $stmt = $db->prepare("SELECT id, name FROM spaces WHERE id = :id");
            $stmt->execute([':id' => $spaceId]);
            if (!$stmt->fetch()) {
                errorResponse('Espace non trouvé', 404);
            }

            // Vérifier permissions
            if (!canAccessPLVProject($currentUser['id'], $spaceId, $zoneId)) {
                errorResponse('Accès non autorisé', 403);
            }

            // Si zone_id fourni, vérifier qu'elle appartient à l'espace
            if ($zoneId) {
                $stmt = $db->prepare("SELECT id FROM zones WHERE id = :id AND space_id = :space_id");
                $stmt->execute([':id' => $zoneId, ':space_id' => $spaceId]);
                if (!$stmt->fetch()) {
                    errorResponse('Zone non trouvée dans cet espace', 404);
                }
            }

            // Valider qu'il y a au moins un slot
            if (!is_array($slots) || count($slots) === 0) {
                errorResponse('Au moins un slot est requis', 400);
            }

            // Créer le projet
            $stmt = $db->prepare("
                INSERT INTO plv_projects (name, space_id, zone_id, description, created_by)
                VALUES (:name, :space_id, :zone_id, :description, :created_by)
            ");
            $stmt->execute([
                ':name' => $name,
                ':space_id' => $spaceId,
                ':zone_id' => $zoneId ?: null,
                ':description' => $description,
                ':created_by' => $currentUser['id']
            ]);

            $projectId = $db->lastInsertId();

            // Créer les slots
            $slotsToCreate = [];
            foreach ($slots as $slotDef) {
                $format = $slotDef['format'];
                $count = (int)$slotDef['count'];
                $transparent = !empty($slotDef['transparent']);
                
                // Trouver le prochain numéro pour ce format
                $stmt = $db->prepare("
                    SELECT COALESCE(MAX(slot_number), 0) as max_num 
                    FROM plv_slots 
                    WHERE project_id = :project_id AND format = :format
                ");
                $stmt->execute([':project_id' => $projectId, ':format' => $format]);
                $startNum = $stmt->fetch()['max_num'] + 1;

                for ($i = 0; $i < $count; $i++) {
                    $slotNum = $startNum + $i;
                    $stmt = $db->prepare("
                        INSERT INTO plv_slots (project_id, format, slot_number, is_transparent)
                        VALUES (:project_id, :format, :slot_number, :is_transparent)
                    ");
                    $stmt->execute([
                        ':project_id' => $projectId,
                        ':format' => $format,
                        ':slot_number' => $slotNum,
                        ':is_transparent' => $transparent ? 1 : 0
                    ]);
                    
                    $slotsToCreate[] = [
                        'format' => $format,
                        'slot_number' => $slotNum,
                        'is_transparent' => $transparent
                    ];
                }
            }

            // Créer le dossier et copier les templates
            $folderName = createPLVFolder($projectId, $slotsToCreate);

            // Logger l'action
            logActivity($currentUser['id'], 'plv_project_created', 'plv_projects', $projectId, [
                'name' => $name,
                'space_id' => $spaceId,
                'slots_count' => count($slotsToCreate)
            ]);

            successResponse([
                'project_id' => (int)$projectId,
                'folder_name' => $folderName,
                'slots_created' => count($slotsToCreate),
                'message' => 'Projet PLV créé'
            ]);
            break;

        // ============================================
        // PUT - Modifier un projet
        // ============================================
        case 'PUT':
            $data = getPostData();
            $projectId = getRequired($data, 'id');

            // Vérifier que le projet existe
            $stmt = $db->prepare("SELECT * FROM plv_projects WHERE id = :id");
            $stmt->execute([':id' => $projectId]);
            $project = $stmt->fetch();

            if (!$project) {
                errorResponse('Projet non trouvé', 404);
            }

            // Vérifier permissions
            if (!canAccessPLVProject($currentUser['id'], $project['space_id'], $project['zone_id'])) {
                errorResponse('Accès non autorisé', 403);
            }

            // Construire la requête de mise à jour
            $updates = [];
            $params = [':id' => $projectId];

            if (isset($data['name'])) {
                $updates[] = 'name = :name';
                $params[':name'] = trim($data['name']);
            }

            if (isset($data['description'])) {
                $updates[] = 'description = :description';
                $params[':description'] = trim($data['description']);
            }

            if (isset($data['is_active'])) {
                $updates[] = 'is_active = :is_active';
                $params[':is_active'] = $data['is_active'] ? 1 : 0;
            }

            if (empty($updates)) {
                errorResponse('Aucune modification fournie', 400);
            }

            $sql = "UPDATE plv_projects SET " . implode(', ', $updates) . " WHERE id = :id";
            $stmt = $db->prepare($sql);
            $stmt->execute($params);

            // Logger l'action
            logActivity($currentUser['id'], 'plv_project_updated', 'plv_projects', $projectId, $data);

            successResponse(['message' => 'Projet mis à jour']);
            break;

        // ============================================
        // DELETE - Supprimer un projet
        // ============================================
        case 'DELETE':
            if (!isset($_GET['id'])) {
                errorResponse('ID projet requis', 400);
            }

            $projectId = $_GET['id'];

            // Vérifier que le projet existe
            $stmt = $db->prepare("SELECT * FROM plv_projects WHERE id = :id");
            $stmt->execute([':id' => $projectId]);
            $project = $stmt->fetch();

            if (!$project) {
                errorResponse('Projet non trouvé', 404);
            }

            // Vérifier permissions
            if (!canAccessPLVProject($currentUser['id'], $project['space_id'], $project['zone_id'])) {
                errorResponse('Accès non autorisé', 403);
            }

            // Supprimer le dossier FTP
            deletePLVFolder($projectId);

            // Supprimer le projet (CASCADE supprime les slots)
            $stmt = $db->prepare("DELETE FROM plv_projects WHERE id = :id");
            $stmt->execute([':id' => $projectId]);

            // Logger l'action
            logActivity($currentUser['id'], 'plv_project_deleted', 'plv_projects', $projectId, [
                'name' => $project['name']
            ]);

            successResponse(['message' => 'Projet supprimé']);
            break;

        default:
            errorResponse('Méthode non autorisée', 405);
    }

} catch (PDOException $e) {
    error_log("Erreur plv/projects: " . $e->getMessage());
    errorResponse('Erreur serveur', 500);
}