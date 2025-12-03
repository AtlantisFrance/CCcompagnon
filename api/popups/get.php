<?php
/**
 * ============================================
 * 📖 RÉCUPÉRATION POPUP CONTENT
 * ============================================
 * 
 * Endpoint: GET /api/popups/get.php
 * 
 * Params:
 *   - space_slug: slug de l'espace
 *   - object_name: nom de l'objet 3D
 * 
 * Retourne le contenu HTML + info template si disponible
 */

require_once __DIR__ . '/../config/init.php';

// Vérifier la méthode
if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    errorResponse('Méthode non autorisée', 405);
}

// Validation des paramètres
if (empty($_GET['space_slug'])) {
    errorResponse('Paramètre space_slug requis', 400);
}

if (empty($_GET['object_name'])) {
    errorResponse('Paramètre object_name requis', 400);
}

$spaceSlug = trim($_GET['space_slug']);
$objectName = trim($_GET['object_name']);

try {
    $db = getDB();

    // Récupérer l'espace
    $stmt = $db->prepare("SELECT id FROM spaces WHERE slug = :slug");
    $stmt->execute([':slug' => $spaceSlug]);
    $space = $stmt->fetch();

    if (!$space) {
        errorResponse('Espace non trouvé', 404);
    }

    // Récupérer le popup content avec info template
    $stmt = $db->prepare("
        SELECT 
            pc.id,
            pc.object_name,
            pc.template_type,
            pc.template_config,
            pc.html_content,
            pc.created_at,
            pc.updated_at,
            u.first_name as updated_by_first_name,
            u.last_name as updated_by_last_name
        FROM popup_contents pc
        LEFT JOIN users u ON u.id = pc.updated_by
        WHERE pc.space_id = :space_id AND pc.object_name = :object_name
    ");
    $stmt->execute([
        ':space_id' => $space['id'],
        ':object_name' => $objectName
    ]);
    $popup = $stmt->fetch();

    if (!$popup) {
        // Pas de contenu = retourner un objet vide mais succès
        successResponse([
            'popup' => null,
            'exists' => false
        ], 'Aucun contenu pour cet objet');
    }

    // Décoder le template_config si présent
    $templateConfig = null;
    if ($popup['template_config']) {
        $templateConfig = json_decode($popup['template_config'], true);
    }

    // Préparer la réponse
    $response = [
        'popup' => [
            'id' => (int)$popup['id'],
            'object_name' => $popup['object_name'],
            'template_type' => $popup['template_type'],
            'template_config' => $templateConfig,
            'html_content' => $popup['html_content'],
            'updated_by' => $popup['updated_by_first_name'] 
                ? $popup['updated_by_first_name'] . ' ' . $popup['updated_by_last_name']
                : null,
            'created_at' => $popup['created_at'],
            'updated_at' => $popup['updated_at']
        ],
        'exists' => true,
        'has_template' => !empty($popup['template_type'])
    ];

    successResponse($response);

} catch (PDOException $e) {
    error_log("Erreur popups/get: " . $e->getMessage());
    errorResponse('Erreur serveur', 500);
}