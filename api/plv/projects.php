<?php
/**
 * ============================================
 * 🎨 API PLV - PROJETS
 * ============================================
 * LIMITE : 1 projet PLV par espace maximum
 */
require_once __DIR__ . '/../config/init.php';

// Authentification requise
$currentUser = requireAuth();

$method = $_SERVER['REQUEST_METHOD'];

try {
    $db = getDB();

    switch ($method) {
        // === LISTE OU DÉTAILS ===
        case 'GET':
            if (isset($_GET['id'])) {
                $stmt = $db->prepare("
                    SELECT p.*, s.slug as space_slug, s.name as space_name 
                    FROM plv_projects p
                    LEFT JOIN spaces s ON s.id = p.space_id
                    WHERE p.id = :id
                ");
                $stmt->execute([':id' => $_GET['id']]);
                $project = $stmt->fetch();

                if (!$project) errorResponse('Projet non trouvé', 404);
                
                $project['folder_name'] = $project['space_slug'];
                successResponse(['project' => $project]);
            } else {
                $stmt = $db->query("
                    SELECT p.*, s.slug as space_slug, s.name as space_name 
                    FROM plv_projects p
                    LEFT JOIN spaces s ON s.id = p.space_id
                    ORDER BY p.created_at DESC
                ");
                $projects = $stmt->fetchAll();
                
                foreach ($projects as &$p) {
                    $p['folder_name'] = $p['space_slug'];
                    $slots = json_decode($p['slots_config'] ?? '[]', true);
                    $p['total_slots'] = is_array($slots) ? count($slots) : 0;
                }
                
                successResponse(['projects' => $projects]);
            }
            break;

        // === CRÉATION ===
        case 'POST':
            $data = getPostData();
            
            $spaceId = getRequired($data, 'space_id');
            $name = getRequired($data, 'name');
            $description = getOptional($data, 'description', '');
            
            // ============================================
            // 🔒 VÉRIFICATION UNICITÉ : 1 projet par espace
            // ============================================
            $stmt = $db->prepare("SELECT id, name FROM plv_projects WHERE space_id = :space_id");
            $stmt->execute([':space_id' => $spaceId]);
            $existingProject = $stmt->fetch();
            
            if ($existingProject) {
                errorResponse('Cet espace a déjà un projet PLV ("' . $existingProject['name'] . '"). Supprimez-le d\'abord pour en créer un nouveau.', 409);
            }
            // ============================================
            
            $slotsInput = $data['slots_config'] ?? [];

            if (is_array($slotsInput)) {
                $slotsArray = $slotsInput;
                $slotsJson = json_encode($slotsInput);
            } else {
                $slotsArray = json_decode($slotsInput, true);
                $slotsJson = $slotsInput;
            }

            if (!is_array($slotsArray) || empty($slotsArray)) {
                errorResponse('Configuration des slots invalide ou vide', 400);
            }

            // 1. Récupérer le slug de l'espace pour le dossier
            $stmt = $db->prepare("SELECT slug FROM spaces WHERE id = :id");
            $stmt->execute([':id' => $spaceId]);
            $spaceSlug = $stmt->fetchColumn();

            if (!$spaceSlug) errorResponse('Espace introuvable', 404);

            // 2. Préparation des dossiers
            $plvBaseDir = realpath(__DIR__ . '/../../plv');
            $plvProjectDir = $plvBaseDir . '/' . $spaceSlug;
            $templatesDir = $plvBaseDir . '/templates';

            if (!is_dir($plvProjectDir)) {
                if (!@mkdir($plvProjectDir, 0755, true)) {
                    errorResponse("Impossible de créer le dossier du projet ($spaceSlug)", 500);
                }
            }

            // 3. Copie des images templates
            $copiedFiles = [];
            $errors = [];

            foreach ($slotsArray as $slot) {
                $format = $slot['format']; 
                $file = $slot['file'];
                $isTransparent = !empty($slot['transparent']);
                
                $transparencyDir = $isTransparent ? 'transparent' : 'opaque';
                $sourceFile = "$templatesDir/$format/$transparencyDir/$file";
                $destFile = "$plvProjectDir/$file";

                if (!file_exists($destFile)) {
                    if (file_exists($sourceFile)) {
                        if (@copy($sourceFile, $destFile)) {
                            $copiedFiles[] = $file;
                        } else {
                            $errors[] = "Erreur copie: $file";
                        }
                    } else {
                        error_log("Template manquant: $sourceFile");
                    }
                }
            }

            // 4. Insertion en BDD
            $stmt = $db->prepare("
                INSERT INTO plv_projects (name, space_id, description, slots_config, is_active, created_by, created_at, updated_at)
                VALUES (:name, :space_id, :description, :slots_config, 1, :created_by, NOW(), NOW())
            ");
            
            $stmt->execute([
                ':name' => trim($name),
                ':space_id' => $spaceId,
                ':description' => trim($description),
                ':slots_config' => $slotsJson,
                ':created_by' => $currentUser['id']
            ]);

            $projectId = $db->lastInsertId();

            successResponse([
                'project_id' => (int)$projectId,
                'message' => 'Projet créé avec succès',
                'files_copied' => count($copiedFiles),
                'warnings' => $errors
            ]);
            break;

        // === SUPPRESSION ===
        case 'DELETE':
            if (!isset($_GET['id'])) errorResponse('ID requis', 400);
            
            $id = $_GET['id'];
            
            $stmt = $db->prepare("
                SELECT p.*, s.slug as space_slug 
                FROM plv_projects p
                LEFT JOIN spaces s ON s.id = p.space_id
                WHERE p.id = :id
            ");
            $stmt->execute([':id' => $id]);
            $project = $stmt->fetch();
            
            if (!$project) errorResponse('Projet introuvable', 404);

            // === SUPPRESSION DU DOSSIER PLV ===
            $spaceSlug = $project['space_slug'];
            $deletedFiles = [];
            $deleteErrors = [];
            
            if ($spaceSlug) {
                $plvBaseDir = realpath(__DIR__ . '/../../plv');
                $plvProjectDir = $plvBaseDir . '/' . $spaceSlug;
                
                if ($plvProjectDir && is_dir($plvProjectDir) && strpos($plvProjectDir, $plvBaseDir) === 0) {
                    $files = glob($plvProjectDir . '/*');
                    foreach ($files as $file) {
                        if (is_file($file)) {
                            if (@unlink($file)) {
                                $deletedFiles[] = basename($file);
                            } else {
                                $deleteErrors[] = basename($file);
                            }
                        }
                    }
                    
                    if (count(glob($plvProjectDir . '/*')) === 0) {
                        @rmdir($plvProjectDir);
                    }
                }
            }

            $stmt = $db->prepare("DELETE FROM plv_projects WHERE id = :id");
            $stmt->execute([':id' => $id]);

            logActivity($currentUser['id'], 'plv_project_deleted', 'plv_project', $id, [
                'name' => $project['name'],
                'space_slug' => $spaceSlug,
                'files_deleted' => count($deletedFiles)
            ]);

            successResponse([
                'message' => 'Projet supprimé',
                'files_deleted' => count($deletedFiles),
                'delete_errors' => $deleteErrors
            ]);
            break;

        default:
            errorResponse('Méthode non autorisée', 405);
    }

} catch (Exception $e) {
    error_log("Erreur plv/projects: " . $e->getMessage());
    errorResponse('Erreur serveur: ' . $e->getMessage(), 500);
}