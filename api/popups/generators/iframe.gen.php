<?php
/**
 * ============================================
 * 🌐 GÉNÉRATEUR POPUP IFRAME
 * Atlantis City
 * v1.0 - 2024-12-10 - Extraction depuis save.php
 * v1.1 - 2024-12-10 - Suppression loadbar, fix outline, version finale
 * 
 * Génère le code JS pour les popups iframe
 * ============================================
 */

if (!defined('ATLANTIS_API')) {
    die('Accès direct interdit');
}

/**
 * Génère le code JS pour une popup iframe
 * 
 * @param string $objectName Nom de l'objet 3D
 * @param array $config Configuration du template
 * @param string $timestamp Date de génération
 * @return string Code JS de la popup
 */
function generateIframePopupJS($objectName, $config, $timestamp) {
    $title = escapeJS($config['title'] ?? 'Site Web');
    $url = escapeJS($config['url'] ?? 'about:blank');
    $icon = $config['icon'] ?? '🌐';
    $maxWidth = $config['maxWidth'] ?? '1100px';
    $height = $config['height'] ?? '85vh';
    
    $hue = isset($config['theme']['hue']) ? intval($config['theme']['hue']) : 260;
    $glow = isset($config['theme']['glow']) ? intval($config['theme']['glow']) : 20;

    return <<<JS
/**
 * 🌐 Popup Iframe - {$objectName}
 * Design Popup Studio v2
 * Généré le {$timestamp}
 */
(function(){
"use strict";

var POPUP_ID = "{$objectName}";
var CFG = {
  title: "{$title}",
  url: "{$url}",
  icon: "{$icon}",
  maxWidth: "{$maxWidth}",
  height: "{$height}",
  hue: {$hue},
  glow: {$glow}
};

var currentPopup = null;

function injectFont() {
  if (!document.getElementById("outfit-font")) {
    var l = document.createElement("link");
    l.id = "outfit-font";
    l.rel = "stylesheet";
    l.href = "https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600;700&display=swap";
    document.head.appendChild(l);
  }
}

function injectStyles() {
  if (document.getElementById("popup-{$objectName}-styles")) return;
  var s = document.createElement("style");
  s.id = "popup-{$objectName}-styles";
  s.textContent = "@keyframes pulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:0.6;transform:scale(0.95)}}";
  document.head.appendChild(s);
}

function show() {
  if (currentPopup) { close(); return; }
  injectFont();
  injectStyles();

  var overlay = document.createElement("div");
  overlay.className = "popup-{$objectName}-overlay";
  overlay.style.cssText = "position:fixed;inset:0;background:rgba(0,0,0,0.85);backdrop-filter:blur(12px);z-index:99999;display:flex;align-items:center;justify-content:center;opacity:0;transition:opacity 0.3s;font-family:'Outfit',sans-serif;";

  var popupBg = "linear-gradient(160deg, hsl(" + CFG.hue + ",30%,15%) 0%, hsl(" + CFG.hue + ",40%,5%) 100%)";
  var borderColor = "hsla(" + CFG.hue + ",70%,70%,0.2)";
  var boxShadow = "0 25px 60px rgba(0,0,0,0.6), 0 0 " + CFG.glow + "px hsla(" + CFG.hue + ",80%,60%,0.5)";
  var headerBg = "linear-gradient(to bottom, rgba(255,255,255,0.06), transparent)";
  var headerBorder = "hsla(" + CFG.hue + ",50%,50%,0.15)";
  var loadingBg = "linear-gradient(135deg, hsl(" + CFG.hue + ",20%,8%) 0%, hsl(" + CFG.hue + ",25%,12%) 100%)";
  var iconBg = "hsla(" + CFG.hue + ",60%,50%,0.15)";
  var iconBorder = "hsla(" + CFG.hue + ",60%,60%,0.3)";
  var urlColor = "hsla(" + CFG.hue + ",70%,70%,0.8)";
  var iframeBg = "hsl(" + CFG.hue + ",22%,10%)";

  overlay.innerHTML = '<div class="popup-{$objectName}" style="' +
    'width:90%;max-width:' + CFG.maxWidth + ';height:' + CFG.height + ';' +
    'background:' + popupBg + ';' +
    'border-radius:20px;' +
    'outline:1px solid ' + borderColor + ';' +
    'box-shadow:' + boxShadow + ';' +
    'overflow:hidden;display:flex;flex-direction:column;' +
    'transform:scale(0.95);transition:transform 0.3s;">' +
    
    '<div style="' +
      'padding:16px 20px;' +
      'background:' + headerBg + ';' +
      'border-bottom:1px solid ' + headerBorder + ';' +
      'display:flex;justify-content:space-between;align-items:center;flex-shrink:0;">' +
      '<div style="display:flex;align-items:center;gap:12px;">' +
        '<span style="font-size:22px;">' + CFG.icon + '</span>' +
        '<span style="color:white;font-size:16px;font-weight:600;">' + CFG.title + '</span>' +
      '</div>' +
      '<button onclick="window.atlantisPopups[\\'{$objectName}\\'].close()" style="' +
        'width:32px;height:32px;' +
        'background:rgba(255,255,255,0.08);' +
        'border:none;border-radius:50%;' +
        'color:rgba(255,255,255,0.6);font-size:16px;cursor:pointer;' +
        'display:flex;align-items:center;justify-content:center;' +
        'transition:all 0.2s;" ' +
        'onmouseover="this.style.background=\\'rgba(239,68,68,0.3)\\';this.style.color=\\'white\\'" ' +
        'onmouseout="this.style.background=\\'rgba(255,255,255,0.08)\\';this.style.color=\\'rgba(255,255,255,0.6)\\'">×</button>' +
    '</div>' +
    
    '<div class="popup-{$objectName}-loading" style="' +
      'position:absolute;left:0;right:0;top:60px;bottom:0;' +
      'background:' + loadingBg + ';' +
      'display:flex;flex-direction:column;align-items:center;justify-content:center;gap:16px;' +
      'color:rgba(255,255,255,0.5);font-size:13px;z-index:15;transition:opacity 0.3s;">' +
      '<div style="' +
        'width:60px;height:60px;border-radius:16px;' +
        'background:' + iconBg + ';' +
        'border:1px solid ' + iconBorder + ';' +
        'display:flex;align-items:center;justify-content:center;' +
        'animation:pulse 1.5s ease-in-out infinite;">' +
        '<span style="font-size:28px;">🌐</span>' +
      '</div>' +
      '<div style="text-align:center;">' +
        '<div style="color:rgba(255,255,255,0.7);margin-bottom:4px;">Chargement...</div>' +
        '<div style="font-family:\\'SF Mono\\',\\'Fira Code\\',monospace;font-size:11px;color:' + urlColor + ';max-width:300px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">' + CFG.url + '</div>' +
      '</div>' +
    '</div>' +
    
    '<iframe src="' + CFG.url + '" style="flex:1;border:none;background:' + iframeBg + ';width:100%;position:relative;z-index:10;opacity:0;transition:opacity 0.3s,background 0.3s;" title="' + CFG.title + '"></iframe>' +
    
  '</div>';

  document.body.appendChild(overlay);
  currentPopup = overlay;

  requestAnimationFrame(function() {
    overlay.style.opacity = "1";
    var inner = overlay.querySelector(".popup-{$objectName}");
    if (inner) inner.style.transform = "scale(1)";
  });

  var iframe = overlay.querySelector("iframe");
  var loading = overlay.querySelector(".popup-{$objectName}-loading");
  if (iframe && loading) {
    iframe.addEventListener("load", function() {
      iframe.style.background = "white";
      iframe.style.opacity = "1";
      loading.style.opacity = "0";
      setTimeout(function() { loading.style.display = "none"; }, 300);
    });
  }

  overlay.addEventListener("click", function(e) { if (e.target === overlay) close(); });
}

function close() {
  if (currentPopup) {
    var iframe = currentPopup.querySelector("iframe");
    if (iframe) iframe.src = "";
    currentPopup.style.opacity = "0";
    var inner = currentPopup.querySelector(".popup-{$objectName}");
    if (inner) inner.style.transform = "scale(0.95)";
    setTimeout(function() { if(currentPopup) { currentPopup.remove(); currentPopup = null; } }, 300);
  }
}

document.addEventListener("keydown", function(e) { if (e.key === "Escape" && currentPopup) close(); });

window.atlantisPopups = window.atlantisPopups || {};
window.atlantisPopups[POPUP_ID] = { show: show, close: close, config: CFG };

console.log("🌐 Popup " + POPUP_ID + " chargée");
})();
JS;
}