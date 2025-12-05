/**
 * ============================================
 * 🎨 TEMPLATE EDITOR - ATLANTIS CITY
 * Module d'édition de templates popup
 *
 * Fichiers requis:
 * - template-editor.css
 * - templates/contact.tpl.js
 * - templates/synopsis.tpl.js
 * - templates/iframe.tpl.js
 * - templates/custom.tpl.js
 *
 * 🧪 COMMANDES CONSOLE:
 * - c1_openeditor()  → Éditeur template Carré 1
 * - p1_openeditor()  → Éditeur template Portrait 1
 * - l1_openeditor()  → Éditeur template Paysage 1
 * - template_edit("c1_obj") → Par ID objet
 * ============================================
 */

(function () {
  "use strict";

  // ============================================
  // ⚙️ CONFIGURATION
  // ============================================
  const CONFIG = {
    apiBase: "https://compagnon.atlantis-city.com/api",
    cssUrl:
      "https://compagnon.atlantis-city.com/Script/test/template-editor.css",
    templatesBaseUrl:
      "https://compagnon.atlantis-city.com/Script/test/templates/",
  };

  // Types de templates disponibles
  const TEMPLATE_TYPES = {
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
    custom: {
      name: "HTML Personnalisé",
      icon: "🛠️",
      description: "Code HTML/CSS libre",
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
    activeTab: "edit",
    templatesLoaded: false,
  };

  // ============================================
  // 📦 CHARGEMENT CSS EXTERNE
  // ============================================
  function loadCSS() {
    return new Promise((resolve) => {
      if (document.getElementById("tpl-editor-styles")) {
        resolve();
        return;
      }

      const link = document.createElement("link");
      link.id = "tpl-editor-styles";
      link.rel = "stylesheet";
      link.href = CONFIG.cssUrl + "?v=" + Date.now();
      link.onload = () => {
        console.log("✅ Template Editor CSS chargé");
        resolve();
      };
      link.onerror = () => {
        console.warn(
          "⚠️ CSS externe non trouvé, utilisation des styles inline"
        );
        injectFallbackStyles();
        resolve();
      };
      document.head.appendChild(link);
    });
  }

  // Styles de secours si le CSS externe ne charge pas
  function injectFallbackStyles() {
    if (document.getElementById("tpl-editor-styles-fallback")) return;

    const style = document.createElement("style");
    style.id = "tpl-editor-styles-fallback";
    style.textContent = `
      .tpl-editor-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.9); z-index: 99999; display: flex; align-items: center; justify-content: center; opacity: 0; transition: opacity 0.3s; font-family: system-ui, sans-serif; }
      .tpl-editor-overlay.active { opacity: 1; }
      .tpl-editor-modal { background: #1e293b; border-radius: 16px; width: 900px; max-width: 95vw; max-height: 90vh; overflow: hidden; transform: scale(0.95); transition: transform 0.3s; display: flex; flex-direction: column; }
      .tpl-editor-overlay.active .tpl-editor-modal { transform: scale(1); }
      .tpl-editor-header { padding: 15px 20px; background: #0f172a; display: flex; justify-content: space-between; align-items: center; }
      .tpl-editor-title { color: #f8fafc; font-size: 16px; font-weight: 600; margin: 0; }
      .tpl-editor-close { background: none; border: none; color: #94a3b8; font-size: 24px; cursor: pointer; }
      .tpl-editor-body { display: grid; grid-template-columns: 250px 1fr; flex: 1; overflow: hidden; }
      .tpl-sidebar { background: #0f172a; padding: 20px; overflow-y: auto; }
      .tpl-sidebar-title { color: #64748b; font-size: 11px; text-transform: uppercase; margin-bottom: 12px; }
      .tpl-type-btn { display: flex; align-items: center; gap: 10px; padding: 12px; background: #1e293b; border: 1px solid #334155; border-radius: 8px; margin-bottom: 8px; cursor: pointer; width: 100%; text-align: left; }
      .tpl-type-btn.active { border-color: #3b82f6; background: rgba(59,130,246,0.15); }
      .tpl-type-icon { font-size: 18px; }
      .tpl-type-name { color: #e2e8f0; font-size: 13px; }
      .tpl-type-desc { color: #64748b; font-size: 11px; }
      .tpl-main { display: flex; flex-direction: column; overflow: hidden; }
      .tpl-tabs { display: flex; background: #0f172a; border-bottom: 1px solid #334155; }
      .tpl-tab { padding: 12px 20px; background: none; border: none; color: #94a3b8; cursor: pointer; border-bottom: 2px solid transparent; }
      .tpl-tab.active { color: #3b82f6; border-bottom-color: #3b82f6; }
      .tpl-content { flex: 1; overflow-y: auto; padding: 20px; }
      .tpl-form-section { margin-bottom: 24px; }
      .tpl-form-section-title { color: #94a3b8; font-size: 12px; text-transform: uppercase; margin-bottom: 12px; }
      .tpl-form-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; }
      .tpl-form-grid.single { grid-template-columns: 1fr; }
      .tpl-field { display: flex; flex-direction: column; gap: 6px; }
      .tpl-field.full { grid-column: 1 / -1; }
      .tpl-label { color: #94a3b8; font-size: 12px; }
      .tpl-input, .tpl-textarea, .tpl-select { padding: 10px 12px; background: #0f172a; border: 1px solid #334155; border-radius: 8px; color: #e2e8f0; font-size: 13px; }
      .tpl-input:focus, .tpl-textarea:focus { outline: none; border-color: #3b82f6; }
      .tpl-textarea { resize: vertical; min-height: 80px; }
      .tpl-contacts-list { display: flex; flex-direction: column; gap: 10px; }
      .tpl-contact-item { display: grid; grid-template-columns: 120px 1fr 1fr auto; gap: 10px; padding: 12px; background: #0f172a; border-radius: 8px; align-items: center; }
      .tpl-contact-remove { background: #ef4444; color: white; border: none; width: 28px; height: 28px; border-radius: 6px; cursor: pointer; }
      .tpl-add-btn { padding: 12px; background: rgba(59,130,246,0.1); border: 1px dashed #3b82f6; border-radius: 8px; color: #3b82f6; cursor: pointer; text-align: center; }
      .tpl-color-field { display: flex; align-items: center; gap: 10px; }
      .tpl-color-preview { width: 36px; height: 36px; border-radius: 8px; border: 2px solid #334155; cursor: pointer; position: relative; }
      .tpl-color-input { position: absolute; inset: 0; opacity: 0; cursor: pointer; }
      .tpl-preview-container { background: #0f172a; border-radius: 12px; padding: 20px; min-height: 300px; display: flex; align-items: center; justify-content: center; }
      .tpl-preview-frame { background: #000; border-radius: 8px; width: 100%; max-width: 400px; overflow: hidden; }
      .tpl-editor-footer { padding: 15px 20px; background: #0f172a; display: flex; justify-content: space-between; align-items: center; }
      .tpl-status { color: #94a3b8; font-size: 13px; }
      .tpl-status.warning { color: #fbbf24; }
      .tpl-status.success { color: #4ade80; }
      .tpl-status.error { color: #ef4444; }
      .tpl-footer-actions { display: flex; gap: 10px; }
      .tpl-btn { padding: 10px 20px; border-radius: 8px; font-size: 13px; font-weight: 600; border: none; cursor: pointer; }
      .tpl-btn-secondary { background: #334155; color: #e2e8f0; }
      .tpl-btn-primary { background: linear-gradient(135deg, #3b82f6, #2563eb); color: white; }
      .tpl-btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }
      .tpl-zone-badge { background: rgba(139,92,246,0.2); color: #a78bfa; padding: 3px 10px; border-radius: 12px; font-size: 11px; }
      .tpl-loading { text-align: center; padding: 40px; color: #94a3b8; }
      @media (max-width: 800px) { .tpl-editor-body { grid-template-columns: 1fr; } .tpl-sidebar { display: none; } }
    `;
    document.head.appendChild(style);
  }

  // ============================================
  // 📦 CHARGEMENT TEMPLATES EXTERNES
  // ============================================
  async function loadTemplates() {
    if (state.templatesLoaded) return;

    const templateFiles = [
      "contact.tpl.js",
      "synopsis.tpl.js",
      "iframe.tpl.js",
      "custom.tpl.js",
    ];

    window.ATLANTIS_TEMPLATES = window.ATLANTIS_TEMPLATES || {};

    for (const file of templateFiles) {
      try {
        await loadScript(CONFIG.templatesBaseUrl + file);
      } catch (e) {
        console.warn(`⚠️ Template ${file} non chargé:`, e);
      }
    }

    state.templatesLoaded = true;
    console.log(
      "✅ Templates chargés:",
      Object.keys(window.ATLANTIS_TEMPLATES)
    );
  }

  function loadScript(url) {
    return new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = url + "?v=" + Date.now();
      script.onload = resolve;
      script.onerror = reject;
      document.head.appendChild(script);
    });
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
      try {
        return JSON.parse(stored);
      } catch (e) {}
    }
    return null;
  }

  /**
   * 🔑 Récupère le token d'authentification
   * Essaie plusieurs sources dans l'ordre
   */
  function getToken() {
    let token = null;

    // Source 1: atlantisAuth (prioritaire)
    try {
      if (
        window.atlantisAuth &&
        typeof window.atlantisAuth.getToken === "function"
      ) {
        token = window.atlantisAuth.getToken();
        if (token) {
          console.log(
            "🔑 Token via atlantisAuth:",
            token.substring(0, 20) + "..."
          );
          return token;
        }
      }
    } catch (e) {
      console.warn("⚠️ Erreur atlantisAuth:", e);
    }

    // Source 2: localStorage atlantis_auth_token
    token = localStorage.getItem("atlantis_auth_token");
    if (token) {
      console.log(
        "🔑 Token via localStorage atlantis_auth_token:",
        token.substring(0, 20) + "..."
      );
      return token;
    }

    // Source 3: localStorage atlantis_token (ancien nom)
    token = localStorage.getItem("atlantis_token");
    if (token) {
      console.log(
        "🔑 Token via localStorage atlantis_token:",
        token.substring(0, 20) + "..."
      );
      return token;
    }

    // Source 4: cookie
    try {
      const cookieMatch = document.cookie.match(/atlantis_token=([^;]+)/);
      if (cookieMatch) {
        token = cookieMatch[1];
        console.log("🔑 Token via cookie:", token.substring(0, 20) + "...");
        return token;
      }
    } catch (e) {}

    console.error("❌ Aucun token trouvé!");
    return null;
  }

  function checkZoneAccess(zoneSlug) {
    // Utiliser plv-manager si disponible
    if (window.atlantisPLV && window.atlantisPLV.checkZoneAccess) {
      return window.atlantisPLV.checkZoneAccess(zoneSlug);
    }

    // Fallback
    const user = getUser();
    const spaceSlug = window.ATLANTIS_SPACE || "default";

    if (!user) {
      return {
        allowed: false,
        reason: "Vous devez être connecté",
        code: "NOT_LOGGED_IN",
      };
    }
    if (user.global_role === "super_admin") {
      return {
        allowed: true,
        reason: "✅ Accès Super Admin",
        code: "SUPER_ADMIN",
      };
    }

    const spaceRoles = user.space_roles || [];
    const isSpaceAdmin = spaceRoles.some(
      (r) => r.space_slug === spaceSlug && r.role === "space_admin"
    );
    if (isSpaceAdmin) {
      return {
        allowed: true,
        reason: "✅ Accès Space Admin",
        code: "SPACE_ADMIN",
      };
    }

    const isZoneAdmin = spaceRoles.some(
      (r) =>
        r.space_slug === spaceSlug &&
        r.zone_slug === zoneSlug &&
        (r.role === "zone_admin" || r.role === "space_admin")
    );
    if (isZoneAdmin) {
      return {
        allowed: true,
        reason: "✅ Accès Zone Admin",
        code: "ZONE_ADMIN",
      };
    }

    return {
      allowed: false,
      reason: `❌ Pas d'accès à "${zoneSlug}"`,
      code: "NO_ACCESS",
    };
  }

  // ============================================
  // 🛠️ HELPERS
  // ============================================
  const helpers = {
    escapeHtml: function (str) {
      if (!str) return "";
      return String(str)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");
    },

    renderColorField: function (key, label, value) {
      return `
        <div class="tpl-field">
          <label class="tpl-label">${label}</label>
          <div class="tpl-color-field">
            <div class="tpl-color-preview" style="background: ${value};">
              <input type="color" class="tpl-color-input" data-color-field="${key}" value="${value}">
            </div>
            <input type="text" class="tpl-input tpl-color-hex" data-field="colors.${key}" value="${value}" placeholder="#000000" style="flex: 1; font-family: monospace;">
          </div>
        </div>
      `;
    },
  };

  // ============================================
  // 🚀 OPEN / CLOSE
  // ============================================
  async function open(objectConfig) {
    // Charger CSS et templates
    await loadCSS();
    await loadTemplates();

    const spaceSlug =
      objectConfig.spaceSlug || window.ATLANTIS_SPACE || "default";

    state = {
      isOpen: true,
      objectConfig: { ...objectConfig, spaceSlug },
      templateType: "contact",
      templateData: getDefaultTemplateData("contact"),
      hasChanges: false,
      isLoading: true,
      isSaving: false,
      activeTab: "edit",
      templatesLoaded: state.templatesLoaded,
    };

    render();
    await loadExistingTemplate();
    console.log("🎨 Template Editor ouvert:", objectConfig);
  }

  function close() {
    if (state.hasChanges) {
      if (
        !confirm(
          "Des modifications non sauvegardées seront perdues. Fermer quand même ?"
        )
      ) {
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
    const template = window.ATLANTIS_TEMPLATES?.[type];
    if (template && template.getDefaultData) {
      return template.getDefaultData();
    }

    // Fallback basique
    return {
      title: "Nouveau template",
      colors: { background: "#1a1a2e", accent: "#3b82f6" },
    };
  }

  // ============================================
  // 📡 LOAD EXISTING TEMPLATE
  // ============================================
  async function loadExistingTemplate() {
    try {
      const { objectConfig } = state;
      const response = await fetch(
        `${CONFIG.apiBase}/popups/get.php?space_slug=${objectConfig.spaceSlug}&object_name=${objectConfig.id}`
      );

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.exists && data.template) {
          state.templateType = data.template.template_type || "contact";
          state.templateData = JSON.parse(
            data.template.template_config || "{}"
          );
          console.log("📥 Template existant chargé:", state.templateType);
        }
      }
    } catch (err) {
      console.log(
        "ℹ️ Pas de template existant, utilisation des valeurs par défaut"
      );
    }

    state.isLoading = false;
    render();
  }

  // ============================================
  // 🎨 RENDER PRINCIPAL
  // ============================================
  function render() {
    document
      .querySelectorAll(".tpl-editor-overlay")
      .forEach((el) => el.remove());

    const { objectConfig, templateType, activeTab, isLoading } = state;

    const html = `
      <div class="tpl-editor-overlay">
        <div class="tpl-editor-modal">
          <!-- HEADER -->
          <div class="tpl-editor-header">
            <h3 class="tpl-editor-title">
              <span>🎨</span> Template Editor : ${
                objectConfig.title || objectConfig.id
              }
              <span class="tpl-zone-badge">📍 ${objectConfig.zone || "-"}</span>
            </h3>
            <button class="tpl-editor-close" id="tpl-close-btn">✕</button>
          </div>

          <!-- BODY -->
          <div class="tpl-editor-body">
            <!-- SIDEBAR -->
            <div class="tpl-sidebar">
              <div class="tpl-sidebar-title">Type de template</div>
              <div class="tpl-type-list">
                ${Object.entries(TEMPLATE_TYPES)
                  .map(
                    ([key, t]) => `
                  <button class="tpl-type-btn ${
                    templateType === key ? "active" : ""
                  }" data-type="${key}">
                    <span class="tpl-type-icon">${t.icon}</span>
                    <div class="tpl-type-info">
                      <div class="tpl-type-name">${t.name}</div>
                      <div class="tpl-type-desc">${t.description}</div>
                    </div>
                  </button>
                `
                  )
                  .join("")}
              </div>
            </div>

            <!-- MAIN -->
            <div class="tpl-main">
              <div class="tpl-tabs">
                <button class="tpl-tab ${
                  activeTab === "edit" ? "active" : ""
                }" data-tab="edit">✏️ Édition</button>
                <button class="tpl-tab ${
                  activeTab === "preview" ? "active" : ""
                }" data-tab="preview">👁️ Aperçu</button>
              </div>
              <div class="tpl-content" id="tpl-content">
                ${
                  isLoading
                    ? '<div class="tpl-loading">⏳ Chargement...</div>'
                    : activeTab === "edit"
                    ? renderEditForm()
                    : renderPreview()
                }
              </div>
            </div>
          </div>

          <!-- FOOTER -->
          <div class="tpl-editor-footer">
            <div class="tpl-status ${
              state.hasChanges ? "warning" : ""
            }" id="tpl-status">
              ${
                isLoading
                  ? "⏳ Chargement..."
                  : state.hasChanges
                  ? "⚠️ Modifications non sauvegardées"
                  : "✅ Prêt"
              }
            </div>
            <div class="tpl-footer-actions">
              <button class="tpl-btn tpl-btn-secondary" id="tpl-cancel-btn">Annuler</button>
              <button class="tpl-btn tpl-btn-primary" id="tpl-save-btn" ${
                state.isSaving ? "disabled" : ""
              }>
                ${state.isSaving ? "⏳ Sauvegarde..." : "💾 Sauvegarder"}
              </button>
            </div>
          </div>
        </div>
      </div>
    `;

    document.body.insertAdjacentHTML("beforeend", html);

    requestAnimationFrame(() => {
      document.querySelector(".tpl-editor-overlay")?.classList.add("active");
    });

    bindEvents();
  }

  // ============================================
  // 📝 RENDER FORMULAIRE
  // ============================================
  function renderEditForm() {
    const { templateType, templateData } = state;
    const template = window.ATLANTIS_TEMPLATES?.[templateType];

    if (template && template.renderForm) {
      return template.renderForm(templateData, helpers);
    }

    return `<div class="tpl-loading">Template "${templateType}" non disponible</div>`;
  }

  // ============================================
  // 👁️ PREVIEW
  // ============================================
  function renderPreview() {
    const { templateType, templateData } = state;
    const template = window.ATLANTIS_TEMPLATES?.[templateType];

    if (template && template.renderPreview) {
      return `
        <div class="tpl-preview-container">
          <div class="tpl-preview-frame">
            ${template.renderPreview(templateData, helpers)}
          </div>
        </div>
      `;
    }

    return `<div class="tpl-preview-container"><div class="tpl-loading">Aperçu non disponible</div></div>`;
  }

  // ============================================
  // 🔗 BIND EVENTS
  // ============================================
  function bindEvents() {
    const overlay = document.querySelector(".tpl-editor-overlay");
    if (!overlay) return;

    // Close
    document.getElementById("tpl-close-btn")?.addEventListener("click", close);
    document.getElementById("tpl-cancel-btn")?.addEventListener("click", close);

    // Save
    document.getElementById("tpl-save-btn")?.addEventListener("click", save);

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

    // Tabs
    document.querySelectorAll(".tpl-tab").forEach((tab) => {
      tab.addEventListener("click", () => {
        state.activeTab = tab.dataset.tab;
        render();
      });
    });

    // Form inputs
    document
      .querySelectorAll(".tpl-input, .tpl-textarea, .tpl-select")
      .forEach((input) => {
        input.addEventListener("input", handleInputChange);
      });

    // Color pickers
    document.querySelectorAll(".tpl-color-input").forEach((input) => {
      input.addEventListener("input", (e) => {
        const key = e.target.dataset.colorField;
        const value = e.target.value;
        updateNestedField(`colors.${key}`, value);

        const preview = e.target
          .closest(".tpl-color-field")
          ?.querySelector(".tpl-color-preview");
        if (preview) preview.style.background = value;

        const hexInput = e.target
          .closest(".tpl-color-field")
          ?.querySelector(".tpl-color-hex");
        if (hexInput) hexInput.value = value;
      });
    });

    // Add contact
    document
      .getElementById("tpl-add-contact")
      ?.addEventListener("click", addContact);

    // Remove contact
    document.querySelectorAll("[data-remove-index]").forEach((btn) => {
      btn.addEventListener("click", () =>
        removeContact(parseInt(btn.dataset.removeIndex))
      );
    });

    // Contact fields
    document.querySelectorAll("[data-contact-field]").forEach((input) => {
      input.addEventListener("input", (e) => {
        const index = parseInt(e.target.dataset.index);
        const field = e.target.dataset.contactField;
        if (state.templateData.contacts?.[index]) {
          state.templateData.contacts[index][field] = e.target.value;
          state.hasChanges = true;
          updateStatus();
        }
      });
    });

    // Click outside
    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) close();
    });

    // ESC
    const escHandler = (e) => {
      if (e.key === "Escape" && state.isOpen) {
        close();
        document.removeEventListener("keydown", escHandler);
      }
    };
    document.addEventListener("keydown", escHandler);
  }

  // ============================================
  // 📝 FORM HANDLERS
  // ============================================
  function handleInputChange(e) {
    const field = e.target.dataset.field;
    if (!field) return;
    updateNestedField(field, e.target.value);
  }

  function updateNestedField(field, value) {
    const parts = field.split(".");
    let obj = state.templateData;

    for (let i = 0; i < parts.length - 1; i++) {
      const part = parts[i];
      const arrayMatch = part.match(/^(\w+)\[(\d+)\]$/);

      if (arrayMatch) {
        const arrName = arrayMatch[1];
        const arrIndex = parseInt(arrayMatch[2]);
        if (!obj[arrName]) obj[arrName] = [];
        if (!obj[arrName][arrIndex]) obj[arrName][arrIndex] = "";
        obj = obj[arrName];
        continue;
      }

      if (!obj[part]) obj[part] = {};
      obj = obj[part];
    }

    const lastPart = parts[parts.length - 1];
    const lastMatch = lastPart.match(/^(\w+)\[(\d+)\]$/);

    if (lastMatch) {
      const arrName = lastMatch[1];
      const arrIndex = parseInt(lastMatch[2]);
      if (!obj[arrName]) obj[arrName] = [];
      obj[arrName][arrIndex] = value;
    } else {
      obj[lastPart] = value;
    }

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
    const el = document.getElementById("tpl-status");
    if (el) {
      el.textContent = state.hasChanges
        ? "⚠️ Modifications non sauvegardées"
        : "✅ Prêt";
      el.className = "tpl-status" + (state.hasChanges ? " warning" : "");
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
    if (btn) {
      btn.disabled = true;
      btn.textContent = "⏳ Sauvegarde...";
    }
    if (statusEl) {
      statusEl.textContent = "Sauvegarde en cours...";
      statusEl.className = "tpl-status";
    }

    try {
      // Récupérer le token avec debug
      const token = getToken();
      if (!token) {
        throw new Error("Non authentifié - Veuillez vous reconnecter");
      }

      const payload = {
        space_slug: state.objectConfig.spaceSlug,
        zone_slug: state.objectConfig.zone || state.objectConfig.zoneSlug,
        object_name: state.objectConfig.id,
        template_type: state.templateType,
        template_config: JSON.stringify(state.templateData),
        shader_name: state.objectConfig.shader,
        format: state.objectConfig.format,
        auth_token: token, // Workaround OVH - token dans le body
      };

      console.log("📤 Envoi vers API:", CONFIG.apiBase + "/popups/save.php");

      const response = await fetch(`${CONFIG.apiBase}/popups/save.php`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      // Debug réponse
      console.log("📥 Réponse status:", response.status);

      const result = await response.json();
      console.log("📥 Réponse body:", result);

      if (!result.success) {
        throw new Error(result.error || "Erreur serveur");
      }

      state.hasChanges = false;
      if (statusEl) {
        statusEl.textContent = "✅ Sauvegardé !";
        statusEl.className = "tpl-status success";
      }
      if (btn) btn.textContent = "✨ Sauvegardé";

      console.log("✅ Template sauvegardé:", result);

      // Recharger popup si fonction disponible
      if (window.reloadPopupScript) {
        window.reloadPopupScript(
          state.objectConfig.id,
          state.objectConfig.spaceSlug
        );
      }

      setTimeout(() => {
        if (btn) {
          btn.disabled = false;
          btn.textContent = "💾 Sauvegarder";
        }
      }, 2000);
    } catch (err) {
      console.error("❌ Save error:", err);
      if (statusEl) {
        statusEl.textContent = "❌ " + err.message;
        statusEl.className = "tpl-status error";
      }
      if (btn) {
        btn.disabled = false;
        btn.textContent = "💾 Réessayer";
      }
    }

    state.isSaving = false;
  }

  // ============================================
  // 🌍 API PUBLIQUE
  // ============================================
  window.atlantisTemplateEditor = {
    open,
    close,
    isOpen: () => state.isOpen,
    getState: () => ({ ...state }),
    getToken, // Exposer pour debug
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
      console.log(
        "📋 Objets disponibles:",
        Object.keys(PLV_CONFIG.objects).join(", ")
      );
      return false;
    }

    const access = checkZoneAccess(objConfig.zone);
    console.log(`\n🔍 Vérification accès pour ${objectId}:`);
    console.log(`   Zone: ${objConfig.zone}`);
    console.log(`   Résultat: ${access.reason}`);

    if (!access.allowed) {
      console.warn(`\n⛔ ACCÈS REFUSÉ: ${access.reason}`);
      return false;
    }

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

  // Commandes
  window.c1_openeditor = () => openEditorForObject("c1_obj");
  window.c2_openeditor = () => openEditorForObject("c2_obj");
  window.p1_openeditor = () => openEditorForObject("p1_obj");
  window.l1_openeditor = () => openEditorForObject("l1_obj");
  window.l2_openeditor = () => openEditorForObject("l2_obj");
  window.template_edit = (objectId) => openEditorForObject(objectId);

  // ============================================
  // 📢 MESSAGE CONSOLE
  // ============================================
  console.log(`
🎨 Template Editor chargé!

📋 COMMANDES:
   c1_openeditor()     → Éditeur Carré 1
   p1_openeditor()     → Éditeur Portrait 1
   l1_openeditor()     → Éditeur Paysage 1
   template_edit("id") → Par ID objet
`);
})();
