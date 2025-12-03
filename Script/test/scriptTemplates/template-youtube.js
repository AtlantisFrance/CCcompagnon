/**
 * ============================================
 * ▶️ TEMPLATE YOUTUBE - ATLANTIS CITY
 * ============================================
 * Intégration vidéo YouTube
 */

(function () {
  "use strict";

  if (!window.atlantisTemplates) {
    console.error("▶️ Template YouTube: Registry non disponible");
    return;
  }

  // ============================================
  // 🔧 HELPERS
  // ============================================

  function escapeHtml(str) {
    if (!str) return "";
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  // ============================================
  // ⚙️ CONFIGURATION PAR DÉFAUT
  // ============================================

  const defaultConfig = {
    videoId: "",
    aspectRatio: "16:9",
    autoplay: false,
    controls: true,
    muted: false,
    loop: false,
    bgColor: "#000000",
  };

  // ============================================
  // 📝 GÉNÉRATION DU FORMULAIRE DE PARAMÈTRES
  // ============================================

  function generateParamsHTML(config) {
    return `
      <div class="te-params-section">
        <div class="te-params-section-title">▶️ Vidéo</div>
        <div class="te-form-group">
          <label class="te-form-label">ID de la vidéo YouTube</label>
          <input type="text" class="te-form-input" value="${escapeHtml(
            config.videoId || ""
          )}"
                 placeholder="Ex: dQw4w9WgXcQ"
                 onchange="window.templateEditor.updateConfig('videoId', this.value)">
          <small style="color: #64748b; font-size: 11px; margin-top: 4px; display: block;">
            L'ID se trouve dans l'URL: youtube.com/watch?v=<strong>ID_ICI</strong>
          </small>
        </div>
        <div class="te-form-group">
          <label class="te-form-label">Format</label>
          <select class="te-form-select" onchange="window.templateEditor.updateConfig('aspectRatio', this.value)">
            <option value="16:9" ${
              config.aspectRatio === "16:9" ? "selected" : ""
            }>16:9 (Standard)</option>
            <option value="4:3" ${
              config.aspectRatio === "4:3" ? "selected" : ""
            }>4:3 (Ancien)</option>
            <option value="1:1" ${
              config.aspectRatio === "1:1" ? "selected" : ""
            }>1:1 (Carré)</option>
            <option value="9:16" ${
              config.aspectRatio === "9:16" ? "selected" : ""
            }>9:16 (Vertical)</option>
          </select>
        </div>
      </div>

      <div class="te-params-section">
        <div class="te-params-section-title">⚙️ Options</div>
        <div class="te-toggle-group">
          <span class="te-toggle-label">Lecture automatique</span>
          <label class="te-toggle">
            <input type="checkbox" ${config.autoplay ? "checked" : ""}
                   onchange="window.templateEditor.updateConfig('autoplay', this.checked)">
            <span class="te-toggle-slider"></span>
          </label>
        </div>
        <div class="te-toggle-group" style="margin-top: 8px;">
          <span class="te-toggle-label">Afficher les contrôles</span>
          <label class="te-toggle">
            <input type="checkbox" ${config.controls !== false ? "checked" : ""}
                   onchange="window.templateEditor.updateConfig('controls', this.checked)">
            <span class="te-toggle-slider"></span>
          </label>
        </div>
        <div class="te-toggle-group" style="margin-top: 8px;">
          <span class="te-toggle-label">Muet</span>
          <label class="te-toggle">
            <input type="checkbox" ${config.muted ? "checked" : ""}
                   onchange="window.templateEditor.updateConfig('muted', this.checked)">
            <span class="te-toggle-slider"></span>
          </label>
        </div>
        <div class="te-toggle-group" style="margin-top: 8px;">
          <span class="te-toggle-label">Boucle</span>
          <label class="te-toggle">
            <input type="checkbox" ${config.loop ? "checked" : ""}
                   onchange="window.templateEditor.updateConfig('loop', this.checked)">
            <span class="te-toggle-slider"></span>
          </label>
        </div>
      </div>

      <div class="te-params-section">
        <div class="te-params-section-title">🎨 Apparence</div>
        <div class="te-form-group">
          <label class="te-form-label">Couleur de fond</label>
          <div class="te-color-group">
            <input type="color" class="te-color-input" value="${
              config.bgColor || "#000000"
            }"
                   onchange="window.templateEditor.updateConfig('bgColor', this.value)">
            <input type="text" class="te-color-value" value="${
              config.bgColor || "#000000"
            }" readonly>
          </div>
        </div>
      </div>
    `;
  }

  // ============================================
  // 🖼️ GÉNÉRATION DU HTML FINAL
  // ============================================

  function generateHTML(config) {
    if (!config.videoId) {
      return `<div style="display:flex;align-items:center;justify-content:center;height:100%;background:#000;color:white;font-family:sans-serif;">
        <p>Aucun ID vidéo défini</p>
      </div>`;
    }

    const params = [];
    if (config.autoplay) params.push("autoplay=1");
    if (config.controls === false) params.push("controls=0");
    if (config.muted) params.push("mute=1");
    if (config.loop) params.push("loop=1", `playlist=${config.videoId}`);
    params.push("rel=0");

    const paramString = params.length > 0 ? "?" + params.join("&") : "";

    let paddingRatio = "56.25%"; // 16:9
    if (config.aspectRatio === "4:3") paddingRatio = "75%";
    if (config.aspectRatio === "1:1") paddingRatio = "100%";
    if (config.aspectRatio === "9:16") paddingRatio = "177.78%";

    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    * { margin: 0; padding: 0; }
    body { background: ${config.bgColor || "#000000"}; }
    .video-container {
      position: relative;
      width: 100%;
      padding-bottom: ${paddingRatio};
    }
    iframe {
      position: absolute;
      top: 0; left: 0;
      width: 100%; height: 100%;
      border: none;
    }
  </style>
</head>
<body>
  <div class="video-container">
    <iframe src="https://www.youtube.com/embed/${escapeHtml(
      config.videoId
    )}${paramString}" 
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
            allowfullscreen></iframe>
  </div>
</body>
</html>`;
  }

  // ============================================
  // 📋 ENREGISTREMENT
  // ============================================

  window.atlantisTemplates.register("youtube", {
    name: "YouTube",
    icon: "▶️",
    description: "Vidéo YouTube intégrée",
    defaultConfig: defaultConfig,
    generateHTML: generateHTML,
    generateParamsHTML: generateParamsHTML,
  });

  console.log("▶️ Template YouTube: ✅ Enregistré");
})();
