/**
 * ============================================
 * 🎨 AUTOTEXTURES PLV - ATLANTIS CITY
 * Chargement automatique des textures depuis OVH
 * Utilise window.ATLANTIS_SPACE comme identifiant
 * ============================================
 * v1.0 - 2024-12-01 - Version initiale
 * v1.1 - 2024-12-10 - Suppression bouton, API simplifiée
 * v1.2 - 2024-12-10 - Logs conditionnels via perf.js
 * v1.3 - 2024-12-10 - Timing par texture + logs groupés
 * v1.4 - 2024-12-10 - Utilise atlantisLogGroup centralisé
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

  const logGroup = (title, items, collapsed = true) => {
    if (window.atlantisLogGroup) {
      window.atlantisLogGroup("autotextures", title, items, collapsed);
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
  // 🖼️ CHARGEMENT TEXTURE (avec timing)
  // ============================================
  function loadSingleTextureAsync(material, imageUrl, opaque = false) {
    const startTime = performance.now();

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

            const elapsed = Math.round(performance.now() - startTime);
            resolve({ success: true, time: elapsed });
          } else {
            reject(new Error("Texture creation failed"));
          }
        } catch (e) {
          reject(e);
        }
      };

      img.onerror = () => {
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
    const globalStart = performance.now();

    const textureEntries = Object.entries(config.textures);
    let loadedCount = 0;
    let errorCount = 0;
    const totalTextures = textureEntries.length;
    const results = []; // Pour le log groupé

    // Charger par batch
    for (let i = 0; i < totalTextures; i += config.batchSize) {
      const batch = textureEntries.slice(i, i + config.batchSize);

      const promises = batch.map(([shaderName, fileName]) => {
        const material = viewer.findMaterial(shaderName);

        if (material) {
          const imageUrl = config.getImageUrl(fileName);
          const isOpaque = config.opaqueList.includes(shaderName);

          return loadSingleTextureAsync(material, imageUrl, isOpaque)
            .then((result) => {
              loadedCount++;
              results.push({
                type: "success",
                message: `${shaderName} → ${fileName} (${result.time}ms)`,
                time: result.time,
              });
            })
            .catch((err) => {
              errorCount++;
              results.push({
                type: "error",
                message: `${shaderName} → ${fileName} - ${err.message}`,
                time: 0,
              });
            });
        } else {
          errorCount++;
          results.push({
            type: "warn",
            message: `Matériau '${shaderName}' introuvable`,
            time: 0,
          });
          return Promise.resolve();
        }
      });

      await Promise.all(promises);
    }

    isLoading = false;
    const globalTime = Math.round(performance.now() - globalStart);
    const success = errorCount === 0;

    // Calculer stats
    const successResults = results.filter((r) => r.type === "success");
    const avgTime =
      successResults.length > 0
        ? Math.round(
            successResults.reduce((sum, r) => sum + r.time, 0) /
              successResults.length
          )
        : 0;
    const maxTime =
      successResults.length > 0
        ? Math.max(...successResults.map((r) => r.time))
        : 0;
    const minTime =
      successResults.length > 0
        ? Math.min(...successResults.map((r) => r.time))
        : 0;

    // Ajouter résumé
    results.push({
      type: "info",
      message: `───────────────────────────────────`,
    });
    results.push({
      type: success ? "success" : "warn",
      message: `Total: ${loadedCount}/${totalTextures} en ${globalTime}ms`,
    });
    if (successResults.length > 0) {
      results.push({
        type: "info",
        message: `Temps: min ${minTime}ms | moy ${avgTime}ms | max ${maxTime}ms`,
      });
    }

    // Afficher log groupé
    logGroup(
      `Textures PLV (${loadedCount}/${totalTextures}) - ${globalTime}ms`,
      results,
      true
    );

    return {
      loaded: loadedCount,
      errors: errorCount,
      total: totalTextures,
      success,
      totalTime: globalTime,
      avgTime,
      minTime,
      maxTime,
    };
  }

  // ============================================
  // 📋 INITIALISATION
  // ============================================

  // Marquer les matériaux comme éditables
  const materialNames = Object.keys(config.textures);

  materialNames.forEach((materialName) => {
    viewer.setMaterialEditable(materialName);
  });

  // Au chargement de la scène
  viewer.onSceneLoadComplete(() => {
    log("Module prêt - Chargement des textures...", "info");
    loadAllTextures();
  });

  // ============================================
  // 🌐 API PUBLIQUE - FONCTIONS GLOBALES
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
      log(`Mapping ajouté: ${shaderName} → ${fileName}`, "info");
    },
  };

  // ============================================
  // Log initial
  // ============================================
  if (window.atlantisLog) {
    window.atlantisLog(
      "autotextures",
      `v1.4 initialisé - ${materialNames.length} textures configurées`,
      "success"
    );
  }
})();
