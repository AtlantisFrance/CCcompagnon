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
    const hasContent = objectConfig.content?.hasContent;

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
          <button class="popup-admin-btn popup-admin-btn-content" disabled title="Éditeur Quill.js - Bientôt disponible">
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
  };

  console.log("🔧 Popup Admin: ✅ Prêt");
})();
