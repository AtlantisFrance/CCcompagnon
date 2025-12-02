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
      spacesOptions +=
        '<option value="' +
        s.id +
        '" data-slug="' +
        s.slug +
        '"' +
        (preselectedSpaceId == s.id ? " selected" : "") +
        ">" +
        s.name +
        " (" +
        s.slug +
        ")</option>";
    });

    openModal(
      "➕ Nouveau projet PLV - Étape 1/2",
      '<form id="create-plv-form-step1">' +
        '<div class="crm-form-group">' +
        '<label class="crm-form-label">Espace Shapespark *</label>' +
        '<select class="crm-form-select" name="space_id" id="plv-space-select" required>' +
        spacesOptions +
        "</select>" +
        "</div>" +
        '<div class="crm-form-group">' +
        '<label class="crm-form-label">Nom du projet *</label>' +
        '<input type="text" class="crm-form-input" name="name" placeholder="Ex: PLV Salon Principal" required>' +
        "</div>" +
        '<div class="crm-card" style="margin-top: 20px; padding: 16px;">' +
        '<h4 style="margin-bottom: 16px;">🎯 Nombre de slots par format</h4>' +
        '<div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px;">' +
        '<div class="crm-form-group" style="margin-bottom: 0;">' +
        '<label class="crm-form-label">🟦 Carrés (1:1)</label>' +
        '<input type="number" class="crm-form-input" name="nb_carres" min="0" max="100" value="0">' +
        "</div>" +
        '<div class="crm-form-group" style="margin-bottom: 0;">' +
        '<label class="crm-form-label">🌄 Paysages (16:9)</label>' +
        '<input type="number" class="crm-form-input" name="nb_paysages" min="0" max="100" value="0">' +
        "</div>" +
        '<div class="crm-form-group" style="margin-bottom: 0;">' +
        '<label class="crm-form-label">🖼️ Portraits (9:16)</label>' +
        '<input type="number" class="crm-form-input" name="nb_portraits" min="0" max="100" value="0">' +
        "</div>" +
        "</div>" +
        "</div>" +
        "</form>",
      '<button class="crm-btn crm-btn-secondary" onclick="window.CRM.closeModal()">Annuler</button>' +
        '<button class="crm-btn crm-btn-primary" onclick="window.CRM.goToPLVStep2()">Suivant →</button>'
    );
  }

  // === GO TO STEP 2 ===
  function goToPLVStep2() {
    var form = document.getElementById("create-plv-form-step1");
    var spaceSelect = document.getElementById("plv-space-select");
    var selectedOption = spaceSelect.options[spaceSelect.selectedIndex];

    var spaceId = spaceSelect.value;
    var spaceSlug = selectedOption ? selectedOption.dataset.slug : "";
    var projectName = form.querySelector('[name="name"]').value.trim();

    var nbCarres =
      parseInt(form.querySelector('[name="nb_carres"]').value) || 0;
    var nbPaysages =
      parseInt(form.querySelector('[name="nb_paysages"]').value) || 0;
    var nbPortraits =
      parseInt(form.querySelector('[name="nb_portraits"]').value) || 0;

    // Validation
    if (!spaceId) {
      showToast("Veuillez sélectionner un espace", "error");
      return;
    }
    if (!projectName) {
      showToast("Veuillez entrer un nom de projet", "error");
      return;
    }
    var total = nbCarres + nbPaysages + nbPortraits;
    if (total === 0) {
      showToast("Veuillez définir au moins un slot", "error");
      return;
    }

    // Stocker les données pour l'étape 2
    state.plvDraft = {
      space_id: spaceId,
      space_slug: spaceSlug,
      name: projectName,
      nb_carres: nbCarres,
      nb_paysages: nbPaysages,
      nb_portraits: nbPortraits,
    };

    // Afficher étape 2
    showPLVStep2();
  }

  // === SHOW STEP 2 ===
  function showPLVStep2() {
    var draft = state.plvDraft;

    // Générer la liste des slots
    var slotsHtml = "";

    // Carrés
    for (var i = 1; i <= draft.nb_carres; i++) {
      slotsHtml += createSlotRow("carre", "c", i, "C", "🟦");
    }

    // Paysages
    for (var i = 1; i <= draft.nb_paysages; i++) {
      slotsHtml += createSlotRow("paysage", "l", i, "L", "🌄");
    }

    // Portraits
    for (var i = 1; i <= draft.nb_portraits; i++) {
      slotsHtml += createSlotRow("portrait", "p", i, "P", "🖼️");
    }

    var total = draft.nb_carres + draft.nb_paysages + draft.nb_portraits;

    openModal(
      "➕ Nouveau projet PLV - Étape 2/2",
      '<div style="margin-bottom: 16px; padding: 12px; background: var(--bg-tertiary); border-radius: 8px;">' +
        "<strong>" +
        draft.name +
        "</strong> • Espace: " +
        draft.space_slug +
        " • " +
        total +
        " slots" +
        "</div>" +
        '<p style="color: var(--text-muted); font-size: 13px; margin-bottom: 16px;">' +
        "🔲 Cochez les slots qui doivent supporter la <strong>transparence (alpha)</strong>.<br>" +
        "Les slots non cochés seront traités comme <strong>opaques</strong>." +
        "</p>" +
        '<div id="plv-slots-list" style="max-height: 400px; overflow-y: auto;">' +
        '<table class="crm-table" style="margin: 0;">' +
        "<thead>" +
        "<tr>" +
        '<th style="width: 50px;">Format</th>' +
        "<th>Shader</th>" +
        "<th>Fichier</th>" +
        '<th style="width: 120px; text-align: center;">Transparent ?</th>' +
        "</tr>" +
        "</thead>" +
        "<tbody>" +
        slotsHtml +
        "</tbody>" +
        "</table>" +
        "</div>" +
        '<div style="margin-top: 16px; padding: 12px; background: var(--bg-tertiary); border-radius: 8px; display: flex; justify-content: space-between;">' +
        "<span>Résumé :</span>" +
        '<span id="plv-step2-summary">0 transparents, ' +
        total +
        " opaques</span>" +
        "</div>",
      '<button class="crm-btn crm-btn-secondary" onclick="window.CRM.backToPLVStep1()">← Retour</button>' +
        '<button class="crm-btn crm-btn-primary" onclick="window.CRM.savePLVProject()">Créer le projet</button>'
    );

    updateStep2Summary();
  }

  // === CREATE SLOT ROW ===
  function createSlotRow(format, prefix, index, filePrefix, icon) {
    var shaderName = prefix + index + "_shdr";
    var fileName = "template_" + filePrefix + index + ".png";

    return (
      "<tr>" +
      '<td style="text-align: center; font-size: 20px;">' +
      icon +
      "</td>" +
      '<td><code style="background: var(--bg-primary); padding: 4px 8px; border-radius: 4px;">' +
      shaderName +
      "</code></td>" +
      '<td><code style="background: var(--bg-primary); padding: 4px 8px; border-radius: 4px;">' +
      fileName +
      "</code></td>" +
      '<td style="text-align: center;">' +
      '<label style="cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px;">' +
      '<input type="checkbox" class="plv-transparent-check" data-format="' +
      format +
      '" data-shader="' +
      shaderName +
      '" data-file="' +
      fileName +
      '" onchange="window.CRM.updateStep2Summary()">' +
      '<span class="plv-check-label">🔲</span>' +
      "</label>" +
      "</td>" +
      "</tr>"
    );
  }

  // === UPDATE STEP 2 SUMMARY ===
  function updateStep2Summary() {
    var checkboxes = document.querySelectorAll(".plv-transparent-check");
    var transparents = 0;
    var total = checkboxes.length;

    checkboxes.forEach(function (cb) {
      if (cb.checked) {
        transparents++;
        cb.parentElement.querySelector(".plv-check-label").textContent = "✅";
      } else {
        cb.parentElement.querySelector(".plv-check-label").textContent = "🔲";
      }
    });

    var opaques = total - transparents;
    var summary = document.getElementById("plv-step2-summary");
    if (summary) {
      summary.innerHTML =
        '<span style="color: var(--info);">' +
        transparents +
        " transparent" +
        (transparents > 1 ? "s" : "") +
        "</span>, " +
        '<span style="color: var(--warning);">' +
        opaques +
        " opaque" +
        (opaques > 1 ? "s" : "") +
        "</span>";
    }
  }

  // === BACK TO STEP 1 ===
  function backToPLVStep1() {
    var draft = state.plvDraft;
    createPLVProject(draft.space_id);

    // Remettre les valeurs
    setTimeout(function () {
      var form = document.getElementById("create-plv-form-step1");
      if (form) {
        form.querySelector('[name="name"]').value = draft.name;
        form.querySelector('[name="nb_carres"]').value = draft.nb_carres;
        form.querySelector('[name="nb_paysages"]').value = draft.nb_paysages;
        form.querySelector('[name="nb_portraits"]').value = draft.nb_portraits;
      }
    }, 100);
  }

  // === SAVE PLV PROJECT ===
  async function savePLVProject() {
    var draft = state.plvDraft;
    var checkboxes = document.querySelectorAll(".plv-transparent-check");

    // Construire la liste des slots
    var slots = [];
    checkboxes.forEach(function (cb) {
      slots.push({
        format: cb.dataset.format,
        shader: cb.dataset.shader,
        file: cb.dataset.file,
        transparent: cb.checked,
      });
    });

    var data = {
      space_id: draft.space_id,
      space_slug: draft.space_slug,
      name: draft.name,
      slots_config: JSON.stringify(slots),
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

  // === GENERATE AUTOTEXTURES CODE ===
  function generateAutotexturesCode(project) {
    var projectFolder = project.space_slug || project.folder_name || "project";

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
      texturesLines.push("      '" + slot.shader + "': '" + slot.file + "'");
      if (!slot.transparent) {
        opaqueList.push("'" + slot.shader + "'");
      }
    });

    var texturesStr = texturesLines.join(",\n");
    var opaqueListStr =
      opaqueList.length > 0 ? "[" + opaqueList.join(", ") + "]" : "[]";

    return (
      "(function () {\n" +
      "  const viewer = WALK.getViewer();\n" +
      "\n" +
      "  const config = {\n" +
      '    projectId: "' +
      projectFolder +
      '",\n' +
      "\n" +
      "    getImageUrl(fileName) {\n" +
      "      const version = Date.now();\n" +
      "      return `https://compagnon.atlantis-city.com/plv/image.php?project=${this.projectId}&file=${fileName}&v=${version}`;\n" +
      "    },\n" +
      "\n" +
      "    batchSize: 3,\n" +
      "    textures: {\n" +
      texturesStr +
      "\n" +
      "    },\n" +
      "    opaqueList: " +
      opaqueListStr +
      ",\n" +
      "  };\n" +
      "\n" +
      "  let isLoading = false;\n" +
      "\n" +
      "  function createReloadButton() {\n" +
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
      "      background: linear-gradient(135deg, #376ab3 0%, #2a5694 100%);\n" +
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
      '        button.style.boxShadow = "0 6px 20px rgba(55, 106, 179, 0.5)";\n' +
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
      "      if (!isLoading) {\n" +
      "        loadAllTextures();\n" +
      "      }\n" +
      "    });\n" +
      "\n" +
      "    document.body.appendChild(button);\n" +
      '    console.log("🔘 Bouton rechargement PLV créé");\n' +
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
      '      button.style.background = "linear-gradient(135deg, #28a745 0%, #1e7e34 100%)";\n' +
      "      setTimeout(() => {\n" +
      '        button.innerHTML = "🔄 Actualiser PLV";\n' +
      '        button.style.background = "linear-gradient(135deg, #376ab3 0%, #2a5694 100%)";\n' +
      '        button.style.cursor = "pointer";\n' +
      '        button.style.opacity = "1";\n' +
      "      }, 2000);\n" +
      "    } else if (success === false) {\n" +
      '      button.innerHTML = "❌ Erreur";\n' +
      '      button.style.background = "linear-gradient(135deg, #dc3545 0%, #b02a37 100%)";\n' +
      "      setTimeout(() => {\n" +
      '        button.innerHTML = "🔄 Actualiser PLV";\n' +
      '        button.style.background = "linear-gradient(135deg, #376ab3 0%, #2a5694 100%)";\n' +
      '        button.style.cursor = "pointer";\n' +
      '        button.style.opacity = "1";\n' +
      "      }, 2000);\n" +
      "    }\n" +
      "  }\n" +
      "\n" +
      "  function loadSingleTextureAsync(material, imageUrl, opaque = false) {\n" +
      "    return new Promise((resolve, reject) => {\n" +
      "      const img = new Image();\n" +
      '      img.crossOrigin = "anonymous";\n' +
      "\n" +
      "      img.onload = () => {\n" +
      "        try {\n" +
      "          const checkForAlpha = !opaque;\n" +
      "          const texture = viewer.createTextureFromHtmlImage(img, checkForAlpha);\n" +
      "          if (texture) {\n" +
      "            material.baseColorTexture = texture;\n" +
      "            if (opaque) {\n" +
      "              material.baseColorFactor = [1, 1, 1, 1];\n" +
      "              material.opacity = 1;\n" +
      '              material.alphaMode = "OPAQUE";\n' +
      "            } else {\n" +
      "              material.baseColorFactor = [1, 1, 1, 0.99];\n" +
      "              material.opacity = 0.99;\n" +
      '              material.alphaMode = "BLEND";\n' +
      "            }\n" +
      "            material.alphaTest = 0;\n" +
      "            material.metallic = 0;\n" +
      "            material.roughness = 1;\n" +
      "            material.needsUpdate = true;\n" +
      "            viewer.requestFrame();\n" +
      "            resolve();\n" +
      "          } else {\n" +
      "            console.error(`❌ Texture creation failed for ${material.name}`);\n" +
      "            reject(new Error(`Texture creation failed`));\n" +
      "          }\n" +
      "        } catch (e) {\n" +
      "          console.error(`❌ Error applying texture for ${material.name}:`, e);\n" +
      "          reject(e);\n" +
      "        }\n" +
      "      };\n" +
      "\n" +
      "      img.onerror = () => {\n" +
      "        console.error(`❌ Image load failed: ${imageUrl}`);\n" +
      "        reject(new Error(`Image load failed`));\n" +
      "      };\n" +
      "      img.src = imageUrl;\n" +
      "    });\n" +
      "  }\n" +
      "\n" +
      "  async function loadAllTextures() {\n" +
      "    console.log(`🚀 Chargement textures PLV (${config.projectId})...`);\n" +
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
      "      const promises = batch.map(([materialName, fileName]) => {\n" +
      "        const material = viewer.findMaterial(materialName);\n" +
      "        if (material) {\n" +
      "          const imageUrl = config.getImageUrl(fileName);\n" +
      "          const isOpaque = config.opaqueList.includes(materialName);\n" +
      "          return loadSingleTextureAsync(material, imageUrl, isOpaque)\n" +
      "            .then(() => {\n" +
      "              loadedCount++;\n" +
      "              console.log(`✅ ${materialName} → ${fileName}`);\n" +
      "            })\n" +
      "            .catch(() => errorCount++);\n" +
      "        } else {\n" +
      "          console.warn(`⚠️ Matériau '${materialName}' introuvable`);\n" +
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
      "  }\n" +
      "\n" +
      "  // Initialisation\n" +
      "  const materialNames = Object.keys(config.textures);\n" +
      "  console.log(`🎨 Setting ${materialNames.length} materials as editable...`);\n" +
      "  console.log(`📡 Source: OVH PHP - Project ${config.projectId}`);\n" +
      "  materialNames.forEach((materialName) => {\n" +
      "    viewer.setMaterialEditable(materialName);\n" +
      "  });\n" +
      "\n" +
      "  viewer.onSceneLoadComplete(() => {\n" +
      "    createReloadButton();\n" +
      "    loadAllTextures();\n" +
      "  });\n" +
      "\n" +
      "  window.reloadPLVTextures = loadAllTextures;\n" +
      "\n" +
      '  console.log("🚀 Module AutoTextures PLV prêt");\n' +
      '  console.log("💡 Utilisez window.reloadPLVTextures() ou le bouton pour recharger");\n' +
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
    savePLVProject: savePLVProject,
    viewPLVCode: viewPLVCode,
    copyPLVCode: copyPLVCode,
    deletePLVProject: deletePLVProject,
  });

  console.log("✅ CRM Textures/PLV loaded");
})();
