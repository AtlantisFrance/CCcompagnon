<?php
/**
 * ============================================
 * 📊 ADMIN - DASHBOARD STATS
 * ============================================
 * 
 * GET /api/admin/dashboard.php → Stats globales pour le dashboard
 */

require_once __DIR__ . '/../config/init.php';

// Vérifier que c'est un super_admin
$currentUser = requireGlobalRole('super_admin');

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    errorResponse('Méthode non autorisée', 405);
}

try {
    $db = getDB();

    // Stats utilisateurs
    $userStats = $db->query("
        SELECT 
            COUNT(*) as total,
            SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active,
            SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
            SUM(CASE WHEN status = 'suspended' THEN 1 ELSE 0 END) as suspended,
            SUM(CASE WHEN global_role = 'super_admin' THEN 1 ELSE 0 END) as super_admins,
            SUM(CASE WHEN created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY) THEN 1 ELSE 0 END) as new_this_week
        FROM users
    ")->fetch();

    // Stats espaces
    $spaceStats = $db->query("
        SELECT 
            COUNT(*) as total,
            SUM(CASE WHEN is_active = 1 THEN 1 ELSE 0 END) as active
        FROM spaces
    ")->fetch();

    // Stats zones
    $zoneStats = $db->query("
        SELECT 
            COUNT(*) as total,
            SUM(CASE WHEN is_active = 1 THEN 1 ELSE 0 END) as active
        FROM zones
    ")->fetch();

    // Stats contenus
    $contentStats = $db->query("
        SELECT 
            COUNT(*) as total,
            SUM(CASE WHEN content_type = 'image' THEN 1 ELSE 0 END) as images,
            SUM(CASE WHEN content_type = 'texture' THEN 1 ELSE 0 END) as textures
        FROM zone_contents
    ")->fetch();

    // Stats rôles attribués
    $roleStats = $db->query("
        SELECT 
            COUNT(*) as total,
            SUM(CASE WHEN role = 'space_admin' THEN 1 ELSE 0 END) as space_admins,
            SUM(CASE WHEN role = 'zone_admin' THEN 1 ELSE 0 END) as zone_admins,
            SUM(CASE WHEN role = 'viewer' THEN 1 ELSE 0 END) as viewers
        FROM user_space_roles
    ")->fetch();

    // Activité récente (derniers 10 logs)
    $recentActivity = $db->query("
        SELECT al.*, u.email, u.first_name, u.last_name
        FROM activity_logs al
        LEFT JOIN users u ON u.id = al.user_id
        ORDER BY al.created_at DESC
        LIMIT 10
    ")->fetchAll();

    foreach ($recentActivity as &$activity) {
        if ($activity['details']) {
            $activity['details'] = json_decode($activity['details'], true);
        }
    }

    // Dernières connexions
    $recentLogins = $db->query("
        SELECT id, email, first_name, last_name, last_login_at, login_count
        FROM users
        WHERE last_login_at IS NOT NULL
        ORDER BY last_login_at DESC
        LIMIT 5
    ")->fetchAll();

    // Utilisateurs en attente
    $pendingUsers = $db->query("
        SELECT id, email, first_name, last_name, company, created_at
        FROM users
        WHERE status = 'pending'
        ORDER BY created_at DESC
        LIMIT 10
    ")->fetchAll();

    successResponse([
        'users' => $userStats,
        'spaces' => $spaceStats,
        'zones' => $zoneStats,
        'contents' => $contentStats,
        'roles' => $roleStats,
        'recent_activity' => $recentActivity,
        'recent_logins' => $recentLogins,
        'pending_users' => $pendingUsers
    ]);

} catch (PDOException $e) {
    error_log("Erreur admin/dashboard: " . $e->getMessage());
    errorResponse('Erreur serveur', 500);
}
