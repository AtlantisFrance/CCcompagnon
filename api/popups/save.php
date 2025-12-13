<?php
/**
 * ============================================
 * 💾 API POPUPS - SAVE (Routeur Principal)
 * Atlantis City
 * v2.0 - 2024-12-10 - Architecture modulaire avec générateurs séparés
 * v2.1 - 2024-12-10 - Simplifié: seulement contact + iframe
 * v2.2 - 2024-12-10 - Ajout template YouTube
 * 
 * Sauvegarde un template popup + génère le fichier JS
 * Les générateurs sont dans /generators/*.gen.php
 * 
 * POST /api/popups/save.php
 * ============================================
 */

define('ATLANTIS_API', true);
require_once __DIR__ . '/../config/database.php';

// Charger les générateurs
require_once __DIR__ . '/generators/contact.gen.php';
require_once __DIR__ . '/generators/iframe.gen.php';
require_once __DIR__ . '/generators/youtube.gen.php';
require_once __DIR__ . '/generators/gallery3d.gen.php';
require_once __DIR__ . '/generators/product.gen.php';
// ============================================
// 🔧 UTILITAIRES PARTAGÉS
// ============================================

/**
 * Échappe une chaîne pour insertion dans du JS
 */
function escapeJS($str) {
    if (!$str) return "";
    return str_replace(
        ["\\", '"', "'", "\n", "\r"],
        ["\\\\", '\\"', "\\'", "\\n", "\\r"],
        $str
    );
}

/**
 * Dispatcher vers le bon générateur selon le type
 */
function generatePopupJS($objectName, $templateType, $config, $spaceSlug) {
    $timestamp = date('Y-m-d H:i:s');
    
    switch ($templateType) {
    case 'contact':
        return generateContactPopupJS($objectName, $config, $timestamp);
    case 'iframe':
        return generateIframePopupJS($objectName, $config, $timestamp);
    case 'youtube':
        return generateYoutubePopupJS($objectName, $config, $timestamp);
    case 'gallery3d':
        return generateGallery3dPopupJS($objectName, $config, $timestamp);
    case 'product':
        return generateProductPopupJS($objectName, $config, $timestamp);
    default:
        return generateGenericPopupJS($objectName, $templateType, $config, $timestamp);
    }
}

/**
 * Génère une popup générique (fallback pour types non implémentés)
 */
function generateGenericPopupJS($objectName, $templateType, $config, $timestamp) {
    $configJson = json_encode($config, JSON_UNESCAPED_UNICODE);
    
    return <<<JS
/**
 * 📄 Popup {$templateType} - {$objectName}
 * Généré le {$timestamp}
 */
(function() {
  "use strict";

  const POPUP_ID = "{$objectName}";
  const CONFIG = {$configJson};

  function show() {
    console.log("Popup {$objectName} - config:", CONFIG);
    alert("Template '{$templateType}' non implémenté");
  }

  function close() {}

  window.atlantisPopups = window.atlantisPopups || {};
  window.atlantisPopups[POPUP_ID] = { show, close, config: CONFIG };

  console.log("📄 Popup {$objectName} chargé");
})();
JS;
}

/**
 * Met à jour le manifest.json de l'espace
 */
function updateManifest($spaceDir, $objectName, $templateType) {
    $manifestPath = $spaceDir . '/manifest.json';
    
    $manifest = [];
    if (file_exists($manifestPath)) {
        $manifest = json_decode(file_get_contents($manifestPath), true) ?: [];
    }

    $manifest['updated_at'] = date('Y-m-d H:i:s');
    $manifest['popups'][$objectName] = [
        'type' => $templateType,
        'file' => $objectName . '-popup.js',
        'generated_at' => date('Y-m-d H:i:s')
    ];

    file_put_contents($manifestPath, json_encode($manifest, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
}

// ============================================
// 🌐 CORS & MÉTHODES
// ============================================

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Content-Type: application/json; charset=utf-8");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'error' => 'Méthode non autorisée']);
    exit;
}

// ============================================
// 🔐 AUTHENTIFICATION (Workaround OVH)
// ============================================

$rawBody = file_get_contents('php://input');
$data = json_decode($rawBody, true);

if (!$data) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'JSON invalide']);
    exit;
}

