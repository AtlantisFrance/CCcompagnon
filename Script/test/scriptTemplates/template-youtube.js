/**
 * ============================================
 * ▶️ TEMPLATE YOUTUBE - ATLANTIS CITY - CORRIGÉ
 * ============================================
 * Intégration vidéo YouTube
 * Utilise les classes .param-* du CSS
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
    const cfg = { ...defaultConfig, ...config };

    return `
      <div class="params-section">
        <div class="params-section-title">▶️ Vidéo</div>
        <div class="param-group">
          <label class="param-label">ID de la vidéo YouTube</label>
          <input type="text" class="param-input" value="${escapeHtml(
            cfg.videoId || ""
          )}"
                 placeholder="Ex: dQw4w9WgXcQ"
                 onchange="window.templateEditor.updateConfig('videoId', this.value)">
          <small style="color: #64748b; font-size: 11px; margin-top: 4px; display: block;">
            L'ID se trouve dans l'URL: youtube.com/watch?v=<strong>ID_ICI</strong>
          </small>
        </div>
        <div class="param-group">
          <label class="param-label">Format</label>
          <select class="param-input" onchange="window.templateEditor.updateConfig('aspectRatio', this.value)">
            <option value="16:9" ${
              cfg.aspectRatio === "16:9" ? "selected" : ""
            }>16:9 (Standard)</option>
            <option value="4:3" ${
              cfg.aspectRatio === "4:3" ? "selected" : ""
            }>4:3 (Ancien)</option>
            <option value="1:1" ${
              cfg.aspectRatio === "1:1" ? "selected" : ""
            }>1:1 (Carré)</option>
            <option value="9:16" ${
              cfg.aspectRatio === "9:16" ? "selected" : ""
            }>9:16 (Vertical)</option>
          </select>
        </div>
      </div>

      <div class="params-section">
        <div class="params-section-title">⚙️ Options</div>
        <label class="param-toggle">
          <input type="checkbox" ${cfg.autoplay ? "checked" : ""}
                 onchange="window.templateEditor.updateConfig('autoplay', this.checked)">
          <span class="toggle-slider"></span>
          <span class="toggle-label">Lecture automatique</span>
        </label>
        <label class="param-toggle">
          <input type="checkbox" ${cfg.controls !== false ? "checked" : ""}
                 onchange="window.templateEditor.updateConfig('controls', this.checked)">
          <span class="toggle-slider"></span>
          <span class="toggle-label">Afficher les contrôles</span>
        </label>
        <label class="param-toggle">
          <input type="checkbox" ${cfg.muted ? "checked" : ""}
                 onchange="window.templateEditor.updateConfig('muted', this.checked)">
          <span class="toggle-slider"></span>
          <span class="toggle-label">Muet</span>
        </label>
        <label class="param-toggle">
          <input type="checkbox" ${cfg.loop ? "checked" : ""}
                 onchange="window.templateEditor.updateConfig('loop', this.checked)">
          <span class="toggle-slider"></span>
          <span class="toggle-label">Boucle</span>
        </label>
      </div>

      <div class="params-section">
        <div class="params-section-title">🎨 Apparence</div>
        <div class="param-group">
          <label class="param-label">Couleur de fond</label>
          <div class="param-gradient-row">
            <input type="color" class="param-color" value="${
              cfg.bgColor || "#000000"
            }"
                   onchange="window.templateEditor.updateConfig('bgColor', this.value)">
            <span style="color: #64748b; font-size: 12px; margin-left: 8px;">${
              cfg.bgColor || "#000000"
            }</span>
          </div>
        </div>
      </div>
    `;
  }

  // ============================================
  // 🖼️ GÉNÉRATION DU HTML FINAL
  // ============================================

  function generateHTML(config) {
    const cfg = { ...defaultConfig, ...config };

    if (!cfg.videoId) {
      return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { 
      display: flex; 
      align-items: center; 
      justify-content: center; 
      height: 100vh; 
      margin: 0;
      background: #000; 
      color: white; 
      font-family: sans-serif; 
    }
  </style>
</head>
<body>
  <p>⚠️ Aucun ID vidéo défini</p>
</body>
</html>`;
    }

    const params = [];
    if (cfg.autoplay) params.push("autoplay=1");
    if (cfg.controls === false) params.push("controls=0");
    if (cfg.muted) params.push("mute=1");
    if (cfg.loop) params.push("loop=1", `playlist=${cfg.videoId}`);
    params.push("rel=0");

    const paramString = params.length > 0 ? "?" + params.join("&") : "";

    let paddingRatio = "56.25%"; // 16:9
    if (cfg.aspectRatio === "4:3") paddingRatio = "75%";
    if (cfg.aspectRatio === "1:1") paddingRatio = "100%";
    if (cfg.aspectRatio === "9:16") paddingRatio = "177.78%";

    return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body { width: 100%; height: 100%; }
    body { background: ${cfg.bgColor || "#000000"}; }
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
      cfg.videoId
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
