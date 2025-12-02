/**
 * ============================================
 * 📤 POPUP UPLOAD - ATLANTIS CITY
 * Module d'upload d'images PLV
 * ============================================
 *
 * S'enregistre comme vue "upload" dans popup-viewer
 * Navigation : main → upload → (success) → main
 */

(function () {
  if (window.__atlantisPopupUploadInit) return;
  window.__atlantisPopupUploadInit = true;

  // ============================================
  // 🔧 ÉTAT
  // ============================================

  let currentObjectConfig = null;
  let selectedFile = null;
  let isUploading = false;

  // ============================================
  // 🎨 RENDER - Génère le HTML de la vue
  // ============================================

  function render(objectConfig) {
    currentObjectConfig = objectConfig;
    selectedFile = null;

    const imageUrl = window.atlantisPopup.getImageUrl(objectConfig);

    return `
      <div class="popup-upload-view">
        <!-- Infos format -->
        <div class="popup-upload-info">
          <div class="popup-upload-info-item">
            <span class="label">Format</span>
            <span class="value">${objectConfig.format} (${objectConfig.ratio})</span>
          </div>
          <div class="popup-upload-info-item">
            <span class="label">Résolution</span>
            <span class="value">${objectConfig.resolution}</span>
          </div>
          <div class="popup-upload-info-item">
            <span class="label">Fichier</span>
            <span class="value">${objectConfig.file}</span>
          </div>
        </div>
        
        <!-- Image actuelle -->
        <div class="popup-upload-current">
          <h4>Image actuelle</h4>
          <div class="popup-upload-current-image">
            <img src="${imageUrl}" alt="Image actuelle" onerror="this.style.display='none'">
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
            <button class="popup-upload-preview-remove" onclick="window.atlantisPopupUpload.clearFile()" title="Supprimer">✕</button>
          </div>
          <div class="popup-upload-preview-info" id="upload-preview-info"></div>
        </div>
        
        <!-- Status messages -->
        <div class="popup-upload-status" id="upload-status"></div>
        
        <!-- Bouton upload -->
        <div class="popup-upload-actions">
          <button class="popup-upload-btn popup-upload-btn-submit" id="upload-submit-btn" onclick="window.atlantisPopupUpload.submit()" disabled>
            📤 Uploader
          </button>
        </div>
      </div>
    `;
  }

  // ============================================
  // 🎬 LIFECYCLE
  // ============================================

  function onShow(objectConfig) {
    currentObjectConfig = objectConfig;
    selectedFile = null;
    isUploading = false;

    // Setup dropzone après que le DOM soit prêt
    setTimeout(() => setupDropzone(), 50);
  }

  function onHide() {
    selectedFile = null;
    isUploading = false;
  }

  function getTitle(objectConfig) {
    return `Modifier l'image - ${objectConfig.title}`;
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

    console.log("📤 Upload: Dropzone configurée");
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

    console.log(`📤 Upload: Fichier sélectionné - ${file.name}`);
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
      const token = window.atlantisAuth?.getToken();
      if (!token) {
        throw new Error("Non authentifié");
      }

      const apiBase = window.atlantisPopup.getApiBase();
      const spaceSlug = window.atlantisPopup.getSpaceSlug();

      const formData = new FormData();
      formData.append("space_slug", spaceSlug);
      formData.append("zone_slug", currentObjectConfig.zoneSlug || "");
      formData.append("shader_name", currentObjectConfig.shader);
      formData.append("image", selectedFile);
      formData.append("auth_token", token); // Fallback OVH

      const response = await fetch(`${apiBase}/plv/upload.php`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const result = await response.json();

      if (result.success) {
        showStatus("✅ Image uploadée avec succès !", "success");

        // Changer le bouton pour rafraîchir
        if (submitBtn) {
          submitBtn.innerHTML = "🔄 Rafraîchir la scène";
          submitBtn.disabled = false;
          submitBtn.onclick = () => {
            refreshAndGoBack();
          };
        }

        console.log("📤 Upload: Succès !");
      } else {
        throw new Error(result.error || "Erreur lors de l'upload");
      }
    } catch (error) {
      console.error("📤 Upload: Erreur -", error);
      showStatus(error.message || "Erreur lors de l'upload", "error");

      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = "📤 Réessayer";
      }
    }

    isUploading = false;
  }

  // ============================================
  // 🔄 REFRESH & NAVIGATION
  // ============================================

  function refreshAndGoBack() {
    // Rafraîchir les textures Shapespark
    if (window.reloadPLVTextures) {
      window.reloadPLVTextures();
      console.log("📤 Upload: Textures rafraîchies");
    }

    // Rafraîchir l'image dans la vue principale
    window.atlantisPopup.refreshMainImage();

    // Retourner à la vue principale
    window.atlantisPopup.goBack();
  }

  // ============================================
  // 💬 STATUS MESSAGES
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

  // ============================================
  // 🔧 HELPERS
  // ============================================

  function formatFileSize(bytes) {
    if (bytes < 1024) return bytes + " o";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " Ko";
    return (bytes / (1024 * 1024)).toFixed(2) + " Mo";
  }

  // ============================================
  // 📝 ENREGISTREMENT DE LA VUE
  // ============================================

  function registerUploadView() {
    if (!window.atlantisPopup) {
      console.warn("📤 Upload: atlantisPopup non disponible, retry...");
      setTimeout(registerUploadView, 100);
      return;
    }

    window.atlantisPopup.registerView("upload", {
      render,
      onShow,
      onHide,
      getTitle,
    });

    console.log("📤 Popup Upload: ✅ Vue enregistrée");
  }

  // ============================================
  // 🌐 API PUBLIQUE
  // ============================================

  window.atlantisPopupUpload = {
    submit,
    clearFile,
    processFile,
    refreshAndGoBack,
  };

  // Enregistrer la vue
  registerUploadView();
})();
