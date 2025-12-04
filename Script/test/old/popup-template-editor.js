/**
 * ============================================
 * 🎨 POPUP TEMPLATE EDITOR - Atlantis City
 * ============================================
 *
 * Éditeur de templates popup avec génération JS/CSS natif
 * Interface 3 colonnes : Templates | Paramètres | Preview
 *
 * v2.0 - Génération fichiers natifs
 */

(function () {
  "use strict";

  // === CONFIGURATION ===
  const CONFIG = {
    API_BASE: "https://compagnon.atlantis-city.com/api",
    SPACE_SLUG: window.ATLANTIS_SPACE || "idea",
  };

  // === STATE ===
  let state = {
    isOpen: false,
    currentTemplate: "contact",
    currentConfig: {},
    objectName: null,
    objectConfig: null,
    previewFormat: "auto",
  };

  // === TEMPLATES FALLBACK ===
  const FALLBACK_TEMPLATES = {
    contact: {
      template_key: "contact",
      name: "Contact",
      description: "Carte de contact avec photo et coordonnées",
      icon: "📇",
      default_config: {
        name: "Nom du contact",
        title: "Fonction",
        avatar: "",
        primaryColor: "#1a1a2e",
        accentColor: "#4a90d9",
        textColor: "#ffffff",
        contacts: [],
      },
    },
    // Autres templates à ajouter plus tard (info, product, etc.)
  };

  let templates = { ...FALLBACK_TEMPLATES };

  // === HELPERS ===
  function getToken() {
    return (
      window.atlantisAuth?.getToken() ||
      localStorage.getItem("atlantis_auth_token") ||
      sessionStorage.getItem("atlantis_auth_token")
    );
  }

  function escapeHtml(text) {
    if (!text) return "";
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
  }

  // === CHARGER TEMPLATES DEPUIS API ===
  async function loadTemplates() {
    try {
      const response = await fetch(`${CONFIG.API_BASE}/popups/templates.php`);
      const result = await response.json();

      if (result.success && result.data?.templates) {
        result.data.templates.forEach((t) => {
          templates[t.template_key] = {
            ...t,
            default_config:
              typeof t.default_config === "string"
                ? JSON.parse(t.default_config)
                : t.default_config,
          };
        });
        console.log("📋 Templates chargés depuis API");
      }
    } catch (e) {
      console.warn("⚠️ Templates API indisponible, utilisation fallback");
    }
  }

  // === CRÉER L'ÉDITEUR ===
  function createEditor() {
    const overlay = document.createElement("div");
    overlay.className = "template-editor-overlay";
    overlay.id = "template-editor-overlay";

    overlay.innerHTML = `
            <div class="template-editor-container">
                <!-- Header -->
                <div class="template-editor-header">
                    <div class="template-editor-title">
                        <span class="template-editor-icon">🎨</span>
                        <h2>Éditeur de Popup</h2>
                        <span class="template-editor-object-name" id="editor-object-name"></span>
                    </div>
                    <div class="template-editor-actions">
                        <button class="template-editor-btn secondary" id="editor-cancel-btn">Annuler</button>
                        <button class="template-editor-btn primary" id="editor-save-btn">
                            <span class="btn-text">💾 Sauvegarder</span>
                            <span class="btn-loading" style="display:none;">⏳ Génération...</span>
                        </button>
                    </div>
                </div>

                <!-- Corps 3 colonnes -->
                <div class="template-editor-body">
                    <!-- Colonne 1: Templates -->
                    <div class="template-editor-col template-editor-templates">
                        <h3>📋 Templates</h3>
                        <div class="template-list" id="template-list"></div>
                    </div>

                    <!-- Colonne 2: Paramètres -->
                    <div class="template-editor-col template-editor-params">
                        <h3>⚙️ Paramètres</h3>
                        <div class="params-form" id="params-form"></div>
                    </div>

                    <!-- Colonne 3: Preview -->
                    <div class="template-editor-col template-editor-preview">
                        <div class="preview-header">
                            <h3>👁️ Aperçu</h3>
                            <div class="preview-formats">
                                <button class="preview-format-btn active" data-format="auto">Auto</button>
                                <button class="preview-format-btn" data-format="carre">◼</button>
                                <button class="preview-format-btn" data-format="paysage">▬</button>
                                <button class="preview-format-btn" data-format="portrait">▮</button>
                            </div>
                        </div>
                        <div class="preview-container" id="preview-container">
                            <div class="preview-content" id="preview-content"></div>
                        </div>
                    </div>
                </div>
            </div>
        `;

    document.body.appendChild(overlay);

    // Event listeners
    document
      .getElementById("editor-cancel-btn")
      .addEventListener("click", close);
    document.getElementById("editor-save-btn").addEventListener("click", save);

    // Format buttons
    overlay.querySelectorAll(".preview-format-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        overlay
          .querySelectorAll(".preview-format-btn")
          .forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");
        state.previewFormat = btn.dataset.format;
        updatePreviewSize();
      });
    });

    // Fermer avec Escape
    document.addEventListener("keydown", handleKeydown);

    return overlay;
  }

  function handleKeydown(e) {
    if (e.key === "Escape" && state.isOpen) {
      close();
    }
  }

  // === OUVRIR L'ÉDITEUR ===
  async function open(objectConfig, existingData = null) {
    if (state.isOpen) return;

    state.objectConfig = objectConfig;
    state.objectName = objectConfig.objectName;

    // Charger templates si pas déjà fait
    await loadTemplates();

    // Créer ou récupérer l'overlay
    let overlay = document.getElementById("template-editor-overlay");
    if (!overlay) {
      overlay = createEditor();
    }

    // Afficher le nom de l'objet
    document.getElementById("editor-object-name").textContent =
      state.objectName;

    // Charger données existantes ou défaut
    if (existingData && existingData.template_type) {
      state.currentTemplate = existingData.template_type;
      state.currentConfig = existingData.template_config || {};
    } else {
      state.currentTemplate = "contact";
      state.currentConfig = { ...templates.contact.default_config };
    }

    // Construire l'interface
    renderTemplateList();
    renderParamsForm();
    updatePreview();
    updatePreviewSize();

    // Afficher
    overlay.classList.add("active");
    state.isOpen = true;
    document.body.style.overflow = "hidden";

    console.log("🎨 Template Editor ouvert pour:", state.objectName);
  }

  // === FERMER L'ÉDITEUR ===
  function close() {
    const overlay = document.getElementById("template-editor-overlay");
    if (overlay) {
      overlay.classList.remove("active");
    }
    state.isOpen = false;
    document.body.style.overflow = "";
    document.removeEventListener("keydown", handleKeydown);
  }

  // === RENDER TEMPLATE LIST ===
  function renderTemplateList() {
    const container = document.getElementById("template-list");

    container.innerHTML = Object.values(templates)
      .map(
        (t) => `
            <div class="template-item ${
              t.template_key === state.currentTemplate ? "active" : ""
            }" 
                 data-template="${t.template_key}">
                <span class="template-item-icon">${t.icon || "📄"}</span>
                <div class="template-item-info">
                    <div class="template-item-name">${escapeHtml(t.name)}</div>
                    <div class="template-item-desc">${escapeHtml(
                      t.description || ""
                    )}</div>
                </div>
            </div>
        `
      )
      .join("");

    // Event listeners
    container.querySelectorAll(".template-item").forEach((item) => {
      item.addEventListener("click", () => {
        const templateKey = item.dataset.template;
        selectTemplate(templateKey);
      });
    });
  }

  function selectTemplate(templateKey) {
    if (!templates[templateKey]) return;

    state.currentTemplate = templateKey;
    state.currentConfig = { ...templates[templateKey].default_config };

    // Mettre à jour UI
    document.querySelectorAll(".template-item").forEach((item) => {
      item.classList.toggle("active", item.dataset.template === templateKey);
    });

    renderParamsForm();
    updatePreview();
  }

  // === RENDER PARAMS FORM ===
  function renderParamsForm() {
    const container = document.getElementById("params-form");
    const template = templates[state.currentTemplate];

    if (!template) {
      container.innerHTML = "<p>Template non trouvé</p>";
      return;
    }

    // Formulaire spécifique selon le template
    if (state.currentTemplate === "contact") {
      renderContactForm(container);
    } else {
      container.innerHTML = "<p>Formulaire en cours de développement</p>";
    }
  }

  // === FORMULAIRE CONTACT ===
  function renderContactForm(container) {
    const config = state.currentConfig;

    container.innerHTML = `
            <!-- Infos principales -->
            <div class="param-section">
                <h4>👤 Informations</h4>
                
                <div class="param-group">
                    <label>Nom complet</label>
                    <input type="text" id="param-name" value="${escapeHtml(
                      config.name || ""
                    )}" placeholder="Nom du contact">
                </div>
                
                <div class="param-group">
                    <label>Fonction / Titre</label>
                    <input type="text" id="param-title" value="${escapeHtml(
                      config.title || ""
                    )}" placeholder="Ex: Directeur Commercial">
                </div>
                
                <div class="param-group">
                    <label>Photo (URL)</label>
                    <input type="text" id="param-avatar" value="${escapeHtml(
                      config.avatar || ""
                    )}" placeholder="https://...">
                </div>
            </div>

            <!-- Couleurs -->
            <div class="param-section">
                <h4>🎨 Couleurs</h4>
                
                <div class="param-row">
                    <div class="param-group">
                        <label>Fond principal</label>
                        <div class="color-input-wrapper">
                            <input type="color" id="param-primaryColor" value="${
                              config.primaryColor || "#1a1a2e"
                            }">
                            <input type="text" id="param-primaryColor-text" value="${
                              config.primaryColor || "#1a1a2e"
                            }" class="color-text">
                        </div>
                    </div>
                    
                    <div class="param-group">
                        <label>Couleur accent</label>
                        <div class="color-input-wrapper">
                            <input type="color" id="param-accentColor" value="${
                              config.accentColor || "#4a90d9"
                            }">
                            <input type="text" id="param-accentColor-text" value="${
                              config.accentColor || "#4a90d9"
                            }" class="color-text">
                        </div>
                    </div>
                </div>
            </div>

            <!-- Contacts -->
            <div class="param-section">
                <h4>📞 Moyens de contact</h4>
                <div id="contacts-list"></div>
                <button type="button" class="add-contact-btn" id="add-contact-btn">
                    ➕ Ajouter un contact
                </button>
            </div>
        `;

    // Rendre la liste des contacts
    renderContactsList();

    // Event listeners pour les champs
    setupFormListeners();
  }

  function renderContactsList() {
    const container = document.getElementById("contacts-list");
    const contacts = state.currentConfig.contacts || [];

    if (contacts.length === 0) {
      container.innerHTML =
        '<p class="no-contacts">Aucun moyen de contact ajouté</p>';
      return;
    }

    container.innerHTML = contacts
      .map(
        (contact, index) => `
            <div class="contact-item" data-index="${index}">
                <select class="contact-type" data-index="${index}">
                    <option value="phone" ${
                      contact.type === "phone" ? "selected" : ""
                    }>📞 Téléphone</option>
                    <option value="email" ${
                      contact.type === "email" ? "selected" : ""
                    }>✉️ Email</option>
                    <option value="whatsapp" ${
                      contact.type === "whatsapp" ? "selected" : ""
                    }>💬 WhatsApp</option>
                    <option value="linkedin" ${
                      contact.type === "linkedin" ? "selected" : ""
                    }>💼 LinkedIn</option>
                    <option value="website" ${
                      contact.type === "website" ? "selected" : ""
                    }>🌐 Site web</option>
                    <option value="address" ${
                      contact.type === "address" ? "selected" : ""
                    }>📍 Adresse</option>
                    <option value="facebook" ${
                      contact.type === "facebook" ? "selected" : ""
                    }>👤 Facebook</option>
                    <option value="instagram" ${
                      contact.type === "instagram" ? "selected" : ""
                    }>📷 Instagram</option>
                </select>
                <input type="text" class="contact-value" data-index="${index}" 
                       value="${escapeHtml(
                         contact.value || ""
                       )}" placeholder="Valeur">
                <input type="text" class="contact-label" data-index="${index}" 
                       value="${escapeHtml(
                         contact.label || ""
                       )}" placeholder="Label (optionnel)">
                <button type="button" class="remove-contact-btn" data-index="${index}">🗑️</button>
            </div>
        `
      )
      .join("");

    // Event listeners pour les contacts
    container.querySelectorAll(".contact-type").forEach((el) => {
      el.addEventListener("change", (e) => {
        const idx = parseInt(e.target.dataset.index);
        state.currentConfig.contacts[idx].type = e.target.value;
        updatePreview();
      });
    });

    container.querySelectorAll(".contact-value").forEach((el) => {
      el.addEventListener("input", (e) => {
        const idx = parseInt(e.target.dataset.index);
        state.currentConfig.contacts[idx].value = e.target.value;
        updatePreview();
      });
    });

    container.querySelectorAll(".contact-label").forEach((el) => {
      el.addEventListener("input", (e) => {
        const idx = parseInt(e.target.dataset.index);
        state.currentConfig.contacts[idx].label = e.target.value;
        updatePreview();
      });
    });

    container.querySelectorAll(".remove-contact-btn").forEach((el) => {
      el.addEventListener("click", (e) => {
        const idx = parseInt(e.target.dataset.index);
        state.currentConfig.contacts.splice(idx, 1);
        renderContactsList();
        updatePreview();
      });
    });
  }

  function setupFormListeners() {
    // Champs texte simples
    ["name", "title", "avatar"].forEach((field) => {
      const el = document.getElementById(`param-${field}`);
      if (el) {
        el.addEventListener("input", (e) => {
          state.currentConfig[field] = e.target.value;
          updatePreview();
        });
      }
    });

    // Couleurs
    ["primaryColor", "accentColor"].forEach((field) => {
      const colorEl = document.getElementById(`param-${field}`);
      const textEl = document.getElementById(`param-${field}-text`);

      if (colorEl) {
        colorEl.addEventListener("input", (e) => {
          state.currentConfig[field] = e.target.value;
          if (textEl) textEl.value = e.target.value;
          updatePreview();
        });
      }

      if (textEl) {
        textEl.addEventListener("input", (e) => {
          const val = e.target.value;
          if (/^#[0-9A-Fa-f]{6}$/.test(val)) {
            state.currentConfig[field] = val;
            if (colorEl) colorEl.value = val;
            updatePreview();
          }
        });
      }
    });

    // Bouton ajouter contact
    const addBtn = document.getElementById("add-contact-btn");
    if (addBtn) {
      addBtn.addEventListener("click", () => {
        if (!state.currentConfig.contacts) {
          state.currentConfig.contacts = [];
        }
        state.currentConfig.contacts.push({
          type: "phone",
          value: "",
          label: "",
        });
        renderContactsList();
      });
    }
  }

  // === UPDATE PREVIEW ===
  function updatePreview() {
    const container = document.getElementById("preview-content");
    if (!container) return;

    // Utiliser le générateur de template pour le preview
    if (
      state.currentTemplate === "contact" &&
      window.atlantisTemplates?.contact?.preview
    ) {
      container.innerHTML = window.atlantisTemplates.contact.preview(
        state.currentConfig
      );
    } else {
      container.innerHTML = '<p style="color:#888;">Preview non disponible</p>';
    }
  }

  function updatePreviewSize() {
    const container = document.getElementById("preview-container");
    if (!container) return;

    // Retirer toutes les classes de format
    container.classList.remove(
      "format-carre",
      "format-paysage",
      "format-portrait"
    );

    if (state.previewFormat !== "auto") {
      container.classList.add(`format-${state.previewFormat}`);
    }
  }

  // === SAUVEGARDER ===
  async function save() {
    const saveBtn = document.getElementById("editor-save-btn");
    const btnText = saveBtn.querySelector(".btn-text");
    const btnLoading = saveBtn.querySelector(".btn-loading");

    // UI loading
    saveBtn.disabled = true;
    btnText.style.display = "none";
    btnLoading.style.display = "inline";

    try {
      const token = getToken();
      if (!token) {
        throw new Error("Non authentifié");
      }

      // Vérifier que le générateur est disponible
      if (!window.atlantisTemplates?.[state.currentTemplate]?.generate) {
        throw new Error(
          `Générateur non disponible pour le template: ${state.currentTemplate}`
        );
      }

      // Générer le JS et CSS
      const generated = window.atlantisTemplates[
        state.currentTemplate
      ].generate(state.currentConfig, state.objectName, CONFIG.SPACE_SLUG);

      console.log("📝 Code généré:", {
        jsLength: generated.js.length,
        cssLength: generated.css.length,
      });

      // Appeler l'API pour écrire les fichiers
      const response = await fetch(`${CONFIG.API_BASE}/popups/generate.php`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          space_slug: CONFIG.SPACE_SLUG,
          object_name: state.objectName,
          template_type: state.currentTemplate,
          template_config: state.currentConfig,
          js_content: generated.js,
          css_content: generated.css,
          auth_token: token,
        }),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || "Erreur serveur");
      }

      console.log("✅ Fichiers générés:", result.data);

      // Recharger le popup dynamiquement
      await reloadPopup(
        state.objectName,
        result.data.js_path,
        result.data.css_path
      );

      // Émettre événement
      document.dispatchEvent(
        new CustomEvent("atlantis-popup-generated", {
          detail: {
            objectName: state.objectName,
            templateType: state.currentTemplate,
            paths: result.data,
          },
        })
      );

      // Notification succès
      showNotification("✅ Popup sauvegardé et rechargé !", "success");

      // Fermer l'éditeur
      close();
    } catch (error) {
      console.error("❌ Erreur sauvegarde:", error);
      showNotification("❌ " + error.message, "error");
    } finally {
      // Reset UI
      saveBtn.disabled = false;
      btnText.style.display = "inline";
      btnLoading.style.display = "none";
    }
  }

  // === RECHARGER POPUP DYNAMIQUEMENT ===
  async function reloadPopup(objectName, jsPath, cssPath) {
    const timestamp = Date.now();
    const cleanName = objectName.replace(/_obj$/, "");

    // Supprimer anciens fichiers
    const oldScript = document.querySelector(
      `script[data-popup="${objectName}"]`
    );
    const oldStyle = document.querySelector(`link[data-popup="${objectName}"]`);
    if (oldScript) oldScript.remove();
    if (oldStyle) oldStyle.remove();

    // Supprimer l'ancien popup du registre
    if (window.atlantisPopups && window.atlantisPopups[objectName]) {
      delete window.atlantisPopups[objectName];
    }

    // Charger le nouveau CSS
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = `${cssPath}?v=${timestamp}`;
    link.dataset.popup = objectName;
    document.head.appendChild(link);

    // Charger le nouveau JS
    return new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = `${jsPath}?v=${timestamp}`;
      script.dataset.popup = objectName;
      script.onload = () => {
        console.log(`🔄 Popup ${objectName} rechargé`);
        resolve();
      };
      script.onerror = () => {
        reject(new Error(`Erreur chargement ${jsPath}`));
      };
      document.head.appendChild(script);
    });
  }

  // === NOTIFICATION ===
  function showNotification(message, type = "info") {
    // Utiliser le système de notification existant si disponible
    if (window.atlantisPopup?.showNotification) {
      window.atlantisPopup.showNotification(message, type);
      return;
    }

    // Sinon, créer une notification simple
    const notif = document.createElement("div");
    notif.style.cssText = `
            position: fixed;
            bottom: 30px;
            right: 30px;
            padding: 15px 25px;
            background: ${
              type === "success"
                ? "#10b981"
                : type === "error"
                ? "#ef4444"
                : "#3b82f6"
            };
            color: white;
            border-radius: 10px;
            font-size: 14px;
            font-weight: 600;
            z-index: 100001;
            box-shadow: 0 10px 40px rgba(0,0,0,0.3);
            animation: slideInNotif 0.3s ease;
        `;
    notif.textContent = message;

    // Animation CSS
    if (!document.getElementById("notif-style")) {
      const style = document.createElement("style");
      style.id = "notif-style";
      style.textContent = `
                @keyframes slideInNotif {
                    from { opacity: 0; transform: translateY(20px); }
                    to { opacity: 1; transform: translateY(0); }
                }
            `;
      document.head.appendChild(style);
    }

    document.body.appendChild(notif);

    setTimeout(() => {
      notif.style.opacity = "0";
      notif.style.transform = "translateY(20px)";
      notif.style.transition = "all 0.3s ease";
      setTimeout(() => notif.remove(), 300);
    }, 4000);
  }

  // === API PUBLIQUE ===
  const publicAPI = {
    open: open,
    close: close,
    isOpen: () => state.isOpen,
    getState: () => ({ ...state }),
    reloadPopup: reloadPopup,
  };

  // Exposer globalement (3 alias pour compatibilité)
  window.popupTemplateEditor = publicAPI;
  window.templateEditor = publicAPI;
  window.atlantisTemplateEditor = publicAPI;

  console.log("🎨 Popup Template Editor v2.0 chargé (génération JS/CSS natif)");
})();
