<?php
/**
 * ============================================
 * 📦 ADMIN - GESTION DES ESPACES
 * ============================================
 * 
 * GET    /api/admin/spaces.php           → Liste tous les espaces
 * GET    /api/admin/spaces.php?id=X      → Détails d'un espace
 * POST   /api/admin/spaces.php           → Créer un espace
 * PUT    /api/admin/spaces.php           → Modifier un espace
 * DELETE /api/admin/spaces.php?id=X      → Supprimer un espace
 */

require_once __DIR__ . '/../config/init.php';

// Vérifier que c'est un super_admin
$currentUser = requireGlobalRole('super_admin');

$method = $_SERVER['REQUEST_METHOD'];

try {
    $db = getDB();

    switch ($method) {
        // ============================================
        // GET - Liste ou détails espace
        // ============================================
        case 'GET':
            if (isset($_GET['id'])) {
                // Détails d'un espace
                $stmt = $db->prepare("SELECT * FROM spaces WHERE id = :id");
                $stmt->execute([':id' => $_GET['id']]);
                $space = $stmt->fetch();

                if (!$space) {
                    errorResponse('Espace non trouvé', 404);
                }

                // Récupérer ses zones (sans zone_contents)
                $stmt = $db->prepare("
                    SELECT z.*
                    FROM zones z
                    WHERE z.space_id = :space_id
                    ORDER BY z.name
                ");
                $stmt->execute([':space_id' => $_GET['id']]);
                $zones = $stmt->fetchAll();
                
                // Ajouter content_count = 0 pour compatibilité
                foreach ($zones as &$zone) {
                    $zone['content_count'] = 0;
                }
                $space['zones'] = $zones;

                // Récupérer les admins de l'espace
                $stmt = $db->prepare("
                    SELECT u.id, u.email, u.first_name, u.last_name, usr.role,
                           z.name as zone_name, z.slug as zone_slug
                    FROM user_space_roles usr
                    JOIN users u ON u.id = usr.user_id
                    LEFT JOIN zones z ON z.id = usr.zone_id
                    WHERE usr.space_id = :space_id
                    ORDER BY usr.role DESC, u.last_name
                ");
                $stmt->execute([':space_id' => $_GET['id']]);
                $space['admins'] = $stmt->fetchAll();

                successResponse(['space' => $space]);
            } else {
                // Liste tous les espaces avec stats
                $stmt = $db->query("
                    SELECT s.*,
                           (SELECT COUNT(*) FROM zones WHERE space_id = s.id) as zone_count,
                           (SELECT COUNT(*) FROM user_space_roles WHERE space_id = s.id) as admin_count
                    FROM spaces s
                    ORDER BY s.name
                ");
                $spaces = $stmt->fetchAll();

                successResponse(['spaces' => $spaces]);
            }
            break;

        // ============================================
        // POST - Créer un espace
        // ============================================
        case 'POST':
            $data = getPostData();
            
            $slug = getRequired($data, 'slug');
            $name = getRequired($data, 'name');
            $description = getOptional($data, 'description');
            $shapesparkUrl = getOptional($data, 'shapespark_url');

            // Valider le slug (alphanumérique + tirets)
            if (!preg_match('/^[a-z0-9-]+$/', $slug)) {
                errorResponse('Le slug ne peut contenir que des lettres minuscules, chiffres et tirets', 400);
            }

            // Vérifier unicité du slug
            $stmt = $db->prepare("SELECT id FROM spaces WHERE slug = :slug");
            $stmt->execute([':slug' => $slug]);
            if ($stmt->fetch()) {
                errorResponse('Ce slug est déjà utilisé', 409);
            }

            // Créer l'espace
            $stmt = $db->prepare("
                INSERT INTO spaces (slug, name, description, shapespark_url, is_active)
                VALUES (:slug, :name, :description, :shapespark_url, TRUE)
            ");
            $stmt->execute([
                ':slug' => $slug,
                ':name' => $name,
                ':description' => $description,
                ':shapespark_url' => $shapesparkUrl
            ]);

            $spaceId = $db->lastInsertId();

            // Logger l'action
            logActivity($currentUser['id'], 'space_created', 'space', $spaceId, ['slug' => $slug, 'name' => $name]);

            successResponse(['space_id' => (int)$spaceId, 'message' => 'Espace créé']);
            break;

        // ============================================
        // PUT - Modifier un espace
        // ============================================
        case 'PUT':
            $data = getPostData();
            $spaceId = getRequired($data, 'id');

            // Vérifier que l'espace existe
            $stmt = $db->prepare("SELECT id FROM spaces WHERE id = :id");
            $stmt->execute([':id' => $spaceId]);
            if (!$stmt->fetch()) {
                errorResponse('Espace non trouvé', 404);
            }

            // Construire la requête de mise à jour
            $updates = [];
            $params = [':id' => $spaceId];

            if (isset($data['name'])) {
                $updates[] = 'name = :name';
                $params[':name'] = trim($data['name']);
            }

            if (isset($data['description'])) {
                $updates[] = 'description = :description';
                $params[':description'] = trim($data['description']);
            }

            if (isset($data['shapespark_url'])) {
                $updates[] = 'shapespark_url = :shapespark_url';
                $params[':shapespark_url'] = trim($data['shapespark_url']);
            }

            if (isset($data['is_active'])) {
                $updates[] = 'is_active = :is_active';
                $params[':is_active'] = $data['is_active'] ? 1 : 0;
            }

            if (empty($updates)) {
                errorResponse('Aucune modification fournie', 400);
            }

            $sql = "UPDATE spaces SET " . implode(', ', $updates) . " WHERE id = :id";
            $stmt = $db->prepare($sql);
            $stmt->execute($params);

            // Logger l'action
            logActivity($currentUser['id'], 'space_updated', 'space', $spaceId, $data);

            successResponse(['message' => 'Espace mis à jour']);
            break;

        // ============================================
        // DELETE - Supprimer un espace
        // ============================================
        case 'DELETE':
            if (!isset($_GET['id'])) {
                errorResponse('ID espace requis', 400);
            }

            $spaceId = $_GET['id'];

            // Vérifier que l'espace existe
            $stmt = $db->prepare("SELECT id, slug, name FROM spaces WHERE id = :id");
            $stmt->execute([':id' => $spaceId]);
            $space = $stmt->fetch();

            if (!$space) {
                errorResponse('Espace non trouvé', 404);
            }

            // Supprimer (les cascades s'occupent des zones et rôles)
            $stmt = $db->prepare("DELETE FROM spaces WHERE id = :id");
            $stmt->execute([':id' => $spaceId]);

            // Logger l'action
            logActivity($currentUser['id'], 'space_deleted', 'space', $spaceId, ['slug' => $space['slug']]);

            successResponse(['message' => 'Espace supprimé']);
            break;

        default:
            errorResponse('Méthode non autorisée', 405);
    }

} catch (PDOException $e) {
    error_log("Erreur admin/spaces: " . $e->getMessage());
    errorResponse('Erreur serveur', 500);
}