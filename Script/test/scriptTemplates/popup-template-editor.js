/**
 * ============================================
 * 🎨 POPUP TEMPLATE EDITOR v4.1 - Atlantis City
 * Éditeur de templates utilisant le registre
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
    `✅ Template Editor: Registre trouvé avec ${registry.count()} templates`
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

  // Pour srcdoc: échapper seulement les guillemets doubles
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

  // ============================================
  // RENDU PRINCIPAL
  // ============================================

  function render() {
    // Supprimer l'overlay existant
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
            <span style="font-size: 24px;">🎨</span>
            <div>
              <h2>Éditeur de contenu</h2>
              <span class="template-editor-subtitle">${escapeHtml(
                state.objectConfig?.objectName || "Objet"
              )}</span>
            </div>
          </div>
          <button class="template-editor-close" onclick="window.templateEditor.close()">✕</button>
        </div>

        <!-- Body -->
        <div class="template-editor-body">
          <!-- Colonne 1: Templates -->
          <div class="template-editor-col template-list-col">
            <div class="col-header">📋 Templates</div>
            <div class="template-list">
              ${Object.values(templates)
                .map(
                  (t) => `
                <div class="template-item ${
                  state.selectedTemplate === t.id ? "selected" : ""
                }" 
                     onclick="window.templateEditor.selectTemplate('${t.id}')">
                  <span class="template-icon">${t.icon}</span>
                  <div class="template-info">
                    <div class="template-name">${escapeHtml(t.name)}</div>
                    <div class="template-desc">${escapeHtml(
                      t.description
                    )}</div>
                  </div>
                </div>
              `
                )
                .join("")}
            </div>
          </div>

          <!-- Colonne 2: Paramètres -->
          <div class="template-editor-col params-col">
            <div class="col-header">⚙️ Paramètres</div>
            <div class="params-container" id="params-container">
              ${
                state.selectedTemplate
                  ? renderParams()
                  : `
                <div class="empty-state">
                  <span style="font-size: 48px; opacity: 0.3;">👈</span>
                  <p>Sélectionnez un template</p>
                </div>
              `
              }
            </div>
          </div>

          <!-- Colonne 3: Preview -->
          <div class="template-editor-col preview-col">
            <div class="col-header">
              👁️ Aperçu
              <div class="preview-formats">
                <button class="format-btn ${
                  state.previewFormat === "auto" ? "active" : ""
                }" 
                        onclick="window.templateEditor.setPreviewFormat('auto')">Auto</button>
                <button class="format-btn ${
                  state.previewFormat === "carre" ? "active" : ""
                }" 
                        onclick="window.templateEditor.setPreviewFormat('carre')">Carré</button>
                <button class="format-btn ${
                  state.previewFormat === "paysage" ? "active" : ""
                }" 
                        onclick="window.templateEditor.setPreviewFormat('paysage')">Paysage</button>
                <button class="format-btn ${
                  state.previewFormat === "portrait" ? "active" : ""
                }" 
                        onclick="window.templateEditor.setPreviewFormat('portrait')">Portrait</button>
              </div>
            </div>
            <div class="preview-container" id="preview-container">
              ${
                state.selectedTemplate
                  ? renderPreview()
                  : `
                <div class="empty-state">
                  <span style="font-size: 48px; opacity: 0.3;">👀</span>
                  <p>L'aperçu apparaîtra ici</p>
                </div>
              `
              }
            </div>
          </div>
        </div>

        <!-- Footer -->
        <div class="template-editor-footer">
          <button class="btn-secondary" onclick="window.templateEditor.close()">Annuler</button>
          <button class="btn-primary" onclick="window.templateEditor.save()" ${
            !state.selectedTemplate ? "disabled" : ""
          }>
            💾 Enregistrer
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(overlay);

    // Animation d'entrée
    requestAnimationFrame(() => overlay.classList.add("active"));
  }

  function renderParams() {
    if (!state.selectedTemplate) return "";

    const paramsHTML = registry.generateParamsHTML(
      state.selectedTemplate,
      state.currentConfig
    );
    if (paramsHTML) return paramsHTML;

    // Fallback si le template n'a pas de generateParamsHTML
    return `
      <div class="params-section">
        <div class="params-section-title">⚙️ Configuration</div>
        <p style="color: #64748b; font-size: 13px;">
          Ce template n'a pas de paramètres configurables.
        </p>
      </div>
    `;
  }

  function renderPreview() {
    if (!state.selectedTemplate) return "";

    const format =
      state.previewFormat === "auto"
        ? state.objectConfig?.format || "carre"
        : state.previewFormat;
    const dimensions = getPreviewDimensions(format);

    // Générer le HTML via le registre
    const html = registry.generateHTML(
      state.selectedTemplate,
      state.currentConfig
    );

    console.log(
      "🖼️ Preview HTML généré:",
      html ? html.substring(0, 200) + "..." : "VIDE"
    );

    if (!html) {
      return `
        <div class="empty-state">
          <span style="font-size: 48px; opacity: 0.3;">⚠️</span>
          <p>Erreur de génération HTML</p>
        </div>
      `;
    }

    return `
      <div class="preview-frame" style="width: ${dimensions.width}px; height: ${
      dimensions.height
    }px;">
        <iframe 
          id="preview-iframe"
          srcdoc="${escapeSrcdoc(html)}"
          sandbox="allow-scripts"
          style="width: 100%; height: 100%; border: none; border-radius: 8px; background: white;">
        </iframe>
      </div>
    `;
  }

  function getPreviewDimensions(format) {
    const dims = {
      carre: { width: 300, height: 300 },
      paysage: { width: 400, height: 225 },
      portrait: { width: 225, height: 400 },
      auto: { width: 350, height: 350 },
    };
    return dims[format] || dims.auto;
  }

  // ============================================
  // UPDATE PREVIEW (avec debounce)
  // ============================================

  const updatePreview = debounce(function () {
    const container = document.getElementById("preview-container");
    if (!container || !state.selectedTemplate) return;

    container.innerHTML = renderPreview();
  }, 150);

  // ============================================
  // API PUBLIQUE
  // ============================================

  function open(objectConfig, existingData = null) {
    console.log("🎨 Template Editor: Ouverture", objectConfig);

    state.isOpen = true;
    state.objectConfig = objectConfig;
    state.existingData = existingData;
    state.previewFormat = objectConfig?.format || "auto";

    // Si données existantes, charger le template et la config
    if (existingData && existingData.template_type) {
      state.selectedTemplate = existingData.template_type;
      state.currentConfig =
        existingData.template_config ||
        registry.getDefaultConfig(existingData.template_type);
    } else {
      state.selectedTemplate = null;
      state.currentConfig = {};
    }

    render();
    document.body.style.overflow = "hidden";
  }

  function close() {
    state.isOpen = false;
    document.body.style.overflow = "";

    const overlay = document.querySelector(".template-editor-overlay");
    if (overlay) {
      overlay.classList.remove("active");
      setTimeout(() => overlay.remove(), 300);
    }
  }

  function selectTemplate(templateId) {
    console.log("📋 Template sélectionné:", templateId);

    state.selectedTemplate = templateId;
    state.currentConfig = registry.getDefaultConfig(templateId);

    console.log("📋 Config par défaut:", state.currentConfig);

    // Re-render complet pour mettre à jour toutes les colonnes
    render();
  }

  function updateConfig(key, value) {
    console.log("🔧 updateConfig:", key, "=", value);
    state.currentConfig[key] = value;
    updatePreview();
  }

  function updateContact(index, field, value) {
    if (!state.currentConfig.contacts) return;
    if (!state.currentConfig.contacts[index]) return;

    state.currentConfig.contacts[index][field] = value;
    updatePreview();
  }

  function addContact() {
    if (!state.currentConfig.contacts) {
      state.currentConfig.contacts = [];
    }
    state.currentConfig.contacts.push({ type: "email", value: "" });

    // Re-render params
    const paramsContainer = document.getElementById("params-container");
    if (paramsContainer) {
      paramsContainer.innerHTML = renderParams();
    }
    updatePreview();
  }

  function removeContact(index) {
    if (!state.currentConfig.contacts) return;
    state.currentConfig.contacts.splice(index, 1);

    // Re-render params
    const paramsContainer = document.getElementById("params-container");
    if (paramsContainer) {
      paramsContainer.innerHTML = renderParams();
    }
    updatePreview();
  }

  function setPreviewFormat(format) {
    state.previewFormat = format;

    // Re-render pour mettre à jour les boutons et le preview
    render();
  }

  async function save() {
    if (!state.selectedTemplate || !state.objectConfig) {
      console.error(
        "❌ Impossible de sauvegarder: template ou config manquant"
      );
      return;
    }

    console.log("💾 Sauvegarde en cours...");

    // Générer le HTML final
    const htmlContent = registry.generateHTML(
      state.selectedTemplate,
      state.currentConfig
    );

    // Récupérer le token
    const token =
      window.atlantisAuth?.getToken() ||
      localStorage.getItem("atlantis_auth_token") ||
      sessionStorage.getItem("atlantis_auth_token");

    if (!token) {
      alert("Vous devez être connecté pour sauvegarder.");
      return;
    }

    // Récupérer le space_slug
    const spaceSlug =
      state.objectConfig.spaceSlug || window.ATLANTIS_SPACE || "scenetes";

    try {
      const response = await fetch(
        "https://compagnon.atlantis-city.com/api/popups/save.php",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            space_slug: spaceSlug,
            object_name: state.objectConfig.objectName,
            shader_name: state.objectConfig.shaderName || null,
            format: state.objectConfig.format || null,
            template_type: state.selectedTemplate,
            template_config: state.currentConfig,
            html_content: htmlContent,
            auth_token: token,
          }),
        }
      );

      const result = await response.json();

      if (result.success) {
        console.log("✅ Sauvegarde réussie", result);

        // Émettre un événement pour notifier les autres composants
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

        close();

        // Notification
        if (window.atlantisPopup?.showNotification) {
          window.atlantisPopup.showNotification(
            "Contenu sauvegardé !",
            "success"
          );
        } else {
          // Notification simple
          const notif = document.createElement("div");
          notif.style.cssText =
            "position:fixed;bottom:30px;right:30px;background:#10b981;color:white;padding:16px 24px;border-radius:10px;font-size:14px;font-weight:600;z-index:100001;box-shadow:0 10px 40px rgba(0,0,0,0.3);";
          notif.textContent = "✅ Contenu sauvegardé !";
          document.body.appendChild(notif);
          setTimeout(() => notif.remove(), 3000);
        }
      } else {
        throw new Error(result.error || "Erreur de sauvegarde");
      }
    } catch (error) {
      console.error("❌ Erreur sauvegarde:", error);
      alert("Erreur lors de la sauvegarde: " + error.message);
    }
  }

  // ============================================
  // EXPOSITION GLOBALE
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

  // Exposer sous plusieurs noms pour compatibilité
  window.templateEditor = publicAPI;
  window.atlantisTemplateEditor = publicAPI;
  window.popupTemplateEditor = publicAPI;

  console.log("✅ Popup Template Editor v4.1 initialisé");
  console.log("   Templates disponibles:", registry.list().join(", "));
})();
