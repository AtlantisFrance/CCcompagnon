/**
 * ============================================
 * 🔗 POPUP INTEGRATION - Shapespark
 * ============================================
 *
 * Fait le lien entre les clics Shapespark et le système popup
 *
 * v1.1 - Avec debug complet
 */

(function () {
  "use strict";

  console.log("🔗 Popup Integration: Script chargé");

  // === CONFIGURATION DES OBJETS ===
  const POPUP_OBJECTS = {
    c1_obj: {
      objectName: "c1_obj",
      shader: "c1_shdr",
      format: "carré",
      ratio: "1:1",
      resolution: "1024x1024",
      file: "c1.jpg",
      title: "PLV Carré 1",
      zoneSlug: "zone1",
    },
    c2_obj: {
      objectName: "c2_obj",
      shader: "c2_shdr",
      format: "carré",
      ratio: "1:1",
      resolution: "1024x1024",
      file: "c2.jpg",
      title: "PLV Carré 2",
      zoneSlug: "zone1",
    },
    l1_obj: {
      objectName: "l1_obj",
      shader: "l1_shdr",
      format: "paysage",
      ratio: "16:9",
      resolution: "1920x1080",
      file: "l1.jpg",
      title: "PLV Paysage 1",
      zoneSlug: "zone2",
    },
    l2_obj: {
      objectName: "l2_obj",
      shader: "l2_shdr",
      format: "paysage",
      ratio: "16:9",
      resolution: "1920x1080",
      file: "l2.jpg",
      title: "PLV Paysage 2",
      zoneSlug: "zone2",
    },
    p1_obj: {
      objectName: "p1_obj",
      shader: "p1_shdr",
      format: "portrait",
      ratio: "9:16",
      resolution: "1080x1920",
      file: "p1.jpg",
      title: "PLV Portrait 1",
      zoneSlug: "zone2",
    },
    p2_obj: {
      objectName: "p2_obj",
      shader: "p2_shdr",
      format: "portrait",
      ratio: "9:16",
      resolution: "1080x1920",
      file: "p2.jpg",
      title: "PLV Portrait 2",
      zoneSlug: "zone2",
    },
  };

  // === INIT ===
  function init() {
    console.log("🔗 Init: Vérification WALK...");

    if (typeof WALK === "undefined") {
      console.log("🔗 WALK non défini, attente 500ms...");
      setTimeout(init, 500);
      return;
    }

    console.log("🔗 WALK trouvé");

    if (!WALK.getViewer) {
      console.log("🔗 WALK.getViewer non disponible, attente 500ms...");
      setTimeout(init, 500);
      return;
    }

    const viewer = WALK.getViewer();
    console.log("🔗 Viewer obtenu:", viewer);

    if (!viewer) {
      console.log("🔗 Viewer null, attente 500ms...");
      setTimeout(init, 500);
      return;
    }

    // Lister les méthodes disponibles
    console.log(
      "🔗 Méthodes du viewer:",
      Object.keys(viewer).filter((k) => typeof viewer[k] === "function")
    );

    // Attendre que la scène soit chargée
    if (viewer.onSceneLoadComplete) {
      console.log("🔗 onSceneLoadComplete disponible, attente scène...");
      viewer.onSceneLoadComplete(function () {
        console.log("🔗 Scène chargée !");
        setupClickHandlers(viewer);
      });
    } else {
      console.log("🔗 onSceneLoadComplete NON disponible, setup direct...");
      setupClickHandlers(viewer);
    }
  }

  // === SETUP CLICK HANDLERS ===
  function setupClickHandlers(viewer) {
    console.log("🔗 Setup click handlers...");

    // Méthode 1: onNodeTypeClicked (nouvelle API)
    if (viewer.onNodeTypeClicked) {
      console.log("🔗 Utilisation onNodeTypeClicked");

      viewer.onNodeTypeClicked("Object", function (node) {
        console.log("🔗 CLIC DÉTECTÉ sur objet:", node);
        console.log("🔗 Nom du node:", node.name);

        handleClick(node.name);
      });

      console.log("🔗 onNodeTypeClicked configuré");
    }
    // Méthode 2: onNodeClicked (ancienne API)
    else if (viewer.onNodeClicked) {
      console.log("🔗 Utilisation onNodeClicked (ancienne API)");

      viewer.onNodeClicked(function (node) {
        console.log("🔗 CLIC DÉTECTÉ (ancienne API):", node);
        handleClick(node.name);
      });

      console.log("🔗 onNodeClicked configuré");
    } else {
      console.error("🔗 AUCUNE MÉTHODE DE CLIC DISPONIBLE !");
      console.log("🔗 Méthodes disponibles:", Object.keys(viewer));
    }

    console.log(
      "🔗 Objets popup configurés: " + Object.keys(POPUP_OBJECTS).join(", ")
    );
  }

  // === HANDLE CLICK ===
  function handleClick(objectName) {
    console.log('🔗 handleClick("' + objectName + '")');

    var config = POPUP_OBJECTS[objectName];

    if (config) {
      console.log("🔗 Config trouvée:", config);

      if (window.atlantisPopup) {
        console.log("🔗 Appel atlantisPopup.open()...");
        window.atlantisPopup.open(config);
      } else {
        console.error("🔗 window.atlantisPopup non disponible !");
      }
    } else {
      console.log(
        '🔗 Objet "' + objectName + '" pas dans POPUP_OBJECTS (ignoré)'
      );
    }
  }

  // === TEST MANUEL ===
  window.testPopupClick = function (objectName) {
    console.log("Test manuel: " + objectName);
    handleClick(objectName || "c1_obj");
  };

  // === API PUBLIQUE ===
  window.atlantisPopupIntegration = {
    getConfig: function (name) {
      return POPUP_OBJECTS[name];
    },
    getAllConfigs: function () {
      return Object.assign({}, POPUP_OBJECTS);
    },
    addConfig: function (name, config) {
      POPUP_OBJECTS[name] = config;
    },
    reinit: init,
  };

  // === DÉMARRAGE ===
  console.log("🔗 Démarrage init...");
  init();

  console.log("🔗 Popup Integration chargé");
  console.log('Pour tester manuellement: testPopupClick("c1_obj")');
})();
