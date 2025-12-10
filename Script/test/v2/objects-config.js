/**
 * ============================================
 * ⚙️ OBJECTS CONFIG - ATLANTIS CITY
 * Configuration centralisée de tous les objets cliquables
 * ============================================
 * v1.0 - 2024-12-01 - Version initiale
 * v1.1 - 2024-12-10 - Ajout type "action" + plafond_obj reload_plv
 * ============================================
 *
 * 📍 L'espace (space) est défini dans body-end.html :
 *    window.ATLANTIS_SPACE = "scenetest";
 *
 * 📍 Ici on définit seulement la ZONE (zone1, zone2...)
 *    Le slug complet sera : {ATLANTIS_SPACE}-{zone}
 *
 * 📍 Types d'objets:
 *    - "plv"     → PLV avec texture uploadable
 *    - "object"  → Objet simple avec popup
 *    - "action"  → Objet déclencheur d'action (pas de popup)
 *
 * 📍 Actions onClick disponibles:
 *    - "popup"       → Affiche une popup
 *    - "upload"      → Ouvre le modal upload (admin)
 *    - "url"         → Ouvre un lien externe
 *    - "reload_plv"  → Recharge toutes les textures PLV
 * ============================================
 */

window.ATLANTIS_OBJECTS_CONFIG = {
  // =========================================
  // 🔄 ACTION - Rechargement textures
  // =========================================
  plafond_obj: {
    zone: null, // Pas de zone requise
    type: "action",
    onClick: "reload_plv", // 🔄 Déclenche le rechargement des textures
    adminButtons: [], // Pas de boutons admin
  },

  // =========================================
  // 🖼️ PLV CARRÉ - Zone 1
  // =========================================
  c1_obj: {
    zone: "zone1",
    type: "plv",
    plv: {
      shader: "c1_shdr",
      file: "template_C1.png",
      format: "Carré",
      ratio: "1:1",
      resolution: "1024×1024",
    },
    onClick: "popup",
    adminButtons: ["edit", "upload"],
  },

  // =========================================
  // 🖼️ PLV PORTRAIT - Zone 2
  // =========================================
  p1_obj: {
    zone: "zone2",
    type: "plv",
    plv: {
      shader: "p1_shdr",
      file: "template_P1.png",
      format: "Portrait",
      ratio: "9:16",
      resolution: "1080×1920",
    },
    onClick: "popup",
    adminButtons: ["edit", "upload"],
  },

  // =========================================
  // 🖼️ PLV PAYSAGE 1 - Zone 2
  // =========================================
  l1_obj: {
    zone: "zone2",
    type: "plv",
    plv: {
      shader: "l1_shdr",
      file: "template_L1.png",
      format: "Paysage",
      ratio: "16:9",
      resolution: "1920×1080",
    },
    onClick: "popup",
    adminButtons: ["edit", "upload"],
  },

  // =========================================
  // 🖼️ PLV PAYSAGE 2 - Zone 2
  // =========================================
  l2_obj: {
    zone: "zone2",
    type: "plv",
    plv: {
      shader: "l2_shdr",
      file: "template_L2.png",
      format: "Paysage",
      ratio: "16:9",
      resolution: "1920×1080",
    },
    onClick: "popup",
    adminButtons: ["edit", "upload"],
  },

  // =========================================
  // 🪑 OBJET SIMPLE - Chaise (exemple)
  // Pas de PLV, juste une popup éditable
  // =========================================
  chaise: {
    zone: "zone1",
    type: "object",
    onClick: "popup",
    adminButtons: ["edit"], // Pas d'upload, c'est pas un PLV
  },
};

// ============================================
// 🔧 HELPERS
// ============================================

/**
 * Récupère le slug complet de la zone
 * @param {string} zoneShort - Zone courte ("zone1")
 * @returns {string} - Zone complète ("scenetest-zone1")
 */
window.getFullZoneSlug = function (zoneShort) {
  const space = window.ATLANTIS_SPACE || "default";
  return `${space}-${zoneShort}`;
};

/**
 * Récupère la config d'un objet
 * @param {string} objectId - ID de l'objet ("c1_obj")
 * @returns {object|null} - Config ou null
 */
window.getObjectConfig = function (objectId) {
  return window.ATLANTIS_OBJECTS_CONFIG[objectId] || null;
};

/**
 * Liste tous les objets configurés
 * @returns {string[]} - IDs des objets
 */
window.listConfiguredObjects = function () {
  return Object.keys(window.ATLANTIS_OBJECTS_CONFIG);
};

/**
 * Liste les objets par type
 * @param {string} type - "plv", "object", "action"
 * @returns {string[]} - IDs des objets du type
 */
window.listObjectsByType = function (type) {
  return Object.entries(window.ATLANTIS_OBJECTS_CONFIG)
    .filter(([_, config]) => config.type === type)
    .map(([id]) => id);
};

console.log(
  "⚙️ Objects Config chargé:",
  Object.keys(window.ATLANTIS_OBJECTS_CONFIG).length,
  "objets"
);
