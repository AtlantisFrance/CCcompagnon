<?php
/**
 * ============================================
 * 📝 POPUP - GET CONTENT
 * ============================================
 * 
 * GET /api/popups/get.php?space_slug=xxx&object_name=xxx
 * 
 * Récupère le contenu HTML d'une popup spécifique.
 * Accessible sans authentification (contenu public).
 */

require_once __DIR__ . '/../config/init.php';

// Vérifier la méthode
if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    errorResponse('Méthode non autorisée', 405);
}

// Paramètres requis
$spaceSlug = isset($_GET['space_slug']) ? trim($_GET['space_slug']) : '';
$objectName = isset($_GET['object_name']) ? trim($_GET['object_name']) : '';

if (empty($spaceSlug) || empty($objectName)) {
    errorResponse('Paramètres space_slug et object_name requis', 400);
}

// Validation des paramètres (sécurité)
if (!preg_match('/^[a-z0-9_-]+$/', $spaceSlug)) {
    errorResponse('Format space_slug invalide', 400);
}

if (!preg_match('/^[a-z0-9_]+$/', $objectName)) {
    errorResponse('Format object_name invalide', 400);
}

try {
    $db = getDB();

    // Récupérer le space_id depuis le slug
    $stmt = $db->prepare("SELECT id FROM spaces WHERE slug = :slug AND is_active = 1");
    $stmt->execute([':slug' => $spaceSlug]);
    $space = $stmt->fetch();

    if (!$space) {
        errorResponse('Espace non trouvé', 404);
    }

    // Récupérer le contenu de la popup
    $stmt = $db->prepare("
        SELECT 
            pc.id,
            pc.object_name,
            pc.shader_name,
            pc.format,
            pc.html_content,
            pc.is_active,
            pc.updated_at,
            z.slug as zone_slug,
            z.name as zone_name
        FROM popup_contents pc
        LEFT JOIN zones z ON z.id = pc.zone_id
        WHERE pc.space_id = :space_id 
        AND pc.object_name = :object_name
        AND pc.is_active = 1
    ");
    $stmt->execute([
        ':space_id' => $space['id'],
        ':object_name' => $objectName
    ]);
    $popup = $stmt->fetch();

    if (!$popup) {
        // Pas de contenu = retourner vide (pas une erreur)
        successResponse([
            'exists' => false,
            'object_name' => $objectName,
            'html_content' => null
        ], 'Aucun contenu trouvé');
    }

    // Retourner le contenu
    successResponse([
        'exists' => true,
        'id' => (int)$popup['id'],
        'object_name' => $popup['object_name'],
        'shader_name' => $popup['shader_name'],
        'format' => $popup['format'],
        'html_content' => $popup['html_content'],
        'zone_slug' => $popup['zone_slug'],
        'zone_name' => $popup['zone_name'],
        'updated_at' => $popup['updated_at']
    ], 'OK');

} catch (PDOException $e) {
    error_log("Erreur popups/get: " . $e->getMessage());
    errorResponse('Erreur serveur', 500);
}