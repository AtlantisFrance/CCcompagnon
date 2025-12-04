/**
 * ============================================
 * 🌐 TEMPLATE IFRAME
 * Génère une popup avec intégration de site web
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
      width: "90%",
      maxWidth: "1100px",
      height: "85vh",
      colors: {
        header: "#2a2a2a",
        background: "#1a1a1a",
      },
    };
  },

  // ============================================
  // 📝 FORMULAIRE D'ÉDITION
  // ============================================
  renderForm: function (data, helpers) {
    return `
      <div class="tpl-form-section">
        <div class="tpl-form-section-title">🌐 Configuration iframe</div>
        <div class="tpl-form-grid single">
          <div class="tpl-field">
            <label class="tpl-label">Titre de la fenêtre</label>
            <input type="text" class="tpl-input" data-field="title" value="${helpers.escapeHtml(data.title || "")}" placeholder="Titre">
          </div>
          <div class="tpl-field">
            <label class="tpl-label">URL du site à intégrer</label>
            <input type="url" class="tpl-input" data-field="url" value="${helpers.escapeHtml(data.url || "")}" placeholder="https://example.com">
          </div>
        </div>
        <div class="tpl-form-grid">
          <div class="tpl-field">
            <label class="tpl-label">Icône (emoji)</label>
            <input type="text" class="tpl-input" data-field="icon" value="${helpers.escapeHtml(data.icon || "🌐")}" maxlength="2" style="width: 80px;">
          </div>
          <div class="tpl-field">
            <label class="tpl-label">Largeur max</label>
            <input type="text" class="tpl-input" data-field="maxWidth" value="${helpers.escapeHtml(data.maxWidth || "1100px")}" placeholder="1100px">
          </div>
        </div>
      </div>

      <div class="tpl-form-section">
        <div class="tpl-form-section-title">🎨 Couleurs</div>
        <div class="tpl-form-grid">
          ${helpers.renderColorField("header", "Barre de titre", data.colors?.header || "#2a2a2a")}
          ${helpers.renderColorField("background", "Fond", data.colors?.background || "#1a1a1a")}
        </div>
      </div>
    `;
  },

  // ============================================
  // 👁️ PREVIEW
  // ============================================
  renderPreview: function (data, helpers) {
    const headerColor = data.colors?.header || "#2a2a2a";
    const bgColor = data.colors?.background || "#1a1a1a";

    return `
      <div style="background: ${bgColor}; border-radius: 12px; overflow: hidden;">
        <div style="padding: 12px 16px; background: ${headerColor}; display: flex; justify-content: space-between; align-items: center;">
          <span style="color: white; font-size: 14px; display: flex; align-items: center; gap: 8px;">
            <span style="font-size: 18px;">${data.icon || "🌐"}</span>
            ${helpers.escapeHtml(data.title || "Site")}
          </span>
          <span style="color: #666; font-size: 16px;">✕</span>
        </div>
        <div style="height: 180px; background: #f0f0f0; display: flex; align-items: center; justify-content: center; color: #666; font-size: 12px; flex-direction: column; gap: 8px;">
          <span style="font-size: 24px;">🌐</span>
          ${helpers.escapeHtml(data.url || "URL non définie")}
        </div>
      </div>
    `;
  },

  // ============================================
  // 🔧 GÉNÉRATION JS POPUP
  // ============================================
  generateJS: function (objectName, config, timestamp) {
    const title = this.escapeJS(config.title || "Site");
    const url = this.escapeJS(config.url || "about:blank");
    const icon = config.icon || "🌐";
    const maxWidth = config.maxWidth || "1100px";
    const headerColor = config.colors?.header || "#2a2a2a";
    const bgColor = config.colors?.background || "#1a1a1a";

    return `/**
 * 🌐 Popup Iframe - ${objectName}
 * Généré automatiquement le ${timestamp}
 * ⚠️ Ne pas modifier directement - Utiliser l'éditeur admin
 */
