/**
 * ============================================
 * 🎬 TEMPLATE SYNOPSIS
 * Génère une popup de type présentation/synopsis
 *
 * Template autonome avec ses propres champs
 * ============================================
 */

window.ATLANTIS_TEMPLATES = window.ATLANTIS_TEMPLATES || {};

window.ATLANTIS_TEMPLATES.synopsis = {
  name: "Synopsis / Présentation",
  icon: "🎬",
  description: "Texte descriptif avec CTA",

  // ============================================
  // 🎨 HELPER COLOR FIELD (autonome)
  // ============================================
  renderColorField: function (key, label, value) {
    const inputId = `tpl-color-${key}`;
    return `
      <div class="tpl-field">
        <label class="tpl-label" for="${inputId}-hex">${label}</label>
        <div class="tpl-color-field">
          <div class="tpl-color-preview" style="background: ${value};">
            <input type="color" class="tpl-color-input" id="${inputId}-picker" name="color_${key}" data-color-field="${key}" value="${value}" aria-label="${label} - sélecteur">
          </div>
          <input type="text" class="tpl-input tpl-color-hex" id="${inputId}-hex" name="color_${key}_hex" data-field="colors.${key}" value="${value}" placeholder="#000000" style="flex: 1; font-family: monospace;" autocomplete="off">
        </div>
      </div>
    `;
  },

  // ============================================
  // 📋 DONNÉES PAR DÉFAUT
  // ============================================
  getDefaultData: function () {
    return {
      title: "Titre du projet",
      synopsis: "Description du projet...",
      copyright: {
        year: new Date().getFullYear().toString(),
        owner: "Votre nom",
        texts: ["Tous droits réservés."],
      },
      ctaText: "En savoir plus",
      ctaUrl: "https://example.com",
      colors: {
        background: "#1a1a2e",
        accent: "#8b5cf6",
        text: "#ffffff",
      },
    };
  },

  // ============================================
  // 📝 FORMULAIRE D'ÉDITION
  // ============================================
  renderForm: function (data, helpers) {
    const self = this;
    return `
      <div class="tpl-form-section">
        <div class="tpl-form-section-title">📋 Contenu</div>
        <div class="tpl-form-grid single">
          <div class="tpl-field">
            <label class="tpl-label" for="tpl-synopsis-title">Titre</label>
            <input type="text" class="tpl-input" id="tpl-synopsis-title" name="title" data-field="title" value="${helpers.escapeHtml(
              data.title || ""
            )}" placeholder="Titre du projet" autocomplete="off">
          </div>
          <div class="tpl-field">
            <label class="tpl-label" for="tpl-synopsis-text">Synopsis / Description</label>
            <textarea class="tpl-textarea" id="tpl-synopsis-text" name="synopsis" data-field="synopsis" rows="5" placeholder="Description...">${helpers.escapeHtml(
              data.synopsis || ""
            )}</textarea>
          </div>
        </div>
      </div>

      <div class="tpl-form-section">
        <div class="tpl-form-section-title">🔗 Bouton d'action</div>
        <div class="tpl-form-grid">
          <div class="tpl-field">
            <label class="tpl-label" for="tpl-synopsis-cta-text">Texte du bouton</label>
            <input type="text" class="tpl-input" id="tpl-synopsis-cta-text" name="ctaText" data-field="ctaText" value="${helpers.escapeHtml(
              data.ctaText || ""
            )}" placeholder="En savoir plus" autocomplete="off">
          </div>
          <div class="tpl-field">
            <label class="tpl-label" for="tpl-synopsis-cta-url">URL du bouton</label>
            <input type="url" class="tpl-input" id="tpl-synopsis-cta-url" name="ctaUrl" data-field="ctaUrl" value="${helpers.escapeHtml(
              data.ctaUrl || ""
            )}" placeholder="https://..." autocomplete="off">
          </div>
        </div>
      </div>

      <div class="tpl-form-section">
        <div class="tpl-form-section-title">©️ Copyright</div>
        <div class="tpl-form-grid">
          <div class="tpl-field">
            <label class="tpl-label" for="tpl-synopsis-copyright-year">Année</label>
            <input type="text" class="tpl-input" id="tpl-synopsis-copyright-year" name="copyright_year" data-field="copyright.year" value="${helpers.escapeHtml(
              data.copyright?.year || ""
            )}" placeholder="2024" autocomplete="off">
          </div>
          <div class="tpl-field">
            <label class="tpl-label" for="tpl-synopsis-copyright-owner">Propriétaire</label>
            <input type="text" class="tpl-input" id="tpl-synopsis-copyright-owner" name="copyright_owner" data-field="copyright.owner" value="${helpers.escapeHtml(
              data.copyright?.owner || ""
            )}" placeholder="Votre nom" autocomplete="off">
          </div>
          <div class="tpl-field full">
            <label class="tpl-label" for="tpl-synopsis-copyright-text">Mention légale</label>
            <textarea class="tpl-textarea" id="tpl-synopsis-copyright-text" name="copyright_text" data-field="copyright.texts[0]" rows="2" placeholder="Tous droits réservés...">${helpers.escapeHtml(
              data.copyright?.texts?.[0] || ""
            )}</textarea>
          </div>
        </div>
      </div>

      <div class="tpl-form-section">
        <div class="tpl-form-section-title">🎨 Couleurs</div>
        <div class="tpl-form-grid">
          ${self.renderColorField(
            "background",
            "Fond",
            data.colors?.background || "#1a1a2e"
          )}
          ${self.renderColorField(
            "accent",
            "Accent",
            data.colors?.accent || "#8b5cf6"
          )}
          ${self.renderColorField(
            "text",
            "Texte",
            data.colors?.text || "#ffffff"
          )}
        </div>
      </div>
    `;
  },

  // ============================================
  // 👁️ PREVIEW
  // ============================================
  renderPreview: function (data, helpers) {
    const bgColor = data.colors?.background || "#1a1a2e";
    const accentColor = data.colors?.accent || "#8b5cf6";
    const textColor = data.colors?.text || "#ffffff";

    return `
      <div style="padding: 20px; background: ${bgColor}; color: ${textColor}; border-radius: 12px;">
        <h3 style="margin: 0 0 15px; font-size: 18px;">${helpers.escapeHtml(
          data.title || "Titre"
        )}</h3>
        <p style="font-size: 13px; line-height: 1.6; opacity: 0.9; margin-bottom: 15px;">
          ${helpers.escapeHtml((data.synopsis || "").substring(0, 200))}${
      (data.synopsis || "").length > 200 ? "..." : ""
    }
        </p>
        <div style="font-size: 11px; opacity: 0.5; margin-bottom: 15px; padding: 10px; background: rgba(255,255,255,0.05); border-radius: 8px;">
          © ${helpers.escapeHtml(
            data.copyright?.year || ""
          )} ${helpers.escapeHtml(data.copyright?.owner || "")}
        </div>
        ${
          data.ctaText
            ? `
          <button style="width: 100%; padding: 12px; background: ${accentColor}; border: none; border-radius: 8px; color: white; font-weight: 600; cursor: pointer;">
            ${helpers.escapeHtml(data.ctaText)}
          </button>
        `
            : ""
        }
      </div>
    `;
  },

  // ============================================
  // 🔧 GÉNÉRATION JS POPUP
  // ============================================
  generateJS: function (objectName, config, timestamp) {
    const title = this.escapeJS(config.title || "Titre");
    const synopsis = this.escapeJS(config.synopsis || "");
    const ctaText = this.escapeJS(config.ctaText || "En savoir plus");
    const ctaUrl = this.escapeJS(config.ctaUrl || "#");
    const copyrightYear = this.escapeJS(
      config.copyright?.year || new Date().getFullYear().toString()
    );
    const copyrightOwner = this.escapeJS(config.copyright?.owner || "");
    const copyrightText = this.escapeJS(
      config.copyright?.texts?.[0] || "Tous droits réservés."
    );
    const bgColor = config.colors?.background || "#1a1a2e";
    const accentColor = config.colors?.accent || "#8b5cf6";
    const textColor = config.colors?.text || "#ffffff";

    return `/**
 * 🎬 Popup Synopsis - ${objectName}
 * Généré automatiquement le ${timestamp}
 * ⚠️ Ne pas modifier directement - Utiliser l'éditeur admin
 */
(function() {
  "use strict";

  const POPUP_ID = "${objectName}";
  const CONFIG = {
    title: "${title}",
    synopsis: "${synopsis}",
    ctaText: "${ctaText}",
    ctaUrl: "${ctaUrl}",
    copyright: { 
      year: "${copyrightYear}", 
      owner: "${copyrightOwner}",
      text: "${copyrightText}"
    },
    colors: { 
      background: "${bgColor}", 
      accent: "${accentColor}",
      text: "${textColor}"
    }
  };

  let currentPopup = null;

  const STYLES = \`
    .popup-${objectName}-overlay {
      position: fixed; inset: 0; background: rgba(0,0,0,0.9);
      z-index: 99999; display: flex; align-items: center; justify-content: center;
      opacity: 0; transition: opacity 0.3s ease;
    }
    .popup-${objectName}-overlay.active { opacity: 1; }
    .popup-${objectName} {
      background: \${CONFIG.colors.background}; border-radius: 20px;
      width: 500px; max-width: 95vw; max-height: 85vh; overflow: hidden;
      box-shadow: 0 30px 70px rgba(0,0,0,0.5);
      transform: scale(0.95); transition: transform 0.3s ease;
      display: flex; flex-direction: column;
    }
    .popup-${objectName}-overlay.active .popup-${objectName} { transform: scale(1); }
    .popup-${objectName}-header {
      padding: 20px; display: flex; justify-content: space-between; align-items: center;
      border-bottom: 1px solid rgba(255,255,255,0.1); flex-shrink: 0;
    }
    .popup-${objectName}-title { 
      color: \${CONFIG.colors.text}; font-size: 20px; font-weight: 700; margin: 0; 
    }
    .popup-${objectName}-close {
      background: rgba(255,255,255,0.1); border: none;
      width: 36px; height: 36px; border-radius: 50%;
      color: \${CONFIG.colors.text}; font-size: 20px; cursor: pointer;
      transition: all 0.2s;
    }
    .popup-${objectName}-close:hover { background: rgba(239,68,68,0.3); }
    .popup-${objectName}-content { 
      padding: 25px; overflow-y: auto; flex: 1; 
    }
    .popup-${objectName}-synopsis {
      color: \${CONFIG.colors.text}; opacity: 0.85;
      font-size: 15px; line-height: 1.7; margin-bottom: 20px;
      white-space: pre-line;
    }
    .popup-${objectName}-copyright {
      background: rgba(255,255,255,0.05); border-radius: 10px; padding: 15px;
      font-size: 12px; color: \${CONFIG.colors.text}; opacity: 0.5;
    }
    .popup-${objectName}-footer { 
      padding: 20px; border-top: 1px solid rgba(255,255,255,0.1); flex-shrink: 0;
    }
    .popup-${objectName}-cta {
      display: block; width: 100%; padding: 14px; text-align: center;
      background: \${CONFIG.colors.accent}; color: white; text-decoration: none;
      border-radius: 10px; font-weight: 600; font-size: 15px;
      transition: transform 0.2s, box-shadow 0.2s; border: none; cursor: pointer;
    }
    .popup-${objectName}-cta:hover { 
      transform: translateY(-2px); 
      box-shadow: 0 8px 25px rgba(0,0,0,0.3); 
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
          <h2 class="popup-${objectName}-title">\${CONFIG.title}</h2>
          <button class="popup-${objectName}-close" aria-label="Fermer">✕</button>
        </div>
        <div class="popup-${objectName}-content">
          <p class="popup-${objectName}-synopsis">\${CONFIG.synopsis}</p>
          <div class="popup-${objectName}-copyright">
            <strong>© \${CONFIG.copyright.year} \${CONFIG.copyright.owner}</strong><br>
            \${CONFIG.copyright.text}
          </div>
        </div>
        <div class="popup-${objectName}-footer">
          <a href="\${CONFIG.ctaUrl}" class="popup-${objectName}-cta" target="_blank" rel="noopener">
            \${CONFIG.ctaText}
          </a>
        </div>
      </div>
    \`;

    document.body.appendChild(overlay);
    currentPopup = overlay;
    requestAnimationFrame(() => overlay.classList.add("active"));

    overlay.querySelector(".popup-${objectName}-close").addEventListener("click", close);
    overlay.addEventListener("click", e => { if (e.target === overlay) close(); });
  }

  function close() {
    if (currentPopup) {
      currentPopup.classList.remove("active");
      setTimeout(() => { currentPopup?.remove(); currentPopup = null; }, 300);
    }
  }

  document.addEventListener("keydown", e => { 
    if (e.key === "Escape" && currentPopup) close(); 
  });

  window.atlantisPopups = window.atlantisPopups || {};
  window.atlantisPopups[POPUP_ID] = { show, close, config: CONFIG };

  console.log("🎬 Popup ${objectName} chargé");
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

console.log("🎬 Template Synopsis chargé");
