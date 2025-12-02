<?php
/**
 * ============================================
 * 🎨 API PLV - GESTION DES PROJETS
 * ============================================
 * 
 * GET    /api/plv/projects.php           → Liste tous les projets
 * GET    /api/plv/projects.php?id=X      → Détails d'un projet
 * POST   /api/plv/projects.php           → Créer un projet
 * DELETE /api/plv/projects.php?id=X      → Supprimer un projet
 * 
 * ⚠️ PRÉREQUIS : Ajouter la colonne slots_config à la table plv_projects :
 * ALTER TABLE plv_projects ADD COLUMN slots_config TEXT AFTER description;
 */

require_once __DIR__ . '/../config/init.php';

// Authentification requise
$currentUser = requireAuth();

$method = $_SERVER['REQUEST_METHOD'];

try {
    $db = getDB();

    switch ($method) {
        // ============================================
        // GET - Liste ou détails projet
        // ============================================
        case 'GET':
            if (isset($_GET['id'])) {
                // Détails d'un projet spécifique
                $stmt = $db->prepare("
                    SELECT p.*, 
                           s.slug as space_slug, 
                           s.name as space_name,
                           u.first_name as creator_first_name,
                           u.last_name as creator_last_name
                    FROM plv_projects p
                    LEFT JOIN spaces s ON s.id = p.space_id
                    LEFT JOIN users u ON u.id = p.created_by
                    WHERE p.id = :id
                ");
                $stmt->execute([':id' => $_GET['id']]);
                $project = $stmt->fetch();

                if (!$project) {
                    errorResponse('Projet PLV non trouvé', 404);
                }

                // Ajouter folder_name (= space_slug)
                $project['folder_name'] = $project['space_slug'];

                successResponse(['project' => $project]);

            } else {
                // Liste tous les projets
                $stmt = $db->query("
                    SELECT p.*, 
                           s.slug as space_slug, 
                           s.name as space_name
                    FROM plv_projects p
                    LEFT JOIN spaces s ON s.id = p.space_id
                    ORDER BY s.name, p.created_at DESC
                ");
                $projects = $stmt->fetchAll();

                // Ajouter folder_name à chaque projet
                foreach ($projects as &$project) {
                    $project['folder_name'] = $project['space_slug'];
                }

                successResponse(['projects' => $projects]);
            }
            break;

        // ============================================
        // POST - Créer un projet PLV
        // ============================================
        case 'POST':
            $data = getPostData();
            
            $spaceId = getRequired($data, 'space_id');
            $name = getRequired($data, 'name');
            $slotsConfig = getRequired($data, 'slots_config');
            $description = getOptional($data, 'description', '');

            // Vérifier que l'espace existe et récupérer son slug
            $stmt = $db->prepare("SELECT id, slug, name FROM spaces WHERE id = :id");
            $stmt->execute([':id' => $spaceId]);
            $space = $stmt->fetch();

            if (!$space) {
                errorResponse('Espace non trouvé', 404);
            }

            $spaceSlug = $space['slug'];

            // Valider le JSON des slots
            $slots = json_decode($slotsConfig, true);
            if (!$slots || !is_array($slots)) {
                errorResponse('Configuration des slots invalide', 400);
            }

            if (count($slots) === 0) {
                errorResponse('Au moins un slot est requis', 400);
            }

            // Créer le dossier PLV pour cet espace s'il n'existe pas
            $plvBaseDir = realpath(__DIR__ . '/../../plv');
            $plvProjectDir = $plvBaseDir . '/' . $spaceSlug;

            if (!is_dir($plvProjectDir)) {
                if (!@mkdir($plvProjectDir, 0755, true)) {
                    error_log("Impossible de créer le dossier: $plvProjectDir");
                    errorResponse('Impossible de créer le dossier du projet', 500);
                }
            }

            // Copier les templates pour chaque slot
            $templatesDir = $plvBaseDir . '/templates';
            $copiedFiles = [];
            $errors = [];

            foreach ($slots as $slot) {
                $format = $slot['format'];                    // carre, paysage, portrait
                $file = $slot['file'];                        // template_C1.png, template_L1.png, template_P1.png
                $isTransparent = $slot['transparent'] ?? false;
                
                // Sous-dossier selon transparence : opaque ou transparent
                $transparencyDir = $isTransparent ? 'transparent' : 'opaque';

                // Source : /plv/templates/[format]/[opaque|transparent]/[file]
                $sourceFile = $templatesDir . '/' . $format . '/' . $transparencyDir . '/' . $file;
                $destFile = $plvProjectDir . '/' . $file;

                // Si le fichier destination existe déjà, ne pas écraser
                if (file_exists($destFile)) {
                    $copiedFiles[] = $file . ' (existant)';
                    continue;
                }

                if (file_exists($sourceFile)) {
                    if (@copy($sourceFile, $destFile)) {
                        $copiedFiles[] = $file . ' (' . $transparencyDir . ')';
                    } else {
                        $errors[] = "Impossible de copier $file";
                    }
                } else {
                    $errors[] = "Template non trouvé: $format/$transparencyDir/$file";
                }
            }

            // Insérer le projet en BDD
            $stmt = $db->prepare("
                INSERT INTO plv_projects (name, space_id, description, slots_config, is_active, created_by, created_at, updated_at)
                VALUES (:name, :space_id, :description, :slots_config, 1, :created_by, NOW(), NOW())
            ");
            $stmt->execute([
                ':name' => trim($name),
                ':space_id' => $spaceId,
                ':description' => trim($description),
                ':slots_config' => $slotsConfig,
                ':created_by' => $currentUser['id']
            ]);

            $projectId = $db->lastInsertId();

            // Logger l'activité
            logActivity($currentUser['id'], 'plv_project_created', 'plv_projects', $projectId, [
                'name' => $name,
                'space_slug' => $spaceSlug,
                'slots_count' => count($slots),
                'copied_files' => count($copiedFiles),
                'errors' => $errors
            ]);

            $response = [
                'project_id' => (int)$projectId,
                'folder' => $spaceSlug,
                'slots_count' => count($slots),
                'message' => 'Projet PLV créé avec succès'
            ];

            if (!empty($errors)) {
                $response['warnings'] = $errors;
            }

            successResponse($response);
            break;

        // ============================================
        // DELETE - Supprimer un projet PLV
        // ============================================
        case 'DELETE':
            if (!isset($_GET['id'])) {
                errorResponse('ID projet requis', 400);
            }

            $projectId = $_GET['id'];

            // Récupérer le projet pour vérifier qu'il existe
            $stmt = $db->prepare("
                SELECT p.*, s.slug as space_slug
                FROM plv_projects p
                LEFT JOIN spaces s ON s.id = p.space_id
                WHERE p.id = :id
            ");
            $stmt->execute([':id' => $projectId]);
            $project = $stmt->fetch();

            if (!$project) {
                errorResponse('Projet PLV non trouvé', 404);
            }

            // Supprimer les fichiers du dossier
            $plvProjectDir = realpath(__DIR__ . '/../../plv') . '/' . $project['space_slug'];
            $deletedFiles = [];
            
            if (is_dir($plvProjectDir)) {
                $slots = json_decode($project['slots_config'], true) ?: [];
                foreach ($slots as $slot) {
                    $file = $plvProjectDir . '/' . $slot['file'];
                    if (file_exists($file)) {
                        if (@unlink($file)) {
                            $deletedFiles[] = $slot['file'];
                        }
                    }
                }
                
                // Supprimer le dossier s'il est vide
                $remainingFiles = @scandir($plvProjectDir);
                if ($remainingFiles && count($remainingFiles) <= 2) { // . et ..
                    @rmdir($plvProjectDir);
                }
            }

            // Supprimer l'entrée en BDD
            $stmt = $db->prepare("DELETE FROM plv_projects WHERE id = :id");
            $stmt->execute([':id' => $projectId]);

            // Logger l'activité
            logActivity($currentUser['id'], 'plv_project_deleted', 'plv_projects', $projectId, [
                'name' => $project['name'],
                'space_slug' => $project['space_slug'],
                'deleted_files' => $deletedFiles
            ]);

            successResponse(['message' => 'Projet PLV supprimé']);
            break;

        default:
            errorResponse('Méthode non autorisée', 405);
    }

} catch (PDOException $e) {
    error_log("Erreur plv/projects: " . $e->getMessage());
    errorResponse('Erreur serveur: ' . $e->getMessage(), 500);
}