/**
 * ============================================
 * 🎬 TEMPLATE YOUTUBE - POPUP STUDIO DESIGN
 * Atlantis City
 * v1.0 - 2024-12-10 - Popup vidéo YouTube avec lecteur intégré
 * ============================================
 */

window.ATLANTIS_TEMPLATES = window.ATLANTIS_TEMPLATES || {};

window.ATLANTIS_TEMPLATES.youtube = {
  name: "Vidéo YouTube",
  icon: "🎬",
  description: "Lecteur vidéo YouTube intégré",

  // ============================================
  // 📋 DONNÉES PAR DÉFAUT
  // ============================================
  getDefaultData: function () {
    return {
      title: "Ma Vidéo",
      videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      description: "",
      autoplay: false,
      showControls: true,
      maxWidth: "900px",
      theme: { hue: 0, glow: 25 },
    };
  },

  // ============================================
  // 🔧 UTILITAIRES
  // ============================================
  extractYouTubeId: function (url) {
    if (!url) return null;
    var patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/v\/)([^&\n?#]+)/,
      /^([a-zA-Z0-9_-]{11})$/,
    ];
    for (var i = 0; i < patterns.length; i++) {
      var match = url.match(patterns[i]);
      if (match) return match[1];
    }
    return null;
  },

  getThumbnailUrl: function (videoId) {
    if (!videoId) return "";
    return "https://img.youtube.com/vi/" + videoId + "/maxresdefault.jpg";
  },

  // ============================================
  // 📝 FORMULAIRE D'ÉDITION
  // ============================================
  renderForm: function (data, helpers) {
    const theme = data.theme || { hue: 0, glow: 25 };

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
          <i class="fas fa-video"></i>
          Configuration Vidéo
        </div>
        
        <div class="tpl-field-group">
          <label class="tpl-field-label" for="tpl-field-title">Titre de la vidéo</label>
          <input type="text" class="tpl-input" id="tpl-field-title" name="title" data-field="title" autocomplete="off"
                 value="${helpers.escapeHtml(
                   data.title || ""
                 )}" placeholder="Ma super vidéo">
        </div>
        
        <div class="tpl-field-group">
          <label class="tpl-field-label" for="tpl-field-videoUrl">URL YouTube</label>
          <input type="url" class="tpl-input url" id="tpl-field-videoUrl" name="videoUrl" data-field="videoUrl" autocomplete="off"
                 value="${helpers.escapeHtml(
                   data.videoUrl || ""
                 )}" placeholder="https://www.youtube.com/watch?v=...">
          <small style="color:rgba(255,255,255,0.4);font-size:11px;margin-top:4px;display:block;">
            Formats acceptés : youtube.com/watch?v=, youtu.be/, ou ID direct
          </small>
        </div>
        
        <div class="tpl-field-group">
          <label class="tpl-field-label" for="tpl-field-description">Description (optionnel)</label>
          <textarea class="tpl-input" id="tpl-field-description" name="description" data-field="description" autocomplete="off"
                    rows="3" placeholder="Description de la vidéo..." style="resize:vertical;min-height:60px;">${helpers.escapeHtml(
                      data.description || ""
                    )}</textarea>
        </div>
      </div>

      <div class="tpl-glass-panel">
        <div class="tpl-section-title green">
          <i class="fas fa-cog"></i>
          Options du lecteur
        </div>
        
        <div class="tpl-field-group" style="display:flex;align-items:center;gap:12px;">
          <input type="checkbox" id="tpl-field-autoplay" name="autoplay" data-field="autoplay" 
                 ${
                   data.autoplay ? "checked" : ""
                 } style="width:18px;height:18px;accent-color:hsl(${
      theme.hue
    },70%,50%);">
          <label class="tpl-field-label" for="tpl-field-autoplay" style="margin:0;cursor:pointer;">
            Lecture automatique
          </label>
        </div>
        
        <div class="tpl-field-group" style="display:flex;align-items:center;gap:12px;">
          <input type="checkbox" id="tpl-field-showControls" name="showControls" data-field="showControls"
                 ${
                   data.showControls !== false ? "checked" : ""
                 } style="width:18px;height:18px;accent-color:hsl(${
      theme.hue
    },70%,50%);">
          <label class="tpl-field-label" for="tpl-field-showControls" style="margin:0;cursor:pointer;">
            Afficher les contrôles
          </label>
        </div>
        
        <div class="tpl-field-group">
          <label class="tpl-field-label" for="tpl-field-maxWidth">Largeur maximale</label>
          <input type="text" class="tpl-input" id="tpl-field-maxWidth" name="maxWidth" data-field="maxWidth" autocomplete="off"
                 value="${helpers.escapeHtml(
                   data.maxWidth || "900px"
                 )}" placeholder="900px">
        </div>
      </div>
    `;
  },

  // ============================================
  // 👁️ APERÇU LIVE
  // ============================================
  renderPreview: function (data, helpers) {
    const hue = data.theme?.hue ?? 0;
    const glow = data.theme?.glow ?? 25;
    const title = helpers.escapeHtml(data.title || "Ma Vidéo");
    const description = helpers.escapeHtml(data.description || "");
    const videoId = this.extractYouTubeId(data.videoUrl);
    const thumbnail = this.getThumbnailUrl(videoId);

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
            <span style="font-size:22px;">🎬</span>
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
        
        <!-- Zone Vidéo Preview -->
        <div style="
          position:relative;
          width:100%;
          padding-top:56.25%;
          background:linear-gradient(135deg, hsl(${hue},20%,8%) 0%, hsl(${hue},25%,12%) 100%);
          ${
            thumbnail
              ? "background-image:url(" +
                thumbnail +
                ");background-size:cover;background-position:center;"
              : ""
          }
        ">
          <!-- Play Button Overlay -->
          <div style="
            position:absolute;
            inset:0;
            display:flex;
            align-items:center;
            justify-content:center;
            background:rgba(0,0,0,0.4);
          ">
            <div style="
              width:68px;height:48px;
              background:hsla(${hue},70%,50%,0.95);
              border-radius:12px;
              display:flex;align-items:center;justify-content:center;
              box-shadow:0 4px 20px hsla(${hue},80%,40%,0.5);
              transition:transform 0.2s;
            ">
              <div style="
                width:0;height:0;
                border-left:18px solid white;
                border-top:11px solid transparent;
                border-bottom:11px solid transparent;
                margin-left:4px;
              "></div>
            </div>
          </div>
          
          ${
            !videoId
              ? `
          <div style="
            position:absolute;
            inset:0;
            display:flex;
            flex-direction:column;
            align-items:center;
            justify-content:center;
            gap:12px;
            color:rgba(255,255,255,0.5);
            font-size:13px;
            background:linear-gradient(135deg, hsl(${hue},20%,8%) 0%, hsl(${hue},25%,12%) 100%);
          ">
            <div style="
              width:60px;height:60px;
              border-radius:16px;
              background:hsla(${hue},60%,50%,0.15);
              border:1px solid hsla(${hue},60%,60%,0.3);
              display:flex;align-items:center;justify-content:center;
            ">
              <span style="font-size:28px;">🎬</span>
            </div>
            <div style="color:rgba(255,255,255,0.6);">Entrez une URL YouTube</div>
          </div>
          `
              : ""
          }
        </div>
        
        ${
          description
            ? `
        <!-- Description -->
        <div style="
          padding:16px 20px;
          border-top:1px solid hsla(${hue},50%,50%,0.15);
        ">
          <p style="
            margin:0;
            color:rgba(255,255,255,0.7);
            font-size:13px;
            line-height:1.5;
          ">${description}</p>
        </div>
        `
            : ""
        }
      </div>
    `;
  },

  // ============================================
  // 📦 GÉNÉRATION JS - POPUP FINALE
  // ============================================
  generateJS: function (objectName, config, timestamp) {
    const title = this.escapeJS(config.title || "Vidéo");
    const videoUrl = config.videoUrl || "";
    const videoId = this.extractYouTubeId(videoUrl) || "";
    const description = this.escapeJS(config.description || "");
    const autoplay = config.autoplay ? 1 : 0;
    const controls = config.showControls !== false ? 1 : 0;
    const maxWidth = config.maxWidth || "900px";
    const hue = config.theme?.hue ?? 0;
    const glow = config.theme?.glow ?? 25;

    return `/**
 * 🎬 Popup YouTube - ${objectName}
 * Généré le ${timestamp}
 */
(function(){
"use strict";

var ID = "${objectName}";
var CFG = {
  title: "${title}",
  videoId: "${videoId}",
  description: "${description}",
  autoplay: ${autoplay},
  controls: ${controls},
  maxWidth: "${maxWidth}",
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

console.log("🎬 Template YouTube chargé");
