/**
 * ============================================
 * 📇 TEMPLATE: CONTACT v4 - CORRIGÉ
 * Génère un document HTML COMPLET pour iframe
 * ============================================
 */

(function () {
  "use strict";

  const TEMPLATE_ID = "contact";

  // Configuration par défaut (reproduit Diego)
  const defaultConfig = {
    // === IDENTITÉ ===
    name: "Diego de la Fuintes",
    title: "Contact & Réseaux",
    initials: "DLF",
    avatarUrl: "", // Si vide → initiales

    // === COULEURS FOND ===
    bgGradientStart: "#2a2a2a",
    bgGradientEnd: "#1a1a1a",

    // === COULEURS HEADER ===
    headerGradientStart: "#3a3a3a",
    headerGradientEnd: "#2a2a2a",

    // === COULEURS AVATAR ===
    avatarGradientStart: "#4a4a4a",
    avatarGradientEnd: "#3a3a3a",

    // === TEXTES ===
    nameColor: "#ffffff",
    titleColor: "rgba(255, 255, 255, 0.6)",

    // === DIMENSIONS ===
    avatarSize: 80,
    borderRadius: 20,
    linkRadius: 12,
    iconSize: 40,

    // === OPTIONS ===
    showArrows: true,
    animateLinks: true,
    animateAvatar: true,
    showBorder: true,

    // === CONTACTS ===
    contacts: [
      {
        type: "phone",
        label: "Téléphone",
        value: "06 88 940 133",
        href: "tel:0688940133",
        icon: "📱",
      },
      {
        type: "email",
        label: "Email",
        value: "contact@example.fr",
        href: "mailto:contact@example.fr",
        icon: "✉️",
      },
      {
        type: "facebook",
        label: "Facebook",
        value: "Mon Facebook",
        href: "https://facebook.com/",
        icon: "📘",
      },
      {
        type: "instagram",
        label: "Instagram",
        value: "@moninstagram",
        href: "https://instagram.com/",
        icon: "📷",
      },
      {
        type: "linkedin",
        label: "LinkedIn",
        value: "Mon LinkedIn",
        href: "https://linkedin.com/",
        icon: "💼",
      },
    ],
  };

  // Couleurs des icônes par type
  const iconGradients = {
    phone: { start: "#25d366", end: "#128c7e" },
    email: { start: "#ea4335", end: "#fbbc05" },
    facebook: { start: "#1877f2", end: "#0c63d4" },
    instagram: { start: "#f58529", end: "#dd2a7b" },
    linkedin: { start: "#0077b5", end: "#005885" },
    twitter: { start: "#1da1f2", end: "#0c85d0" },
    whatsapp: { start: "#25d366", end: "#128c7e" },
    website: { start: "#667eea", end: "#764ba2" },
    address: { start: "#ff6b6b", end: "#ee5a5a" },
    youtube: { start: "#ff0000", end: "#cc0000" },
    tiktok: { start: "#000000", end: "#25f4ee" },
    default: { start: "#667eea", end: "#764ba2" },
  };

  // Icônes par défaut
  const defaultIcons = {
    phone: "📱",
    email: "✉️",
    facebook: "📘",
    instagram: "📷",
    linkedin: "💼",
    twitter: "🐦",
    whatsapp: "💬",
    website: "🌐",
    address: "📍",
    youtube: "▶️",
    tiktok: "🎵",
  };

  function escapeHtml(text) {
    if (!text) return "";
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
  }

  function getInitials(name) {
    if (!name) return "?";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .substring(0, 3);
  }

  /**
   * Génère le HTML COMPLET (document entier pour iframe)
   */
  function generateHTML(config) {
    const cfg = { ...defaultConfig, ...config };

    // Générer les lignes de contact
    const contactLines = (cfg.contacts || [])
      .map((c, index) => {
        const gradient = iconGradients[c.type] || iconGradients.default;
        const target =
          c.type === "phone" || c.type === "email" ? "_self" : "_blank";
        const rel =
          c.type !== "phone" && c.type !== "email" ? "noopener noreferrer" : "";
        const icon = c.icon || defaultIcons[c.type] || "📌";
        const delay = cfg.animateLinks
          ? `animation-delay: ${0.1 + index * 0.05}s;`
          : "";

        return `
        <a href="${escapeHtml(c.href || "#")}" 
           class="contact-link ${c.type}" 
           target="${target}" 
           ${rel ? `rel="${rel}"` : ""}
           style="${delay} --icon-start: ${gradient.start}; --icon-end: ${
          gradient.end
        };">
          <div class="contact-icon">${icon}</div>
          <div class="contact-text">
            <div class="contact-label">${escapeHtml(c.label || c.type)}</div>
            <div class="contact-value">${escapeHtml(c.value)}</div>
          </div>
          ${cfg.showArrows ? '<div class="contact-arrow">→</div>' : ""}
        </a>
      `;
      })
      .join("");

    // Avatar : image ou initiales
    const avatarContent = cfg.avatarUrl
      ? `<img src="${escapeHtml(cfg.avatarUrl)}" alt="${escapeHtml(
          cfg.name
        )}" class="avatar-img">`
      : `<span class="avatar-initials">${escapeHtml(
          cfg.initials || getInitials(cfg.name)
        )}</span>`;

    // === DOCUMENT HTML COMPLET ===
    return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    /* === RESET === */
    *, *::before, *::after {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    html, body {
      width: 100%;
      height: 100%;
      overflow: hidden;
    }

    /* === CONTAINER PRINCIPAL === */
    .contact-popup {
      width: 100%;
      height: 100%;
      background: linear-gradient(135deg, ${cfg.bgGradientStart} 0%, ${
      cfg.bgGradientEnd
    } 100%);
      border-radius: ${cfg.borderRadius}px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      color: #ffffff;
      display: flex;
      flex-direction: column;
      overflow: hidden;
      ${cfg.showBorder ? "border: 1px solid rgba(255, 255, 255, 0.1);" : ""}
    }

    /* === HEADER === */
    .contact-header {
      background: linear-gradient(135deg, ${cfg.headerGradientStart} 0%, ${
      cfg.headerGradientEnd
    } 100%);
      padding: 30px 20px 20px;
      text-align: center;
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    }

    /* === AVATAR === */
    .contact-avatar {
      width: ${cfg.avatarSize}px;
      height: ${cfg.avatarSize}px;
      background: linear-gradient(135deg, ${cfg.avatarGradientStart} 0%, ${
      cfg.avatarGradientEnd
    } 100%);
      border-radius: 50%;
      margin: 0 auto 15px;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 8px 20px rgba(0, 0, 0, 0.3);
      overflow: hidden;
      ${
        cfg.animateAvatar
          ? "animation: avatarPulse 2s ease-in-out infinite;"
          : ""
      }
    }

    .avatar-img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .avatar-initials {
      font-size: ${Math.round(cfg.avatarSize * 0.4)}px;
      font-weight: 600;
      color: rgba(255, 255, 255, 0.9);
      letter-spacing: 1px;
    }

    @keyframes avatarPulse {
      0%, 100% { box-shadow: 0 8px 20px rgba(0, 0, 0, 0.3); }
      50% { box-shadow: 0 8px 25px rgba(255, 255, 255, 0.1); }
    }

    /* === NOM & TITRE === */
    .contact-name {
      font-size: 24px;
      font-weight: 600;
      color: ${cfg.nameColor};
      margin: 0 0 5px;
      letter-spacing: 0.5px;
    }

    .contact-title {
      font-size: 14px;
      color: ${cfg.titleColor};
      margin: 0;
    }

    /* === CONTAINER LIENS === */
    .contact-links {
      padding: 20px;
      overflow-y: auto;
      flex: 1;
    }

    /* === LIEN INDIVIDUEL === */
    .contact-link {
      display: flex;
      align-items: center;
      gap: 15px;
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: ${cfg.linkRadius}px;
      padding: 15px 18px;
      margin-bottom: 12px;
      text-decoration: none;
      color: rgba(255, 255, 255, 0.9);
      transition: all 0.3s ease;
      position: relative;
      overflow: hidden;
      ${
        cfg.animateLinks
          ? "animation: slideInLink 0.4s ease forwards; opacity: 0;"
          : ""
      }
    }

    .contact-link::before {
      content: '';
      position: absolute;
      top: 0;
      left: -100%;
      width: 100%;
      height: 100%;
      background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.1), transparent);
      transition: left 0.5s ease;
    }

    .contact-link:hover {
      background: rgba(255, 255, 255, 0.08);
      border-color: rgba(255, 255, 255, 0.2);
      transform: translateX(5px);
      color: white;
    }

    .contact-link:hover::before {
      left: 100%;
    }

    .contact-link:last-child {
      margin-bottom: 0;
    }

    @keyframes slideInLink {
      from { opacity: 0; transform: translateY(20px); }
      to { opacity: 1; transform: translateY(0); }
    }

    /* === ICÔNE === */
    .contact-icon {
      width: ${cfg.iconSize}px;
      height: ${cfg.iconSize}px;
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: ${Math.round(cfg.iconSize * 0.5)}px;
      flex-shrink: 0;
      transition: all 0.3s ease;
      background: linear-gradient(135deg, var(--icon-start) 0%, var(--icon-end) 100%);
      color: white;
    }

    .contact-link:hover .contact-icon {
      transform: scale(1.1) rotate(5deg);
    }

    /* === TEXTE === */
    .contact-text {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 2px;
      min-width: 0;
    }

    .contact-label {
      font-size: 12px;
      color: rgba(255, 255, 255, 0.5);
      text-transform: uppercase;
      letter-spacing: 1px;
      font-weight: 500;
    }

    .contact-value {
      font-size: 15px;
      font-weight: 500;
      color: rgba(255, 255, 255, 0.9);
      word-break: break-word;
    }

    /* === FLÈCHE === */
    .contact-arrow {
      font-size: 16px;
      color: rgba(255, 255, 255, 0.3);
      transition: all 0.3s ease;
    }

    .contact-link:hover .contact-arrow {
      color: rgba(255, 255, 255, 0.6);
      transform: translateX(3px);
    }

    /* === SCROLLBAR === */
    .contact-links::-webkit-scrollbar { width: 6px; }
    .contact-links::-webkit-scrollbar-track { background: rgba(255, 255, 255, 0.05); border-radius: 10px; }
    .contact-links::-webkit-scrollbar-thumb { background: rgba(255, 255, 255, 0.2); border-radius: 10px; }
    .contact-links::-webkit-scrollbar-thumb:hover { background: rgba(255, 255, 255, 0.3); }
  </style>
</head>
<body>
  <div class="contact-popup">
    <div class="contact-header">
      <div class="contact-avatar">${avatarContent}</div>
      <h2 class="contact-name">${escapeHtml(cfg.name)}</h2>
      <p class="contact-title">${escapeHtml(cfg.title)}</p>
    </div>
    <div class="contact-links">
      ${contactLines}
    </div>
  </div>
</body>
</html>`;
  }

  /**
   * Génère le HTML des paramètres pour l'éditeur
   * Utilise les classes .param-* du CSS
   */
  function generateParamsHTML(config) {
    const cfg = { ...defaultConfig, ...config };

    // Types de contacts disponibles
    const contactTypes = [
      { value: "phone", label: "📱 Téléphone" },
      { value: "email", label: "✉️ Email" },
      { value: "website", label: "🌐 Site web" },
      { value: "facebook", label: "📘 Facebook" },
      { value: "instagram", label: "📷 Instagram" },
      { value: "linkedin", label: "💼 LinkedIn" },
      { value: "twitter", label: "🐦 Twitter" },
      { value: "whatsapp", label: "💬 WhatsApp" },
      { value: "youtube", label: "▶️ YouTube" },
      { value: "tiktok", label: "🎵 TikTok" },
      { value: "address", label: "📍 Adresse" },
    ];

    // Générer les entrées de contacts
    const contactsHTML = (cfg.contacts || [])
      .map(
        (c, i) => `
      <div class="contact-entry" data-index="${i}">
        <div class="contact-entry-header">
          <span class="contact-entry-num">Contact ${i + 1}</span>
          <button type="button" class="btn-remove-contact" onclick="window.templateEditor.removeContact(${i})">✕</button>
        </div>
        <div class="contact-entry-fields">
          <select class="param-input" onchange="window.templateEditor.updateContact(${i}, 'type', this.value)">
            ${contactTypes
              .map(
                (t) =>
                  `<option value="${t.value}" ${
                    c.type === t.value ? "selected" : ""
                  }>${t.label}</option>`
              )
              .join("")}
          </select>
          <input type="text" class="param-input" value="${escapeHtml(
            c.label || ""
          )}" placeholder="Label affiché" 
                 onchange="window.templateEditor.updateContact(${i}, 'label', this.value)">
          <input type="text" class="param-input" value="${escapeHtml(
            c.value || ""
          )}" placeholder="Valeur affichée" 
                 onchange="window.templateEditor.updateContact(${i}, 'value', this.value)">
          <input type="text" class="param-input" value="${escapeHtml(
            c.href || ""
          )}" placeholder="Lien (tel:, mailto:, https://)" 
                 onchange="window.templateEditor.updateContact(${i}, 'href', this.value)">
        </div>
      </div>
    `
      )
      .join("");

    return `
      <!-- ═══════════════════════════════════════ -->
      <!-- SECTION: IDENTITÉ -->
      <!-- ═══════════════════════════════════════ -->
      <div class="params-section">
        <div class="params-section-title">👤 Identité</div>
        
        <div class="param-group">
          <label class="param-label">Nom complet</label>
          <input type="text" class="param-input" value="${escapeHtml(
            cfg.name
          )}" 
                 onchange="window.templateEditor.updateConfig('name', this.value)">
        </div>
        
        <div class="param-group">
          <label class="param-label">Sous-titre / Fonction</label>
          <input type="text" class="param-input" value="${escapeHtml(
            cfg.title
          )}" 
                 onchange="window.templateEditor.updateConfig('title', this.value)">
        </div>
        
        <div class="param-group">
          <label class="param-label">Initiales (si pas de photo)</label>
          <input type="text" class="param-input" value="${escapeHtml(
            cfg.initials
          )}" maxlength="3" style="width: 80px;"
                 onchange="window.templateEditor.updateConfig('initials', this.value.toUpperCase())">
        </div>
        
        <div class="param-group">
          <label class="param-label">Photo (URL)</label>
          <input type="url" class="param-input" value="${escapeHtml(
            cfg.avatarUrl
          )}" placeholder="https://..."
                 onchange="window.templateEditor.updateConfig('avatarUrl', this.value)">
        </div>
      </div>

      <!-- ═══════════════════════════════════════ -->
      <!-- SECTION: COULEURS -->
      <!-- ═══════════════════════════════════════ -->
      <div class="params-section">
        <div class="params-section-title">🎨 Couleurs</div>
        
        <div class="param-group">
          <label class="param-label">Fond (dégradé)</label>
          <div class="param-gradient-row">
            <input type="color" class="param-color" value="${
              cfg.bgGradientStart
            }" 
                   onchange="window.templateEditor.updateConfig('bgGradientStart', this.value)">
            <span class="gradient-arrow">→</span>
            <input type="color" class="param-color" value="${
              cfg.bgGradientEnd
            }" 
                   onchange="window.templateEditor.updateConfig('bgGradientEnd', this.value)">
          </div>
        </div>
        
        <div class="param-group">
          <label class="param-label">Header (dégradé)</label>
          <div class="param-gradient-row">
            <input type="color" class="param-color" value="${
              cfg.headerGradientStart
            }" 
                   onchange="window.templateEditor.updateConfig('headerGradientStart', this.value)">
            <span class="gradient-arrow">→</span>
            <input type="color" class="param-color" value="${
              cfg.headerGradientEnd
            }" 
                   onchange="window.templateEditor.updateConfig('headerGradientEnd', this.value)">
          </div>
        </div>
        
        <div class="param-group">
          <label class="param-label">Avatar (dégradé)</label>
          <div class="param-gradient-row">
            <input type="color" class="param-color" value="${
              cfg.avatarGradientStart
            }" 
                   onchange="window.templateEditor.updateConfig('avatarGradientStart', this.value)">
            <span class="gradient-arrow">→</span>
            <input type="color" class="param-color" value="${
              cfg.avatarGradientEnd
            }" 
                   onchange="window.templateEditor.updateConfig('avatarGradientEnd', this.value)">
          </div>
        </div>
      </div>

      <!-- ═══════════════════════════════════════ -->
      <!-- SECTION: DIMENSIONS -->
      <!-- ═══════════════════════════════════════ -->
      <div class="params-section">
        <div class="params-section-title">📐 Dimensions</div>
        
        <div class="param-group">
          <label class="param-label">Taille avatar</label>
          <div class="param-slider-row">
            <input type="range" class="param-slider" min="50" max="120" step="5" value="${
              cfg.avatarSize
            }" 
                   oninput="window.templateEditor.updateConfig('avatarSize', parseInt(this.value)); this.nextElementSibling.textContent = this.value + 'px';">
            <span class="slider-value">${cfg.avatarSize}px</span>
          </div>
        </div>
        
        <div class="param-group">
          <label class="param-label">Coins popup</label>
          <div class="param-slider-row">
            <input type="range" class="param-slider" min="0" max="30" step="2" value="${
              cfg.borderRadius
            }" 
                   oninput="window.templateEditor.updateConfig('borderRadius', parseInt(this.value)); this.nextElementSibling.textContent = this.value + 'px';">
            <span class="slider-value">${cfg.borderRadius}px</span>
          </div>
        </div>
        
        <div class="param-group">
          <label class="param-label">Coins liens</label>
          <div class="param-slider-row">
            <input type="range" class="param-slider" min="0" max="20" step="2" value="${
              cfg.linkRadius
            }" 
                   oninput="window.templateEditor.updateConfig('linkRadius', parseInt(this.value)); this.nextElementSibling.textContent = this.value + 'px';">
            <span class="slider-value">${cfg.linkRadius}px</span>
          </div>
        </div>
        
        <div class="param-group">
          <label class="param-label">Taille icônes</label>
          <div class="param-slider-row">
            <input type="range" class="param-slider" min="30" max="50" step="2" value="${
              cfg.iconSize
            }" 
                   oninput="window.templateEditor.updateConfig('iconSize', parseInt(this.value)); this.nextElementSibling.textContent = this.value + 'px';">
            <span class="slider-value">${cfg.iconSize}px</span>
          </div>
        </div>
      </div>

      <!-- ═══════════════════════════════════════ -->
      <!-- SECTION: OPTIONS -->
      <!-- ═══════════════════════════════════════ -->
      <div class="params-section">
        <div class="params-section-title">⚙️ Options</div>
        
        <label class="param-toggle">
          <input type="checkbox" ${cfg.showArrows ? "checked" : ""} 
                 onchange="window.templateEditor.updateConfig('showArrows', this.checked)">
          <span class="toggle-slider"></span>
          <span class="toggle-label">Afficher les flèches →</span>
        </label>
        
        <label class="param-toggle">
          <input type="checkbox" ${cfg.animateLinks ? "checked" : ""} 
                 onchange="window.templateEditor.updateConfig('animateLinks', this.checked)">
          <span class="toggle-slider"></span>
          <span class="toggle-label">Animation d'entrée des liens</span>
        </label>
        
        <label class="param-toggle">
          <input type="checkbox" ${cfg.animateAvatar ? "checked" : ""} 
                 onchange="window.templateEditor.updateConfig('animateAvatar', this.checked)">
          <span class="toggle-slider"></span>
          <span class="toggle-label">Animation pulsation avatar</span>
        </label>
        
        <label class="param-toggle">
          <input type="checkbox" ${cfg.showBorder ? "checked" : ""} 
                 onchange="window.templateEditor.updateConfig('showBorder', this.checked)">
          <span class="toggle-slider"></span>
          <span class="toggle-label">Bordure subtile</span>
        </label>
      </div>

      <!-- ═══════════════════════════════════════ -->
      <!-- SECTION: CONTACTS -->
      <!-- ═══════════════════════════════════════ -->
      <div class="params-section">
        <div class="params-section-title">📇 Contacts (${
          cfg.contacts?.length || 0
        })</div>
        
        <div class="contacts-list" id="contacts-list">
          ${contactsHTML}
        </div>
        
        <button type="button" class="btn-add-contact" onclick="window.templateEditor.addContact()">
          + Ajouter un contact
        </button>
      </div>
    `;
  }

  // Enregistrer le template
  if (window.atlantisTemplates) {
    window.atlantisTemplates.register(TEMPLATE_ID, {
      id: TEMPLATE_ID,
      name: "Contact",
      description: "Fiche contact avec photo et réseaux sociaux",
      icon: "📇",
      defaultConfig,
      generateHTML,
      generateParamsHTML,
    });
    console.log('✅ Template "contact" v4 enregistré');
  } else {
    console.warn("⚠️ atlantisTemplates non disponible");
  }
})();
