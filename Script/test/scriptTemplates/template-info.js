/**
 * ============================================
 * ℹ️ TEMPLATE INFO - ATLANTIS CITY - CORRIGÉ
 * ============================================
 * Panneau d'information avec titre et contenu
 * Utilise les classes .param-* du CSS
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
    const cfg = { ...defaultConfig, ...config };

    return `
      <div class="params-section">
        <div class="params-section-title">📝 Contenu</div>
        <div class="param-group">
          <label class="param-label">Titre</label>
          <input type="text" class="param-input" value="${escapeHtml(
            cfg.title || ""
          )}"
                 onchange="window.templateEditor.updateConfig('title', this.value)">
        </div>
        <div class="param-group">
          <label class="param-label">Sous-titre</label>
          <input type="text" class="param-input" value="${escapeHtml(
            cfg.subtitle || ""
          )}"
                 onchange="window.templateEditor.updateConfig('subtitle', this.value)">
        </div>
        <div class="param-group">
          <label class="param-label">Contenu</label>
          <textarea class="param-input" rows="4" style="resize: vertical;"
                    onchange="window.templateEditor.updateConfig('content', this.value)">${escapeHtml(
                      cfg.content || ""
                    )}</textarea>
        </div>
        <div class="param-group">
          <label class="param-label">Icône</label>
          <input type="text" class="param-input" value="${escapeHtml(
            cfg.icon || "ℹ️"
          )}" maxlength="4" style="width: 80px;"
                 onchange="window.templateEditor.updateConfig('icon', this.value)">
        </div>
        <label class="param-toggle">
          <input type="checkbox" ${cfg.showIcon !== false ? "checked" : ""}
                 onchange="window.templateEditor.updateConfig('showIcon', this.checked)">
          <span class="toggle-slider"></span>
          <span class="toggle-label">Afficher l'icône</span>
        </label>
      </div>

      <div class="params-section">
        <div class="params-section-title">🎨 Apparence</div>
        <div class="param-group">
          <label class="param-label">Fond (dégradé)</label>
          <div class="param-gradient-row">
            <input type="color" class="param-color" value="${
              cfg.bgGradientStart || "#1e3a5f"
            }"
                   onchange="window.templateEditor.updateConfig('bgGradientStart', this.value)">
            <span class="gradient-arrow">→</span>
            <input type="color" class="param-color" value="${
              cfg.bgGradientEnd || "#0f172a"
            }"
                   onchange="window.templateEditor.updateConfig('bgGradientEnd', this.value)">
          </div>
        </div>
        <div class="param-group">
          <label class="param-label">Couleur d'accent</label>
          <div class="param-gradient-row">
            <input type="color" class="param-color" value="${
              cfg.accentColor || "#3b82f6"
            }"
                   onchange="window.templateEditor.updateConfig('accentColor', this.value)">
            <span style="color: #64748b; font-size: 12px; margin-left: 8px;">${
              cfg.accentColor || "#3b82f6"
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

    return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body { width: 100%; height: 100%; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      background: linear-gradient(135deg, ${
        cfg.bgGradientStart || "#1e3a5f"
      } 0%, ${cfg.bgGradientEnd || "#0f172a"} 100%);
      min-height: 100vh;
      color: ${cfg.textColor || "#ffffff"};
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
      background: ${cfg.accentColor || "#3b82f6"};
      border-radius: 12px;
      display: ${cfg.showIcon !== false ? "flex" : "none"};
      align-items: center;
      justify-content: center;
      font-size: 24px;
      flex-shrink: 0;
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
      border-left: 3px solid ${cfg.accentColor || "#3b82f6"};
    }
  </style>
</head>
<body>
  <div class="info-popup">
    <div class="info-header">
      <div class="info-icon">${escapeHtml(cfg.icon || "ℹ️")}</div>
      <div>
        <h1 class="info-title">${escapeHtml(cfg.title || "")}</h1>
        ${
          cfg.subtitle
            ? `<p class="info-subtitle">${escapeHtml(cfg.subtitle)}</p>`
            : ""
        }
      </div>
    </div>
    <div class="info-content">${escapeHtml(cfg.content || "")}</div>
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
