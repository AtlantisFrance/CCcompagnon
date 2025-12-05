/**
 * ============================================
 * 🖱️ CLICK CONTROLLER - ATLANTIS CITY
 * Écoute les clics Shapespark et décide l'action
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

  /**
   * Exécute l'action configurée pour le clic
   */
  function executeClickAction(objectId, config) {
    const onClick = config.onClick;

    switch (onClick) {
      case "popup":
        handlePopupAction(objectId, config);
        return true;

      case "upload":
        // Clic direct sur upload (si admin)
        handleUploadAction(objectId, config);
        return true;

      case "url":
        // Ouvrir un lien externe
        if (config.url) {
          window.open(config.url, "_blank");
        }
        return true;

      case null:
      case undefined:
        // Pas d'action au clic pour les visiteurs
        // Mais si admin, montrer popup par défaut
        const access = PERMISSIONS.checkObjectAccess(objectId);
        if (access.canEdit || access.canUpload) {
          showDefaultAdminPopup(objectId, config);
        }
        return false;

      default:
        console.warn("⚠️ Action inconnue:", onClick);
        return false;
    }
  }

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
        // Pas de popup → afficher popup par défaut si admin
        const access = PERMISSIONS.checkObjectAccess(objectId);
        if (access.canEdit || access.canUpload) {
          showDefaultAdminPopup(objectId, config);
        }
      }
    });
  }

  /**
   * Gère l'action upload direct
   */
  function handleUploadAction(objectId, config) {
    const access = PERMISSIONS.checkObjectAccess(objectId);

    if (!access.canUpload) {
      console.warn("⛔ Pas de permission upload pour:", objectId);
      return;
    }

    openUploadModal(objectId, config);
  }

  // ============================================
  // 🎯 AFFICHAGE POPUP + BOUTONS ADMIN
  // ============================================

  function showPopupWithAdminButtons(objectId, config) {
    const popup = window.atlantisPopups[objectId];
    if (!popup || !popup.show) {
      console.error("❌ Popup invalide:", objectId);
      return;
    }

    // Afficher la popup
    popup.show();

    // Vérifier les droits et ajouter les boutons admin
    const access = PERMISSIONS.checkObjectAccess(objectId);
    const adminButtons = config?.adminButtons || [];

    if (access.canEdit || access.canUpload) {
      setTimeout(() => {
        addAdminButtons(objectId, config, access);
      }, 100);
    }
  }

  function addAdminButtons(objectId, config, access) {
    // Trouver l'overlay de la popup
    const overlay = document.querySelector(
      `[class*="popup-${objectId}-overlay"]`
    );
    if (!overlay) return;

    // Vérifier si les boutons existent déjà
    if (overlay.querySelector(".admin-buttons-container")) return;

    // Récupérer les boutons autorisés depuis la config
    const adminButtons = config?.adminButtons || [];

    // Créer le conteneur
    const container = document.createElement("div");
    container.className = "admin-buttons-container";

    // Bouton Éditer (si autorisé et permission OK)
    if (adminButtons.includes("edit") && access.canEdit) {
      const editBtn = document.createElement("button");
      editBtn.className = "admin-btn admin-btn-edit";
      editBtn.innerHTML = "🎨 Éditer Template";
      editBtn.onclick = () => {
        closePopup(objectId);
        openTemplateEditor(objectId);
      };
      container.appendChild(editBtn);
    }

    // Bouton Upload (si autorisé et permission OK)
    if (adminButtons.includes("upload") && access.canUpload) {
      const uploadBtn = document.createElement("button");
      uploadBtn.className = "admin-btn admin-btn-upload";
      uploadBtn.innerHTML = "📤 Upload PLV";
      uploadBtn.onclick = () => {
        closePopup(objectId);
        openUploadModal(objectId, config);
      };
      container.appendChild(uploadBtn);
    }

    // Ajouter seulement si on a des boutons
    if (container.children.length > 0) {
      overlay.appendChild(container);
    }
  }

  // ============================================
  // ✨ POPUP PAR DÉFAUT ADMIN
  // ============================================

  function showDefaultAdminPopup(objectId, config) {
    // Fermer si déjà ouverte
    if (currentDefaultPopup) {
      closeDefaultAdminPopup();
      return;
    }

    const access = PERMISSIONS.checkObjectAccess(objectId);
    const adminButtons = config?.adminButtons || [];

    // Créer l'overlay
    const overlay = document.createElement("div");
    overlay.className = "atlantis-default-popup-overlay";

    // Générer les boutons selon la config
    let buttonsHTML = "";

    if (adminButtons.includes("edit") && access.canEdit) {
      buttonsHTML += `
        <button class="atlantis-default-popup-btn atlantis-default-popup-btn-editor" data-action="edit">
          <span class="atlantis-default-popup-btn-icon">🎨</span>
          <span class="atlantis-default-popup-btn-text">
            <strong>Créer une Popup</strong>
            <small>Fiche contact, synopsis, iframe...</small>
          </span>
        </button>
      `;
    }

    if (adminButtons.includes("upload") && access.canUpload) {
      buttonsHTML += `
        <button class="atlantis-default-popup-btn atlantis-default-popup-btn-upload" data-action="upload">
          <span class="atlantis-default-popup-btn-icon">📤</span>
          <span class="atlantis-default-popup-btn-text">
            <strong>Upload Texture PLV</strong>
            <small>Remplacer l'image affichée</small>
          </span>
        </button>
      `;
    }

    // Si aucun bouton disponible, ne pas afficher
    if (!buttonsHTML) {
      console.log("ℹ️ Aucune action admin disponible pour:", objectId);
      return;
    }

    overlay.innerHTML = `
      <div class="atlantis-default-popup">
        <div class="atlantis-default-popup-header">
          <div class="atlantis-default-popup-icon">⚙️</div>
          <h2 class="atlantis-default-popup-title">Configuration requise</h2>
          <button class="atlantis-default-popup-close">✕</button>
        </div>
        
        <div class="atlantis-default-popup-body">
          <div class="atlantis-default-popup-object">
            <span class="atlantis-default-popup-label">Objet sélectionné</span>
            <span class="atlantis-default-popup-value">${objectId}</span>
          </div>
          
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
🖱️ Click Controller chargé!

📋 COMMANDES:
   popup_show("c1_obj")  → Affiche une popup
   popup_list()          → Liste les popups
   popup_reload()        → Recharge tout
   popup_debug()         → Voir noms des objets cliqués

🔐 PERMISSIONS:
   perm_whoami()              → Voir user + rôles
   perm_checkobject("c1_obj") → Vérifier accès objet

⚙️ CONFIG:
   ${Object.keys(CONFIG).length} objets configurés
`);
})();
