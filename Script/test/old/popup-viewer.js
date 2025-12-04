/**
 * ============================================
 * 🖼️ POPUP VIEWER v3.2
 * ============================================
 * Gère l'affichage des popups natifs Shapespark
 * + Charge contenu via API
 * + Fallback si pas de contenu
 */

(function () {
  "use strict";

  const API_BASE = "https://compagnon.atlantis-city.com/api";

  let currentPopup = null;
  let isOpen = false;

  // === HELPERS ===
  function isUserAdmin() {
    if (!window.atlantisAuth) return false;
    const user = window.atlantisAuth.getUser();
    if (!user) return false;
    return (
      user.global_role === "super_admin" ||
      user.global_role === "space_admin" ||
      user.global_role === "zone_admin"
    );
  }

  function getSpaceSlug() {
    return window.ATLANTIS_SPACE || "scenetest";
  }

  // === CRÉER LE CONTAINER POPUP ===
  function createPopupContainer() {
    // Supprimer si existe déjà
    const existing = document.getElementById("popup-overlay");
    if (existing) existing.remove();

    // Overlay
    const overlay = document.createElement("div");
    overlay.id = "popup-overlay";
    overlay.style.cssText = `
            position: fixed;
            inset: 0;
            background: rgba(0, 0, 0, 0.7);
            z-index: 50000;
            display: flex;
            align-items: center;
            justify-content: center;
            opacity: 0;
            transition: opacity 0.3s ease;
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        `;

    // Container
    const container = document.createElement("div");
    container.id = "popup-container";
    container.style.cssText = `
            background: #1e293b;
            border-radius: 16px;
            max-width: 90vw;
            max-height: 90vh;
            overflow: hidden;
            box-shadow: 0 25px 50px rgba(0, 0, 0, 0.5);
            transform: scale(0.9);
            transition: transform 0.3s ease;
            display: flex;
            flex-direction: column;
        `;

    overlay.appendChild(container);
    document.body.appendChild(overlay);

    // Fermer au clic extérieur
    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) close();
    });

    // Animation entrée
    requestAnimationFrame(() => {
      overlay.style.opacity = "1";
      container.style.transform = "scale(1)";
    });

    return container;
  }

  // === OBTENIR TAILLE SELON FORMAT ===
  function getPopupSize(format) {
    const sizes = {
      carré: { width: "400px", minHeight: "420px" },
      carre: { width: "400px", minHeight: "420px" },
      paysage: { width: "560px", minHeight: "350px" },
      portrait: { width: "340px", minHeight: "500px" },
    };
    return sizes[format] || sizes["carré"];
  }

  // === AFFICHER POPUP VIDE (pas de contenu) ===
  function showEmptyPopup(config, isAdmin) {
    console.log("🖼️ Affichage popup vide, admin:", isAdmin);

    const container = createPopupContainer();
    const size = getPopupSize(config.format);
    container.style.width = size.width;
    container.style.minHeight = size.minHeight;

    // Header
    const header = document.createElement("div");
    header.style.cssText = `
            padding: 16px 20px;
            background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%);
            display: flex;
            justify-content: space-between;
            align-items: center;
        `;
    header.innerHTML = `
            <div>
                <div style="font-size: 14px; font-weight: 600; color: white;">
                    ${config.title || config.objectName}
                </div>
                <div style="font-size: 11px; color: rgba(255,255,255,0.7);">
                    ${config.format || "popup"} • ${config.ratio || ""}
                </div>
            </div>
            <button id="popup-close-btn" style="
                background: rgba(255,255,255,0.2);
                border: none;
                width: 32px;
                height: 32px;
                border-radius: 50%;
                color: white;
                font-size: 18px;
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
            ">×</button>
        `;
    container.appendChild(header);

    // Body
    const body = document.createElement("div");
    body.style.cssText = `
            flex: 1;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            padding: 40px 20px;
            text-align: center;
            color: #94a3b8;
        `;

    if (isAdmin) {
      // Mode admin : bouton créer contenu
      body.innerHTML = `
                <div style="font-size: 48px; margin-bottom: 16px;">📝</div>
                <h3 style="margin: 0 0 8px; color: #f1f5f9; font-size: 18px;">Aucun contenu</h3>
                <p style="margin: 0 0 24px; font-size: 14px;">Ce popup n'a pas encore de contenu configuré.</p>
                <button id="popup-create-btn" style="
                    padding: 12px 24px;
                    background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
                    border: none;
                    border-radius: 10px;
                    color: white;
                    font-size: 14px;
                    font-weight: 600;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                ">
                    ✏️ Créer le contenu
                </button>
            `;
    } else {
      // Mode viewer : message simple
      body.innerHTML = `
                <div style="font-size: 48px; margin-bottom: 16px;">🚧</div>
                <h3 style="margin: 0 0 8px; color: #f1f5f9; font-size: 18px;">Contenu en préparation</h3>
                <p style="margin: 0; font-size: 14px;">Ce contenu sera bientôt disponible.</p>
            `;
    }
    container.appendChild(body);

    // Events
    document.getElementById("popup-close-btn").onclick = close;

    if (isAdmin) {
      document.getElementById("popup-create-btn").onclick = () => {
        console.log("🖼️ Ouverture éditeur...");
        close();
        // Ouvrir l'éditeur
        setTimeout(() => {
          if (window.popupTemplateEditor) {
            window.popupTemplateEditor.open(config, null);
          } else if (window.templateEditor) {
            window.templateEditor.open(config, null);
          } else {
            console.error("🖼️ Template editor non disponible");
            alert(
              "Éditeur non disponible. Vérifiez que popup-template-editor.js est chargé."
            );
          }
        }, 350);
      };
    }

    // Touche Escape
    const escHandler = (e) => {
      if (e.key === "Escape") {
        close();
        document.removeEventListener("keydown", escHandler);
      }
    };
    document.addEventListener("keydown", escHandler);

    currentPopup = { config, container };
    isOpen = true;
  }

  // === AFFICHER POPUP AVEC CONTENU ===
  function showPopupWithContent(config, htmlContent, isAdmin) {
    console.log("🖼️ Affichage popup avec contenu, admin:", isAdmin);

    const container = createPopupContainer();
    const size = getPopupSize(config.format);
    container.style.width = size.width;

    // Header (si admin)
    if (isAdmin) {
      const header = document.createElement("div");
      header.style.cssText = `
                padding: 12px 16px;
                background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%);
                display: flex;
                justify-content: space-between;
                align-items: center;
            `;
      header.innerHTML = `
                <div style="display: flex; gap: 8px; align-items: center;">
                    <span style="background: rgba(255,255,255,0.2); padding: 4px 10px; border-radius: 12px; font-size: 11px; color: white;">
                        🔧 Admin
                    </span>
                    <span style="background: rgba(255,255,255,0.2); padding: 4px 10px; border-radius: 12px; font-size: 11px; color: white;">
                        ${config.format || "popup"}
                    </span>
                </div>
                <div style="display: flex; gap: 8px; align-items: center;">
                    <button id="popup-edit-btn" style="
                        background: rgba(255,255,255,0.2);
                        border: none;
                        padding: 6px 12px;
                        border-radius: 6px;
                        color: white;
                        font-size: 12px;
                        cursor: pointer;
                    ">✏️ Modifier</button>
                    <button id="popup-close-btn" style="
                        background: rgba(255,255,255,0.2);
                        border: none;
                        width: 28px;
                        height: 28px;
                        border-radius: 50%;
                        color: white;
                        font-size: 16px;
                        cursor: pointer;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                    ">×</button>
                </div>
            `;
      container.appendChild(header);
    }

    // Body avec contenu
    const body = document.createElement("div");
    body.id = "popup-content-body";
    body.style.cssText = `
            padding: 0;
            overflow: auto;
            max-height: 70vh;
        `;
    body.innerHTML = htmlContent;
    container.appendChild(body);

    // Bouton fermer en bas si pas de header admin
    if (!isAdmin) {
      const closeBar = document.createElement("div");
      closeBar.style.cssText = `
                padding: 12px;
                text-align: center;
                border-top: 1px solid #334155;
            `;
      closeBar.innerHTML = `
                <button id="popup-close-btn" style="
                    background: #334155;
                    border: none;
                    padding: 8px 24px;
                    border-radius: 8px;
                    color: #f1f5f9;
                    font-size: 14px;
                    cursor: pointer;
                ">Fermer</button>
            `;
      container.appendChild(closeBar);
    }

    // Events
    document.getElementById("popup-close-btn").onclick = close;

    if (isAdmin && document.getElementById("popup-edit-btn")) {
      document.getElementById("popup-edit-btn").onclick = () => {
        console.log("🖼️ Ouverture éditeur pour modification...");
        close();
        setTimeout(() => {
          if (window.popupTemplateEditor) {
            // Récupérer les données existantes
            loadAndEditPopup(config);
          } else {
            console.error("🖼️ Template editor non disponible");
          }
        }, 350);
      };
    }

    // Touche Escape
    const escHandler = (e) => {
      if (e.key === "Escape") {
        close();
        document.removeEventListener("keydown", escHandler);
      }
    };
    document.addEventListener("keydown", escHandler);

    currentPopup = { config, container };
    isOpen = true;
  }

  // === CHARGER ET ÉDITER UN POPUP EXISTANT ===
  async function loadAndEditPopup(config) {
    const spaceSlug = getSpaceSlug();

    try {
      const response = await fetch(
        `${API_BASE}/popups/get.php?space_slug=${spaceSlug}&object_name=${config.objectName}`
      );
      const result = await response.json();

      if (result.success && result.data?.popup) {
        const existingData = {
          template_type: result.data.popup.template_type,
          template_config: result.data.popup.template_config,
        };
        window.popupTemplateEditor.open(config, existingData);
      } else {
        window.popupTemplateEditor.open(config, null);
      }
    } catch (error) {
      console.error("🖼️ Erreur chargement pour édition:", error);
      window.popupTemplateEditor.open(config, null);
    }
  }

  // === OUVRIR UN POPUP ===
  async function open(config) {
    if (isOpen) {
      close();
      await new Promise((r) => setTimeout(r, 350));
    }

    console.log("🖼️ open() appelé avec:", config);

    const isAdmin = isUserAdmin();
    const spaceSlug = getSpaceSlug();
    const objectName = config.objectName;

    console.log(
      "🖼️ Ouverture popup:",
      objectName,
      "(admin:",
      isAdmin,
      ", space:",
      spaceSlug + ")"
    );

    // Charger le contenu depuis l'API
    try {
      console.log("🖼️ Chargement depuis API...");
      const response = await fetch(
        `${API_BASE}/popups/get.php?space_slug=${spaceSlug}&object_name=${objectName}`
      );
      const result = await response.json();

      console.log("🖼️ Réponse API:", result);

      if (
        result.success &&
        result.data?.exists &&
        result.data?.popup?.html_content
      ) {
        // Contenu trouvé !
        console.log("🖼️ Contenu trouvé, affichage...");
        showPopupWithContent(config, result.data.popup.html_content, isAdmin);
      } else {
        // Pas de contenu
        console.log("🖼️ Pas de contenu, affichage popup vide");
        showEmptyPopup(config, isAdmin);
      }
    } catch (error) {
      console.error("🖼️ Erreur chargement:", error);
      // En cas d'erreur, afficher popup vide
      showEmptyPopup(config, isAdmin);
    }
  }

  // === FERMER LE POPUP ===
  function close() {
    const overlay = document.getElementById("popup-overlay");
    if (overlay) {
      overlay.style.opacity = "0";
      const container = document.getElementById("popup-container");
      if (container) {
        container.style.transform = "scale(0.9)";
      }
      setTimeout(() => {
        overlay.remove();
      }, 300);
    }
    currentPopup = null;
    isOpen = false;
    console.log("🖼️ Popup fermé");
  }

  // === RECHARGER LE POPUP ACTUEL ===
  function reload() {
    if (currentPopup && currentPopup.config) {
      const config = currentPopup.config;
      close();
      setTimeout(() => open(config), 350);
    }
  }

  // === NOTIFICATION ===
  function showNotification(message, type) {
    const notif = document.createElement("div");
    notif.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            padding: 12px 20px;
            background: ${
              type === "success"
                ? "#22c55e"
                : type === "error"
                ? "#ef4444"
                : "#3b82f6"
            };
            color: white;
            border-radius: 8px;
            font-size: 14px;
            font-weight: 500;
            z-index: 60000;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            animation: slideIn 0.3s ease;
        `;
    notif.textContent = message;
    document.body.appendChild(notif);

    setTimeout(() => {
      notif.style.opacity = "0";
      notif.style.transform = "translateX(20px)";
      notif.style.transition = "all 0.3s ease";
      setTimeout(() => notif.remove(), 300);
    }, 3000);
  }

  // === API PUBLIQUE ===
  window.atlantisPopup = {
    open: open,
    close: close,
    reload: reload,
    isOpen: () => isOpen,
    getState: () => ({ isOpen, currentPopup }),
    showNotification: showNotification,
  };

  // Écouter événement de sauvegarde pour recharger
  document.addEventListener("atlantis-popup-content-saved", (e) => {
    console.log("🖼️ Contenu sauvegardé, rechargement...");
    if (
      currentPopup &&
      currentPopup.config.objectName === e.detail.objectName
    ) {
      reload();
    }
  });

  console.log("🖼️ Popup Viewer v3.2 chargé (API + fallback)");
})();
