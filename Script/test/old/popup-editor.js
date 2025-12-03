/**
 * ============================================
 * 📝 POPUP EDITOR - Atlantis City
 * Éditeur de contenu HTML pour popups
 * ============================================
 *
 * v2.0 - Preview scalé (zoom arrière comme Photoshop)
 * Le preview montre tout le contenu à une échelle réduite
 *
 * Dépendances : popup-admin.js (appelle openEditor)
 * API requises : /api/popups/get.php, /api/popups/save.php
 */

(function () {
  "use strict";

  // === CONFIGURATION ===
  const EDITOR_CONFIG = {
    apiBase: "https://compagnon.atlantis-city.com/api/popups",
    debounceDelay: 300, // ms avant update preview

    // Dimensions réelles par format (pour le scale)
    formatDimensions: {
      carre: { width: 500, height: 500 },
      paysage: { width: 600, height: 338 }, // 16:9
      portrait: { width: 338, height: 600 }, // 9:16
    },

    // Taille du container preview dans l'UI
    previewContainerSize: {
      width: 320,
      height: 280,
    },
  };

  // === STATE ===
  let editorState = {
    isOpen: false,
    objectName: null,
    shaderName: null,
    spaceId: null,
    spaceSlug: null,
    zoneId: null,
    zoneSlug: null,
    format: "carre",
    originalContent: "",
    hasChanges: false,
    debounceTimer: null,
  };

  // === TEMPLATES PAR FORMAT ===
  const TEMPLATES = {
    carre: [
      {
        name: "Vide",
        html: '<div class="popup-content">\n  <!-- Votre contenu ici -->\n</div>',
      },
      {
        name: "Produit",
        html: `<div class="popup-content" style="text-align: center; padding: 20px; font-family: Arial, sans-serif;">
  <img src="URL_IMAGE" alt="Produit" style="max-width: 80%; height: auto; border-radius: 8px; margin-bottom: 15px;">
  <h2 style="color: #1e293b; margin: 0 0 10px;">Nom du Produit</h2>
  <p style="color: #64748b; font-size: 14px; margin: 0 0 15px;">Description courte du produit avec ses caractéristiques principales.</p>
  <p style="color: #3b82f6; font-size: 24px; font-weight: bold; margin: 0 0 15px;">99,00 €</p>
  <a href="#" style="display: inline-block; background: #3b82f6; color: white; padding: 12px 30px; border-radius: 25px; text-decoration: none; font-weight: 600;">En savoir plus</a>
</div>`,
      },
      {
        name: "Info",
        html: `<div class="popup-content" style="padding: 25px; font-family: Arial, sans-serif;">
  <h2 style="color: #1e293b; margin: 0 0 15px; border-bottom: 2px solid #3b82f6; padding-bottom: 10px;">Titre de la section</h2>
  <p style="color: #475569; line-height: 1.6; margin: 0 0 12px;">Premier paragraphe avec les informations principales. Vous pouvez décrire votre contenu ici.</p>
  <p style="color: #475569; line-height: 1.6; margin: 0;">Deuxième paragraphe pour plus de détails ou des informations complémentaires.</p>
</div>`,
      },
    ],
    paysage: [
      {
        name: "Vide",
        html: '<div class="popup-content">\n  <!-- Votre contenu ici -->\n</div>',
      },
      {
        name: "Bannière",
        html: `<div class="popup-content" style="display: flex; align-items: center; padding: 20px; font-family: Arial, sans-serif; gap: 25px;">
  <img src="URL_IMAGE" alt="Image" style="width: 45%; height: auto; border-radius: 8px; object-fit: cover;">
  <div style="flex: 1;">
    <h2 style="color: #1e293b; margin: 0 0 10px; font-size: 22px;">Titre Principal</h2>
    <p style="color: #64748b; font-size: 14px; line-height: 1.5; margin: 0 0 15px;">Description détaillée de votre contenu. Profitez de l'espace horizontal pour afficher plus d'informations.</p>
    <a href="#" style="display: inline-block; background: #3b82f6; color: white; padding: 10px 25px; border-radius: 20px; text-decoration: none; font-weight: 600; font-size: 14px;">Découvrir</a>
  </div>
</div>`,
      },
      {
        name: "Galerie 3 images",
        html: `<div class="popup-content" style="padding: 15px; font-family: Arial, sans-serif;">
  <h2 style="color: #1e293b; margin: 0 0 15px; text-align: center;">Notre Galerie</h2>
  <div style="display: flex; gap: 10px;">
    <img src="URL_IMAGE_1" alt="Image 1" style="flex: 1; height: 120px; object-fit: cover; border-radius: 6px;">
    <img src="URL_IMAGE_2" alt="Image 2" style="flex: 1; height: 120px; object-fit: cover; border-radius: 6px;">
    <img src="URL_IMAGE_3" alt="Image 3" style="flex: 1; height: 120px; object-fit: cover; border-radius: 6px;">
  </div>
</div>`,
      },
    ],
    portrait: [
      {
        name: "Vide",
        html: '<div class="popup-content">\n  <!-- Votre contenu ici -->\n</div>',
      },
      {
        name: "Fiche Produit",
        html: `<div class="popup-content" style="padding: 20px; font-family: Arial, sans-serif; text-align: center;">
  <img src="URL_IMAGE" alt="Produit" style="width: 100%; max-height: 200px; object-fit: cover; border-radius: 8px; margin-bottom: 15px;">
  <h2 style="color: #1e293b; margin: 0 0 8px; font-size: 20px;">Nom du Produit</h2>
  <p style="color: #3b82f6; font-size: 22px; font-weight: bold; margin: 0 0 10px;">149,00 €</p>
  <p style="color: #64748b; font-size: 13px; line-height: 1.5; margin: 0 0 15px;">Description du produit avec toutes les informations importantes pour le client.</p>
  <ul style="text-align: left; color: #475569; font-size: 13px; margin: 0 0 15px; padding-left: 20px;">
    <li>Caractéristique 1</li>
    <li>Caractéristique 2</li>
    <li>Caractéristique 3</li>
  </ul>
  <a href="#" style="display: block; background: #3b82f6; color: white; padding: 12px; border-radius: 25px; text-decoration: none; font-weight: 600;">Commander</a>
</div>`,
      },
      {
        name: "Contact",
        html: `<div class="popup-content" style="padding: 20px; font-family: Arial, sans-serif;">
  <h2 style="color: #1e293b; margin: 0 0 15px; text-align: center;">Contactez-nous</h2>
  <div style="background: #f1f5f9; padding: 15px; border-radius: 8px; margin-bottom: 15px;">
    <p style="margin: 0 0 8px; color: #475569; font-size: 14px;"><strong>📍 Adresse</strong></p>
    <p style="margin: 0; color: #64748b; font-size: 13px;">123 Rue Example<br>75001 Paris</p>
  </div>
  <div style="background: #f1f5f9; padding: 15px; border-radius: 8px; margin-bottom: 15px;">
    <p style="margin: 0 0 8px; color: #475569; font-size: 14px;"><strong>📞 Téléphone</strong></p>
    <p style="margin: 0; color: #64748b; font-size: 13px;">01 23 45 67 89</p>
  </div>
  <div style="background: #f1f5f9; padding: 15px; border-radius: 8px;">
    <p style="margin: 0 0 8px; color: #475569; font-size: 14px;"><strong>✉️ Email</strong></p>
    <p style="margin: 0; color: #64748b; font-size: 13px;">contact@example.com</p>
  </div>
</div>`,
      },
    ],
  };

  // === HELPERS ===
  function getToken() {
    return (
      localStorage.getItem("atlantis_auth_token") ||
      (window.atlantisAuth && window.atlantisAuth.getToken
        ? window.atlantisAuth.getToken()
        : null)
    );
  }

  function getFormatLabel(format) {
    const labels = {
      carre: "Carré 1:1",
      paysage: "Paysage 16:9",
      portrait: "Portrait 9:16",
    };
    return labels[format] || format;
  }

  /**
   * Calcule le scale pour faire rentrer le format dans le container
   */
  function calculateScale(format) {
    const dims =
      EDITOR_CONFIG.formatDimensions[format] ||
      EDITOR_CONFIG.formatDimensions.carre;
    const container = EDITOR_CONFIG.previewContainerSize;

    const scaleX = container.width / dims.width;
    const scaleY = container.height / dims.height;

    // Prendre le plus petit pour que tout rentre
    return Math.min(scaleX, scaleY, 1);
  }

  // === OPEN EDITOR ===
  function openEditor(options) {
    if (editorState.isOpen) {
      console.warn("Popup Editor: Déjà ouvert");
      return;
    }

    // Sauvegarder le state
    editorState.objectName = options.objectName;
    editorState.shaderName =
      options.shaderName || options.objectName.replace("_obj", "_shdr");
    editorState.spaceId = options.spaceId;
    editorState.spaceSlug = options.spaceSlug;
    editorState.zoneId = options.zoneId;
    editorState.zoneSlug = options.zoneSlug;
    editorState.format = options.format || "carre";
    editorState.originalContent = "";
    editorState.hasChanges = false;
    editorState.isOpen = true;

    console.log("📝 Popup Editor: Ouverture pour", editorState.objectName);

    // Créer l'interface
    createEditorUI();

    // Charger le contenu existant
    loadContent();
  }

  // === CREATE UI ===
  function createEditorUI() {
    // Supprimer si existe déjà
    const existing = document.getElementById("popup-editor-overlay");
    if (existing) existing.remove();

    // Créer l'overlay
    const overlay = document.createElement("div");
    overlay.id = "popup-editor-overlay";
    overlay.className = "popup-editor-overlay";

    // Templates pour le format actuel
    const templates = TEMPLATES[editorState.format] || TEMPLATES.carre;
    const templateOptions = templates
      .map((t, i) => `<option value="${i}">${t.name}</option>`)
      .join("");

    // Calculer les dimensions pour le preview scalé
    const dims =
      EDITOR_CONFIG.formatDimensions[editorState.format] ||
      EDITOR_CONFIG.formatDimensions.carre;
    const scale = calculateScale(editorState.format);
    const scaledWidth = dims.width * scale;
    const scaledHeight = dims.height * scale;

    overlay.innerHTML = `
      <div class="popup-editor-modal">
        <div class="popup-editor-header">
          <div class="popup-editor-title">
            <span class="popup-editor-icon">📝</span>
            <div>
              <h3>Modifier le contenu</h3>
              <p>${editorState.objectName} • ${
      editorState.zoneSlug || "Global"
    } • ${getFormatLabel(editorState.format)}</p>
            </div>
          </div>
          <button class="popup-editor-close" onclick="window.popupEditor.close()">✕</button>
        </div>
        
        <div class="popup-editor-body">
          <div class="popup-editor-panel popup-editor-code">
            <div class="popup-editor-panel-header">
              <span>Code HTML</span>
              <select class="popup-editor-template-select" onchange="window.popupEditor.applyTemplate(this.value)">
                <option value="">📋 Templates...</option>
                ${templateOptions}
              </select>
            </div>
            <textarea 
              id="popup-editor-textarea" 
              class="popup-editor-textarea" 
              placeholder="Entrez votre code HTML ici..."
              spellcheck="false"
            ></textarea>
          </div>
          
          <div class="popup-editor-panel popup-editor-preview">
            <div class="popup-editor-panel-header">
              <span>Prévisualisation</span>
              <span class="popup-editor-preview-badge">${getFormatLabel(
                editorState.format
              )}</span>
              <span class="popup-editor-preview-scale">${Math.round(
                scale * 100
              )}%</span>
            </div>
            <div class="popup-editor-preview-wrapper">
              <div 
                class="popup-editor-preview-container" 
                id="popup-editor-preview-container"
                style="width: ${scaledWidth}px; height: ${scaledHeight}px;"
              >
                <div 
                  id="popup-editor-preview-scaler"
                  class="popup-editor-preview-scaler"
                  style="
                    width: ${dims.width}px; 
                    height: ${dims.height}px;
                    transform: scale(${scale});
                    transform-origin: top left;
                  "
                >
                  <div id="popup-editor-preview-content" class="popup-editor-preview-content">
                    <p class="popup-editor-preview-empty">La prévisualisation apparaîtra ici...</p>
                  </div>
                </div>
              </div>
              <div class="popup-editor-preview-dimensions">
                ${dims.width} × ${dims.height}px
              </div>
            </div>
          </div>
        </div>
        
        <div class="popup-editor-footer">
          <div class="popup-editor-footer-left">
            <span id="popup-editor-status" class="popup-editor-status">Chargement...</span>
          </div>
          <div class="popup-editor-footer-right">
            <button class="popup-editor-btn popup-editor-btn-secondary" onclick="window.popupEditor.close()">
              Annuler
            </button>
            <button id="popup-editor-save-btn" class="popup-editor-btn popup-editor-btn-primary" onclick="window.popupEditor.save()" disabled>
              💾 Sauvegarder
            </button>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(overlay);

    // Setup event listeners
    const textarea = document.getElementById("popup-editor-textarea");
    textarea.addEventListener("input", onContentChange);

    // Animation d'entrée
    requestAnimationFrame(() => {
      overlay.classList.add("active");
    });

    // Fermer avec Escape
    document.addEventListener("keydown", handleKeyDown);
  }

  // === LOAD CONTENT ===
  async function loadContent() {
    const statusEl = document.getElementById("popup-editor-status");
    const textarea = document.getElementById("popup-editor-textarea");
    const saveBtn = document.getElementById("popup-editor-save-btn");

    try {
      statusEl.textContent = "Chargement...";
      statusEl.className = "popup-editor-status loading";

      const token = getToken();
      const params = new URLSearchParams({
        space_slug: editorState.spaceSlug,
        object_name: editorState.objectName,
      });

      const response = await fetch(
        `${EDITOR_CONFIG.apiBase}/get.php?${params}`,
        {
          method: "GET",
          headers: {
            Authorization: token ? `Bearer ${token}` : "",
          },
        }
      );

      const result = await response.json();

      if (result.success && result.data && result.data.html_content) {
        textarea.value = result.data.html_content;
        editorState.originalContent = result.data.html_content;
        statusEl.textContent = "Contenu chargé";
        statusEl.className = "popup-editor-status success";
      } else {
        textarea.value = "";
        editorState.originalContent = "";
        statusEl.textContent = "Nouveau contenu";
        statusEl.className = "popup-editor-status";
      }

      saveBtn.disabled = false;
      updatePreview();
    } catch (error) {
      console.error("Popup Editor: Erreur chargement", error);
      statusEl.textContent = "Erreur de chargement";
      statusEl.className = "popup-editor-status error";

      textarea.value = "";
      editorState.originalContent = "";
      saveBtn.disabled = false;
    }
  }

  // === CONTENT CHANGE ===
  function onContentChange() {
    const textarea = document.getElementById("popup-editor-textarea");
    const statusEl = document.getElementById("popup-editor-status");

    editorState.hasChanges = textarea.value !== editorState.originalContent;

    if (editorState.hasChanges) {
      statusEl.textContent = "● Modifications non sauvegardées";
      statusEl.className = "popup-editor-status modified";
    } else {
      statusEl.textContent = "Aucune modification";
      statusEl.className = "popup-editor-status";
    }

    clearTimeout(editorState.debounceTimer);
    editorState.debounceTimer = setTimeout(
      updatePreview,
      EDITOR_CONFIG.debounceDelay
    );
  }

  // === UPDATE PREVIEW (scalé) ===
  function updatePreview() {
    const textarea = document.getElementById("popup-editor-textarea");
    const previewEl = document.getElementById("popup-editor-preview-content");

    if (!textarea || !previewEl) return;

    const html = textarea.value.trim();

    if (html) {
      // Utiliser un iframe pour isoler complètement le contenu
      const iframeHtml = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            html, body { 
              width: 100%;
              height: 100%;
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              background: white;
              overflow: auto;
            }
            body {
              display: flex;
              align-items: center;
              justify-content: center;
              min-height: 100%;
            }
            img { max-width: 100%; height: auto; }
          </style>
        </head>
        <body>${html}</body>
        </html>
      `;

      previewEl.innerHTML = `<iframe id="preview-iframe" style="width:100%;height:100%;border:none;display:block;"></iframe>`;
      const iframe = document.getElementById("preview-iframe");

      const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
      iframeDoc.open();
      iframeDoc.write(iframeHtml);
      iframeDoc.close();

      previewEl.classList.remove("empty");
    } else {
      previewEl.innerHTML =
        '<p class="popup-editor-preview-empty">La prévisualisation apparaîtra ici...</p>';
      previewEl.classList.add("empty");
    }
  }

  // === APPLY TEMPLATE ===
  function applyTemplate(index) {
    if (index === "" || index === null) return;

    const templates = TEMPLATES[editorState.format] || TEMPLATES.carre;
    const template = templates[parseInt(index)];

    if (!template) return;

    const textarea = document.getElementById("popup-editor-textarea");

    if (
      textarea.value.trim() &&
      textarea.value !== editorState.originalContent
    ) {
      if (
        !confirm("Le contenu actuel sera remplacé par le template. Continuer ?")
      ) {
        document.querySelector(".popup-editor-template-select").value = "";
        return;
      }
    }

    textarea.value = template.html;
    onContentChange();

    document.querySelector(".popup-editor-template-select").value = "";

    console.log("📝 Template appliqué:", template.name);
  }

  // === SAVE ===
  async function save() {
    const textarea = document.getElementById("popup-editor-textarea");
    const saveBtn = document.getElementById("popup-editor-save-btn");
    const statusEl = document.getElementById("popup-editor-status");

    const htmlContent = textarea.value;

    try {
      saveBtn.disabled = true;
      saveBtn.innerHTML = "⏳ Sauvegarde...";
      statusEl.textContent = "Sauvegarde en cours...";
      statusEl.className = "popup-editor-status loading";

      const token = getToken();

      const response = await fetch(`${EDITOR_CONFIG.apiBase}/save.php`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: token ? `Bearer ${token}` : "",
        },
        body: JSON.stringify({
          space_slug: editorState.spaceSlug,
          zone_slug: editorState.zoneSlug,
          object_name: editorState.objectName,
          shader_name: editorState.shaderName,
          format: editorState.format,
          html_content: htmlContent,
          auth_token: token, // Fallback OVH
        }),
      });

      const result = await response.json();

      if (result.success) {
        editorState.originalContent = htmlContent;
        editorState.hasChanges = false;

        statusEl.textContent = "✓ Sauvegardé !";
        statusEl.className = "popup-editor-status success";

        saveBtn.innerHTML = "✓ Sauvegardé";

        // Notifier popup-viewer de recharger
        if (window.popupViewer && window.popupViewer.reloadContent) {
          window.popupViewer.reloadContent(editorState.objectName);
        }

        // Fermer après délai
        setTimeout(() => {
          closeEditor();
        }, 1000);
      } else {
        throw new Error(result.error || "Erreur de sauvegarde");
      }
    } catch (error) {
      console.error("Popup Editor: Erreur sauvegarde", error);
      statusEl.textContent = "✗ " + error.message;
      statusEl.className = "popup-editor-status error";
      saveBtn.disabled = false;
      saveBtn.innerHTML = "💾 Sauvegarder";
    }
  }

  // === CLOSE ===
  function closeEditor() {
    if (editorState.hasChanges) {
      if (
        !confirm(
          "Vous avez des modifications non sauvegardées. Fermer quand même ?"
        )
      ) {
        return;
      }
    }

    const overlay = document.getElementById("popup-editor-overlay");
    if (overlay) {
      overlay.classList.remove("active");
      setTimeout(() => {
        overlay.remove();
      }, 300);
    }

    document.removeEventListener("keydown", handleKeyDown);
    clearTimeout(editorState.debounceTimer);

    editorState.isOpen = false;
    editorState.objectName = null;
    editorState.hasChanges = false;

    console.log("📝 Popup Editor: Fermé");
  }

  // === KEYBOARD HANDLER ===
  function handleKeyDown(e) {
    if (e.key === "Escape") {
      closeEditor();
    }
    if (e.ctrlKey && e.key === "s") {
      e.preventDefault();
      save();
    }
  }

  // === EXPOSE API ===
  window.popupEditor = {
    open: openEditor,
    close: closeEditor,
    save: save,
    applyTemplate: applyTemplate,
    isOpen: () => editorState.isOpen,
  };

  console.log("📝 Popup Editor module chargé (v2.0 - preview scalé)");
})();
