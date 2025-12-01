<?php
/**
 * ============================================
 * 📝 ADMIN - JOURNAL D'ACTIVITÉ
 * ============================================
 * 
 * GET /api/admin/logs.php              → Liste les logs (avec pagination)
 * GET /api/admin/logs.php?user_id=X    → Logs d'un utilisateur
 */

require_once __DIR__ . '/../config/init.php';

// Vérifier que c'est un super_admin
$currentUser = requireGlobalRole('super_admin');

$method = $_SERVER['REQUEST_METHOD'];

if ($method !== 'GET') {
    errorResponse('Méthode non autorisée', 405);
}

try {
    $db = getDB();

    // Paramètres de pagination
    $page = isset($_GET['page']) ? max(1, (int)$_GET['page']) : 1;
    $limit = isset($_GET['limit']) ? min(100, max(10, (int)$_GET['limit'])) : 50;
    $offset = ($page - 1) * $limit;

    // Filtres optionnels
    $where = [];
    $params = [];

    if (isset($_GET['user_id'])) {
        $where[] = 'al.user_id = :user_id';
        $params[':user_id'] = $_GET['user_id'];
    }

    if (isset($_GET['action'])) {
        $where[] = 'al.action = :action';
        $params[':action'] = $_GET['action'];
    }

    if (isset($_GET['entity_type'])) {
        $where[] = 'al.entity_type = :entity_type';
        $params[':entity_type'] = $_GET['entity_type'];
    }

    $whereClause = $where ? 'WHERE ' . implode(' AND ', $where) : '';

    // Compter le total
    $countSql = "SELECT COUNT(*) FROM activity_logs al $whereClause";
    $stmt = $db->prepare($countSql);
    $stmt->execute($params);
    $total = $stmt->fetchColumn();

    // Récupérer les logs
    $sql = "
        SELECT al.*, 
               u.email as user_email, u.first_name, u.last_name
        FROM activity_logs al
        LEFT JOIN users u ON u.id = al.user_id
        $whereClause
        ORDER BY al.created_at DESC
        LIMIT $limit OFFSET $offset
    ";
    $stmt = $db->prepare($sql);
    $stmt->execute($params);
    $logs = $stmt->fetchAll();

    // Décoder les détails JSON
    foreach ($logs as &$log) {
        if ($log['details']) {
            $log['details'] = json_decode($log['details'], true);
        }
    }

    // Stats par action (pour le dashboard)
    $statsSql = "
        SELECT action, COUNT(*) as count
        FROM activity_logs
        WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
        GROUP BY action
        ORDER BY count DESC
    ";
    $stats = $db->query($statsSql)->fetchAll();

    successResponse([
        'logs' => $logs,
        'pagination' => [
            'page' => $page,
            'limit' => $limit,
            'total' => (int)$total,
            'pages' => ceil($total / $limit)
        ],
        'stats' => $stats
    ]);

} catch (PDOException $e) {
    error_log("Erreur admin/logs: " . $e->getMessage());
    errorResponse('Erreur serveur', 500);
}
