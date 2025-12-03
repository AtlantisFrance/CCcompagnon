<?php
/**
 * ============================================
 * 📝 POPUP - LIST ALL
 * ============================================
 * 
 * GET /api/popups/list.php?space_slug=xxx
 * 
 * Liste toutes les popups d'un espace.
 * Accessible sans authentification (contenu public).
 * Utilisé pour le chargement initial dans Shapespark.
 */

require_once __DIR__ . '/../config/init.php';

// Vérifier la méthode
if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    errorResponse('Méthode non autorisée', 405);
}

// Paramètre requis
$spaceSlug = isset($_GET['space_slug']) ? trim($_GET['space_slug']) : '';

if (empty($spaceSlug)) {
    errorResponse('Paramètre space_slug requis', 400);
}

// Validation (sécurité)
if (!preg_match('/^[a-z0-9_-]+$/', $spaceSlug)) {
    errorResponse('Format space_slug invalide', 400);
}

try {
    $db = getDB();

    // Récupérer l'espace
    $stmt = $db->prepare("SELECT id, name FROM spaces WHERE slug = :slug AND is_active = 1");
    $stmt->execute([':slug' => $spaceSlug]);
    $space = $stmt->fetch();

    if (!$space) {
        errorResponse('Espace non trouvé', 404);
    }

    // Récupérer toutes les popups de l'espace
    $stmt = $db->prepare("
        SELECT 
            pc.id,
            pc.object_name,
            pc.shader_name,
            pc.format,
            pc.html_content,
            pc.updated_at,
            z.slug as zone_slug,
            z.name as zone_name
        FROM popup_contents pc
        LEFT JOIN zones z ON z.id = pc.zone_id
        WHERE pc.space_id = :space_id
        AND pc.is_active = 1
        ORDER BY pc.object_name
    ");
    $stmt->execute([':space_id' => $space['id']]);
    $popups = $stmt->fetchAll();

    // Formater en objet indexé par object_name pour accès rapide
    $popupsMap = [];
    foreach ($popups as $popup) {
        $popupsMap[$popup['object_name']] = [
            'id' => (int)$popup['id'],
            'object_name' => $popup['object_name'],
            'shader_name' => $popup['shader_name'],
            'format' => $popup['format'],
            'html_content' => $popup['html_content'],
            'zone_slug' => $popup['zone_slug'],
            'zone_name' => $popup['zone_name'],
            'updated_at' => $popup['updated_at']
        ];
    }

    successResponse([
        'space_slug' => $spaceSlug,
        'space_name' => $space['name'],
        'count' => count($popups),
        'popups' => $popupsMap
    ], 'OK');

} catch (PDOException $e) {
    error_log("Erreur popups/list: " . $e->getMessage());
    errorResponse('Erreur serveur', 500);
}