<?php
/**
 * ============================================
 * 🎬 GÉNÉRATEUR POPUP YOUTUBE
 * Atlantis City
 * v1.0 - 2024-12-10 - Création initiale
 * 
 * Génère le code JS pour les popups vidéo YouTube
 * ============================================
 */

if (!defined('ATLANTIS_API')) {
    die('Accès direct interdit');
}

/**
 * Extrait l'ID YouTube depuis une URL
 * 
 * @param string $url URL YouTube ou ID direct
 * @return string|null ID de la vidéo ou null
 */
function extractYouTubeId($url) {
    if (!$url) return null;
    
    // Patterns supportés
    $patterns = [
        '/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/v\/)([^&\n?#]+)/',
        '/^([a-zA-Z0-9_-]{11})$/'
    ];
    
    foreach ($patterns as $pattern) {
        if (preg_match($pattern, $url, $matches)) {
            return $matches[1];
        }
    }
    
    return null;
}

/**
 * Génère le code JS pour une popup YouTube
 * 
 * @param string $objectName Nom de l'objet 3D
 * @param array $config Configuration du template
 * @param string $timestamp Date de génération
 * @return string Code JS de la popup
 */
function generateYoutubePopupJS($objectName, $config, $timestamp) {
    $title = escapeJS($config['title'] ?? 'Vidéo');
    $videoUrl = $config['videoUrl'] ?? '';
    $videoId = extractYouTubeId($videoUrl) ?? '';
    $description = escapeJS($config['description'] ?? '');
    $autoplay = !empty($config['autoplay']) ? 1 : 0;
    $controls = ($config['showControls'] ?? true) !== false ? 1 : 0;
    $maxWidth = $config['maxWidth'] ?? '900px';
    
    $hue = isset($config['theme']['hue']) ? intval($config['theme']['hue']) : 0;
    $glow = isset($config['theme']['glow']) ? intval($config['theme']['glow']) : 25;

    return <<<JS
/**
 * 🎬 Popup YouTube - {$objectName}
 * Design Popup Studio v2
 * Généré le {$timestamp}
 */
(function(){
"use strict";

var ID = "{$objectName}";
var CFG = {
  title: "{$title}",
  videoId: "{$videoId}",
  description: "{$description}",
  autoplay: {$autoplay},
  controls: {$controls},
  maxWidth: "{$maxWidth}",
  hue: {$hue},
  glow: {$glow}
};

var popup = null;

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
  if (document.getElementById("popup-" + ID + "-styles")) return;
  var s = document.createElement("style");
  s.id = "popup-" + ID + "-styles";
  s.textContent = "@keyframes ytPulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:0.7;transform:scale(0.96)}}";
  document.head.appendChild(s);
}

function show() {
  if (popup) { close(); return; }
  injectFont();
  injectStyles();

  var o = document.createElement("div");
  o.className = "popup-" + ID + "-overlay";
  o.style.cssText = "position:fixed;inset:0;background:rgba(0,0,0,0.9);backdrop-filter:blur(12px);z-index:99999;display:flex;align-items:center;justify-content:center;opacity:0;transition:opacity 0.3s;font-family:'Outfit',sans-serif;";

  var popupBg = "linear-gradient(160deg, hsl(" + CFG.hue + ",30%,15%) 0%, hsl(" + CFG.hue + ",40%,5%) 100%)";
  var borderColor = "hsla(" + CFG.hue + ",70%,70%,0.2)";
  var boxShadow = "0 25px 60px rgba(0,0,0,0.6), 0 0 " + CFG.glow + "px hsla(" + CFG.hue + ",80%,60%,0.5)";
  var headerBg = "linear-gradient(to bottom, rgba(255,255,255,0.06), transparent)";
  var headerBorder = "hsla(" + CFG.hue + ",50%,50%,0.15)";
  var loadingBg = "linear-gradient(135deg, hsl(" + CFG.hue + ",20%,8%) 0%, hsl(" + CFG.hue + ",25%,12%) 100%)";
  var playBtnBg = "hsla(" + CFG.hue + ",70%,50%,0.95)";
  var playBtnShadow = "hsla(" + CFG.hue + ",80%,40%,0.5)";

  var embedUrl = "https://www.youtube.com/embed/" + CFG.videoId + "?rel=0&modestbranding=1&autoplay=" + CFG.autoplay + "&controls=" + CFG.controls;

  var descHtml = "";
  if (CFG.description) {
    descHtml = '<div style="padding:16px 20px;border-top:1px solid ' + headerBorder + ';">' +
      '<p style="margin:0;color:rgba(255,255,255,0.7);font-size:14px;line-height:1.6;">' + CFG.description + '</p>' +
    '</div>';
  }

  o.innerHTML = '<div class="popup-' + ID + '" style="' +
    'width:90%;max-width:' + CFG.maxWidth + ';' +
    'background:' + popupBg + ';' +
    'border-radius:20px;' +
    'outline:1px solid ' + borderColor + ';' +
    'box-shadow:' + boxShadow + ';' +
    'overflow:hidden;' +
    'transform:scale(0.95);transition:transform 0.3s;">' +
    
    '<div style="' +
      'padding:16px 20px;' +
      'background:' + headerBg + ';' +
      'border-bottom:1px solid ' + headerBorder + ';' +
      'display:flex;justify-content:space-between;align-items:center;">' +
      '<div style="display:flex;align-items:center;gap:12px;">' +
        '<span style="font-size:22px;">🎬</span>' +
        '<span style="color:white;font-size:16px;font-weight:600;">' + CFG.title + '</span>' +
      '</div>' +
      '<button onclick="window.atlantisPopups[\\'' + ID + '\\'].close()" style="' +
        'width:32px;height:32px;' +
        'background:rgba(255,255,255,0.08);' +
        'border:none;border-radius:50%;' +
        'color:rgba(255,255,255,0.6);font-size:16px;cursor:pointer;' +
        'display:flex;align-items:center;justify-content:center;' +
        'transition:all 0.2s;" ' +
        'onmouseover="this.style.background=\\'rgba(239,68,68,0.3)\\';this.style.color=\\'white\\'" ' +
        'onmouseout="this.style.background=\\'rgba(255,255,255,0.08)\\';this.style.color=\\'rgba(255,255,255,0.6)\\'">×</button>' +
    '</div>' +
    
    '<div style="position:relative;width:100%;padding-top:56.25%;background:#000;">' +
      '<div class="popup-' + ID + '-loading" style="' +
        'position:absolute;inset:0;' +
        'background:' + loadingBg + ';' +
        'display:flex;flex-direction:column;align-items:center;justify-content:center;gap:16px;' +
        'z-index:5;transition:opacity 0.3s;">' +
        '<div style="' +
          'width:68px;height:48px;' +
          'background:' + playBtnBg + ';' +
          'border-radius:12px;' +
          'display:flex;align-items:center;justify-content:center;' +
          'box-shadow:0 4px 20px ' + playBtnShadow + ';' +
          'animation:ytPulse 1.5s ease-in-out infinite;">' +
          '<div style="width:0;height:0;border-left:18px solid white;border-top:11px solid transparent;border-bottom:11px solid transparent;margin-left:4px;"></div>' +
        '</div>' +
        '<div style="color:rgba(255,255,255,0.6);font-size:13px;">Chargement de la vidéo...</div>' +
      '</div>' +
      '<iframe src="' + embedUrl + '" style="' +
        'position:absolute;inset:0;width:100%;height:100%;border:none;" ' +
        'allow="accelerometer;autoplay;clipboard-write;encrypted-media;gyroscope;picture-in-picture;web-share" ' +
        'allowfullscreen title="' + CFG.title + '"></iframe>' +
    '</div>' +
    
    descHtml +
    
  '</div>';

  document.body.appendChild(o);
  popup = o;

  requestAnimationFrame(function() {
    o.style.opacity = "1";
    var inner = o.querySelector(".popup-" + ID);
    if (inner) inner.style.transform = "scale(1)";
  });

  var iframe = o.querySelector("iframe");
  var loading = o.querySelector(".popup-" + ID + "-loading");
  if (iframe && loading) {
    iframe.addEventListener("load", function() {
      loading.style.opacity = "0";
      setTimeout(function() { loading.style.display = "none"; }, 300);
    });
  }

  o.addEventListener("click", function(e) { if (e.target === o) close(); });
}

function close() {
  if (popup) {
    var iframe = popup.querySelector("iframe");
    if (iframe) iframe.src = "";
    popup.style.opacity = "0";
    var inner = popup.querySelector(".popup-" + ID);
    if (inner) inner.style.transform = "scale(0.95)";
    setTimeout(function() { if(popup) { popup.remove(); popup = null; } }, 300);
  }
}

document.addEventListener("keydown", function(e) { if (e.key === "Escape" && popup) close(); });

window.atlantisPopups = window.atlantisPopups || {};
window.atlantisPopups[ID] = { show: show, close: close, config: CFG };

console.log("🎬 Popup " + ID + " chargée");
})();
JS;
}