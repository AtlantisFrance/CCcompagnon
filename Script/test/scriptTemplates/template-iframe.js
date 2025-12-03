/**
 * ============================================
 * 🖼️ TEMPLATE IFRAME - Atlantis City
 * Intégration de contenu externe
 * ============================================
 */

(function () {
  "use strict";

  // Vérifier que le registre existe
  if (!window.atlantisTemplates) {
    console.error("❌ Template iFrame: atlantisTemplates registry not found!");
    return;
  }

  // Helper escape HTML
  function escapeHtml(text) {
    if (!text) return "";
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
  }

  // Enregistrer le template
  window.atlantisTemplates.register("iframe", {
    name: "iFrame",
    icon: "🖼️",
    description: "Intégrer du contenu externe via URL",

    defaultConfig: {
      url: "https://example.com",
      width: "100%",
      height: "400px",
      allowFullscreen: true,
      bgColor: "#000000",
    },

    generateParamsHTML: function (config) {
      return `
        <!-- Section Source -->
        <div class="params-section">
          <div class="params-section-title">🔗 Source</div>
          
          <div class="param-group">
            <label class="param-label">URL à intégrer</label>
            <input type="url" class="param-input" id="param-url" 
                   value="${escapeHtml(config.url)}" 
                   placeholder="https://..."
                   onchange="window.templateEditor.updateConfig('url', this.value)">
          </div>

          <div class="param-group">
            <label class="param-label param-checkbox">
              <input type="checkbox" id="param-allowFullscreen" 
                     ${config.allowFullscreen ? "checked" : ""} 
                     onchange="window.templateEditor.updateConfig('allowFullscreen', this.checked)">
              <span>Autoriser le plein écran</span>
            </label>
          </div>
        </div>

        <!-- Section Dimensions -->
        <div class="params-section">
          <div class="params-section-title">📐 Dimensions</div>
          
          <div class="param-row">
            <div class="param-group">
              <label class="param-label">Largeur</label>
              <input type="text" class="param-input" id="param-width" 
                     value="${escapeHtml(config.width)}" 
                     placeholder="100% ou 800px"
                     onchange="window.templateEditor.updateConfig('width', this.value)">
            </div>
            <div class="param-group">
              <label class="param-label">Hauteur</label>
              <input type="text" class="param-input" id="param-height" 
                     value="${escapeHtml(config.height)}" 
                     placeholder="400px"
                     onchange="window.templateEditor.updateConfig('height', this.value)">
            </div>
          </div>
        </div>

        <!-- Section Apparence -->
        <div class="params-section">
          <div class="params-section-title">🎨 Apparence</div>
          
          <div class="param-group">
            <label class="param-label">Couleur de fond</label>
            <input type="color" class="param-color" id="param-bgColor" 
                   value="${config.bgColor}" 
                   onchange="window.templateEditor.updateConfig('bgColor', this.value)">
          </div>
        </div>

        <!-- Info -->
        <div class="params-section">
          <div style="padding: 12px; background: rgba(255,193,7,0.1); border-radius: 8px; border-left: 3px solid #ffc107;">
            <div style="font-size: 12px; color: #ffc107; margin-bottom: 4px;">⚠️ Note</div>
            <div style="font-size: 11px; color: #94a3b8; line-height: 1.5;">
              Certains sites bloquent l'intégration en iframe. 
              Testez votre URL pour vérifier la compatibilité.
            </div>
          </div>
        </div>
      `;
    },

    generateHTML: function (config) {
      const fullscreenAttr = config.allowFullscreen ? "allowfullscreen" : "";

      return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      background: ${config.bgColor};
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .iframe-container {
      width: ${config.width};
      height: ${config.height};
      max-width: 100%;
    }
    iframe {
      width: 100%;
      height: 100%;
      border: none;
      border-radius: 8px;
    }
  </style>
</head>
<body>
  <div class="iframe-container">
    <iframe 
      src="${escapeHtml(config.url)}" 
      ${fullscreenAttr}
      loading="lazy"
      referrerpolicy="no-referrer-when-downgrade">
    </iframe>
  </div>
</body>
</html>`;
    },
  });

  console.log("✅ Template iFrame enregistré");
})();
