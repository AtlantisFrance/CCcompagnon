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
require_once __DIR__ . '/../config/init.php';

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
    errorResponse('Méthode non autorisée', 405);
}

// Auth requise
$currentUser = requireAuth();

try {
    $data = getPostData();

    // Validation
    $spaceSlug = getRequired($data, 'space_slug');
    $objectName = getRequired($data, 'object_name');
    $templateType = getRequired($data, 'template_type');
    $templateConfig = getRequired($data, 'template_config');

    $zoneSlug = getOptional($data, 'zone_slug', '');
    $shaderName = getOptional($data, 'shader_name', '');
    $format = getOptional($data, 'format', '');

    $db = getDB();

    // 1. Récupérer le space_id
    $stmt = $db->prepare("SELECT id, slug FROM spaces WHERE slug = :slug");
    $stmt->execute([':slug' => $spaceSlug]);
    $space = $stmt->fetch();

    if (!$space) {
        errorResponse('Espace non trouvé', 404);
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
                if ($role['role'] === 'zone_admin' && $role['zone_slug'] === $zoneSlug) {
                    $hasAccess = true;
                    break;
                }
            }
        }
    }

    if (!$hasAccess) {
        errorResponse('Accès refusé à cette zone', 403);
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
            mkdir($popupsDir, 0755, true);
        }
    }

    $spaceDir = $popupsDir . '/' . $spaceSlug;
    if (!is_dir($spaceDir)) {
        mkdir($spaceDir, 0755, true);
    }

    $jsFileName = $objectName . '-popup.js';
    $jsFilePath = $spaceDir . '/' . $jsFileName;
    $bytesWritten = file_put_contents($jsFilePath, $jsContent);

    if ($bytesWritten === false) {
        error_log("Impossible d'écrire le fichier: $jsFilePath");
        errorResponse('Erreur lors de la génération du fichier JS', 500);
    }

    // 7. Mettre à jour le manifest
    updateManifest($spaceDir, $objectName, $templateType);

    // 8. Logger l'activité
    logActivity($currentUser['id'], 'popup_template_' . $action, 'popup_contents', $templateId, [
        'object_name' => $objectName,
        'template_type' => $templateType,
        'space_slug' => $spaceSlug,
        'zone_slug' => $zoneSlug
    ]);

    successResponse([
        'template_id' => (int)$templateId,
        'action' => $action,
        'js_file' => $spaceSlug . '/' . $jsFileName,
        'js_url' => 'https://compagnon.atlantis-city.com/popups/' . $spaceSlug . '/' . $jsFileName,
        'timestamp' => time(),
        'message' => 'Template sauvegardé avec succès'
    ]);

} catch (Exception $e) {
    error_log("Erreur popups/save: " . $e->getMessage());
    errorResponse('Erreur serveur: ' . $e->getMessage(), 500);
}


/**
 * ============================================
 * 🔧 GÉNÉRATION DU FICHIER JS
 * ============================================
 */
