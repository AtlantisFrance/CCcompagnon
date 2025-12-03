/**
 * ============================================
 * 🖼️ TEMPLATE IFRAME - Atlantis City - CORRIGÉ
 * Intégration de contenu externe
 * Utilise les classes .param-* du CSS
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

  // Configuration par défaut
  const defaultConfig = {
    url: "https://example.com",
    width: "100%",
    height: "400px",
    allowFullscreen: true,
    bgColor: "#000000",
  };

  // Génération des paramètres
  function generateParamsHTML(config) {
    const cfg = { ...defaultConfig, ...config };

    return `
      <!-- Section Source -->
      <div class="params-section">
        <div class="params-section-title">🔗 Source</div>
        
        <div class="param-group">
          <label class="param-label">URL à intégrer</label>
          <input type="url" class="param-input" 
                 value="${escapeHtml(cfg.url)}" 
                 placeholder="https://..."
                 onchange="window.templateEditor.updateConfig('url', this.value)">
        </div>

        <label class="param-toggle">
          <input type="checkbox" ${cfg.allowFullscreen ? "checked" : ""} 
                 onchange="window.templateEditor.updateConfig('allowFullscreen', this.checked)">
          <span class="toggle-slider"></span>
          <span class="toggle-label">Autoriser le plein écran</span>
        </label>
      </div>

      <!-- Section Dimensions -->
      <div class="params-section">
        <div class="params-section-title">📐 Dimensions</div>
        
        <div class="param-group">
          <label class="param-label">Largeur</label>
          <input type="text" class="param-input" 
                 value="${escapeHtml(cfg.width)}" 
                 placeholder="100% ou 800px"
                 onchange="window.templateEditor.updateConfig('width', this.value)">
        </div>
        <div class="param-group">
          <label class="param-label">Hauteur</label>
          <input type="text" class="param-input" 
                 value="${escapeHtml(cfg.height)}" 
                 placeholder="400px"
                 onchange="window.templateEditor.updateConfig('height', this.value)">
        </div>
      </div>

      <!-- Section Apparence -->
      <div class="params-section">
        <div class="params-section-title">🎨 Apparence</div>
        
        <div class="param-group">
          <label class="param-label">Couleur de fond</label>
          <div class="param-gradient-row">
            <input type="color" class="param-color" 
                   value="${cfg.bgColor}" 
                   onchange="window.templateEditor.updateConfig('bgColor', this.value)">
            <span style="color: #64748b; font-size: 12px; margin-left: 8px;">${
              cfg.bgColor
            }</span>
          </div>
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
  }

  // Génération du HTML final
  function generateHTML(config) {
    const cfg = { ...defaultConfig, ...config };
    const fullscreenAttr = cfg.allowFullscreen ? "allowfullscreen" : "";

    return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body { width: 100%; height: 100%; }
    body {
      background: ${cfg.bgColor};
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .iframe-container {
      width: ${cfg.width};
      height: ${cfg.height};
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
      src="${escapeHtml(cfg.url)}" 
      ${fullscreenAttr}
      loading="lazy"
      referrerpolicy="no-referrer-when-downgrade">
    </iframe>
  </div>
</body>
</html>`;
  }

  // Enregistrer le template
  window.atlantisTemplates.register("iframe", {
    name: "iFrame",
    icon: "🖼️",
    description: "Intégrer du contenu externe via URL",
    defaultConfig: defaultConfig,
    generateHTML: generateHTML,
    generateParamsHTML: generateParamsHTML,
  });

  console.log("✅ Template iFrame enregistré");
})();
