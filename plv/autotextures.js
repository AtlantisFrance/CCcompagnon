(function () {
  const viewer = WALK.getViewer();

  const config = {
    projectId: "00001",

    getImageUrl(fileName) {
      // Ajoute un timestamp pour forcer le refresh quand l'image change
      const version = Date.now();
      return `https://compagnon.atlantis-city.com/plv/image.php?project=${this.projectId}&file=${fileName}&v=${version}`;
    },

    batchSize: 3,
    textures: {
      plvcarre_shdr: "11.jpg",
      plvportrait_shdr: "916.jpg",
      plvpaysage_shdr: "169.jpg",
    },
    opaqueList: [],
  };

  const materialNames = Object.keys(config.textures);
  console.log(`🎨 Setting ${materialNames.length} materials as editable...`);
  console.log(`📡 Source: OVH PHP - Project ${config.projectId}`);
  materialNames.forEach((materialName) => {
    viewer.setMaterialEditable(materialName);
  });

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

  viewer.onSceneLoadComplete(async () => {
    console.log(`🚀 Chargement textures OVH PHP (${config.projectId})...`);

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

    console.log(
      `✅ OVH terminé: ${loadedCount}/${totalTextures} (${errorCount} erreurs)`
    );
  });
})();
