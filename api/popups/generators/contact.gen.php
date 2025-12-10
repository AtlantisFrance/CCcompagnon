<?php
/**
 * ============================================
 * 📇 GÉNÉRATEUR POPUP CONTACT
 * Atlantis City
 * v1.0 - 2024-12-10 - Extraction depuis save.php
 * 
 * Génère le code JS pour les popups contact
 * ============================================
 */

if (!defined('ATLANTIS_API')) {
    die('Accès direct interdit');
}

/**
 * Génère le code JS pour une popup contact
 * 
 * @param string $objectName Nom de l'objet 3D
 * @param array $config Configuration du template
 * @param string $timestamp Date de génération
 * @return string Code JS de la popup
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