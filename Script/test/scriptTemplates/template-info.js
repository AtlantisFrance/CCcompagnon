/**
 * ============================================
 * ℹ️ TEMPLATE INFO - ATLANTIS CITY
 * ============================================
 * Panneau d'information avec titre et contenu
 */

(function () {
  "use strict";

  if (!window.atlantisTemplates) {
    console.error("ℹ️ Template Info: Registry non disponible");
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
    title: "Titre",
    subtitle: "",
    content: "Contenu de l'information...",
    bgGradientStart: "#1e3a5f",
    bgGradientEnd: "#0f172a",
    accentColor: "#3b82f6",
    textColor: "#ffffff",
    showIcon: true,
    icon: "ℹ️",
  };

  // ============================================
  // 📝 GÉNÉRATION DU FORMULAIRE DE PARAMÈTRES
  // ============================================

  function generateParamsHTML(config) {
    return `
      <div class="te-params-section">
        <div class="te-params-section-title">📝 Contenu</div>
        <div class="te-form-group">
          <label class="te-form-label">Titre</label>
          <input type="text" class="te-form-input" value="${escapeHtml(
            config.title || ""
          )}"
                 onchange="window.templateEditor.updateConfig('title', this.value)">
        </div>
        <div class="te-form-group">
          <label class="te-form-label">Sous-titre</label>
          <input type="text" class="te-form-input" value="${escapeHtml(
            config.subtitle || ""
          )}"
                 onchange="window.templateEditor.updateConfig('subtitle', this.value)">
        </div>
        <div class="te-form-group">
          <label class="te-form-label">Contenu</label>
          <textarea class="te-form-textarea" rows="4"
                    onchange="window.templateEditor.updateConfig('content', this.value)">${escapeHtml(
                      config.content || ""
                    )}</textarea>
        </div>
        <div class="te-form-row">
          <div class="te-form-group">
            <label class="te-form-label">Icône</label>
            <input type="text" class="te-form-input" value="${escapeHtml(
              config.icon || "ℹ️"
            )}" maxlength="4"
                   onchange="window.templateEditor.updateConfig('icon', this.value)">
          </div>
          <div class="te-toggle-group">
            <span class="te-toggle-label">Afficher l'icône</span>
            <label class="te-toggle">
              <input type="checkbox" ${
                config.showIcon !== false ? "checked" : ""
              }
                     onchange="window.templateEditor.updateConfig('showIcon', this.checked)">
              <span class="te-toggle-slider"></span>
            </label>
          </div>
        </div>
      </div>

      <div class="te-params-section">
        <div class="te-params-section-title">🎨 Apparence</div>
        <div class="te-form-row">
          <div class="te-form-group">
            <label class="te-form-label">Fond - Début</label>
            <div class="te-color-group">
              <input type="color" class="te-color-input" value="${
                config.bgGradientStart || "#1e3a5f"
              }"
                     onchange="window.templateEditor.updateConfig('bgGradientStart', this.value)">
              <input type="text" class="te-color-value" value="${
                config.bgGradientStart || "#1e3a5f"
              }" readonly>
            </div>
          </div>
          <div class="te-form-group">
            <label class="te-form-label">Fond - Fin</label>
            <div class="te-color-group">
              <input type="color" class="te-color-input" value="${
                config.bgGradientEnd || "#0f172a"
              }"
                     onchange="window.templateEditor.updateConfig('bgGradientEnd', this.value)">
              <input type="text" class="te-color-value" value="${
                config.bgGradientEnd || "#0f172a"
              }" readonly>
            </div>
          </div>
        </div>
        <div class="te-form-group">
          <label class="te-form-label">Couleur d'accent</label>
          <div class="te-color-group">
            <input type="color" class="te-color-input" value="${
              config.accentColor || "#3b82f6"
            }"
                   onchange="window.templateEditor.updateConfig('accentColor', this.value)">
            <input type="text" class="te-color-value" value="${
              config.accentColor || "#3b82f6"
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
    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      background: linear-gradient(135deg, ${
        config.bgGradientStart || "#1e3a5f"
      } 0%, ${config.bgGradientEnd || "#0f172a"} 100%);
      min-height: 100vh;
      color: ${config.textColor || "#ffffff"};
      padding: 30px;
    }
    .info-popup { max-width: 400px; margin: 0 auto; }
    .info-header {
      display: flex;
      align-items: center;
      gap: 16px;
      margin-bottom: 20px;
    }
    .info-icon {
      width: 50px; height: 50px;
      background: ${config.accentColor || "#3b82f6"};
      border-radius: 12px;
      display: ${config.showIcon !== false ? "flex" : "none"};
      align-items: center;
      justify-content: center;
      font-size: 24px;
    }
    .info-title { font-size: 24px; font-weight: 600; }
    .info-subtitle { font-size: 14px; opacity: 0.7; margin-top: 4px; }
    .info-content {
      font-size: 15px;
      line-height: 1.6;
      opacity: 0.9;
      padding: 20px;
      background: rgba(255,255,255,0.05);
      border-radius: 12px;
      border-left: 3px solid ${config.accentColor || "#3b82f6"};
    }
  </style>
</head>
<body>
  <div class="info-popup">
    <div class="info-header">
      <div class="info-icon">${escapeHtml(config.icon || "ℹ️")}</div>
      <div>
        <h1 class="info-title">${escapeHtml(config.title || "")}</h1>
        ${
          config.subtitle
            ? `<p class="info-subtitle">${escapeHtml(config.subtitle)}</p>`
            : ""
        }
      </div>
    </div>
    <div class="info-content">${escapeHtml(config.content || "")}</div>
  </div>
</body>
</html>`;
  }

  // ============================================
  // 📋 ENREGISTREMENT
  // ============================================

  window.atlantisTemplates.register("info", {
    name: "Info",
    icon: "ℹ️",
    description: "Panneau d'information",
    defaultConfig: defaultConfig,
    generateHTML: generateHTML,
    generateParamsHTML: generateParamsHTML,
  });

  console.log("ℹ️ Template Info: ✅ Enregistré");
})();
