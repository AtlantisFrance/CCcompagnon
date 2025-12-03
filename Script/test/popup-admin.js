/**
 * ============================================
 * 🔧 POPUP ADMIN - ATLANTIS CITY
 * Toolbar d'administration (mode admin uniquement)
 * ============================================
 *
 * Responsabilités :
 * - Injecter la toolbar admin dans les popups
 * - Boutons pour naviguer vers les vues (upload, content)
 * - Afficher le rôle de l'utilisateur
 *
 * Note : Cette toolbar n'apparaît QUE en mode admin
 */

(function () {
  if (window.__atlantisPopupAdminInit) return;
  window.__atlantisPopupAdminInit = true;

  // ============================================
  // 🔐 HELPERS
  // ============================================

  function getUserRole() {
    if (!window.atlantisAuth || !window.atlantisAuth.isLoggedIn()) return null;
    const user = window.atlantisAuth.getUser();
    if (!user) return null;

    if (user.global_role === "super_admin") return "Super Admin";

    const spaceSlug = window.atlantisPopup?.getSpaceSlug();
    const roles = user.space_roles || [];

    const spaceAdmin = roles.find(
      (r) => r.space_slug === spaceSlug && r.role === "space_admin"
    );
    if (spaceAdmin) return "Admin Espace";

    const zoneAdmin = roles.find(
      (r) => r.space_slug === spaceSlug && r.role === "zone_admin"
    );
    if (zoneAdmin) return `Admin Zone`;

    return null;
  }

  function getSpaceId() {
    // Récupérer depuis atlantisAuth ou popup config
    const user = window.atlantisAuth?.getUser();
    if (user?.space_roles?.length > 0) {
      const spaceSlug = window.atlantisPopup?.getSpaceSlug();
      const role = user.space_roles.find((r) => r.space_slug === spaceSlug);
      if (role) return role.space_id;
    }
    return null;
  }

  function getZoneId(zoneSlug) {
    const user = window.atlantisAuth?.getUser();
    if (user?.space_roles?.length > 0) {
      const role = user.space_roles.find((r) => r.zone_slug === zoneSlug);
      if (role) return role.zone_id;
    }
    return null;
  }

  // ============================================
  // 📝 OUVRIR L'ÉDITEUR DE CONTENU
  // ============================================

  function openContentEditor(objectConfig) {
    if (!window.popupEditor) {
      console.error("🔧 Admin: Module popup-editor.js non chargé !");
      alert(
        "Module d'édition non disponible. Vérifiez que popup-editor.js est chargé."
      );
      return;
    }

    const spaceSlug = window.atlantisPopup?.getSpaceSlug();
    const spaceId = getSpaceId();
    const zoneId = getZoneId(objectConfig.zoneSlug);

    window.popupEditor.open({
      objectName: objectConfig.id,
      shaderName: objectConfig.shader,
      spaceId: spaceId,
      spaceSlug: spaceSlug,
      zoneId: zoneId,
      zoneSlug: objectConfig.zoneSlug,
      format: objectConfig.format,
    });

    console.log("🔧 Admin: Ouverture éditeur pour", objectConfig.id);
  }

  // ============================================
  // 🎨 INJECTION TOOLBAR
  // ============================================

  function injectToolbar(objectConfig) {
    const adminZone = document.getElementById("popup-admin-zone");
    if (!adminZone) return;

    const canAccess = window.atlantisPopup?.canAccessObject(objectConfig);
    if (!canAccess) {
      adminZone.innerHTML = "";
      return;
    }

    const role = getUserRole();

    // Stocker objectConfig pour l'utiliser dans onclick
    window.__currentAdminObjectConfig = objectConfig;

    adminZone.innerHTML = `
      <div class="popup-admin-toolbar">
        <div class="popup-admin-info">
          <span class="popup-admin-badge">🔧 Admin</span>
          <span class="popup-admin-role">${role || "Administrateur"}</span>
        </div>
        <div class="popup-admin-actions">
          <button class="popup-admin-btn popup-admin-btn-upload" onclick="window.atlantisPopup.navigateTo('upload')">
            📤 Modifier l'image
          </button>
          <button class="popup-admin-btn popup-admin-btn-content" onclick="window.atlantisPopupAdmin.editContent()">
            📝 Modifier le contenu
          </button>
        </div>
      </div>
    `;

    console.log("🔧 Admin: Toolbar injectée");
  }

  function removeToolbar() {
    const adminZone = document.getElementById("popup-admin-zone");
    if (adminZone) {
      adminZone.innerHTML = "";
    }
    window.__currentAdminObjectConfig = null;
  }

  // ============================================
  // 📡 ÉVÉNEMENTS
  // ============================================

  // Popup ouverte → injecter toolbar si mode admin
  window.addEventListener("atlantis-popup-opened", (e) => {
    const { objectConfig, isAdminMode } = e.detail;
    if (isAdminMode) {
      // Petit délai pour que le DOM soit prêt
      setTimeout(() => injectToolbar(objectConfig), 50);
    }
  });

  // Changement de vue → réinjecter si retour à main
  window.addEventListener("atlantis-popup-view-changed", (e) => {
    const { viewName, objectConfig } = e.detail;
    if (viewName === "main" && window.atlantisPopup?.isAdmin()) {
      setTimeout(() => injectToolbar(objectConfig), 50);
    }
  });

  // Popup fermée → cleanup
  window.addEventListener("atlantis-popup-closed", () => {
    removeToolbar();
  });

  // ============================================
  // 🌐 API PUBLIQUE
  // ============================================

  window.atlantisPopupAdmin = {
    injectToolbar,
    removeToolbar,
    getUserRole,
    editContent: function () {
      const objectConfig = window.__currentAdminObjectConfig;
      if (objectConfig) {
        openContentEditor(objectConfig);
      } else {
        console.error("🔧 Admin: Pas de config objet disponible");
      }
    },
  };

  console.log("🔧 Popup Admin: ✅ Prêt");
})();
