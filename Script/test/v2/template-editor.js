/**
 * ============================================
 * 🎨 TEMPLATE EDITOR - POPUP STUDIO DESIGN
 * Atlantis City
 * v2.3 - 2024-12-09 - Super Smooth Updates
 * v2.4 - 2024-12-10 - Ajout template YouTube
 * v2.5 - 2024-12-10 - Menu déroulant + chargement dynamique des templates
 * v2.6 - 2024-12-10 - Raccourcis console dynamiques depuis objects-config.js
 * ============================================
 */

(function () {
  "use strict";

  const CONFIG = {
    apiBase: "https://compagnon.atlantis-city.com/api",
    cssUrl:
      "https://compagnon.atlantis-city.com/Script/test/v2/template-editor.css",
    templatesBaseUrl:
      "https://compagnon.atlantis-city.com/Script/test/v2/templates/",
  };

  // Templates disponibles (chargés dynamiquement)
  let availableTemplates = [];

  let state = {
    isOpen: false,
    objectConfig: null,
    templateType: "contact",
    templateData: {},
    hasChanges: false,
    isLoading: false,
    isSaving: false,
    templatesLoaded: false,
    dropdownOpen: false,
  };

  // Flag pour éviter double binding
  let eventsInitialized = false;

  // ============================================
  // 📦 CHARGEMENT RESSOURCES
  // ============================================
  function loadCSS() {
    return new Promise((resolve) => {
      // Toujours injecter les animations
      if (!document.getElementById("tpl-custom-animations")) {
        const animStyle = document.createElement("style");
        animStyle.id = "tpl-custom-animations";
        animStyle.textContent = `
          @keyframes tpl-flash{0%{box-shadow:0 0 0 0 rgba(99,102,241,0.8)}50%{box-shadow:0 0 20px 5px rgba(99,102,241,0.5)}100%{box-shadow:0 0 0 0 transparent}}
          @keyframes tpl-dropdown-in{from{opacity:0;transform:translateY(-8px)}to{opacity:1;transform:translateY(0)}}
          @keyframes tpl-dropdown-out{from{opacity:1;transform:translateY(0)}to{opacity:0;transform:translateY(-8px)}}
        `;
        document.head.appendChild(animStyle);
      }

      if (document.getElementById("tpl-editor-styles")) {
        resolve();
        return;
      }
      const link = document.createElement("link");
      link.id = "tpl-editor-styles";
      link.rel = "stylesheet";
      link.href = CONFIG.cssUrl + "?v=" + Date.now();
      link.onload = () => {
        console.log("✅ CSS chargé");
        resolve();
      };
      link.onerror = () => {
        injectFallbackStyles();
        resolve();
      };
      document.head.appendChild(link);
    });
  }

  function loadFontAwesome() {
    if (document.getElementById("fa-icons")) return;
    const link = document.createElement("link");
    link.id = "fa-icons";
    link.rel = "stylesheet";
    link.href =
      "https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css";
    document.head.appendChild(link);
  }

  function injectFallbackStyles() {
    if (document.getElementById("tpl-fallback-styles")) return;
    const style = document.createElement("style");
    style.id = "tpl-fallback-styles";
    style.textContent = `
      .tpl-editor-overlay{position:fixed;inset:0;background:#020617;z-index:99999;display:flex;font-family:system-ui}
      .tpl-editor-overlay.active{opacity:1}
      .tpl-editor-modal{display:flex;width:100%;height:100%}
      .tpl-editor-left{width:420px;display:flex;flex-direction:column;background:#0f172a;border-right:1px solid #1e293b}
      .tpl-editor-header{padding:20px;border-bottom:1px solid #1e293b;display:flex;justify-content:space-between}
      .tpl-editor-content{flex:1;overflow-y:auto;padding:20px}
      .tpl-editor-right{flex:1;background:#050505;display:flex;align-items:center;justify-content:center}
      .tpl-glass-panel{background:rgba(15,23,42,0.6);border:1px solid rgba(255,255,255,0.05);border-radius:16px;padding:20px;margin-bottom:20px}
      .tpl-input{width:100%;padding:12px;background:rgba(2,6,23,0.8);border:1px solid #1e293b;border-radius:10px;color:#e2e8f0;font-size:13px;box-sizing:border-box}
      .tpl-input:focus{outline:none;border-color:#6366f1}
      .tpl-range{width:100%}
      .tpl-btn{padding:10px 20px;border-radius:10px;font-size:13px;font-weight:600;border:none;cursor:pointer}
      .tpl-btn-primary{background:#6366f1;color:white}
      .tpl-btn-secondary{background:#1e293b;color:#e2e8f0}
    `;
    document.head.appendChild(style);
  }

  // ============================================
  // 📋 CHARGEMENT DYNAMIQUE DES TEMPLATES
  // ============================================
  async function loadTemplatesList() {
    try {
      const res = await fetch(`${CONFIG.apiBase}/popups/list.php`);
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.templates) {
          availableTemplates = data.templates;
          console.log(
            "✅ Templates disponibles:",
            availableTemplates.map((t) => t.id)
          );
          return true;
        }
      }
    } catch (e) {
      console.warn("⚠️ Impossible de charger la liste des templates:", e);
    }

    // Fallback : liste statique
    availableTemplates = [
      {
        id: "contact",
        name: "Fiche Contact",
        icon: "📇",
        description: "Carte avec liens sociaux",
        file: "contact.tpl.js",
      },
      {
        id: "synopsis",
        name: "Synopsis",
        icon: "📜",
        description: "Texte descriptif",
        file: "synopsis.tpl.js",
      },
      {
        id: "iframe",
        name: "Iframe",
        icon: "🌐",
        description: "Site externe",
        file: "iframe.tpl.js",
      },
      {
        id: "youtube",
        name: "Vidéo YouTube",
        icon: "🎬",
        description: "Lecteur vidéo",
        file: "youtube.tpl.js",
      },
    ];
    return false;
  }

  async function loadTemplates() {
    if (state.templatesLoaded) return;

    // D'abord charger la liste
    await loadTemplatesList();

    window.ATLANTIS_TEMPLATES = window.ATLANTIS_TEMPLATES || {};

    // Charger chaque template
    for (const tpl of availableTemplates) {
      try {
        await loadScript(CONFIG.templatesBaseUrl + tpl.file);
        console.log(`✅ ${tpl.file} chargé`);
      } catch (e) {
        console.warn(`⚠️ ${tpl.file} non chargé:`, e);
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
      // Éviter les doublons
      const existing = document.querySelector(
        `script[src^="${url.split("?")[0]}"]`
      );
      if (existing) {
        resolve();
        return;
      }

      const s = document.createElement("script");
      s.src = url + "?v=" + Date.now();
      s.onload = resolve;
      s.onerror = reject;
      document.head.appendChild(s);
    });
  }

  // ============================================
  // 🔐 AUTH
  // ============================================
  function getUser() {
    if (window.atlantisAuth?.getUser) return window.atlantisAuth.getUser();
    try {
      return JSON.parse(localStorage.getItem("atlantis_auth_user"));
    } catch (e) {
      return null;
    }
  }

  function getToken() {
    if (window.atlantisAuth?.getToken) {
      const t = window.atlantisAuth.getToken();
      if (t) return t;
    }
    return (
      localStorage.getItem("atlantis_auth_token") ||
      localStorage.getItem("atlantis_token") ||
      null
    );
  }

  function checkZoneAccess(zoneSlug) {
    if (window.atlantisPermissions?.checkZoneAccess)
      return window.atlantisPermissions.checkZoneAccess(zoneSlug);
    const user = getUser();
    if (!user) return { allowed: false, reason: "Non connecté" };
    if (user.global_role === "super_admin")
      return { allowed: true, reason: "Super Admin" };
    const spaceSlug = window.ATLANTIS_SPACE || "default";
    const roles = user.space_roles || [];
    if (
      roles.some((r) => r.space_slug === spaceSlug && r.role === "space_admin")
    )
      return { allowed: true, reason: "Space Admin" };
    if (
      roles.some((r) => r.space_slug === spaceSlug && r.zone_slug === zoneSlug)
    )
      return { allowed: true, reason: "Zone Admin" };
    return { allowed: false, reason: "Pas d'accès" };
  }

  // ============================================
  // 🛠️ HELPERS
  // ============================================
  const helpers = {
    escapeHtml: (str) => {
      if (!str) return "";
      return String(str)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");
    },
  };

  // ============================================
  // 🚀 OPEN / CLOSE
  // ============================================
  async function open(objectConfig) {
    loadFontAwesome();
    await loadCSS();
    await loadTemplates();

    const spaceSlug =
      objectConfig.spaceSlug || window.ATLANTIS_SPACE || "default";

    state = {
      isOpen: true,
      objectConfig: { ...objectConfig, spaceSlug },
      templateType: "contact",
      templateData: getDefaultData("contact"),
      hasChanges: false,
      isLoading: true,
      isSaving: false,
      templatesLoaded: state.templatesLoaded,
      dropdownOpen: false,
    };

    render();
    await loadExisting();
    console.log("🎨 Editor ouvert:", objectConfig);
  }

  function close() {
    if (
      state.hasChanges &&
      !confirm("Modifications non sauvegardées. Fermer ?")
    )
      return;
    const overlay = document.querySelector(".tpl-editor-overlay");
    if (overlay) {
      overlay.classList.remove("active");
      setTimeout(() => overlay.remove(), 300);
    }
    state.isOpen = false;
    eventsInitialized = false;
  }

  function getDefaultData(type) {
    const tpl = window.ATLANTIS_TEMPLATES?.[type];
    return tpl?.getDefaultData ? tpl.getDefaultData() : { title: "Nouveau" };
  }

  function getCurrentTemplate() {
    return (
      availableTemplates.find((t) => t.id === state.templateType) || {
        id: state.templateType,
        name: state.templateType,
        icon: "📄",
        description: "",
      }
    );
  }

  // ============================================
  // 📡 LOAD EXISTING
  // ============================================
  async function loadExisting() {
    try {
      const { objectConfig } = state;
      const url = `${CONFIG.apiBase}/popups/get.php?space_slug=${objectConfig.spaceSlug}&object_name=${objectConfig.id}`;
      console.log("📥 Loading from:", url);

      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        console.log("📥 API response:", data);

        if (data.success && data.exists && data.template) {
          state.templateType = data.template.template_type || "contact";
          try {
            state.templateData = JSON.parse(
              data.template.template_config || "{}"
            );
            console.log("📥 Loaded templateData:", state.templateData);
          } catch (e) {
            console.error("❌ Parse error:", e);
            state.templateData = getDefaultData(state.templateType);
          }
        }
      }
    } catch (e) {
      console.log("ℹ️ Nouveau template ou erreur:", e);
    }
    state.isLoading = false;
    render();
  }

  // ============================================
  // 🎨 RENDER
  // ============================================
  function render() {
    document
      .querySelectorAll(".tpl-editor-overlay")
      .forEach((el) => el.remove());
    eventsInitialized = false;

    const { templateType, isLoading, dropdownOpen } = state;
    const currentTpl = getCurrentTemplate();

    // Générer le HTML du dropdown
    const dropdownHTML = renderDropdown(currentTpl, dropdownOpen);

    const html = `
      <div class="tpl-editor-overlay">
        <div class="tpl-editor-modal">
          <div class="tpl-editor-left">
            <div class="tpl-editor-header">
              <div class="tpl-editor-header-left">
                <h1>Popup Studio</h1>
                <p>Éditeur de template</p>
              </div>
              <button class="tpl-editor-close" id="tpl-close-btn">✕</button>
            </div>
            
            <div class="tpl-editor-content" id="tpl-editor-content">
              ${dropdownHTML}
              <div id="tpl-form-content">
                ${
                  isLoading
                    ? '<div style="text-align:center;padding:40px;color:#64748b;">⏳ Chargement...</div>'
                    : renderForm()
                }
              </div>
            </div>
            
            <div class="tpl-editor-footer">
              <div class="tpl-status ${
                state.hasChanges ? "warning" : ""
              }" id="tpl-status">
                ${state.hasChanges ? "⚠️ Non sauvegardé" : "✅ Prêt"}
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
          
          <div class="tpl-editor-right">
            <div class="tpl-preview-grid"></div>
            <div class="tpl-preview-vignette"></div>
            <div class="tpl-preview-stage" id="tpl-preview-stage">
              ${isLoading ? "" : renderPreview()}
            </div>
            <div class="tpl-preview-badge">Live Preview</div>
          </div>
        </div>
      </div>
    `;

    document.body.insertAdjacentHTML("beforeend", html);

    requestAnimationFrame(() => {
      document.querySelector(".tpl-editor-overlay")?.classList.add("active");
      initEvents();
    });
  }

  // ============================================
  // 🎯 DROPDOWN TEMPLATE SELECTOR
  // ============================================
  function renderDropdown(currentTpl, isOpen) {
    return `
      <div class="tpl-dropdown-container" style="
        position: relative;
        margin-bottom: 20px;
      ">
        <!-- Bouton principal -->
        <button id="tpl-dropdown-trigger" style="
          width: 100%;
          padding: 14px 16px;
          background: linear-gradient(135deg, rgba(99,102,241,0.15) 0%, rgba(139,92,246,0.1) 100%);
          border: 1px solid rgba(99,102,241,0.3);
          border-radius: 12px;
          color: #e2e8f0;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: space-between;
          transition: all 0.2s ease;
          font-family: inherit;
        " onmouseover="this.style.borderColor='rgba(99,102,241,0.5)';this.style.background='linear-gradient(135deg, rgba(99,102,241,0.2) 0%, rgba(139,92,246,0.15) 100%)'"
           onmouseout="this.style.borderColor='rgba(99,102,241,0.3)';this.style.background='linear-gradient(135deg, rgba(99,102,241,0.15) 0%, rgba(139,92,246,0.1) 100%)'">
          <div style="display:flex;align-items:center;gap:12px;">
            <span style="
              font-size: 20px;
              width: 36px;
              height: 36px;
              background: rgba(99,102,241,0.2);
              border-radius: 10px;
              display: flex;
              align-items: center;
              justify-content: center;
            ">${currentTpl.icon}</span>
            <div style="text-align:left;">
              <div style="font-weight:600;color:#f1f5f9;">${
                currentTpl.name
              }</div>
              <div style="font-size:11px;color:#64748b;margin-top:2px;">${
                currentTpl.description || "Template sélectionné"
              }</div>
            </div>
          </div>
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" style="
            transition: transform 0.2s ease;
            transform: rotate(${isOpen ? "180deg" : "0deg"});
          ">
            <path d="M5 7.5L10 12.5L15 7.5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </button>
        
        <!-- Menu déroulant -->
        <div id="tpl-dropdown-menu" style="
          position: absolute;
          top: calc(100% + 8px);
          left: 0;
          right: 0;
          background: #1e293b;
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 12px;
          overflow: hidden;
          z-index: 100;
          box-shadow: 0 10px 40px rgba(0,0,0,0.5);
          display: ${isOpen ? "block" : "none"};
          animation: ${isOpen ? "tpl-dropdown-in 0.2s ease" : "none"};
        ">
          <div style="
            padding: 8px;
            max-height: 300px;
            overflow-y: auto;
          ">
            ${availableTemplates
              .map(
                (tpl) => `
              <button class="tpl-dropdown-item" data-template-id="${
                tpl.id
              }" style="
                width: 100%;
                padding: 12px 14px;
                background: ${
                  tpl.id === state.templateType
                    ? "rgba(99,102,241,0.2)"
                    : "transparent"
                };
                border: none;
                border-radius: 8px;
                color: #e2e8f0;
                font-size: 13px;
                cursor: pointer;
                display: flex;
                align-items: center;
                gap: 12px;
                transition: all 0.15s ease;
                margin-bottom: 4px;
                font-family: inherit;
                text-align: left;
              " onmouseover="if('${tpl.id}'!=='${
                  state.templateType
                }')this.style.background='rgba(255,255,255,0.05)'"
                 onmouseout="if('${tpl.id}'!=='${
                  state.templateType
                }')this.style.background='transparent'">
                <span style="
                  font-size: 18px;
                  width: 32px;
                  height: 32px;
                  background: ${
                    tpl.id === state.templateType
                      ? "rgba(99,102,241,0.3)"
                      : "rgba(255,255,255,0.05)"
                  };
                  border-radius: 8px;
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  flex-shrink: 0;
                ">${tpl.icon}</span>
                <div style="flex:1;min-width:0;">
                  <div style="font-weight:500;color:${
                    tpl.id === state.templateType ? "#a5b4fc" : "#f1f5f9"
                  };">${tpl.name}</div>
                  <div style="font-size:11px;color:#64748b;margin-top:1px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${
                    tpl.description || ""
                  }</div>
                </div>
                ${
                  tpl.id === state.templateType
                    ? `
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style="flex-shrink:0;">
                    <path d="M13.5 4.5L6 12L2.5 8.5" stroke="#818cf8" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                  </svg>
                `
                    : ""
                }
              </button>
            `
              )
              .join("")}
          </div>
          
          <!-- Footer avec compteur -->
          <div style="
            padding: 10px 14px;
            background: rgba(0,0,0,0.2);
            border-top: 1px solid rgba(255,255,255,0.05);
            font-size: 11px;
            color: #64748b;
            display: flex;
            align-items: center;
            gap: 6px;
          ">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M7 1.75V12.25M1.75 7H12.25" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
            </svg>
            ${availableTemplates.length} template${
      availableTemplates.length > 1 ? "s" : ""
    } disponible${availableTemplates.length > 1 ? "s" : ""}
          </div>
        </div>
      </div>
    `;
  }

  function toggleDropdown() {
    state.dropdownOpen = !state.dropdownOpen;
    const menu = document.getElementById("tpl-dropdown-menu");
    const trigger = document.getElementById("tpl-dropdown-trigger");

    if (menu && trigger) {
      menu.style.display = state.dropdownOpen ? "block" : "none";
      menu.style.animation = state.dropdownOpen
        ? "tpl-dropdown-in 0.2s ease"
        : "none";
      const arrow = trigger.querySelector("svg");
      if (arrow) {
        arrow.style.transform = state.dropdownOpen
          ? "rotate(180deg)"
          : "rotate(0deg)";
      }
    }
  }

  function closeDropdown() {
    if (state.dropdownOpen) {
      state.dropdownOpen = false;
      const menu = document.getElementById("tpl-dropdown-menu");
      const trigger = document.getElementById("tpl-dropdown-trigger");
      if (menu) menu.style.display = "none";
      if (trigger) {
        const arrow = trigger.querySelector("svg");
        if (arrow) arrow.style.transform = "rotate(0deg)";
      }
    }
  }

  function renderForm() {
    const tpl = window.ATLANTIS_TEMPLATES?.[state.templateType];
    if (tpl?.renderForm) return tpl.renderForm(state.templateData, helpers);
    return '<div style="color:#64748b;text-align:center;padding:40px;">⚠️ Template non disponible<br><small>Le fichier du template n\'a pas été chargé</small></div>';
  }

  function renderPreview() {
    const tpl = window.ATLANTIS_TEMPLATES?.[state.templateType];
    if (tpl?.renderPreview)
      return tpl.renderPreview(state.templateData, helpers);
    return '<div style="color:#64748b;">Aperçu non disponible</div>';
  }

  function updatePreview() {
    const stage = document.getElementById("tpl-preview-stage");
    if (stage) stage.innerHTML = renderPreview();
  }

  // Met à jour SEULEMENT le formulaire (pas tout le modal)
  function updateFormOnly() {
    const formContent = document.getElementById("tpl-form-content");
    if (formContent) {
      formContent.innerHTML = renderForm();
    }
    updatePreview();
    updateStatus();
  }

  // Met à jour SEULEMENT la liste des contacts (encore plus smooth)
  function updateContactsOnly() {
    const tpl = window.ATLANTIS_TEMPLATES?.[state.templateType];
    const contactsList = document.getElementById("tpl-contacts-list");

    if (contactsList && tpl?.renderContactsList) {
      contactsList.innerHTML = tpl.renderContactsList(
        state.templateData,
        helpers
      );
    } else {
      // Fallback: mettre à jour tout le formulaire
      updateFormOnly();
      return;
    }
    updatePreview();
    updateStatus();
  }

  // ============================================
  // 🔗 EVENT DELEGATION (fonctionne même après re-render)
  // ============================================
  function initEvents() {
    if (eventsInitialized) return;
    eventsInitialized = true;

    const overlay = document.querySelector(".tpl-editor-overlay");
    if (!overlay) return;

    // ========================================
    // EVENT DELEGATION sur tout l'overlay
    // ========================================
    overlay.addEventListener("input", handleAllInputs);
    overlay.addEventListener("change", handleAllInputs);
    overlay.addEventListener("click", handleAllClicks);

    // ESC pour fermer
    document.addEventListener("keydown", handleKeydown);

    console.log("✅ Events initialisés (delegation)");
  }

  function handleAllInputs(e) {
    const target = e.target;

    // ========================================
    // 📝 INPUTS SIMPLES (data-field)
    // ========================================
    if (target.dataset.field) {
      const field = target.dataset.field;

      // Gérer les checkboxes
      if (target.type === "checkbox") {
        state.templateData[field] = target.checked;
      } else {
        state.templateData[field] = target.value;
      }
      state.hasChanges = true;

      console.log(`📝 Field "${field}" =`, state.templateData[field]);

      updateStatus();
      updatePreview();
      return;
    }

    // ========================================
    // 🎚️ SLIDERS (data-slider-key)
    // ========================================
    if (target.dataset.sliderKey) {
      const key = target.dataset.sliderKey;
      const value = parseInt(target.value);

      const display = document.getElementById(`tpl-slider-${key}-value`);
      if (display) display.textContent = value + (key === "hue" ? "°" : "px");

      if (!state.templateData.theme) state.templateData.theme = {};
      state.templateData.theme[key] = value;
      state.hasChanges = true;

      console.log(`🎚️ Slider "${key}" =`, value);

      updateStatus();
      updatePreview();
      return;
    }

    // ========================================
    // 📇 CONTACT FIELDS (data-contact-field)
    // ========================================
    if (target.dataset.contactField) {
      const index = parseInt(target.dataset.index);
      const field = target.dataset.contactField;

      if (!state.templateData.contacts?.[index]) return;

      const contact = state.templateData.contacts[index];
      contact[field] = target.value;

      console.log(`📇 Contact[${index}].${field} =`, target.value);

      // Smart links
      if (field === "type" || field === "value") {
        if (contact.type === "phone") {
          contact.href = `tel:${(contact.value || "").replace(/\s+/g, "")}`;
        } else if (contact.type === "email") {
          contact.href = `mailto:${(contact.value || "").trim()}`;
        }
      }

      // Re-render si changement de type
      if (field === "type") {
        const labels = {
          phone: "Téléphone",
          email: "Email",
          youtube: "YouTube",
          facebook: "Facebook",
          instagram: "Instagram",
          linkedin: "LinkedIn",
          tiktok: "TikTok",
          twitter: "Twitter/X",
          website: "Site web",
        };
        contact.label = labels[contact.type] || contact.type;
        state.hasChanges = true;

        // Mettre à jour SEULEMENT la liste des contacts (smooth)
        updateContactsOnly();
        return;
      }

      state.hasChanges = true;
      updateStatus();
      updatePreview();
      return;
    }
  }

  function handleAllClicks(e) {
    const target = e.target;
    const btn = target.closest("button") || target;

    // Dropdown trigger
    if (
      btn.id === "tpl-dropdown-trigger" ||
      btn.closest("#tpl-dropdown-trigger")
    ) {
      e.stopPropagation();
      toggleDropdown();
      return;
    }

    // Dropdown item
    if (
      btn.classList.contains("tpl-dropdown-item") ||
      btn.closest(".tpl-dropdown-item")
    ) {
      const item = btn.closest(".tpl-dropdown-item") || btn;
      const newType = item.dataset.templateId;
      if (newType && newType !== state.templateType) {
        state.templateType = newType;
        state.templateData = getDefaultData(newType);
        state.hasChanges = true;
        closeDropdown();
        render();
      } else {
        closeDropdown();
      }
      return;
    }

    // Fermer dropdown si clic ailleurs
    if (
      state.dropdownOpen &&
      !target.closest("#tpl-dropdown-menu") &&
      !target.closest("#tpl-dropdown-trigger")
    ) {
      closeDropdown();
    }

    // Close buttons
    if (btn.id === "tpl-close-btn" || btn.id === "tpl-cancel-btn") {
      close();
      return;
    }

    // Save button
    if (btn.id === "tpl-save-btn") {
      save();
      return;
    }

    // Add contact
    if (btn.id === "tpl-add-contact" || btn.closest("#tpl-add-contact")) {
      addContact();
      return;
    }

    // Remove contact
    if (
      btn.dataset.removeIndex !== undefined ||
      btn.closest("[data-remove-index]")
    ) {
      const removeBtn = btn.closest("[data-remove-index]") || btn;
      const index = parseInt(removeBtn.dataset.removeIndex);
      if (state.templateData.contacts) {
        state.templateData.contacts.splice(index, 1);
        state.hasChanges = true;

        // Mettre à jour SEULEMENT la liste des contacts (smooth)
        updateContactsOnly();
      }
      return;
    }

    // Click outside modal
    if (target.classList.contains("tpl-editor-overlay")) {
      close();
      return;
    }
  }

  function handleKeydown(e) {
    if (e.key === "Escape") {
      if (state.dropdownOpen) {
        closeDropdown();
      } else if (state.isOpen) {
        close();
      }
    }
  }

  function addContact() {
    if (!state.templateData.contacts) state.templateData.contacts = [];

    // Ajouter le nouveau contact
    const newIndex = state.templateData.contacts.length;
    state.templateData.contacts.push({
      type: "website",
      label: "Site web",
      value: "",
      href: "",
    });
    state.hasChanges = true;

    // Mettre à jour SEULEMENT la liste des contacts (super smooth)
    updateContactsOnly();

    // Scroller vers le nouveau contact
    requestAnimationFrame(() => {
      const content = document.getElementById("tpl-editor-content");
      if (content) {
        const newCard = content.querySelector(`[data-index="${newIndex}"]`);
        if (newCard) {
          newCard.scrollIntoView({ behavior: "smooth", block: "center" });
          newCard.style.animation = "tpl-flash 0.6s ease";
        }
      }
    });
  }

  function updateStatus() {
    const el = document.getElementById("tpl-status");
    if (el) {
      el.textContent = state.hasChanges ? "⚠️ Non sauvegardé" : "✅ Prêt";
      el.className = "tpl-status" + (state.hasChanges ? " warning" : "");
    }
  }

  // ============================================
  // 💾 SAVE
  // ============================================
  async function save() {
    if (state.isSaving) return;

    const btn = document.getElementById("tpl-save-btn");
    const status = document.getElementById("tpl-status");

    state.isSaving = true;
    if (btn) {
      btn.disabled = true;
      btn.textContent = "⏳ Sauvegarde...";
    }
    if (status) {
      status.textContent = "Sauvegarde...";
      status.className = "tpl-status";
    }

    try {
      const token = getToken();
      if (!token) throw new Error("Non authentifié");

      console.log(
        "💾 Saving templateData:",
        JSON.stringify(state.templateData, null, 2)
      );

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

      console.log("💾 Payload:", payload);

      const res = await fetch(`${CONFIG.apiBase}/popups/save.php`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = await res.json();
      console.log("💾 Save result:", result);

      if (!result.success) throw new Error(result.error || "Erreur serveur");

      state.hasChanges = false;
      if (status) {
        status.textContent = "✅ Sauvegardé !";
        status.className = "tpl-status success";
      }
      if (btn) btn.textContent = "✨ Sauvegardé";

      // Reload popup script
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
      if (status) {
        status.textContent = "❌ " + err.message;
        status.className = "tpl-status error";
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
    getTemplates: () => [...availableTemplates],
    reloadTemplates: async () => {
      state.templatesLoaded = false;
      await loadTemplates();
      return availableTemplates;
    },
    debug: () => console.log("State:", JSON.stringify(state, null, 2)),
  };

  // ============================================
  // 🧪 COMMANDES CONSOLE
  // ============================================
  function openFor(objectId) {
    const cfg = window.ATLANTIS_OBJECTS_CONFIG;
    const space = window.ATLANTIS_SPACE || "default";

    if (!cfg) {
      console.error("❌ objects-config.js non chargé!");
      return false;
    }

    const obj = cfg[objectId];
    if (!obj) {
      console.error(`❌ Objet "${objectId}" non trouvé dans objects-config.js`);
      console.log("📋 Objets disponibles:", Object.keys(cfg).join(", "));
      return false;
    }

    const zone = window.getFullZoneSlug
      ? window.getFullZoneSlug(obj.zone)
      : `${space}-${obj.zone}`;
    const access = checkZoneAccess(zone);

    if (!access.allowed) {
      console.warn(`⛔ ${access.reason}`);
      return false;
    }

    open({
      id: objectId,
      title: obj.plv?.title || objectId,
      shader: obj.plv?.shader,
      zone: obj.zone,
      format: obj.plv?.format,
      spaceSlug: space,
    });
    return true;
  }

  // Commande principale : template_edit("objectId")
  window.template_edit = openFor;

  // Générer dynamiquement les raccourcis depuis objects-config.js
  // Ex: c1_obj → window.c1_openeditor()
  function registerDynamicShortcuts() {
    const cfg = window.ATLANTIS_OBJECTS_CONFIG;
    if (!cfg) return;

    Object.keys(cfg).forEach((objectId) => {
      const obj = cfg[objectId];
      // Seulement si l'objet a le bouton "edit" dans adminButtons
      if (obj.adminButtons?.includes("edit")) {
        const shortcutName = `${objectId.replace("_obj", "")}_openeditor`;
        window[shortcutName] = () => openFor(objectId);
      }
    });

    console.log("🔗 Raccourcis éditeur enregistrés depuis objects-config.js");
  }

  // Enregistrer les raccourcis quand objects-config est prêt
  if (window.ATLANTIS_OBJECTS_CONFIG) {
    registerDynamicShortcuts();
  } else {
    // Attendre que objects-config soit chargé
    const checkConfig = setInterval(() => {
      if (window.ATLANTIS_OBJECTS_CONFIG) {
        clearInterval(checkConfig);
        registerDynamicShortcuts();
      }
    }, 100);
    // Timeout après 5s
    setTimeout(() => clearInterval(checkConfig), 5000);
  }

  console.log(
    "🎨 Popup Studio Editor v2.6 chargé! (Dynamic Templates + Dynamic Shortcuts)"
  );
})();
