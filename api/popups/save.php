<?php
/**
 * ============================================
 * 💾 API POPUPS - SAVE
 * Sauvegarde un template popup + génère le fichier JS
 * 
 * POST /api/popups/save.php
 * Body: {
 *   space_slug, zone_slug, object_name,
 *   template_type, template_config,
 *   shader_name, format, auth_token
 * }
 * ============================================
 */

define('ATLANTIS_API', true);
require_once __DIR__ . '/../config/database.php';

// CORS
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
// 🔐 AUTHENTIFICATION MANUELLE (Workaround OVH)
// ============================================

// 1. Lire le body JSON d'abord
$rawBody = file_get_contents('php://input');
$data = json_decode($rawBody, true);

if (!$data) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'JSON invalide']);
    exit;
}

// 2. Récupérer le token depuis le body (workaround OVH)
$token = null;

// Source 1: body JSON (prioritaire pour OVH)
if (!empty($data['auth_token'])) {
    $token = $data['auth_token'];
}

// Source 2: Header Authorization (si pas bloqué)
if (!$token) {
    $headers = getallheaders();
    if (!empty($headers['Authorization'])) {
        $token = str_replace('Bearer ', '', $headers['Authorization']);
    }
}

// Source 3: $_SERVER
if (!$token && !empty($_SERVER['HTTP_AUTHORIZATION'])) {
    $token = str_replace('Bearer ', '', $_SERVER['HTTP_AUTHORIZATION']);
}

if (!$token) {
    http_response_code(401);
    echo json_encode(['success' => false, 'error' => 'Non authentifié']);
    exit;
}

// 3. Valider le token et récupérer l'utilisateur
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

    // Charger les space_roles
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
    // Validation des champs requis
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

    // 1. Récupérer le space_id
    $stmt = $db->prepare("SELECT id, slug FROM spaces WHERE slug = :slug");
    $stmt->execute([':slug' => $spaceSlug]);
    $space = $stmt->fetch();

    if (!$space) {
        http_response_code(404);
        echo json_encode(['success' => false, 'error' => 'Espace non trouvé']);
        exit;
    }

    // 2. Récupérer le zone_id (optionnel)
    $zoneId = null;
    if ($zoneSlug) {
        $stmt = $db->prepare("SELECT id FROM zones WHERE slug = :slug AND space_id = :space_id");
        $stmt->execute([':slug' => $zoneSlug, ':space_id' => $space['id']]);
        $zone = $stmt->fetch();
        if ($zone) {
            $zoneId = $zone['id'];
        }
    }

    // 3. Vérifier les permissions
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

    // 4. Vérifier si un template existe déjà
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
        // UPDATE
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
        // INSERT
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

    // 5. Générer le fichier JS
    $configData = json_decode($templateConfig, true);
    $jsContent = generatePopupJS($objectName, $templateType, $configData, $spaceSlug);

    // 6. Sauvegarder le fichier JS
    $popupsDir = realpath(__DIR__ . '/../../popups');
    if (!$popupsDir) {
        $popupsDir = __DIR__ . '/../../popups';
        if (!is_dir($popupsDir)) {
            if (!@mkdir($popupsDir, 0755, true)) {
                error_log("Impossible de créer le dossier popups: $popupsDir");
            }
        }
    }

    $spaceDir = $popupsDir . '/' . $spaceSlug;
    if (!is_dir($spaceDir)) {
        if (!@mkdir($spaceDir, 0755, true)) {
            error_log("Impossible de créer le dossier: $spaceDir");
        }
    }

    $jsFileName = $objectName . '-popup.js';
    $jsFilePath = $spaceDir . '/' . $jsFileName;
    $bytesWritten = @file_put_contents($jsFilePath, $jsContent);

    $fileGenerated = ($bytesWritten !== false);
    if (!$fileGenerated) {
        error_log("Impossible d'écrire le fichier: $jsFilePath");
    }

    // 7. Mettre à jour le manifest
    if ($fileGenerated) {
        updateManifest($spaceDir, $objectName, $templateType);
    }

    // 8. Logger l'activité (si la fonction existe)
    if (function_exists('logActivity')) {
        logActivity($currentUser['id'], 'popup_template_' . $action, 'popup_contents', $templateId, [
            'object_name' => $objectName,
            'template_type' => $templateType,
            'space_slug' => $spaceSlug,
            'zone_slug' => $zoneSlug
        ]);
    }

    // Réponse succès
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

