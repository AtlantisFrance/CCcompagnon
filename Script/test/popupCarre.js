/**
 * ============================================
 * ⬜ POPUP CARRE - ATLANTIS CITY
 * Objet: c1_obj
 * Namespace: carre
 * ============================================
 */

(function () {
  // Éviter double initialisation
  if (window.__atlantisPopupCarreInit) return;
  window.__atlantisPopupCarreInit = true;

  const viewer = WALK.getViewer();

  // === CONFIGURATION ===
  const CONFIG = {
    // Objet 3D cliquable
    objectName: "c1_obj",
    popupId: "carre-popup-overlay",

    // ⚠️ CONFIGURER ICI LE SPACE ET LA ZONE
    spaceSlug: "scenetest", // Slug de l'espace (depuis le CRM)
    zoneSlug: "mascenetest-zone1", // Slug de la zone (depuis le CRM)
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
    overlay.className = "carre-popup-overlay";
    overlay.id = CONFIG.popupId;

    // Fermer au clic sur l'overlay
    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) closePopup();
    });

    // Contenu HTML
    overlay.innerHTML = `
      <div class="carre-popup-container">
        <div class="carre-popup-header">
          <h2 class="carre-popup-title">
            <span class="icon">⬜</span>
            PLV Carré
          </h2>
          <button class="carre-popup-close" onclick="window.atlantisPopupCarre.close()">×</button>
        </div>
        
        <div class="carre-popup-body">
          <div class="carre-popup-info">
            <p><strong>Objet :</strong> ${CONFIG.objectName}</p>
            <p><strong>Format :</strong> Carré (1:1)</p>
            <p><strong>Space :</strong> ${CONFIG.spaceSlug}</p>
            <p><strong>Zone :</strong> ${CONFIG.zoneSlug}</p>
          </div>
          
          <div class="carre-popup-content">
            <p>🎉 Popup Carré fonctionnelle !</p>
            <p>Contenu spécifique au format carré.</p>
          </div>
        </div>
        
        <div class="carre-popup-footer">
          <button class="carre-popup-btn carre-popup-btn-secondary" onclick="window.atlantisPopupCarre.close()">
            Fermer
          </button>
          <button class="carre-popup-btn carre-popup-btn-primary" onclick="alert('Action Carré !')">
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
    console.log("⬜ Carré: Popup ouverte");
    console.log("⬜ Carré: Auth status:", authStatus);
  }

  // === FERMER POPUP ===
  function closePopup() {
    const overlay = document.getElementById(CONFIG.popupId);
    if (overlay) {
      overlay.remove();
      console.log("⬜ Carré: Popup fermée");
    }
  }

  // === ENREGISTRER LE CLIC ===
  function registerClickHandler() {
    viewer.onNodeTypeClicked(CONFIG.objectName, () => {
      console.log(`⬜ Carré: Clic détecté sur ${CONFIG.objectName}`);
      openPopup();
      return true;
    });
    console.log(`⬜ Carré: Handler enregistré pour ${CONFIG.objectName}`);
  }

  // === INITIALISATION ===
  function init() {
    console.log("⬜ Carré: Initialisation...");

    viewer.onSceneLoadComplete(() => {
      registerClickHandler();
      console.log("⬜ Carré: Prêt !");
    });
  }

  // === API PUBLIQUE ===
  window.atlantisPopupCarre = {
    open: openPopup,
    close: closePopup,
  };

  // Lancer
  init();
})();
