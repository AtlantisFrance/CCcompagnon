<?php
/**
 * ============================================
 * 📊 ADMIN - DASHBOARD
 * ============================================
 * * GET /api/admin/dashboard.php
 * Retourne les statistiques globales du CRM
 */

require_once __DIR__ . '/../config/init.php';

// Vérifier que c'est un super_admin
$currentUser = requireGlobalRole('super_admin');

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    errorResponse('Méthode non autorisée', 405);
}

try {
    $db = getDB();

    // === STATS UTILISATEURS ===
    $stmt = $db->query("
        SELECT 
            COUNT(*) as total,
            SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active,
            SUM(CASE WHEN status = 'suspended' THEN 1 ELSE 0 END) as suspended
        FROM users
    ");
    $userStats = $stmt->fetch();

    // === STATS ESPACES ===
    $stmt = $db->query("
        SELECT 
            COUNT(*) as total,
            SUM(CASE WHEN is_active = 1 THEN 1 ELSE 0 END) as active
        FROM spaces
    ");
    $spaceStats = $stmt->fetch();

    // === STATS ZONES ===
    $stmt = $db->query("
        SELECT 
            COUNT(*) as total,
            SUM(CASE WHEN is_active = 1 THEN 1 ELSE 0 END) as active
        FROM zones
    ");
    $zoneStats = $stmt->fetch();

    // === DERNIERS INSCRITS ===
    $stmt = $db->query("
        SELECT id, first_name, last_name, email, company, created_at 
        FROM users 
        ORDER BY created_at DESC 
        LIMIT 5
    ");
    $recentUsers = $stmt->fetchAll();

    // === ACTIVITÉ RÉCENTE ===
    $stmt = $db->query("
        SELECT al.*, u.first_name, u.last_name, u.email
        FROM activity_logs al
        LEFT JOIN users u ON u.id = al.user_id
        ORDER BY al.created_at DESC
        LIMIT 10
    ");
    $recentActivity = $stmt->fetchAll();

    // Décoder les détails JSON
    foreach ($recentActivity as &$activity) {
        if ($activity['details']) {
            $activity['details'] = json_decode($activity['details'], true);
        }
    }

    // === RÉPONSE ===
    successResponse([
        'users' => [
            'total' => (int)$userStats['total'],
            'active' => (int)$userStats['active'],
            'suspended' => (int)$userStats['suspended']
        ],
        'spaces' => [
            'total' => (int)$spaceStats['total'],
            'active' => (int)$spaceStats['active']
        ],
        'zones' => [
            'total' => (int)$zoneStats['total'],
            'active' => (int)$zoneStats['active']
        ],
        'recent_users' => $recentUsers,
        'recent_activity' => $recentActivity
    ]);

} catch (PDOException $e) {
    error_log("Erreur dashboard: " . $e->getMessage());
    errorResponse('Erreur serveur', 500);
}