// ============================================
// 🔧 FONCTIONS DE GÉNÉRATION
// ============================================

function generatePopupJS($objectName, $templateType, $config, $spaceSlug) {
    $timestamp = date('Y-m-d H:i:s');
    
    switch ($templateType) {
        case 'contact':
            return generateContactPopupJS($objectName, $config, $timestamp);
        case 'synopsis':
            return generateSynopsisPopupJS($objectName, $config, $timestamp);
        case 'iframe':
            return generateIframePopupJS($objectName, $config, $timestamp);
        case 'custom':
            return generateCustomPopupJS($objectName, $config, $timestamp);
        default:
            return generateGenericPopupJS($objectName, $templateType, $config, $timestamp);
    }
}

function escapeJS($str) {
    if (!$str) return "";
    return str_replace(
        ["\\", '"', "'", "\n", "\r"],
        ["\\\\", '\\"', "\\'", "\\n", "\\r"],
        $str
    );
}

/**
 * 📇 TEMPLATE CONTACT - DESIGN POPUP STUDIO v2
 */
function generateContactPopupJS($objectName, $config, $timestamp) {
    $name = escapeJS($config['name'] ?? 'Contact');
    $title = escapeJS($config['title'] ?? '');
    $initials = escapeJS($config['initials'] ?? 'AB');
    $avatarUrl = escapeJS($config['avatarUrl'] ?? '');
    
    $hue = isset($config['theme']['hue']) ? intval($config['theme']['hue']) : 260;
    $glow = isset($config['theme']['glow']) ? intval($config['theme']['glow']) : 20;
    
    $contacts = $config['contacts'] ?? [];
    foreach ($contacts as &$c) {
        if ($c['type'] === 'phone' && empty($c['href'])) {
            $c['href'] = 'tel:' . preg_replace('/\s+/', '', $c['value'] ?? '');
        } elseif ($c['type'] === 'email' && empty($c['href'])) {
            $c['href'] = 'mailto:' . trim($c['value'] ?? '');
        }
    }
    $contactsJS = json_encode($contacts, JSON_UNESCAPED_UNICODE);

    return <<<JS
/**
 * 📇 Popup Contact - {$objectName}
 * Design Popup Studio v2
 * Généré le {$timestamp}
 */
(function(){
"use strict";

const POPUP_ID = "{$objectName}";
const CFG = {
  name: "{$name}",
  title: "{$title}",
  initials: "{$initials}",
  avatarUrl: "{$avatarUrl}",
  hue: {$hue},
  glow: {$glow},
  contacts: {$contactsJS}
};

const ICONS = {
  youtube: "https://upload.wikimedia.org/wikipedia/commons/thumb/0/09/YouTube_full-color_icon_%282017%29.svg/1024px-YouTube_full-color_icon_%282017%29.svg.png",
  facebook: "https://aavyuxeirkpgtbarjdce.supabase.co/storage/v1/object/public/julienscript/testree/facebook.png",
  instagram: "https://aavyuxeirkpgtbarjdce.supabase.co/storage/v1/object/public/julienscript/testree/instagram.png",
  linkedin: "https://aavyuxeirkpgtbarjdce.supabase.co/storage/v1/object/public/julienscript/testree/linkedin.png",
  tiktok: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/34/Ionicons_logo-tiktok.svg/512px-Ionicons_logo-tiktok.svg.png",
  twitter: "https://upload.wikimedia.org/wikipedia/commons/thumb/6/6f/Logo_of_Twitter.svg/512px-Logo_of_Twitter.svg.png"
};
const EMOJI = {phone:"📱",email:"✉️",youtube:"▶️",facebook:"📘",instagram:"📷",linkedin:"💼",tiktok:"🎵",twitter:"🐦",website:"🌐",other:"🔗"};

let currentPopup = null;

function injectFont() {
  if (!document.getElementById("outfit-font")) {
    const l = document.createElement("link");
    l.id = "outfit-font";
    l.rel = "stylesheet";
    l.href = "https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600;700&display=swap";
    document.head.appendChild(l);
  }
}

function show() {
  if (currentPopup) { close(); return; }
  injectFont();

  const overlay = document.createElement("div");
  overlay.className = "popup-{$objectName}-overlay";
  overlay.style.cssText = "position:fixed;inset:0;background:rgba(0,0,0,0.75);backdrop-filter:blur(8px);z-index:99999;display:flex;align-items:center;justify-content:center;opacity:0;transition:opacity 0.3s;font-family:'Outfit',sans-serif;";

  const avatar = CFG.avatarUrl 
    ? '<img src="' + CFG.avatarUrl + '" style="width:100%;height:100%;object-fit:cover;border-radius:50%;">'
    : CFG.initials;

  const links = CFG.contacts.map(function(c) {
    const iconUrl = ICONS[c.type];
    const icon = iconUrl 
      ? '<img src="' + iconUrl + '" style="width:24px;height:24px;object-fit:contain;">'
      : '<span style="font-size:20px;">' + (EMOJI[c.type] || "🔗") + '</span>';
    const target = (c.type === "phone" || c.type === "email") ? "_self" : "_blank";
    return '<a href="' + (c.href || "#") + '" target="' + target + '" rel="noopener" style="display:flex;align-items:center;gap:16px;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.08);border-radius:16px;padding:14px 16px;text-decoration:none;color:white;transition:all 0.3s;" onmouseover="this.style.background=\\'hsla(' + CFG.hue + ',60%,50%,0.15)\\';this.style.borderColor=\\'hsla(' + CFG.hue + ',60%,60%,0.4)\\';this.style.transform=\\'translateY(-2px)\\'" onmouseout="this.style.background=\\'rgba(255,255,255,0.03)\\';this.style.borderColor=\\'rgba(255,255,255,0.08)\\';this.style.transform=\\'none\\'"><div style="width:44px;height:44px;border-radius:12px;background:rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;flex-shrink:0;">' + icon + '</div><div style="flex:1;"><div style="font-size:11px;text-transform:uppercase;color:rgba(255,255,255,0.5);font-weight:600;margin-bottom:3px;letter-spacing:0.5px;">' + (c.label || c.type) + '</div><div style="font-size:14px;font-weight:500;color:rgba(255,255,255,0.95);">' + (c.value || "") + '</div></div><span style="opacity:0.3;font-size:16px;">→</span></a>';
  }).join("");

  overlay.innerHTML = '<div class="popup-{$objectName}" style="width:380px;max-width:92vw;background:linear-gradient(160deg,hsl(' + CFG.hue + ',30%,15%) 0%,hsl(' + CFG.hue + ',40%,5%) 100%);border-radius:24px;border:1px solid hsla(' + CFG.hue + ',70%,70%,0.2);box-shadow:0 25px 60px rgba(0,0,0,0.6),0 0 ' + CFG.glow + 'px hsla(' + CFG.hue + ',80%,60%,0.5);overflow:hidden;color:white;transform:scale(0.95);transition:transform 0.3s;"><div class="popup-{$objectName}-header" style="position:relative;padding:40px 20px 28px;text-align:center;background:linear-gradient(to bottom,rgba(255,255,255,0.04),transparent);border-bottom:1px solid hsla(' + CFG.hue + ',50%,50%,0.15);"><button class="popup-{$objectName}-close" onclick="window.atlantisPopups[\\'{$objectName}\\'].close()" style="position:absolute;top:15px;right:15px;width:32px;height:32px;background:rgba(255,255,255,0.08);border:none;border-radius:50%;color:rgba(255,255,255,0.6);font-size:18px;cursor:pointer;display:flex;align-items:center;justify-content:center;">×</button><div class="popup-{$objectName}-avatar" style="width:88px;height:88px;margin:0 auto 16px;border-radius:50%;background:linear-gradient(135deg,hsl(' + CFG.hue + ',50%,25%),hsl(' + CFG.hue + ',60%,15%));display:flex;align-items:center;justify-content:center;font-size:32px;font-weight:600;border:3px solid hsla(' + CFG.hue + ',70%,60%,0.5);box-shadow:0 8px 25px rgba(0,0,0,0.4);overflow:hidden;">' + avatar + '</div><h2 class="popup-{$objectName}-name" style="font-size:24px;font-weight:700;margin:0 0 6px;text-shadow:0 2px 8px rgba(0,0,0,0.4);">' + CFG.name + '</h2><p class="popup-{$objectName}-title" style="font-size:12px;color:hsla(' + CFG.hue + ',30%,75%,0.8);font-weight:400;letter-spacing:1.5px;text-transform:uppercase;margin:0;">' + CFG.title + '</p></div><div class="popup-{$objectName}-links" style="padding:24px 20px;display:flex;flex-direction:column;gap:12px;">' + links + '</div></div>';

  document.body.appendChild(overlay);
  currentPopup = overlay;

  requestAnimationFrame(function() {
    overlay.style.opacity = "1";
    var popup = overlay.querySelector(".popup-{$objectName}");
    if (popup) popup.style.transform = "scale(1)";
  });

  overlay.addEventListener("click", function(e) { if (e.target === overlay) close(); });
}

function close() {
  if (currentPopup) {
    currentPopup.style.opacity = "0";
    var popup = currentPopup.querySelector(".popup-{$objectName}");
    if (popup) popup.style.transform = "scale(0.95)";
    setTimeout(function() { if(currentPopup) { currentPopup.remove(); currentPopup = null; } }, 300);
  }
}

document.addEventListener("keydown", function(e) { if (e.key === "Escape" && currentPopup) close(); });

window.atlantisPopups = window.atlantisPopups || {};
window.atlantisPopups[POPUP_ID] = { show: show, close: close, config: CFG };

console.log("📇 Popup " + POPUP_ID + " chargé");
})();
JS;
}

