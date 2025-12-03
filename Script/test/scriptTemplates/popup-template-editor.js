/**
 * ============================================
 * 🎨 POPUP TEMPLATE EDITOR v5.0 - Atlantis City
 * Éditeur de templates avec sliders, toggles et contacts
 * ============================================
 */

(function () {
  "use strict";

  // ============================================
  // VÉRIFICATION DU REGISTRE
  // ============================================

  if (!window.atlantisTemplates) {
    console.error("❌ Template Editor: window.atlantisTemplates not found!");
    console.error(
      "👉 Assurez-vous que templates-registry.js est chargé AVANT ce fichier."
    );
    return;
  }

  const registry = window.atlantisTemplates;
  console.log(
    `✅ Template Editor v5.0: Registre trouvé avec ${registry.count()} templates`
  );

  // ============================================
  // STATE
  // ============================================

  let state = {
    isOpen: false,
    objectConfig: null, // { objectName, shaderName, format, zoneSlug, spaceSlug }
    selectedTemplate: null, // ID du template sélectionné
    currentConfig: {}, // Configuration actuelle
    existingData: null, // Données existantes (pour édition)
    previewFormat: "auto",
  };

  let updateTimeout = null;

  // ============================================
  // HELPERS
  // ============================================

  function escapeHtml(text) {
    if (!text) return "";
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
  }

  function escapeSrcdoc(html) {
    if (!html) return "";
    return html.replace(/"/g, "&quot;");
  }

  function debounce(func, wait) {
    return function (...args) {
      clearTimeout(updateTimeout);
      updateTimeout = setTimeout(() => func.apply(this, args), wait);
    };
  }

  function deepClone(obj) {
    return JSON.parse(JSON.stringify(obj));
  }

  // ============================================
  // RENDU PRINCIPAL
  // ============================================

  function render() {
    const existing = document.querySelector(".template-editor-overlay");
    if (existing) existing.remove();

    if (!state.isOpen) return;

    const templates = registry.getAll();

    const overlay = document.createElement("div");
    overlay.className = "template-editor-overlay";
    overlay.innerHTML = `
      <div class="template-editor-container">
        <!-- Header -->
        <div class="template-editor-header">
          <div class="template-editor-title">
            <span class="template-editor-title-icon">🎨</span>
            <span>Éditeur de contenu — ${escapeHtml(
              state.objectConfig?.objectName || "Objet"
            )}</span>
          </div>
          <div class="template-editor-actions">
            <button class="te-btn te-btn-cancel" onclick="window.templateEditor.close()">Annuler</button>
            <button class="te-btn te-btn-save" onclick="window.templateEditor.save()" ${
              !state.selectedTemplate ? "disabled" : ""
            }>
              💾 Enregistrer
            </button>
          </div>
        </div>

        <!-- Body 3 colonnes -->
        <div class="template-editor-body">
          <!-- Colonne 1: Templates -->
          <div class="template-editor-templates">
            <div class="templates-title">📋 Templates</div>
            <div class="templates-list">
              ${Object.values(templates)
                .map(
                  (t) => `
                <div class="template-item ${
                  state.selectedTemplate === t.id ? "selected" : ""
                }" 
                     onclick="window.templateEditor.selectTemplate('${t.id}')">
                  <div class="template-item-icon">${t.icon}</div>
                  <div class="template-item-info">
                    <h4>${escapeHtml(t.name)}</h4>
                    <p>${escapeHtml(t.description)}</p>
                  </div>
                </div>
              `
                )
                .join("")}
            </div>
          </div>

          <!-- Colonne 2: Preview -->
          <div class="template-editor-preview">
            <div class="preview-format-tabs">
              <button class="preview-format-tab ${
                state.previewFormat === "auto" ? "active" : ""
              }" 
                      onclick="window.templateEditor.setPreviewFormat('auto')">Auto</button>
              <button class="preview-format-tab ${
                state.previewFormat === "carre" ? "active" : ""
              }" 
                      onclick="window.templateEditor.setPreviewFormat('carre')">Carré</button>
              <button class="preview-format-tab ${
                state.previewFormat === "paysage" ? "active" : ""
              }" 
                      onclick="window.templateEditor.setPreviewFormat('paysage')">Paysage</button>
              <button class="preview-format-tab ${
                state.previewFormat === "portrait" ? "active" : ""
              }" 
                      onclick="window.templateEditor.setPreviewFormat('portrait')">Portrait</button>
            </div>
            <div class="preview-wrapper" id="preview-container">
              ${
                state.selectedTemplate
                  ? renderPreview()
                  : `
                <div class="preview-empty">
                  <div class="preview-empty-icon">👈</div>
                  <p>Sélectionnez un template pour commencer</p>
                </div>
              `
              }
            </div>
          </div>

          <!-- Colonne 3: Paramètres -->
          <div class="template-editor-params">
            <div class="params-title">⚙️ Paramètres</div>
            <div class="params-scroll" id="params-container">
              ${
                state.selectedTemplate
                  ? renderParams()
                  : `
                <div class="params-empty">
                  <p>Les options apparaîtront ici</p>
                </div>
              `
              }
            </div>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(overlay);
    requestAnimationFrame(() => overlay.classList.add("active"));
    document.addEventListener("keydown", handleEscape);
  }

  // ============================================
  // RENDU PREVIEW
  // ============================================

  function renderPreview() {
    if (!state.selectedTemplate) return "";

    const template = registry.get(state.selectedTemplate);
    if (!template) return "<p>Template non trouvé</p>";

    const html = template.generateHTML(state.currentConfig);

    // Déterminer la taille selon le format
    const format =
      state.previewFormat === "auto"
        ? state.objectConfig?.format || "carre"
        : state.previewFormat;

    const sizes = {
      carre: { width: 350, height: 420 },
      paysage: { width: 500, height: 360 },
      portrait: { width: 300, height: 500 },
    };

    const size = sizes[format] || sizes.carre;

    return `
      <div class="preview-frame preview-${format}">
        <iframe 
          srcdoc="${escapeSrcdoc(html)}"
          style="width: ${size.width}px; height: ${
      size.height
    }px; border: none; border-radius: 12px;"
          sandbox="allow-scripts"
        ></iframe>
      </div>
    `;
  }

  // ============================================
  // RENDU PARAMÈTRES
  // ============================================

  function renderParams() {
    if (!state.selectedTemplate) return "";

    const template = registry.get(state.selectedTemplate);
    if (!template || !template.generateParamsHTML) {
      return '<p style="color: #64748b; padding: 20px;">Ce template n\'a pas de paramètres configurables.</p>';
    }

    return template.generateParamsHTML(state.currentConfig);
  }

  // ============================================
  // MISE À JOUR PREVIEW (debounced)
  // ============================================

  const updatePreview = debounce(() => {
    const previewContainer = document.getElementById("preview-container");
    if (previewContainer && state.selectedTemplate) {
      previewContainer.innerHTML = renderPreview();
    }
  }, 150);

  // ============================================
  // MISE À JOUR PARAMÈTRES
  // ============================================

  function updateParamsUI() {
    const paramsContainer = document.getElementById("params-container");
    if (paramsContainer && state.selectedTemplate) {
      paramsContainer.innerHTML = renderParams();
    }
  }

  // ============================================
  // GESTION CLAVIER
  // ============================================

  function handleEscape(e) {
    if (e.key === "Escape" && state.isOpen) {
      close();
    }
  }

  // ============================================
  // ACTIONS PUBLIQUES
  // ============================================

  function open(objectConfig, existingData = null) {
    console.log("📝 Template Editor: Opening for", objectConfig);

    state.isOpen = true;
    state.objectConfig = objectConfig;
    state.existingData = existingData;
    state.previewFormat = "auto";

    // Si données existantes, pré-sélectionner le template
    if (existingData && existingData.template_type) {
      const templateId = existingData.template_type;
      const template = registry.get(templateId);

      if (template) {
        state.selectedTemplate = templateId;
        // Merger config existante avec défauts
        state.currentConfig = {
          ...deepClone(template.defaultConfig),
          ...(existingData.template_config || {}),
        };
      }
    } else {
      state.selectedTemplate = null;
      state.currentConfig = {};
    }

    render();
  }

  function close() {
    state.isOpen = false;
    document.removeEventListener("keydown", handleEscape);

    const overlay = document.querySelector(".template-editor-overlay");
    if (overlay) {
      overlay.classList.remove("active");
      setTimeout(() => overlay.remove(), 300);
    }
  }

  function selectTemplate(templateId) {
    console.log("📋 Template sélectionné:", templateId);

    const template = registry.get(templateId);
    if (!template) {
      console.error("Template non trouvé:", templateId);
      return;
    }

    state.selectedTemplate = templateId;
    state.currentConfig = deepClone(template.defaultConfig);

    render();
  }

  function updateConfig(key, value) {
    if (!state.selectedTemplate) return;

    state.currentConfig[key] = value;
    console.log(`⚙️ Config update: ${key} =`, value);

    updatePreview();
  }

  function setPreviewFormat(format) {
    state.previewFormat = format;

    // Mettre à jour les boutons
    document.querySelectorAll(".preview-format-tab").forEach((btn) => {
      const btnFormat = btn.textContent.toLowerCase();
      btn.classList.toggle("active", btnFormat === format);
    });

    updatePreview();
  }

  // ============================================
  // GESTION DES CONTACTS (template contact)
  // ============================================

  function updateContact(index, field, value) {
    if (!state.currentConfig.contacts || !state.currentConfig.contacts[index]) {
      console.warn("Contact non trouvé:", index);
      return;
    }

    state.currentConfig.contacts[index][field] = value;
    console.log(`📇 Contact ${index} update: ${field} =`, value);

    updatePreview();
  }

  function addContact() {
    if (!state.currentConfig.contacts) {
      state.currentConfig.contacts = [];
    }

    state.currentConfig.contacts.push({
      type: "email",
      label: "Nouveau",
      value: "",
      href: "",
    });

    console.log(
      "➕ Contact ajouté, total:",
      state.currentConfig.contacts.length
    );

    updateParamsUI();
    updatePreview();
  }

  function removeContact(index) {
    if (!state.currentConfig.contacts || !state.currentConfig.contacts[index]) {
      return;
    }

    state.currentConfig.contacts.splice(index, 1);
    console.log(
      "➖ Contact supprimé, restant:",
      state.currentConfig.contacts.length
    );

    updateParamsUI();
    updatePreview();
  }

  // ============================================
  // SAUVEGARDE
  // ============================================

  async function save() {
    if (!state.selectedTemplate || !state.objectConfig) {
      console.error("❌ Impossible de sauvegarder: données manquantes");
      return;
    }

    const template = registry.get(state.selectedTemplate);
    if (!template) {
      console.error("❌ Template non trouvé");
      return;
    }

    // Générer le HTML final
    const htmlContent = template.generateHTML(state.currentConfig);

    // Récupérer le token
    const token =
      window.atlantisAuth?.getToken() ||
      localStorage.getItem("atlantis_auth_token") ||
      sessionStorage.getItem("atlantis_auth_token");

    if (!token) {
      alert("❌ Vous devez être connecté pour sauvegarder.");
      return;
    }

    // Préparer les données
    const saveData = {
      space_slug:
        state.objectConfig.spaceSlug || window.ATLANTIS_SPACE || "default",
      object_name: state.objectConfig.objectName,
      template_type: state.selectedTemplate,
      template_config: state.currentConfig,
      html_content: htmlContent,
      auth_token: token,
    };

    console.log("💾 Sauvegarde en cours...", saveData);

    // Bouton loading
    const saveBtn = document.querySelector(".te-btn-save");
    if (saveBtn) {
      saveBtn.disabled = true;
      saveBtn.innerHTML = "⏳ Sauvegarde...";
    }

    try {
      const apiBase =
        window.ATLANTIS_API_BASE || "https://compagnon.atlantis-city.com/api";
      const response = await fetch(`${apiBase}/popups/save.php`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(saveData),
      });

      const result = await response.json();

      if (result.success) {
        console.log("✅ Sauvegarde réussie!");

        // Émettre événement pour notifier les autres composants
        document.dispatchEvent(
          new CustomEvent("atlantis-popup-content-saved", {
            detail: {
              objectName: state.objectConfig.objectName,
              templateType: state.selectedTemplate,
              templateConfig: state.currentConfig,
              htmlContent: htmlContent,
            },
          })
        );

        // Fermer l'éditeur
        close();

        // Notification succès
        if (window.atlantisPopup?.showNotification) {
          window.atlantisPopup.showNotification(
            "✅ Contenu sauvegardé !",
            "success"
          );
        }
      } else {
        throw new Error(result.error || "Erreur inconnue");
      }
    } catch (error) {
      console.error("❌ Erreur sauvegarde:", error);
      alert("❌ Erreur lors de la sauvegarde: " + error.message);

      if (saveBtn) {
        saveBtn.disabled = false;
        saveBtn.innerHTML = "💾 Enregistrer";
      }
    }
  }

  // ============================================
  // API PUBLIQUE
  // ============================================

  const publicAPI = {
    open,
    close,
    selectTemplate,
    updateConfig,
    updateContact,
    addContact,
    removeContact,
    setPreviewFormat,
    save,
    getState: () => ({ ...state }),
    isOpen: () => state.isOpen,
  };

  // Exposer globalement sous plusieurs noms
  window.templateEditor = publicAPI;
  window.atlantisTemplateEditor = publicAPI;
  window.popupTemplateEditor = publicAPI;

  console.log("✅ Popup Template Editor v5.0 initialisé");
})();
