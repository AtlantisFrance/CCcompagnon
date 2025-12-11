/**
 * ============================================
 * 🖱️ CLICK CONTROLLER - ATLANTIS CITY
 * Écoute les clics Shapespark et décide l'action
 * ============================================
 * v1.0 - 2024-12-01 - Version initiale
 * v1.1 - 2024-12-10 - Ajout action "reload_plv"
 * v1.2 - 2024-12-10 - Fix boutons admin (sélecteur corrigé)
 * v1.3 - 2024-12-10 - Logs conditionnels via perf.js
 * v1.7 - 2024-12-10 - Logs groupés (loadAllPopups uniquement)
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
  // 📝 LOG CONDITIONNEL
  // ============================================
  const log = (message, type = "info") => {
    if (window.atlantisLog) {
      window.atlantisLog("click-controller", message, type);
    }
  };

  const logGroup = (title, items, collapsed = true) => {
    if (window.atlantisLogGroup) {
      window.atlantisLogGroup("click-controller", title, items, collapsed);
    }
  };

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
        log("Pas de manifest trouvé pour " + spaceSlug, "info");
        return null;
      }
      manifest = await response.json();
      log(
        "Manifest chargé: " +
          Object.keys(manifest.popups || {}).length +
          " popups",
        "success"
      );
      return manifest;
    } catch (err) {
      log("Erreur chargement manifest: " + err, "warn");
      return null;
    }
  }

  /**
   * Charge un script popup
   * @returns {Promise<boolean>} true si chargé, false sinon
   */
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
        log("Popup " + popupId + " chargée", "success");
        resolve(true);
      };
      script.onerror = () => {
        log("Popup " + popupId + " non trouvée", "warn");
        resolve(false);
      };
      document.head.appendChild(script);
    });
  }

  /**
   * Version interne pour batch loading avec timing
   */
  async function loadPopupScriptWithTiming(popupId) {
    const spaceSlug = window.ATLANTIS_SPACE || "default";
    const startTime = performance.now();
    const scriptUrl = `${
      POPUP_CONFIG.baseUrl
    }/${spaceSlug}/${popupId}-popup.js?v=${Date.now()}`;

    return new Promise((resolve) => {
      // Vérifier si déjà chargé
      if (window.atlantisPopups && window.atlantisPopups[popupId]) {
        loadedPopups[popupId] = true;
        resolve({ id: popupId, success: true, cached: true, time: 0 });
        return;
      }

      const script = document.createElement("script");
      script.src = scriptUrl;
      script.onload = () => {
        loadedPopups[popupId] = true;
        const elapsed = Math.round(performance.now() - startTime);
        resolve({ id: popupId, success: true, cached: false, time: elapsed });
      };
      script.onerror = () => {
        const elapsed = Math.round(performance.now() - startTime);
        resolve({ id: popupId, success: false, cached: false, time: elapsed });
      };
      document.head.appendChild(script);
    });
  }

  /**
   * Charge toutes les popups avec log groupé
   */
  async function loadAllPopups() {
    if (!manifest || !manifest.popups) {
      log("Aucune popup à charger", "info");
      return;
    }

    const popupIds = Object.keys(manifest.popups);
    const totalCount = popupIds.length;

    if (totalCount === 0) {
      log("Aucune popup dans le manifest", "info");
      return;
    }

    const globalStart = performance.now();
    const results = [];

    // Charger toutes les popups avec timing
    for (const popupId of popupIds) {
      const result = await loadPopupScriptWithTiming(popupId);
      results.push(result);
    }

    const globalTime = Math.round(performance.now() - globalStart);

    // Compter succès/échecs
    const successCount = results.filter((r) => r.success).length;
    const failedCount = results.filter((r) => !r.success).length;
    const cachedCount = results.filter((r) => r.cached).length;

    // Construire les items pour le log groupé
    const logItems = results.map((r) => {
      if (r.cached) {
        return { message: `${r.id} (cache)`, type: "info" };
      } else if (r.success) {
        return { message: `${r.id} (${r.time}ms)`, type: "success" };
      } else {
        return { message: `${r.id} - non trouvée`, type: "warn" };
      }
    });

    // Ajouter le résumé
    logItems.push({
      message: `───────────────────────────────────`,
      type: "info",
    });

    if (failedCount === 0) {
      logItems.push({
        message: `Total: ${successCount}/${totalCount} en ${globalTime}ms`,
        type: "success",
      });
    } else {
      logItems.push({
        message: `Total: ${successCount}/${totalCount} (${failedCount} échecs) en ${globalTime}ms`,
        type: "warn",
      });
    }

    if (cachedCount > 0) {
      logItems.push({
        message: `${cachedCount} popup(s) en cache`,
        type: "info",
      });
    }

    // Afficher le log groupé
    logGroup(
      `Popups (${successCount}/${totalCount}) - ${globalTime}ms`,
      logItems,
      true
    );
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
      log("WALK non disponible, réessai dans 1s...", "warn");
      setTimeout(setupClickHandlers, 1000);
      return;
    }

    const viewer = WALK.getViewer();

    // Attendre que la scène soit chargée
    viewer.onSceneLoadComplete(function () {
      log("Configuration des triggers", "info");

      // Gestionnaire de clics
      viewer.onNodeTypeClicked(function (node) {
        const objectName = node.config?.name;

        if (!objectName) {
          return false;
        }

        return handleNodeClick(objectName, node);
      });

      log("Click Controller activé", "success");
    });
  }

  function handleNodeClick(nodeName, node) {
    // Nettoyer le nom
    const cleanName = cleanNodeName(nodeName);

    if (cleanName !== nodeName) {
      log("Clic: " + nodeName + " → " + cleanName, "info");
    } else {
      log("Clic: " + cleanName, "info");
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
  // ⚡ EXÉCUTION DES ACTIONS
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
        log("Action inconnue: " + onClick, "warn");
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
    log("Action reload_plv déclenchée par: " + objectId, "info");

    if (typeof window.reloadPLVTextures === "function") {
      window.reloadPLVTextures();
      log("Rechargement des textures lancé", "success");
    } else {
      log("reloadPLVTextures non disponible", "error");
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
          log("Pas de popup configurée pour: " + objectId, "info");
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
      log("Pas de permission d'upload pour: " + objectId, "warn");
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
      log("Popup invalide: " + objectId, "error");
      return;
    }

    // Afficher la popup
    popup.show();

    // Vérifier les droits et ajouter les boutons admin
    const access = PERMISSIONS.checkObjectAccess(objectId);

    if (access.canEdit || access.canUpload) {
      setTimeout(() => {
        addAdminButtons(objectId, config, access);
      }, 100);
    }
  }

  function addAdminButtons(objectId, config, access) {
    // Trouver l'overlay de la popup (sélecteur flexible)
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
      log("Aucune action admin disponible pour: " + objectId, "info");
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
    script.onload = () => log("Popup " + popupId + " rechargée", "success");
    document.head.appendChild(script);
  };

  // ============================================
  // 🚀 INITIALISATION
  // ============================================

  async function init() {
    if (isInitialized) return;
    isInitialized = true;

    log("Initialisation...", "info");

    // 1. Charger le manifest
    await loadManifest();

    // 2. Charger toutes les popups (avec log groupé)
    await loadAllPopups();

    // 3. Setup des gestionnaires de clics
    setupClickHandlers();

    log("Click Controller prêt!", "success");
  }

  // ============================================
  // 🧪 COMMANDES CONSOLE (gardent console.log)
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

  // Log de démarrage conditionnel
  if (window.atlantisLog) {
    window.atlantisLog(
      "click-controller",
      "v1.7 chargé - " + Object.keys(CONFIG).length + " objets configurés",
      "success"
    );
  }
})();