/**
 * 🎬 TEMPLATE SYNOPSIS
 */
function generateSynopsisPopupJS($objectName, $config, $timestamp) {
    $title = escapeJS($config['title'] ?? 'Titre');
    $synopsis = escapeJS($config['synopsis'] ?? '');
    $ctaText = escapeJS($config['ctaText'] ?? 'En savoir plus');
    $ctaUrl = escapeJS($config['ctaUrl'] ?? '#');
    $copyrightYear = escapeJS($config['copyright']['year'] ?? date('Y'));
    $copyrightOwner = escapeJS($config['copyright']['owner'] ?? '');
    $copyrightText = escapeJS($config['copyright']['texts'][0] ?? 'Tous droits réservés.');
    $bgColor = $config['colors']['background'] ?? '#1a1a2e';
    $accentColor = $config['colors']['accent'] ?? '#8b5cf6';
    $textColor = $config['colors']['text'] ?? '#ffffff';

    return <<<JS
/**
 * 🎬 Popup Synopsis - {$objectName}
 * Généré automatiquement le {$timestamp}
 */
(function() {
  "use strict";

  const POPUP_ID = "{$objectName}";
  const CONFIG = {
    title: "{$title}",
    synopsis: "{$synopsis}",
    ctaText: "{$ctaText}",
    ctaUrl: "{$ctaUrl}",
    copyright: { year: "{$copyrightYear}", owner: "{$copyrightOwner}", text: "{$copyrightText}" },
    colors: { background: "{$bgColor}", accent: "{$accentColor}", text: "{$textColor}" }
  };

  let currentPopup = null;

  function injectStyles() {
    if (document.getElementById("popup-{$objectName}-styles")) return;
    var style = document.createElement("style");
    style.id = "popup-{$objectName}-styles";
    style.textContent = ".popup-{$objectName}-overlay{position:fixed;inset:0;background:rgba(0,0,0,0.85);z-index:99999;display:flex;align-items:center;justify-content:center;opacity:0;transition:opacity 0.3s}.popup-{$objectName}-overlay.active{opacity:1}.popup-{$objectName}{background:" + CONFIG.colors.background + ";border-radius:20px;width:500px;max-width:95vw;max-height:85vh;overflow:hidden;box-shadow:0 25px 60px rgba(0,0,0,0.5);transform:scale(0.95);transition:transform 0.3s;display:flex;flex-direction:column}.popup-{$objectName}-overlay.active .popup-{$objectName}{transform:scale(1)}.popup-{$objectName}-header{padding:20px;display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid rgba(255,255,255,0.1)}.popup-{$objectName}-title{color:" + CONFIG.colors.text + ";font-size:20px;font-weight:700;margin:0}.popup-{$objectName}-close{background:rgba(255,255,255,0.1);border:none;width:36px;height:36px;border-radius:50%;color:" + CONFIG.colors.text + ";font-size:20px;cursor:pointer}.popup-{$objectName}-content{padding:25px;overflow-y:auto;flex:1}.popup-{$objectName}-synopsis{color:" + CONFIG.colors.text + ";opacity:0.85;font-size:15px;line-height:1.7;margin-bottom:20px;white-space:pre-line}.popup-{$objectName}-copyright{background:rgba(255,255,255,0.05);border-radius:10px;padding:15px;font-size:12px;color:" + CONFIG.colors.text + ";opacity:0.5}.popup-{$objectName}-footer{padding:20px;border-top:1px solid rgba(255,255,255,0.1)}.popup-{$objectName}-cta{display:block;width:100%;padding:14px;text-align:center;background:" + CONFIG.colors.accent + ";color:white;text-decoration:none;border-radius:10px;font-weight:600;font-size:15px;transition:transform 0.2s,box-shadow 0.2s;border:none;cursor:pointer;box-sizing:border-box}.popup-{$objectName}-cta:hover{transform:translateY(-2px);box-shadow:0 8px 25px rgba(0,0,0,0.3)}";
    document.head.appendChild(style);
  }

  function show() {
    if (currentPopup) { close(); return; }
    injectStyles();

    var overlay = document.createElement("div");
    overlay.className = "popup-{$objectName}-overlay";
    overlay.innerHTML = '<div class="popup-{$objectName}"><div class="popup-{$objectName}-header"><h2 class="popup-{$objectName}-title">' + CONFIG.title + '</h2><button class="popup-{$objectName}-close">✕</button></div><div class="popup-{$objectName}-content"><p class="popup-{$objectName}-synopsis">' + CONFIG.synopsis + '</p><div class="popup-{$objectName}-copyright"><strong>© ' + CONFIG.copyright.year + ' ' + CONFIG.copyright.owner + '</strong><br>' + CONFIG.copyright.text + '</div></div><div class="popup-{$objectName}-footer"><a href="' + CONFIG.ctaUrl + '" class="popup-{$objectName}-cta" target="_blank">' + CONFIG.ctaText + '</a></div></div>';

    document.body.appendChild(overlay);
    currentPopup = overlay;
    requestAnimationFrame(function() { overlay.classList.add("active"); });

    overlay.querySelector(".popup-{$objectName}-close").addEventListener("click", close);
    overlay.addEventListener("click", function(e) { if (e.target === overlay) close(); });
  }

  function close() {
    if (currentPopup) {
      currentPopup.classList.remove("active");
      setTimeout(function() { if(currentPopup) { currentPopup.remove(); currentPopup = null; } }, 300);
    }
  }

  document.addEventListener("keydown", function(e) { if (e.key === "Escape" && currentPopup) close(); });

  window.atlantisPopups = window.atlantisPopups || {};
  window.atlantisPopups[POPUP_ID] = { show: show, close: close, config: CONFIG };

  console.log("🎬 Popup " + POPUP_ID + " chargé");
})();
JS;
}

