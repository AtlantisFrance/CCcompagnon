/**
 * ============================================
 * 📦 CRM MODULE - SPACES
 * Gestion des espaces Shapespark
 * ============================================
 */

(function () {
  "use strict";

  const CRM = window.CRM;
  const { CONFIG, state, apiCall } = CRM;

  // === SORTING ===
  function getSpaceSortIcon() {
    return state.spaceSort.direction === "asc"
      ? '<span class="sort-icon active">▲</span>'
      : '<span class="sort-icon active">▼</span>';
  }

  function sortSpacesData(spaces) {
    const direction = state.spaceSort.direction;
    return [...spaces].sort((a, b) => {
      const valA = (a.name || "").toLowerCase();
      const valB = (b.name || "").toLowerCase();
      if (valA < valB) return direction === "asc" ? -1 : 1;
      if (valA > valB) return direction === "asc" ? 1 : -1;
      return 0;
    });
  }

  function sortSpaces() {
    state.spaceSort.direction =
      state.spaceSort.direction === "asc" ? "desc" : "asc";
    renderSpacesTree();
  }

  // === RENDER SPACES TREE ===
  function renderSpacesTree() {
    const spaces = state.data.spaces || [];
    const sortedSpaces = sortSpacesData(spaces);

    const el = document.querySelector("#section-spaces .crm-section-content");
    if (!el) return;

    el.innerHTML = `
            <div class="crm-card">
                <div class="crm-card-header">
                    <h3 class="crm-card-title">📦 Espaces Shapespark</h3>
                    <div style="display: flex; gap: 10px;">
                        <button class="crm-btn crm-btn-secondary crm-btn-sm" onclick="window.CRM.sortSpaces()">
                            Nom ${getSpaceSortIcon()}
                        </button>
                        <button class="crm-btn crm-btn-primary" onclick="window.CRM.createSpace()">
                            ➕ Nouvel espace
                        </button>
                    </div>
                </div>
                ${
                  sortedSpaces.length > 0
                    ? `
                <div class="crm-tree">
                    ${sortedSpaces
                      .map(
                        (space) => `
                        <div class="crm-tree-item" data-id="${space.id}">
                            <div class="crm-tree-header" onclick="window.CRM.toggleTreeItem(this.parentElement)">
                                <span class="crm-tree-toggle">▶</span>
                                <span style="font-size: 18px;">📦</span>
                                <div style="flex: 1;">
                                    <div style="font-weight: 600;">${
                                      space.name
                                    }</div>
                                    <div style="font-size: 12px; color: var(--text-muted);">
                                        ${space.slug} • ${
                          space.zone_count || 0
                        } zones • ${space.admin_count || 0} admins
                                    </div>
                                </div>
                                <span class="crm-badge ${
                                  space.is_active
                                    ? "crm-badge-success"
                                    : "crm-badge-danger"
                                }">
                                    ${space.is_active ? "Actif" : "Inactif"}
                                </span>
                                <div style="display: flex; gap: 6px;" onclick="event.stopPropagation()">
                                    <button class="crm-btn crm-btn-sm crm-btn-secondary crm-btn-icon" onclick="window.CRM.editSpace(${
                                      space.id
                                    })" title="Modifier">
                                        ✏️
                                    </button>
                                    <button class="crm-btn crm-btn-sm crm-btn-primary crm-btn-icon" onclick="window.CRM.createZone(${
                                      space.id
                                    })" title="Ajouter zone">
                                        ➕
                                    </button>
                                    <button class="crm-btn crm-btn-sm crm-btn-danger crm-btn-icon" onclick="window.CRM.deleteSpace(${
                                      space.id
                                    })" title="Supprimer">
                                        🗑️
                                    </button>
                                </div>
                            </div>
                            <div class="crm-tree-children" id="zones-${
                              space.id
                            }">
                                <div class="crm-loading"><div class="crm-spinner"></div></div>
                            </div>
                        </div>
                    `
                      )
                      .join("")}
                </div>
                `
                    : '<div class="crm-empty"><p>Aucun espace créé</p></div>'
                }
            </div>
        `;
  }

  // === LOAD SPACES ===
  async function loadSpaces() {
    const result = await apiCall("/admin/spaces.php");
    state.data.spaces = result.spaces || [];
    renderSpacesTree();
  }

  // === TOGGLE TREE ITEM ===
  async function toggleTreeItem(element) {
    element.classList.toggle("open");

    if (element.classList.contains("open")) {
      const spaceId = element.dataset.id;
      const zonesEl = document.getElementById(`zones-${spaceId}`);

      try {
        const result = await apiCall(`/admin/zones.php?space_id=${spaceId}`);
        const zones = result.zones || [];

        if (zones.length > 0) {
          zonesEl.innerHTML = zones
            .map(
              (zone) => `
                        <div class="crm-tree-child">
                            <div style="display: flex; align-items: center; gap: 10px;">
                                <span>📍</span>
                                <div>
                                    <div style="font-weight: 500;">${
                                      zone.name
                                    }</div>
                                    <div style="font-size: 12px; color: var(--text-muted);">
                                        ${zone.slug} • ${
                zone.content_count || 0
              } contenus
                                    </div>
                                </div>
                            </div>
                            <div style="display: flex; gap: 6px;">
                                <button class="crm-btn crm-btn-sm crm-btn-secondary crm-btn-icon" onclick="window.CRM.editZone(${
                                  zone.id
                                })" title="Modifier">
                                    ✏️
                                </button>
                                <button class="crm-btn crm-btn-sm crm-btn-danger crm-btn-icon" onclick="window.CRM.deleteZone(${
                                  zone.id
                                })" title="Supprimer">
                                    🗑️
                                </button>
                            </div>
                        </div>
                    `
            )
            .join("");
        } else {
          zonesEl.innerHTML =
            '<div class="crm-tree-child" style="color: var(--text-muted);">Aucune zone</div>';
        }
      } catch (error) {
        zonesEl.innerHTML =
          '<div class="crm-tree-child" style="color: var(--danger);">Erreur de chargement</div>';
      }
    }
  }

  // === CREATE SPACE ===
  function createSpace() {
    CRM.openModal(
      "➕ Nouvel espace",
      `
            <form id="create-space-form">
                <div class="crm-form-group">
                    <label class="crm-form-label">Slug (identifiant technique)</label>
                    <input type="text" class="crm-form-input" name="slug" placeholder="mon-espace" pattern="[-a-z0-9]+" required>
                    <small style="color: var(--text-muted);">Lettres minuscules, chiffres et tirets uniquement</small>
                </div>
                <div class="crm-form-group">
                    <label class="crm-form-label">Nom</label>
                    <input type="text" class="crm-form-input" name="name" placeholder="Mon Espace" required>
                </div>
                <div class="crm-form-group">
                    <label class="crm-form-label">Description</label>
                    <textarea class="crm-form-textarea" name="description" placeholder="Description de l'espace..."></textarea>
                </div>
                <div class="crm-form-group">
                    <label class="crm-form-label">URL Shapespark</label>
                    <input type="url" class="crm-form-input" name="shapespark_url" placeholder="https://...">
                </div>
            </form>
        `,
      `
            <button class="crm-btn crm-btn-secondary" onclick="window.CRM.closeModal()">Annuler</button>
            <button class="crm-btn crm-btn-primary" onclick="window.CRM.saveNewSpace()">Créer</button>
        `
    );
  }

  async function saveNewSpace() {
    const form = document.getElementById("create-space-form");
    const formData = new FormData(form);
    const data = Object.fromEntries(formData);

    try {
      await apiCall("/admin/spaces.php", "POST", data);
      CRM.showToast("Espace créé", "success");
      CRM.closeModal();
      loadSpaces();
    } catch (error) {
      CRM.showToast(error.message, "error");
    }
  }

  // === EDIT SPACE ===
  async function editSpace(spaceId) {
    try {
      const result = await apiCall(`/admin/spaces.php?id=${spaceId}`);
      const space = result.space || result;

      CRM.openModal(
        "✏️ Modifier l'espace",
        `
                <form id="edit-space-form">
                    <input type="hidden" name="id" value="${space.id}">
                    <div class="crm-form-group">
                        <label class="crm-form-label">Slug</label>
                        <input type="text" class="crm-form-input" value="${
                          space.slug
                        }" disabled>
                        <small style="color: var(--text-muted);">Le slug ne peut pas être modifié</small>
                    </div>
                    <div class="crm-form-group">
                        <label class="crm-form-label">Nom</label>
                        <input type="text" class="crm-form-input" name="name" value="${
                          space.name
                        }" required>
                    </div>
                    <div class="crm-form-group">
                        <label class="crm-form-label">Description</label>
                        <textarea class="crm-form-textarea" name="description">${
                          space.description || ""
                        }</textarea>
                    </div>
                    <div class="crm-form-group">
                        <label class="crm-form-label">URL Shapespark</label>
                        <input type="url" class="crm-form-input" name="shapespark_url" value="${
                          space.shapespark_url || ""
                        }">
                    </div>
                    <div class="crm-form-group">
                        <label class="crm-form-label">
                            <input type="checkbox" name="is_active" ${
                              space.is_active ? "checked" : ""
                            }>
                            Espace actif
                        </label>
                    </div>
                </form>
            `,
        `
                <button class="crm-btn crm-btn-secondary" onclick="window.CRM.closeModal()">Annuler</button>
                <button class="crm-btn crm-btn-primary" onclick="window.CRM.saveSpace()">Enregistrer</button>
            `
      );
    } catch (error) {
      CRM.showToast("Erreur: " + error.message, "error");
    }
  }

  async function saveSpace() {
    const form = document.getElementById("edit-space-form");
    const formData = new FormData(form);
    const data = Object.fromEntries(formData);
    data.is_active = form.querySelector('[name="is_active"]').checked;

    try {
      await apiCall("/admin/spaces.php", "PUT", data);
      CRM.showToast("Espace mis à jour", "success");
      CRM.closeModal();
      loadSpaces();
    } catch (error) {
      CRM.showToast(error.message, "error");
    }
  }

  // === DELETE SPACE ===
  async function deleteSpace(spaceId) {
    if (
      !confirm(
        "Voulez-vous vraiment supprimer cet espace ? Toutes les zones et contenus associés seront supprimés."
      )
    )
      return;

    try {
      await apiCall(`/admin/spaces.php?id=${spaceId}`, "DELETE");
      CRM.showToast("Espace supprimé", "success");
      loadSpaces();
    } catch (error) {
      CRM.showToast(error.message, "error");
    }
  }

  // === EXPOSE TO WINDOW.CRM ===
  Object.assign(CRM, {
    loadSpaces,
    sortSpaces,
    toggleTreeItem,
    createSpace,
    saveNewSpace,
    editSpace,
    saveSpace,
    deleteSpace,
  });

  console.log("✅ CRM Module Spaces chargé");
})();
