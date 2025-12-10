/**
 * ============================================
 * 🎨 AUTOTEXTURES PLV - ATLANTIS CITY
 * Chargement automatique des textures depuis OVH
 * Utilise window.ATLANTIS_SPACE comme identifiant
 * ============================================
 * v1.0 - 2024-12-01 - Version initiale
 * v1.1 - 2024-12-10 - Suppression bouton, API simplifiée
 * v1.2 - 2024-12-10 - Logs conditionnels via perf.js
 * ============================================
 */

(function () {
  "use strict";

  const viewer = WALK.getViewer();

  // ============================================
  // 📝 LOGGER CONDITIONNEL
  // Si perf.js est chargé → log, sinon → silence
  // ============================================
  const log = (message, type = "info") => {
    if (window.atlantisLog) {
      window.atlantisLog("autotextures", message, type);
    }
  };

  // ============================================
  // ⚙️ CONFIGURATION
  // ============================================
  const config = {
    // Utilise la variable globale, sinon fallback "default"
    get spaceSlug() {
      return window.ATLANTIS_SPACE || "default";
    },

    // URL du proxy PHP (avec CORS)
    proxyUrl: "https://compagnon.atlantis-city.com/plv/image.php",

    // Génère l'URL d'une image via le proxy (avec CORS)
    getImageUrl(fileName) {
      const version = Date.now();
      return `${this.proxyUrl}?project=${this.spaceSlug}&file=${fileName}&v=${version}`;
    },

    // Nombre de textures chargées en parallèle
    batchSize: 3,

    // ============================================
    // 🖼️ MAPPING SHADER → FICHIER
    // ============================================
    // Format: "nom_shader": "fichier.png"
    textures: {
      l2_shdr: "template_L2.png",
      c1_shdr: "template_C1.png",
      l1_shdr: "template_L1.png",
      p1_shdr: "template_P1.png",
    },

    // Shaders en mode opaque (pas de transparence)
    opaqueList: [],
  };

  // État du module
  let isLoading = false;

  // ============================================
  // 🖼️ CHARGEMENT TEXTURE
  // ============================================
  function loadSingleTextureAsync(material, imageUrl, opaque = false) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = "anonymous";

      img.onload = () => {
        try {
          const checkForAlpha = !opaque;
          const texture = viewer.createTextureFromHtmlImage(img, checkForAlpha);

          if (texture) {
            material.baseColorTexture = texture;

            if (opaque) {
              material.baseColorFactor = [1, 1, 1, 1];
              material.opacity = 1;
              material.alphaMode = "OPAQUE";
            } else {
              material.baseColorFactor = [1, 1, 1, 0.99];
              material.opacity = 0.99;
              material.alphaMode = "BLEND";
            }

            material.alphaTest = 0;
            material.metallic = 0;
            material.roughness = 1;
            material.needsUpdate = true;
            viewer.requestFrame();
            resolve();
          } else {
            log(`Texture creation failed for ${material.name}`, "error");
            reject(new Error("Texture creation failed"));
          }
        } catch (e) {
          log(
            `Error applying texture for ${material.name}: ${e.message}`,
            "error"
          );
          reject(e);
        }
      };

      img.onerror = () => {
        log(`Image load failed: ${imageUrl}`, "error");
        reject(new Error("Image load failed"));
      };

      img.src = imageUrl;
    });
  }

  // ============================================
  // 🚀 CHARGEMENT PRINCIPAL
  // ============================================
  async function loadAllTextures() {
    if (isLoading) {
      log("Chargement déjà en cours...", "warn");
      return null;
    }

    isLoading = true;
    log(`Chargement textures PLV (${config.spaceSlug})...`);

    const textureEntries = Object.entries(config.textures);
    let loadedCount = 0;
    let errorCount = 0;
    const totalTextures = textureEntries.length;

    // Charger par batch
    for (let i = 0; i < totalTextures; i += config.batchSize) {
      const batch = textureEntries.slice(i, i + config.batchSize);

      const promises = batch.map(([shaderName, fileName]) => {
        const material = viewer.findMaterial(shaderName);

        if (material) {
          const imageUrl = config.getImageUrl(fileName);
          const isOpaque = config.opaqueList.includes(shaderName);

          return loadSingleTextureAsync(material, imageUrl, isOpaque)
            .then(() => {
              loadedCount++;
              log(`${shaderName} → ${fileName}`, "success");
            })
            .catch(() => errorCount++);
        } else {
          log(`Matériau '${shaderName}' introuvable`, "warn");
          errorCount++;
          return Promise.resolve();
        }
      });

      await Promise.all(promises);
    }

    isLoading = false;
    const success = errorCount === 0;
    log(
      `Terminé: ${loadedCount}/${totalTextures} (${errorCount} erreurs)`,
      success ? "success" : "warn"
    );

    return {
      loaded: loadedCount,
      errors: errorCount,
      total: totalTextures,
      success,
    };
  }

  // ============================================
  // 📋 INITIALISATION
  // ============================================

  // Marquer les matériaux comme éditables
  const materialNames = Object.keys(config.textures);
  log(`Setting ${materialNames.length} materials as editable...`);
  log(`Source: OVH PHP - Project ${config.spaceSlug}`);

  materialNames.forEach((materialName) => {
    viewer.setMaterialEditable(materialName);
  });

  // Au chargement de la scène
  viewer.onSceneLoadComplete(() => {
    log("Module AutoTextures PLV prêt");
    loadAllTextures();
  });

  // ============================================
  // ============================================
  // 🌐 API PUBLIQUE - FONCTIONS GLOBALES
  // ============================================
  // ============================================

  /**
   * ╔════════════════════════════════════════════════════════════╗
   * ║  🔄 RECHARGER TOUTES LES TEXTURES PLV                      ║
   * ╠════════════════════════════════════════════════════════════╣
   * ║  Usage console:    reloadPLVTextures()                     ║
   * ║  Usage script:     window.reloadPLVTextures()              ║
   * ║  Retourne:         Promise<{loaded, errors, total}>        ║
   * ╚════════════════════════════════════════════════════════════╝
   */
  window.reloadPLVTextures = loadAllTextures;

  /**
   * API complète pour usage avancé
   */
  window.atlantisTextures = {
    reload: loadAllTextures,
    isLoading: () => isLoading,
    getSpaceSlug: () => config.spaceSlug,
    getConfig: () => ({ ...config, textures: { ...config.textures } }),

    // Ajouter/modifier un mapping shader → fichier à la volée
    setTexture: (shaderName, fileName) => {
      config.textures[shaderName] = fileName;
      log(`Mapping ajouté: ${shaderName} → ${fileName}`);
    },
  };

  // ============================================
  // ============================================

  log("Module AutoTextures OVH initialisé");
})();