/**
 * 🌐 TEMPLATE IFRAME
 */
function generateIframePopupJS($objectName, $config, $timestamp) {
    $title = escapeJS($config['title'] ?? 'Site');
    $url = escapeJS($config['url'] ?? 'about:blank');
    $icon = $config['icon'] ?? '🌐';
    $maxWidth = $config['maxWidth'] ?? '1100px';
    $headerColor = $config['colors']['header'] ?? '#2a2a2a';
    $bgColor = $config['colors']['background'] ?? '#1a1a1a';

    return <<<JS
/**
 * 🌐 Popup Iframe - {$objectName}
 * Généré automatiquement le {$timestamp}
 */
(function() {
  "use strict";

  const POPUP_ID = "{$objectName}";
  const CONFIG = {
    title: "{$title}",
    url: "{$url}",
    icon: "{$icon}",
    maxWidth: "{$maxWidth}",
    colors: { header: "{$headerColor}", background: "{$bgColor}" }
  };

  let currentPopup = null;

  function injectStyles() {
    if (document.getElementById("popup-{$objectName}-styles")) return;
    var style = document.createElement("style");
    style.id = "popup-{$objectName}-styles";
    style.textContent = ".popup-{$objectName}-overlay{position:fixed;inset:0;background:rgba(0,0,0,0.95);z-index:99999;display:flex;align-items:center;justify-content:center;opacity:0;transition:opacity 0.3s}.popup-{$objectName}-overlay.active{opacity:1}.popup-{$objectName}{background:" + CONFIG.colors.background + ";border-radius:16px;width:90%;max-width:" + CONFIG.maxWidth + ";height:85vh;overflow:hidden;box-shadow:0 30px 70px rgba(0,0,0,0.6);transform:scale(0.95);transition:transform 0.3s;display:flex;flex-direction:column}.popup-{$objectName}-overlay.active .popup-{$objectName}{transform:scale(1)}.popup-{$objectName}-header{padding:15px 20px;background:" + CONFIG.colors.header + ";display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid rgba(255,255,255,0.1)}.popup-{$objectName}-title{color:white;font-size:16px;display:flex;align-items:center;gap:10px;margin:0;font-weight:600}.popup-{$objectName}-close{background:rgba(255,255,255,0.1);border:none;width:32px;height:32px;border-radius:50%;color:white;font-size:18px;cursor:pointer}.popup-{$objectName}-iframe{flex:1;border:none;background:white;width:100%}";
    document.head.appendChild(style);
  }

  function show() {
    if (currentPopup) { close(); return; }
    injectStyles();

    var overlay = document.createElement("div");
    overlay.className = "popup-{$objectName}-overlay";
    overlay.innerHTML = '<div class="popup-{$objectName}"><div class="popup-{$objectName}-header"><h2 class="popup-{$objectName}-title"><span>' + CONFIG.icon + '</span> ' + CONFIG.title + '</h2><button class="popup-{$objectName}-close">✕</button></div><iframe src="' + CONFIG.url + '" class="popup-{$objectName}-iframe"></iframe></div>';

    document.body.appendChild(overlay);
    currentPopup = overlay;
    requestAnimationFrame(function() { overlay.classList.add("active"); });

    overlay.querySelector(".popup-{$objectName}-close").addEventListener("click", close);
    overlay.addEventListener("click", function(e) { if (e.target === overlay) close(); });
  }

  function close() {
    if (currentPopup) {
      var iframe = currentPopup.querySelector("iframe");
      if (iframe) iframe.src = "";
      currentPopup.classList.remove("active");
      setTimeout(function() { if(currentPopup) { currentPopup.remove(); currentPopup = null; } }, 300);
    }
  }

  document.addEventListener("keydown", function(e) { if (e.key === "Escape" && currentPopup) close(); });

  window.atlantisPopups = window.atlantisPopups || {};
  window.atlantisPopups[POPUP_ID] = { show: show, close: close, config: CONFIG };

  console.log("🌐 Popup " + POPUP_ID + " chargé");
})();
JS;
}

