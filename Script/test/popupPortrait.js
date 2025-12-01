/**
 * ============================================
 * 🧑 POPUP PORTRAIT - ATLANTIS CITY
 * Objet: plvportrait_obj
 * Namespace: portrait
 * ============================================
 */

(function () {
  // Éviter double initialisation
  if (window.__atlantisPopupPortraitInit) return;
  window.__atlantisPopupPortraitInit = true;

  const viewer = WALK.getViewer();

  // === CONFIGURATION ===
  const CONFIG = {
    // Objet 3D cliquable
    objectName: "plvportrait_obj",
    popupId: "portrait-popup-overlay",

    // ⚠️ CONFIGURER ICI LE SPACE ET LA ZONE
    spaceSlug: "scenetest", // Slug de l'espace (depuis le CRM)
    zoneSlug: "mascenetest-zone2", // Slug de la zone (depuis le CRM)
  };

  // === DETECTER STATUT AUTH ===
  function getAuthStatus() {
    // Vérifier si le module auth existe
    if (!window.atlantisAuth || !window.atlantisAuth.isLoggedIn()) {
      return {
        isConnected: false,
        role: "viewer",
        message: "Vous êtes non connecté",
        color: "#64748b", // Gris
      };
    }

    const user = window.atlantisAuth.getUser();

    // Super Admin = accès total
    if (user.global_role === "super_admin") {
      return {
        isConnected: true,
        role: "super_admin",
        message: "Vous êtes connecté (Super Admin)",
        color: "#ef4444", // Rouge
      };
    }

    // Vérifier les rôles dans les espaces
    const roles = user.space_roles || [];

    // Space Admin de CET espace ?
    const isSpaceAdmin = roles.some(
      (r) => r.space_slug === CONFIG.spaceSlug && r.role === "space_admin"
    );
    if (isSpaceAdmin) {
      return {
        isConnected: true,
        role: "space_admin",
        message: `Vous êtes connecté (Space Admin: ${CONFIG.spaceSlug})`,
        color: "#f59e0b", // Orange
      };
    }

    // Zone Admin de CETTE zone ?
    const isZoneAdmin = roles.some(
      (r) =>
        r.space_slug === CONFIG.spaceSlug &&
        r.zone_slug === CONFIG.zoneSlug &&
        r.role === "zone_admin"
    );
    if (isZoneAdmin) {
      return {
        isConnected: true,
        role: "zone_admin",
        message: `Vous êtes connecté (Zone Admin: ${CONFIG.zoneSlug})`,
        color: "#22c55e", // Vert
      };
    }

    // Utilisateur connecté sans rôle spécial sur cette zone = Viewer
    return {
      isConnected: true,
      role: "viewer",
      message: "Vous êtes connecté (Viewer)",
      color: "#3b82f6", // Bleu
    };
  }

  // === OUVRIR POPUP ===
  function openPopup() {
    // Fermer si déjà ouverte
    closePopup();

    // Récupérer le statut auth
    const authStatus = getAuthStatus();

    // Créer l'overlay
    const overlay = document.createElement("div");
    overlay.className = "portrait-popup-overlay";
    overlay.id = CONFIG.popupId;

    // Fermer au clic sur l'overlay
    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) closePopup();
    });

    // Contenu HTML
    overlay.innerHTML = `
      <div class="portrait-popup-container">
        <div class="portrait-popup-header">
          <h2 class="portrait-popup-title">
            <span class="icon">🧑</span>
            PLV Portrait
          </h2>
          <button class="portrait-popup-close" onclick="window.atlantisPopupPortrait.close()">×</button>
        </div>
        
        <div class="portrait-popup-body">
          <div class="portrait-popup-info">
            <p><strong>Objet :</strong> ${CONFIG.objectName}</p>
            <p><strong>Format :</strong> Portrait (vertical)</p>
            <p><strong>Space :</strong> ${CONFIG.spaceSlug}</p>
            <p><strong>Zone :</strong> ${CONFIG.zoneSlug}</p>
          </div>
          
          <div class="portrait-popup-content">
            <p>🎉 Popup Portrait fonctionnelle !</p>
            <p>Contenu spécifique au format portrait.</p>
          </div>
        </div>
        
        <div class="portrait-popup-footer">
          <button class="portrait-popup-btn portrait-popup-btn-secondary" onclick="window.atlantisPopupPortrait.close()">
            Fermer
          </button>
          <button class="portrait-popup-btn portrait-popup-btn-primary" onclick="alert('Action Portrait !')">
            Action
          </button>
        </div>
      </div>
      
      <!-- Statut Auth -->
      <div style="
        margin-top: 16px;
        padding: 12px 20px;
        background: rgba(15, 23, 42, 0.95);
        border: 1px solid ${authStatus.color};
        border-radius: 10px;
        color: ${authStatus.color};
        font-family: 'Segoe UI', Roboto, sans-serif;
        font-size: 14px;
        font-weight: 600;
        text-align: center;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
      ">
        ${authStatus.message}
      </div>
    `;

    document.body.appendChild(overlay);
    console.log("🧑 Portrait: Popup ouverte");
    console.log("🧑 Portrait: Auth status:", authStatus);
  }

  // === FERMER POPUP ===
  function closePopup() {
    const overlay = document.getElementById(CONFIG.popupId);
    if (overlay) {
      overlay.remove();
      console.log("🧑 Portrait: Popup fermée");
    }
  }

  // === ENREGISTRER LE CLIC ===
  function registerClickHandler() {
    viewer.onNodeTypeClicked(CONFIG.objectName, () => {
      console.log(`🧑 Portrait: Clic détecté sur ${CONFIG.objectName}`);
      openPopup();
      return true;
    });
    console.log(`🧑 Portrait: Handler enregistré pour ${CONFIG.objectName}`);
  }

  // === INITIALISATION ===
  function init() {
    console.log("🧑 Portrait: Initialisation...");

    viewer.onSceneLoadComplete(() => {
      registerClickHandler();
      console.log("🧑 Portrait: Prêt !");
    });
  }

  // === API PUBLIQUE ===
  window.atlantisPopupPortrait = {
    open: openPopup,
    close: closePopup,
  };

  // Lancer
  init();
})();
