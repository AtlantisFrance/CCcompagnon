/**
 * ============================================
 * 📤 PLV UPLOAD - ATLANTIS CITY
 * Module d'upload PLV avec UI
 *
 * 🧪 COMMANDES CONSOLE:
 * - atlantisPLVUpload.open(config) → Ouvre le modal
 * - atlantisPLVUpload.close()      → Ferme le modal
 * ============================================
 */

(function () {
  "use strict";

  // ============================================
  // ⚙️ CONFIGURATION
  // ============================================
  const CONFIG = {
    apiBase: "https://compagnon.atlantis-city.com/api",
    cssUrl: "https://compagnon.atlantis-city.com/Script/test/v2/plv-upload.css",

    // Utilise le proxy PHP pour CORS
    getImageUrl: (spaceSlug, fileName) => {
      return `https://compagnon.atlantis-city.com/plv/image.php?project=${spaceSlug}&file=${fileName}&v=${Date.now()}`;
    },
  };

  // État local
  let state = {
    isOpen: false,
    objectConfig: null,
    selectedFile: null,
    isUploading: false,
  };

  // ============================================
  // 🎨 CHARGEMENT CSS EXTERNE
  // ============================================

  function injectStyles() {
    if (!document.getElementById("plv-upload-styles")) {
      const link = document.createElement("link");
      link.id = "plv-upload-styles";
      link.rel = "stylesheet";
      link.href = CONFIG.cssUrl;
      document.head.appendChild(link);
    }
  }

  // ============================================
  // 🚀 OPEN / CLOSE
  // ============================================

  function open(objectConfig) {
    injectStyles();

    const spaceSlug =
      objectConfig.spaceSlug || window.ATLANTIS_SPACE || "default";

    state = {
      isOpen: true,
      objectConfig: { ...objectConfig, spaceSlug },
      selectedFile: null,
      isUploading: false,
    };

    render();
    console.log("📤 PLV Upload ouvert:", objectConfig);
  }

  function close() {
    const overlay = document.querySelector(".plv-upload-overlay");
    if (overlay) {
      overlay.classList.remove("active");
      setTimeout(() => overlay.remove(), 300);
    }
    state.isOpen = false;
  }

  // ============================================
  // 🎨 RENDER
  // ============================================

  function getCurrentImageUrl() {
    const { spaceSlug, file } = state.objectConfig;
    return CONFIG.getImageUrl(spaceSlug, file);
  }

  function render() {
    document
      .querySelectorAll(".plv-upload-overlay")
      .forEach((el) => el.remove());

    const { objectConfig } = state;

    const html = `
      <div class="plv-upload-overlay">
        <div class="plv-upload-modal">
          <div class="plv-upload-header">
            <h3 class="plv-upload-title">
              <span>📤</span> Modifier : ${
                objectConfig.title || objectConfig.id
              }
            </h3>
            <button class="plv-upload-close" id="plv-close-btn">✕</button>
          </div>

          <div class="plv-upload-body">
            <div class="plv-col plv-col-left">
              <div class="plv-info-grid">
                <div class="plv-info-item">
                  <label>Format</label>
                  <span>${objectConfig.format || "Inconnu"} (${
      objectConfig.ratio || "-"
    })</span>
                </div>
                <div class="plv-info-item">
                  <label>Résolution</label>
                  <span>${objectConfig.resolution || "-"}</span>
                </div>
                <div class="plv-info-item">
                  <label>Zone</label>
                  <span class="plv-zone-badge">📍 ${
                    objectConfig.zone || objectConfig.zoneSlug || "-"
                  }</span>
                </div>
                <div class="plv-info-item">
                  <label>Fichier</label>
                  <span style="font-family: monospace; color: #60a5fa; font-size: 12px;">${
                    objectConfig.file || "-"
                  }</span>
                </div>
              </div>
              
              <div class="plv-current-wrapper">
                <div class="plv-current-title">Image actuelle</div>
                <div class="plv-current-image" id="plv-current-img-container">
                  <img src="${getCurrentImageUrl()}" onerror="this.parentElement.innerHTML='<span class=plv-no-image>Aucune image</span>'">
                </div>
              </div>
            </div>

            <div class="plv-col plv-col-right">
              <div class="plv-dropzone" id="plv-dropzone">
                <input type="file" id="plv-file-input" accept="image/png" hidden>
                <div id="plv-drop-content">
                  <div class="plv-drop-icon">📁</div>
                  <div class="plv-drop-text">Cliquez ou glissez une image</div>
                  <div class="plv-drop-sub">PNG uniquement • Max 5 Mo</div>
                </div>
              </div>
            </div>
          </div>

          <div class="plv-footer">
            <div class="plv-status" id="plv-status">En attente de fichier...</div>
            <button class="plv-btn plv-btn-primary" id="plv-submit-btn" disabled>
              Uploader l'image
            </button>
          </div>
        </div>
      </div>
    `;

    document.body.insertAdjacentHTML("beforeend", html);

    requestAnimationFrame(() => {
      const overlay = document.querySelector(".plv-upload-overlay");
      if (overlay) overlay.classList.add("active");
    });

    setupEvents();
  }

  // ============================================
  // 🖱️ EVENTS
  // ============================================

  function setupEvents() {
    const dropzone = document.getElementById("plv-dropzone");
    const fileInput = document.getElementById("plv-file-input");
    const submitBtn = document.getElementById("plv-submit-btn");
    const closeBtn = document.getElementById("plv-close-btn");

    if (!dropzone || !fileInput) return;

    // Close button
    closeBtn.addEventListener("click", close);

    // Click dropzone → file input
    dropzone.addEventListener("click", (e) => {
      if (!state.selectedFile) {
        fileInput.click();
      }
    });

    // File selected
    fileInput.addEventListener("change", (e) => {
      if (e.target.files.length) {
        handleFile(e.target.files[0]);
      }
    });

    // Drag events
    dropzone.addEventListener("dragover", (e) => {
      e.preventDefault();
      dropzone.classList.add("dragover");
    });

    dropzone.addEventListener("dragleave", (e) => {
      e.preventDefault();
      dropzone.classList.remove("dragover");
    });

    dropzone.addEventListener("drop", (e) => {
      e.preventDefault();
      dropzone.classList.remove("dragover");
      if (e.dataTransfer.files.length) {
        handleFile(e.dataTransfer.files[0]);
      }
    });

    // Submit
    submitBtn.addEventListener("click", submit);

    // Close on overlay click
    document
      .querySelector(".plv-upload-overlay")
      .addEventListener("click", (e) => {
        if (e.target.classList.contains("plv-upload-overlay")) {
          close();
        }
      });

    // ESC key
    const escHandler = (e) => {
      if (e.key === "Escape" && state.isOpen) {
        close();
        document.removeEventListener("keydown", escHandler);
      }
    };
    document.addEventListener("keydown", escHandler);
  }

  // ============================================
  // 📁 FILE HANDLING
  // ============================================

  function handleFile(file) {
    if (!file) return;

    // Validation type
    if (file.type !== "image/png") {
      setStatus("❌ Format PNG obligatoire", "error");
      return;
    }

    // Validation taille
    if (file.size > 5 * 1024 * 1024) {
      setStatus("❌ Fichier trop lourd (max 5 Mo)", "error");
      return;
    }

    state.selectedFile = file;

    // Preview
    const reader = new FileReader();
    reader.onload = (e) => {
      const dropzone = document.getElementById("plv-dropzone");
      dropzone.classList.add("has-file");
      dropzone.innerHTML = `
        <img src="${e.target.result}" class="plv-preview-img">
        <button class="plv-remove-btn" id="plv-remove-btn">✕</button>
      `;

      // Remove button event
      document
        .getElementById("plv-remove-btn")
        .addEventListener("click", (ev) => {
          ev.stopPropagation();
          resetFile();
        });

      document.getElementById("plv-submit-btn").disabled = false;
      setStatus(`✅ Prêt (${formatSize(file.size)})`, "success");
    };
    reader.readAsDataURL(file);
  }

  function resetFile() {
    state.selectedFile = null;
    document.getElementById("plv-submit-btn").disabled = true;

    const dropzone = document.getElementById("plv-dropzone");
    dropzone.classList.remove("has-file");
    dropzone.innerHTML = `
      <input type="file" id="plv-file-input" accept="image/png" hidden>
      <div id="plv-drop-content">
        <div class="plv-drop-icon">📁</div>
        <div class="plv-drop-text">Cliquez ou glissez une image</div>
        <div class="plv-drop-sub">PNG uniquement • Max 5 Mo</div>
      </div>
    `;

    // Rebind events
    const fileInput = document.getElementById("plv-file-input");
    dropzone.addEventListener("click", () => fileInput.click());
    fileInput.addEventListener("change", (e) => {
      if (e.target.files.length) handleFile(e.target.files[0]);
    });

    setStatus("En attente de fichier...");
  }

  function setStatus(msg, type = "normal") {
    const el = document.getElementById("plv-status");
    if (!el) return;
    el.textContent = msg;
    el.style.color =
      type === "error" ? "#ef4444" : type === "success" ? "#4ade80" : "#94a3b8";
  }

  function formatSize(bytes) {
    if (bytes < 1024) return bytes + " o";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " Ko";
    return (bytes / (1024 * 1024)).toFixed(2) + " Mo";
  }

  // ============================================
  // 📡 UPLOAD
  // ============================================

  async function submit() {
    if (!state.selectedFile || state.isUploading) return;

    const btn = document.getElementById("plv-submit-btn");
    state.isUploading = true;
    btn.disabled = true;
    btn.textContent = "⏳ Envoi...";
    setStatus("Téléchargement en cours...", "normal");

    try {
      // 1. Token - Essayer plusieurs sources
      let token = null;

      // Source 1: atlantisAuth
      if (
        window.atlantisAuth &&
        typeof window.atlantisAuth.getToken === "function"
      ) {
        token = window.atlantisAuth.getToken();
        if (token) console.log("🔑 Token source: atlantisAuth");
      }

      // Source 2: localStorage atlantis_auth_token
      if (!token) {
        token = localStorage.getItem("atlantis_auth_token");
        if (token)
          console.log("🔑 Token source: localStorage atlantis_auth_token");
      }

      // Source 3: localStorage atlantis_token (ancien nom possible)
      if (!token) {
        token = localStorage.getItem("atlantis_token");
        if (token) console.log("🔑 Token source: localStorage atlantis_token");
      }

      // Source 4: cookie
      if (!token) {
        const cookieMatch = document.cookie.match(/atlantis_token=([^;]+)/);
        if (cookieMatch) {
          token = cookieMatch[1];
          console.log("🔑 Token source: cookie");
        }
      }

      console.log(
        "🔑 Token trouvé:",
        token ? `${token.substring(0, 20)}...` : "AUCUN"
      );

      if (!token) {
        throw new Error("Token manquant");
      }

      // 2. FormData
      const formData = new FormData();
      formData.append("space_slug", state.objectConfig.spaceSlug);
      formData.append(
        "zone_slug",
        state.objectConfig.zoneSlug || state.objectConfig.zone || ""
      );
      formData.append("shader_name", state.objectConfig.shader);
      formData.append("image", state.selectedFile);
      formData.append("auth_token", token); // Workaround OVH

      // 3. Upload
      const res = await fetch(`${CONFIG.apiBase}/plv/upload.php`, {
        method: "POST",
        body: formData,
      });

      const result = await res.json();

      if (!result.success) {
        throw new Error(result.error || "Erreur serveur");
      }

      // 4. Succès
      setStatus("✅ Upload réussi !", "success");
      btn.textContent = "✨ Terminé";

      // Refresh textures Shapespark
      if (window.reloadPLVTextures) {
        console.log("🔄 Rechargement textures...");
        window.reloadPLVTextures();
      }

      // Fermer après délai
      setTimeout(close, 1500);
    } catch (err) {
      console.error("❌ Upload error:", err);
      setStatus("❌ " + err.message, "error");
      btn.disabled = false;
      btn.textContent = "Réessayer";
      state.isUploading = false;
    }
  }

  // ============================================
  // 🌐 API PUBLIQUE
  // ============================================

  window.atlantisPLVUpload = {
    open,
    close,
    handleFile,
    resetFile,
    submit,
    isOpen: () => state.isOpen,
  };

  console.log("📤 PLV Upload: Prêt");
})();