/**
 * 🛠️ TEMPLATE CUSTOM
 */
function generateCustomPopupJS($objectName, $config, $timestamp) {
    $htmlEncoded = base64_encode($config['html'] ?? '<div>Contenu</div>');
    $cssEncoded = base64_encode($config['css'] ?? '');

    return <<<JS
/**
 * 🛠️ Popup Custom - {$objectName}
 * Généré automatiquement le {$timestamp}
 */
(function() {
  "use strict";

  const POPUP_ID = "{$objectName}";
  
  function decode(str) {
    try { return atob(str); } catch(e) { return ""; }
  }

  const CONFIG = {
    html: decode("{$htmlEncoded}"),
    css: decode("{$cssEncoded}")
  };

  let currentPopup = null;

  function injectStyles() {
    if (document.getElementById("popup-{$objectName}-styles")) return;
    var style = document.createElement("style");
    style.id = "popup-{$objectName}-styles";
    style.textContent = ".popup-{$objectName}-overlay{position:fixed;inset:0;background:rgba(0,0,0,0.85);z-index:99999;display:flex;align-items:center;justify-content:center;opacity:0;transition:opacity 0.3s}.popup-{$objectName}-overlay.active{opacity:1}.popup-{$objectName}-container{transform:scale(0.95);transition:transform 0.3s}.popup-{$objectName}-overlay.active .popup-{$objectName}-container{transform:scale(1)}" + CONFIG.css;
    document.head.appendChild(style);
  }

  function show() {
    if (currentPopup) { close(); return; }
    injectStyles();

    var overlay = document.createElement("div");
    overlay.className = "popup-{$objectName}-overlay";
    
    var container = document.createElement("div");
    container.className = "popup-{$objectName}-container";
    container.innerHTML = CONFIG.html;
    
    overlay.appendChild(container);
    document.body.appendChild(overlay);
    currentPopup = overlay;

    requestAnimationFrame(function() { overlay.classList.add("active"); });

    var closeBtn = container.querySelector(".custom-close, [data-close], .close-btn");
    if (closeBtn) closeBtn.addEventListener("click", close);

    overlay.addEventListener("click", function(e) { if (e.target === overlay) close(); });
  }

  function close() {
    if (currentPopup) {
      currentPopup.classList.remove("active");
      setTimeout(function() { if(currentPopup) { currentPopup.remove(); currentPopup = null; } }, 300);
    }
  }

  document.addEventListener("keydown", function(e) { if (e.key === "Escape" && currentPopup) close(); });

  window.atlantisPopups = window.atlantisPopups || {};
  window.atlantisPopups[POPUP_ID] = { show: show, close: close, config: CONFIG };

  console.log("🛠️ Popup " + POPUP_ID + " chargé");
})();
JS;
}

/**
 * 📄 TEMPLATE GÉNÉRIQUE (fallback)
 */
function generateGenericPopupJS($objectName, $templateType, $config, $timestamp) {
    $configJson = json_encode($config, JSON_UNESCAPED_UNICODE);
    
    return <<<JS
/**
 * 📄 Popup {$templateType} - {$objectName}
 * Généré automatiquement le {$timestamp}
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
 * 📋 MISE À JOUR DU MANIFEST
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