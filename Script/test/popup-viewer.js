/**
 * ============================================
 * 👁️ POPUP VIEWER - ATLANTIS CITY
 * Module de popups avec système de vues
 * ============================================
 *
 * Deux modes d'affichage :
 * - VIEWER : Popup épurée, juste le contenu HTML du client
 * - ADMIN : Popup complète avec header, badges, toolbar
 */

(function () {
  if (window.__atlantisPopupViewerInit) return;
  window.__atlantisPopupViewerInit = true;

  const viewer = WALK.getViewer();

  // ============================================
  // 📦 CONFIGURATION CENTRALISÉE
  // ============================================

  const CONFIG = {
    spaceSlug: "scenetest",
    plvBaseUrl: "https://compagnon.atlantis-city.com/plv",
    apiBase: "https://compagnon.atlantis-city.com/api",

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
          hasContent: true,
          html: `
<!-- ========================================
     TEMPLATE EXEMPLE - PLV CARRÉ
     Le client gère tout : image, texte, style, bouton fermer
======================================== -->
<style>
  .plv-popup-carre {
    font-family: 'Segoe UI', Roboto, sans-serif;
    color: #f1f5f9;
    text-align: center;
    padding: 30px;
    max-width: 500px;
    margin: 0 auto;
  }
  .plv-popup-carre .plv-image {
    width: 100%;
    max-width: 400px;
    border-radius: 16px;
    box-shadow: 0 10px 40px rgba(0,0,0,0.4);
    margin-bottom: 24px;
  }
  .plv-popup-carre h2 {
    font-size: 24px;
    font-weight: 700;
    margin: 0 0 12px 0;
    background: linear-gradient(135deg, #3b82f6, #8b5cf6);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }
  .plv-popup-carre p {
    font-size: 15px;
    line-height: 1.7;
    color: #94a3b8;
    margin: 0 0 20px 0;
  }
  .plv-popup-carre .plv-btn-close {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 14px 32px;
    font-size: 15px;
    font-weight: 600;
    color: white;
    background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
    border: none;
    border-radius: 12px;
    cursor: pointer;
    transition: all 0.2s ease;
    box-shadow: 0 4px 15px rgba(59, 130, 246, 0.3);
  }
  .plv-popup-carre .plv-btn-close:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 25px rgba(59, 130, 246, 0.4);
  }
</style>

<div class="plv-popup-carre">
  <img src="https://compagnon.atlantis-city.com/plv/scenetest/template_C1.png" alt="Visuel PLV" class="plv-image">
  <h2>✨ Bienvenue sur notre PLV interactif</h2>
  <p>Cet espace d'affichage est entièrement personnalisable. Vous pouvez y intégrer vos visuels, textes, liens et boutons d'action.</p>
  <button class="plv-btn-close" onclick="window.atlantisPopup.close()">
    Fermer
  </button>
</div>
          `,
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
          hasContent: true,
          html: `
<!-- ========================================
     TEMPLATE EXEMPLE - PLV PAYSAGE
     Design carte avec call-to-action
======================================== -->
<style>
  .plv-popup-paysage {
    font-family: 'Segoe UI', Roboto, sans-serif;
    color: #f1f5f9;
    padding: 20px;
  }
  .plv-popup-paysage .plv-card {
    background: linear-gradient(180deg, rgba(30,41,59,0.95) 0%, rgba(15,23,42,0.98) 100%);
    border: 1px solid rgba(99, 179, 237, 0.2);
    border-radius: 20px;
    overflow: hidden;
    max-width: 650px;
    margin: 0 auto;
  }
  .plv-popup-paysage .plv-image-container {
    position: relative;
    aspect-ratio: 16/9;
    overflow: hidden;
  }
  .plv-popup-paysage .plv-image {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
  .plv-popup-paysage .plv-badge {
    position: absolute;
    top: 16px;
    left: 16px;
    padding: 6px 14px;
    background: rgba(59, 130, 246, 0.9);
    color: white;
    font-size: 12px;
    font-weight: 700;
    text-transform: uppercase;
    border-radius: 20px;
  }
  .plv-popup-paysage .plv-body {
    padding: 24px;
  }
  .plv-popup-paysage h2 {
    font-size: 22px;
    font-weight: 700;
    margin: 0 0 12px 0;
    color: #f1f5f9;
  }
  .plv-popup-paysage p {
    font-size: 14px;
    line-height: 1.7;
    color: #94a3b8;
    margin: 0 0 20px 0;
  }
  .plv-popup-paysage .plv-actions {
    display: flex;
    gap: 12px;
    flex-wrap: wrap;
  }
  .plv-popup-paysage .plv-btn {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 12px 24px;
    font-size: 14px;
    font-weight: 600;
    border: none;
    border-radius: 10px;
    cursor: pointer;
    transition: all 0.2s ease;
  }
  .plv-popup-paysage .plv-btn-primary {
    background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
    color: white;
    box-shadow: 0 4px 15px rgba(34, 197, 94, 0.3);
  }
  .plv-popup-paysage .plv-btn-primary:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(34, 197, 94, 0.4);
  }
  .plv-popup-paysage .plv-btn-secondary {
    background: rgba(255,255,255,0.1);
    color: #94a3b8;
    border: 1px solid rgba(255,255,255,0.1);
  }
  .plv-popup-paysage .plv-btn-secondary:hover {
    background: rgba(255,255,255,0.15);
    color: #f1f5f9;
  }
</style>

<div class="plv-popup-paysage">
  <div class="plv-card">
    <div class="plv-image-container">
      <img src="https://compagnon.atlantis-city.com/plv/scenetest/template_L1.png" alt="Visuel panoramique" class="plv-image">
      <span class="plv-badge">🌟 Nouveau</span>
    </div>
    <div class="plv-body">
      <h2>Découvrez notre offre exclusive</h2>
      <p>Profitez d'une expérience immersive unique. Ce PLV interactif vous permet de présenter vos produits et services de manière innovante.</p>
      <div class="plv-actions">
        <button class="plv-btn plv-btn-primary">
          🚀 En savoir plus
        </button>
        <button class="plv-btn plv-btn-secondary" onclick="window.atlantisPopup.close()">
          Fermer
        </button>
      </div>
    </div>
  </div>
</div>
          `,
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
        content: { hasContent: false, html: "" },
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
          hasContent: true,
          html: `
<!-- ========================================
     TEMPLATE EXEMPLE - PLV PORTRAIT
     Design totem vertical
======================================== -->
<style>
  .plv-popup-portrait {
    font-family: 'Segoe UI', Roboto, sans-serif;
    color: #f1f5f9;
    padding: 20px;
    display: flex;
    justify-content: center;
  }
  .plv-popup-portrait .plv-totem {
    background: linear-gradient(180deg, #1e293b 0%, #0f172a 100%);
    border: 1px solid rgba(99, 179, 237, 0.15);
    border-radius: 24px;
    width: 100%;
    max-width: 380px;
    overflow: hidden;
    box-shadow: 0 20px 60px rgba(0,0,0,0.5);
  }
  .plv-popup-portrait .plv-image {
    width: 100%;
    aspect-ratio: 9/12;
    object-fit: cover;
  }
  .plv-popup-portrait .plv-content {
    padding: 24px;
    text-align: center;
  }
  .plv-popup-portrait .plv-icon {
    font-size: 48px;
    margin-bottom: 16px;
  }
  .plv-popup-portrait h2 {
    font-size: 20px;
    font-weight: 700;
    margin: 0 0 10px 0;
    color: #f1f5f9;
  }
  .plv-popup-portrait p {
    font-size: 14px;
    line-height: 1.6;
    color: #64748b;
    margin: 0 0 24px 0;
  }
  .plv-popup-portrait .plv-btn-close {
    width: 100%;
    padding: 16px;
    font-size: 15px;
    font-weight: 600;
    color: white;
    background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
    border: none;
    border-radius: 12px;
    cursor: pointer;
    transition: all 0.2s ease;
  }
  .plv-popup-portrait .plv-btn-close:hover {
    transform: scale(1.02);
    box-shadow: 0 6px 20px rgba(139, 92, 246, 0.4);
  }
</style>

<div class="plv-popup-portrait">
  <div class="plv-totem">
    <img src="https://compagnon.atlantis-city.com/plv/scenetest/template_P1.png" alt="Visuel portrait" class="plv-image">
    <div class="plv-content">
      <div class="plv-icon">📱</div>
      <h2>Format Portrait</h2>
      <p>Idéal pour les totems et affichages verticaux. Captez l'attention avec un visuel en hauteur.</p>
      <button class="plv-btn-close" onclick="window.atlantisPopup.close()">
        ✨ C'est compris !
      </button>
    </div>
  </div>
</div>
          `,
        },
      },
    },
  };

  // ============================================
  // 🔧 ÉTAT
  // ============================================

  let currentPopup = null;
  let currentObjectName = null;
  let currentView = "main";
  let viewHistory = [];
  let registeredViews = {};

  // ============================================
  // 🔐 HELPERS AUTH
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
        (r.role === "space_admin" || r.role === "zone_admin")
    );
  }

  function canAccessObject(objectConfig) {
    if (!window.atlantisAuth || !window.atlantisAuth.isLoggedIn()) return false;
    const user = window.atlantisAuth.getUser();
    if (!user) return false;
    if (user.global_role === "super_admin") return true;
    const roles = user.space_roles || [];
    if (
      roles.some(
        (r) => r.space_slug === CONFIG.spaceSlug && r.role === "space_admin"
      )
    )
      return true;
    if (objectConfig.zoneSlug) {
      return roles.some(
        (r) =>
          r.space_slug === CONFIG.spaceSlug &&
          r.zone_slug === objectConfig.zoneSlug &&
          r.role === "zone_admin"
      );
    }
    return false;
  }

  function getImageUrl(objectConfig) {
    return `${CONFIG.plvBaseUrl}/${CONFIG.spaceSlug}/${
      objectConfig.file
    }?v=${Date.now()}`;
  }

  // ============================================
  // 👁️ VUE VIEWER (utilisateur simple)
  // ============================================

  function createViewerPopupHTML(objectConfig) {
    // Popup épurée : juste le contenu HTML du client
    return `
      <div class="popup-viewer-container popup-viewer-mode-viewer" data-object="${objectConfig.id}" data-format="${objectConfig.format}">
        <div class="popup-viewer-canvas">
          ${objectConfig.content.html}
        </div>
      </div>
    `;
  }

  // ============================================
  // 🔧 VUE ADMIN
  // ============================================

  function renderAdminMainView(objectConfig) {
    const imageUrl = getImageUrl(objectConfig);
    const hasContent = objectConfig.content?.hasContent;

    if (hasContent) {
      // Admin voit le contenu configuré
      return `
        <div class="popup-admin-preview">
          <div class="popup-admin-preview-label">📄 Aperçu du contenu viewer :</div>
          <div class="popup-admin-preview-frame">
            ${objectConfig.content.html}
          </div>
        </div>
      `;
    } else {
      // Admin voit message "créer votre popup"
      return `
        <div class="popup-admin-empty">
          <div class="popup-admin-empty-icon">🎨</div>
          <h3>Créez votre popup</h3>
          <p>Aucun contenu n'est configuré pour ce PLV.</p>
          <p class="hint">Utilisez l'éditeur de contenu pour créer une popup personnalisée avec votre image, texte et boutons.</p>
          <div class="popup-admin-empty-info">
            <div class="info-item">
              <span class="label">Format</span>
              <span class="value">${objectConfig.ratio}</span>
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
    if (!isAdmin()) return; // Navigation réservée aux admins

    const objectConfig = CONFIG.objects[currentObjectName];
    if (!objectConfig) return;

    // Sauvegarder dans l'historique
    if (currentView !== viewName) {
      viewHistory.push(currentView);
    }

    // Notifier vue actuelle
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
      // Vue principale admin
      container.innerHTML = renderAdminMainView(objectConfig);
      if (titleText) titleText.textContent = objectConfig.title;
      footer.innerHTML = `<button class="popup-viewer-btn popup-viewer-btn-close" onclick="window.atlantisPopup.close()">Fermer</button>`;
      if (adminZone) adminZone.style.display = "";

      // Réinjecter toolbar admin
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
      // Vue externe (upload, etc.)
      const viewModule = registeredViews[viewName];

      if (viewModule.getTitle && titleText) {
        titleText.textContent = viewModule.getTitle(objectConfig);
      }

      if (adminZone) adminZone.style.display = "none";

      container.innerHTML = viewModule.render(objectConfig, params);

      // Bouton Précédent
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

    // Clic en dehors → fermer
    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) closePopup();
    });

    // Générer le HTML selon le mode
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
    // Refresh des images dans le contenu (si le client utilise des URLs dynamiques)
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

  viewer.onSceneLoadComplete(() => {
    registerClickHandlers();
    console.log("👁️ Popup Viewer: ✅ Prêt");
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
  };
})();
