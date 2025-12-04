/**
 * ============================================
 * 🎛️ PLV MANAGER - ATLANTIS CITY
 * Gestion des clics PLV avec vérification des rôles
 *
 * 🧪 COMMANDES CONSOLE:
 * - c1_openupload()  → Test upload PLV Carré 1 (zone1)
 * - p1_openupload()  → Test upload PLV Portrait 1 (zone2)
 * - l1_openupload()  → Test upload PLV Paysage 1 (zone2)
 * - l2_openupload()  → Test upload PLV Paysage 2 (zone2)
 * - plv_checkrole("mascenetest-zone1") → Vérifie accès zone
 * ============================================
 */

(function () {
  "use strict";

  const CONFIG = window.ATLANTIS_PLV_CONFIG;

  if (!CONFIG) {
    console.error("❌ PLV Manager: plv-config.js doit être chargé avant!");
    return;
  }

  // ============================================
  // 🔐 VÉRIFICATION DES RÔLES
  // ============================================

  /**
   * Récupère l'utilisateur connecté
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
   * Vérifie si l'utilisateur peut modifier une zone
   * @param {string} zoneSlug - Slug de la zone à vérifier
   * @returns {object} { allowed: boolean, reason: string }
   */
  function checkZoneAccess(zoneSlug) {
    const user = getUser();
    const spaceSlug = window.ATLANTIS_SPACE || "default";

    // 1. Pas connecté
    if (!user) {
      return {
        allowed: false,
        reason: "Vous devez être connecté pour modifier les PLV",
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
      reason: `❌ Vous n'avez pas les droits sur la zone "${zoneSlug}"`,
      code: "NO_ACCESS",
    };
  }

  /**
   * Tente d'ouvrir l'upload pour un objet
   * @param {string} objectId - ID de l'objet (ex: "c1_obj")
   */
  function openUpload(objectId) {
    const spaceSlug = window.ATLANTIS_SPACE || "default";

    // 1. Vérifier que l'objet existe dans la config
    const objConfig = CONFIG.objects[objectId];
    if (!objConfig) {
      console.error(`❌ Objet "${objectId}" non trouvé dans la config PLV`);
      console.log(
        "📋 Objets disponibles:",
        Object.keys(CONFIG.objects).join(", ")
      );
      return false;
    }

    // 2. Vérifier les droits sur la zone
    const access = checkZoneAccess(objConfig.zone);

    console.log(`\n🔐 Vérification accès pour ${objectId}:`);
    console.log(`   Espace: ${spaceSlug}`);
    console.log(`   Zone: ${objConfig.zone}`);
    console.log(`   Résultat: ${access.reason}`);

    if (!access.allowed) {
      console.warn(`\n⛔ ACCÈS REFUSÉ: ${access.reason}`);
      return false;
    }

    // 3. Vérifier que plv-upload.js est chargé
    if (!window.atlantisPLVUpload) {
      console.error("❌ plv-upload.js non chargé!");
      return false;
    }

    // 4. Ouvrir la popup d'upload
    console.log(`\n✅ Ouverture upload pour ${objConfig.title || objectId}...`);

    window.atlantisPLVUpload.open({
      id: objectId,
      title: objConfig.title || objectId,
      shader: objConfig.shader,
      file: objConfig.file,
      zone: objConfig.zone,
      zoneSlug: objConfig.zone,
      format: objConfig.format,
      ratio: objConfig.ratio,
      resolution: objConfig.resolution,
      spaceSlug: spaceSlug,
    });

    return true;
  }

  // ============================================
  // 🧪 COMMANDES CONSOLE DE TEST
  // ============================================

  // Commandes individuelles par objet
  window.c1_openupload = () => openUpload("c1_obj");
  window.p1_openupload = () => openUpload("p1_obj");
  window.l1_openupload = () => openUpload("l1_obj");
  window.l2_openupload = () => openUpload("l2_obj");

  // Commande générique
  window.plv_openupload = (objectId) => openUpload(objectId);

  // Vérification rôle seule (debug)
  window.plv_checkrole = (zoneSlug) => {
    const result = checkZoneAccess(zoneSlug);
    console.log("\n🔍 Vérification rôle:");
    console.log("   Zone:", zoneSlug);
    console.log("   Résultat:", result.reason);
    console.log("   Code:", result.code);
    return result;
  };

  // Afficher user actuel (debug)
  window.plv_whoami = () => {
    const user = getUser();
    if (!user) {
      console.log("❌ Non connecté");
      return null;
    }
    console.log("\n👤 Utilisateur connecté:");
    console.log("   Email:", user.email);
    console.log("   Rôle global:", user.global_role);
    console.log("   Rôles espaces:", user.space_roles || []);
    return user;
  };

  // Liste objets config
  window.plv_list = () => {
    console.log("\n📋 Objets PLV configurés:");
    Object.entries(CONFIG.objects).forEach(([id, obj]) => {
      console.log(`   ${id} → Zone: ${obj.zone} | ${obj.format} | ${obj.file}`);
    });
  };

  // ============================================
  // 🌍 API PUBLIQUE
  // ============================================

  window.atlantisPLV = {
    openUpload,
    checkZoneAccess,
    getUser,
    getConfig: () => CONFIG,
  };

  // ============================================
  // 📢 MESSAGE AIDE
  // ============================================

  console.log(`
🎛️ PLV Manager chargé!

📋 COMMANDES CONSOLE:
   c1_openupload()    → Upload PLV Carré (zone1)
   p1_openupload()    → Upload PLV Portrait (zone2)
   l1_openupload()    → Upload PLV Paysage 1 (zone2)
   l2_openupload()    → Upload PLV Paysage 2 (zone2)

🔍 DEBUG:
   plv_whoami()       → Affiche user connecté
   plv_checkrole("mascenetest-zone1") → Vérifie accès zone
   plv_list()         → Liste tous les objets

🔐 ZONES:
   mascenetest-zone1  → c1
   mascenetest-zone2  → p1, l1, l2
`);
})();
