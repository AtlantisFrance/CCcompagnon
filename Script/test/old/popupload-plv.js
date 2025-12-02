/**
 * ============================================
 * 📤 POPUPLOAD PLV - ATLANTIS CITY
 * Module d'upload admin pour les popups PLV
 * S'intègre aux popups existantes (popupCarre, popupPaysage, popupPortrait)
 * ============================================
 */

(function () {
  // Éviter double initialisation
  if (window.__atlantisPopuploadInit) return;
  window.__atlantisPopuploadInit = true;

  // === CONFIGURATION ===
  const CONFIG = {
    spaceSlug: "scenetest",
    apiBase: "https://compagnon.atlantis-city.com/api",
    tokenKey: "atlantis_auth_token",
    userKey: "atlantis_auth_user",

    // Mapping objet → configuration complète
    objects: {
      c1_obj: {
        shader: "c1_shdr",
        file: "template_C1.png",
        format: "carré",
        ratio: "1:1",
        resolution: "1024 × 1024",
        opaque: true,
        zoneSlug: "mascenetest-zone1",
        popupClass: "carre-popup-overlay",
        icon: "⬜",
        title: "PLV Carré",
      },
      l1_obj: {
        shader: "l1_shdr",
        file: "template_L1.png",
        format: "paysage",
        ratio: "16:9",
        resolution: "1024 × 576",
        opaque: true,
        zoneSlug: "mascenetest-zone2",
        popupClass: "paysage-popup-overlay",
        icon: "🌅",
        title: "PLV Paysage",
      },
      l2_obj: {
        shader: "l2_shdr",
        file: "template_L2.png",
        format: "paysage",
        ratio: "16:9",
        resolution: "1024 × 576",
        opaque: false,
        zoneSlug: null,
        popupClass: null,
        icon: "🌅",
        title: "PLV Paysage 2",
      },
      p1_obj: {
        shader: "p1_shdr",
        file: "template_P1.png",
        format: "portrait",
        ratio: "9:16",
        resolution: "576 × 1024",
        opaque: true,
        zoneSlug: "mascenetest-zone2",
        popupClass: "portrait-popup-overlay",
        icon: "🧑",
        title: "PLV Portrait",
      },
    },
  };

  // État
  let currentObjectConfig = null;
  let selectedFile = null;

  // === FONCTIONS UTILITAIRES AUTH ===
  function getToken() {
    // Essayer via atlantisAuth d'abord
    if (
      window.atlantisAuth &&
      typeof window.atlantisAuth.getToken === "function"
    ) {
      const token = window.atlantisAuth.getToken();
      if (token) return token;
    }
    // Fallback: lire directement depuis localStorage
    try {
      return localStorage.getItem(CONFIG.tokenKey);
    } catch (e) {
      console.warn("📤 Popupload: Erreur lecture localStorage", e);
      return null;
    }
  }

  function getUser() {
    // Essayer via atlantisAuth d'abord
    if (
      window.atlantisAuth &&
      typeof window.atlantisAuth.getUser === "function"
    ) {
      const user = window.atlantisAuth.getUser();
      if (user) return user;
    }
    // Fallback: lire directement depuis localStorage
    try {
      const userStr = localStorage.getItem(CONFIG.userKey);
      return userStr ? JSON.parse(userStr) : null;
    } catch (e) {
      console.warn("📤 Popupload: Erreur lecture user localStorage", e);
      return null;
    }
  }

  function isLoggedIn() {
    return !!getUser() && !!getToken();
  }

  // === DÉTECTION PERMISSIONS ===
  function canUpload(objectConfig) {
    const user = getUser();
    if (!user) return false;

    // Super admin = accès total
    if (user.global_role === "super_admin") {
      return true;
    }

    const roles = user.space_roles || [];

    // Space admin de cet espace
    const isSpaceAdmin = roles.some(
      (r) => r.space_slug === CONFIG.spaceSlug && r.role === "space_admin"
    );
    if (isSpaceAdmin) {
      return true;
    }

    // Zone admin de cette zone spécifique
    if (objectConfig.zoneSlug) {
      const isZoneAdmin = roles.some(
        (r) =>
          r.space_slug === CONFIG.spaceSlug &&
          r.zone_slug === objectConfig.zoneSlug &&
          r.role === "zone_admin"
      );
      if (isZoneAdmin) {
        return true;
      }
    }

    return false;
  }

  function getAdminRoleLabel(objectConfig) {
    const user = getUser();
    if (!user) return null;

    if (user.global_role === "super_admin") {
      return "Super Admin";
    }

    const roles = user.space_roles || [];

    const spaceAdminRole = roles.find(
      (r) => r.space_slug === CONFIG.spaceSlug && r.role === "space_admin"
    );
    if (spaceAdminRole) {
      return `Space Admin: ${CONFIG.spaceSlug}`;
    }

    if (objectConfig.zoneSlug) {
      const zoneAdminRole = roles.find(
        (r) =>
          r.space_slug === CONFIG.spaceSlug &&
          r.zone_slug === objectConfig.zoneSlug &&
          r.role === "zone_admin"
      );
      if (zoneAdminRole) {
        return `Zone Admin: ${objectConfig.zoneSlug}`;
      }
    }

    return null;
  }

  // === INJECTION DES BOUTONS ADMIN ===
  function injectAdminButtons(popupBody, objectConfig) {
    // Vérifier si déjà injecté
    if (popupBody.querySelector(".plv-admin-buttons")) {
      return;
    }

    // Vérifier les permissions
    if (!canUpload(objectConfig)) {
      return;
    }

    const roleLabel = getAdminRoleLabel(objectConfig);

    // Créer le conteneur des boutons admin
    const adminContainer = document.createElement("div");
    adminContainer.className = "plv-admin-buttons-container";
    adminContainer.innerHTML = `
            <div class="plv-admin-buttons">
                <button class="plv-admin-btn plv-admin-btn-upload" onclick="window.atlantisPopupload.openUploadModal('${objectConfig.shader}')">
                    📤 Modifier l'image
                </button>
                <button class="plv-admin-btn plv-admin-btn-html" disabled title="Bientôt disponible">
                    📝 Contenu HTML
                </button>
            </div>
            <div class="plv-admin-badge">
                🔓 Mode Admin — ${roleLabel}
            </div>
        `;

    // Injecter avant le footer ou à la fin du body
    const footer = popupBody
      .closest(
        ".carre-popup-container, .paysage-popup-container, .portrait-popup-container"
      )
      ?.querySelector('[class$="-popup-footer"]');

    if (footer) {
      footer.parentNode.insertBefore(adminContainer, footer);
    } else {
      popupBody.appendChild(adminContainer);
    }

    console.log(
      `📤 Popupload: Boutons admin injectés pour ${objectConfig.shader}`
    );
  }

  // === OBSERVER LES POPUPS EXISTANTES ===
  function observePopups() {
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType !== Node.ELEMENT_NODE) return;

          // Chercher les popups par leur classe
          Object.entries(CONFIG.objects).forEach(([objName, objConfig]) => {
            if (!objConfig.popupClass) return;

            let popupOverlay = null;

            // Vérifier si le node ajouté est la popup
            if (
              node.classList &&
              node.classList.contains(objConfig.popupClass)
            ) {
              popupOverlay = node;
            }
            // Ou si la popup est un enfant du node ajouté
            else if (node.querySelector) {
              popupOverlay = node.querySelector(`.${objConfig.popupClass}`);
            }

            if (popupOverlay) {
              // Trouver le body de la popup
              const popupBody = popupOverlay.querySelector(
                ".carre-popup-body, .paysage-popup-body, .portrait-popup-body"
              );

              if (popupBody) {
                // Petit délai pour laisser le DOM se stabiliser
                setTimeout(() => {
                  injectAdminButtons(popupBody, objConfig);
                }, 50);
              }
            }
          });
        });
      });
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });

    console.log("📤 Popupload: Observer actif");
  }

  // === MODAL D'UPLOAD ===
  function openUploadModal(shaderName) {
    // Trouver la config de l'objet
    currentObjectConfig = Object.values(CONFIG.objects).find(
      (o) => o.shader === shaderName
    );

    if (!currentObjectConfig) {
      console.error(`📤 Popupload: Config non trouvée pour ${shaderName}`);
      return;
    }

    selectedFile = null;

    // URL de l'image actuelle
    const currentImageUrl = `https://compagnon.atlantis-city.com/plv/${
      CONFIG.spaceSlug
    }/${currentObjectConfig.file}?v=${Date.now()}`;

    // Créer la modal
    const modal = document.createElement("div");
    modal.className = "plv-upload-overlay";
    modal.id = "plv-upload-overlay";
    modal.innerHTML = `
            <div class="plv-upload-modal">
                <div class="plv-upload-header">
                    <h3 class="plv-upload-title">
                        <span class="icon">${currentObjectConfig.icon}</span>
                        ${currentObjectConfig.title}
                    </h3>
                    <button class="plv-upload-close" onclick="window.atlantisPopupload.closeUploadModal()">×</button>
                </div>
                
                <div class="plv-upload-body">
                    <!-- Infos du PLV -->
                    <div class="plv-upload-info">
                        <div class="plv-upload-info-row">
                            <span class="plv-upload-info-label">Format</span>
                            <span class="plv-upload-info-value">${
                              currentObjectConfig.format
                            } (${currentObjectConfig.ratio})</span>
                        </div>
                        <div class="plv-upload-info-row">
                            <span class="plv-upload-info-label">Résolution recommandée</span>
                            <span class="plv-upload-info-value">${
                              currentObjectConfig.resolution
                            } px</span>
                        </div>
                        <div class="plv-upload-info-row">
                            <span class="plv-upload-info-label">Type de rendu</span>
                            <span class="plv-upload-info-value ${
                              currentObjectConfig.opaque
                                ? "opaque"
                                : "transparent"
                            }">
                                ${
                                  currentObjectConfig.opaque
                                    ? "🔶 Opaque"
                                    : "💠 Transparent"
                                }
                            </span>
                        </div>
                        <div class="plv-upload-info-row">
                            <span class="plv-upload-info-label">Fichier</span>
                            <span class="plv-upload-info-value">${
                              currentObjectConfig.file
                            }</span>
                        </div>
                    </div>
                    
                    <!-- Image actuelle -->
                    <div class="plv-upload-section">
                        <div class="plv-upload-section-title">📷 Image actuelle</div>
                        <div class="plv-upload-preview">
                            <img src="${currentImageUrl}" alt="Image actuelle" onerror="this.style.display='none'; this.nextElementSibling.style.display='block';">
                            <div class="plv-upload-preview-placeholder" style="display:none;">
                                <span class="icon">🖼️</span>
                                Aucune image
                            </div>
                        </div>
                    </div>
                    
                    <!-- Zone de drop -->
                    <div class="plv-upload-section">
                        <div class="plv-upload-section-title">📤 Nouvelle image</div>
                        <div class="plv-upload-dropzone" id="plv-dropzone">
                            <div class="plv-upload-dropzone-icon">📁</div>
                            <div class="plv-upload-dropzone-text">
                                Glissez une image ou <strong>cliquez pour sélectionner</strong>
                            </div>
                            <div class="plv-upload-dropzone-hint">
                                PNG uniquement • Max 5 Mo • ${
                                  currentObjectConfig.resolution
                                } recommandé
                            </div>
                            <input type="file" accept="image/png" onchange="window.atlantisPopupload.handleFileSelect(event)">
                        </div>
                        
                        <!-- Preview nouvelle image -->
                        <div class="plv-upload-new-preview" id="plv-new-preview">
                            <div class="plv-upload-new-preview-container">
                                <img id="plv-new-preview-img" src="" alt="Nouvelle image">
                                <div class="plv-upload-new-preview-info">
                                    <span id="plv-new-preview-size">0 Ko</span>
                                    <button class="plv-upload-new-preview-remove" onclick="window.atlantisPopupload.removeSelectedFile()">
                                        ✕ Retirer
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Statut -->
                    <div class="plv-upload-status" id="plv-upload-status">
                        <div class="plv-upload-spinner"></div>
                        <span id="plv-upload-status-text">Upload en cours...</span>
                    </div>
                </div>
                
                <div class="plv-upload-footer">
                    <button class="plv-upload-btn plv-upload-btn-cancel" onclick="window.atlantisPopupload.closeUploadModal()">
                        Annuler
                    </button>
                    <button class="plv-upload-btn plv-upload-btn-submit" id="plv-submit-btn" disabled onclick="window.atlantisPopupload.submitUpload()">
                        📤 Uploader
                    </button>
                    <button class="plv-upload-btn plv-upload-btn-refresh" id="plv-refresh-btn" onclick="window.atlantisPopupload.refreshTextures()">
                        🔄 Rafraîchir les textures
                    </button>
                </div>
            </div>
        `;

    document.body.appendChild(modal);

    // Setup drag & drop
    setupDragDrop();

    console.log(`📤 Popupload: Modal ouverte pour ${shaderName}`);
  }

  function closeUploadModal() {
    const modal = document.getElementById("plv-upload-overlay");
    if (modal) {
      modal.style.opacity = "0";
      setTimeout(() => modal.remove(), 300);
    }
    selectedFile = null;
    currentObjectConfig = null;
    console.log("📤 Popupload: Modal fermée");
  }

  // === DRAG & DROP ===
  function setupDragDrop() {
    const dropzone = document.getElementById("plv-dropzone");
    if (!dropzone) return;

    ["dragenter", "dragover"].forEach((event) => {
      dropzone.addEventListener(event, (e) => {
        e.preventDefault();
        e.stopPropagation();
        dropzone.classList.add("dragover");
      });
    });

    ["dragleave", "drop"].forEach((event) => {
      dropzone.addEventListener(event, (e) => {
        e.preventDefault();
        e.stopPropagation();
        dropzone.classList.remove("dragover");
      });
    });

    dropzone.addEventListener("drop", (e) => {
      const files = e.dataTransfer.files;
      if (files.length > 0) {
        processFile(files[0]);
      }
    });
  }

  // === GESTION FICHIER ===
  function handleFileSelect(event) {
    const file = event.target.files[0];
    if (file) {
      processFile(file);
    }
  }

  function processFile(file) {
    // Vérifier le type
    if (file.type !== "image/png") {
      showStatus("error", "❌ Seuls les fichiers PNG sont autorisés");
      return;
    }

    // Vérifier la taille (5 Mo)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      showStatus("error", "❌ Fichier trop volumineux (max 5 Mo)");
      return;
    }

    selectedFile = file;

    // Afficher la preview
    const reader = new FileReader();
    reader.onload = (e) => {
      const previewContainer = document.getElementById("plv-new-preview");
      const previewImg = document.getElementById("plv-new-preview-img");
      const previewSize = document.getElementById("plv-new-preview-size");

      previewImg.src = e.target.result;
      previewSize.textContent = formatFileSize(file.size);
      previewContainer.classList.add("show");

      // Activer le bouton submit
      document.getElementById("plv-submit-btn").disabled = false;

      // Cacher le statut si visible
      hideStatus();
    };
    reader.readAsDataURL(file);

    console.log(
      `📤 Popupload: Fichier sélectionné - ${file.name} (${formatFileSize(
        file.size
      )})`
    );
  }

  function removeSelectedFile() {
    selectedFile = null;

    const previewContainer = document.getElementById("plv-new-preview");
    const previewImg = document.getElementById("plv-new-preview-img");
    const fileInput = document.querySelector(
      '#plv-dropzone input[type="file"]'
    );

    previewContainer.classList.remove("show");
    previewImg.src = "";
    if (fileInput) fileInput.value = "";

    document.getElementById("plv-submit-btn").disabled = true;
    hideStatus();

    console.log("📤 Popupload: Fichier retiré");
  }

  function formatFileSize(bytes) {
    if (bytes < 1024) return bytes + " o";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " Ko";
    return (bytes / (1024 * 1024)).toFixed(2) + " Mo";
  }

  // === UPLOAD ===
  async function submitUpload() {
    if (!selectedFile || !currentObjectConfig) {
      showStatus("error", "❌ Aucun fichier sélectionné");
      return;
    }

    // Récupérer le token
    const token = getToken();
    console.log(
      "📤 Popupload: Token récupéré:",
      token ? "✅ Présent" : "❌ Absent"
    );

    if (!token) {
      showStatus("error", "❌ Non authentifié - Veuillez vous reconnecter");
      return;
    }

    // Désactiver les boutons
    const submitBtn = document.getElementById("plv-submit-btn");
    const cancelBtn = document.querySelector(".plv-upload-btn-cancel");
    submitBtn.disabled = true;
    cancelBtn.disabled = true;

    showStatus("loading", "⏳ Upload en cours...");

    try {
      // Préparer le FormData
      const formData = new FormData();
      formData.append("space_slug", CONFIG.spaceSlug);
      formData.append("zone_slug", currentObjectConfig.zoneSlug || "");
      formData.append("shader_name", currentObjectConfig.shader);
      formData.append("image", selectedFile);

      console.log("📤 Popupload: Envoi vers API...", {
        space_slug: CONFIG.spaceSlug,
        zone_slug: currentObjectConfig.zoneSlug,
        shader_name: currentObjectConfig.shader,
      });

      // Envoyer
      const response = await fetch(`${CONFIG.apiBase}/plv/upload.php`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const result = await response.json();
      console.log("📤 Popupload: Réponse API:", result);

      if (result.success) {
        showStatus("success", "✅ Image uploadée avec succès !");

        // Afficher le bouton refresh
        document.getElementById("plv-refresh-btn").classList.add("show");
        submitBtn.style.display = "none";

        // Mettre à jour la preview de l'image actuelle
        const currentImg = document.querySelector(".plv-upload-preview img");
        if (currentImg && result.data?.url) {
          currentImg.src = result.data.url;
        }

        console.log(`📤 Popupload: Upload réussi - ${result.data?.file_name}`);
      } else {
        throw new Error(result.error || "Erreur inconnue");
      }
    } catch (error) {
      console.error("📤 Popupload: Erreur upload", error);
      showStatus("error", `❌ ${error.message}`);
      submitBtn.disabled = false;
    }

    cancelBtn.disabled = false;
  }

  // === REFRESH TEXTURES ===
  function refreshTextures() {
    if (typeof window.reloadPLVTextures === "function") {
      window.reloadPLVTextures();
      showStatus("success", "🔄 Textures rafraîchies !");

      // Fermer la modal après un délai
      setTimeout(() => {
        closeUploadModal();
      }, 1500);
    } else {
      showStatus("error", "❌ Fonction reloadPLVTextures non disponible");
    }
  }

  // === STATUT ===
  function showStatus(type, message) {
    const statusEl = document.getElementById("plv-upload-status");
    const statusText = document.getElementById("plv-upload-status-text");

    if (!statusEl || !statusText) return;

    statusEl.className = `plv-upload-status show ${type}`;
    statusText.textContent = message;

    // Pour les erreurs, le spinner ne s'affiche pas
    const spinner = statusEl.querySelector(".plv-upload-spinner");
    if (spinner) {
      spinner.style.display = type === "loading" ? "block" : "none";
    }
  }

  function hideStatus() {
    const statusEl = document.getElementById("plv-upload-status");
    if (statusEl) {
      statusEl.classList.remove("show");
    }
  }

  // === INITIALISATION ===
  function init() {
    console.log("📤 Popupload PLV: Initialisation...");
    console.log("📤 Popupload PLV: Token présent:", !!getToken());
    console.log("📤 Popupload PLV: User présent:", !!getUser());

    // Observer les popups
    observePopups();

    // Également vérifier les popups déjà présentes
    setTimeout(() => {
      Object.entries(CONFIG.objects).forEach(([objName, objConfig]) => {
        if (!objConfig.popupClass) return;

        const existingPopup = document.querySelector(
          `.${objConfig.popupClass}`
        );
        if (existingPopup) {
          const popupBody = existingPopup.querySelector(
            ".carre-popup-body, .paysage-popup-body, .portrait-popup-body"
          );
          if (popupBody) {
            injectAdminButtons(popupBody, objConfig);
          }
        }
      });
    }, 500);

    console.log("📤 Popupload PLV: Prêt !");
  }

  // === API PUBLIQUE ===
  window.atlantisPopupload = {
    openUploadModal,
    closeUploadModal,
    handleFileSelect,
    removeSelectedFile,
    submitUpload,
    refreshTextures,
    canUpload: (shaderName) => {
      const config = Object.values(CONFIG.objects).find(
        (o) => o.shader === shaderName
      );
      return config ? canUpload(config) : false;
    },
    // Debug
    debug: () => {
      console.log("Token:", getToken());
      console.log("User:", getUser());
      console.log("Config:", CONFIG);
    },
  };

  // Lancer
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
