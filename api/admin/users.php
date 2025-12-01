<?php
/**
 * ============================================
 * 👥 ADMIN - GESTION DES UTILISATEURS
 * ============================================
 * 
 * GET    /api/admin/users.php           → Liste tous les utilisateurs
 * GET    /api/admin/users.php?id=X      → Détails d'un utilisateur
 * PUT    /api/admin/users.php           → Modifier un utilisateur
 * DELETE /api/admin/users.php?id=X      → Supprimer un utilisateur
 */

require_once __DIR__ . '/../config/init.php';

// Vérifier que c'est un super_admin
$currentUser = requireGlobalRole('super_admin');

$method = $_SERVER['REQUEST_METHOD'];

try {
    $db = getDB();

    switch ($method) {
        // ============================================
        // GET - Liste ou détails utilisateur
        // ============================================
        case 'GET':
            if (isset($_GET['id'])) {
                // Détails d'un utilisateur
                $stmt = $db->prepare("
                    SELECT id, email, first_name, last_name, company, 
                           global_role, status, email_verified,
                           created_at, updated_at, last_login_at, login_count, admin_notes
                    FROM users 
                    WHERE id = :id
                ");
                $stmt->execute([':id' => $_GET['id']]);
                $user = $stmt->fetch();

                if (!$user) {
                    errorResponse('Utilisateur non trouvé', 404);
                }

                // Récupérer ses rôles dans les espaces
                $stmt = $db->prepare("
                    SELECT usr.*, s.slug as space_slug, s.name as space_name,
                           z.slug as zone_slug, z.name as zone_name
                    FROM user_space_roles usr
                    JOIN spaces s ON s.id = usr.space_id
                    LEFT JOIN zones z ON z.id = usr.zone_id
                    WHERE usr.user_id = :user_id
                ");
                $stmt->execute([':user_id' => $_GET['id']]);
                $user['space_roles'] = $stmt->fetchAll();

                successResponse(['user' => $user]);
            } else {
                // Liste tous les utilisateurs
                $stmt = $db->query("
                    SELECT id, email, first_name, last_name, company,
                           global_role, status, email_verified,
                           created_at, last_login_at, login_count
                    FROM users
                    ORDER BY created_at DESC
                ");
                $users = $stmt->fetchAll();

                // Stats globales
                $stats = [
                    'total' => count($users),
                    'active' => count(array_filter($users, fn($u) => $u['status'] === 'active')),
                    'pending' => count(array_filter($users, fn($u) => $u['status'] === 'pending')),
                    'suspended' => count(array_filter($users, fn($u) => $u['status'] === 'suspended')),
                    'super_admins' => count(array_filter($users, fn($u) => $u['global_role'] === 'super_admin')),
                ];

                successResponse(['users' => $users, 'stats' => $stats]);
            }
            break;

        // ============================================
        // PUT - Modifier un utilisateur
        // ============================================
        case 'PUT':
            $data = getPostData();
            $userId = getRequired($data, 'id');

            // Vérifier que l'utilisateur existe
            $stmt = $db->prepare("SELECT id, email FROM users WHERE id = :id");
            $stmt->execute([':id' => $userId]);
            $user = $stmt->fetch();

            if (!$user) {
                errorResponse('Utilisateur non trouvé', 404);
            }

            // Construire la requête de mise à jour
            $updates = [];
            $params = [':id' => $userId];

            if (isset($data['status']) && in_array($data['status'], ['pending', 'active', 'suspended'])) {
                $updates[] = 'status = :status';
                $params[':status'] = $data['status'];
            }

            if (isset($data['global_role']) && in_array($data['global_role'], ['user', 'super_admin'])) {
                $updates[] = 'global_role = :global_role';
                $params[':global_role'] = $data['global_role'];
            }

            if (isset($data['first_name'])) {
                $updates[] = 'first_name = :first_name';
                $params[':first_name'] = trim($data['first_name']);
            }

            if (isset($data['last_name'])) {
                $updates[] = 'last_name = :last_name';
                $params[':last_name'] = trim($data['last_name']);
            }

            if (isset($data['company'])) {
                $updates[] = 'company = :company';
                $params[':company'] = trim($data['company']);
            }

            if (isset($data['admin_notes'])) {
                $updates[] = 'admin_notes = :admin_notes';
                $params[':admin_notes'] = trim($data['admin_notes']);
            }

            if (empty($updates)) {
                errorResponse('Aucune modification fournie', 400);
            }

            $sql = "UPDATE users SET " . implode(', ', $updates) . " WHERE id = :id";
            $stmt = $db->prepare($sql);
            $stmt->execute($params);

            // Logger l'action
            logActivity($currentUser['id'], 'user_updated', 'user', $userId, $data);

            successResponse(['message' => 'Utilisateur mis à jour']);
            break;

        // ============================================
        // DELETE - Supprimer un utilisateur
        // ============================================
        case 'DELETE':
            if (!isset($_GET['id'])) {
                errorResponse('ID utilisateur requis', 400);
            }

            $userId = $_GET['id'];

            // Ne pas pouvoir se supprimer soi-même
            if ($userId == $currentUser['id']) {
                errorResponse('Vous ne pouvez pas supprimer votre propre compte', 400);
            }

            // Vérifier que l'utilisateur existe
            $stmt = $db->prepare("SELECT id, email FROM users WHERE id = :id");
            $stmt->execute([':id' => $userId]);
            $user = $stmt->fetch();

            if (!$user) {
                errorResponse('Utilisateur non trouvé', 404);
            }

            // Supprimer (les cascades s'occupent des sessions et rôles)
            $stmt = $db->prepare("DELETE FROM users WHERE id = :id");
            $stmt->execute([':id' => $userId]);

            // Logger l'action
            logActivity($currentUser['id'], 'user_deleted', 'user', $userId, ['email' => $user['email']]);

            successResponse(['message' => 'Utilisateur supprimé']);
            break;

        default:
            errorResponse('Méthode non autorisée', 405);
    }

} catch (PDOException $e) {
    error_log("Erreur admin/users: " . $e->getMessage());
    errorResponse('Erreur serveur', 500);
}
