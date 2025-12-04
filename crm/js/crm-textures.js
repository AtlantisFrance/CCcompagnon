/**
 * ============================================
 * 🎨 CRM ATLANTIS CITY - TEXTURES/PLV MODULE
 * Gestion des projets PLV par espace
 * Choix individuel transparent/opaque par slot
 * Tous les fichiers en .png
 * ============================================
 */

(function () {
  "use strict";

  const CRM = window.CRM;
  const {
    CONFIG,
    state,
    apiCall,
    showToast,
    openModal,
    closeModal,
    formatDate,
  } = CRM;

  // === LOAD TEXTURES SECTION ===
  async function loadTextures() {
    const el = document.querySelector("#section-textures .crm-section-content");
    el.innerHTML =
      '<div class="crm-loading"><div class="crm-spinner"></div></div>';

    try {
      // Charger les espaces
      const spacesResult = await apiCall("/admin/spaces.php");
      const spaces = spacesResult.spaces || [];

      // Charger les projets PLV
      let plvProjects = [];
      try {
        const plvResult = await apiCall("/plv/projects.php");
        plvProjects = plvResult.projects || [];
      } catch (e) {
        console.warn("API PLV non disponible, liste vide");
      }

      state.data.spaces = spaces;
      state.plvProjects = plvProjects;

      renderTexturesSection(spaces, plvProjects);
    } catch (error) {
      el.innerHTML =
        '<div class="crm-empty">' +
        '<div class="crm-empty-icon">❌</div>' +
        "<h3>Erreur de chargement</h3>" +
        "<p>" +
        error.message +
        "</p>" +
        "</div>";
    }
  }

  // === RENDER MAIN VIEW ===
  function renderTexturesSection(spaces, plvProjects) {
    const el = document.querySelector("#section-textures .crm-section-content");

    // Grouper les projets par espace
    const projectsBySpace = {};
    plvProjects.forEach(function (p) {
      if (!projectsBySpace[p.space_id]) projectsBySpace[p.space_id] = [];
      projectsBySpace[p.space_id].push(p);
    });

    var spacesHtml = "";
    spaces.forEach(function (space) {
      const spaceProjects = projectsBySpace[space.id] || [];

      var projectsHtml = "";
      if (spaceProjects.length > 0) {
        projectsHtml = '<div class="plv-projects-list">';
        spaceProjects.forEach(function (project) {
          projectsHtml +=
            '<div class="plv-project-item">' +
            '<div class="plv-project-info">' +
            '<span class="plv-project-name">' +
            project.name +
            "</span>" +
            '<span class="plv-project-details">' +
            formatProjectSlots(project) +
            "</span>" +
            "</div>" +
            '<div class="plv-project-actions">' +
            '<button class="crm-btn crm-btn-sm crm-btn-secondary" onclick="window.CRM.viewPLVCode(' +
            project.id +
            ')" title="Voir le code">📋 Code</button>' +
            '<button class="crm-btn crm-btn-sm crm-btn-danger crm-btn-icon" onclick="window.CRM.deletePLVProject(' +
            project.id +
            ')" title="Supprimer">🗑️</button>' +
            "</div>" +
            "</div>";
        });
        projectsHtml += "</div>";
      }

      spacesHtml +=
        '<div class="plv-space-card">' +
        '<div class="plv-space-header">' +
        '<div class="plv-space-info">' +
        '<span class="plv-space-icon">📦</span>' +
        "<div>" +
        '<div class="plv-space-name">' +
        space.name +
        "</div>" +
        '<div class="plv-space-slug">' +
        space.slug +
        "</div>" +
        "</div>" +
        "</div>" +
        '<div class="plv-space-actions">' +
        (spaceProjects.length > 0
          ? '<span class="crm-badge crm-badge-success">' +
            spaceProjects.length +
            " projet" +
            (spaceProjects.length > 1 ? "s" : "") +
            "</span>"
          : '<span class="crm-badge crm-badge-info">Aucun projet</span>') +
        '<button class="crm-btn crm-btn-sm crm-btn-primary" onclick="window.CRM.createPLVProject(' +
        space.id +
        ')">➕ Ajouter PLV</button>' +
        "</div>" +
        "</div>" +
        projectsHtml +
        "</div>";
    });

    el.innerHTML =
      '<div class="crm-card">' +
      '<div class="crm-card-header">' +
      '<h3 class="crm-card-title">🎨 Projets PLV par Espace</h3>' +
      '<button class="crm-btn crm-btn-primary" onclick="window.CRM.createPLVProject()">➕ Nouveau projet PLV</button>' +
      "</div>" +
      (spaces.length > 0
        ? '<div class="plv-spaces-list">' + spacesHtml + "</div>"
        : '<div class="crm-empty"><div class="crm-empty-icon">📦</div><h3>Aucun espace</h3><p>Créez d\'abord un espace dans la section Espaces</p></div>') +
      "</div>" +
      "<style>" +
      ".plv-spaces-list { display: flex; flex-direction: column; gap: 16px; }" +
      ".plv-space-card { background: var(--bg-tertiary); border-radius: var(--radius-md); overflow: hidden; }" +
      ".plv-space-header { display: flex; justify-content: space-between; align-items: center; padding: 16px 20px; background: rgba(59, 130, 246, 0.1); border-bottom: 1px solid var(--border-color); }" +
      ".plv-space-info { display: flex; align-items: center; gap: 12px; }" +
      ".plv-space-icon { font-size: 24px; }" +
      ".plv-space-name { font-weight: 600; font-size: 16px; }" +
      ".plv-space-slug { font-size: 12px; color: var(--text-muted); font-family: monospace; }" +
      ".plv-space-actions { display: flex; align-items: center; gap: 10px; }" +
      ".plv-projects-list { padding: 12px; display: flex; flex-direction: column; gap: 8px; }" +
      ".plv-project-item { display: flex; justify-content: space-between; align-items: center; padding: 12px 16px; background: var(--bg-secondary); border-radius: var(--radius-sm); border: 1px solid var(--border-color); }" +
      ".plv-project-item:hover { border-color: var(--accent-primary); }" +
      ".plv-project-name { font-weight: 500; }" +
      ".plv-project-details { font-size: 12px; color: var(--text-muted); display: block; margin-top: 4px; }" +
      ".plv-project-actions { display: flex; gap: 8px; }" +
      "</style>";
  }

  // === FORMAT PROJECT SLOTS FOR DISPLAY ===
  function formatProjectSlots(project) {
    var slots = [];
    try {
      slots = JSON.parse(project.slots_config || "[]");
    } catch (e) {
      slots = [];
    }

    var carres = 0,
      paysages = 0,
      portraits = 0;
    var transparents = 0;

    slots.forEach(function (slot) {
      if (slot.format === "carre") carres++;
      if (slot.format === "paysage") paysages++;
      if (slot.format === "portrait") portraits++;
      if (slot.transparent) transparents++;
    });

    var parts = [];
    if (carres > 0) parts.push(carres + " carré" + (carres > 1 ? "s" : ""));
    if (paysages > 0)
      parts.push(paysages + " paysage" + (paysages > 1 ? "s" : ""));
    if (portraits > 0)
      parts.push(portraits + " portrait" + (portraits > 1 ? "s" : ""));

    var total = slots.length;
    var opaques = total - transparents;

    if (total === 0) return "Aucun slot";

    return (
      parts.join(", ") +
      " • " +
      transparents +
      " transparent" +
      (transparents > 1 ? "s" : "") +
      ", " +
      opaques +
      " opaque" +
      (opaques > 1 ? "s" : "")
    );
  }

  // === CREATE PLV PROJECT MODAL - STEP 1 ===
  function createPLVProject(preselectedSpaceId) {
    preselectedSpaceId = preselectedSpaceId || null;
    const spaces = state.data.spaces || [];

    var spacesOptions = '<option value="">Sélectionner un espace</option>';
    spaces.forEach(function (s) {
      var selected = preselectedSpaceId && s.id == preselectedSpaceId;
      spacesOptions +=
        '<option value="' +
        s.id +
        '" data-slug="' +
        s.slug +
        '"' +
        (selected ? " selected" : "") +
        ">" +
        s.name +
        " (" +
        s.slug +
        ")</option>";
    });

    state.plvDraft = {
      spaceId: preselectedSpaceId,
      spaceSlug: "",
      name: "",
      description: "",
      carreCount: 0,
      paysageCount: 0,
      portraitCount: 0,
      slots: [],
    };

    if (preselectedSpaceId) {
      var preSpace = spaces.find(function (s) {
        return s.id == preselectedSpaceId;
      });
      if (preSpace) state.plvDraft.spaceSlug = preSpace.slug;
    }

    openModal(
      "➕ Nouveau projet PLV - Étape 1/2",
      '<form id="plv-step1-form">' +
        '<div class="crm-form-group">' +
        '<label class="crm-form-label">Espace *</label>' +
        '<select class="crm-form-select" id="plv-space" required onchange="window.CRM.updateStep2Summary()">' +
        spacesOptions +
        "</select>" +
        "</div>" +
        '<div class="crm-form-group">' +
        '<label class="crm-form-label">Nom du projet *</label>' +
        '<input type="text" class="crm-form-input" id="plv-name" placeholder="Ex: PLV Boutique Paris" required>' +
        "</div>" +
        '<div class="crm-form-group">' +
        '<label class="crm-form-label">Description</label>' +
        '<textarea class="crm-form-textarea" id="plv-description" placeholder="Description optionnelle..."></textarea>' +
        "</div>" +
        '<div style="background: var(--bg-tertiary); padding: 16px; border-radius: 8px; margin-top: 20px;">' +
        '<h4 style="margin-bottom: 12px; color: var(--text-primary);">📐 Nombre de slots par format</h4>' +
        '<div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px;">' +
        '<div class="crm-form-group" style="margin: 0;">' +
        '<label class="crm-form-label">Carré (1:1)</label>' +
        '<input type="number" class="crm-form-input" id="plv-carre-count" value="0" min="0" max="100" onchange="window.CRM.updateStep2Summary()">' +
        "</div>" +
        '<div class="crm-form-group" style="margin: 0;">' +
        '<label class="crm-form-label">Paysage (16:9)</label>' +
        '<input type="number" class="crm-form-input" id="plv-paysage-count" value="0" min="0" max="100" onchange="window.CRM.updateStep2Summary()">' +
        "</div>" +
        '<div class="crm-form-group" style="margin: 0;">' +
        '<label class="crm-form-label">Portrait (9:16)</label>' +
        '<input type="number" class="crm-form-input" id="plv-portrait-count" value="0" min="0" max="100" onchange="window.CRM.updateStep2Summary()">' +
        "</div>" +
        "</div>" +
        '<div id="plv-summary" style="margin-top: 12px; padding: 10px; background: rgba(59, 130, 246, 0.1); border-radius: 6px; font-size: 13px; color: var(--text-secondary);"></div>' +
        "</div>" +
        "</form>",
      '<button class="crm-btn crm-btn-secondary" onclick="window.CRM.closeModal()">Annuler</button>' +
        '<button class="crm-btn crm-btn-primary" onclick="window.CRM.goToPLVStep2()">Suivant →</button>'
    );

    setTimeout(function () {
      CRM.updateStep2Summary();
    }, 100);
  }

  // === UPDATE SUMMARY ===
  function updateStep2Summary() {
    var carreCount = parseInt(
      document.getElementById("plv-carre-count")?.value || 0
    );
    var paysageCount = parseInt(
      document.getElementById("plv-paysage-count")?.value || 0
    );
    var portraitCount = parseInt(
      document.getElementById("plv-portrait-count")?.value || 0
    );
    var total = carreCount + paysageCount + portraitCount;

    var summaryEl = document.getElementById("plv-summary");
    if (summaryEl) {
      if (total === 0) {
        summaryEl.innerHTML = "⚠️ Ajoutez au moins 1 slot";
        summaryEl.style.background = "rgba(245, 158, 11, 0.1)";
      } else {
        var parts = [];
        if (carreCount > 0) parts.push(carreCount + " carré(s)");
        if (paysageCount > 0) parts.push(paysageCount + " paysage(s)");
        if (portraitCount > 0) parts.push(portraitCount + " portrait(s)");
        summaryEl.innerHTML = "✅ " + total + " slots: " + parts.join(", ");
        summaryEl.style.background = "rgba(34, 197, 94, 0.1)";
      }
    }
  }

  // === GO TO STEP 2 ===
  function goToPLVStep2() {
    var spaceSelect = document.getElementById("plv-space");
    var nameInput = document.getElementById("plv-name");
    var descInput = document.getElementById("plv-description");

    var spaceId = spaceSelect?.value;
    var spaceName = spaceSelect?.options[spaceSelect.selectedIndex]?.text || "";
    var spaceSlug =
      spaceSelect?.options[spaceSelect.selectedIndex]?.dataset?.slug || "";
    var name = nameInput?.value?.trim();
    var description = descInput?.value?.trim();

    var carreCount = parseInt(
      document.getElementById("plv-carre-count")?.value || 0
    );
    var paysageCount = parseInt(
      document.getElementById("plv-paysage-count")?.value || 0
    );
    var portraitCount = parseInt(
      document.getElementById("plv-portrait-count")?.value || 0
    );
    var total = carreCount + paysageCount + portraitCount;

    if (!spaceId) {
      showToast("Veuillez sélectionner un espace", "warning");
      return;
    }
    if (!name) {
      showToast("Veuillez saisir un nom de projet", "warning");
      return;
    }
    if (total === 0) {
      showToast("Ajoutez au moins 1 slot", "warning");
      return;
    }

    state.plvDraft = {
      spaceId: spaceId,
      spaceSlug: spaceSlug,
      spaceName: spaceName,
      name: name,
      description: description,
      carreCount: carreCount,
      paysageCount: paysageCount,
      portraitCount: portraitCount,
      slots: [],
    };

    // Générer les slots
    var slots = [];
    for (var i = 1; i <= carreCount; i++) {
      slots.push({
        format: "carre",
        index: i,
        shader: "c" + i + "_shdr",
        file: "template_C" + i + ".png",
        transparent: true,
      });
    }
    for (var i = 1; i <= paysageCount; i++) {
      slots.push({
        format: "paysage",
        index: i,
        shader: "l" + i + "_shdr",
        file: "template_L" + i + ".png",
        transparent: true,
      });
    }
    for (var i = 1; i <= portraitCount; i++) {
      slots.push({
        format: "portrait",
        index: i,
        shader: "p" + i + "_shdr",
        file: "template_P" + i + ".png",
        transparent: true,
      });
    }
    state.plvDraft.slots = slots;

    // Afficher étape 2
    renderPLVStep2();
  }

  // === RENDER STEP 2 ===
  function renderPLVStep2() {
    var draft = state.plvDraft;

    var slotsHtml =
      '<div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 12px;">';

    draft.slots.forEach(function (slot, idx) {
      var formatLabel =
        slot.format === "carre"
          ? "Carré 1:1"
          : slot.format === "paysage"
          ? "Paysage 16:9"
          : "Portrait 9:16";
      var formatIcon =
        slot.format === "carre"
          ? "⬜"
          : slot.format === "paysage"
          ? "🖼️"
          : "📱";

      slotsHtml +=
        '<div class="plv-slot-card" data-slot-index="' +
        idx +
        '">' +
        '<div class="plv-slot-header">' +
        '<span class="plv-slot-icon">' +
        formatIcon +
        "</span>" +
        '<span class="plv-slot-name">' +
        slot.shader +
        "</span>" +
        "</div>" +
        '<div class="plv-slot-info">' +
        formatLabel +
        "</div>" +
        '<label class="plv-slot-checkbox">' +
        '<input type="checkbox" id="slot-transparent-' +
        idx +
        '" ' +
        (slot.transparent ? "checked" : "") +
        ' onchange="window.CRM.toggleSlotTransparent(' +
        idx +
        ')">' +
        "<span>Transparent</span>" +
        "</label>" +
        "</div>";
    });
    slotsHtml += "</div>";

    openModal(
      "➕ Nouveau projet PLV - Étape 2/2",
      '<div style="margin-bottom: 20px; padding: 16px; background: var(--bg-tertiary); border-radius: 8px;">' +
        "<h4>📋 Récapitulatif</h4>" +
        '<p style="margin: 8px 0; color: var(--text-secondary);">Espace: <strong>' +
        draft.spaceName +
        "</strong></p>" +
        '<p style="margin: 8px 0; color: var(--text-secondary);">Projet: <strong>' +
        draft.name +
        "</strong></p>" +
        '<p style="margin: 8px 0; color: var(--text-secondary);">Total: <strong>' +
        draft.slots.length +
        " slots</strong></p>" +
        "</div>" +
        '<div style="margin-bottom: 16px;">' +
        '<h4 style="margin-bottom: 12px;">🎨 Configuration des slots</h4>' +
        '<p style="font-size: 13px; color: var(--text-muted); margin-bottom: 16px;">Cochez "Transparent" pour les PLV avec fond transparent (alphaMode BLEND), décochez pour les opaques.</p>' +
        slotsHtml +
        "</div>" +
        "<style>" +
        ".plv-slot-card { background: var(--bg-secondary); border: 1px solid var(--border-color); border-radius: 8px; padding: 12px; }" +
        ".plv-slot-card:hover { border-color: var(--accent-primary); }" +
        ".plv-slot-header { display: flex; align-items: center; gap: 8px; margin-bottom: 8px; }" +
        ".plv-slot-icon { font-size: 18px; }" +
        ".plv-slot-name { font-weight: 600; font-family: monospace; font-size: 13px; }" +
        ".plv-slot-info { font-size: 11px; color: var(--text-muted); margin-bottom: 8px; }" +
        ".plv-slot-checkbox { display: flex; align-items: center; gap: 6px; font-size: 12px; cursor: pointer; }" +
        ".plv-slot-checkbox input { cursor: pointer; }" +
        "</style>",
      '<button class="crm-btn crm-btn-secondary" onclick="window.CRM.backToPLVStep1()">← Retour</button>' +
        '<button class="crm-btn crm-btn-primary" onclick="window.CRM.savePLVProject()">✅ Créer le projet</button>'
    );
  }

  // === TOGGLE SLOT TRANSPARENT ===
  function toggleSlotTransparent(idx) {
    if (state.plvDraft && state.plvDraft.slots[idx]) {
      var checkbox = document.getElementById("slot-transparent-" + idx);
      state.plvDraft.slots[idx].transparent = checkbox?.checked || false;
    }
  }

  // === BACK TO STEP 1 ===
  function backToPLVStep1() {
    var draft = state.plvDraft || {};
    createPLVProject(draft.spaceId);

    setTimeout(function () {
      if (draft.name) document.getElementById("plv-name").value = draft.name;
      if (draft.description)
        document.getElementById("plv-description").value = draft.description;
      if (draft.carreCount)
        document.getElementById("plv-carre-count").value = draft.carreCount;
      if (draft.paysageCount)
        document.getElementById("plv-paysage-count").value = draft.paysageCount;
      if (draft.portraitCount)
        document.getElementById("plv-portrait-count").value =
          draft.portraitCount;
      CRM.updateStep2Summary();
    }, 100);
  }

  // === SAVE PLV PROJECT ===
  async function savePLVProject() {
    var draft = state.plvDraft;

    if (!draft || !draft.spaceId || !draft.name || draft.slots.length === 0) {
      showToast("Données incomplètes", "error");
      return;
    }

    var data = {
      space_id: draft.spaceId,
      name: draft.name,
      description: draft.description || "",
      slots_config: draft.slots,
    };

    try {
      await apiCall("/plv/projects.php", "POST", data);
      showToast("Projet PLV créé avec succès !", "success");
      closeModal();
      state.plvDraft = null;
      loadTextures();
    } catch (error) {
      showToast(error.message, "error");
    }
  }

  // === VIEW PLV CODE ===
  async function viewPLVCode(projectId) {
    try {
      var result = await apiCall("/plv/projects.php?id=" + projectId);
      var project = result.project || result;

      var code = generateAutotexturesCode(project);

      openModal(
        "📋 Code autotextures.js",
        '<div style="margin-bottom: 16px;">' +
          '<p style="color: var(--text-secondary); margin-bottom: 8px;">' +
          "Projet: <strong>" +
          project.name +
          "</strong> | " +
          "Espace: <strong>" +
          (project.space_slug || project.folder_name) +
          "</strong>" +
          "</p>" +
          '<p style="color: var(--text-muted); font-size: 12px;">' +
          "Copiez ce code dans votre fichier autotextures.js pour Shapespark" +
          "</p>" +
          "</div>" +
          '<div style="position: relative;">' +
          '<button class="crm-btn crm-btn-sm crm-btn-primary" onclick="window.CRM.copyPLVCode()" style="position: absolute; top: 8px; right: 8px; z-index: 10;">📋 Copier</button>' +
          '<textarea id="plv-code-output" readonly style="width: 100%; height: 400px; background: #0d1117; color: #22c55e; font-family: Consolas, Monaco, monospace; font-size: 12px; padding: 16px; border: 1px solid var(--border-color); border-radius: 8px; resize: vertical;">' +
          escapeHtml(code) +
          "</textarea>" +
          "</div>",
        '<button class="crm-btn crm-btn-secondary" onclick="window.CRM.closeModal()">Fermer</button>'
      );
    } catch (error) {
      showToast(error.message, "error");
    }
  }

  // === GENERATE AUTOTEXTURES CODE (NOUVEAU FORMAT avec window.ATLANTIS_SPACE) ===
  function generateAutotexturesCode(project) {
    var spaceSlug = project.space_slug || project.folder_name || "default";

    var slots = [];
    try {
      slots = JSON.parse(project.slots_config || "[]");
    } catch (e) {
      slots = [];
    }

    // Construire l'objet textures et opaqueList
    var texturesLines = [];
    var opaqueList = [];

    slots.forEach(function (slot) {
      texturesLines.push("      " + slot.shader + ': "' + slot.file + '"');
      if (!slot.transparent) {
        opaqueList.push('"' + slot.shader + '"');
      }
    });

    var texturesStr = texturesLines.join(",\n");
    var opaqueListStr =
      opaqueList.length > 0 ? "[" + opaqueList.join(", ") + "]" : "[]";

    // Note pour l'utilisateur
    var headerComment =
      "/**\n" +
      " * ============================================\n" +
      " * 🎨 AUTOTEXTURES PLV - ATLANTIS CITY\n" +
      " * Généré depuis le CRM pour: " +
      spaceSlug +
      "\n" +
      " * ============================================\n" +
      " * \n" +
      " * IMPORTANT: Définir window.ATLANTIS_SPACE dans body-end.html:\n" +
      ' * <script>window.ATLANTIS_SPACE = "' +
      spaceSlug +
      '";</script>\n' +
      " */\n\n";

    return (
      headerComment +
      "(function () {\n" +
      '  "use strict";\n' +
      "\n" +
      "  const viewer = WALK.getViewer();\n" +
      "\n" +
      "  // ============================================\n" +
      "  // ⚙️ CONFIGURATION\n" +
      "  // ============================================\n" +
      "  const config = {\n" +
      "    // Utilise la variable globale définie dans body-end.html\n" +
      "    get spaceSlug() {\n" +
      '      return window.ATLANTIS_SPACE || "' +
      spaceSlug +
      '";\n' +
      "    },\n" +
      "\n" +
      "    // URL du proxy PHP (avec CORS)\n" +
      '    proxyUrl: "https://compagnon.atlantis-city.com/plv/image.php",\n' +
      "\n" +
      "    // Génère l'URL d'une image via le proxy\n" +
      "    getImageUrl(fileName) {\n" +
      "      const version = Date.now();\n" +
      "      return `${this.proxyUrl}?project=${this.spaceSlug}&file=${fileName}&v=${version}`;\n" +
      "    },\n" +
      "\n" +
      "    batchSize: 3,\n" +
      "\n" +
      "    // 🖼️ MAPPING SHADER → FICHIER\n" +
      "    textures: {\n" +
      texturesStr +
      "\n" +
      "    },\n" +
      "\n" +
      "    // Shaders en mode opaque (pas de transparence)\n" +
      "    opaqueList: " +
      opaqueListStr +
      ",\n" +
      "  };\n" +
      "\n" +
      "  let isLoading = false;\n" +
      "\n" +
      "  // ============================================\n" +
      "  // 🔘 BOUTON RECHARGEMENT\n" +
      "  // ============================================\n" +
      "  function createReloadButton() {\n" +
      '    if (document.getElementById("reload-textures-btn")) return;\n' +
      "\n" +
      '    const button = document.createElement("button");\n' +
      '    button.id = "reload-textures-btn";\n' +
      '    button.innerHTML = "🔄 Actualiser PLV";\n' +
      '    button.title = "Recharger les textures depuis le serveur";\n' +
      "\n" +
      "    button.style.cssText = `\n" +
      "      position: fixed;\n" +
      "      top: 20px;\n" +
      "      left: 50%;\n" +
      "      transform: translateX(-50%);\n" +
      "      z-index: 10000;\n" +
      "      padding: 10px 20px;\n" +
      "      font-size: 14px;\n" +
      "      font-weight: 600;\n" +
      '      font-family: "Segoe UI", Roboto, sans-serif;\n' +
      "      color: white;\n" +
      "      background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);\n" +
      "      border: 2px solid rgba(255, 255, 255, 0.3);\n" +
      "      border-radius: 25px;\n" +
      "      cursor: pointer;\n" +
      "      box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);\n" +
      "      transition: all 0.3s ease;\n" +
      "    `;\n" +
      "\n" +
      '    button.addEventListener("mouseenter", () => {\n' +
      "      if (!isLoading) {\n" +
      '        button.style.transform = "translateX(-50%) translateY(-2px)";\n' +
      '        button.style.boxShadow = "0 6px 20px rgba(59, 130, 246, 0.5)";\n' +
      "      }\n" +
      "    });\n" +
      "\n" +
      '    button.addEventListener("mouseleave", () => {\n' +
      "      if (!isLoading) {\n" +
      '        button.style.transform = "translateX(-50%)";\n' +
      '        button.style.boxShadow = "0 4px 15px rgba(0, 0, 0, 0.3)";\n' +
      "      }\n" +
      "    });\n" +
      "\n" +
      '    button.addEventListener("click", () => {\n' +
      "      if (!isLoading) loadAllTextures();\n" +
      "    });\n" +
      "\n" +
      "    document.body.appendChild(button);\n" +
      "  }\n" +
      "\n" +
      "  function updateButtonState(loading, success = null) {\n" +
      '    const button = document.getElementById("reload-textures-btn");\n' +
      "    if (!button) return;\n" +
      "\n" +
      "    isLoading = loading;\n" +
      "\n" +
      "    if (loading) {\n" +
      '      button.innerHTML = "⏳ Chargement...";\n' +
      '      button.style.cursor = "wait";\n' +
      '      button.style.opacity = "0.7";\n' +
      "    } else if (success === true) {\n" +
      '      button.innerHTML = "✅ Actualisé !";\n' +
      '      button.style.background = "linear-gradient(135deg, #22c55e 0%, #16a34a 100%)";\n' +
      "      setTimeout(() => {\n" +
      '        button.innerHTML = "🔄 Actualiser PLV";\n' +
      '        button.style.background = "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)";\n' +
      '        button.style.cursor = "pointer";\n' +
      '        button.style.opacity = "1";\n' +
      "      }, 2000);\n" +
      "    } else if (success === false) {\n" +
      '      button.innerHTML = "❌ Erreur";\n' +
      '      button.style.background = "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)";\n' +
      "      setTimeout(() => {\n" +
      '        button.innerHTML = "🔄 Actualiser PLV";\n' +
      '        button.style.background = "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)";\n' +
      '        button.style.cursor = "pointer";\n' +
      '        button.style.opacity = "1";\n' +
      "      }, 2000);\n" +
      "    }\n" +
      "  }\n" +
      "\n" +
      "  // ============================================\n" +
      "  // 🖼️ CHARGEMENT TEXTURE\n" +
      "  // ============================================\n" +
      "  function loadSingleTextureAsync(material, imageUrl, opaque = false) {\n" +
      "    return new Promise((resolve, reject) => {\n" +
      "      const img = new Image();\n" +
      '      img.crossOrigin = "anonymous";\n' +
      "\n" +
      "      img.onload = () => {\n" +
      "        try {\n" +
      "          const checkForAlpha = !opaque;\n" +
      "          const texture = viewer.createTextureFromHtmlImage(img, checkForAlpha);\n" +
      "\n" +
      "          if (texture) {\n" +
      "            material.baseColorTexture = texture;\n" +
      "\n" +
      "            if (opaque) {\n" +
      "              material.baseColorFactor = [1, 1, 1, 1];\n" +
      "              material.opacity = 1;\n" +
      '              material.alphaMode = "OPAQUE";\n' +
      "            } else {\n" +
      "              material.baseColorFactor = [1, 1, 1, 0.99];\n" +
      "              material.opacity = 0.99;\n" +
      '              material.alphaMode = "BLEND";\n' +
      "            }\n" +
      "\n" +
      "            material.alphaTest = 0;\n" +
      "            material.metallic = 0;\n" +
      "            material.roughness = 1;\n" +
      "            material.needsUpdate = true;\n" +
      "            viewer.requestFrame();\n" +
      "            resolve();\n" +
      "          } else {\n" +
      "            console.error(`❌ Texture creation failed for ${material.name}`);\n" +
      '            reject(new Error("Texture creation failed"));\n' +
      "          }\n" +
      "        } catch (e) {\n" +
      "          console.error(`❌ Error applying texture for ${material.name}:`, e);\n" +
      "          reject(e);\n" +
      "        }\n" +
      "      };\n" +
      "\n" +
      "      img.onerror = () => {\n" +
      "        console.error(`❌ Image load failed: ${imageUrl}`);\n" +
      '        reject(new Error("Image load failed"));\n' +
      "      };\n" +
      "\n" +
      "      img.src = imageUrl;\n" +
      "    });\n" +
      "  }\n" +
      "\n" +
      "  // ============================================\n" +
      "  // 🚀 CHARGEMENT PRINCIPAL\n" +
      "  // ============================================\n" +
      "  async function loadAllTextures() {\n" +
      "    console.log(`🚀 Chargement textures PLV (${config.spaceSlug})...`);\n" +
      "    updateButtonState(true);\n" +
      "\n" +
      "    const textureEntries = Object.entries(config.textures);\n" +
      "    let loadedCount = 0;\n" +
      "    let errorCount = 0;\n" +
      "    const totalTextures = textureEntries.length;\n" +
      "\n" +
      "    for (let i = 0; i < totalTextures; i += config.batchSize) {\n" +
      "      const batch = textureEntries.slice(i, i + config.batchSize);\n" +
      "\n" +
      "      const promises = batch.map(([shaderName, fileName]) => {\n" +
      "        const material = viewer.findMaterial(shaderName);\n" +
      "\n" +
      "        if (material) {\n" +
      "          const imageUrl = config.getImageUrl(fileName);\n" +
      "          const isOpaque = config.opaqueList.includes(shaderName);\n" +
      "\n" +
      "          return loadSingleTextureAsync(material, imageUrl, isOpaque)\n" +
      "            .then(() => {\n" +
      "              loadedCount++;\n" +
      "              console.log(`✅ ${shaderName} → ${fileName}`);\n" +
      "            })\n" +
      "            .catch(() => errorCount++);\n" +
      "        } else {\n" +
      "          console.warn(`⚠️ Matériau '${shaderName}' introuvable`);\n" +
      "          errorCount++;\n" +
      "          return Promise.resolve();\n" +
      "        }\n" +
      "      });\n" +
      "\n" +
      "      await Promise.all(promises);\n" +
      "    }\n" +
      "\n" +
      "    const success = errorCount === 0;\n" +
      "    console.log(`✅ Terminé: ${loadedCount}/${totalTextures} (${errorCount} erreurs)`);\n" +
      "    updateButtonState(false, success);\n" +
      "\n" +
      "    return { loaded: loadedCount, errors: errorCount, total: totalTextures };\n" +
      "  }\n" +
      "\n" +
      "  // ============================================\n" +
      "  // 📋 INITIALISATION\n" +
      "  // ============================================\n" +
      "  const materialNames = Object.keys(config.textures);\n" +
      "  console.log(`🎨 Setting ${materialNames.length} materials as editable...`);\n" +
      "  console.log(`📡 Source: OVH PHP - Space ${config.spaceSlug}`);\n" +
      "\n" +
      "  materialNames.forEach((materialName) => {\n" +
      "    viewer.setMaterialEditable(materialName);\n" +
      "  });\n" +
      "\n" +
      "  viewer.onSceneLoadComplete(() => {\n" +
      "    console.log(`🎨 Module AutoTextures PLV prêt`);\n" +
      "    createReloadButton();\n" +
      "    loadAllTextures();\n" +
      "  });\n" +
      "\n" +
      "  // ============================================\n" +
      "  // 🌐 API PUBLIQUE\n" +
      "  // ============================================\n" +
      "  window.reloadPLVTextures = loadAllTextures;\n" +
      "\n" +
      "  window.atlantisTextures = {\n" +
      "    reload: loadAllTextures,\n" +
      "    getSpaceSlug: () => config.spaceSlug,\n" +
      "    getConfig: () => ({ ...config, textures: { ...config.textures } }),\n" +
      "    setTexture: (shaderName, fileName) => {\n" +
      "      config.textures[shaderName] = fileName;\n" +
      "      console.log(`📝 Mapping ajouté: ${shaderName} → ${fileName}`);\n" +
      "    },\n" +
      "  };\n" +
      "\n" +
      '  console.log("🚀 Module AutoTextures OVH initialisé");\n' +
      "})();"
    );
  }

  // === COPY CODE ===
  function copyPLVCode() {
    var textarea = document.getElementById("plv-code-output");
    if (textarea) {
      textarea.select();
      document.execCommand("copy");
      showToast("Code copié dans le presse-papier !", "success");
    }
  }

  // === DELETE PLV PROJECT ===
  async function deletePLVProject(projectId) {
    if (
      !confirm(
        "Voulez-vous vraiment supprimer ce projet PLV ?\nLe dossier et les images seront supprimés."
      )
    ) {
      return;
    }

    try {
      await apiCall("/plv/projects.php?id=" + projectId, "DELETE");
      showToast("Projet PLV supprimé", "success");
      loadTextures();
    } catch (error) {
      showToast(error.message, "error");
    }
  }

  // === HELPER ===
  function escapeHtml(text) {
    var div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
  }

  // === EXPOSE TO CRM ===
  Object.assign(CRM, {
    loadTextures: loadTextures,
    createPLVProject: createPLVProject,
    goToPLVStep2: goToPLVStep2,
    updateStep2Summary: updateStep2Summary,
    backToPLVStep1: backToPLVStep1,
    toggleSlotTransparent: toggleSlotTransparent,
    savePLVProject: savePLVProject,
    viewPLVCode: viewPLVCode,
    copyPLVCode: copyPLVCode,
    deletePLVProject: deletePLVProject,
  });

  console.log("✅ CRM Textures/PLV loaded");
})();
