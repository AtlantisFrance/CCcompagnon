<?php
/**
 * ============================================
 * 🎭 ADMIN - GESTION DES RÔLES
 * ============================================
 * 
 * GET    /api/admin/roles.php?user_id=X   → Rôles d'un utilisateur
 * GET    /api/admin/roles.php?space_id=X  → Rôles dans un espace
 * POST   /api/admin/roles.php             → Assigner un rôle
 * DELETE /api/admin/roles.php?id=X        → Supprimer un rôle
 */

require_once __DIR__ . '/../config/init.php';

// Vérifier que c'est un super_admin
$currentUser = requireGlobalRole('super_admin');

$method = $_SERVER['REQUEST_METHOD'];

try {
    $db = getDB();

    switch ($method) {
        // ============================================
        // GET - Liste des rôles
        // ============================================
        case 'GET':
            if (isset($_GET['user_id'])) {
                // Rôles d'un utilisateur spécifique
                $stmt = $db->prepare("
                    SELECT usr.*, 
                           s.slug as space_slug, s.name as space_name,
                           z.slug as zone_slug, z.name as zone_name,
                           g.first_name as granted_by_first_name, g.last_name as granted_by_last_name
                    FROM user_space_roles usr
                    JOIN spaces s ON s.id = usr.space_id
                    LEFT JOIN zones z ON z.id = usr.zone_id
                    LEFT JOIN users g ON g.id = usr.granted_by
                    WHERE usr.user_id = :user_id
                    ORDER BY s.name, z.name
                ");
                $stmt->execute([':user_id' => $_GET['user_id']]);
                $roles = $stmt->fetchAll();

                successResponse(['roles' => $roles]);

            } elseif (isset($_GET['space_id'])) {
                // Tous les rôles dans un espace
                $stmt = $db->prepare("
                    SELECT usr.*, 
                           u.email, u.first_name, u.last_name,
                           z.slug as zone_slug, z.name as zone_name
                    FROM user_space_roles usr
                    JOIN users u ON u.id = usr.user_id
                    LEFT JOIN zones z ON z.id = usr.zone_id
                    WHERE usr.space_id = :space_id
                    ORDER BY usr.role DESC, u.last_name
                ");
                $stmt->execute([':space_id' => $_GET['space_id']]);
                $roles = $stmt->fetchAll();

                successResponse(['roles' => $roles]);

            } else {
                // Tous les rôles
                $stmt = $db->query("
                    SELECT usr.*, 
                           u.email, u.first_name, u.last_name,
                           s.slug as space_slug, s.name as space_name,
                           z.slug as zone_slug, z.name as zone_name
                    FROM user_space_roles usr
                    JOIN users u ON u.id = usr.user_id
                    JOIN spaces s ON s.id = usr.space_id
                    LEFT JOIN zones z ON z.id = usr.zone_id
                    ORDER BY s.name, usr.role DESC, u.last_name
                ");
                $roles = $stmt->fetchAll();

                successResponse(['roles' => $roles]);
            }
            break;

        // ============================================
        // POST - Assigner un rôle
        // ============================================
        case 'POST':
            $data = getPostData();
            
            $userId = getRequired($data, 'user_id');
            $spaceId = getRequired($data, 'space_id');
            $role = getRequired($data, 'role');
            $zoneId = getOptional($data, 'zone_id'); // NULL = tout l'espace

            // Convertir en int si présent
            $userId = (int)$userId;
            $spaceId = (int)$spaceId;
            $zoneId = $zoneId ? (int)$zoneId : null;

            // Valider le rôle
            if (!in_array($role, ['viewer', 'zone_admin', 'space_admin'])) {
                errorResponse('Rôle invalide. Valeurs acceptées: viewer, zone_admin, space_admin', 400);
            }

            // Vérifier que l'utilisateur existe
            $stmt = $db->prepare("SELECT id, email FROM users WHERE id = :id");
            $stmt->execute([':id' => $userId]);
            $user = $stmt->fetch();
            if (!$user) {
                errorResponse('Utilisateur non trouvé', 404);
            }

            // Vérifier que l'espace existe
            $stmt = $db->prepare("SELECT id, name FROM spaces WHERE id = :id");
            $stmt->execute([':id' => $spaceId]);
            $space = $stmt->fetch();
            if (!$space) {
                errorResponse('Espace non trouvé', 404);
            }

            // Si zone_id fourni, vérifier qu'elle existe et appartient à l'espace
            $zone = null;
            if ($zoneId) {
                $stmt = $db->prepare("SELECT id, name FROM zones WHERE id = :id AND space_id = :space_id");
                $stmt->execute([':id' => $zoneId, ':space_id' => $spaceId]);
                $zone = $stmt->fetch();
                if (!$zone) {
                    errorResponse('Zone non trouvée dans cet espace', 404);
                }
            }

            // Si c'est un space_admin, zone_id doit être NULL
            if ($role === 'space_admin' && $zoneId) {
                errorResponse('Un space_admin ne peut pas être assigné à une zone spécifique', 400);
            }

            // Si c'est un zone_admin, zone_id est requis
            if ($role === 'zone_admin' && !$zoneId) {
                errorResponse('Un zone_admin doit être assigné à une zone spécifique', 400);
            }

            // Vérifier si le rôle existe déjà (gestion correcte de NULL)
            if ($zoneId) {
                $stmt = $db->prepare("
                    SELECT id FROM user_space_roles 
                    WHERE user_id = :user_id AND space_id = :space_id AND zone_id = :zone_id
                ");
                $stmt->execute([':user_id' => $userId, ':space_id' => $spaceId, ':zone_id' => $zoneId]);
            } else {
                $stmt = $db->prepare("
                    SELECT id FROM user_space_roles 
                    WHERE user_id = :user_id AND space_id = :space_id AND zone_id IS NULL
                ");
                $stmt->execute([':user_id' => $userId, ':space_id' => $spaceId]);
            }
            
            if ($stmt->fetch()) {
                errorResponse('Ce rôle existe déjà pour cet utilisateur dans cet espace/zone', 409);
            }

            // Créer le rôle
            $stmt = $db->prepare("
                INSERT INTO user_space_roles (user_id, space_id, zone_id, role, granted_by)
                VALUES (:user_id, :space_id, :zone_id, :role, :granted_by)
            ");
            $stmt->execute([
                ':user_id' => $userId,
                ':space_id' => $spaceId,
                ':zone_id' => $zoneId,
                ':role' => $role,
                ':granted_by' => $currentUser['id']
            ]);

            $roleId = $db->lastInsertId();

            // Logger l'action
            logActivity($currentUser['id'], 'role_assigned', 'user_space_roles', $roleId, [
                'user_email' => $user['email'],
                'space' => $space['name'],
                'zone' => $zone['name'] ?? 'Tout l\'espace',
                'role' => $role
            ]);

            successResponse([
                'role_id' => (int)$roleId, 
                'message' => 'Rôle assigné avec succès'
            ]);
            break;

        // ============================================
        // DELETE - Supprimer un rôle
        // ============================================
        case 'DELETE':
            if (!isset($_GET['id'])) {
                errorResponse('ID rôle requis', 400);
            }

            $roleId = (int)$_GET['id'];

            // Vérifier que le rôle existe
            $stmt = $db->prepare("
                SELECT usr.*, u.email, s.name as space_name
                FROM user_space_roles usr
                JOIN users u ON u.id = usr.user_id
                JOIN spaces s ON s.id = usr.space_id
                WHERE usr.id = :id
            ");
            $stmt->execute([':id' => $roleId]);
            $role = $stmt->fetch();

            if (!$role) {
                errorResponse('Rôle non trouvé', 404);
            }

            // Supprimer
            $stmt = $db->prepare("DELETE FROM user_space_roles WHERE id = :id");
            $stmt->execute([':id' => $roleId]);

            // Logger l'action
            logActivity($currentUser['id'], 'role_removed', 'user_space_roles', $roleId, [
                'user_email' => $role['email'],
                'space' => $role['space_name']
            ]);

            successResponse(['message' => 'Rôle supprimé']);
            break;

        default:
            errorResponse('Méthode non autorisée', 405);
    }

} catch (PDOException $e) {
    error_log("Erreur admin/roles: " . $e->getMessage());
    errorResponse('Erreur serveur: ' . $e->getMessage(), 500);
}