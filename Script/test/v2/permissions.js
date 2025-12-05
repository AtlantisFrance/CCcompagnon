/**
 * ============================================
 * 🔐 PERMISSIONS - ATLANTIS CITY
 * Vérification centralisée des droits utilisateur
 *
 * 🧪 COMMANDES CONSOLE:
 * - perm_whoami()              → Affiche user connecté + rôles
 * - perm_checkzone("zone1")    → Vérifie accès à une zone
 * - perm_checkobject("c1_obj") → Vérifie droits edit/upload sur objet
 * - perm_list()                → Liste tous les objets configurés
 * ============================================
 */

(function () {
  "use strict";

  // ============================================
  // 🔍 VÉRIFICATION DÉPENDANCES
  // ============================================

  if (!window.ATLANTIS_OBJECTS_CONFIG) {
    console.error("❌ Permissions: objects-config.js doit être chargé avant!");
    return;
  }

  const CONFIG = window.ATLANTIS_OBJECTS_CONFIG;

  // ============================================
  // 👤 RÉCUPÉRATION UTILISATEUR
  // ============================================

  /**
   * Récupère l'utilisateur connecté
   * @returns {object|null} User ou null
   */
  function getUser() {
    // Via atlantisAuth (prioritaire)
    if (window.atlantisAuth && window.atlantisAuth.getUser) {
      return window.atlantisAuth.getUser();
    }
    // Fallback localStorage
    const stored = localStorage.getItem("atlantis_auth_user");
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch (e) {}
    }
    return null;
  }

  /**
   * Vérifie si un utilisateur est connecté
   * @returns {boolean}
   */
  function isLoggedIn() {
    return getUser() !== null;
  }

  // ============================================
  // 🔐 VÉRIFICATION ACCÈS ZONE
  // ============================================

  /**
   * Vérifie si l'utilisateur peut modifier une zone
   * @param {string} zoneSlug - Slug COMPLET de la zone (ex: "scenetest-zone1")
   * @returns {object} { allowed: boolean, reason: string, code: string }
   */
  function checkZoneAccess(zoneSlug) {
    const user = getUser();
    const spaceSlug = window.ATLANTIS_SPACE || "default";

    // 1. Pas connecté
    if (!user) {
      return {
        allowed: false,
        reason: "Vous devez être connecté",
        code: "NOT_LOGGED_IN",
      };
    }

    // 2. Super Admin → accès total
    if (user.global_role === "super_admin") {
      return {
        allowed: true,
        reason: "✅ Accès Super Admin",
        code: "SUPER_ADMIN",
      };
    }

    // 3. Vérifier les rôles dans space_roles
    const spaceRoles = user.space_roles || [];

    // 3a. Space Admin sur cet espace → accès total
    const isSpaceAdmin = spaceRoles.some(
      (role) => role.space_slug === spaceSlug && role.role === "space_admin"
    );

    if (isSpaceAdmin) {
      return {
        allowed: true,
        reason: `✅ Accès Space Admin (${spaceSlug})`,
        code: "SPACE_ADMIN",
      };
    }

    // 3b. Zone Admin sur cette zone spécifique
    const isZoneAdmin = spaceRoles.some(
      (role) =>
        role.space_slug === spaceSlug &&
        role.zone_slug === zoneSlug &&
        (role.role === "zone_admin" || role.role === "space_admin")
    );

    if (isZoneAdmin) {
      return {
        allowed: true,
        reason: `✅ Accès Zone Admin (${zoneSlug})`,
        code: "ZONE_ADMIN",
      };
    }

    // 4. Viewer ou pas de rôle → refusé
    return {
      allowed: false,
      reason: `❌ Pas de droits sur "${zoneSlug}"`,
      code: "NO_ACCESS",
    };
  }

  // ============================================
  // 🎯 VÉRIFICATION ACCÈS OBJET
  // ============================================

  /**
   * Vérifie les droits sur un objet spécifique
   * @param {string} objectId - ID de l'objet (ex: "c1_obj")
   * @returns {object} { canEdit: boolean, canUpload: boolean, reason: string }
   */
  function checkObjectAccess(objectId) {
    const objConfig = CONFIG[objectId];

    // Objet non configuré
    if (!objConfig) {
      return {
        canEdit: false,
        canUpload: false,
        reason: `Objet "${objectId}" non configuré`,
        code: "NOT_CONFIGURED",
      };
    }

    // Pas de zone = pas de restriction (rare)
    if (!objConfig.zone) {
      const user = getUser();
      const isAdmin = user && user.global_role === "super_admin";
      return {
        canEdit: isAdmin && objConfig.adminButtons?.includes("edit"),
        canUpload: isAdmin && objConfig.adminButtons?.includes("upload"),
        reason: isAdmin ? "✅ Super Admin" : "❌ Accès réservé",
        code: isAdmin ? "SUPER_ADMIN" : "NO_ACCESS",
      };
    }

    // Construire le slug complet de la zone
    const fullZoneSlug = window.getFullZoneSlug(objConfig.zone);

    // Vérifier accès à la zone
    const zoneAccess = checkZoneAccess(fullZoneSlug);

    // Déterminer les droits selon config + accès zone
    const adminButtons = objConfig.adminButtons || [];

    return {
      canEdit: zoneAccess.allowed && adminButtons.includes("edit"),
      canUpload: zoneAccess.allowed && adminButtons.includes("upload"),
      reason: zoneAccess.reason,
      code: zoneAccess.code,
      zone: fullZoneSlug,
      config: objConfig,
    };
  }

  /**
   * Vérifie si l'utilisateur est admin sur au moins une zone
   * @returns {boolean}
   */
  function isAnyAdmin() {
    const user = getUser();
    if (!user) return false;
    if (user.global_role === "super_admin") return true;

    const spaceSlug = window.ATLANTIS_SPACE || "default";
    const spaceRoles = user.space_roles || [];

    return spaceRoles.some(
      (role) =>
        role.space_slug === spaceSlug &&
        (role.role === "space_admin" || role.role === "zone_admin")
    );
  }

  // ============================================
  // 🧪 COMMANDES CONSOLE DEBUG
  // ============================================

  // Afficher user actuel
  window.perm_whoami = () => {
    const user = getUser();
    if (!user) {
      console.log("❌ Non connecté");
      return null;
    }
    console.log("\n👤 Utilisateur connecté:");
    console.log("   Email:", user.email);
    console.log("   Rôle global:", user.global_role);
    console.log("   Rôles espaces:", user.space_roles || []);
    console.log("   Est admin:", isAnyAdmin());
    return user;
  };

  // Vérifier accès zone (avec zone courte)
  window.perm_checkzone = (zoneShort) => {
    const fullSlug = window.getFullZoneSlug(zoneShort);
    const result = checkZoneAccess(fullSlug);
    console.log("\n🔐 Vérification zone:");
    console.log("   Zone:", zoneShort, "→", fullSlug);
    console.log("   Résultat:", result.reason);
    console.log("   Code:", result.code);
    return result;
  };

  // Vérifier accès objet
  window.perm_checkobject = (objectId) => {
    const result = checkObjectAccess(objectId);
    console.log("\n🎯 Vérification objet:", objectId);
    console.log("   Zone:", result.zone || "N/A");
    console.log("   Peut éditer:", result.canEdit ? "✅ OUI" : "❌ NON");
    console.log("   Peut upload:", result.canUpload ? "✅ OUI" : "❌ NON");
    console.log("   Raison:", result.reason);
    return result;
  };

  // Liste objets configurés
  window.perm_list = () => {
    console.log("\n📋 Objets configurés:");
    Object.entries(CONFIG).forEach(([id, obj]) => {
      const buttons = obj.adminButtons?.join(", ") || "aucun";
      console.log(
        `   ${id} → Zone: ${obj.zone || "N/A"} | Type: ${
          obj.type
        } | Boutons: [${buttons}]`
      );
    });
  };

  // ============================================
  // 🌐 API PUBLIQUE
  // ============================================

  window.atlantisPermissions = {
    getUser,
    isLoggedIn,
    isAnyAdmin,
    checkZoneAccess,
    checkObjectAccess,
    getConfig: () => CONFIG,
  };

  // ============================================
  // 📢 MESSAGE AIDE
  // ============================================

  console.log(`
🔐 Permissions chargé!

🧪 COMMANDES CONSOLE:
   perm_whoami()              → Affiche user connecté
   perm_checkzone("zone1")    → Vérifie accès zone
   perm_checkobject("c1_obj") → Vérifie droits sur objet
   perm_list()                → Liste objets configurés

🌐 API:
   atlantisPermissions.checkObjectAccess("c1_obj")
   atlantisPermissions.isAnyAdmin()
`);
})();
