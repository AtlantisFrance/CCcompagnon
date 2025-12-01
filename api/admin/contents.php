<?php
/**
 * ============================================
 * 🖼️ ADMIN - GESTION DES CONTENUS
 * ============================================
 * 
 * GET    /api/admin/contents.php?zone_id=X  → Contenus d'une zone
 * POST   /api/admin/contents.php            → Créer un contenu
 * PUT    /api/admin/contents.php            → Modifier un contenu
 * DELETE /api/admin/contents.php?id=X       → Supprimer un contenu
 */

require_once __DIR__ . '/../config/init.php';

// Vérifier que c'est un super_admin (pour l'instant)
// TODO: Permettre aux zone_admin de modifier leurs zones
$currentUser = requireGlobalRole('super_admin');

$method = $_SERVER['REQUEST_METHOD'];

try {
    $db = getDB();

    switch ($method) {
        // ============================================
        // GET - Liste des contenus
        // ============================================
        case 'GET':
            if (isset($_GET['zone_id'])) {
                // Contenus d'une zone
                $stmt = $db->prepare("
                    SELECT zc.*, 
                           z.name as zone_name, z.slug as zone_slug,
                           s.name as space_name, s.slug as space_slug,
                           u.first_name as updated_by_first_name, u.last_name as updated_by_last_name
                    FROM zone_contents zc
                    JOIN zones z ON z.id = zc.zone_id
                    JOIN spaces s ON s.id = z.space_id
                    LEFT JOIN users u ON u.id = zc.updated_by
                    WHERE zc.zone_id = :zone_id
                    ORDER BY zc.content_key
                ");
                $stmt->execute([':zone_id' => $_GET['zone_id']]);
                $contents = $stmt->fetchAll();

                successResponse(['contents' => $contents]);

            } elseif (isset($_GET['space_id'])) {
                // Tous les contenus d'un espace
                $stmt = $db->prepare("
                    SELECT zc.*, 
                           z.name as zone_name, z.slug as zone_slug
                    FROM zone_contents zc
                    JOIN zones z ON z.id = zc.zone_id
                    WHERE z.space_id = :space_id
                    ORDER BY z.name, zc.content_key
                ");
                $stmt->execute([':space_id' => $_GET['space_id']]);
                $contents = $stmt->fetchAll();

                successResponse(['contents' => $contents]);

            } else {
                // Tous les contenus
                $stmt = $db->query("
                    SELECT zc.*, 
                           z.name as zone_name, z.slug as zone_slug,
                           s.name as space_name, s.slug as space_slug
                    FROM zone_contents zc
                    JOIN zones z ON z.id = zc.zone_id
                    JOIN spaces s ON s.id = z.space_id
                    ORDER BY s.name, z.name, zc.content_key
                ");
                $contents = $stmt->fetchAll();

                successResponse(['contents' => $contents]);
            }
            break;

        // ============================================
        // POST - Créer un contenu
        // ============================================
        case 'POST':
            $data = getPostData();
            
            $zoneId = getRequired($data, 'zone_id');
            $contentKey = getRequired($data, 'content_key');
            $contentType = getOptional($data, 'content_type', 'image');
            $contentValue = getRequired($data, 'content_value');
            $metadata = getOptional($data, 'metadata');

            // Vérifier que la zone existe
            $stmt = $db->prepare("SELECT id, name FROM zones WHERE id = :id");
            $stmt->execute([':id' => $zoneId]);
            $zone = $stmt->fetch();
            if (!$zone) {
                errorResponse('Zone non trouvée', 404);
            }

            // Valider le content_type
            if (!in_array($contentType, ['image', 'texture', 'video', 'text', 'url'])) {
                errorResponse('Type de contenu invalide', 400);
            }

            // Valider le content_key (alphanumérique + underscores)
            if (!preg_match('/^[a-z0-9_]+$/', $contentKey)) {
                errorResponse('Le content_key ne peut contenir que des lettres minuscules, chiffres et underscores', 400);
            }

            // Vérifier unicité du content_key dans cette zone
            $stmt = $db->prepare("SELECT id FROM zone_contents WHERE zone_id = :zone_id AND content_key = :content_key");
            $stmt->execute([':zone_id' => $zoneId, ':content_key' => $contentKey]);
            if ($stmt->fetch()) {
                errorResponse('Ce content_key existe déjà dans cette zone', 409);
            }

            // Créer le contenu
            $stmt = $db->prepare("
                INSERT INTO zone_contents (zone_id, content_key, content_type, content_value, metadata, is_active, updated_by)
                VALUES (:zone_id, :content_key, :content_type, :content_value, :metadata, TRUE, :updated_by)
            ");
            $stmt->execute([
                ':zone_id' => $zoneId,
                ':content_key' => $contentKey,
                ':content_type' => $contentType,
                ':content_value' => $contentValue,
                ':metadata' => $metadata ? json_encode($metadata) : null,
                ':updated_by' => $currentUser['id']
            ]);

            $contentId = $db->lastInsertId();

            // Logger l'action
            logActivity($currentUser['id'], 'content_created', 'zone_contents', $contentId, [
                'zone' => $zone['name'],
                'content_key' => $contentKey
            ]);

            successResponse(['content_id' => (int)$contentId, 'message' => 'Contenu créé']);
            break;

        // ============================================
        // PUT - Modifier un contenu
        // ============================================
        case 'PUT':
            $data = getPostData();
            $contentId = getRequired($data, 'id');

            // Vérifier que le contenu existe
            $stmt = $db->prepare("
                SELECT zc.*, z.name as zone_name 
                FROM zone_contents zc
                JOIN zones z ON z.id = zc.zone_id
                WHERE zc.id = :id
            ");
            $stmt->execute([':id' => $contentId]);
            $content = $stmt->fetch();
            
            if (!$content) {
                errorResponse('Contenu non trouvé', 404);
            }

            // Construire la requête de mise à jour
            $updates = ['updated_by = :updated_by'];
            $params = [':id' => $contentId, ':updated_by' => $currentUser['id']];

            if (isset($data['content_value'])) {
                $updates[] = 'content_value = :content_value';
                $params[':content_value'] = trim($data['content_value']);
            }

            if (isset($data['content_type'])) {
                if (!in_array($data['content_type'], ['image', 'texture', 'video', 'text', 'url'])) {
                    errorResponse('Type de contenu invalide', 400);
                }
                $updates[] = 'content_type = :content_type';
                $params[':content_type'] = $data['content_type'];
            }

            if (isset($data['metadata'])) {
                $updates[] = 'metadata = :metadata';
                $params[':metadata'] = json_encode($data['metadata']);
            }

            if (isset($data['is_active'])) {
                $updates[] = 'is_active = :is_active';
                $params[':is_active'] = $data['is_active'] ? 1 : 0;
            }

            $sql = "UPDATE zone_contents SET " . implode(', ', $updates) . " WHERE id = :id";
            $stmt = $db->prepare($sql);
            $stmt->execute($params);

            // Logger l'action
            logActivity($currentUser['id'], 'content_updated', 'zone_contents', $contentId, [
                'zone' => $content['zone_name'],
                'content_key' => $content['content_key'],
                'changes' => $data
            ]);

            successResponse(['message' => 'Contenu mis à jour']);
            break;

        // ============================================
        // DELETE - Supprimer un contenu
        // ============================================
        case 'DELETE':
            if (!isset($_GET['id'])) {
                errorResponse('ID contenu requis', 400);
            }

            $contentId = $_GET['id'];

            // Vérifier que le contenu existe
            $stmt = $db->prepare("
                SELECT zc.*, z.name as zone_name 
                FROM zone_contents zc
                JOIN zones z ON z.id = zc.zone_id
                WHERE zc.id = :id
            ");
            $stmt->execute([':id' => $contentId]);
            $content = $stmt->fetch();

            if (!$content) {
                errorResponse('Contenu non trouvé', 404);
            }

            // Supprimer
            $stmt = $db->prepare("DELETE FROM zone_contents WHERE id = :id");
            $stmt->execute([':id' => $contentId]);

            // Logger l'action
            logActivity($currentUser['id'], 'content_deleted', 'zone_contents', $contentId, [
                'zone' => $content['zone_name'],
                'content_key' => $content['content_key']
            ]);

            successResponse(['message' => 'Contenu supprimé']);
            break;

        default:
            errorResponse('Méthode non autorisée', 405);
    }

} catch (PDOException $e) {
    error_log("Erreur admin/contents: " . $e->getMessage());
    errorResponse('Erreur serveur', 500);
}
