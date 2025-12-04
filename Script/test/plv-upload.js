/**
 * ============================================
 * 📤 PLV UPLOAD - ATLANTIS CITY
 * Module d'upload PLV avec UI
 * ============================================
 */

(function () {
  "use strict";

  // Configuration
  const CONFIG = {
    apiBase: "https://compagnon.atlantis-city.com/api",
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
  // 🎨 STYLES
  // ============================================
  const STYLES = `
    .plv-upload-overlay {
      position: fixed; inset: 0; background: rgba(0,0,0,0.85); backdrop-filter: blur(5px);
      z-index: 99999; display: flex; align-items: center; justify-content: center;
      opacity: 0; transition: opacity 0.3s ease; font-family: 'Segoe UI', Roboto, sans-serif;
    }
    .plv-upload-overlay.active { opacity: 1; }
    .plv-upload-modal {
      background: #1e293b; border: 1px solid #334155; border-radius: 16px;
      width: 700px; max-width: 95vw; overflow: hidden;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
      transform: scale(0.95); transition: transform 0.3s ease;
    }
    .plv-upload-overlay.active .plv-upload-modal { transform: scale(1); }
    
    /* Header */
    .plv-upload-header {
      padding: 15px 20px; background: #0f172a; border-bottom: 1px solid #334155;
      display: flex; justify-content: space-between; align-items: center;
    }
    .plv-upload-title { font-size: 16px; font-weight: 600; color: #f8fafc; margin: 0; display: flex; gap: 10px; align-items: center; }
    .plv-upload-close { background: none; border: none; color: #94a3b8; font-size: 24px; cursor: pointer; transition: color 0.2s; padding: 0; line-height: 1; }
    .plv-upload-close:hover { color: #ef4444; }

    /* Body Grid */
    .plv-upload-body { display: grid; grid-template-columns: 1fr 1fr; gap: 0; }
    .plv-col { padding: 20px; }
    .plv-col-left { border-right: 1px solid #334155; background: #1e293b; display: flex; flex-direction: column; gap: 15px; }
    .plv-col-right { background: #182235; display: flex; flex-direction: column; }

    /* Info Grid */
    .plv-info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
    .plv-info-item label { display: block; font-size: 10px; color: #64748b; text-transform: uppercase; font-weight: 700; margin-bottom: 2px; }
    .plv-info-item span { display: block; font-size: 13px; color: #e2e8f0; font-weight: 500; }
    
    /* Current Image */
    .plv-current-wrapper { flex: 1; display: flex; flex-direction: column; gap: 5px; }
    .plv-current-title { font-size: 11px; color: #94a3b8; font-weight: 600; text-transform: uppercase; }
    .plv-current-image {
      flex: 1; background: #0f172a; border-radius: 8px;
      display: flex; align-items: center; justify-content: center; overflow: hidden;
      border: 1px solid #334155; position: relative; min-height: 140px;
      background-image: linear-gradient(45deg, #1e293b 25%, transparent 25%), linear-gradient(-45deg, #1e293b 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #1e293b 75%), linear-gradient(-45deg, transparent 75%, #1e293b 75%);
      background-size: 20px 20px; background-position: 0 0, 0 10px, 10px -10px, -10px 0px;
    }
    .plv-current-image img { max-width: 100%; max-height: 100%; object-fit: contain; }
    .plv-no-image { color: #64748b; font-size: 13px; }

    /* Dropzone */
    .plv-dropzone {
      flex: 1; min-height: 220px; border: 2px dashed #475569; border-radius: 12px;
      display: flex; flex-direction: column; align-items: center; justify-content: center;
      cursor: pointer; transition: all 0.2s; background: rgba(255,255,255,0.02); text-align: center;
      position: relative; overflow: hidden;
    }
    .plv-dropzone:hover { border-color: #3b82f6; background: rgba(59, 130, 246, 0.05); }
    .plv-dropzone.dragover { border-color: #3b82f6; background: rgba(59, 130, 246, 0.1); }
    .plv-dropzone.has-file { border-style: solid; border-color: #22c55e; }
    
    .plv-drop-icon { font-size: 36px; margin-bottom: 10px; }
    .plv-drop-text { font-size: 14px; color: #cbd5e1; font-weight: 500; }
    .plv-drop-sub { font-size: 11px; color: #64748b; margin-top: 5px; }

    /* Preview */
    .plv-preview-img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: contain; background: #0f172a; z-index: 10; }
    .plv-remove-btn { 
      position: absolute; top: 10px; right: 10px; z-index: 20; 
      background: #ef4444; color: white; border: none; width: 28px; height: 28px; 
      border-radius: 50%; cursor: pointer; display: flex; align-items: center; justify-content: center;
      box-shadow: 0 2px 5px rgba(0,0,0,0.3); transition: transform 0.2s; font-size: 16px;
    }
    .plv-remove-btn:hover { transform: scale(1.1); }

    /* Footer */
    .plv-footer {
      padding: 15px 20px; background: #0f172a; border-top: 1px solid #334155;
      display: flex; justify-content: space-between; align-items: center;
    }
    .plv-status { font-size: 13px; color: #94a3b8; display: flex; align-items: center; gap: 6px; font-weight: 500; }
    .plv-btn {
      padding: 10px 24px; border-radius: 8px; font-size: 13px; font-weight: 600; 
      border: none; cursor: pointer; transition: all 0.2s;
    }
    .plv-btn-primary { 
      background: linear-gradient(135deg, #3b82f6, #2563eb); color: white; 
      box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
    }
    .plv-btn-primary:disabled { opacity: 0.5; cursor: not-allowed; box-shadow: none; background: #475569; }
    .plv-btn-primary:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 6px 15px rgba(59, 130, 246, 0.4); }

    /* Zone Badge */
    .plv-zone-badge {
      display: inline-flex; align-items: center; gap: 5px;
      background: rgba(59, 130, 246, 0.2); color: #60a5fa;
      padding: 3px 10px; border-radius: 12px; font-size: 11px; font-weight: 600;
    }

    /* Responsive */
    @media (max-width: 700px) {
      .plv-upload-body { grid-template-columns: 1fr; }
      .plv-col-left { border-right: none; border-bottom: 1px solid #334155; }
    }
  `;

  function injectStyles() {
    if (!document.getElementById("plv-upload-styles")) {
      const style = document.createElement("style");
      style.id = "plv-upload-styles";
      style.textContent = STYLES;
      document.head.appendChild(style);
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
                    objectConfig.file
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
  // 🌍 API GLOBALE
  // ============================================

  window.atlantisPLVUpload = {
    open,
    close,
    handleFile,
    resetFile,
    submit,
    isOpen: () => state.isOpen,
  };

  console.log("✅ PLV Upload: Prêt");
})();
