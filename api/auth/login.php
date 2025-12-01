<?php
/**
 * ============================================
 * 🔐 CONNEXION UTILISATEUR
 * ============================================
 * 
 * Endpoint: POST /api/auth/login.php
 * 
 * Body JSON:
 * {
 *   "email": "user@example.com",
 *   "password": "motdepasse"
 * }
 */

require_once __DIR__ . '/../config/init.php';

// Vérifier la méthode
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    errorResponse('Méthode non autorisée', 405);
}

// Récupérer les données
$data = getPostData();

// Validation des champs obligatoires
$email = getRequired($data, 'email');
$password = getRequired($data, 'password');

// Normaliser l'email
$email = strtolower(trim($email));

try {
    $db = getDB();
    
    // Récupérer l'utilisateur
    $stmt = $db->prepare("
        SELECT id, email, password_hash, first_name, last_name, 
               global_role, status, company, phone, avatar_url
        FROM users 
        WHERE email = :email
    ");
    $stmt->execute([':email' => $email]);
    $user = $stmt->fetch();
    
    // Vérifier que l'utilisateur existe
    if (!$user) {
        // Logger la tentative échouée
        logActivity(null, 'login_failed', 'user', null, [
            'email' => $email,
            'reason' => 'user_not_found',
            'ip' => getClientIP()
        ]);
        errorResponse('Email ou mot de passe incorrect', 401);
    }
    
    // Vérifier le mot de passe
    if (!verifyPassword($password, $user['password_hash'])) {
        logActivity($user['id'], 'login_failed', 'user', $user['id'], [
            'reason' => 'wrong_password',
            'ip' => getClientIP()
        ]);
        errorResponse('Email ou mot de passe incorrect', 401);
    }
    
    // Vérifier le statut du compte
    if ($user['status'] === 'pending') {
        errorResponse('Votre compte est en attente de validation par un administrateur', 403);
    }
    
    if ($user['status'] === 'suspended') {
        errorResponse('Votre compte a été suspendu. Contactez un administrateur.', 403);
    }
    
    // Créer la session
    $token = createSession($user['id']);
    
    // Mettre à jour les stats de connexion
    $stmt = $db->prepare("
        UPDATE users 
        SET last_login_at = NOW(), login_count = login_count + 1 
        WHERE id = :id
    ");
    $stmt->execute([':id' => $user['id']]);
    
    // Logger la connexion réussie
    logActivity($user['id'], 'login_success', 'user', $user['id'], [
        'ip' => getClientIP()
    ]);
    
    // Récupérer les rôles dans les espaces
    $stmt = $db->prepare("
        SELECT usr.*, s.slug as space_slug, s.name as space_name, 
               z.slug as zone_slug, z.name as zone_name
        FROM user_space_roles usr
        JOIN spaces s ON usr.space_id = s.id
        LEFT JOIN zones z ON usr.zone_id = z.id
        WHERE usr.user_id = :user_id
    ");
    $stmt->execute([':user_id' => $user['id']]);
    $spaceRoles = $stmt->fetchAll();
    
    // Préparer les données utilisateur (sans le hash)
    $userData = [
        'id' => (int)$user['id'],
        'email' => $user['email'],
        'first_name' => $user['first_name'],
        'last_name' => $user['last_name'],
        'company' => $user['company'],
        'phone' => $user['phone'],
        'avatar_url' => $user['avatar_url'],
        'global_role' => $user['global_role'],
        'space_roles' => $spaceRoles
    ];
    
    // Définir le cookie (optionnel, le token peut aussi être stocké côté client)
    setcookie('atlantis_token', $token, [
        'expires' => time() + JWT_EXPIRY,
        'path' => '/',
        'domain' => '', // Sera automatiquement le domaine actuel
        'secure' => true,
        'httponly' => false, // false pour que JS puisse le lire
        'samesite' => 'None' // Nécessaire pour cross-origin
    ]);
    
    // Réponse succès
    successResponse([
        'token' => $token,
        'expires_in' => JWT_EXPIRY,
        'user' => $userData
    ], 'Connexion réussie');
    
} catch (PDOException $e) {
    error_log("Erreur connexion: " . $e->getMessage());
    errorResponse('Erreur lors de la connexion', 500);
}