<?php
/**
 * ============================================
 * 🚪 DÉCONNEXION UTILISATEUR
 * ============================================
 * 
 * Endpoint: POST /api/auth/logout.php
 * Header: Authorization: Bearer <token> (optionnel)
 * 
 * Note: Le logout est tolérant - même sans token valide,
 * on retourne success car la déconnexion côté client est prioritaire.
 */

require_once __DIR__ . '/../config/init.php';

// Vérifier la méthode
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    errorResponse('Méthode non autorisée', 405);
}

// Récupérer le token (optionnel maintenant)
$token = getAuthToken();

try {
    $db = getDB();
    
    if ($token) {
        // Récupérer l'utilisateur avant de supprimer la session
        $stmt = $db->prepare("
            SELECT user_id FROM user_sessions WHERE token = :token
        ");
        $stmt->execute([':token' => $token]);
        $session = $stmt->fetch();
        
        // Désactiver la session
        $stmt = $db->prepare("
            UPDATE user_sessions 
            SET is_active = 0 
            WHERE token = :token
        ");
        $stmt->execute([':token' => $token]);
        
        // Logger la déconnexion
        if ($session) {
            logActivity($session['user_id'], 'logout', 'user', $session['user_id'], [
                'ip' => getClientIP()
            ]);
        }
    }
    
    // Supprimer le cookie (même si pas de token)
    setcookie('atlantis_token', '', [
        'expires' => time() - 3600,
        'path' => '/',
        'secure' => true,
        'httponly' => false,
        'samesite' => 'None'
    ]);
    
    // Toujours retourner succès
    successResponse([], 'Déconnexion réussie');
    
} catch (PDOException $e) {
    error_log("Erreur déconnexion: " . $e->getMessage());
    // Même en cas d'erreur BDD, on considère le logout OK côté client
    successResponse([], 'Déconnexion réussie');
}