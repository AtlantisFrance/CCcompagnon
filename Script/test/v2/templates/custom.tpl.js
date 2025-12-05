/**
 * ============================================
 * 🛠️ TEMPLATE CUSTOM
 * Génère une popup avec HTML/CSS personnalisé
 * ============================================
 */

window.ATLANTIS_TEMPLATES = window.ATLANTIS_TEMPLATES || {};

window.ATLANTIS_TEMPLATES.custom = {
  name: "HTML Personnalisé",
  icon: "🛠️",
  description: "Code HTML/CSS libre",

  // ============================================
  // 📋 DONNÉES PAR DÉFAUT
  // ============================================
  getDefaultData: function () {
    return {
      html: `<div class="custom-popup">
  <button class="custom-close">✕</button>
  <h2>Titre personnalisé</h2>
  <p>Votre contenu ici...</p>
  <button class="custom-btn">Action</button>
</div>`,
      css: `.custom-popup {
  padding: 30px;
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
  color: white;
  border-radius: 16px;
  max-width: 400px;
  text-align: center;
  position: relative;
}

.custom-close {
  position: absolute;
  top: 15px;
  right: 15px;
  background: rgba(255,255,255,0.1);
  border: none;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  color: white;
  font-size: 18px;
  cursor: pointer;
}

.custom-popup h2 {
  margin: 0 0 15px;
  font-size: 24px;
}

.custom-popup p {
  opacity: 0.8;
  line-height: 1.6;
  margin-bottom: 20px;
}

.custom-btn {
  padding: 12px 30px;
  background: #3b82f6;
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: transform 0.2s;
}

.custom-btn:hover {
  transform: scale(1.05);
}`,
    };
  },

  // ============================================
  // 📝 FORMULAIRE D'ÉDITION
  // ============================================
  renderForm: function (data, helpers) {
    return `
      <div class="tpl-form-section">
        <div class="tpl-form-section-title">🛠️ Code HTML</div>
        <div class="tpl-form-grid single">
          <div class="tpl-field">
            <label class="tpl-label" for="tpl-custom-html">HTML de la popup</label>
            <textarea class="tpl-textarea" id="tpl-custom-html" name="html" data-field="html" rows="12" 
                      style="font-family: 'Fira Code', 'Consolas', monospace; font-size: 12px; line-height: 1.5;"
                      placeholder="<div>...</div>">${helpers.escapeHtml(
                        data.html || ""
                      )}</textarea>
            <small style="color: #64748b; font-size: 11px; margin-top: 4px; display: block;">
              💡 Ajoutez une classe <code>.custom-close</code> pour le bouton fermer
            </small>
          </div>
        </div>
      </div>

      <div class="tpl-form-section">
        <div class="tpl-form-section-title">🎨 Code CSS</div>
        <div class="tpl-form-grid single">
          <div class="tpl-field">
            <label class="tpl-label" for="tpl-custom-css">Styles CSS</label>
            <textarea class="tpl-textarea" id="tpl-custom-css" name="css" data-field="css" rows="12" 
                      style="font-family: 'Fira Code', 'Consolas', monospace; font-size: 12px; line-height: 1.5;"
                      placeholder=".custom-popup { ... }">${helpers.escapeHtml(
                        data.css || ""
                      )}</textarea>
          </div>
        </div>
      </div>
    `;
  },

  // ============================================
  // 👁️ PREVIEW
  // ============================================
  renderPreview: function (data, helpers) {
    // On ne peut pas vraiment preview du code custom de manière sécurisée
    // On affiche juste un aperçu statique
    return `
      <div style="background: #0f172a; border-radius: 12px; padding: 20px; color: #94a3b8; text-align: center;">
        <div style="font-size: 36px; margin-bottom: 15px;">🛠️</div>
        <div style="font-size: 14px; margin-bottom: 10px;">Template personnalisé</div>
        <div style="font-size: 12px; opacity: 0.6;">
          ${(data.html || "").length} caractères HTML<br>
          ${(data.css || "").length} caractères CSS
        </div>
        <div style="margin-top: 15px; padding: 10px; background: rgba(59, 130, 246, 0.1); border-radius: 8px; font-size: 11px; color: #60a5fa;">
          ⚡ Sauvegardez pour voir le résultat final
        </div>
      </div>
    `;
  },

  // ============================================
  // 🔧 GÉNÉRATION JS POPUP
  // ============================================
  generateJS: function (objectName, config, timestamp) {
    // Encoder le HTML et CSS en base64 pour éviter les problèmes d'échappement
    const htmlEncoded = btoa(unescape(encodeURIComponent(config.html || "")));
    const cssEncoded = btoa(unescape(encodeURIComponent(config.css || "")));

    return `/**
 * 🛠️ Popup Custom - ${objectName}
 * Généré automatiquement le ${timestamp}
 * ⚠️ Ne pas modifier directement - Utiliser l'éditeur admin
 */
(function() {
  "use strict";

  const POPUP_ID = "${objectName}";
  
  // Décodage du contenu
  function decodeContent(encoded) {
    try {
      return decodeURIComponent(escape(atob(encoded)));
    } catch(e) {
      console.error("Erreur décodage:", e);
      return "";
    }
  }

  const CONFIG = {
    html: decodeContent("${htmlEncoded}"),
    css: decodeContent("${cssEncoded}")
  };

  let currentPopup = null;

  function injectStyles() {
    if (!document.getElementById("popup-${objectName}-styles")) {
      const style = document.createElement("style");
      style.id = "popup-${objectName}-styles";
      style.textContent = \`
        .popup-${objectName}-overlay {
          position: fixed; inset: 0; background: rgba(0,0,0,0.85);
          z-index: 99999; display: flex; align-items: center; justify-content: center;
          opacity: 0; transition: opacity 0.3s ease;
        }
        .popup-${objectName}-overlay.active { opacity: 1; }
        .popup-${objectName}-container {
          transform: scale(0.95); transition: transform 0.3s ease;
        }
        .popup-${objectName}-overlay.active .popup-${objectName}-container { 
          transform: scale(1); 
        }
        \${CONFIG.css}
      \`;
      document.head.appendChild(style);
    }
  }

  function show() {
    if (currentPopup) { close(); return; }
    injectStyles();

    const overlay = document.createElement("div");
    overlay.className = "popup-${objectName}-overlay";
    
    const container = document.createElement("div");
    container.className = "popup-${objectName}-container";
    container.innerHTML = CONFIG.html;
    
    overlay.appendChild(container);
    document.body.appendChild(overlay);
    currentPopup = overlay;

    requestAnimationFrame(() => overlay.classList.add("active"));

    // Bouton close générique
    const closeBtn = container.querySelector(".custom-close, [data-close], .close-btn");
    if (closeBtn) {
      closeBtn.addEventListener("click", close);
    }

    // Click sur overlay
    overlay.addEventListener("click", e => { 
      if (e.target === overlay) close(); 
    });
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

  console.log("🛠️ Popup ${objectName} chargé");
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

console.log("🛠️ Template Custom chargé");
