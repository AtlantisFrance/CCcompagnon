(function () {
  const viewer = WALK.getViewer();

  const config = {
    projectId: "scenetest",

    getImageUrl(fileName) {
      const version = Date.now();
      return `https://compagnon.atlantis-city.com/plv/image.php?project=${this.projectId}&file=${fileName}&v=${version}`;
    },

    batchSize: 3,
    textures: {
      c1_shdr: "template_C1.png",
      l1_shdr: "template_L1.png",
      l2_shdr: "template_L2.png",
      p1_shdr: "template_P1.png",
    },
    opaqueList: ["c1_shdr", "l1_shdr", "p1_shdr"],
  };

  let isLoading = false;

  function createReloadButton() {
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
      background: linear-gradient(135deg, #376ab3 0%, #2a5694 100%);
      border: 2px solid rgba(255, 255, 255, 0.3);
      border-radius: 25px;
      cursor: pointer;
      box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
      transition: all 0.3s ease;
    `;

    button.addEventListener("mouseenter", () => {
      if (!isLoading) {
        button.style.transform = "translateX(-50%) translateY(-2px)";
        button.style.boxShadow = "0 6px 20px rgba(55, 106, 179, 0.5)";
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
    console.log("🔘 Bouton rechargement PLV créé");
  }

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
        "linear-gradient(135deg, #28a745 0%, #1e7e34 100%)";
      setTimeout(() => {
        button.innerHTML = "🔄 Actualiser PLV";
        button.style.background =
          "linear-gradient(135deg, #376ab3 0%, #2a5694 100%)";
        button.style.cursor = "pointer";
        button.style.opacity = "1";
      }, 2000);
    } else if (success === false) {
      button.innerHTML = "❌ Erreur";
      button.style.background =
        "linear-gradient(135deg, #dc3545 0%, #b02a37 100%)";
      setTimeout(() => {
        button.innerHTML = "🔄 Actualiser PLV";
        button.style.background =
          "linear-gradient(135deg, #376ab3 0%, #2a5694 100%)";
        button.style.cursor = "pointer";
        button.style.opacity = "1";
      }, 2000);
    }
  }

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
            reject(new Error(`Texture creation failed`));
          }
        } catch (e) {
          console.error(`❌ Error applying texture for ${material.name}:`, e);
          reject(e);
        }
      };

      img.onerror = () => {
        console.error(`❌ Image load failed: ${imageUrl}`);
        reject(new Error(`Image load failed`));
      };
      img.src = imageUrl;
    });
  }

  async function loadAllTextures() {
    console.log(`🚀 Chargement textures PLV (${config.projectId})...`);
    updateButtonState(true);

    const textureEntries = Object.entries(config.textures);
    let loadedCount = 0;
    let errorCount = 0;
    const totalTextures = textureEntries.length;

    for (let i = 0; i < totalTextures; i += config.batchSize) {
      const batch = textureEntries.slice(i, i + config.batchSize);

      const promises = batch.map(([materialName, fileName]) => {
        const material = viewer.findMaterial(materialName);
        if (material) {
          const imageUrl = config.getImageUrl(fileName);
          const isOpaque = config.opaqueList.includes(materialName);
          return loadSingleTextureAsync(material, imageUrl, isOpaque)
            .then(() => {
              loadedCount++;
              console.log(`✅ ${materialName} → ${fileName}`);
            })
            .catch(() => errorCount++);
        } else {
          console.warn(`⚠️ Matériau '${materialName}' introuvable`);
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
  }

  // Initialisation
  const materialNames = Object.keys(config.textures);
  console.log(`🎨 Setting ${materialNames.length} materials as editable...`);
  console.log(`📡 Source: OVH PHP - Project ${config.projectId}`);
  materialNames.forEach((materialName) => {
    viewer.setMaterialEditable(materialName);
  });

  viewer.onSceneLoadComplete(() => {
    createReloadButton();
    loadAllTextures();
  });

  window.reloadPLVTextures = loadAllTextures;

  console.log("🚀 Module AutoTextures PLV prêt");
  console.log(
    "💡 Utilisez window.reloadPLVTextures() ou le bouton pour recharger"
  );
})();