function generatePopupJS($objectName, $templateType, $config, $spaceSlug) {
    $timestamp = date('Y-m-d H:i:s');
    $configJson = json_encode($config, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
    
    // Sélectionner le générateur selon le type
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


/**
 * 📇 TEMPLATE CONTACT
 */
function generateContactPopupJS($objectName, $config, $timestamp) {
    $name = addslashes($config['name'] ?? 'Contact');
    $title = addslashes($config['title'] ?? '');
    $avatar = addslashes($config['avatar'] ?? 'AB');
    $bgColor = $config['colors']['background'] ?? '#1a1a2e';
    $accentColor = $config['colors']['accent'] ?? '#3b82f6';
    $textColor = $config['colors']['text'] ?? '#ffffff';
    
    // Générer les contacts
    $contactsJS = '';
    if (!empty($config['contacts'])) {
        $contactsJS = json_encode($config['contacts'], JSON_UNESCAPED_UNICODE);
    } else {
        $contactsJS = '[]';
    }

    return <<<JS
/**
 * 📇 Popup Contact - {$objectName}
 * Généré automatiquement le {$timestamp}
 * ⚠️ Ne pas modifier directement - Utiliser l'éditeur admin
 */
(function() {
  "use strict";

  const POPUP_ID = "{$objectName}";
  const CONFIG = {
    name: "{$name}",
    title: "{$title}",
    avatar: "{$avatar}",
    contacts: {$contactsJS},
    colors: {
      background: "{$bgColor}",
      accent: "{$accentColor}",
      text: "{$textColor}"
    }
  };

  let currentPopup = null;

  // === STYLES ===
  const STYLES = `
    .popup-{$objectName}-overlay {
      position: fixed; inset: 0; background: rgba(0,0,0,0.85);
      z-index: 99999; display: flex; align-items: center; justify-content: center;
      opacity: 0; transition: opacity 0.3s ease;
    }
    .popup-{$objectName}-overlay.active { opacity: 1; }
    .popup-{$objectName} {
      background: \${CONFIG.colors.background}; border-radius: 20px;
      width: 380px; max-width: 95vw; overflow: hidden;
      box-shadow: 0 25px 60px rgba(0,0,0,0.5);
      transform: scale(0.95); transition: transform 0.3s ease;
    }
    .popup-{$objectName}-overlay.active .popup-{$objectName} { transform: scale(1); }
    .popup-{$objectName}-header {
      padding: 25px 20px; text-align: center; position: relative;
      background: linear-gradient(180deg, rgba(255,255,255,0.05) 0%, transparent 100%);
    }
    .popup-{$objectName}-close {
      position: absolute; top: 15px; right: 15px;
      background: rgba(255,255,255,0.1); border: none;
      width: 32px; height: 32px; border-radius: 50%;
      color: \${CONFIG.colors.text}; font-size: 18px; cursor: pointer;
      transition: all 0.2s;
    }
    .popup-{$objectName}-close:hover { background: rgba(239,68,68,0.3); }
    .popup-{$objectName}-avatar {
      width: 70px; height: 70px; background: \${CONFIG.colors.accent};
      border-radius: 50%; margin: 0 auto 15px;
      display: flex; align-items: center; justify-content: center;
      font-size: 24px; font-weight: 700; color: white;
      box-shadow: 0 8px 20px rgba(0,0,0,0.3);
    }
    .popup-{$objectName}-name {
      color: \${CONFIG.colors.text}; font-size: 22px; font-weight: 700; margin: 0 0 5px;
    }
    .popup-{$objectName}-title {
      color: \${CONFIG.colors.text}; opacity: 0.6; font-size: 14px; margin: 0;
    }
    .popup-{$objectName}-links { padding: 10px 20px 25px; }
    .popup-{$objectName}-link {
      display: flex; align-items: center; gap: 15px;
      padding: 14px 16px; background: rgba(255,255,255,0.05);
      border-radius: 12px; margin-bottom: 10px;
      text-decoration: none; color: \${CONFIG.colors.text};
      transition: all 0.2s; border: 1px solid transparent;
    }
    .popup-{$objectName}-link:hover {
      background: rgba(255,255,255,0.1);
      border-color: \${CONFIG.colors.accent};
      transform: translateX(5px);
    }
    .popup-{$objectName}-link-icon { font-size: 20px; }
    .popup-{$objectName}-link-text { flex: 1; }
    .popup-{$objectName}-link-label { font-size: 11px; opacity: 0.5; text-transform: uppercase; }
    .popup-{$objectName}-link-value { font-size: 14px; font-weight: 500; }
    .popup-{$objectName}-link-arrow { opacity: 0.3; font-size: 18px; }
  `;

  function injectStyles() {
    if (!document.getElementById("popup-{$objectName}-styles")) {
      const style = document.createElement("style");
      style.id = "popup-{$objectName}-styles";
      style.textContent = STYLES;
      document.head.appendChild(style);
    }
  }

  function getIcon(type) {
    const icons = {
      phone: "📱", email: "✉️", website: "🌐",
      facebook: "📘", instagram: "📷", linkedin: "💼",
      twitter: "🐦", youtube: "▶️", tiktok: "🎵"
    };
    return icons[type] || "📌";
  }

  function show() {
    if (currentPopup) { close(); return; }
    injectStyles();

    const overlay = document.createElement("div");
    overlay.className = "popup-{$objectName}-overlay";

    const linksHTML = CONFIG.contacts.map(c => `
      <a href="\${c.href}" class="popup-{$objectName}-link" 
         target="\${c.type === 'phone' || c.type === 'email' ? '_self' : '_blank'}"
         rel="noopener noreferrer">
        <span class="popup-{$objectName}-link-icon">\${c.icon || getIcon(c.type)}</span>
        <div class="popup-{$objectName}-link-text">
          <div class="popup-{$objectName}-link-label">\${c.label || c.type}</div>
          <div class="popup-{$objectName}-link-value">\${c.value}</div>
        </div>
        <span class="popup-{$objectName}-link-arrow">→</span>
      </a>
    `).join("");

    overlay.innerHTML = `
      <div class="popup-{$objectName}">
        <div class="popup-{$objectName}-header">
          <button class="popup-{$objectName}-close">✕</button>
          <div class="popup-{$objectName}-avatar">\${CONFIG.avatar}</div>
          <h2 class="popup-{$objectName}-name">\${CONFIG.name}</h2>
          <p class="popup-{$objectName}-title">\${CONFIG.title}</p>
        </div>
        <div class="popup-{$objectName}-links">\${linksHTML}</div>
      </div>
    `;

    document.body.appendChild(overlay);
    currentPopup = overlay;

    requestAnimationFrame(() => overlay.classList.add("active"));

    overlay.querySelector(".popup-{$objectName}-close").addEventListener("click", close);
    overlay.addEventListener("click", e => { if (e.target === overlay) close(); });
  }

  function close() {
    if (currentPopup) {
      currentPopup.classList.remove("active");
      setTimeout(() => { currentPopup?.remove(); currentPopup = null; }, 300);
    }
  }

  // Escape key
  document.addEventListener("keydown", e => {
    if (e.key === "Escape" && currentPopup) close();
  });

  // Register globally
  window.atlantisPopups = window.atlantisPopups || {};
  window.atlantisPopups[POPUP_ID] = { show, close, config: CONFIG };

  console.log("📇 Popup {$objectName} chargé");
})();
JS;
}


/**
 * 🎬 TEMPLATE SYNOPSIS
 */
function generateSynopsisPopupJS($objectName, $config, $timestamp) {
    $title = addslashes($config['title'] ?? 'Titre');
    $synopsis = addslashes($config['synopsis'] ?? '');
    $ctaText = addslashes($config['ctaText'] ?? 'En savoir plus');
    $ctaUrl = addslashes($config['ctaUrl'] ?? '#');
    $copyrightYear = addslashes($config['copyright']['year'] ?? date('Y'));
    $copyrightOwner = addslashes($config['copyright']['owner'] ?? '');
    $bgColor = $config['colors']['background'] ?? '#1a1a2e';
    $accentColor = $config['colors']['accent'] ?? '#8b5cf6';

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
    copyright: { year: "{$copyrightYear}", owner: "{$copyrightOwner}" },
    colors: { background: "{$bgColor}", accent: "{$accentColor}" }
  };

  let currentPopup = null;

  const STYLES = `
    .popup-{$objectName}-overlay {
      position: fixed; inset: 0; background: rgba(0,0,0,0.9);
      z-index: 99999; display: flex; align-items: center; justify-content: center;
      opacity: 0; transition: opacity 0.3s ease;
    }
    .popup-{$objectName}-overlay.active { opacity: 1; }
    .popup-{$objectName} {
      background: \${CONFIG.colors.background}; border-radius: 20px;
      width: 500px; max-width: 95vw; max-height: 85vh; overflow: hidden;
      box-shadow: 0 30px 70px rgba(0,0,0,0.5);
      transform: scale(0.95); transition: transform 0.3s ease;
      display: flex; flex-direction: column;
    }
    .popup-{$objectName}-overlay.active .popup-{$objectName} { transform: scale(1); }
    .popup-{$objectName}-header {
      padding: 20px; display: flex; justify-content: space-between; align-items: center;
      border-bottom: 1px solid rgba(255,255,255,0.1);
    }
    .popup-{$objectName}-title { color: white; font-size: 20px; font-weight: 700; margin: 0; }
    .popup-{$objectName}-close {
      background: rgba(255,255,255,0.1); border: none;
      width: 36px; height: 36px; border-radius: 50%;
      color: white; font-size: 20px; cursor: pointer;
    }
    .popup-{$objectName}-content { padding: 25px; overflow-y: auto; flex: 1; }
    .popup-{$objectName}-synopsis {
      color: rgba(255,255,255,0.85); font-size: 15px; line-height: 1.7; margin-bottom: 20px;
    }
    .popup-{$objectName}-copyright {
      background: rgba(255,255,255,0.05); border-radius: 10px; padding: 15px;
      font-size: 12px; color: rgba(255,255,255,0.5);
    }
    .popup-{$objectName}-footer { padding: 20px; border-top: 1px solid rgba(255,255,255,0.1); }
    .popup-{$objectName}-cta {
      display: block; width: 100%; padding: 14px; text-align: center;
      background: \${CONFIG.colors.accent}; color: white; text-decoration: none;
      border-radius: 10px; font-weight: 600; font-size: 15px;
      transition: transform 0.2s, box-shadow 0.2s;
    }
    .popup-{$objectName}-cta:hover { transform: translateY(-2px); box-shadow: 0 8px 25px rgba(0,0,0,0.3); }
  `;

  function injectStyles() {
    if (!document.getElementById("popup-{$objectName}-styles")) {
      const style = document.createElement("style");
      style.id = "popup-{$objectName}-styles";
      style.textContent = STYLES;
      document.head.appendChild(style);
    }
  }

  function show() {
    if (currentPopup) { close(); return; }
    injectStyles();

    const overlay = document.createElement("div");
    overlay.className = "popup-{$objectName}-overlay";
    overlay.innerHTML = `
      <div class="popup-{$objectName}">
        <div class="popup-{$objectName}-header">
          <h2 class="popup-{$objectName}-title">\${CONFIG.title}</h2>
          <button class="popup-{$objectName}-close">✕</button>
        </div>
        <div class="popup-{$objectName}-content">
          <p class="popup-{$objectName}-synopsis">\${CONFIG.synopsis}</p>
          <div class="popup-{$objectName}-copyright">
            © \${CONFIG.copyright.year} \${CONFIG.copyright.owner}. Tous droits réservés.
          </div>
        </div>
        <div class="popup-{$objectName}-footer">
          <a href="\${CONFIG.ctaUrl}" class="popup-{$objectName}-cta" target="_blank">\${CONFIG.ctaText}</a>
        </div>
      </div>
    `;

    document.body.appendChild(overlay);
    currentPopup = overlay;
    requestAnimationFrame(() => overlay.classList.add("active"));

    overlay.querySelector(".popup-{$objectName}-close").addEventListener("click", close);
    overlay.addEventListener("click", e => { if (e.target === overlay) close(); });
  }

  function close() {
    if (currentPopup) {
      currentPopup.classList.remove("active");
      setTimeout(() => { currentPopup?.remove(); currentPopup = null; }, 300);
    }
  }

  document.addEventListener("keydown", e => { if (e.key === "Escape" && currentPopup) close(); });

  window.atlantisPopups = window.atlantisPopups || {};
  window.atlantisPopups[POPUP_ID] = { show, close, config: CONFIG };

  console.log("🎬 Popup {$objectName} chargé");
})();
JS;
}