(function() {
  "use strict";

  const POPUP_ID = "${objectName}";
  const CONFIG = {
    title: "${title}",
    url: "${url}",
    icon: "${icon}",
    maxWidth: "${maxWidth}",
    colors: {
      header: "${headerColor}",
      background: "${bgColor}"
    }
  };

  let currentPopup = null;

  const STYLES = \`
    .popup-${objectName}-overlay {
      position: fixed; inset: 0; background: rgba(0,0,0,0.95);
      z-index: 99999; display: flex; align-items: center; justify-content: center;
      opacity: 0; transition: opacity 0.3s ease;
    }
    .popup-${objectName}-overlay.active { opacity: 1; }
    .popup-${objectName} {
      background: \${CONFIG.colors.background}; border-radius: 16px;
      width: 90%; max-width: \${CONFIG.maxWidth}; height: 85vh; overflow: hidden;
      box-shadow: 0 30px 70px rgba(0,0,0,0.6);
      transform: scale(0.95); transition: transform 0.3s ease;
      display: flex; flex-direction: column;
    }
    .popup-${objectName}-overlay.active .popup-${objectName} { transform: scale(1); }
    .popup-${objectName}-header {
      padding: 15px 20px; background: \${CONFIG.colors.header};
      display: flex; justify-content: space-between; align-items: center;
      border-bottom: 1px solid rgba(255,255,255,0.1); flex-shrink: 0;
    }
    .popup-${objectName}-title { 
      color: white; font-size: 16px; display: flex; align-items: center; gap: 10px; margin: 0;
      font-weight: 600;
    }
    .popup-${objectName}-close {
      background: rgba(255,255,255,0.1); border: none;
      width: 32px; height: 32px; border-radius: 50%;
      color: white; font-size: 18px; cursor: pointer;
      transition: all 0.2s;
    }
    .popup-${objectName}-close:hover { background: rgba(239,68,68,0.3); }
    .popup-${objectName}-iframe { 
      flex: 1; border: none; background: white; width: 100%;
    }
    .popup-${objectName}-loading {
      position: absolute; inset: 0; top: 60px;
      display: flex; align-items: center; justify-content: center;
      background: \${CONFIG.colors.background}; color: #888;
    }
  \`;

  function injectStyles() {
    if (!document.getElementById("popup-${objectName}-styles")) {
      const style = document.createElement("style");
      style.id = "popup-${objectName}-styles";
      style.textContent = STYLES;
      document.head.appendChild(style);
    }
  }

  function show() {
    if (currentPopup) { close(); return; }
    injectStyles();

    const overlay = document.createElement("div");
    overlay.className = "popup-${objectName}-overlay";
    overlay.innerHTML = \`
      <div class="popup-${objectName}">
        <div class="popup-${objectName}-header">
          <h2 class="popup-${objectName}-title">
            <span>\${CONFIG.icon}</span> \${CONFIG.title}
          </h2>
          <button class="popup-${objectName}-close">✕</button>
        </div>
        <div class="popup-${objectName}-loading">Chargement...</div>
        <iframe src="\${CONFIG.url}" class="popup-${objectName}-iframe"></iframe>
      </div>
    \`;

    document.body.appendChild(overlay);
    currentPopup = overlay;
    requestAnimationFrame(() => overlay.classList.add("active"));

    // Hide loading when iframe loads
    const iframe = overlay.querySelector("iframe");
    const loading = overlay.querySelector(".popup-${objectName}-loading");
    iframe.addEventListener("load", () => {
      if (loading) loading.style.display = "none";
    });

    overlay.querySelector(".popup-${objectName}-close").addEventListener("click", close);
    overlay.addEventListener("click", e => { if (e.target === overlay) close(); });
  }

  function close() {
    if (currentPopup) {
      const iframe = currentPopup.querySelector("iframe");
      if (iframe) iframe.src = "";
      currentPopup.classList.remove("active");
      setTimeout(() => { currentPopup?.remove(); currentPopup = null; }, 300);
    }
  }

  document.addEventListener("keydown", e => { 
    if (e.key === "Escape" && currentPopup) close(); 
  });

  window.atlantisPopups = window.atlantisPopups || {};
  window.atlantisPopups[POPUP_ID] = { show, close, config: CONFIG };

  console.log("🌐 Popup ${objectName} chargé");
})();`;
  },

  escapeJS: function (str) {
    if (!str) return "";
    return str
      .replace(/\\/g, "\\\\")
      .replace(/"/g, '\\"')
      .replace(/'/g, "\\'")
      .replace(/\n/g, "\\n")
      .replace(/\r/g, "\\r");
  },
};

console.log("🌐 Template Iframe chargé");
