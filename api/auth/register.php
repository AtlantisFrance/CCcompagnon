<?php
/**
 * ============================================
 * 📝 INSCRIPTION UTILISATEUR
 * ============================================
 * 
 * Endpoint: POST /api/auth/register.php
 * 
 * Body JSON:
 * {
 *   "email": "user@example.com",
 *   "password": "motdepasse",
 *   "first_name": "Prénom",
 *   "last_name": "Nom",
 *   "company": "Ma Société"
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
$firstName = getRequired($data, 'first_name');
$lastName = getRequired($data, 'last_name');

// Champ optionnel
$company = getOptional($data, 'company');

// Valider le format email
if (!isValidEmail($email)) {
    errorResponse('Format d\'email invalide', 400);
}

// Valider le mot de passe
if (!isValidPassword($password)) {
    errorResponse('Le mot de passe doit contenir au moins 8 caractères', 400);
}

// Normaliser l'email (minuscules)
$email = strtolower($email);

try {
    $db = getDB();
    
    // Vérifier si l'email existe déjà
    $stmt = $db->prepare("SELECT id FROM users WHERE email = :email");
    $stmt->execute([':email' => $email]);
    
    if ($stmt->fetch()) {
        errorResponse('Cette adresse email est déjà utilisée', 409);
    }
    
    // Hasher le mot de passe
    $passwordHash = hashPassword($password);
    
    // Générer un token de vérification email
    $verificationToken = generateToken(32);
    
    // Insérer l'utilisateur
    $stmt = $db->prepare("
        INSERT INTO users (
            email, 
            password_hash, 
            first_name, 
            last_name, 
            company,
            status,
            email_verification_token
        ) VALUES (
            :email,
            :password_hash,
            :first_name,
            :last_name,
            :company,
            :status,
            :verification_token
        )
    ");
    
    $stmt->execute([
        ':email' => $email,
        ':password_hash' => $passwordHash,
        ':first_name' => $firstName,
        ':last_name' => $lastName,
        ':company' => $company,
        ':status' => 'pending',
        ':verification_token' => $verificationToken
    ]);
    
    $userId = $db->lastInsertId();
    
    // Logger l'activité
    logActivity($userId, 'register', 'user', $userId, [
        'email' => $email,
        'ip' => getClientIP()
    ]);
    
    // Réponse succès
    successResponse([
        'user_id' => (int)$userId,
        'email' => $email,
        'status' => 'pending',
        'message' => 'Compte créé avec succès. En attente de validation par un administrateur.'
    ], 'Inscription réussie');
    
} catch (PDOException $e) {
    error_log("Erreur inscription: " . $e->getMessage());
    errorResponse('Erreur lors de l\'inscription', 500);
}