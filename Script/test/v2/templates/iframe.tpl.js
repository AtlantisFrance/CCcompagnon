/**
 * ============================================
 * 🌐 TEMPLATE IFRAME - POPUP STUDIO DESIGN
 * Atlantis City
 * v2.0 - 2024-12-06 - Aligné sur les bonnes pratiques contact.tpl.js
 * v2.6 - 2024-12-10 - Suppression loadbar, fix outline, version finale
 * ============================================
 */

window.ATLANTIS_TEMPLATES = window.ATLANTIS_TEMPLATES || {};

window.ATLANTIS_TEMPLATES.iframe = {
  name: "Iframe Site Web",
  icon: "🌐",
  description: "Intégration d'un site externe",

  // ============================================
  // 📋 DONNÉES PAR DÉFAUT
  // ============================================
  getDefaultData: function () {
    return {
      title: "Site Web",
      url: "https://example.com",
      icon: "🌐",
      maxWidth: "1100px",
      height: "85vh",
      theme: { hue: 260, glow: 20 },
    };
  },

  // ============================================
  // 📝 FORMULAIRE D'ÉDITION
  // ============================================
  renderForm: function (data, helpers) {
    const theme = data.theme || { hue: 260, glow: 20 };

    return `
      <div class="tpl-glass-panel">
        <div class="tpl-section-title purple">
          <i class="fas fa-swatchbook"></i>
          Thème & Ambiance
        </div>
        
        <div class="tpl-slider-group">
          <div class="tpl-slider-header">
            <label class="tpl-slider-label" for="tpl-slider-hue">Teinte (Couleur)</label>
            <span class="tpl-slider-value" id="tpl-slider-hue-value">${
              theme.hue
            }°</span>
          </div>
          <input type="range" class="tpl-range tpl-range-hue" id="tpl-slider-hue" name="theme_hue"
                 data-slider-key="hue" min="0" max="360" value="${
                   theme.hue
                 }" autocomplete="off">
        </div>
        
        <div class="tpl-slider-group">
          <div class="tpl-slider-header">
            <label class="tpl-slider-label" for="tpl-slider-glow">Intensité Halo</label>
            <span class="tpl-slider-value" id="tpl-slider-glow-value">${
              theme.glow
            }px</span>
          </div>
          <input type="range" class="tpl-range" id="tpl-slider-glow" name="theme_glow"
                 data-slider-key="glow" min="0" max="100" value="${
                   theme.glow
                 }" autocomplete="off">
        </div>
      </div>

      <div class="tpl-glass-panel">
        <div class="tpl-section-title gray">
          <i class="fas fa-window-maximize"></i>
          Configuration Iframe
        </div>
        
        <div class="tpl-field-group">
          <label class="tpl-field-label" for="tpl-field-title">Titre de la fenêtre</label>
          <input type="text" class="tpl-input" id="tpl-field-title" name="title" data-field="title" autocomplete="off"
                 value="${helpers.escapeHtml(
                   data.title || ""
                 )}" placeholder="Mon site web">
        </div>
        
        <div class="tpl-field-group">
          <label class="tpl-field-label" for="tpl-field-url">URL du site à intégrer</label>
          <input type="url" class="tpl-input url" id="tpl-field-url" name="url" data-field="url" autocomplete="off"
                 value="${helpers.escapeHtml(
                   data.url || ""
                 )}" placeholder="https://example.com">
        </div>
        
        <div class="tpl-field-group">
          <label class="tpl-field-label" for="tpl-field-icon">Icône (emoji)</label>
          <input type="text" class="tpl-input" id="tpl-field-icon" name="icon" data-field="icon" autocomplete="off"
                 value="${helpers.escapeHtml(
                   data.icon || "🌐"
                 )}" maxlength="2" style="width: 80px;">
        </div>
      </div>

      <div class="tpl-glass-panel">
        <div class="tpl-section-title green">
          <i class="fas fa-expand-arrows-alt"></i>
          Dimensions
        </div>
        
        <div class="tpl-field-group">
          <label class="tpl-field-label" for="tpl-field-maxWidth">Largeur maximale</label>
          <input type="text" class="tpl-input" id="tpl-field-maxWidth" name="maxWidth" data-field="maxWidth" autocomplete="off"
                 value="${helpers.escapeHtml(
                   data.maxWidth || "1100px"
                 )}" placeholder="1100px">
        </div>
        
        <div class="tpl-field-group">
          <label class="tpl-field-label" for="tpl-field-height">Hauteur</label>
          <input type="text" class="tpl-input" id="tpl-field-height" name="height" data-field="height" autocomplete="off"
                 value="${helpers.escapeHtml(
                   data.height || "85vh"
                 )}" placeholder="85vh">
        </div>
      </div>
    `;
  },

  // ============================================
  // 👁️ APERÇU LIVE
  // ============================================
  renderPreview: function (data, helpers) {
    const hue = data.theme?.hue ?? 260;
    const glow = data.theme?.glow ?? 20;
    const title = helpers.escapeHtml(data.title || "Site Web");
    const icon = data.icon || "🌐";
    const url = helpers.escapeHtml(data.url || "https://example.com");

    return `
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600;700&display=swap');
      </style>
      <div style="
        font-family:'Outfit',sans-serif;
        width:420px; max-width:100%;
        background:linear-gradient(160deg, hsl(${hue},30%,15%) 0%, hsl(${hue},40%,5%) 100%);
        border-radius:20px;
        outline:1px solid hsla(${hue},70%,70%,0.2);
        box-shadow:0 25px 60px rgba(0,0,0,0.6), 0 0 ${glow}px hsla(${hue},80%,60%,0.5);
        overflow:hidden;
      ">
        <!-- Header -->
        <div style="
          padding:16px 20px;
          background:linear-gradient(to bottom, rgba(255,255,255,0.06), transparent);
          border-bottom:1px solid hsla(${hue},50%,50%,0.15);
          display:flex;
          justify-content:space-between;
          align-items:center;
        ">
          <div style="display:flex;align-items:center;gap:12px;">
            <span style="font-size:22px;">${icon}</span>
            <span style="color:white;font-size:16px;font-weight:600;">${title}</span>
          </div>
          <div style="
            width:32px;height:32px;
            background:rgba(255,255,255,0.08);
            border-radius:50%;
            display:flex;align-items:center;justify-content:center;
            color:rgba(255,255,255,0.6);
            font-size:16px;
            cursor:pointer;
          ">×</div>
        </div>
        
        <!-- Zone Iframe Preview -->
        <div style="
          height:220px;
          background:linear-gradient(135deg, hsl(${hue},20%,8%) 0%, hsl(${hue},25%,12%) 100%);
          display:flex;
          flex-direction:column;
          align-items:center;
          justify-content:center;
          gap:16px;
          color:rgba(255,255,255,0.5);
          font-size:13px;
          border-radius:0 0 20px 20px;
        ">
          <div style="
            width:60px;height:60px;
            border-radius:16px;
            background:hsla(${hue},60%,50%,0.15);
            border:1px solid hsla(${hue},60%,60%,0.3);
            display:flex;align-items:center;justify-content:center;
          ">
            <span style="font-size:28px;">🌐</span>
          </div>
          <div style="text-align:center;">
            <div style="color:rgba(255,255,255,0.7);margin-bottom:4px;">Aperçu iframe</div>
            <div style="
              font-family:'SF Mono','Fira Code',monospace;
              font-size:11px;
              color:hsla(${hue},70%,70%,0.8);
              max-width:300px;
              overflow:hidden;
              text-overflow:ellipsis;
              white-space:nowrap;
            ">${url}</div>
          </div>
        </div>
      </div>
    `;
  },

  // ============================================
  // 🔧 GÉNÉRATION JS - POPUP FINALE
  // ============================================
  generateJS: function (objectName, config, timestamp) {
    const title = this.escapeJS(config.title || "Site Web");
    const url = this.escapeJS(config.url || "about:blank");
    const icon = config.icon || "🌐";
    const maxWidth = config.maxWidth || "1100px";
    const height = config.height || "85vh";
    const hue = config.theme?.hue ?? 260;
    const glow = config.theme?.glow ?? 20;

    return `/**
 * 🌐 Popup Iframe - ${objectName}
 * Généré le ${timestamp}
 */
(function(){
"use strict";

var ID = "${objectName}";
var CFG = {
  title: "${title}",
  url: "${url}",
  icon: "${icon}",
  maxWidth: "${maxWidth}",
  height: "${height}",
  hue: ${hue},
  glow: ${glow}
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
  s.textContent = "@keyframes pulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:0.6;transform:scale(0.95)}}";
  document.head.appendChild(s);
}

function show() {
  if (popup) { close(); return; }
  injectFont();
  injectStyles();

  var o = document.createElement("div");
  o.className = "popup-" + ID + "-overlay";
  o.style.cssText = "position:fixed;inset:0;background:rgba(0,0,0,0.85);backdrop-filter:blur(12px);z-index:99999;display:flex;align-items:center;justify-content:center;opacity:0;transition:opacity 0.3s;font-family:'Outfit',sans-serif;";

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

  o.innerHTML = '<div class="popup-' + ID + '" style="' +
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
    
    '<div class="popup-' + ID + '-loading" style="' +
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
      iframe.style.background = "white";
      iframe.style.opacity = "1";
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

console.log("🌐 Popup " + ID + " chargée");
})();`;
  },

  // ============================================
  // 🛡️ UTILITAIRE ÉCHAPPEMENT
  // ============================================
  escapeJS: function (str) {
    if (!str) return "";
    return String(str)
      .replace(/\\/g, "\\\\")
      .replace(/"/g, '\\"')
      .replace(/'/g, "\\'")
      .replace(/\n/g, "\\n")
      .replace(/\r/g, "\\r");
  },
};

console.log("🌐 Template Iframe chargé");
