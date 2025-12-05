/**
 * ============================================
 * 🚀 POPUP LOADER - ATLANTIS CITY
 * Charge les popups générées et gère les clics
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
  // ⚙️ CONFIGURATION
  // ============================================
  const CONFIG = {
    baseUrl: "https://compagnon.atlantis-city.com/popups",

    // Mapping entre noms d'objets Shapespark et IDs de popup
    // Format: "nom_dans_shapespark": "popup_id"
    nodeMapping: {
      // === SCÈNE TEST ===
      // Carrés
      c1_obj: "c1_obj",
      c1_node: "c1_obj",
      Carre1: "c1_obj",

      // Portraits
      p1_obj: "p1_obj",
      p1_node: "p1_obj",
      Portrait1: "p1_obj",

      // Paysages
      l1_obj: "l1_obj",
      l1_node: "l1_obj",
      Paysage1: "l1_obj",

      l2_obj: "l2_obj",
      l2_node: "l2_obj",
      Paysage2: "l2_obj",

      // === AJOUTE TES MAPPINGS ICI ===
      // "NomDansSS": "popup_id",
    },
  };

  // État
  let loadedPopups = {};
  let manifest = null;
  let isInitialized = false;
  let currentDefaultPopup = null;

  // ============================================
  // 🔐 AUTH HELPERS
  // ============================================
  function getUser() {
    // Source 1: atlantisAuth (prioritaire)
    if (window.atlantisAuth && window.atlantisAuth.getUser) {
      return window.atlantisAuth.getUser();
    }

    // Source 2: localStorage atlantis_auth_user
    const stored = localStorage.getItem("atlantis_auth_user");
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch (e) {}
    }

    // Source 3: localStorage atlantis_user (ancien nom possible)
    const storedAlt = localStorage.getItem("atlantis_user");
    if (storedAlt) {
      try {
        return JSON.parse(storedAlt);
      } catch (e) {}
    }

    return null;
  }

  function getSpaceRoles() {
    // Source 1: Depuis l'objet user
    const user = getUser();
    if (user?.space_roles && user.space_roles.length > 0) {
      return user.space_roles;
    }

    // Source 2: localStorage séparé (si stocké à part)
    const rolesStored = localStorage.getItem("atlantis_space_roles");
    if (rolesStored) {
      try {
        return JSON.parse(rolesStored);
      } catch (e) {}
    }

    // Source 3: Dans user_space_roles (autre format possible)
    if (user?.user_space_roles && user.user_space_roles.length > 0) {
      return user.user_space_roles;
    }

    // Source 4: Via atlantisAuth
    if (window.atlantisAuth?.getSpaceRoles) {
      return window.atlantisAuth.getSpaceRoles();
    }

    return [];
  }

  /**
   * Récupère la zone d'un objet depuis la config PLV
   */
  function getObjectZone(objectId) {
    // Chercher dans ATLANTIS_PLV_CONFIG
    if (window.ATLANTIS_PLV_CONFIG?.objects?.[objectId]) {
      return (
        window.ATLANTIS_PLV_CONFIG.objects[objectId].zone ||
        window.ATLANTIS_PLV_CONFIG.objects[objectId].zone_slug
      );
    }
    return null;
  }

  /**
   * Vérifie si l'utilisateur est admin (global)
   */
  function isAdmin() {
    const user = getUser();
    if (!user) return false;
    if (user.global_role === "super_admin") return true;

    const spaceSlug = window.ATLANTIS_SPACE || "default";
    const spaceRoles = getSpaceRoles();

    return spaceRoles.some((r) => {
      const matchSpace = r.space_slug === spaceSlug || r.space === spaceSlug;
      const isAdminRole = r.role === "space_admin" || r.role === "zone_admin";
      return matchSpace && isAdminRole;
    });
  }

  /**
   * Vérifie si l'utilisateur a accès admin à un objet SPÉCIFIQUE
   * (vérifie la zone de l'objet)
   */
  function hasAdminAccessToObject(objectId) {
    const user = getUser();
    if (!user) {
      return false;
    }

    // Super admin = accès à tout
    if (user.global_role === "super_admin") {
      return true;
    }

    const spaceSlug = window.ATLANTIS_SPACE || "default";
    const spaceRoles = getSpaceRoles();
    const objectZone = getObjectZone(objectId);

    // Vérifier les rôles
    for (const role of spaceRoles) {
      const matchSpace =
        role.space_slug === spaceSlug || role.space === spaceSlug;
      if (!matchSpace) continue;

      // space_admin = accès à tout l'espace
      if (role.role === "space_admin") {
        return true;
      }

      // zone_admin = accès seulement à sa zone
      if (role.role === "zone_admin") {
        const roleZone = role.zone_slug || role.zone;
        // Si pas de zone définie sur l'objet, autoriser (fallback)
        if (!objectZone) {
          return true;
        }
        // Vérifier si la zone correspond
        if (roleZone === objectZone) {
          return true;
        }
      }
    }

    return false;
  }

  // Debug: afficher les infos utilisateur
  window.popup_whoami = function () {
    const user = getUser();
    const roles = getSpaceRoles();
    console.log("👤 Utilisateur:", user);
    console.log("🔑 Space Roles:", roles);
    console.log("🏠 Espace actuel:", window.ATLANTIS_SPACE);
    console.log("🔐 Est admin (global):", isAdmin());
    return { user, roles, space: window.ATLANTIS_SPACE, isAdmin: isAdmin() };
  };

  // Debug: vérifier accès à un objet spécifique
  window.popup_checkaccess = function (objectId) {
    const zone = getObjectZone(objectId);
    const hasAccess = hasAdminAccessToObject(objectId);
    console.log(`🔐 Accès à ${objectId}:`, {
      zone: zone || "(non définie)",
      hasAccess: hasAccess,
    });
    return hasAccess;
  };

  // ============================================
  // 📦 CHARGEMENT MANIFEST & POPUPS
  // ============================================
  async function loadManifest() {
    const spaceSlug = window.ATLANTIS_SPACE || "default";
    const manifestUrl = `${
      CONFIG.baseUrl
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
      CONFIG.baseUrl
    }/${spaceSlug}/${popupId}-popup.js?v=${Date.now()}`;

    return new Promise((resolve, reject) => {
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
      console.log("🎯 Configuration des triggers popup");

      // Gestionnaire de clics
      viewer.onNodeTypeClicked(function (node) {
        // Utiliser node.config.name comme dans control-triggers.js
        const objectName = node.config?.name;

        if (!objectName) {
          console.log("ℹ️ Clic sur objet sans nom");
          return false;
        }

        return handleNodeClick(objectName, node);
      });

      console.log("🖱️ Gestionnaire de clics popup activé");
    });
  }

  function handleNodeClick(nodeName, node) {
    console.log("🖱️ Clic sur:", nodeName);

    // ✅ NETTOYER LE NOM: enlever {part} et (X)
    let cleanName = nodeName
      .replace(/^\{part\}/i, "") // Enlève {part} au début
      .replace(/\s*\(\d+\)\s*$/g, "") // Enlève (1), (2), etc. à la fin
      .trim();

    if (cleanName !== nodeName) {
      console.log("🧹 Nom nettoyé:", cleanName);
    }

    // Trouver le popupId correspondant (essayer nom nettoyé puis original)
    let popupId = CONFIG.nodeMapping[cleanName] || CONFIG.nodeMapping[nodeName];

    // Si pas dans le mapping, utiliser le nom nettoyé comme popupId
    if (!popupId) {
      popupId = cleanName;
    }

    // Vérifier si la popup existe dans atlantisPopups
    if (window.atlantisPopups && window.atlantisPopups[popupId]) {
      // Popup existe → l'afficher
      showPopupWithAdminButtons(popupId);
      return true;
    }

    // Popup n'existe pas encore
    // Essayer de la charger à la volée
    loadPopupScript(popupId).then((loaded) => {
      if (loaded && window.atlantisPopups && window.atlantisPopups[popupId]) {
        // Chargement réussi
        showPopupWithAdminButtons(popupId);
      } else {
        // ✨ Si admin avec accès à CET objet et pas de popup → afficher popup par défaut
        if (hasAdminAccessToObject(popupId)) {
          console.log(
            "🔧 Admin avec accès: affichage popup par défaut pour",
            popupId
          );
          showDefaultAdminPopup(popupId);
        } else {
          console.log("ℹ️ Pas de popup pour:", popupId);
        }
      }
    });

    return true; // Bloquer le comportement par défaut Shapespark
  }

  // ============================================
  // ✨ POPUP PAR DÉFAUT ADMIN
  // ============================================
  function showDefaultAdminPopup(objectId) {
    // Fermer si déjà ouverte
    if (currentDefaultPopup) {
      closeDefaultAdminPopup();
      return;
    }

    // Injecter les styles
    injectDefaultPopupStyles();

    // Créer l'overlay
    const overlay = document.createElement("div");
    overlay.className = "atlantis-default-popup-overlay";
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
            <button class="atlantis-default-popup-btn atlantis-default-popup-btn-editor">
              <span class="atlantis-default-popup-btn-icon">🎨</span>
              <span class="atlantis-default-popup-btn-text">
                <strong>Créer une Popup</strong>
                <small>Fiche contact, synopsis, iframe...</small>
              </span>
            </button>
            
            <button class="atlantis-default-popup-btn atlantis-default-popup-btn-upload">
              <span class="atlantis-default-popup-btn-icon">📤</span>
              <span class="atlantis-default-popup-btn-text">
                <strong>Upload Texture PLV</strong>
                <small>Remplacer l'image affichée</small>
              </span>
            </button>
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
    const closeBtn = overlay.querySelector(".atlantis-default-popup-close");
    closeBtn.addEventListener("click", closeDefaultAdminPopup);

    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) closeDefaultAdminPopup();
    });

    // Bouton Éditeur
    const editorBtn = overlay.querySelector(
      ".atlantis-default-popup-btn-editor"
    );
    editorBtn.addEventListener("click", () => {
      closeDefaultAdminPopup();
      if (window.template_edit) {
        window.template_edit(objectId);
      } else if (window.atlantisTemplateEditor?.open) {
        window.atlantisTemplateEditor.open({ objectId: objectId });
      } else {
        console.error("❌ template-editor.js non chargé");
        alert("Erreur: L'éditeur de template n'est pas chargé.");
      }
    });

    // Bouton Upload
    const uploadBtn = overlay.querySelector(
      ".atlantis-default-popup-btn-upload"
    );
    uploadBtn.addEventListener("click", () => {
      closeDefaultAdminPopup();
      if (window.plv_openupload) {
        window.plv_openupload(objectId);
      } else if (window.atlantisPLVUpload?.open) {
        const config = window.ATLANTIS_PLV_CONFIG?.objects?.[objectId];
        if (config) {
          window.atlantisPLVUpload.open(config);
        } else {
          console.error("❌ Config PLV non trouvée pour:", objectId);
          alert("Erreur: Configuration PLV non trouvée pour cet objet.");
        }
      } else {
        console.error("❌ plv-upload.js non chargé");
        alert("Erreur: Le module d'upload n'est pas chargé.");
      }
    });

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

  function injectDefaultPopupStyles() {
    if (document.getElementById("atlantis-default-popup-styles")) return;

    const style = document.createElement("style");
    style.id = "atlantis-default-popup-styles";
    style.textContent = `
      .atlantis-default-popup-overlay {
        position: fixed;
        inset: 0;
        background: rgba(0, 0, 0, 0.85);
        z-index: 99999;
        display: flex;
        align-items: center;
        justify-content: center;
        opacity: 0;
        transition: opacity 0.3s ease;
      }
      .atlantis-default-popup-overlay.active {
        opacity: 1;
      }
      
      .atlantis-default-popup {
        background: linear-gradient(180deg, #1e293b 0%, #0f172a 100%);
        border-radius: 20px;
        width: 420px;
        max-width: 95vw;
        overflow: hidden;
        box-shadow: 0 25px 60px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255,255,255,0.1);
        transform: scale(0.95) translateY(10px);
        transition: transform 0.3s ease;
      }
      .atlantis-default-popup-overlay.active .atlantis-default-popup {
        transform: scale(1) translateY(0);
      }
      
      .atlantis-default-popup-header {
        padding: 20px 20px 15px;
        display: flex;
        align-items: center;
        gap: 12px;
        border-bottom: 1px solid rgba(255,255,255,0.1);
      }
      .atlantis-default-popup-icon {
        font-size: 28px;
      }
      .atlantis-default-popup-title {
        flex: 1;
        margin: 0;
        font-size: 18px;
        font-weight: 600;
        color: #f1f5f9;
      }
      .atlantis-default-popup-close {
        background: rgba(255,255,255,0.1);
        border: none;
        width: 32px;
        height: 32px;
        border-radius: 50%;
        color: #94a3b8;
        font-size: 18px;
        cursor: pointer;
        transition: all 0.2s;
      }
      .atlantis-default-popup-close:hover {
        background: rgba(239, 68, 68, 0.3);
        color: #ef4444;
      }
      
      .atlantis-default-popup-body {
        padding: 20px;
      }
      
      .atlantis-default-popup-object {
        background: rgba(59, 130, 246, 0.1);
        border: 1px solid rgba(59, 130, 246, 0.3);
        border-radius: 10px;
        padding: 12px 15px;
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 15px;
      }
      .atlantis-default-popup-label {
        color: #94a3b8;
        font-size: 12px;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }
      .atlantis-default-popup-value {
        color: #3b82f6;
        font-weight: 600;
        font-family: monospace;
        font-size: 14px;
      }
      
      .atlantis-default-popup-message {
        color: #94a3b8;
        font-size: 14px;
        line-height: 1.6;
        margin: 0 0 20px;
      }
      
      .atlantis-default-popup-actions {
        display: flex;
        flex-direction: column;
        gap: 10px;
      }
      
      .atlantis-default-popup-btn {
        display: flex;
        align-items: center;
        gap: 15px;
        padding: 15px;
        border: none;
        border-radius: 12px;
        cursor: pointer;
        transition: all 0.2s;
        text-align: left;
      }
      .atlantis-default-popup-btn-editor {
        background: linear-gradient(135deg, #8b5cf6, #7c3aed);
        color: white;
      }
      .atlantis-default-popup-btn-editor:hover {
        transform: translateY(-2px);
        box-shadow: 0 8px 20px rgba(139, 92, 246, 0.4);
      }
      .atlantis-default-popup-btn-upload {
        background: linear-gradient(135deg, #3b82f6, #2563eb);
        color: white;
      }
      .atlantis-default-popup-btn-upload:hover {
        transform: translateY(-2px);
        box-shadow: 0 8px 20px rgba(59, 130, 246, 0.4);
      }
      
      .atlantis-default-popup-btn-icon {
        font-size: 24px;
        width: 40px;
        height: 40px;
        display: flex;
        align-items: center;
        justify-content: center;
        background: rgba(255,255,255,0.2);
        border-radius: 10px;
      }
      .atlantis-default-popup-btn-text {
        display: flex;
        flex-direction: column;
        gap: 2px;
      }
      .atlantis-default-popup-btn-text strong {
        font-size: 14px;
        font-weight: 600;
      }
      .atlantis-default-popup-btn-text small {
        font-size: 12px;
        opacity: 0.8;
      }
      
      .atlantis-default-popup-footer {
        padding: 12px 20px;
        background: rgba(0,0,0,0.2);
        border-top: 1px solid rgba(255,255,255,0.05);
      }
      .atlantis-default-popup-hint {
        color: #64748b;
        font-size: 12px;
      }
    `;
    document.head.appendChild(style);
  }

  // ============================================
  // 🎯 AFFICHAGE POPUP + BOUTONS ADMIN
  // ============================================
  function showPopupWithAdminButtons(popupId) {
    const popup = window.atlantisPopups[popupId];
    if (!popup || !popup.show) {
      console.error("❌ Popup invalide:", popupId);
      return;
    }

    // Afficher la popup
    popup.show();

    // Si admin avec accès à CET objet, ajouter les boutons après un court délai
    if (hasAdminAccessToObject(popupId)) {
      setTimeout(() => addAdminButtons(popupId), 100);
    }
  }

  function addAdminButtons(popupId) {
    // Trouver l'overlay de la popup
    const overlay = document.querySelector(
      `[class*="popup-${popupId}-overlay"]`
    );
    if (!overlay) return;

    // Vérifier si les boutons existent déjà
    if (overlay.querySelector(".admin-buttons-container")) return;

    // Créer le conteneur de boutons admin
    const container = document.createElement("div");
    container.className = "admin-buttons-container";
    container.style.cssText = `
      position: fixed;
      top: 20px;
      left: 20px;
      z-index: 100000;
      display: flex;
      gap: 10px;
    `;

    // Bouton Template Editor
    const editorBtn = document.createElement("button");
    editorBtn.innerHTML = "🎨 Éditer Template";
    editorBtn.style.cssText = `
      padding: 10px 16px;
      background: linear-gradient(135deg, #8b5cf6, #7c3aed);
      color: white;
      border: none;
      border-radius: 8px;
      font-size: 13px;
      font-weight: 600;
      cursor: pointer;
      box-shadow: 0 4px 12px rgba(139, 92, 246, 0.4);
      transition: all 0.2s;
    `;
    editorBtn.onmouseover = () =>
      (editorBtn.style.transform = "translateY(-2px)");
    editorBtn.onmouseout = () => (editorBtn.style.transform = "translateY(0)");
    editorBtn.onclick = () => {
      // Fermer la popup
      if (window.atlantisPopups[popupId]?.close) {
        window.atlantisPopups[popupId].close();
      }
      // Ouvrir l'éditeur
      if (window.template_edit) {
        window.template_edit(popupId);
      } else {
        console.error("❌ template-editor.js non chargé");
      }
    };

    // Bouton PLV Upload
    const uploadBtn = document.createElement("button");
    uploadBtn.innerHTML = "📤 Upload PLV";
    uploadBtn.style.cssText = `
      padding: 10px 16px;
      background: linear-gradient(135deg, #3b82f6, #2563eb);
      color: white;
      border: none;
      border-radius: 8px;
      font-size: 13px;
      font-weight: 600;
      cursor: pointer;
      box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);
      transition: all 0.2s;
    `;
    uploadBtn.onmouseover = () =>
      (uploadBtn.style.transform = "translateY(-2px)");
    uploadBtn.onmouseout = () => (uploadBtn.style.transform = "translateY(0)");
    uploadBtn.onclick = () => {
      // Fermer la popup
      if (window.atlantisPopups[popupId]?.close) {
        window.atlantisPopups[popupId].close();
      }
      // Ouvrir l'upload
      if (window.plv_openupload) {
        window.plv_openupload(popupId);
      } else if (window.atlantisPLVUpload?.open) {
        const config = window.ATLANTIS_PLV_CONFIG?.objects?.[popupId];
        if (config) {
          window.atlantisPLVUpload.open(config);
        }
      } else {
        console.error("❌ plv-upload.js non chargé");
      }
    };

    container.appendChild(editorBtn);
    container.appendChild(uploadBtn);
    overlay.appendChild(container);
  }

  // ============================================
  // 🔄 RECHARGEMENT D'UNE POPUP
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
      CONFIG.baseUrl
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

    console.log("🚀 Popup Loader - Initialisation...");

    // 1. Charger le manifest
    await loadManifest();

    // 2. Charger toutes les popups
    await loadAllPopups();

    // 3. Setup des gestionnaires de clics
    setupClickHandlers();

    console.log("✅ Popup Loader prêt!");
  }

  // ============================================
  // 🧪 COMMANDES CONSOLE
  // ============================================
  window.popup_show = function (popupId) {
    if (window.atlantisPopups && window.atlantisPopups[popupId]) {
      showPopupWithAdminButtons(popupId);
      return true;
    }
    console.error(`❌ Popup "${popupId}" non trouvée`);
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
      console.log(`  - ${id}`, popups[id].config?.name || "");
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

  // Debug: voir le nom des objets cliqués
  window.popup_debug = function () {
    if (typeof WALK === "undefined") {
      console.error("❌ WALK non disponible");
      return;
    }
    const viewer = WALK.getViewer();
    viewer.onNodeTypeClicked(function (node) {
      const name = node.config?.name;
      console.log("🔍 DEBUG - Objet cliqué:", name);
      console.log("   node.config:", node.config);
      return false; // Ne pas bloquer
    });
    console.log("🔍 Mode debug activé - cliquez sur des objets");
  };

  // ============================================
  // 🌍 API PUBLIQUE
  // ============================================
  window.atlantisPopupLoader = {
    init,
    loadPopup: loadPopupScript,
    showPopup: showPopupWithAdminButtons,
    showDefaultPopup: showDefaultAdminPopup,
    isAdmin,
    hasAdminAccessToObject,
    getObjectZone,
    getUser,
    getSpaceRoles,
    getManifest: () => manifest,
    getLoadedPopups: () => ({ ...loadedPopups }),
    addMapping: (nodeName, popupId) => {
      CONFIG.nodeMapping[nodeName] = popupId;
      console.log(`✅ Mapping ajouté: "${nodeName}" → "${popupId}"`);
    },
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
🚀 Popup Loader chargé!

📋 COMMANDES:
   popup_show("c1_obj")       → Affiche une popup
   popup_list()               → Liste les popups
   popup_reload()             → Recharge tout
   popup_debug()              → Voir noms des objets cliqués
   popup_whoami()             → Voir user + rôles
   popup_checkaccess("c1_obj") → Vérifier accès à un objet

🖱️ Cliquez sur un objet 3D configuré pour voir sa popup!
💡 Admins: boutons visibles UNIQUEMENT sur vos zones
`);
})();