/**
 * 🌐 TEMPLATE IFRAME
 */
function generateIframePopupJS($objectName, $config, $timestamp) {
    $title = addslashes($config['title'] ?? 'Site');
    $url = addslashes($config['url'] ?? 'about:blank');
    $icon = $config['icon'] ?? '🌐';

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
    icon: "{$icon}"
  };

  let currentPopup = null;

  const STYLES = `
    .popup-{$objectName}-overlay {
      position: fixed; inset: 0; background: rgba(0,0,0,0.95);
      z-index: 99999; display: flex; align-items: center; justify-content: center;
      opacity: 0; transition: opacity 0.3s ease;
    }
    .popup-{$objectName}-overlay.active { opacity: 1; }
    .popup-{$objectName} {
      background: #1a1a1a; border-radius: 16px;
      width: 90%; max-width: 1100px; height: 85vh; overflow: hidden;
      box-shadow: 0 30px 70px rgba(0,0,0,0.6);
      transform: scale(0.95); transition: transform 0.3s ease;
      display: flex; flex-direction: column;
    }
    .popup-{$objectName}-overlay.active .popup-{$objectName} { transform: scale(1); }
    .popup-{$objectName}-header {
      padding: 15px 20px; background: #2a2a2a;
      display: flex; justify-content: space-between; align-items: center;
      border-bottom: 1px solid rgba(255,255,255,0.1);
    }
    .popup-{$objectName}-title { color: white; font-size: 16px; display: flex; align-items: center; gap: 10px; margin: 0; }
    .popup-{$objectName}-close {
      background: rgba(255,255,255,0.1); border: none;
      width: 32px; height: 32px; border-radius: 50%;
      color: white; font-size: 18px; cursor: pointer;
    }
    .popup-{$objectName}-iframe { flex: 1; border: none; background: white; }
  `;

  function injectStyles() {
    if (!document.getElementById("popup-{$objectName}-styles")) {
      const style = document.createElement("style");
      style.id = "popup-{$objectName}-styles";
      style.textContent = STYLES;
      document.head.appendChild(style);
    }
  }

  function show() {
    if (currentPopup) { close(); return; }
    injectStyles();

    const overlay = document.createElement("div");
    overlay.className = "popup-{$objectName}-overlay";
    overlay.innerHTML = `
      <div class="popup-{$objectName}">
        <div class="popup-{$objectName}-header">
          <h2 class="popup-{$objectName}-title">\${CONFIG.icon} \${CONFIG.title}</h2>
          <button class="popup-{$objectName}-close">✕</button>
        </div>
        <iframe src="\${CONFIG.url}" class="popup-{$objectName}-iframe"></iframe>
      </div>
    `;

    document.body.appendChild(overlay);
    currentPopup = overlay;
    requestAnimationFrame(() => overlay.classList.add("active"));

    overlay.querySelector(".popup-{$objectName}-close").addEventListener("click", close);
    overlay.addEventListener("click", e => { if (e.target === overlay) close(); });
  }

  function close() {
    if (currentPopup) {
      const iframe = currentPopup.querySelector("iframe");
      if (iframe) iframe.src = "";
      currentPopup.classList.remove("active");
      setTimeout(() => { currentPopup?.remove(); currentPopup = null; }, 300);
    }
  }

  document.addEventListener("keydown", e => { if (e.key === "Escape" && currentPopup) close(); });

  window.atlantisPopups = window.atlantisPopups || {};
  window.atlantisPopups[POPUP_ID] = { show, close, config: CONFIG };

  console.log("🌐 Popup {$objectName} chargé");
})();
JS;
}


