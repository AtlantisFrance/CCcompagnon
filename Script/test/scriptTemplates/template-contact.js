/**
 * ============================================
 * 📇 TEMPLATE: CONTACT
 * Fiche contact avec photo et coordonnées
 * ============================================
 */

(function () {
  "use strict";

  const TEMPLATE_ID = "contact";

  const defaultConfig = {
    name: "Jean Dupont",
    title: "Directeur Commercial",
    avatar: "",
    gradientStart: "#2a2a2a",
    gradientEnd: "#1a1a1a",
    headerStart: "#3a3a3a",
    headerEnd: "#2a2a2a",
    contacts: [
      { type: "phone", value: "06 12 34 56 78", link: "tel:0612345678" },
      {
        type: "email",
        value: "contact@example.com",
        link: "mailto:contact@example.com",
      },
    ],
  };

  /**
   * Génère le HTML PARTIEL (style + contenu, PAS de DOCTYPE/html/head/body)
   * Pour rendu NATIF dans la popup
   */
  function generateHTML(config) {
    const cfg = { ...defaultConfig, ...config };

    // Générer les lignes de contact
    const contactLines = (cfg.contacts || [])
      .map((c) => {
        const icon = getContactIcon(c.type);
        const link = c.link || "#";
        return `<a href="${escapeHtml(link)}" class="tpl-contact-line">
        <span class="tpl-contact-icon">${icon}</span>
        <span class="tpl-contact-value">${escapeHtml(c.value)}</span>
      </a>`;
      })
      .join("");

    // Avatar ou initiales
    const avatarContent = cfg.avatar
      ? `<img src="${escapeHtml(cfg.avatar)}" alt="${escapeHtml(
          cfg.name
        )}" class="tpl-avatar-img">`
      : `<span class="tpl-avatar-initials">${getInitials(cfg.name)}</span>`;

    // HTML PARTIEL : <style> + contenu (classes préfixées pour éviter conflits)
    return `
<style>
  .tpl-contact-card {
    width: 100%;
    height: 100%;
    background: linear-gradient(135deg, ${cfg.gradientStart} 0%, ${
      cfg.gradientEnd
    } 100%);
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    color: #ffffff;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    box-sizing: border-box;
  }
  .tpl-contact-card * {
    box-sizing: border-box;
  }
  .tpl-contact-header {
    background: linear-gradient(135deg, ${cfg.headerStart} 0%, ${
      cfg.headerEnd
    } 100%);
    padding: 24px;
    text-align: center;
    border-bottom: 1px solid rgba(255,255,255,0.1);
  }
  .tpl-avatar {
    width: 80px;
    height: 80px;
    border-radius: 50%;
    margin: 0 auto 16px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
    border: 3px solid rgba(255,255,255,0.2);
  }
  .tpl-avatar-img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
  .tpl-avatar-initials {
    font-size: 28px;
    font-weight: 700;
    color: white;
  }
  .tpl-contact-name {
    font-size: 20px;
    font-weight: 700;
    margin: 0 0 4px;
  }
  .tpl-contact-title {
    font-size: 14px;
    color: rgba(255,255,255,0.7);
    margin: 0;
  }
  .tpl-contact-body {
    flex: 1;
    padding: 20px;
    display: flex;
    flex-direction: column;
    gap: 12px;
  }
  .tpl-contact-line {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px 16px;
    background: rgba(255,255,255,0.05);
    border-radius: 10px;
    text-decoration: none;
    color: white;
    transition: background 0.2s;
  }
  .tpl-contact-line:hover {
    background: rgba(255,255,255,0.1);
  }
  .tpl-contact-icon {
    font-size: 18px;
    width: 24px;
    text-align: center;
  }
  .tpl-contact-value {
    font-size: 14px;
  }
</style>
<div class="tpl-contact-card">
  <div class="tpl-contact-header">
    <div class="tpl-avatar">${avatarContent}</div>
    <h2 class="tpl-contact-name">${escapeHtml(cfg.name)}</h2>
    <p class="tpl-contact-title">${escapeHtml(cfg.title)}</p>
  </div>
  <div class="tpl-contact-body">
    ${contactLines}
  </div>
</div>`;
  }

  function getContactIcon(type) {
    const icons = {
      phone: "📞",
      email: "✉️",
      website: "🌐",
      facebook: "📘",
      instagram: "📷",
      linkedin: "💼",
      twitter: "🐦",
      address: "📍",
    };
    return icons[type] || "📌";
  }

  function getInitials(name) {
    if (!name) return "?";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);
  }

  function escapeHtml(text) {
    if (!text) return "";
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
  }

  /**
   * Génère le HTML des paramètres pour l'éditeur
   */
  function generateParamsHTML(config) {
    const cfg = { ...defaultConfig, ...config };

    const contactTypes = [
      { value: "phone", label: "📞 Téléphone" },
      { value: "email", label: "✉️ Email" },
      { value: "website", label: "🌐 Site web" },
      { value: "facebook", label: "📘 Facebook" },
      { value: "instagram", label: "📷 Instagram" },
      { value: "linkedin", label: "💼 LinkedIn" },
      { value: "twitter", label: "🐦 Twitter" },
      { value: "address", label: "📍 Adresse" },
    ];

    const contactsHTML = (cfg.contacts || [])
      .map(
        (c, i) => `
      <div class="contact-entry" data-index="${i}">
        <select onchange="window.templateEditor.updateContact(${i}, 'type', this.value)">
          ${contactTypes
            .map(
              (t) =>
                `<option value="${t.value}" ${
                  c.type === t.value ? "selected" : ""
                }>${t.label}</option>`
            )
            .join("")}
        </select>
        <input type="text" value="${escapeHtml(c.value)}" placeholder="Valeur" 
               onchange="window.templateEditor.updateContact(${i}, 'value', this.value)">
        <input type="text" value="${escapeHtml(
          c.link || ""
        )}" placeholder="Lien (optionnel)"
               onchange="window.templateEditor.updateContact(${i}, 'link', this.value)">
        <button type="button" class="btn-remove" onclick="window.templateEditor.removeContact(${i})">✕</button>
      </div>
    `
      )
      .join("");

    return `
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
          <label class="param-label">Titre / Fonction</label>
          <input type="text" class="param-input" value="${escapeHtml(
            cfg.title
          )}" 
                 onchange="window.templateEditor.updateConfig('title', this.value)">
        </div>
        <div class="param-group">
          <label class="param-label">Image avatar (URL)</label>
          <input type="url" class="param-input" value="${escapeHtml(
            cfg.avatar
          )}" 
                 placeholder="https://..."
                 onchange="window.templateEditor.updateConfig('avatar', this.value)">
        </div>
      </div>

      <div class="params-section">
        <div class="params-section-title">🎨 Couleurs</div>
        <div class="param-row">
          <div class="param-group">
            <label class="param-label">Fond dégradé - Début</label>
            <input type="color" class="param-color" value="${
              cfg.gradientStart
            }" 
                   onchange="window.templateEditor.updateConfig('gradientStart', this.value)">
          </div>
          <div class="param-group">
            <label class="param-label">Fond dégradé - Fin</label>
            <input type="color" class="param-color" value="${cfg.gradientEnd}" 
                   onchange="window.templateEditor.updateConfig('gradientEnd', this.value)">
          </div>
        </div>
        <div class="param-row">
          <div class="param-group">
            <label class="param-label">Header - Début</label>
            <input type="color" class="param-color" value="${cfg.headerStart}" 
                   onchange="window.templateEditor.updateConfig('headerStart', this.value)">
          </div>
          <div class="param-group">
            <label class="param-label">Header - Fin</label>
            <input type="color" class="param-color" value="${cfg.headerEnd}" 
                   onchange="window.templateEditor.updateConfig('headerEnd', this.value)">
          </div>
        </div>
      </div>

      <div class="params-section">
        <div class="params-section-title">📇 Coordonnées</div>
        <div class="contacts-list">
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
    console.log('✅ Template "contact" enregistré');
  }
})();
