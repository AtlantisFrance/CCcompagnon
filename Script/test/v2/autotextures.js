/**
 * ============================================
 * 🎨 AUTOTEXTURES PLV - ATLANTIS CITY
 * Chargement automatique des textures depuis OVH
 * Utilise window.ATLANTIS_SPACE comme identifiant
 * ============================================
 */

(function () {
  "use strict";

  const viewer = WALK.getViewer();

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
  // 🔘 BOUTON RECHARGEMENT
  // ============================================
  function createReloadButton() {
    // Éviter doublon
    if (document.getElementById("reload-textures-btn")) return;

    const button = document.createElement("button");
    button.id = "reload-textures-btn";
    button.innerHTML = "🔄 Actualiser PLV";
    button.title = "Recharger les textures depuis le serveur";

    button.style.cssText = `
      position: fixed;
      top: 20px;
      left: 50%;
      transform: translateX(-50%);
      z-index: 10000;
      padding: 10px 20px;
      font-size: 14px;
      font-weight: 600;
      font-family: "Segoe UI", Roboto, sans-serif;
      color: white;
      background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
      border: 2px solid rgba(255, 255, 255, 0.3);
      border-radius: 25px;
      cursor: pointer;
      box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
      transition: all 0.3s ease;
    `;

    button.addEventListener("mouseenter", () => {
      if (!isLoading) {
        button.style.transform = "translateX(-50%) translateY(-2px)";
        button.style.boxShadow = "0 6px 20px rgba(59, 130, 246, 0.5)";
      }
    });

    button.addEventListener("mouseleave", () => {
      if (!isLoading) {
        button.style.transform = "translateX(-50%)";
        button.style.boxShadow = "0 4px 15px rgba(0, 0, 0, 0.3)";
      }
    });

    button.addEventListener("click", () => {
      if (!isLoading) {
        loadAllTextures();
      }
    });

    document.body.appendChild(button);
  }

  // Mettre à jour l'état visuel du bouton
  function updateButtonState(loading, success = null) {
    const button = document.getElementById("reload-textures-btn");
    if (!button) return;

    isLoading = loading;

    if (loading) {
      button.innerHTML = "⏳ Chargement...";
      button.style.cursor = "wait";
      button.style.opacity = "0.7";
    } else if (success === true) {
      button.innerHTML = "✅ Actualisé !";
      button.style.background =
        "linear-gradient(135deg, #22c55e 0%, #16a34a 100%)";
      setTimeout(() => {
        button.innerHTML = "🔄 Actualiser PLV";
        button.style.background =
          "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)";
        button.style.cursor = "pointer";
        button.style.opacity = "1";
      }, 2000);
    } else if (success === false) {
      button.innerHTML = "❌ Erreur";
      button.style.background =
        "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)";
      setTimeout(() => {
        button.innerHTML = "🔄 Actualiser PLV";
        button.style.background =
          "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)";
        button.style.cursor = "pointer";
        button.style.opacity = "1";
      }, 2000);
    }
  }

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
            console.error(`❌ Texture creation failed for ${material.name}`);
            reject(new Error("Texture creation failed"));
          }
        } catch (e) {
          console.error(`❌ Error applying texture for ${material.name}:`, e);
          reject(e);
        }
      };

      img.onerror = () => {
        console.error(`❌ Image load failed: ${imageUrl}`);
        reject(new Error("Image load failed"));
      };

      img.src = imageUrl;
    });
  }

  // ============================================
  // 🚀 CHARGEMENT PRINCIPAL
  // ============================================
  async function loadAllTextures() {
    console.log(`🚀 Chargement textures PLV (${config.spaceSlug})...`);
    updateButtonState(true);

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
              console.log(`✅ ${shaderName} → ${fileName}`);
            })
            .catch(() => errorCount++);
        } else {
          console.warn(`⚠️ Matériau '${shaderName}' introuvable`);
          errorCount++;
          return Promise.resolve();
        }
      });

      await Promise.all(promises);
    }

    const success = errorCount === 0;
    console.log(
      `✅ Terminé: ${loadedCount}/${totalTextures} (${errorCount} erreurs)`
    );
    updateButtonState(false, success);

    return { loaded: loadedCount, errors: errorCount, total: totalTextures };
  }

  // ============================================
  // 📋 INITIALISATION
  // ============================================

  // Marquer les matériaux comme éditables
  const materialNames = Object.keys(config.textures);
  console.log(`🎨 Setting ${materialNames.length} materials as editable...`);
  console.log(`📡 Source: OVH PHP - Project ${config.spaceSlug}`);

  materialNames.forEach((materialName) => {
    viewer.setMaterialEditable(materialName);
  });

  // Au chargement de la scène
  viewer.onSceneLoadComplete(() => {
    console.log(`🏁 Module AutoTextures PLV prêt`);
    createReloadButton();
    loadAllTextures();
  });

  // ============================================
  // 🌍 API PUBLIQUE
  // ============================================
  window.reloadPLVTextures = loadAllTextures;

  window.atlantisTextures = {
    reload: loadAllTextures,
    getSpaceSlug: () => config.spaceSlug,
    getConfig: () => ({ ...config, textures: { ...config.textures } }),

    // Ajouter/modifier un mapping shader → fichier à la volée
    setTexture: (shaderName, fileName) => {
      config.textures[shaderName] = fileName;
      console.log(`📝 Mapping ajouté: ${shaderName} → ${fileName}`);
    },
  };

  console.log("🚀 Module AutoTextures OVH initialisé");
})();