$token = null;
if (!empty($data['auth_token'])) {
    $token = $data['auth_token'];
}
if (!$token) {
    $headers = getallheaders();
    if (!empty($headers['Authorization'])) {
        $token = str_replace('Bearer ', '', $headers['Authorization']);
    }
}
if (!$token && !empty($_SERVER['HTTP_AUTHORIZATION'])) {
    $token = str_replace('Bearer ', '', $_SERVER['HTTP_AUTHORIZATION']);
}

if (!$token) {
    http_response_code(401);
    echo json_encode(['success' => false, 'error' => 'Non authentifié']);
    exit;
}

try {
    $db = getDB();
    
    $stmt = $db->prepare("
        SELECT u.*, us.token 
        FROM user_sessions us
        JOIN users u ON u.id = us.user_id
        WHERE us.token = :token 
        AND us.expires_at > NOW()
        AND u.status = 'active'
    ");
    $stmt->execute([':token' => $token]);
    $currentUser = $stmt->fetch();

    if (!$currentUser) {
        http_response_code(401);
        echo json_encode(['success' => false, 'error' => 'Token invalide ou expiré']);
        exit;
    }

    $stmt = $db->prepare("
        SELECT usr.role, s.slug as space_slug, z.slug as zone_slug
        FROM user_space_roles usr
        JOIN spaces s ON s.id = usr.space_id
        LEFT JOIN zones z ON z.id = usr.zone_id
        WHERE usr.user_id = :user_id
    ");
    $stmt->execute([':user_id' => $currentUser['id']]);
    $currentUser['space_roles'] = $stmt->fetchAll();

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Erreur authentification: ' . $e->getMessage()]);
    exit;
}

// ============================================
// 📝 TRAITEMENT DE LA REQUÊTE
// ============================================

try {
    $requiredFields = ['space_slug', 'object_name', 'template_type', 'template_config'];
    foreach ($requiredFields as $field) {
        if (empty($data[$field])) {
            http_response_code(400);
            echo json_encode(['success' => false, 'error' => "Champ requis manquant: $field"]);
            exit;
        }
    }

    $spaceSlug = trim($data['space_slug']);
    $objectName = trim($data['object_name']);
    $templateType = trim($data['template_type']);
    $templateConfig = $data['template_config'];
    $zoneSlug = !empty($data['zone_slug']) ? trim($data['zone_slug']) : '';
    $shaderName = !empty($data['shader_name']) ? trim($data['shader_name']) : '';
    $format = !empty($data['format']) ? trim($data['format']) : '';

    $stmt = $db->prepare("SELECT id, slug FROM spaces WHERE slug = :slug");
    $stmt->execute([':slug' => $spaceSlug]);
    $space = $stmt->fetch();

    if (!$space) {
        http_response_code(404);
        echo json_encode(['success' => false, 'error' => 'Espace non trouvé']);
        exit;
    }

    $zoneId = null;
    if ($zoneSlug) {
        $stmt = $db->prepare("SELECT id FROM zones WHERE slug = :slug AND space_id = :space_id");
        $stmt->execute([':slug' => $zoneSlug, ':space_id' => $space['id']]);
        $zone = $stmt->fetch();
        if ($zone) {
            $zoneId = $zone['id'];
        }
    }

    $hasAccess = false;
    if ($currentUser['global_role'] === 'super_admin') {
        $hasAccess = true;
    } else {
        $spaceRoles = $currentUser['space_roles'] ?? [];
        foreach ($spaceRoles as $role) {
            if ($role['space_slug'] === $spaceSlug) {
                if ($role['role'] === 'space_admin') {
                    $hasAccess = true;
                    break;
                }
                if ($role['role'] === 'zone_admin') {
                    $dbZoneSlug = $role['zone_slug'] ?? '';
                    $zoneMatches = (
                        $dbZoneSlug === $zoneSlug ||
                        $dbZoneSlug === $spaceSlug . '-' . $zoneSlug ||
                        $zoneSlug === $spaceSlug . '-' . $dbZoneSlug ||
                        str_ends_with($dbZoneSlug, '-' . $zoneSlug)
                    );
                    if ($zoneMatches) {
                        $hasAccess = true;
                        break;
                    }
                }
            }
        }
    }

    if (!$hasAccess) {
        http_response_code(403);
        echo json_encode(['success' => false, 'error' => 'Accès refusé à cette zone']);
        exit;
    }

    $stmt = $db->prepare("
        SELECT id FROM popup_contents 
        WHERE space_id = :space_id AND object_name = :object_name
    ");
    $stmt->execute([
        ':space_id' => $space['id'],
        ':object_name' => $objectName
    ]);
    $existing = $stmt->fetch();

    if ($existing) {
        $stmt = $db->prepare("
            UPDATE popup_contents SET
                zone_id = :zone_id,
                template_type = :template_type,
                template_config = :template_config,
                shader_name = :shader_name,
                format = :format,
                updated_at = NOW(),
                updated_by = :updated_by
            WHERE id = :id
        ");
        $stmt->execute([
            ':zone_id' => $zoneId,
            ':template_type' => $templateType,
            ':template_config' => $templateConfig,
            ':shader_name' => $shaderName,
            ':format' => $format,
            ':updated_by' => $currentUser['id'],
            ':id' => $existing['id']
        ]);
        $templateId = $existing['id'];
        $action = 'updated';
    } else {
        $stmt = $db->prepare("
            INSERT INTO popup_contents 
            (space_id, zone_id, object_name, template_type, template_config, 
             shader_name, format, is_active, created_at, updated_at, updated_by)
            VALUES 
            (:space_id, :zone_id, :object_name, :template_type, :template_config,
             :shader_name, :format, 1, NOW(), NOW(), :updated_by)
        ");
        $stmt->execute([
            ':space_id' => $space['id'],
            ':zone_id' => $zoneId,
            ':object_name' => $objectName,
            ':template_type' => $templateType,
            ':template_config' => $templateConfig,
            ':shader_name' => $shaderName,
            ':format' => $format,
            ':updated_by' => $currentUser['id']
        ]);
        $templateId = $db->lastInsertId();
        $action = 'created';
    }

    $configData = json_decode($templateConfig, true);
    $jsContent = generatePopupJS($objectName, $templateType, $configData, $spaceSlug);

    $popupsDir = realpath(__DIR__ . '/../../popups');
    if (!$popupsDir) {
        $popupsDir = __DIR__ . '/../../popups';
        if (!is_dir($popupsDir)) {
            @mkdir($popupsDir, 0755, true);
        }
    }

    $spaceDir = $popupsDir . '/' . $spaceSlug;
    if (!is_dir($spaceDir)) {
        @mkdir($spaceDir, 0755, true);
    }

    $jsFileName = $objectName . '-popup.js';
    $jsFilePath = $spaceDir . '/' . $jsFileName;
    $bytesWritten = @file_put_contents($jsFilePath, $jsContent);

    $fileGenerated = ($bytesWritten !== false);
    if ($fileGenerated) {
        updateManifest($spaceDir, $objectName, $templateType);
    }

    if (function_exists('logActivity')) {
        logActivity($currentUser['id'], 'popup_template_' . $action, 'popup_contents', $templateId, [
            'object_name' => $objectName,
            'template_type' => $templateType,
            'space_slug' => $spaceSlug,
            'zone_slug' => $zoneSlug
        ]);
    }

    echo json_encode([
        'success' => true,
        'template_id' => (int)$templateId,
        'action' => $action,
        'js_file' => $fileGenerated ? $spaceSlug . '/' . $jsFileName : null,
        'js_url' => $fileGenerated ? 'https://compagnon.atlantis-city.com/popups/' . $spaceSlug . '/' . $jsFileName : null,
        'file_generated' => $fileGenerated,
        'timestamp' => time(),
        'message' => 'Template sauvegardé avec succès'
    ]);

} catch (PDOException $e) {
    error_log("Erreur popups/save PDO: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Erreur base de données']);
} catch (Exception $e) {
    error_log("Erreur popups/save: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Erreur serveur: ' . $e->getMessage()]);
}