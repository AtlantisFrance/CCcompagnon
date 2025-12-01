<?php
/**
 * ============================================
 * 👤 INFORMATIONS UTILISATEUR CONNECTÉ
 * ============================================
 * 
 * Endpoint: GET /api/auth/me.php
 * Header: Authorization: Bearer <token>
 */

require_once __DIR__ . '/../config/init.php';

// Vérifier la méthode
if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    errorResponse('Méthode non autorisée', 405);
}

// Récupérer le token et valider
$token = getAuthToken();

if (!$token) {
    errorResponse('Non authentifié', 401);
}

$user = validateToken($token);

if (!$user) {
    errorResponse('Session invalide ou expirée', 401);
}

try {
    $db = getDB();
    
    // Récupérer les rôles dans les espaces
    $stmt = $db->prepare("
        SELECT usr.role, usr.space_id, usr.zone_id,
               s.slug as space_slug, s.name as space_name,
               z.slug as zone_slug, z.name as zone_name
        FROM user_space_roles usr
        JOIN spaces s ON usr.space_id = s.id
        LEFT JOIN zones z ON usr.zone_id = z.id
        WHERE usr.user_id = :user_id
        ORDER BY s.name, z.name
    ");
    $stmt->execute([':user_id' => $user['id']]);
    $spaceRoles = $stmt->fetchAll();
    
    // Formater les données utilisateur
    $userData = [
        'id' => (int)$user['id'],
        'email' => $user['email'],
        'first_name' => $user['first_name'],
        'last_name' => $user['last_name'],
        'company' => $user['company'],
        'phone' => $user['phone'],
        'avatar_url' => $user['avatar_url'],
        'global_role' => $user['global_role'],
        'status' => $user['status'],
        'email_verified' => (bool)$user['email_verified'],
        'created_at' => $user['created_at'],
        'last_login_at' => $user['last_login_at'],
        'space_roles' => $spaceRoles
    ];
    
    // Si super_admin, ajouter des stats
    if ($user['global_role'] === 'super_admin') {
        $stmt = $db->query("SELECT COUNT(*) as count FROM users");
        $totalUsers = $stmt->fetch()['count'];
        
        $stmt = $db->query("SELECT COUNT(*) as count FROM users WHERE status = 'pending'");
        $pendingUsers = $stmt->fetch()['count'];
        
        $stmt = $db->query("SELECT COUNT(*) as count FROM spaces");
        $totalSpaces = $stmt->fetch()['count'];
        
        $userData['admin_stats'] = [
            'total_users' => (int)$totalUsers,
            'pending_users' => (int)$pendingUsers,
            'total_spaces' => (int)$totalSpaces
        ];
    }
    
    successResponse([
        'user' => $userData
    ], 'OK');
    
} catch (PDOException $e) {
    error_log("Erreur me.php: " . $e->getMessage());
    errorResponse('Erreur serveur', 500);
}