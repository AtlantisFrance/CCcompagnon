/**
 * ============================================
 * 🖱️ CLICK CONTROLLER - ATLANTIS CITY
 * Écoute les clics Shapespark et décide l'action
 * ============================================
 * v1.0 - 2024-12-01 - Version initiale
 * v1.1 - 2024-12-10 - Ajout action "reload_plv"
 * ============================================
 *
 * 🧪 COMMANDES CONSOLE:
 * - popup_show("c1_obj")  → Affiche popup manuellement
 * - popup_list()          → Liste popups chargées
 * - popup_reload()        → Recharge toutes les popups
 * - popup_debug()         → Voir noms des objets cliqués
 * ============================================
 */

(function () {
  "use strict";

  // ============================================
  // 🔍 VÉRIFICATION DÉPENDANCES
  // ============================================

  if (!window.ATLANTIS_OBJECTS_CONFIG) {
    console.error(
      "❌ Click Controller: objects-config.js doit être chargé avant!"
    );
    return;
  }

  if (!window.atlantisPermissions) {
    console.error(
      "❌ Click Controller: permissions.js doit être chargé avant!"
    );
    return;
  }

  const CONFIG = window.ATLANTIS_OBJECTS_CONFIG;
  const PERMISSIONS = window.atlantisPermissions;

  // ============================================
  // ⚙️ CONFIGURATION
  // ============================================
  const POPUP_CONFIG = {
    baseUrl: "https://compagnon.atlantis-city.com/popups",
  };

  // État
  let loadedPopups = {};
  let manifest = null;
  let isInitialized = false;
  let currentDefaultPopup = null;

  // ============================================
  // 📦 CHARGEMENT MANIFEST & POPUPS
  // ============================================

  async function loadManifest() {
    const spaceSlug = window.ATLANTIS_SPACE || "default";
    const manifestUrl = `${
      POPUP_CONFIG.baseUrl
    }/${spaceSlug}/manifest.json?v=${Date.now()}`;

    try {
      const response = await fetch(manifestUrl);
      if (!response.ok) {
        console.log("ℹ️ Pas de manifest trouvé pour", spaceSlug);
        return null;
      }
      manifest = await response.json();
      console.log(
        "📋 Manifest chargé:",
        Object.keys(manifest.popups || {}).length,
        "popups"
      );
      return manifest;
    } catch (err) {
      console.warn("⚠️ Erreur chargement manifest:", err);
      return null;
    }
  }

  async function loadPopupScript(popupId) {
    const spaceSlug = window.ATLANTIS_SPACE || "default";
    const scriptUrl = `${
      POPUP_CONFIG.baseUrl
    }/${spaceSlug}/${popupId}-popup.js?v=${Date.now()}`;

    return new Promise((resolve) => {
      // Vérifier si déjà chargé
      if (window.atlantisPopups && window.atlantisPopups[popupId]) {
        loadedPopups[popupId] = true;
        resolve(true);
        return;
      }

      const script = document.createElement("script");
      script.src = scriptUrl;
      script.onload = () => {
        loadedPopups[popupId] = true;
        console.log(`✅ Popup ${popupId} chargée`);
        resolve(true);
      };
      script.onerror = () => {
        console.warn(`⚠️ Popup ${popupId} non trouvée`);
        resolve(false);
      };
      document.head.appendChild(script);
    });
  }

  async function loadAllPopups() {
    if (!manifest || !manifest.popups) {
      console.log("ℹ️ Aucune popup à charger");
      return;
    }

    const popupIds = Object.keys(manifest.popups);
    console.log(`🚀 Chargement de ${popupIds.length} popups...`);

    for (const popupId of popupIds) {
      await loadPopupScript(popupId);
    }

    console.log("✅ Toutes les popups sont chargées");
  }

  // ============================================
  // 🧹 NETTOYAGE NOM SHAPESPARK
  // ============================================

  /**
   * Nettoie le nom d'un objet Shapespark
   * "{part}c1_obj (2)" → "c1_obj"
   */
  function cleanNodeName(nodeName) {
    if (!nodeName) return null;

    return nodeName
      .replace(/^\{part\}/i, "") // Enlève {part} au début
      .replace(/\s*\(\d+\)\s*$/g, "") // Enlève (1), (2), etc. à la fin
      .trim();
  }

  // ============================================
  // 🖱️ GESTION DES CLICS
  // ============================================

  function setupClickHandlers() {
    // Attendre que Shapespark soit prêt
    if (typeof WALK === "undefined" || !WALK.getViewer) {
      console.warn("⚠️ WALK non disponible, réessai dans 1s...");
      setTimeout(setupClickHandlers, 1000);
      return;
    }

    const viewer = WALK.getViewer();

    // Attendre que la scène soit chargée
    viewer.onSceneLoadComplete(function () {
      console.log("🎯 Configuration des triggers click-controller");

      // Gestionnaire de clics
      viewer.onNodeTypeClicked(function (node) {
        const objectName = node.config?.name;

        if (!objectName) {
          return false;
        }

        return handleNodeClick(objectName, node);
      });

      console.log("🖱️ Click Controller activé");
    });
  }

  function handleNodeClick(nodeName, node) {
    // Nettoyer le nom
    const cleanName = cleanNodeName(nodeName);

    if (cleanName !== nodeName) {
      console.log("🖱️ Clic:", nodeName, "→", cleanName);
    } else {
      console.log("🖱️ Clic:", cleanName);
    }

    // Récupérer la config de l'objet
    const objConfig = CONFIG[cleanName];

    // Si pas dans la config, essayer avec le nom original
    const finalConfig = objConfig || CONFIG[nodeName];
    const objectId = objConfig
      ? cleanName
      : CONFIG[nodeName]
      ? nodeName
      : cleanName;

    if (!finalConfig) {
      // Objet non configuré - vérifier s'il y a une popup existante
      if (window.atlantisPopups && window.atlantisPopups[cleanName]) {
        showPopupWithAdminButtons(cleanName);
        return true;
      }

      // Essayer de charger la popup
      loadPopupScript(cleanName).then((loaded) => {
        if (
          loaded &&
          window.atlantisPopups &&
          window.atlantisPopups[cleanName]
        ) {
          showPopupWithAdminButtons(cleanName);
        }
      });

      return false;
    }

    // Objet configuré - exécuter l'action selon onClick
    return executeClickAction(objectId, finalConfig);
  }

  // ============================================
  // ============================================
  // ⚡ EXÉCUTION DES ACTIONS
  // ============================================
  // ============================================

  /**
   * Exécute l'action configurée pour le clic
   *
   * Actions disponibles:
   *   - "popup"       → Affiche une popup
   *   - "upload"      → Ouvre le modal upload (admin)
   *   - "url"         → Ouvre un lien externe
   *   - "reload_plv"  → Recharge toutes les textures PLV
   */
  function executeClickAction(objectId, config) {
    const onClick = config.onClick;

    switch (onClick) {
      // ─────────────────────────────────────────
      // 📋 POPUP - Affiche une popup
      // ─────────────────────────────────────────
      case "popup":
        handlePopupAction(objectId, config);
        return true;

      // ─────────────────────────────────────────
      // 📤 UPLOAD - Ouvre le modal upload (admin)
      // ─────────────────────────────────────────
      case "upload":
        handleUploadAction(objectId, config);
        return true;

      // ─────────────────────────────────────────
      // 🔗 URL - Ouvre un lien externe
      // ─────────────────────────────────────────
      case "url":
        if (config.url) {
          window.open(config.url, "_blank");
        }
        return true;

      // ─────────────────────────────────────────
      // 🔄 RELOAD_PLV - Recharge les textures
      // ─────────────────────────────────────────
      case "reload_plv":
        handleReloadPLVAction(objectId);
        return true;

      // ─────────────────────────────────────────
      // ❓ PAS D'ACTION
      // ─────────────────────────────────────────
      case null:
      case undefined:
        // Pas d'action au clic pour les visiteurs
        // Mais si admin, montrer popup par défaut
        const access = PERMISSIONS.checkObjectAccess(objectId);
        if (access.canEdit || access.canUpload) {
          showDefaultAdminPopup(objectId, config);
        }
        return false;

      // ─────────────────────────────────────────
      // ⚠️ ACTION INCONNUE
      // ─────────────────────────────────────────
      default:
        console.warn("⚠️ Action inconnue:", onClick);
        return false;
    }
  }

  // ============================================
  // 🔄 ACTION: RELOAD PLV
  // ============================================

  /**
   * Recharge toutes les textures PLV
   * Utilise la fonction globale de autotextures.js
   */
  function handleReloadPLVAction(objectId) {
    console.log("🔄 Action reload_plv déclenchée par:", objectId);

    if (typeof window.reloadPLVTextures === "function") {
      window.reloadPLVTextures();
      console.log("✅ Rechargement des textures lancé");
    } else {
      console.error(
        "❌ reloadPLVTextures non disponible (autotextures.js chargé ?)"
      );
    }
  }

  // ============================================
  // 📋 ACTION: POPUP
  // ============================================

  /**
   * Gère l'action popup
   */
  function handlePopupAction(objectId, config) {
    // Vérifier si la popup existe
    if (window.atlantisPopups && window.atlantisPopups[objectId]) {
      showPopupWithAdminButtons(objectId, config);
      return;
    }

    // Essayer de charger la popup
    loadPopupScript(objectId).then((loaded) => {
      if (loaded && window.atlantisPopups && window.atlantisPopups[objectId]) {
        showPopupWithAdminButtons(objectId, config);
      } else {
        // Popup non trouvée
        const access = PERMISSIONS.checkObjectAccess(objectId);
        if (access.canEdit || access.canUpload) {
          // Admin → montrer popup par défaut
          showDefaultAdminPopup(objectId, config);
        } else {
          console.log("ℹ️ Pas de popup configurée pour:", objectId);
        }
      }
    });
  }

  // ============================================
  // 📤 ACTION: UPLOAD
  // ============================================

  /**
   * Gère l'action upload directe
   */
  function handleUploadAction(objectId, config) {
    const access = PERMISSIONS.checkObjectAccess(objectId);

    if (!access.canUpload) {
      console.warn("⛔ Pas de permission d'upload pour:", objectId);
      return;
    }

    openUploadModal(objectId, config);
  }

  // ============================================
  // 🎨 AFFICHAGE POPUP AVEC BOUTONS ADMIN
  // ============================================

  function showPopupWithAdminButtons(objectId, config) {
    // Afficher la popup
    if (window.atlantisPopups && window.atlantisPopups[objectId]) {
      window.atlantisPopups[objectId].show();

      // Vérifier si on doit ajouter les boutons admin
      const access = PERMISSIONS.checkObjectAccess(objectId);
      if (access.canEdit || access.canUpload) {
        addAdminButtonsToPopup(objectId, config, access);
      }
    }
  }

  function addAdminButtonsToPopup(objectId, config, access) {
    // Attendre que la popup soit dans le DOM
    setTimeout(() => {
      // Chercher le container de la popup
      const popupOverlay = document.querySelector(
        `.atlantis-popup-overlay[data-popup-id="${objectId}"]`
      );
      if (!popupOverlay) return;

      // Vérifier si boutons déjà ajoutés
      if (popupOverlay.querySelector(".atlantis-admin-buttons")) return;

      // Récupérer les boutons autorisés depuis la config
      const allowedButtons = config?.adminButtons || ["edit"];

      // Créer le container des boutons
      const buttonsContainer = document.createElement("div");
      buttonsContainer.className = "atlantis-admin-buttons";
      buttonsContainer.style.cssText = `
        position: absolute;
        top: 10px;
        right: 50px;
        display: flex;
        gap: 8px;
        z-index: 10001;
      `;

      // Bouton Éditer
      if (access.canEdit && allowedButtons.includes("edit")) {
        const editBtn = document.createElement("button");
        editBtn.innerHTML = "🎨 Éditer";
        editBtn.style.cssText = `
          padding: 8px 16px;
          background: linear-gradient(135deg, #8b5cf6, #7c3aed);
          color: white;
          border: none;
          border-radius: 20px;
          cursor: pointer;
          font-size: 14px;
          font-weight: 600;
          box-shadow: 0 2px 10px rgba(139, 92, 246, 0.3);
          transition: all 0.2s ease;
        `;
        editBtn.addEventListener("mouseenter", () => {
          editBtn.style.transform = "translateY(-2px)";
          editBtn.style.boxShadow = "0 4px 15px rgba(139, 92, 246, 0.4)";
        });
        editBtn.addEventListener("mouseleave", () => {
          editBtn.style.transform = "translateY(0)";
          editBtn.style.boxShadow = "0 2px 10px rgba(139, 92, 246, 0.3)";
        });
        editBtn.addEventListener("click", () => {
          closePopup(objectId);
          openTemplateEditor(objectId);
        });
        buttonsContainer.appendChild(editBtn);
      }

      // Bouton Upload
      if (access.canUpload && allowedButtons.includes("upload")) {
        const uploadBtn = document.createElement("button");
        uploadBtn.innerHTML = "📤 Upload";
        uploadBtn.style.cssText = `
          padding: 8px 16px;
          background: linear-gradient(135deg, #3b82f6, #2563eb);
          color: white;
          border: none;
          border-radius: 20px;
          cursor: pointer;
          font-size: 14px;
          font-weight: 600;
          box-shadow: 0 2px 10px rgba(59, 130, 246, 0.3);
          transition: all 0.2s ease;
        `;
        uploadBtn.addEventListener("mouseenter", () => {
          uploadBtn.style.transform = "translateY(-2px)";
          uploadBtn.style.boxShadow = "0 4px 15px rgba(59, 130, 246, 0.4)";
        });
        uploadBtn.addEventListener("mouseleave", () => {
          uploadBtn.style.transform = "translateY(0)";
          uploadBtn.style.boxShadow = "0 2px 10px rgba(59, 130, 246, 0.3)";
        });
        uploadBtn.addEventListener("click", () => {
          closePopup(objectId);
          openUploadModal(objectId, config);
        });
        buttonsContainer.appendChild(uploadBtn);
      }

      // Ajouter au popup
      const popupContainer = popupOverlay.querySelector(
        ".atlantis-popup-container"
      );
      if (popupContainer) {
        popupContainer.style.position = "relative";
        popupContainer.appendChild(buttonsContainer);
      }
    }, 100);
  }

  // ============================================
  // 🆕 POPUP PAR DÉFAUT (ADMIN)
  // ============================================

  function showDefaultAdminPopup(objectId, config) {
    // Fermer si déjà ouverte
    closeDefaultAdminPopup();

    const access = PERMISSIONS.checkObjectAccess(objectId);
    const allowedButtons = config?.adminButtons || ["edit"];

    // Construire les boutons
    let buttonsHTML = "";

    if (access.canEdit && allowedButtons.includes("edit")) {
      buttonsHTML += `
        <button class="atlantis-default-popup-btn atlantis-default-popup-btn-edit" data-action="edit">
          🎨 Créer le contenu
        </button>
      `;
    }

    if (access.canUpload && allowedButtons.includes("upload")) {
      buttonsHTML += `
        <button class="atlantis-default-popup-btn atlantis-default-popup-btn-upload" data-action="upload">
          📤 Uploader une image
        </button>
      `;
    }

    // Créer l'overlay
    const overlay = document.createElement("div");
    overlay.className = "atlantis-default-popup-overlay";
    overlay.innerHTML = `
      <style>
        .atlantis-default-popup-overlay {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: rgba(0, 0, 0, 0.8);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 100000;
          opacity: 0;
          transition: opacity 0.3s ease;
        }
        .atlantis-default-popup-overlay.active {
          opacity: 1;
        }
        .atlantis-default-popup-container {
          background: linear-gradient(145deg, #1e293b, #0f172a);
          border-radius: 16px;
          padding: 32px;
          max-width: 450px;
          width: 90%;
          box-shadow: 0 25px 50px rgba(0, 0, 0, 0.5);
          border: 1px solid rgba(255, 255, 255, 0.1);
          transform: translateY(20px);
          transition: transform 0.3s ease;
        }
        .atlantis-default-popup-overlay.active .atlantis-default-popup-container {
          transform: translateY(0);
        }
        .atlantis-default-popup-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 24px;
          padding-bottom: 16px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }
        .atlantis-default-popup-title {
          color: #f1f5f9;
          font-size: 20px;
          font-weight: 600;
          margin: 0;
        }
        .atlantis-default-popup-close {
          background: rgba(255, 255, 255, 0.1);
          border: none;
          color: #94a3b8;
          font-size: 24px;
          cursor: pointer;
          padding: 4px 12px;
          border-radius: 8px;
          transition: all 0.2s ease;
        }
        .atlantis-default-popup-close:hover {
          background: rgba(239, 68, 68, 0.2);
          color: #ef4444;
        }
        .atlantis-default-popup-badge {
          display: inline-block;
          background: linear-gradient(135deg, #8b5cf6, #7c3aed);
          color: white;
          padding: 4px 12px;
          border-radius: 12px;
          font-size: 12px;
          font-weight: 600;
          margin-bottom: 16px;
        }
        .atlantis-default-popup-message {
          color: #94a3b8;
          font-size: 15px;
          line-height: 1.6;
          margin-bottom: 24px;
        }
        .atlantis-default-popup-actions {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .atlantis-default-popup-btn {
          padding: 14px 24px;
          border: none;
          border-radius: 12px;
          font-size: 15px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
        }
        .atlantis-default-popup-btn-edit {
          background: linear-gradient(135deg, #8b5cf6, #7c3aed);
          color: white;
        }
        .atlantis-default-popup-btn-edit:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 15px rgba(139, 92, 246, 0.4);
        }
        .atlantis-default-popup-btn-upload {
          background: linear-gradient(135deg, #3b82f6, #2563eb);
          color: white;
        }
        .atlantis-default-popup-btn-upload:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 15px rgba(59, 130, 246, 0.4);
        }
        .atlantis-default-popup-footer {
          margin-top: 24px;
          padding-top: 16px;
          border-top: 1px solid rgba(255, 255, 255, 0.1);
          text-align: center;
        }
        .atlantis-default-popup-hint {
          color: #64748b;
          font-size: 13px;
        }
      </style>
      
      <div class="atlantis-default-popup-container">
        <div class="atlantis-default-popup-header">
          <h3 class="atlantis-default-popup-title">📦 ${objectId}</h3>
          <button class="atlantis-default-popup-close">×</button>
        </div>
        
        <div class="atlantis-default-popup-content">
          <span class="atlantis-default-popup-badge">🔐 Mode Admin</span>
          
          <p class="atlantis-default-popup-message">
            Aucun contenu n'est encore configuré pour cet objet.<br>
            En tant qu'administrateur, vous pouvez :
          </p>
          
          <div class="atlantis-default-popup-actions">
            ${buttonsHTML}
          </div>
        </div>
        
        <div class="atlantis-default-popup-footer">
          <span class="atlantis-default-popup-hint">💡 Les visiteurs ne voient pas cette popup</span>
        </div>
      </div>
    `;

    document.body.appendChild(overlay);
    currentDefaultPopup = overlay;

    // Animation d'entrée
    requestAnimationFrame(() => {
      overlay.classList.add("active");
    });

    // Events
    overlay
      .querySelector(".atlantis-default-popup-close")
      .addEventListener("click", closeDefaultAdminPopup);

    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) closeDefaultAdminPopup();
    });

    // Bouton Éditeur
    const editBtn = overlay.querySelector('[data-action="edit"]');
    if (editBtn) {
      editBtn.addEventListener("click", () => {
        closeDefaultAdminPopup();
        openTemplateEditor(objectId);
      });
    }

    // Bouton Upload
    const uploadBtn = overlay.querySelector('[data-action="upload"]');
    if (uploadBtn) {
      uploadBtn.addEventListener("click", () => {
        closeDefaultAdminPopup();
        openUploadModal(objectId, config);
      });
    }

    // Escape pour fermer
    const escHandler = (e) => {
      if (e.key === "Escape") {
        closeDefaultAdminPopup();
        document.removeEventListener("keydown", escHandler);
      }
    };
    document.addEventListener("keydown", escHandler);
  }

  function closeDefaultAdminPopup() {
    if (currentDefaultPopup) {
      currentDefaultPopup.classList.remove("active");
      setTimeout(() => {
        currentDefaultPopup?.remove();
        currentDefaultPopup = null;
      }, 300);
    }
  }

  // ============================================
  // 🔧 HELPERS - OUVRIR ÉDITEUR / UPLOAD
  // ============================================

  function closePopup(objectId) {
    if (window.atlantisPopups && window.atlantisPopups[objectId]?.close) {
      window.atlantisPopups[objectId].close();
    }
  }

  function openTemplateEditor(objectId) {
    if (window.template_edit) {
      window.template_edit(objectId);
    } else if (window.atlantisTemplateEditor?.open) {
      window.atlantisTemplateEditor.open({ objectId: objectId });
    } else {
      console.error("❌ template-editor.js non chargé");
      alert("Erreur: L'éditeur de template n'est pas chargé.");
    }
  }

  function openUploadModal(objectId, config) {
    // Construire la config pour le modal upload
    const plvConfig = config?.plv || {};
    const spaceSlug = window.ATLANTIS_SPACE || "default";

    const uploadConfig = {
      id: objectId,
      title: plvConfig.title || objectId,
      shader: plvConfig.shader,
      file: plvConfig.file,
      zone: config?.zone,
      zoneSlug: window.getFullZoneSlug
        ? window.getFullZoneSlug(config?.zone)
        : config?.zone,
      format: plvConfig.format,
      ratio: plvConfig.ratio,
      resolution: plvConfig.resolution,
      spaceSlug: spaceSlug,
    };

    if (window.atlantisPLVUpload?.open) {
      window.atlantisPLVUpload.open(uploadConfig);
    } else {
      console.error("❌ plv-upload.js non chargé");
      alert("Erreur: Le module d'upload n'est pas chargé.");
    }
  }

  // ============================================
  // 🔄 RECHARGEMENT POPUP
  // ============================================

  window.reloadPopupScript = function (popupId, spaceSlug) {
    spaceSlug = spaceSlug || window.ATLANTIS_SPACE || "default";

    // Supprimer l'ancien script
    const oldScripts = document.querySelectorAll(
      `script[src*="${popupId}-popup.js"]`
    );
    oldScripts.forEach((s) => s.remove());

    // Supprimer de atlantisPopups
    if (window.atlantisPopups && window.atlantisPopups[popupId]) {
      delete window.atlantisPopups[popupId];
    }

    // Supprimer les styles
    const oldStyles = document.getElementById(`popup-${popupId}-styles`);
    if (oldStyles) oldStyles.remove();

    // Recharger
    const script = document.createElement("script");
    script.src = `${
      POPUP_CONFIG.baseUrl
    }/${spaceSlug}/${popupId}-popup.js?v=${Date.now()}`;
    script.onload = () => console.log(`🔄 Popup ${popupId} rechargée`);
    document.head.appendChild(script);
  };

  // ============================================
  // 🚀 INITIALISATION
  // ============================================

  async function init() {
    if (isInitialized) return;
    isInitialized = true;

    console.log("🚀 Click Controller - Initialisation...");

    // 1. Charger le manifest
    await loadManifest();

    // 2. Charger toutes les popups
    await loadAllPopups();

    // 3. Setup des gestionnaires de clics
    setupClickHandlers();

    console.log("✅ Click Controller prêt!");
  }

  // ============================================
  // 🧪 COMMANDES CONSOLE
  // ============================================

  window.popup_show = function (objectId) {
    const config = CONFIG[objectId];

    if (window.atlantisPopups && window.atlantisPopups[objectId]) {
      showPopupWithAdminButtons(objectId, config);
      return true;
    }
    console.error(`❌ Popup "${objectId}" non trouvée`);
    console.log(
      "📋 Popups disponibles:",
      Object.keys(window.atlantisPopups || {})
    );
    return false;
  };

  window.popup_list = function () {
    const popups = window.atlantisPopups || {};
    console.log("📋 Popups chargées:");
    Object.keys(popups).forEach((id) => {
      const inConfig = CONFIG[id] ? "✓ configuré" : "○ non configuré";
      console.log(`  - ${id} (${inConfig})`);
    });
    return Object.keys(popups);
  };

  window.popup_reload = async function () {
    console.log("🔄 Rechargement de toutes les popups...");
    window.atlantisPopups = {};
    loadedPopups = {};
    await loadManifest();
    await loadAllPopups();
    console.log("✅ Rechargement terminé");
  };

  window.popup_debug = function () {
    if (typeof WALK === "undefined") {
      console.error("❌ WALK non disponible");
      return;
    }
    const viewer = WALK.getViewer();
    viewer.onNodeTypeClicked(function (node) {
      const name = node.config?.name;
      const clean = cleanNodeName(name);
      const config = CONFIG[clean];
      console.log("🔍 DEBUG - Objet cliqué:", name);
      console.log("   Nom nettoyé:", clean);
      console.log("   Configuré:", config ? "✅ OUI" : "❌ NON");
      if (config) {
        console.log("   Config:", config);
      }
      return false;
    });
    console.log("🔍 Mode debug activé - cliquez sur des objets");
  };

  // ============================================
  // 🌐 API PUBLIQUE
  // ============================================

  window.atlantisClickController = {
    init,
    loadPopup: loadPopupScript,
    showPopup: showPopupWithAdminButtons,
    showDefaultPopup: showDefaultAdminPopup,
    cleanNodeName,
    getManifest: () => manifest,
    getLoadedPopups: () => ({ ...loadedPopups }),
  };

  // ============================================
  // 📢 AUTO-INIT
  // ============================================

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    setTimeout(init, 500);
  }

  console.log(`
🖱️ Click Controller v1.1 chargé!

📋 COMMANDES:
   popup_show("c1_obj")  → Affiche une popup
   popup_list()          → Liste les popups
   popup_reload()        → Recharge tout
   popup_debug()         → Voir noms des objets cliqués

⚡ ACTIONS DISPONIBLES:
   - popup       → Affiche popup
   - upload      → Modal upload (admin)
   - url         → Lien externe
   - reload_plv  → Recharge textures PLV

⚙️ CONFIG:
   ${Object.keys(CONFIG).length} objets configurés
`);
})();
