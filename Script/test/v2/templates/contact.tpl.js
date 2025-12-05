/**
 * ============================================
 * 📇 TEMPLATE CONTACT
 * Génère une popup de type fiche contact
 *
 * Template autonome avec ses propres champs
 * ============================================
 */

window.ATLANTIS_TEMPLATES = window.ATLANTIS_TEMPLATES || {};

window.ATLANTIS_TEMPLATES.contact = {
  name: "Fiche Contact",
  icon: "📇",
  description: "Carte de contact avec liens sociaux",

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
      name: "Nom Prénom",
      title: "Contact & Réseaux",
      avatar: "AB",
      contacts: [
        {
          type: "phone",
          label: "Téléphone",
          value: "06 00 00 00 00",
          href: "tel:0600000000",
          icon: "📱",
        },
        {
          type: "email",
          label: "Email",
          value: "contact@example.com",
          href: "mailto:contact@example.com",
          icon: "✉️",
        },
      ],
      colors: {
        background: "#1a1a2e",
        accent: "#3b82f6",
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
      <!-- Informations générales -->
      <div class="tpl-form-section">
        <div class="tpl-form-section-title">📋 Informations générales</div>
        <div class="tpl-form-grid">
          <div class="tpl-field">
            <label class="tpl-label" for="tpl-contact-name">Nom complet</label>
            <input type="text" class="tpl-input" id="tpl-contact-name" name="name" data-field="name" value="${helpers.escapeHtml(
              data.name || ""
            )}" placeholder="Jean Dupont" autocomplete="off">
          </div>
          <div class="tpl-field">
            <label class="tpl-label" for="tpl-contact-title">Sous-titre</label>
            <input type="text" class="tpl-input" id="tpl-contact-title" name="title" data-field="title" value="${helpers.escapeHtml(
              data.title || ""
            )}" placeholder="Contact & Réseaux" autocomplete="off">
          </div>
          <div class="tpl-field">
            <label class="tpl-label" for="tpl-contact-avatar">Avatar (initiales)</label>
            <input type="text" class="tpl-input" id="tpl-contact-avatar" name="avatar" data-field="avatar" value="${helpers.escapeHtml(
              data.avatar || ""
            )}" maxlength="3" placeholder="JD" autocomplete="off">
          </div>
        </div>
      </div>

      <!-- Contacts -->
      <div class="tpl-form-section">
        <div class="tpl-form-section-title">📞 Liens de contact</div>
        <div class="tpl-contacts-list" id="tpl-contacts-list">
          ${(data.contacts || [])
            .map((c, i) => self.renderContactItem(c, i, helpers))
            .join("")}
        </div>
        <button type="button" class="tpl-add-btn" id="tpl-add-contact">+ Ajouter un contact</button>
      </div>

      <!-- Couleurs -->
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
            data.colors?.accent || "#3b82f6"
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
  // 📇 ITEM CONTACT
  // ============================================
  renderContactItem: function (contact, index, helpers) {
    return `
      <div class="tpl-contact-item" data-index="${index}">
        <select class="tpl-select" id="tpl-contact-type-${index}" name="contact_type_${index}" data-contact-field="type" data-index="${index}" aria-label="Type de contact ${
      index + 1
    }">
          <option value="phone" ${
            contact.type === "phone" ? "selected" : ""
          }>📱 Téléphone</option>
          <option value="email" ${
            contact.type === "email" ? "selected" : ""
          }>✉️ Email</option>
          <option value="website" ${
            contact.type === "website" ? "selected" : ""
          }>🌐 Site web</option>
          <option value="facebook" ${
            contact.type === "facebook" ? "selected" : ""
          }>📘 Facebook</option>
          <option value="instagram" ${
            contact.type === "instagram" ? "selected" : ""
          }>📷 Instagram</option>
          <option value="linkedin" ${
            contact.type === "linkedin" ? "selected" : ""
          }>💼 LinkedIn</option>
          <option value="twitter" ${
            contact.type === "twitter" ? "selected" : ""
          }>🐦 Twitter/X</option>
          <option value="youtube" ${
            contact.type === "youtube" ? "selected" : ""
          }>▶️ YouTube</option>
          <option value="tiktok" ${
            contact.type === "tiktok" ? "selected" : ""
          }>🎵 TikTok</option>
        </select>
        <input type="text" class="tpl-input" id="tpl-contact-value-${index}" name="contact_value_${index}" data-contact-field="value" data-index="${index}" 
               value="${helpers.escapeHtml(
                 contact.value || ""
               )}" placeholder="Valeur affichée" aria-label="Valeur du contact ${
      index + 1
    }" autocomplete="off">
        <input type="text" class="tpl-input" id="tpl-contact-href-${index}" name="contact_href_${index}" data-contact-field="href" data-index="${index}" 
               value="${helpers.escapeHtml(
                 contact.href || ""
               )}" placeholder="Lien (tel:, mailto:, https://)" aria-label="Lien du contact ${
      index + 1
    }" autocomplete="off">
        <button type="button" class="tpl-contact-remove" data-remove-index="${index}" aria-label="Supprimer contact ${
      index + 1
    }">✕</button>
      </div>
    `;
  },

  // ============================================
  // 👁️ PREVIEW
  // ============================================
  renderPreview: function (data, helpers) {
    const bgColor = data.colors?.background || "#1a1a2e";
    const accentColor = data.colors?.accent || "#3b82f6";
    const textColor = data.colors?.text || "#ffffff";

    return `
      <div style="padding: 20px; background: ${bgColor}; color: ${textColor}; text-align: center; border-radius: 12px;">
        <div style="width: 60px; height: 60px; background: ${accentColor}; border-radius: 50%; margin: 0 auto 15px; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 20px;">
          ${helpers.escapeHtml(data.avatar || "AB")}
        </div>
        <h3 style="margin: 0 0 5px; font-size: 18px;">${helpers.escapeHtml(
          data.name || "Nom"
        )}</h3>
        <p style="margin: 0 0 15px; opacity: 0.7; font-size: 13px;">${helpers.escapeHtml(
          data.title || "Titre"
        )}</p>
        <div style="text-align: left;">
          ${(data.contacts || [])
            .slice(0, 3)
            .map(
              (c) => `
            <div style="padding: 10px; background: rgba(255,255,255,0.1); border-radius: 8px; margin-bottom: 8px; font-size: 13px;">
              ${c.icon || "📌"} ${helpers.escapeHtml(c.value || "")}
            </div>
          `
            )
            .join("")}
        </div>
      </div>
    `;
  },

  // ============================================
  // 🔧 GÉNÉRATION JS POPUP
  // ============================================
  generateJS: function (objectName, config, timestamp) {
    const name = this.escapeJS(config.name || "Contact");
    const title = this.escapeJS(config.title || "");
    const avatar = this.escapeJS(config.avatar || "AB");
    const bgColor = config.colors?.background || "#1a1a2e";
    const accentColor = config.colors?.accent || "#3b82f6";
    const textColor = config.colors?.text || "#ffffff";
    const contactsJS = JSON.stringify(config.contacts || []);

    return `/**
 * 📇 Popup Contact - ${objectName}
 * Généré automatiquement le ${timestamp}
 * ⚠️ Ne pas modifier directement - Utiliser l'éditeur admin
 */
(function() {
  "use strict";

  const POPUP_ID = "${objectName}";
  const CONFIG = {
    name: "${name}",
    title: "${title}",
    avatar: "${avatar}",
    contacts: ${contactsJS},
    colors: {
      background: "${bgColor}",
      accent: "${accentColor}",
      text: "${textColor}"
    }
  };

  let currentPopup = null;

  const STYLES = \`
    .popup-${objectName}-overlay {
      position: fixed; inset: 0; background: rgba(0,0,0,0.85);
      z-index: 99999; display: flex; align-items: center; justify-content: center;
      opacity: 0; transition: opacity 0.3s ease;
    }
    .popup-${objectName}-overlay.active { opacity: 1; }
    .popup-${objectName} {
      background: \${CONFIG.colors.background}; border-radius: 20px;
      width: 380px; max-width: 95vw; overflow: hidden;
      box-shadow: 0 25px 60px rgba(0,0,0,0.5);
      transform: scale(0.95); transition: transform 0.3s ease;
    }
    .popup-${objectName}-overlay.active .popup-${objectName} { transform: scale(1); }
    .popup-${objectName}-header {
      padding: 25px 20px; text-align: center; position: relative;
      background: linear-gradient(180deg, rgba(255,255,255,0.05) 0%, transparent 100%);
    }
    .popup-${objectName}-close {
      position: absolute; top: 15px; right: 15px;
      background: rgba(255,255,255,0.1); border: none;
      width: 32px; height: 32px; border-radius: 50%;
      color: \${CONFIG.colors.text}; font-size: 18px; cursor: pointer;
      transition: all 0.2s;
    }
    .popup-${objectName}-close:hover { background: rgba(239,68,68,0.3); }
    .popup-${objectName}-avatar {
      width: 70px; height: 70px; background: \${CONFIG.colors.accent};
      border-radius: 50%; margin: 0 auto 15px;
      display: flex; align-items: center; justify-content: center;
      font-size: 24px; font-weight: 700; color: white;
      box-shadow: 0 8px 20px rgba(0,0,0,0.3);
    }
    .popup-${objectName}-name {
      color: \${CONFIG.colors.text}; font-size: 22px; font-weight: 700; margin: 0 0 5px;
    }
    .popup-${objectName}-title {
      color: \${CONFIG.colors.text}; opacity: 0.6; font-size: 14px; margin: 0;
    }
    .popup-${objectName}-links { padding: 10px 20px 25px; }
    .popup-${objectName}-link {
      display: flex; align-items: center; gap: 15px;
      padding: 14px 16px; background: rgba(255,255,255,0.05);
      border-radius: 12px; margin-bottom: 10px;
      text-decoration: none; color: \${CONFIG.colors.text};
      transition: all 0.2s; border: 1px solid transparent;
    }
    .popup-${objectName}-link:hover {
      background: rgba(255,255,255,0.1);
      border-color: \${CONFIG.colors.accent};
      transform: translateX(5px);
    }
    .popup-${objectName}-link-icon { font-size: 20px; }
    .popup-${objectName}-link-text { flex: 1; }
    .popup-${objectName}-link-label { font-size: 11px; opacity: 0.5; text-transform: uppercase; }
    .popup-${objectName}-link-value { font-size: 14px; font-weight: 500; }
    .popup-${objectName}-link-arrow { opacity: 0.3; font-size: 18px; }
  \`;

  function injectStyles() {
    if (!document.getElementById("popup-${objectName}-styles")) {
      const style = document.createElement("style");
      style.id = "popup-${objectName}-styles";
      style.textContent = STYLES;
      document.head.appendChild(style);
    }
  }

  function getIcon(type) {
    const icons = {
      phone: "📱", email: "✉️", website: "🌐",
      facebook: "📘", instagram: "📷", linkedin: "💼",
      twitter: "🐦", youtube: "▶️", tiktok: "🎵"
    };
    return icons[type] || "📌";
  }

  function show() {
    if (currentPopup) { close(); return; }
    injectStyles();

    const overlay = document.createElement("div");
    overlay.className = "popup-${objectName}-overlay";

    const linksHTML = CONFIG.contacts.map(c => \`
      <a href="\${c.href}" class="popup-${objectName}-link" 
         target="\${c.type === 'phone' || c.type === 'email' ? '_self' : '_blank'}"
         rel="noopener noreferrer">
        <span class="popup-${objectName}-link-icon">\${c.icon || getIcon(c.type)}</span>
        <div class="popup-${objectName}-link-text">
          <div class="popup-${objectName}-link-label">\${c.label || c.type}</div>
          <div class="popup-${objectName}-link-value">\${c.value}</div>
        </div>
        <span class="popup-${objectName}-link-arrow">→</span>
      </a>
    \`).join("");

    overlay.innerHTML = \`
      <div class="popup-${objectName}">
        <div class="popup-${objectName}-header">
          <button class="popup-${objectName}-close" aria-label="Fermer">✕</button>
          <div class="popup-${objectName}-avatar">\${CONFIG.avatar}</div>
          <h2 class="popup-${objectName}-name">\${CONFIG.name}</h2>
          <p class="popup-${objectName}-title">\${CONFIG.title}</p>
        </div>
        <div class="popup-${objectName}-links">\${linksHTML}</div>
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

  console.log("📇 Popup ${objectName} chargé");
})();`;
  },

  // Helper pour échapper les strings JS
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

console.log("📇 Template Contact chargé");