/**
 * 🛠️ TEMPLATE CUSTOM
 */
function generateCustomPopupJS($objectName, $config, $timestamp) {
    $html = addslashes($config['html'] ?? '<div>Contenu personnalisé</div>');
    $css = addslashes($config['css'] ?? '');

    return <<<JS
/**
 * 🛠️ Popup Custom - {$objectName}
 * Généré automatiquement le {$timestamp}
 */
(function() {
  "use strict";

  const POPUP_ID = "{$objectName}";
  const CONFIG = {
    html: "{$html}",
    css: "{$css}"
  };

  let currentPopup = null;

  const STYLES = `
    .popup-{$objectName}-overlay {
      position: fixed; inset: 0; background: rgba(0,0,0,0.85);
      z-index: 99999; display: flex; align-items: center; justify-content: center;
      opacity: 0; transition: opacity 0.3s ease;
    }
    .popup-{$objectName}-overlay.active { opacity: 1; }
    \${CONFIG.css}
  `;

  function injectStyles() {
    if (!document.getElementById("popup-{$objectName}-styles")) {
      const style = document.createElement("style");
      style.id = "popup-{$objectName}-styles";
      style.textContent = STYLES;
      document.head.appendChild(style);
    }
  }

  function show() {
    if (currentPopup) { close(); return; }
    injectStyles();

    const overlay = document.createElement("div");
    overlay.className = "popup-{$objectName}-overlay";
    overlay.innerHTML = CONFIG.html;

    document.body.appendChild(overlay);
    currentPopup = overlay;
    requestAnimationFrame(() => overlay.classList.add("active"));

    overlay.addEventListener("click", e => { if (e.target === overlay) close(); });
  }

  function close() {
    if (currentPopup) {
      currentPopup.classList.remove("active");
      setTimeout(() => { currentPopup?.remove(); currentPopup = null; }, 300);
    }
  }

  document.addEventListener("keydown", e => { if (e.key === "Escape" && currentPopup) close(); });

  window.atlantisPopups = window.atlantisPopups || {};
  window.atlantisPopups[POPUP_ID] = { show, close, config: CONFIG };

  console.log("🛠️ Popup {$objectName} chargé");
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

  let currentPopup = null;

  function show() {
    console.log("Popup {$objectName} show - config:", CONFIG);
    alert("Popup type '{$templateType}' pas encore implémenté");
  }

  function close() {
    if (currentPopup) {
      currentPopup.remove();
      currentPopup = null;
    }
  }

  window.atlantisPopups = window.atlantisPopups || {};
  window.atlantisPopups[POPUP_ID] = { show, close, config: CONFIG };

  console.log("📄 Popup {$objectName} chargé (générique)");
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
