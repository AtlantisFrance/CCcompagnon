/**
 * ============================================
 * 🎨 TEMPLATE EDITOR - ATLANTIS CITY
 * Module d'édition de templates popup avec UI visuelle
 *
 * 🧪 COMMANDES CONSOLE:
 * - c1_openeditor()  → Éditeur template Carré 1
 * - p1_openeditor()  → Éditeur template Portrait 1
 * - l1_openeditor()  → Éditeur template Paysage 1
 * - template_edit("c1_obj") → Par ID objet
 * - template_preview("c1_obj") → Preview seul
 * ============================================
 */

(function () {
  "use strict";

  // ============================================
  // ⚙️ CONFIGURATION
  // ============================================
  const CONFIG = {
    apiBase: "https://compagnon.atlantis-city.com/api",
    // Types de templates disponibles
    templateTypes: {
      contact: {
        name: "Fiche Contact",
        icon: "📇",
        description: "Carte de contact avec liens sociaux",
      },
      synopsis: {
        name: "Synopsis / Présentation",
        icon: "🎬",
        description: "Texte descriptif avec CTA",
      },
      iframe: {
        name: "Iframe Site Web",
        icon: "🌐",
        description: "Intégration d'un site externe",
      },
      gallery: {
        name: "Galerie Images",
        icon: "🖼️",
        description: "Carrousel d'images",
      },
      video: {
        name: "Lecteur Vidéo",
        icon: "▶️",
        description: "YouTube, Vimeo ou MP4",
      },
      custom: {
        name: "HTML Personnalisé",
        icon: "🛠️",
        description: "Code HTML/CSS libre",
      },
    },
  };

  // ============================================
  // 📊 ÉTAT LOCAL
  // ============================================
  let state = {
    isOpen: false,
    objectConfig: null,
    templateType: "contact",
    templateData: {},
    hasChanges: false,
    isLoading: false,
    isSaving: false,
  };

  // ============================================
  // 🎨 STYLES
  // ============================================
  const STYLES = `
    /* ===== OVERLAY ===== */
    .tpl-editor-overlay {
      position: fixed; inset: 0; background: rgba(0,0,0,0.9); backdrop-filter: blur(8px);
      z-index: 99999; display: flex; align-items: center; justify-content: center;
      opacity: 0; transition: opacity 0.3s ease; font-family: 'Segoe UI', Roboto, sans-serif;
    }
    .tpl-editor-overlay.active { opacity: 1; }

    /* ===== MODAL ===== */
    .tpl-editor-modal {
      background: #1e293b; border: 1px solid #334155; border-radius: 16px;
      width: 900px; max-width: 95vw; max-height: 90vh; overflow: hidden;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
      transform: scale(0.95); transition: transform 0.3s ease;
      display: flex; flex-direction: column;
    }
    .tpl-editor-overlay.active .tpl-editor-modal { transform: scale(1); }

    /* ===== HEADER ===== */
    .tpl-editor-header {
      padding: 15px 20px; background: #0f172a; border-bottom: 1px solid #334155;
      display: flex; justify-content: space-between; align-items: center; flex-shrink: 0;
    }
    .tpl-editor-title { 
      font-size: 16px; font-weight: 600; color: #f8fafc; margin: 0; 
      display: flex; gap: 10px; align-items: center; 
    }
    .tpl-editor-close { 
      background: none; border: none; color: #94a3b8; font-size: 24px; 
      cursor: pointer; transition: color 0.2s; padding: 0; line-height: 1; 
    }
    .tpl-editor-close:hover { color: #ef4444; }

    /* ===== BODY ===== */
    .tpl-editor-body { 
      display: grid; grid-template-columns: 280px 1fr; 
      flex: 1; overflow: hidden; min-height: 0;
    }

    /* ===== SIDEBAR ===== */
    .tpl-sidebar {
      background: #0f172a; border-right: 1px solid #334155;
      padding: 20px; overflow-y: auto;
    }
    .tpl-sidebar-title {
      font-size: 11px; color: #64748b; text-transform: uppercase; 
      font-weight: 700; margin-bottom: 12px; letter-spacing: 0.5px;
    }
    .tpl-type-list { display: flex; flex-direction: column; gap: 8px; }
    .tpl-type-btn {
      display: flex; align-items: center; gap: 12px;
      padding: 12px 14px; background: #1e293b; border: 1px solid #334155;
      border-radius: 10px; cursor: pointer; transition: all 0.2s; text-align: left;
    }
    .tpl-type-btn:hover { border-color: #475569; background: #273549; }
    .tpl-type-btn.active { 
      border-color: #3b82f6; background: rgba(59, 130, 246, 0.15); 
      box-shadow: 0 0 0 1px rgba(59, 130, 246, 0.3);
    }
    .tpl-type-icon { font-size: 20px; }
    .tpl-type-info { flex: 1; }
    .tpl-type-name { font-size: 13px; font-weight: 600; color: #e2e8f0; }
    .tpl-type-desc { font-size: 11px; color: #64748b; margin-top: 2px; }

    /* ===== MAIN CONTENT ===== */
    .tpl-main {
      display: flex; flex-direction: column; overflow: hidden;
    }
    .tpl-tabs {
      display: flex; gap: 0; background: #0f172a; border-bottom: 1px solid #334155; flex-shrink: 0;
    }
    .tpl-tab {
      padding: 12px 20px; background: transparent; border: none;
      color: #94a3b8; font-size: 13px; font-weight: 500; cursor: pointer;
      border-bottom: 2px solid transparent; transition: all 0.2s;
    }
    .tpl-tab:hover { color: #e2e8f0; background: rgba(255,255,255,0.03); }
    .tpl-tab.active { 
      color: #3b82f6; border-bottom-color: #3b82f6; 
      background: rgba(59, 130, 246, 0.05);
    }

    .tpl-content {
      flex: 1; overflow-y: auto; padding: 20px;
    }

    /* ===== FORMULAIRE ===== */
    .tpl-form-section {
      margin-bottom: 24px;
    }
    .tpl-form-section-title {
      font-size: 12px; color: #94a3b8; text-transform: uppercase;
      font-weight: 700; margin-bottom: 12px; letter-spacing: 0.5px;
      display: flex; align-items: center; gap: 8px;
    }
    .tpl-form-grid {
      display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px;
    }
    .tpl-form-grid.single { grid-template-columns: 1fr; }

    .tpl-field { display: flex; flex-direction: column; gap: 6px; }
    .tpl-field.full { grid-column: 1 / -1; }
    .tpl-label {
      font-size: 12px; color: #94a3b8; font-weight: 500;
    }
    .tpl-input, .tpl-textarea, .tpl-select {
      padding: 10px 12px; background: #0f172a; border: 1px solid #334155;
      border-radius: 8px; color: #e2e8f0; font-size: 13px;
      transition: border-color 0.2s, box-shadow 0.2s;
    }
    .tpl-input:focus, .tpl-textarea:focus, .tpl-select:focus {
      outline: none; border-color: #3b82f6;
      box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.15);
    }
    .tpl-input::placeholder, .tpl-textarea::placeholder {
      color: #475569;
    }
    .tpl-textarea { resize: vertical; min-height: 80px; font-family: inherit; }

    /* ===== COLOR PICKER ===== */
    .tpl-color-field {
      display: flex; align-items: center; gap: 10px;
    }
    .tpl-color-preview {
      width: 36px; height: 36px; border-radius: 8px; border: 2px solid #334155;
      cursor: pointer; transition: transform 0.2s;
    }
    .tpl-color-preview:hover { transform: scale(1.05); }
    .tpl-color-input {
      position: absolute; opacity: 0; width: 0; height: 0;
    }
    .tpl-color-hex {
      flex: 1; font-family: monospace;
    }

    /* ===== CONTACTS LIST ===== */
    .tpl-contacts-list { display: flex; flex-direction: column; gap: 12px; }
    .tpl-contact-item {
      display: grid; grid-template-columns: 100px 1fr 1fr auto;
      gap: 10px; align-items: center;
      padding: 12px; background: #0f172a; border-radius: 10px;
      border: 1px solid #334155;
    }
    .tpl-contact-remove {
      background: #ef4444; color: white; border: none;
      width: 28px; height: 28px; border-radius: 6px;
      cursor: pointer; font-size: 14px; transition: opacity 0.2s;
    }
    .tpl-contact-remove:hover { opacity: 0.8; }
    .tpl-add-btn {
      display: flex; align-items: center; justify-content: center; gap: 8px;
      padding: 12px; background: rgba(59, 130, 246, 0.1); border: 1px dashed #3b82f6;
      border-radius: 10px; color: #3b82f6; font-size: 13px; font-weight: 500;
      cursor: pointer; transition: all 0.2s;
    }
    .tpl-add-btn:hover { background: rgba(59, 130, 246, 0.2); }

    /* ===== PREVIEW ===== */
    .tpl-preview-container {
      background: #0f172a; border-radius: 12px; padding: 20px;
      min-height: 300px; display: flex; align-items: center; justify-content: center;
    }
    .tpl-preview-frame {
      background: #000; border-radius: 8px; padding: 0;
      width: 100%; max-width: 400px; overflow: hidden;
      box-shadow: 0 10px 40px rgba(0,0,0,0.5);
    }
    .tpl-preview-empty {
      color: #64748b; font-size: 14px; text-align: center;
    }

    /* ===== FOOTER ===== */
    .tpl-editor-footer {
      padding: 15px 20px; background: #0f172a; border-top: 1px solid #334155;
      display: flex; justify-content: space-between; align-items: center; flex-shrink: 0;
    }
    .tpl-status { 
      font-size: 13px; color: #94a3b8; 
      display: flex; align-items: center; gap: 6px; font-weight: 500; 
    }
    .tpl-status.success { color: #4ade80; }
    .tpl-status.error { color: #ef4444; }
    .tpl-status.warning { color: #fbbf24; }

    .tpl-footer-actions { display: flex; gap: 10px; }
    .tpl-btn {
      padding: 10px 20px; border-radius: 8px; font-size: 13px; font-weight: 600;
      border: none; cursor: pointer; transition: all 0.2s;
    }
    .tpl-btn-secondary {
      background: #334155; color: #e2e8f0;
    }
    .tpl-btn-secondary:hover { background: #475569; }
    .tpl-btn-primary {
      background: linear-gradient(135deg, #3b82f6, #2563eb); color: white;
      box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
    }
    .tpl-btn-primary:disabled { 
      opacity: 0.5; cursor: not-allowed; box-shadow: none; background: #475569; 
    }
    .tpl-btn-primary:hover:not(:disabled) { 
      transform: translateY(-1px); 
      box-shadow: 0 6px 15px rgba(59, 130, 246, 0.4); 
    }

    /* ===== ZONE BADGE ===== */
    .tpl-zone-badge {
      display: inline-flex; align-items: center; gap: 5px;
      background: rgba(139, 92, 246, 0.2); color: #a78bfa;
      padding: 3px 10px; border-radius: 12px; font-size: 11px; font-weight: 600;
    }

    /* ===== RESPONSIVE ===== */
    @media (max-width: 800px) {
      .tpl-editor-body { grid-template-columns: 1fr; }
      .tpl-sidebar { display: none; }
      .tpl-form-grid { grid-template-columns: 1fr; }
      .tpl-contact-item { grid-template-columns: 1fr; }
    }
  `;

  // ============================================
  // 💉 INJECTION STYLES
  // ============================================
  function injectStyles() {
    if (!document.getElementById("tpl-editor-styles")) {
      const style = document.createElement("style");
      style.id = "tpl-editor-styles";
      style.textContent = STYLES;
      document.head.appendChild(style);
    }
  }

  // ============================================
  // 🔐 AUTH & PERMISSIONS
  // ============================================
  function getUser() {
    if (window.atlantisAuth && window.atlantisAuth.getUser) {
      return window.atlantisAuth.getUser();
    }
    const stored = localStorage.getItem("atlantis_auth_user");
    if (stored) {
      try { return JSON.parse(stored); } catch (e) {}
    }
    return null;
  }

  function getToken() {
    if (window.atlantisAuth && typeof window.atlantisAuth.getToken === "function") {
      const token = window.atlantisAuth.getToken();
      if (token) return token;
    }
    return localStorage.getItem("atlantis_auth_token") || 
           localStorage.getItem("atlantis_token") || null;
  }

  function checkZoneAccess(zoneSlug) {
    const user = getUser();
    const spaceSlug = window.ATLANTIS_SPACE || "default";

    if (!user) {
      return { allowed: false, reason: "Vous devez être connecté", code: "NOT_LOGGED_IN" };
    }
    if (user.global_role === "super_admin") {
      return { allowed: true, reason: "✅ Accès Super Admin", code: "SUPER_ADMIN" };
    }

    const spaceRoles = user.space_roles || [];
    const isSpaceAdmin = spaceRoles.some(
      (r) => r.space_slug === spaceSlug && r.role === "space_admin"
    );
    if (isSpaceAdmin) {
      return { allowed: true, reason: `✅ Accès Space Admin`, code: "SPACE_ADMIN" };
    }

    const isZoneAdmin = spaceRoles.some(
      (r) => r.space_slug === spaceSlug && r.zone_slug === zoneSlug &&
             (r.role === "zone_admin" || r.role === "space_admin")
    );
    if (isZoneAdmin) {
      return { allowed: true, reason: `✅ Accès Zone Admin`, code: "ZONE_ADMIN" };
    }

    return { allowed: false, reason: `❌ Pas d'accès à "${zoneSlug}"`, code: "NO_ACCESS" };
  }

  // ============================================
  // 🚀 OPEN / CLOSE
  // ============================================
  function open(objectConfig) {
    injectStyles();

    const spaceSlug = objectConfig.spaceSlug || window.ATLANTIS_SPACE || "default";

    state = {
      isOpen: true,
      objectConfig: { ...objectConfig, spaceSlug },
      templateType: "contact",
      templateData: getDefaultTemplateData("contact"),
      hasChanges: false,
      isLoading: true,
      isSaving: false,
      activeTab: "edit",
    };

    render();
    loadExistingTemplate();
    console.log("🎨 Template Editor ouvert:", objectConfig);
  }

  function close() {
    if (state.hasChanges) {
      if (!confirm("Des modifications non sauvegardées seront perdues. Fermer quand même ?")) {
        return;
      }
    }
    const overlay = document.querySelector(".tpl-editor-overlay");
    if (overlay) {
      overlay.classList.remove("active");
      setTimeout(() => overlay.remove(), 300);
    }
    state.isOpen = false;
  }

  // ============================================
  // 📄 TEMPLATES PAR DÉFAUT
  // ============================================
  function getDefaultTemplateData(type) {
    const defaults = {
      contact: {
        name: "Nom Prénom",
        title: "Contact & Réseaux",
        avatar: "ABC",
        contacts: [
          { type: "phone", label: "Téléphone", value: "06 00 00 00 00", href: "tel:0600000000", icon: "📱" },
          { type: "email", label: "Email", value: "contact@example.com", href: "mailto:contact@example.com", icon: "✉️" },
        ],
        colors: {
          background: "#1a1a2e",
          accent: "#3b82f6",
          text: "#ffffff",
        },
      },
      synopsis: {
        title: "Titre du projet",
        synopsis: "Description du projet...",
        copyright: {
          year: new Date().getFullYear().toString(),
          owner: "Votre nom",
          texts: ["Texte légal..."],
        },
        ctaText: "En savoir plus",
        ctaUrl: "https://example.com",
        colors: {
          background: "#1a1a2e",
          accent: "#8b5cf6",
          text: "#ffffff",
        },
      },
      iframe: {
        title: "Titre",
        url: "https://example.com",
        icon: "🌐",
        colors: {
          header: "#2a2a2a",
          background: "#1a1a1a",
        },
      },
      gallery: {
        title: "Galerie",
        images: [],
        autoplay: false,
        interval: 5000,
      },
      video: {
        title: "Vidéo",
        type: "youtube",
        videoId: "",
        autoplay: false,
      },
      custom: {
        html: "<div class=\"custom-popup\">\n  <h2>Titre</h2>\n  <p>Contenu personnalisé</p>\n</div>",
        css: ".custom-popup {\n  padding: 20px;\n  background: #1a1a2e;\n  color: white;\n  border-radius: 12px;\n}",
      },
    };
    return defaults[type] || defaults.contact;
  }

  // ============================================
  // 📡 LOAD EXISTING TEMPLATE
  // ============================================
  async function loadExistingTemplate() {
    try {
      const { objectConfig } = state;
      const response = await fetch(
        `${CONFIG.apiBase}/popups/get.php?` +
        `space_slug=${objectConfig.spaceSlug}&object_name=${objectConfig.id}`
      );

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.template) {
          state.templateType = data.template.template_type || "contact";
          state.templateData = JSON.parse(data.template.template_config || "{}");
          console.log("📥 Template existant chargé:", state.templateType);
        }
      }
    } catch (err) {
      console.log("ℹ️ Pas de template existant, utilisation des valeurs par défaut");
    }

    state.isLoading = false;
    render();
  }

  // ============================================
  // 🎨 RENDER PRINCIPAL
  // ============================================
  function render() {
    document.querySelectorAll(".tpl-editor-overlay").forEach((el) => el.remove());

    const { objectConfig, templateType, activeTab } = state;

    const html = `
      <div class="tpl-editor-overlay">
        <div class="tpl-editor-modal">
          <!-- HEADER -->
          <div class="tpl-editor-header">
            <h3 class="tpl-editor-title">
              <span>🎨</span> Template Editor : ${objectConfig.title || objectConfig.id}
              <span class="tpl-zone-badge">📍 ${objectConfig.zone || "-"}</span>
            </h3>
            <button class="tpl-editor-close" id="tpl-close-btn">✕</button>
          </div>

          <!-- BODY -->
          <div class="tpl-editor-body">
            <!-- SIDEBAR - Types -->
            <div class="tpl-sidebar">
              <div class="tpl-sidebar-title">Type de template</div>
              <div class="tpl-type-list">
                ${Object.entries(CONFIG.templateTypes).map(([key, t]) => `
                  <button class="tpl-type-btn ${templateType === key ? 'active' : ''}" data-type="${key}">
                    <span class="tpl-type-icon">${t.icon}</span>
                    <div class="tpl-type-info">
                      <div class="tpl-type-name">${t.name}</div>
                      <div class="tpl-type-desc">${t.description}</div>
                    </div>
                  </button>
                `).join('')}
              </div>
            </div>

            <!-- MAIN -->
            <div class="tpl-main">
              <div class="tpl-tabs">
                <button class="tpl-tab ${activeTab === 'edit' ? 'active' : ''}" data-tab="edit">✏️ Édition</button>
                <button class="tpl-tab ${activeTab === 'preview' ? 'active' : ''}" data-tab="preview">👁️ Aperçu</button>
              </div>
              <div class="tpl-content" id="tpl-content">
                ${activeTab === 'edit' ? renderEditForm() : renderPreview()}
              </div>
            </div>
          </div>

          <!-- FOOTER -->
          <div class="tpl-editor-footer">
            <div class="tpl-status" id="tpl-status">
              ${state.isLoading ? '⏳ Chargement...' : state.hasChanges ? '⚠️ Modifications non sauvegardées' : '✅ Prêt'}
            </div>
            <div class="tpl-footer-actions">
              <button class="tpl-btn tpl-btn-secondary" id="tpl-cancel-btn">Annuler</button>
              <button class="tpl-btn tpl-btn-primary" id="tpl-save-btn" ${state.isSaving ? 'disabled' : ''}>
                ${state.isSaving ? '⏳ Sauvegarde...' : '💾 Sauvegarder'}
              </button>
            </div>
          </div>
        </div>
      </div>
    `;

    document.body.insertAdjacentHTML("beforeend", html);

    // Activer animation
    requestAnimationFrame(() => {
      document.querySelector(".tpl-editor-overlay").classList.add("active");
    });

    bindEvents();
  }

  // ============================================
  // 📝 RENDER FORMULAIRE SELON TYPE
  // ============================================
  function renderEditForm() {
    const { templateType, templateData } = state;

    switch (templateType) {
      case "contact":
        return renderContactForm(templateData);
      case "synopsis":
        return renderSynopsisForm(templateData);
      case "iframe":
        return renderIframeForm(templateData);
      case "custom":
        return renderCustomForm(templateData);
      default:
        return `<div class="tpl-preview-empty">Formulaire "${templateType}" à venir...</div>`;
    }
  }

  // ============================================
  // 📇 FORMULAIRE CONTACT
  // ============================================
  function renderContactForm(data) {
    return `
      <!-- Informations générales -->
      <div class="tpl-form-section">
        <div class="tpl-form-section-title">📋 Informations générales</div>
        <div class="tpl-form-grid">
          <div class="tpl-field">
            <label class="tpl-label">Nom complet</label>
            <input type="text" class="tpl-input" data-field="name" value="${escapeHtml(data.name || '')}" placeholder="Jean Dupont">
          </div>
          <div class="tpl-field">
            <label class="tpl-label">Sous-titre</label>
            <input type="text" class="tpl-input" data-field="title" value="${escapeHtml(data.title || '')}" placeholder="Contact & Réseaux">
          </div>
          <div class="tpl-field">
            <label class="tpl-label">Avatar (initiales)</label>
            <input type="text" class="tpl-input" data-field="avatar" value="${escapeHtml(data.avatar || '')}" maxlength="3" placeholder="JD">
          </div>
        </div>
      </div>

      <!-- Contacts -->
      <div class="tpl-form-section">
        <div class="tpl-form-section-title">📞 Liens de contact</div>
        <div class="tpl-contacts-list" id="tpl-contacts-list">
          ${(data.contacts || []).map((c, i) => renderContactItem(c, i)).join('')}
        </div>
        <button class="tpl-add-btn" id="tpl-add-contact">+ Ajouter un contact</button>
      </div>

      <!-- Couleurs -->
      <div class="tpl-form-section">
        <div class="tpl-form-section-title">🎨 Couleurs</div>
        <div class="tpl-form-grid">
          ${renderColorField('background', 'Fond', data.colors?.background || '#1a1a2e')}
          ${renderColorField('accent', 'Accent', data.colors?.accent || '#3b82f6')}
          ${renderColorField('text', 'Texte', data.colors?.text || '#ffffff')}
        </div>
      </div>
    `;
  }

  function renderContactItem(contact, index) {
    return `
      <div class="tpl-contact-item" data-index="${index}">
        <select class="tpl-select" data-contact-field="type" data-index="${index}">
          <option value="phone" ${contact.type === 'phone' ? 'selected' : ''}>📱 Téléphone</option>
          <option value="email" ${contact.type === 'email' ? 'selected' : ''}>✉️ Email</option>
          <option value="website" ${contact.type === 'website' ? 'selected' : ''}>🌐 Site web</option>
          <option value="facebook" ${contact.type === 'facebook' ? 'selected' : ''}>📘 Facebook</option>
          <option value="instagram" ${contact.type === 'instagram' ? 'selected' : ''}>📷 Instagram</option>
          <option value="linkedin" ${contact.type === 'linkedin' ? 'selected' : ''}>💼 LinkedIn</option>
          <option value="twitter" ${contact.type === 'twitter' ? 'selected' : ''}>🐦 Twitter/X</option>
          <option value="youtube" ${contact.type === 'youtube' ? 'selected' : ''}>▶️ YouTube</option>
          <option value="tiktok" ${contact.type === 'tiktok' ? 'selected' : ''}>🎵 TikTok</option>
        </select>
        <input type="text" class="tpl-input" data-contact-field="value" data-index="${index}" 
               value="${escapeHtml(contact.value || '')}" placeholder="Valeur affichée">
        <input type="text" class="tpl-input" data-contact-field="href" data-index="${index}" 
               value="${escapeHtml(contact.href || '')}" placeholder="Lien (tel:, mailto:, https://)">
        <button class="tpl-contact-remove" data-remove-index="${index}">✕</button>
      </div>
    `;
  }

  // ============================================
  // 🎬 FORMULAIRE SYNOPSIS
  // ============================================
  function renderSynopsisForm(data) {
    return `
      <div class="tpl-form-section">
        <div class="tpl-form-section-title">📋 Contenu</div>
        <div class="tpl-form-grid single">
          <div class="tpl-field">
            <label class="tpl-label">Titre</label>
            <input type="text" class="tpl-input" data-field="title" value="${escapeHtml(data.title || '')}" placeholder="Titre du projet">
          </div>
          <div class="tpl-field">
            <label class="tpl-label">Synopsis / Description</label>
            <textarea class="tpl-textarea" data-field="synopsis" rows="4" placeholder="Description...">${escapeHtml(data.synopsis || '')}</textarea>
          </div>
        </div>
      </div>

      <div class="tpl-form-section">
        <div class="tpl-form-section-title">🔗 Bouton d'action</div>
        <div class="tpl-form-grid">
          <div class="tpl-field">
            <label class="tpl-label">Texte du bouton</label>
            <input type="text" class="tpl-input" data-field="ctaText" value="${escapeHtml(data.ctaText || '')}" placeholder="En savoir plus">
          </div>
          <div class="tpl-field">
            <label class="tpl-label">URL du bouton</label>
            <input type="url" class="tpl-input" data-field="ctaUrl" value="${escapeHtml(data.ctaUrl || '')}" placeholder="https://...">
          </div>
        </div>
      </div>

      <div class="tpl-form-section">
        <div class="tpl-form-section-title">©️ Copyright</div>
        <div class="tpl-form-grid">
          <div class="tpl-field">
            <label class="tpl-label">Année</label>
            <input type="text" class="tpl-input" data-field="copyright.year" value="${escapeHtml(data.copyright?.year || '')}" placeholder="2024">
          </div>
          <div class="tpl-field">
            <label class="tpl-label">Propriétaire</label>
            <input type="text" class="tpl-input" data-field="copyright.owner" value="${escapeHtml(data.copyright?.owner || '')}" placeholder="Votre nom">
          </div>
        </div>
      </div>

      <div class="tpl-form-section">
        <div class="tpl-form-section-title">🎨 Couleurs</div>
        <div class="tpl-form-grid">
          ${renderColorField('background', 'Fond', data.colors?.background || '#1a1a2e')}
          ${renderColorField('accent', 'Accent', data.colors?.accent || '#8b5cf6')}
        </div>
      </div>
    `;
  }

  // ============================================
  // 🌐 FORMULAIRE IFRAME
  // ============================================
  function renderIframeForm(data) {
    return `
      <div class="tpl-form-section">
        <div class="tpl-form-section-title">🌐 Configuration iframe</div>
        <div class="tpl-form-grid single">
          <div class="tpl-field">
            <label class="tpl-label">Titre de la fenêtre</label>
            <input type="text" class="tpl-input" data-field="title" value="${escapeHtml(data.title || '')}" placeholder="Titre">
          </div>
          <div class="tpl-field">
            <label class="tpl-label">URL du site à intégrer</label>
            <input type="url" class="tpl-input" data-field="url" value="${escapeHtml(data.url || '')}" placeholder="https://example.com">
          </div>
          <div class="tpl-field">
            <label class="tpl-label">Icône (emoji)</label>
            <input type="text" class="tpl-input" data-field="icon" value="${escapeHtml(data.icon || '🌐')}" maxlength="2" style="width: 80px;">
          </div>
        </div>
      </div>
    `;
  }

  // ============================================
  // 🛠️ FORMULAIRE CUSTOM
  // ============================================
  function renderCustomForm(data) {
    return `
      <div class="tpl-form-section">
        <div class="tpl-form-section-title">🛠️ Code HTML</div>
        <div class="tpl-form-grid single">
          <div class="tpl-field">
            <textarea class="tpl-textarea" data-field="html" rows="10" 
                      style="font-family: monospace; font-size: 12px;"
                      placeholder="<div>...</div>">${escapeHtml(data.html || '')}</textarea>
          </div>
        </div>
      </div>

      <div class="tpl-form-section">
        <div class="tpl-form-section-title">🎨 Code CSS</div>
        <div class="tpl-form-grid single">
          <div class="tpl-field">
            <textarea class="tpl-textarea" data-field="css" rows="8" 
                      style="font-family: monospace; font-size: 12px;"
                      placeholder=".custom-popup { ... }">${escapeHtml(data.css || '')}</textarea>
          </div>
        </div>
      </div>
    `;
  }

  // ============================================
  // 🎨 COLOR PICKER HELPER
  // ============================================
  function renderColorField(key, label, value) {
    return `
      <div class="tpl-field">
        <label class="tpl-label">${label}</label>
        <div class="tpl-color-field">
          <div class="tpl-color-preview" style="background: ${value};" data-color-key="${key}">
            <input type="color" class="tpl-color-input" data-color-field="${key}" value="${value}">
          </div>
          <input type="text" class="tpl-input tpl-color-hex" data-field="colors.${key}" value="${value}" placeholder="#000000">
        </div>
      </div>
    `;
  }

  // ============================================
  // 👁️ PREVIEW
  // ============================================
  function renderPreview() {
    return `
      <div class="tpl-preview-container">
        <div class="tpl-preview-frame" id="tpl-preview-frame">
          ${generatePreviewHTML()}
        </div>
      </div>
    `;
  }

  function generatePreviewHTML() {
    const { templateType, templateData } = state;

    // Générer un aperçu simplifié selon le type
    switch (templateType) {
      case "contact":
        return `
          <div style="padding: 20px; background: ${templateData.colors?.background || '#1a1a2e'}; color: ${templateData.colors?.text || '#fff'}; text-align: center;">
            <div style="width: 60px; height: 60px; background: ${templateData.colors?.accent || '#3b82f6'}; border-radius: 50%; margin: 0 auto 15px; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 20px;">
              ${templateData.avatar || 'AB'}
            </div>
            <h3 style="margin: 0 0 5px; font-size: 18px;">${escapeHtml(templateData.name || 'Nom')}</h3>
            <p style="margin: 0 0 15px; opacity: 0.7; font-size: 13px;">${escapeHtml(templateData.title || 'Titre')}</p>
            <div style="text-align: left;">
              ${(templateData.contacts || []).slice(0, 3).map(c => `
                <div style="padding: 10px; background: rgba(255,255,255,0.1); border-radius: 8px; margin-bottom: 8px; font-size: 13px;">
                  ${c.icon || '📌'} ${escapeHtml(c.value || '')}
                </div>
              `).join('')}
            </div>
          </div>
        `;

      case "synopsis":
        return `
          <div style="padding: 20px; background: ${templateData.colors?.background || '#1a1a2e'}; color: #fff;">
            <h3 style="margin: 0 0 15px; font-size: 18px;">${escapeHtml(templateData.title || 'Titre')}</h3>
            <p style="font-size: 13px; line-height: 1.5; opacity: 0.9;">${escapeHtml((templateData.synopsis || '').substring(0, 150))}...</p>
            ${templateData.ctaText ? `
              <button style="margin-top: 15px; padding: 10px 20px; background: ${templateData.colors?.accent || '#8b5cf6'}; border: none; border-radius: 8px; color: white; font-weight: 600; cursor: pointer;">
                ${escapeHtml(templateData.ctaText)}
              </button>
            ` : ''}
          </div>
        `;

      case "iframe":
        return `
          <div style="padding: 15px; background: #2a2a2a; color: white;">
            <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 10px;">
              <span style="font-size: 20px;">${templateData.icon || '🌐'}</span>
              <span style="font-weight: 600;">${escapeHtml(templateData.title || 'Iframe')}</span>
            </div>
            <div style="background: #1a1a1a; height: 150px; border-radius: 8px; display: flex; align-items: center; justify-content: center; color: #666; font-size: 12px;">
              ${escapeHtml(templateData.url || 'URL non définie')}
            </div>
          </div>
        `;

      default:
        return `<div style="padding: 40px; text-align: center; color: #666;">Aperçu non disponible</div>`;
    }
  }

  // ============================================
  // 🔗 BIND EVENTS
  // ============================================
  function bindEvents() {
    const overlay = document.querySelector(".tpl-editor-overlay");

    // Close button
    document.getElementById("tpl-close-btn").addEventListener("click", close);
    document.getElementById("tpl-cancel-btn").addEventListener("click", close);

    // Save button
    document.getElementById("tpl-save-btn").addEventListener("click", save);

    // Type selection
    document.querySelectorAll(".tpl-type-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        const newType = btn.dataset.type;
        if (newType !== state.templateType) {
          state.templateType = newType;
          state.templateData = getDefaultTemplateData(newType);
          state.hasChanges = true;
          render();
        }
      });
    });

    // Tab selection
    document.querySelectorAll(".tpl-tab").forEach((tab) => {
      tab.addEventListener("click", () => {
        state.activeTab = tab.dataset.tab;
        render();
      });
    });

    // Form inputs
    document.querySelectorAll(".tpl-input, .tpl-textarea, .tpl-select").forEach((input) => {
      input.addEventListener("input", handleInputChange);
      input.addEventListener("change", handleInputChange);
    });

    // Color pickers
    document.querySelectorAll(".tpl-color-input").forEach((input) => {
      input.addEventListener("input", (e) => {
        const key = e.target.dataset.colorField;
        const value = e.target.value;
        updateNestedField(`colors.${key}`, value);

        // Update preview
        const preview = e.target.closest(".tpl-color-field").querySelector(".tpl-color-preview");
        if (preview) preview.style.background = value;

        // Update hex input
        const hexInput = e.target.closest(".tpl-color-field").querySelector(".tpl-color-hex");
        if (hexInput) hexInput.value = value;
      });
    });

    document.querySelectorAll(".tpl-color-preview").forEach((preview) => {
      preview.addEventListener("click", () => {
        preview.querySelector("input").click();
      });
    });

    // Add contact button
    const addContactBtn = document.getElementById("tpl-add-contact");
    if (addContactBtn) {
      addContactBtn.addEventListener("click", addContact);
    }

    // Remove contact buttons
    document.querySelectorAll("[data-remove-index]").forEach((btn) => {
      btn.addEventListener("click", () => removeContact(parseInt(btn.dataset.removeIndex)));
    });

    // Contact fields
    document.querySelectorAll("[data-contact-field]").forEach((input) => {
      input.addEventListener("input", (e) => {
        const index = parseInt(e.target.dataset.index);
        const field = e.target.dataset.contactField;
        if (state.templateData.contacts && state.templateData.contacts[index]) {
          state.templateData.contacts[index][field] = e.target.value;
          state.hasChanges = true;
          updateStatus();
        }
      });
    });

    // Click outside to close
    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) close();
    });

    // ESC key
    document.addEventListener("keydown", function escHandler(e) {
      if (e.key === "Escape" && state.isOpen) {
        close();
        document.removeEventListener("keydown", escHandler);
      }
    });
  }

  // ============================================
  // 📝 FORM HANDLERS
  // ============================================
  function handleInputChange(e) {
    const field = e.target.dataset.field;
    if (!field) return;

    const value = e.target.value;
    updateNestedField(field, value);
  }

  function updateNestedField(field, value) {
    const parts = field.split(".");
    let obj = state.templateData;

    for (let i = 0; i < parts.length - 1; i++) {
      if (!obj[parts[i]]) obj[parts[i]] = {};
      obj = obj[parts[i]];
    }

    obj[parts[parts.length - 1]] = value;
    state.hasChanges = true;
    updateStatus();
  }

  function addContact() {
    if (!state.templateData.contacts) state.templateData.contacts = [];
    state.templateData.contacts.push({
      type: "website",
      label: "Site web",
      value: "",
      href: "",
      icon: "🌐",
    });
    state.hasChanges = true;
    render();
  }

  function removeContact(index) {
    if (state.templateData.contacts) {
      state.templateData.contacts.splice(index, 1);
      state.hasChanges = true;
      render();
    }
  }

  function updateStatus() {
    const statusEl = document.getElementById("tpl-status");
    if (statusEl) {
      statusEl.textContent = state.hasChanges ? "⚠️ Modifications non sauvegardées" : "✅ Prêt";
      statusEl.className = "tpl-status" + (state.hasChanges ? " warning" : "");
    }
  }

  // ============================================
  // 💾 SAVE
  // ============================================
  async function save() {
    if (state.isSaving) return;

    const btn = document.getElementById("tpl-save-btn");
    const statusEl = document.getElementById("tpl-status");

    state.isSaving = true;
    btn.disabled = true;
    btn.textContent = "⏳ Sauvegarde...";
    statusEl.textContent = "Sauvegarde en cours...";
    statusEl.className = "tpl-status";

    try {
      const token = getToken();
      if (!token) throw new Error("Non authentifié");

      const payload = {
        space_slug: state.objectConfig.spaceSlug,
        zone_slug: state.objectConfig.zone || state.objectConfig.zoneSlug,
        object_name: state.objectConfig.id,
        template_type: state.templateType,
        template_config: JSON.stringify(state.templateData),
        shader_name: state.objectConfig.shader,
        format: state.objectConfig.format,
        auth_token: token,
      };

      const response = await fetch(`${CONFIG.apiBase}/popups/save.php`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || "Erreur serveur");
      }

      state.hasChanges = false;
      statusEl.textContent = "✅ Sauvegardé !";
      statusEl.className = "tpl-status success";
      btn.textContent = "✨ Sauvegardé";

      // Recharger le popup si fonction disponible
      if (window.reloadPopupScript) {
        console.log("🔄 Rechargement popup...");
        window.reloadPopupScript(state.objectConfig.id, state.objectConfig.spaceSlug);
      }

      // Reset button après délai
      setTimeout(() => {
        if (btn) {
          btn.disabled = false;
          btn.textContent = "💾 Sauvegarder";
        }
      }, 2000);

    } catch (err) {
      console.error("❌ Save error:", err);
      statusEl.textContent = "❌ " + err.message;
      statusEl.className = "tpl-status error";
      btn.disabled = false;
      btn.textContent = "💾 Réessayer";
    }

    state.isSaving = false;
  }

  // ============================================
  // 🛠️ UTILS
  // ============================================
  function escapeHtml(str) {
    if (!str) return "";
    return str
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  // ============================================
  // 🌍 API PUBLIQUE
  // ============================================
  window.atlantisTemplateEditor = {
    open,
    close,
    isOpen: () => state.isOpen,
    getState: () => ({ ...state }),
  };

  // ============================================
  // 🧪 COMMANDES CONSOLE
  // ============================================
  function openEditorForObject(objectId) {
    const PLV_CONFIG = window.ATLANTIS_PLV_CONFIG;
    const spaceSlug = window.ATLANTIS_SPACE || "default";

    if (!PLV_CONFIG || !PLV_CONFIG.objects) {
      console.error("❌ plv-config.js non chargé!");
      return false;
    }

    const objConfig = PLV_CONFIG.objects[objectId];
    if (!objConfig) {
      console.error(`❌ Objet "${objectId}" non trouvé`);
      console.log("📋 Objets disponibles:", Object.keys(PLV_CONFIG.objects).join(", "));
      return false;
    }

    // Vérifier permissions
    const access = checkZoneAccess(objConfig.zone);
    console.log(`\n🔍 Vérification accès pour ${objectId}:`);
    console.log(`   Zone: ${objConfig.zone}`);
    console.log(`   Résultat: ${access.reason}`);

    if (!access.allowed) {
      console.warn(`\n⛔ ACCÈS REFUSÉ: ${access.reason}`);
      return false;
    }

    // Ouvrir l'éditeur
    open({
      id: objectId,
      title: objConfig.title || objectId,
      shader: objConfig.shader,
      file: objConfig.file,
      zone: objConfig.zone,
      format: objConfig.format,
      spaceSlug: spaceSlug,
    });

    return true;
  }

  // Commandes individuelles
  window.c1_openeditor = () => openEditorForObject("c1_obj");
  window.c2_openeditor = () => openEditorForObject("c2_obj");
  window.p1_openeditor = () => openEditorForObject("p1_obj");
  window.l1_openeditor = () => openEditorForObject("l1_obj");
  window.l2_openeditor = () => openEditorForObject("l2_obj");

  // Commande générique
  window.template_edit = (objectId) => openEditorForObject(objectId);
  window.template_preview = (objectId) => {
    // TODO: Ouvrir directement en mode preview
    openEditorForObject(objectId);
  };

  // ============================================
  // 📢 MESSAGE CONSOLE
  // ============================================
  console.log(`
🎨 Template Editor chargé!

📋 COMMANDES CONSOLE:
   c1_openeditor()     → Éditeur template Carré 1
   p1_openeditor()     → Éditeur template Portrait 1
   l1_openeditor()     → Éditeur template Paysage 1

🔧 GÉNÉRIQUE:
   template_edit("c1_obj")    → Par ID objet
   template_preview("c1_obj") → Preview seul
`);

})();
