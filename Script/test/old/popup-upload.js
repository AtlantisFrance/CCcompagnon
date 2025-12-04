/**
 * ============================================
 * 📤 POPUP UPLOAD - ATLANTIS CITY
 * Module d'upload d'images PLV (autonome)
 * ============================================
 *
 * v2.0 - Module autonome (plus de registerView)
 * Appelé via: window.atlantisPopupUpload.open(objectConfig)
 */

(function () {
  "use strict";

  if (window.__atlantisPopupUploadInit) return;
  window.__atlantisPopupUploadInit = true;

  // ============================================
  // 🔧 CONFIGURATION
  // ============================================

  const CONFIG = {
    API_BASE: "https://compagnon.atlantis-city.com/api",
    SPACE_SLUG: window.ATLANTIS_SPACE || "idea",
  };

  // ============================================
  // 🔧 ÉTAT
  // ============================================

  let currentObjectConfig = null;
  let selectedFile = null;
  let isUploading = false;
  let isOpen = false;
  let overlayEl = null;

  // ============================================
  // 🔧 HELPERS
  // ============================================

  function getToken() {
    return (
      window.atlantisAuth?.getToken() ||
      localStorage.getItem("atlantis_auth_token") ||
      sessionStorage.getItem("atlantis_auth_token")
    );
  }

  function getImageUrl(objectConfig) {
    const spaceSlug = CONFIG.SPACE_SLUG;
    const file = objectConfig.file || objectConfig.shader + ".jpg";
    const timestamp = Date.now();
    return `https://compagnon.atlantis-city.com/plv/image.php?project=${spaceSlug}&file=${file}&v=${timestamp}`;
  }

  function formatFileSize(bytes) {
    if (bytes < 1024) return bytes + " o";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " Ko";
    return (bytes / (1024 * 1024)).toFixed(2) + " Mo";
  }

  // ============================================
  // 🎨 CRÉER L'OVERLAY
  // ============================================

  function createOverlay(objectConfig) {
    const imageUrl = getImageUrl(objectConfig);
    const title = objectConfig.title || objectConfig.objectName || "Image";

    const overlay = document.createElement("div");
    overlay.className = "popup-upload-overlay";
    overlay.id = "popup-upload-overlay";

    overlay.innerHTML = `
      <div class="popup-upload-container">
        <!-- Header -->
        <div class="popup-upload-header">
          <h3>📤 Modifier l'image - ${title}</h3>
          <button class="popup-upload-close-btn" id="upload-close-btn">&times;</button>
        </div>

        <!-- Body -->
        <div class="popup-upload-body">
          <!-- Infos format -->
          <div class="popup-upload-info">
            <div class="popup-upload-info-item">
              <span class="label">Format</span>
              <span class="value">${objectConfig.format || "—"} ${
      objectConfig.ratio ? `(${objectConfig.ratio})` : ""
    }</span>
            </div>
            <div class="popup-upload-info-item">
              <span class="label">Shader</span>
              <span class="value">${objectConfig.shader || "—"}</span>
            </div>
            <div class="popup-upload-info-item">
              <span class="label">Fichier</span>
              <span class="value">${objectConfig.file || "—"}</span>
            </div>
          </div>
          
          <!-- Image actuelle -->
          <div class="popup-upload-current">
            <h4>Image actuelle</h4>
            <div class="popup-upload-current-image">
              <img src="${imageUrl}" alt="Image actuelle" id="upload-current-img" onerror="this.style.display='none'">
            </div>
          </div>
          
          <!-- Dropzone -->
          <div class="popup-upload-dropzone" id="upload-dropzone">
            <input type="file" id="upload-file-input" accept="image/png" style="display:none">
            <div class="popup-upload-dropzone-content">
              <span class="icon">📁</span>
              <p class="main">Cliquez ou glissez une image PNG</p>
              <p class="hint">Maximum 5 Mo • Format PNG uniquement</p>
            </div>
          </div>
          
          <!-- Preview nouvelle image -->
          <div class="popup-upload-preview" id="upload-preview" style="display:none">
            <h4>Nouvelle image</h4>
            <div class="popup-upload-preview-container">
              <img id="upload-preview-img" src="" alt="Prévisualisation">
              <button class="popup-upload-preview-remove" id="upload-preview-remove" title="Supprimer">✕</button>
            </div>
            <div class="popup-upload-preview-info" id="upload-preview-info"></div>
          </div>
          
          <!-- Status messages -->
          <div class="popup-upload-status" id="upload-status"></div>
        </div>

        <!-- Footer -->
        <div class="popup-upload-footer">
          <button class="popup-upload-btn popup-upload-btn-cancel" id="upload-cancel-btn">Annuler</button>
          <button class="popup-upload-btn popup-upload-btn-submit" id="upload-submit-btn" disabled>
            📤 Uploader
          </button>
        </div>
      </div>
    `;

    return overlay;
  }

  // ============================================
  // 🎬 OUVRIR
  // ============================================

  function open(objectConfig) {
    if (isOpen) close();

    currentObjectConfig = objectConfig;
    selectedFile = null;
    isUploading = false;

    // Créer l'overlay
    overlayEl = createOverlay(objectConfig);
    document.body.appendChild(overlayEl);

    // Setup events
    setupEvents();

    // Animer l'ouverture
    requestAnimationFrame(() => {
      overlayEl.classList.add("active");
    });

    isOpen = true;
    document.body.style.overflow = "hidden";

    console.log("📤 Upload ouvert pour:", objectConfig.objectName);
  }

  // ============================================
  // 🎬 FERMER
  // ============================================

  function close() {
    if (!isOpen || !overlayEl) return;

    overlayEl.classList.remove("active");

    setTimeout(() => {
      if (overlayEl && overlayEl.parentNode) {
        overlayEl.parentNode.removeChild(overlayEl);
        overlayEl = null;
      }
    }, 300);

    isOpen = false;
    selectedFile = null;
    document.body.style.overflow = "";

    console.log("📤 Upload fermé");
  }

  // ============================================
  // 🎯 SETUP EVENTS
  // ============================================

  function setupEvents() {
    // Boutons fermer/annuler
    document
      .getElementById("upload-close-btn")
      ?.addEventListener("click", close);
    document
      .getElementById("upload-cancel-btn")
      ?.addEventListener("click", close);

    // Clic sur overlay
    overlayEl.addEventListener("click", (e) => {
      if (e.target === overlayEl) close();
    });

    // Escape
    document.addEventListener("keydown", handleKeydown);

    // Dropzone
    setupDropzone();

    // Bouton remove preview
    document
      .getElementById("upload-preview-remove")
      ?.addEventListener("click", clearFile);

    // Bouton submit
    document
      .getElementById("upload-submit-btn")
      ?.addEventListener("click", submit);
  }

  function handleKeydown(e) {
    if (e.key === "Escape" && isOpen) {
      close();
    }
  }

  // ============================================
  // 📁 DROPZONE SETUP
  // ============================================

  function setupDropzone() {
    const dropzone = document.getElementById("upload-dropzone");
    const fileInput = document.getElementById("upload-file-input");

    if (!dropzone || !fileInput) return;

    // Click sur dropzone → ouvrir sélecteur fichier
    dropzone.addEventListener("click", (e) => {
      if (e.target === fileInput) return;
      fileInput.click();
    });

    // Empêcher propagation du click sur input
    fileInput.addEventListener("click", (e) => {
      e.stopPropagation();
    });

    // Sélection fichier
    fileInput.addEventListener("change", (e) => {
      if (e.target.files && e.target.files[0]) {
        processFile(e.target.files[0]);
      }
    });

    // Drag & drop
    dropzone.addEventListener("dragover", (e) => {
      e.preventDefault();
      e.stopPropagation();
      dropzone.classList.add("dragover");
    });

    dropzone.addEventListener("dragleave", (e) => {
      e.preventDefault();
      e.stopPropagation();
      dropzone.classList.remove("dragover");
    });

    dropzone.addEventListener("drop", (e) => {
      e.preventDefault();
      e.stopPropagation();
      dropzone.classList.remove("dragover");

      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
        processFile(e.dataTransfer.files[0]);
      }
    });
  }

  // ============================================
  // 📄 TRAITEMENT FICHIER
  // ============================================

  function processFile(file) {
    clearStatus();

    // Validation type
    if (file.type !== "image/png") {
      showStatus("Seuls les fichiers PNG sont acceptés", "error");
      return;
    }

    // Validation taille (5 Mo max)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      showStatus("Le fichier dépasse la taille maximale de 5 Mo", "error");
      return;
    }

    selectedFile = file;

    // Afficher preview
    const preview = document.getElementById("upload-preview");
    const previewImg = document.getElementById("upload-preview-img");
    const previewInfo = document.getElementById("upload-preview-info");
    const submitBtn = document.getElementById("upload-submit-btn");
    const dropzone = document.getElementById("upload-dropzone");

    if (preview && previewImg && previewInfo) {
      const reader = new FileReader();
      reader.onload = (e) => {
        previewImg.src = e.target.result;
        preview.style.display = "block";
      };
      reader.readAsDataURL(file);

      previewInfo.textContent = `${file.name} • ${formatFileSize(file.size)}`;
    }

    if (dropzone) {
      dropzone.style.display = "none";
    }

    if (submitBtn) {
      submitBtn.disabled = false;
    }

    console.log(`📤 Fichier sélectionné: ${file.name}`);
  }

  function clearFile() {
    selectedFile = null;

    const preview = document.getElementById("upload-preview");
    const dropzone = document.getElementById("upload-dropzone");
    const submitBtn = document.getElementById("upload-submit-btn");
    const fileInput = document.getElementById("upload-file-input");

    if (preview) preview.style.display = "none";
    if (dropzone) dropzone.style.display = "block";
    if (submitBtn) submitBtn.disabled = true;
    if (fileInput) fileInput.value = "";

    clearStatus();
  }

  // ============================================
  // 📤 UPLOAD
  // ============================================

  async function submit() {
    if (!selectedFile || !currentObjectConfig || isUploading) return;

    isUploading = true;
    const submitBtn = document.getElementById("upload-submit-btn");

    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.innerHTML = "⏳ Upload en cours...";
    }

    showStatus("Upload en cours...", "loading");

    try {
      const token = getToken();
      if (!token) {
        throw new Error("Non authentifié");
      }

      const formData = new FormData();
      formData.append("space_slug", CONFIG.SPACE_SLUG);
      formData.append("zone_slug", currentObjectConfig.zoneSlug || "");
      formData.append("shader_name", currentObjectConfig.shader);
      formData.append("image", selectedFile);
      formData.append("auth_token", token); // Workaround OVH

      const response = await fetch(`${CONFIG.API_BASE}/plv/upload.php`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const result = await response.json();

      if (result.success) {
        showStatus("✅ Image uploadée avec succès !", "success");

        // Changer le bouton
        if (submitBtn) {
          submitBtn.innerHTML = "🔄 Rafraîchir et fermer";
          submitBtn.disabled = false;
          submitBtn.onclick = refreshAndClose;
        }

        console.log("📤 Upload réussi !");
      } else {
        throw new Error(result.error || "Erreur lors de l'upload");
      }
    } catch (error) {
      console.error("📤 Erreur:", error);
      showStatus(error.message || "Erreur lors de l'upload", "error");

      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = "📤 Réessayer";
      }
    }

    isUploading = false;
  }

  // ============================================
  // 🔄 REFRESH & CLOSE
  // ============================================

  function refreshAndClose() {
    // Rafraîchir les textures Shapespark
    if (window.reloadPLVTextures) {
      window.reloadPLVTextures();
      console.log("📤 Textures rafraîchies");
    }

    // Notification
    showNotification("✅ Image mise à jour !", "success");

    // Fermer
    close();
  }

  // ============================================
  // 💬 STATUS & NOTIFICATIONS
  // ============================================

  function showStatus(message, type = "info") {
    const status = document.getElementById("upload-status");
    if (!status) return;

    let icon = "ℹ️";
    if (type === "success") icon = "✅";
    if (type === "error") icon = "❌";
    if (type === "loading") icon = "⏳";

    status.className = `popup-upload-status ${type}`;
    status.innerHTML = `<span class="icon">${icon}</span><span>${message}</span>`;
    status.style.display = "flex";
  }

  function clearStatus() {
    const status = document.getElementById("upload-status");
    if (status) {
      status.style.display = "none";
      status.innerHTML = "";
    }
  }

  function showNotification(message, type = "info") {
    const notif = document.createElement("div");
    notif.style.cssText = `
      position: fixed;
      bottom: 30px;
      right: 30px;
      padding: 15px 25px;
      background: ${
        type === "success"
          ? "#10b981"
          : type === "error"
          ? "#ef4444"
          : "#3b82f6"
      };
      color: white;
      border-radius: 10px;
      font-size: 14px;
      font-weight: 600;
      z-index: 100002;
      box-shadow: 0 10px 40px rgba(0,0,0,0.3);
    `;
    notif.textContent = message;
    document.body.appendChild(notif);

    setTimeout(() => {
      notif.style.opacity = "0";
      notif.style.transition = "opacity 0.3s";
      setTimeout(() => notif.remove(), 300);
    }, 3000);
  }

  // ============================================
  // 🌐 API PUBLIQUE
  // ============================================

  window.atlantisPopupUpload = {
    open: open,
    close: close,
    submit: submit,
    clearFile: clearFile,
    processFile: processFile,
    isOpen: () => isOpen,
  };

  console.log("📤 Popup Upload v2.0 chargé (module autonome)");
})();
