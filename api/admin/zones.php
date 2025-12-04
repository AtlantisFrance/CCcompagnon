<?php
/**
 * ============================================
 * 📍 ADMIN - GESTION DES ZONES
 * ============================================
 * 
 * GET    /api/admin/zones.php?space_id=X  → Liste les zones d'un espace
 * GET    /api/admin/zones.php?id=X        → Détails d'une zone
 * POST   /api/admin/zones.php             → Créer une zone
 * PUT    /api/admin/zones.php             → Modifier une zone
 * DELETE /api/admin/zones.php?id=X        → Supprimer une zone
 */

require_once __DIR__ . '/../config/init.php';

// Vérifier que c'est un super_admin
$currentUser = requireGlobalRole('super_admin');

$method = $_SERVER['REQUEST_METHOD'];

try {
    $db = getDB();

    switch ($method) {
        // ============================================
        // GET - Liste ou détails zone
        // ============================================
        case 'GET':
            if (isset($_GET['id'])) {
                // Détails d'une zone
                $stmt = $db->prepare("
                    SELECT z.*, s.name as space_name, s.slug as space_slug
                    FROM zones z
                    JOIN spaces s ON s.id = z.space_id
                    WHERE z.id = :id
                ");
                $stmt->execute([':id' => $_GET['id']]);
                $zone = $stmt->fetch();

                if (!$zone) {
                    errorResponse('Zone non trouvée', 404);
                }

                // Récupérer les admins de la zone
                $stmt = $db->prepare("
                    SELECT u.id, u.email, u.first_name, u.last_name, usr.role
                    FROM user_space_roles usr
                    JOIN users u ON u.id = usr.user_id
                    WHERE usr.zone_id = :zone_id
                ");
                $stmt->execute([':zone_id' => $_GET['id']]);
                $zone['admins'] = $stmt->fetchAll();

                successResponse(['zone' => $zone]);

            } elseif (isset($_GET['space_id'])) {
                // Liste les zones d'un espace
                $stmt = $db->prepare("
                    SELECT z.*,
                           (SELECT COUNT(*) FROM user_space_roles WHERE zone_id = z.id) as admin_count
                    FROM zones z
                    WHERE z.space_id = :space_id
                    ORDER BY z.name
                ");
                $stmt->execute([':space_id' => $_GET['space_id']]);
                $zones = $stmt->fetchAll();

                // Ajouter content_count à 0 pour compatibilité
                foreach ($zones as &$zone) {
                    $zone['content_count'] = 0;
                }

                successResponse(['zones' => $zones]);
            } else {
                // Liste toutes les zones
                $stmt = $db->query("
                    SELECT z.*, s.name as space_name, s.slug as space_slug
                    FROM zones z
                    JOIN spaces s ON s.id = z.space_id
                    ORDER BY s.name, z.name
                ");
                $zones = $stmt->fetchAll();

                // Ajouter content_count à 0 pour compatibilité
                foreach ($zones as &$zone) {
                    $zone['content_count'] = 0;
                }

                successResponse(['zones' => $zones]);
            }
            break;

        // ============================================
        // POST - Créer une zone
        // ============================================
        case 'POST':
            $data = getPostData();
            
            $spaceId = getRequired($data, 'space_id');
            $slug = getRequired($data, 'slug');
            $name = getRequired($data, 'name');
            $description = getOptional($data, 'description');

            // Vérifier que l'espace existe
            $stmt = $db->prepare("SELECT id FROM spaces WHERE id = :id");
            $stmt->execute([':id' => $spaceId]);
            if (!$stmt->fetch()) {
                errorResponse('Espace non trouvé', 404);
            }

            // Valider le slug
            if (!preg_match('/^[a-z0-9-]+$/', $slug)) {
                errorResponse('Le slug ne peut contenir que des lettres minuscules, chiffres et tirets', 400);
            }

            // Vérifier unicité du slug dans cet espace
            $stmt = $db->prepare("SELECT id FROM zones WHERE space_id = :space_id AND slug = :slug");
            $stmt->execute([':space_id' => $spaceId, ':slug' => $slug]);
            if ($stmt->fetch()) {
                errorResponse('Ce slug est déjà utilisé dans cet espace', 409);
            }

            // Créer la zone
            $stmt = $db->prepare("
                INSERT INTO zones (space_id, slug, name, description, is_active)
                VALUES (:space_id, :slug, :name, :description, TRUE)
            ");
            $stmt->execute([
                ':space_id' => $spaceId,
                ':slug' => $slug,
                ':name' => $name,
                ':description' => $description
            ]);

            $zoneId = $db->lastInsertId();

            // Logger l'action
            logActivity($currentUser['id'], 'zone_created', 'zone', $zoneId, ['slug' => $slug, 'name' => $name]);

            successResponse(['zone_id' => (int)$zoneId, 'message' => 'Zone créée']);
            break;

        // ============================================
        // PUT - Modifier une zone
        // ============================================
        case 'PUT':
            $data = getPostData();
            $zoneId = getRequired($data, 'id');

            // Vérifier que la zone existe
            $stmt = $db->prepare("SELECT id FROM zones WHERE id = :id");
            $stmt->execute([':id' => $zoneId]);
            if (!$stmt->fetch()) {
                errorResponse('Zone non trouvée', 404);
            }

            // Construire la requête de mise à jour
            $updates = [];
            $params = [':id' => $zoneId];

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

            $sql = "UPDATE zones SET " . implode(', ', $updates) . " WHERE id = :id";
            $stmt = $db->prepare($sql);
            $stmt->execute($params);

            // Logger l'action
            logActivity($currentUser['id'], 'zone_updated', 'zone', $zoneId, $data);

            successResponse(['message' => 'Zone mise à jour']);
            break;

        // ============================================
        // DELETE - Supprimer une zone
        // ============================================
        case 'DELETE':
            if (!isset($_GET['id'])) {
                errorResponse('ID zone requis', 400);
            }

            $zoneId = $_GET['id'];

            // Vérifier que la zone existe
            $stmt = $db->prepare("SELECT id, slug, name FROM zones WHERE id = :id");
            $stmt->execute([':id' => $zoneId]);
            $zone = $stmt->fetch();

            if (!$zone) {
                errorResponse('Zone non trouvée', 404);
            }

            // Supprimer (les cascades s'occupent des rôles)
            $stmt = $db->prepare("DELETE FROM zones WHERE id = :id");
            $stmt->execute([':id' => $zoneId]);

            // Logger l'action
            logActivity($currentUser['id'], 'zone_deleted', 'zone', $zoneId, ['slug' => $zone['slug']]);

            successResponse(['message' => 'Zone supprimée']);
            break;

        default:
            errorResponse('Méthode non autorisée', 405);
    }

} catch (PDOException $e) {
    error_log("Erreur admin/zones: " . $e->getMessage());
    errorResponse('Erreur serveur', 500);
}