/**
 * ============================================
 * 🖼️ MURSOL UPLOAD - ATLANTIS CITY
 * Fichier autonome : Trigger + Popup Upload
 * Clic sur MurSol_obj → Ouvre l'upload
 * ============================================
 */

(function () {
  "use strict";

  // Éviter double initialisation
  if (window.__mursolUploadInitialized) return;
  window.__mursolUploadInitialized = true;

  console.log("🖼️ Module MurSol Upload initialisé");

  // ============================================
  // ⚙️ CONFIGURATION
  // ============================================
  const CONFIG = {
    apiBase: "https://compagnon.atlantis-city.com/api",
    plvBaseUrl: "https://compagnon.atlantis-city.com/plv",

    // Configuration de l'objet MurSol
    mursolConfig: {
      id: "MurSol_obj",
      title: "Mur Sol",
      shader: "c1_shdr", // À adapter selon ton shader
      file: "template_c1.png", // À adapter selon ton fichier
      format: "Paysage", // À adapter
      ratio: "16:9", // À adapter
      resolution: "1920 × 1080", // À adapter
      zoneSlug: "zone1", // À adapter
    },
  };

  // État local
  let state = {
    isOpen: false,
    selectedFile: null,
    isUploading: false,
    spaceSlug: null,
  };

  // ============================================
  // 🎨 STYLES CSS
  // ============================================
  const STYLES = `
    .mursol-upload-overlay {
      position: fixed; inset: 0; background: rgba(0,0,0,0.85); backdrop-filter: blur(5px);
      z-index: 99999; display: flex; align-items: center; justify-content: center;
      opacity: 0; transition: opacity 0.3s ease; font-family: 'Segoe UI', Roboto, sans-serif;
    }
    .mursol-upload-overlay.active { opacity: 1; }
    
    .mursol-upload-modal {
      background: #1e293b; border: 1px solid #334155; border-radius: 16px;
      width: 700px; max-width: 95vw; overflow: hidden;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
      transform: scale(0.95); transition: transform 0.3s ease;
    }
    .mursol-upload-overlay.active .mursol-upload-modal { transform: scale(1); }
    
    /* Header */
    .mursol-header {
      padding: 15px 20px; background: #0f172a; border-bottom: 1px solid #334155;
      display: flex; justify-content: space-between; align-items: center;
    }
    .mursol-title { 
      font-size: 16px; font-weight: 600; color: #f8fafc; margin: 0; 
      display: flex; gap: 10px; align-items: center; 
    }
    .mursol-close { 
      background: none; border: none; color: #94a3b8; font-size: 24px; 
      cursor: pointer; transition: color 0.2s; line-height: 1;
    }
    .mursol-close:hover { color: #ef4444; }

    /* Body Grid */
    .mursol-body { display: grid; grid-template-columns: 1fr 1fr; gap: 0; }
    .mursol-col { padding: 20px; }
    .mursol-col-left { 
      border-right: 1px solid #334155; background: #1e293b; 
      display: flex; flex-direction: column; gap: 15px; 
    }
    .mursol-col-right { background: #182235; }

    /* Info Grid */
    .mursol-info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
    .mursol-info-item label { 
      display: block; font-size: 10px; color: #64748b; 
      text-transform: uppercase; font-weight: 700; margin-bottom: 2px; 
    }
    .mursol-info-item span { 
      display: block; font-size: 13px; color: #e2e8f0; font-weight: 500; 
    }
    
    /* Current Image */
    .mursol-current-wrapper { flex: 1; display: flex; flex-direction: column; gap: 5px; }
    .mursol-current-title { 
      font-size: 11px; color: #94a3b8; font-weight: 600; text-transform: uppercase; 
    }
    .mursol-current-image {
      flex: 1; background: #0f172a; border-radius: 8px;
      display: flex; align-items: center; justify-content: center; overflow: hidden;
      border: 1px solid #334155; position: relative; min-height: 140px;
      background-image: linear-gradient(45deg, #1e293b 25%, transparent 25%), 
                        linear-gradient(-45deg, #1e293b 25%, transparent 25%), 
                        linear-gradient(45deg, transparent 75%, #1e293b 75%), 
                        linear-gradient(-45deg, transparent 75%, #1e293b 75%);
      background-size: 20px 20px; 
      background-position: 0 0, 0 10px, 10px -10px, -10px 0px;
    }
    .mursol-current-image img { max-width: 100%; max-height: 100%; object-fit: contain; }
    .mursol-no-image { color: #64748b; font-size: 13px; }

    /* Dropzone */
    .mursol-dropzone {
      height: 100%; min-height: 220px; border: 2px dashed #475569; border-radius: 12px;
      display: flex; flex-direction: column; align-items: center; justify-content: center;
      cursor: pointer; transition: all 0.2s; background: rgba(255,255,255,0.02); 
      text-align: center; position: relative; overflow: hidden;
    }
    .mursol-dropzone:hover { border-color: #3b82f6; background: rgba(59, 130, 246, 0.05); }
    .mursol-dropzone.dragover { border-color: #22c55e; background: rgba(34, 197, 94, 0.1); }
    .mursol-dropzone.has-file { border-style: solid; border-color: #22c55e; }
    
    .mursol-drop-icon { font-size: 32px; margin-bottom: 10px; color: #94a3b8; }
    .mursol-drop-text { font-size: 14px; color: #cbd5e1; font-weight: 500; }
    .mursol-drop-sub { font-size: 11px; color: #64748b; margin-top: 5px; }

    /* Preview */
    .mursol-preview-img { 
      position: absolute; inset: 0; width: 100%; height: 100%; 
      object-fit: contain; background: #0f172a; z-index: 10; 
    }
    .mursol-remove-btn { 
      position: absolute; top: 10px; right: 10px; z-index: 20; 
      background: #ef4444; color: white; border: none; width: 28px; height: 28px; 
      border-radius: 50%; cursor: pointer; display: flex; align-items: center; justify-content: center;
      box-shadow: 0 2px 5px rgba(0,0,0,0.3); transition: transform 0.2s; font-size: 16px;
    }
    .mursol-remove-btn:hover { transform: scale(1.1); }

    /* Footer */
    .mursol-footer {
      padding: 15px 20px; background: #0f172a; border-top: 1px solid #334155;
      display: flex; justify-content: space-between; align-items: center;
    }
    .mursol-status { 
      font-size: 13px; color: #94a3b8; display: flex; align-items: center; 
      gap: 6px; font-weight: 500; 
    }
    .mursol-status.error { color: #ef4444; }
    .mursol-status.success { color: #4ade80; }
    
    .mursol-btn {
      padding: 9px 24px; border-radius: 8px; font-size: 13px; font-weight: 600; 
      border: none; cursor: pointer; transition: all 0.2s;
    }
    .mursol-btn-primary { 
      background: linear-gradient(135deg, #3b82f6, #2563eb); color: white; 
      box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
    }
    .mursol-btn-primary:disabled { 
      opacity: 0.5; cursor: not-allowed; box-shadow: none; background: #334155; 
    }
    .mursol-btn-primary:hover:not(:disabled) { 
      transform: translateY(-1px); box-shadow: 0 6px 15px rgba(59, 130, 246, 0.4); 
    }

    /* Responsive */
    @media (max-width: 700px) {
      .mursol-body { grid-template-columns: 1fr; }
      .mursol-col-left { border-right: none; border-bottom: 1px solid #334155; }
    }
  `;

  // ============================================
  // 🛠️ UTILITAIRES
  // ============================================

  function injectStyles() {
    if (!document.getElementById("mursol-upload-styles")) {
      const style = document.createElement("style");
      style.id = "mursol-upload-styles";
      style.textContent = STYLES;
      document.head.appendChild(style);
    }
  }

  function getSpaceSlug() {
    return (
      window.ATLANTIS_SPACE ||
      (window.atlantisPopup &&
        window.atlantisPopup.getSpaceSlug &&
        window.atlantisPopup.getSpaceSlug()) ||
      "default"
    );
  }

  function getCurrentImageUrl() {
    const spaceSlug = state.spaceSlug || getSpaceSlug();
    return `${CONFIG.plvBaseUrl}/${spaceSlug}/${
      CONFIG.mursolConfig.file
    }?v=${Date.now()}`;
  }

  function formatSize(bytes) {
    if (bytes < 1024) return bytes + " o";
    return (bytes / (1024 * 1024)).toFixed(2) + " Mo";
  }

  // ============================================
  // 🎯 TRIGGER SHAPESPARK
  // ============================================

  function initializeTrigger() {
    if (typeof WALK === "undefined" || !WALK.getViewer) {
      console.warn("⚠️ WALK non disponible, retry dans 500ms");
      setTimeout(initializeTrigger, 500);
      return;
    }

    const viewer = WALK.getViewer();

    viewer.onSceneLoadComplete(function () {
      console.log("🎯 MurSol trigger configuré");

      viewer.onNodeTypeClicked(function (node) {
        const objectName = node.config?.name;

        if (!objectName) return false;

        // === MURSOL UPLOAD ===
        if (objectName === "MurSol_obj") {
          console.log("🖼️ Clic sur MurSol_obj détecté");
          openUploadPopup();
          return true;
        }

        return false;
      });

      console.log("✅ Trigger MurSol_obj → Upload prêt");
    });
  }

  // ============================================
  // 📤 POPUP UPLOAD
  // ============================================

  function openUploadPopup() {
    injectStyles();

    state.spaceSlug = getSpaceSlug();
    state.isOpen = true;
    state.selectedFile = null;
    state.isUploading = false;

    renderPopup();
  }

  function closePopup() {
    const overlay = document.querySelector(".mursol-upload-overlay");
    if (overlay) {
      overlay.classList.remove("active");
      setTimeout(() => overlay.remove(), 300);
    }
    state.isOpen = false;
    state.selectedFile = null;
  }

  function renderPopup() {
    // Nettoyer existant
    document
      .querySelectorAll(".mursol-upload-overlay")
      .forEach((el) => el.remove());

    const cfg = CONFIG.mursolConfig;

    const html = `
      <div class="mursol-upload-overlay">
        <div class="mursol-upload-modal">
          <div class="mursol-header">
            <h3 class="mursol-title">
              <span>📤</span> Modifier : ${cfg.title}
            </h3>
            <button class="mursol-close" id="mursol-close-btn">✕</button>
          </div>

          <div class="mursol-body">
            <div class="mursol-col mursol-col-left">
              <div class="mursol-info-grid">
                <div class="mursol-info-item">
                  <label>Format</label>
                  <span>${cfg.format} (${cfg.ratio})</span>
                </div>
                <div class="mursol-info-item">
                  <label>Résolution</label>
                  <span>${cfg.resolution}</span>
                </div>
                <div class="mursol-info-item" style="grid-column: span 2">
                  <label>Fichier cible</label>
                  <span style="font-family: monospace; color: #60a5fa; font-size: 12px;">${
                    cfg.file
                  }</span>
                </div>
              </div>
              
              <div class="mursol-current-wrapper">
                <div class="mursol-current-title">Image actuelle</div>
                <div class="mursol-current-image" id="mursol-current-img">
                  <img src="${getCurrentImageUrl()}" onerror="this.parentElement.innerHTML='<span class=\\'mursol-no-image\\'>Aucune image</span>'">
                </div>
              </div>
            </div>

            <div class="mursol-col mursol-col-right">
              <div class="mursol-dropzone" id="mursol-dropzone">
                <input type="file" id="mursol-file-input" accept="image/png" hidden>
                <div id="mursol-drop-content">
                  <div class="mursol-drop-icon">📁</div>
                  <div class="mursol-drop-text">Cliquez ou glissez ici</div>
                  <div class="mursol-drop-sub">PNG uniquement • Max 5 Mo</div>
                </div>
              </div>
            </div>
          </div>

          <div class="mursol-footer">
            <div class="mursol-status" id="mursol-status">En attente de fichier...</div>
            <button class="mursol-btn mursol-btn-primary" id="mursol-submit-btn" disabled>
              Uploader l'image
            </button>
          </div>
        </div>
      </div>
    `;

    document.body.insertAdjacentHTML("beforeend", html);

    // Animation entrée
    requestAnimationFrame(() => {
      const overlay = document.querySelector(".mursol-upload-overlay");
      if (overlay) overlay.classList.add("active");
    });

    setupEvents();
  }

  function setupEvents() {
    const overlay = document.querySelector(".mursol-upload-overlay");
    const closeBtn = document.getElementById("mursol-close-btn");
    const dropzone = document.getElementById("mursol-dropzone");
    const fileInput = document.getElementById("mursol-file-input");
    const submitBtn = document.getElementById("mursol-submit-btn");

    // Fermer overlay
    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) closePopup();
    });

    // Bouton fermer
    closeBtn.addEventListener("click", closePopup);

    // Escape
    document.addEventListener("keydown", handleEscape);

    // Dropzone click
    dropzone.addEventListener("click", () => fileInput.click());

    // File input change
    fileInput.addEventListener("change", (e) => {
      if (e.target.files.length) handleFile(e.target.files[0]);
    });

    // Drag & Drop
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
    submitBtn.addEventListener("click", submitUpload);
  }

  function handleEscape(e) {
    if (e.key === "Escape" && state.isOpen) {
      closePopup();
      document.removeEventListener("keydown", handleEscape);
    }
  }

  // ============================================
  // 📁 GESTION FICHIER
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
      setStatus("❌ Fichier trop lourd (> 5Mo)", "error");
      return;
    }

    state.selectedFile = file;

    // Preview
    const reader = new FileReader();
    reader.onload = (e) => {
      const dropzone = document.getElementById("mursol-dropzone");
      dropzone.classList.add("has-file");
      dropzone.innerHTML = `
        <img src="${e.target.result}" class="mursol-preview-img">
        <button class="mursol-remove-btn" id="mursol-remove-btn">✕</button>
      `;

      // Bouton supprimer
      document
        .getElementById("mursol-remove-btn")
        .addEventListener("click", (e) => {
          e.stopPropagation();
          resetFile();
        });

      document.getElementById("mursol-submit-btn").disabled = false;
      setStatus(`✅ Prêt à envoyer (${formatSize(file.size)})`, "success");
    };
    reader.readAsDataURL(file);
  }

  function resetFile() {
    state.selectedFile = null;
    document.getElementById("mursol-submit-btn").disabled = true;

    const dropzone = document.getElementById("mursol-dropzone");
    dropzone.classList.remove("has-file");
    dropzone.innerHTML = `
      <input type="file" id="mursol-file-input" accept="image/png" hidden>
      <div id="mursol-drop-content">
        <div class="mursol-drop-icon">📁</div>
        <div class="mursol-drop-text">Cliquez ou glissez ici</div>
        <div class="mursol-drop-sub">PNG uniquement • Max 5 Mo</div>
      </div>
    `;

    // Rebinder events
    const fileInput = document.getElementById("mursol-file-input");
    fileInput.addEventListener("change", (e) => {
      if (e.target.files.length) handleFile(e.target.files[0]);
    });

    setStatus("En attente de fichier...");
  }

  function setStatus(msg, type = "normal") {
    const el = document.getElementById("mursol-status");
    if (!el) return;
    el.textContent = msg;
    el.className = "mursol-status" + (type !== "normal" ? " " + type : "");
  }

  // ============================================
  // 📡 UPLOAD
  // ============================================

  async function submitUpload() {
    if (!state.selectedFile || state.isUploading) return;

    const btn = document.getElementById("mursol-submit-btn");
    state.isUploading = true;
    btn.disabled = true;
    btn.textContent = "⏳ Envoi...";
    setStatus("Téléchargement vers le serveur...", "normal");

    try {
      // 1. Token
      const token =
        (window.atlantisAuth &&
          window.atlantisAuth.getToken &&
          window.atlantisAuth.getToken()) ||
        localStorage.getItem("atlantis_auth_token");

      if (!token) {
        throw new Error("Vous n'êtes pas connecté");
      }

      // 2. FormData
      const formData = new FormData();
      formData.append("space_slug", state.spaceSlug);
      formData.append("zone_slug", CONFIG.mursolConfig.zoneSlug || "");
      formData.append("shader_name", CONFIG.mursolConfig.shader);
      formData.append("image", state.selectedFile);
      formData.append("auth_token", token); // Workaround OVH

      // 3. Envoi
      const res = await fetch(`${CONFIG.apiBase}/plv/upload.php`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      const result = await res.json();

      if (!result.success) {
        throw new Error(result.error || "Erreur serveur");
      }

      // 4. Succès
      setStatus("✅ Upload réussi !", "success");
      btn.textContent = "✨ Terminé";

      // Refresh Textures Shapespark
      if (typeof window.reloadPLVTextures === "function") {
        console.log("🔄 Rechargement des textures...");
        window.reloadPLVTextures();
      }

      // Refresh image actuelle
      const currentImg = document.querySelector("#mursol-current-img img");
      if (currentImg) {
        currentImg.src = getCurrentImageUrl();
      }

      // Fermer après délai
      setTimeout(closePopup, 1500);
    } catch (err) {
      console.error("❌ Erreur upload:", err);
      setStatus("❌ " + err.message, "error");
      btn.disabled = false;
      btn.textContent = "Réessayer";
      state.isUploading = false;
    }
  }

  // ============================================
  // 🚀 INITIALISATION
  // ============================================

  // Initialiser le trigger après un court délai
  setTimeout(initializeTrigger, 500);

  // API publique
  window.mursolUpload = {
    open: openUploadPopup,
    close: closePopup,
    isOpen: function () {
      return state.isOpen;
    },
  };

  console.log("🚀 Module MurSol Upload prêt");
  console.log(
    "💡 Cliquez sur MurSol_obj dans la scène 3D pour ouvrir l'upload"
  );
})();
