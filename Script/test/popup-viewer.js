/**
 * ============================================
 * 👁️ POPUP VIEWER - ATLANTIS CITY
 * Module de popups avec système de vues
 * ============================================
 *
 * Deux modes d'affichage :
 * - VIEWER : Popup épurée, juste le contenu HTML du client
 * - ADMIN : Popup complète avec header, badges, toolbar
 *
 * v3.2 - Utilisation de srcdoc (fix sandbox security)
 */

(function () {
  if (window.__atlantisPopupViewerInit) return;
  window.__atlantisPopupViewerInit = true;

  const viewer = WALK.getViewer();

  // ============================================
  // 📦 CONFIGURATION CENTRALISÉE
  // ============================================

  const CONFIG = {
    spaceSlug: "scenetest", // À adapter selon l'espace
    plvBaseUrl: "https://compagnon.atlantis-city.com/plv",
    apiBase: "https://compagnon.atlantis-city.com/api",

    // Configuration des objets (structure, pas contenu)
    objects: {
      c1_obj: {
        id: "c1_obj",
        shader: "c1_shdr",
        file: "template_C1.png",
        format: "carre",
        ratio: "1:1",
        resolution: "1024 × 1024",
        icon: "⬜",
        title: "PLV Carré",
        opaque: true,
        zoneSlug: "mascenetest-zone1",
        content: {
          hasContent: false,
          html: "",
          templateType: null,
          templateConfig: null,
        },
      },

      l1_obj: {
        id: "l1_obj",
        shader: "l1_shdr",
        file: "template_L1.png",
        format: "paysage",
        ratio: "16:9",
        resolution: "1920 × 1080",
        icon: "🌅",
        title: "PLV Paysage",
        opaque: true,
        zoneSlug: "mascenetest-zone2",
        content: {
          hasContent: false,
          html: "",
          templateType: null,
          templateConfig: null,
        },
      },

      l2_obj: {
        id: "l2_obj",
        shader: "l2_shdr",
        file: "template_L2.png",
        format: "paysage",
        ratio: "16:9",
        resolution: "1920 × 1080",
        icon: "🌅",
        title: "PLV Paysage 2",
        opaque: false,
        zoneSlug: "mascenetest-zone2",
        content: {
          hasContent: false,
          html: "",
          templateType: null,
          templateConfig: null,
        },
      },

      p1_obj: {
        id: "p1_obj",
        shader: "p1_shdr",
        file: "template_P1.png",
        format: "portrait",
        ratio: "9:16",
        resolution: "1080 × 1920",
        icon: "📱",
        title: "PLV Portrait",
        opaque: true,
        zoneSlug: "mascenetest-zone2",
        content: {
          hasContent: false,
          html: "",
          templateType: null,
          templateConfig: null,
        },
      },

      p2_obj: {
        id: "p2_obj",
        shader: "p2_shdr",
        file: "template_P2.png",
        format: "portrait",
        ratio: "9:16",
        resolution: "1080 × 1920",
        icon: "📱",
        title: "PLV Portrait 2",
        opaque: false,
        zoneSlug: null,
        content: {
          hasContent: false,
          html: "",
          templateType: null,
          templateConfig: null,
        },
      },

      c2_obj: {
        id: "c2_obj",
        shader: "c2_shdr",
        file: "template_C2.png",
        format: "carre",
        ratio: "1:1",
        resolution: "1024 × 1024",
        icon: "⬜",
        title: "PLV Carré 2",
        opaque: false,
        zoneSlug: null,
        content: {
          hasContent: false,
          html: "",
          templateType: null,
          templateConfig: null,
        },
      },
    },
  };

  // State
  let currentPopup = null;
  let currentObjectName = null;
  let currentView = "main";
  let viewHistory = [];
  let registeredViews = {};
  let contentsLoaded = false;

  // ============================================
  // 🛠️ HELPERS
  // ============================================

  /**
   * Échappe le HTML pour l'attribut srcdoc
   * Double-escape pour les guillemets dans l'attribut HTML
   */
  function escapeSrcdoc(html) {
    if (!html) return "";
    return html.replace(/&/g, "&amp;").replace(/"/g, "&quot;");
  }

  // ============================================
  // 🖼️ RENDU NATIF / IFRAME
  // ============================================

  /**
   * Détermine si le contenu nécessite un iframe
   * - Templates iframe/youtube explicites
   * - Documents HTML complets (<!DOCTYPE ou <html)
   *
   * @param {string} templateType - Type de template
   * @param {string} html - Contenu HTML (optionnel)
   * @returns {boolean}
   */
  function needsIframe(templateType, html = "") {
    // Templates explicitement iframe
    if (templateType === "iframe" || templateType === "youtube") {
      return true;
    }

    // Documents HTML complets → iframe obligatoire
    // (sinon les styles dans <head> sont ignorés)
    if (html) {
      const trimmed = html.trim().toLowerCase();
      if (trimmed.startsWith("<!doctype") || trimmed.startsWith("<html")) {
        return true;
      }
    }

    return false;
  }

  /**
   * Génère le HTML complet pour un iframe (wrapper si nécessaire)
   */
  function generateIframeContent(html) {
    // Si c'est déjà un document complet, l'utiliser tel quel
    const trimmed = html.trim().toLowerCase();
    if (trimmed.startsWith("<!doctype") || trimmed.startsWith("<html")) {
      return html;
    }

    // Sinon wrapper dans un document
    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body { 
      width: 100%; 
      height: 100%; 
      overflow: auto;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: transparent;
    }
    body {
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100%;
    }
    body > * { max-width: 100%; }
    iframe { border: none; }
  </style>
</head>
<body>${html}</body>
</html>`;
  }

  /**
   * Crée un iframe avec srcdoc (pas besoin de allow-same-origin)
   */
  function createIframeWithSrcdoc(html, id = "popup-content-iframe") {
    const fullContent = generateIframeContent(html);
    return `<iframe 
      id="${id}" 
      class="popup-content-iframe"
      srcdoc="${escapeSrcdoc(fullContent)}"
      sandbox="allow-scripts allow-popups allow-forms"
      frameborder="0"
    ></iframe>`;
  }

  /**
   * Rendu du contenu - Natif ou Iframe selon le template et le contenu
   */
  function renderContent(
    objectConfig,
    containerId = "popup-content-container"
  ) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const { html, templateType } = objectConfig.content || {};

    if (!html) {
      container.innerHTML = "";
      return;
    }

    if (needsIframe(templateType, html)) {
      // Utiliser iframe avec srcdoc
      container.innerHTML = createIframeWithSrcdoc(html);
    } else {
      // Rendu natif direct
      container.innerHTML = `<div class="popup-native-content">${html}</div>`;
    }
  }

  // ============================================
  // 📡 CHARGEMENT DES CONTENUS DEPUIS L'API
  // ============================================

  async function loadContentsFromAPI() {
    try {
      console.log("👁️ Popup: Chargement des contenus depuis l'API...");

      const response = await fetch(
        `${CONFIG.apiBase}/popups/list.php?space_slug=${CONFIG.spaceSlug}`
      );
      const result = await response.json();

      if (result.success && result.data?.popups) {
        const popups = result.data.popups;
        let loadedCount = 0;

        Object.keys(popups).forEach((objectName) => {
          if (CONFIG.objects[objectName]) {
            const popup = popups[objectName];
            CONFIG.objects[objectName].content = {
              hasContent: !!popup.html_content,
              html: popup.html_content || "",
              templateType: popup.template_type || null,
              templateConfig: popup.template_config || null,
            };
            loadedCount++;
          }
        });

        contentsLoaded = true;
        console.log(`👁️ Popup: ${loadedCount} contenus chargés depuis l'API`);
      } else {
        console.warn("👁️ Popup: Aucun contenu trouvé dans l'API");
      }
    } catch (error) {
      console.error("👁️ Popup: Erreur chargement API", error);
    }
  }

  async function reloadContent(objectName) {
    try {
      console.log(`👁️ Popup: Rechargement du contenu pour ${objectName}...`);

      const response = await fetch(
        `${CONFIG.apiBase}/popups/get.php?space_slug=${CONFIG.spaceSlug}&object_name=${objectName}`
      );
      const result = await response.json();

      if (result.success && result.data?.popup) {
        if (CONFIG.objects[objectName]) {
          const popup = result.data.popup;
          CONFIG.objects[objectName].content = {
            hasContent: !!popup.html_content,
            html: popup.html_content || "",
            templateType: popup.template_type || null,
            templateConfig: popup.template_config || null,
          };
          console.log(`👁️ Popup: Contenu rechargé pour ${objectName}`);

          if (currentObjectName === objectName && currentPopup) {
            refreshCurrentPopup();
          }
        }
      }
    } catch (error) {
      console.error(`👁️ Popup: Erreur rechargement ${objectName}`, error);
    }
  }

  function refreshCurrentPopup() {
    if (!currentObjectName || !currentPopup) return;

    const objectConfig = CONFIG.objects[currentObjectName];
    if (!objectConfig) return;

    if (currentView === "main") {
      renderContent(objectConfig, "popup-content-container");
    }

    console.log(`👁️ Popup: Affichage rafraîchi pour ${currentObjectName}`);
  }

  // ============================================
  // 🔐 VÉRIFICATION DES PERMISSIONS
  // ============================================

  function isAdmin() {
    if (!window.atlantisAuth || !window.atlantisAuth.isLoggedIn()) return false;
    const user = window.atlantisAuth.getUser();
    if (!user) return false;

    if (user.global_role === "super_admin") return true;

    const roles = user.space_roles || [];
    return roles.some(
      (r) =>
        r.space_slug === CONFIG.spaceSlug &&
        ["space_admin", "zone_admin"].includes(r.role)
    );
  }

  function canAccessObject(objectConfig) {
    if (!window.atlantisAuth || !window.atlantisAuth.isLoggedIn()) return false;
    const user = window.atlantisAuth.getUser();
    if (!user) return false;

    if (user.global_role === "super_admin") return true;

    const roles = user.space_roles || [];
    const spaceRole = roles.find(
      (r) => r.space_slug === CONFIG.spaceSlug && r.role === "space_admin"
    );
    if (spaceRole) return true;

    if (objectConfig.zoneSlug) {
      const zoneRole = roles.find(
        (r) =>
          r.space_slug === CONFIG.spaceSlug &&
          r.zone_slug === objectConfig.zoneSlug &&
          r.role === "zone_admin"
      );
      if (zoneRole) return true;
    }

    return false;
  }

  // ============================================
  // 🖼️ URL IMAGES
  // ============================================

  function getImageUrl(objectConfig) {
    const version = Date.now();
    return `${CONFIG.plvBaseUrl}/${CONFIG.spaceSlug}/${objectConfig.file}?v=${version}`;
  }

  // ============================================
  // 🎨 GÉNÉRATION HTML
  // ============================================

  /**
   * Popup VIEWER : Contenu seul
   */
  function createViewerPopupHTML(objectConfig) {
    const hasContent = objectConfig.content?.hasContent;

    if (!hasContent) {
      return `<div class="popup-viewer-overlay-clean"></div>`;
    }

    const html = objectConfig.content?.html || "";
    const templateType = objectConfig.content?.templateType;
    const useIframe = needsIframe(templateType, html);

    // Format class pour le sizing
    const formatClass = `format-${objectConfig.format}`;

    return `
      <div class="popup-viewer-overlay-clean">
        <div class="popup-viewer-canvas ${formatClass}" id="popup-content-container">
          <button class="popup-viewer-close-btn" onclick="window.atlantisPopup.close()" title="Fermer">✕</button>
          ${
            useIframe
              ? createIframeWithSrcdoc(html)
              : `<div class="popup-native-content">${html}</div>`
          }
        </div>
      </div>
    `;
  }

  /**
   * Vue principale Admin
   */
  function renderAdminMainView(objectConfig) {
    const hasContent = objectConfig.content?.hasContent;

    if (hasContent) {
      const html = objectConfig.content?.html || "";
      const templateType = objectConfig.content?.templateType;
      const useIframe = needsIframe(templateType, html);

      return `
        <div class="popup-admin-preview">
          <div class="popup-admin-preview-label">Aperçu du contenu client</div>
          <div class="popup-admin-preview-frame" id="popup-content-container">
            ${
              useIframe
                ? createIframeWithSrcdoc(html)
                : `<div class="popup-native-content">${html}</div>`
            }
          </div>
        </div>
      `;
    } else {
      return `
        <div class="popup-admin-empty">
          <div class="popup-admin-empty-icon">📝</div>
          <h3>Aucun contenu configuré</h3>
          <p>Utilisez le bouton "Modifier le contenu" pour créer le contenu de cette popup.</p>
          <div class="popup-admin-info-grid">
            <div class="info-item">
              <span class="label">Format</span>
              <span class="value">${objectConfig.format} (${objectConfig.ratio})</span>
            </div>
            <div class="info-item">
              <span class="label">Résolution</span>
              <span class="value">${objectConfig.resolution}</span>
            </div>
            <div class="info-item">
              <span class="label">Image actuelle</span>
              <span class="value">${objectConfig.file}</span>
            </div>
          </div>
        </div>
      `;
    }
  }

  function createAdminPopupHTML(objectConfig) {
    return `
      <div class="popup-viewer-container popup-viewer-mode-admin" data-object="${
        objectConfig.id
      }" data-format="${objectConfig.format}">
        <div class="popup-viewer-header">
          <h2 class="popup-viewer-title">
            <span class="icon">${objectConfig.icon}</span>
            <span class="popup-viewer-title-text">${objectConfig.title}</span>
          </h2>
          <div class="popup-viewer-badges">
            <span class="popup-viewer-badge format">${objectConfig.ratio}</span>
            <span class="popup-viewer-badge ${
              objectConfig.opaque ? "opaque" : "transparent"
            }">
              ${objectConfig.opaque ? "🔶 Opaque" : "💠 Transparent"}
            </span>
          </div>
          <button class="popup-viewer-close" onclick="window.atlantisPopup.close()">✕</button>
        </div>
        
        <div class="popup-viewer-body" id="popup-view-container">
          ${renderAdminMainView(objectConfig)}
        </div>
        
        <div class="popup-viewer-admin-zone" id="popup-admin-zone"></div>
        
        <div class="popup-viewer-footer" id="popup-footer">
          <button class="popup-viewer-btn popup-viewer-btn-close" onclick="window.atlantisPopup.close()">Fermer</button>
        </div>
      </div>
    `;
  }

  // ============================================
  // 🧭 SYSTÈME DE NAVIGATION (Admin uniquement)
  // ============================================

  function registerView(viewName, viewModule) {
    registeredViews[viewName] = viewModule;
    console.log(`👁️ Popup: Vue "${viewName}" enregistrée`);
  }

  function navigateTo(viewName, params = {}) {
    if (!currentPopup) return;
    if (!isAdmin()) return;

    const objectConfig = CONFIG.objects[currentObjectName];
    if (!objectConfig) return;

    if (currentView !== viewName) {
      viewHistory.push(currentView);
    }

    if (registeredViews[currentView]?.onHide) {
      registeredViews[currentView].onHide();
    }

    currentView = viewName;

    const container = document.getElementById("popup-view-container");
    const footer = document.getElementById("popup-footer");
    const adminZone = document.getElementById("popup-admin-zone");
    const titleText = document.querySelector(".popup-viewer-title-text");

    if (!container || !footer) return;

    if (viewName === "main") {
      container.innerHTML = renderAdminMainView(objectConfig);

      if (titleText) titleText.textContent = objectConfig.title;
      footer.innerHTML = `<button class="popup-viewer-btn popup-viewer-btn-close" onclick="window.atlantisPopup.close()">Fermer</button>`;
      if (adminZone) adminZone.style.display = "";

      window.dispatchEvent(
        new CustomEvent("atlantis-popup-view-changed", {
          detail: {
            viewName: "main",
            objectName: currentObjectName,
            objectConfig,
          },
        })
      );
    } else if (registeredViews[viewName]) {
      const viewModule = registeredViews[viewName];

      if (viewModule.getTitle && titleText) {
        titleText.textContent = viewModule.getTitle(objectConfig);
      }

      if (adminZone) adminZone.style.display = "none";

      container.innerHTML = viewModule.render(objectConfig, params);

      footer.innerHTML = `<button class="popup-viewer-btn popup-viewer-btn-back" onclick="window.atlantisPopup.goBack()">← Précédent</button>`;

      if (viewModule.onShow) {
        viewModule.onShow(objectConfig, params);
      }

      window.dispatchEvent(
        new CustomEvent("atlantis-popup-view-changed", {
          detail: { viewName, objectName: currentObjectName, objectConfig },
        })
      );
    }

    console.log(`👁️ Popup: Navigation → "${viewName}"`);
  }

  function goBack() {
    if (viewHistory.length > 0) {
      const previousView = viewHistory.pop();
      currentView = "";
      navigateTo(previousView);
    } else {
      navigateTo("main");
    }
  }

  // ============================================
  // 🎬 OUVERTURE / FERMETURE
  // ============================================

  function openPopup(objectName) {
    const objectConfig = CONFIG.objects[objectName];
    if (!objectConfig) return;

    const hasContent = objectConfig.content?.hasContent;
    const isAdminMode = isAdmin();

    // VIEWER : si pas de contenu, on n'ouvre pas
    if (!hasContent && !isAdminMode) {
      console.log(
        `👁️ Popup: ${objectName} - Pas de contenu, non admin → ignoré`
      );
      return;
    }

    closePopup();

    currentView = "main";
    viewHistory = [];

    const overlay = document.createElement("div");
    overlay.className = "popup-viewer-overlay";
    overlay.id = "popup-viewer-overlay";

    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) closePopup();
    });

    if (isAdminMode) {
      overlay.innerHTML = createAdminPopupHTML(objectConfig);
    } else {
      overlay.innerHTML = createViewerPopupHTML(objectConfig);
    }

    document.body.appendChild(overlay);
    requestAnimationFrame(() => overlay.classList.add("active"));

    currentPopup = overlay;
    currentObjectName = objectName;

    console.log(
      `👁️ Popup: Ouverte pour ${objectName} (mode: ${
        isAdminMode ? "admin" : "viewer"
      })`
    );

    window.dispatchEvent(
      new CustomEvent("atlantis-popup-opened", {
        detail: { objectName, objectConfig, isAdminMode },
      })
    );
  }

  function closePopup() {
    const overlay = document.getElementById("popup-viewer-overlay");
    if (overlay) {
      overlay.classList.remove("active");
      setTimeout(() => overlay.remove(), 300);
    }

    if (registeredViews[currentView]?.onHide) {
      registeredViews[currentView].onHide();
    }

    const prev = currentObjectName;
    currentPopup = null;
    currentObjectName = null;
    currentView = "main";
    viewHistory = [];

    if (prev) {
      window.dispatchEvent(
        new CustomEvent("atlantis-popup-closed", {
          detail: { objectName: prev },
        })
      );
    }
  }

  function refreshMainImage() {
    if (!currentObjectName) return;
    const objectConfig = CONFIG.objects[currentObjectName];
    if (!objectConfig) return;
    const imgs = document.querySelectorAll(
      ".popup-viewer-canvas img, .popup-admin-preview-frame img"
    );
    imgs.forEach((img) => {
      if (img.src.includes(CONFIG.plvBaseUrl)) {
        img.src = img.src.split("?")[0] + "?v=" + Date.now();
      }
    });
  }

  // ============================================
  // 🖱️ HANDLERS SHAPESPARK
  // ============================================

  function registerClickHandlers() {
    Object.keys(CONFIG.objects).forEach((objectName) => {
      viewer.onNodeTypeClicked(objectName, () => {
        console.log(`👁️ Popup: Clic sur ${objectName}`);
        openPopup(objectName);
        return true;
      });
    });
    console.log(`👁️ Popup: ${Object.keys(CONFIG.objects).length} handlers OK`);
  }

  // ============================================
  // 🚀 INIT
  // ============================================

  viewer.onSceneLoadComplete(async () => {
    await loadContentsFromAPI();
    registerClickHandlers();
    console.log("👁️ Popup Viewer: ✅ Prêt (v3.2 - srcdoc, secure sandbox)");
  });

  // ============================================
  // 🌐 API PUBLIQUE
  // ============================================

  window.atlantisPopup = {
    open: openPopup,
    close: closePopup,
    registerView,
    navigateTo,
    goBack,
    getConfig: (name) => CONFIG.objects[name] || null,
    getAllConfigs: () => CONFIG.objects,
    getSpaceSlug: () => CONFIG.spaceSlug,
    getApiBase: () => CONFIG.apiBase,
    getPlvBaseUrl: () => CONFIG.plvBaseUrl,
    isOpen: () => !!currentPopup,
    getCurrentObject: () => currentObjectName,
    getCurrentConfig: () =>
      currentObjectName ? CONFIG.objects[currentObjectName] : null,
    getCurrentView: () => currentView,
    isAdmin,
    canAccessObject,
    getImageUrl,
    refreshMainImage,
    reloadContent,
    refreshCurrentPopup,
    needsIframe,
  };

  window.popupViewer = {
    reloadContent,
  };
})();
