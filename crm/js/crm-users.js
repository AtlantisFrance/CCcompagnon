/**
 * ============================================
 * 👥 CRM MODULE - USERS
 * Gestion des utilisateurs
 * ============================================
 */

(function () {
  "use strict";

  const CRM = window.CRM;
  const { CONFIG, state, apiCall, formatDate, getStatusBadge, getRoleBadge } =
    CRM;

  // === SVG ICONS ===
  const ICONS = {
    profile: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>`,
    role: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>`,
    view: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>`,
    trash: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>`,
    more: `<svg viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="5" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="12" cy="19" r="2"/></svg>`,
  };

  // === SORTING HELPERS ===
  function getSortIcon(column) {
    if (state.userSort.column !== column) {
      return '<span class="sort-icon">⇅</span>';
    }
    return state.userSort.direction === "asc"
      ? '<span class="sort-icon active">▲</span>'
      : '<span class="sort-icon active">▼</span>';
  }

  function sortUsersData(users) {
    const { column, direction } = state.userSort;

    return [...users].sort((a, b) => {
      let valA, valB;

      switch (column) {
        case "name":
          valA = `${a.last_name || ""} ${a.first_name || ""}`
            .toLowerCase()
            .trim();
          valB = `${b.last_name || ""} ${b.first_name || ""}`
            .toLowerCase()
            .trim();
          break;
        case "email":
          valA = (a.email || "").toLowerCase();
          valB = (b.email || "").toLowerCase();
          break;
        case "company":
          valA = (a.company || "").toLowerCase();
          valB = (b.company || "").toLowerCase();
          break;
        default:
          valA = a[column] || "";
          valB = b[column] || "";
      }

      if (valA < valB) return direction === "asc" ? -1 : 1;
      if (valA > valB) return direction === "asc" ? 1 : -1;
      return 0;
    });
  }

  function sortUsers(column) {
    if (state.userSort.column === column) {
      state.userSort.direction =
        state.userSort.direction === "asc" ? "desc" : "asc";
    } else {
      state.userSort.column = column;
      state.userSort.direction = "asc";
    }

    renderUsersTable();
  }

  // === RENDER USERS TABLE ===
  function renderUsersTable() {
    const users = state.data.users || [];
    const sortedUsers = sortUsersData(users);
    const stats = state.data.userStats || {
      total: 0,
      active: 0,
      pending: 0,
      suspended: 0,
    };

    const el = document.querySelector("#section-users .crm-section-content");
    if (!el) return;

    el.innerHTML = `
            <div class="crm-card">
                <div class="crm-card-header">
                    <h3 class="crm-card-title">👥 Liste des utilisateurs (${
                      stats.total
                    })</h3>
                    <div style="display: flex; gap: 10px;">
                        <span class="crm-badge crm-badge-success">${
                          stats.active
                        } actifs</span>
                        <span class="crm-badge crm-badge-danger">${
                          stats.suspended
                        } suspendus</span>
                    </div>
                </div>
                <div class="crm-table-wrapper">
                    <table class="crm-table">
                        <thead>
                            <tr>
                                <th class="sortable" onclick="window.CRM.sortUsers('name')" style="cursor:pointer;">
                                    Utilisateur ${getSortIcon("name")}
                                </th>
                                <th class="sortable" onclick="window.CRM.sortUsers('email')" style="cursor:pointer;">
                                    Email ${getSortIcon("email")}
                                </th>
                                <th class="sortable" onclick="window.CRM.sortUsers('company')" style="cursor:pointer;">
                                    Entreprise ${getSortIcon("company")}
                                </th>
                                <th>Rôle</th>
                                <th>Statut</th>
                                <th>Connexions</th>
                                <th style="width: 60px;">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${sortedUsers
                              .map((user) => renderUserRow(user))
                              .join("")}
                        </tbody>
                    </table>
                </div>
            </div>
        `;
  }

  // === RENDER SINGLE USER ROW ===
  function renderUserRow(user) {
    const userName = `${user.first_name || ""} ${user.last_name || ""}`.trim();
    const userNameEscaped = userName.replace(/'/g, "\\'");

    return `
            <tr>
                <td>
                    <div style="display: flex; align-items: center; gap: 10px;">
                        <div class="crm-user-avatar" style="width:32px;height:32px;font-size:12px;">
                            ${
                              (user.first_name?.[0] || "") +
                              (user.last_name?.[0] || "")
                            }
                        </div>
                        ${userName}
                    </div>
                </td>
                <td>${user.email}</td>
                <td>${user.company || "-"}</td>
                <td>
                    <span class="crm-badge ${
                      user.global_role === "super_admin"
                        ? "crm-badge-purple"
                        : "crm-badge-info"
                    }">
                        ${user.global_role}
                    </span>
                </td>
                <td>
                    <span class="crm-badge ${getStatusBadge(user.status)}">
                        ${user.status}
                    </span>
                </td>
                <td>${user.login_count || 0}</td>
                <td>
                    <div class="user-actions-wrapper">
                        <button class="user-actions-trigger" onclick="window.CRM.toggleUserMenu(${
                          user.id
                        }, event)" title="Actions">
                            ${ICONS.more}
                        </button>
                        <div class="user-dropdown" id="user-menu-${user.id}">
                            <div class="user-dropdown-content">
                                <button class="user-dropdown-item" onclick="window.CRM.editUserProfile(${
                                  user.id
                                })">
                                    <span class="user-dropdown-icon">${
                                      ICONS.profile
                                    }</span>
                                    <span class="user-dropdown-label">Voir le profil</span>
                                </button>
                                <button class="user-dropdown-item" onclick="window.CRM.assignRoleToUser(${
                                  user.id
                                }, '${userNameEscaped}')">
                                    <span class="user-dropdown-icon">${
                                      ICONS.role
                                    }</span>
                                    <span class="user-dropdown-label">Attribuer un rôle</span>
                                </button>
                                <button class="user-dropdown-item" onclick="window.CRM.viewUserRoles(${
                                  user.id
                                }, '${userNameEscaped}')">
                                    <span class="user-dropdown-icon">${
                                      ICONS.view
                                    }</span>
                                    <span class="user-dropdown-label">Voir les rôles</span>
                                </button>
                                <div class="user-dropdown-divider"></div>
                                <button class="user-dropdown-item user-dropdown-danger" onclick="window.CRM.deleteUser(${
                                  user.id
                                })">
                                    <span class="user-dropdown-icon">${
                                      ICONS.trash
                                    }</span>
                                    <span class="user-dropdown-label">Supprimer</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </td>
            </tr>
        `;
  }

  // === TOGGLE USER MENU ===
  function toggleUserMenu(userId, event) {
    event.stopPropagation();

    const menuId = `user-menu-${userId}`;
    const menu = document.getElementById(menuId);
    const trigger = event.currentTarget;
    const isCurrentlyOpen = menu && menu.classList.contains("open");

    // Fermer tous les menus
    CRM.closeAllMenus();

    // Si le menu n'était pas ouvert, l'ouvrir
    if (!isCurrentlyOpen && menu) {
      // Calculer la position du bouton trigger
      const rect = trigger.getBoundingClientRect();

      // Positionner le dropdown sous le bouton, aligné à droite
      menu.style.top = rect.bottom + 8 + "px";
      menu.style.right = window.innerWidth - rect.right + "px";

      menu.classList.add("open");
      state.openMenuId = menuId;

      // Fermer au clic ailleurs
      setTimeout(() => {
        document.addEventListener("click", handleOutsideClick);
      }, 10);
    }
  }

  function handleOutsideClick(e) {
    const openMenu = document.querySelector(".user-dropdown.open");
    if (
      openMenu &&
      !openMenu.contains(e.target) &&
      !e.target.closest(".user-actions-trigger")
    ) {
      CRM.closeAllMenus();
    }
  }

  function closeAllMenus() {
    document.querySelectorAll(".user-dropdown.open").forEach((menu) => {
      menu.classList.remove("open");
      // Reset position
      menu.style.top = "";
      menu.style.right = "";
    });
    // Retirer la classe des tr
    document.querySelectorAll("tr.dropdown-open").forEach((row) => {
      row.classList.remove("dropdown-open");
    });
    state.openMenuId = null;
    document.removeEventListener("click", handleOutsideClick);
  }

  // === LOAD USERS ===
  async function loadUsers() {
    const result = await apiCall("/admin/users.php");
    state.data.users = result.users || [];
    state.data.userStats = result.stats || {
      total: 0,
      active: 0,
      pending: 0,
      suspended: 0,
    };
    renderUsersTable();
  }

  // === EDIT USER PROFILE ===
  async function editUserProfile(userId) {
    CRM.closeAllMenus();

    const result = await apiCall(`/admin/users.php?id=${userId}`);
    const user = result.user || result;

    CRM.openModal(
      "👤 Profil utilisateur",
      `
            <form id="edit-user-form">
                <input type="hidden" name="id" value="${user.id}">
                
                <div style="display: flex; align-items: center; gap: 20px; margin-bottom: 24px; padding-bottom: 20px; border-bottom: 1px solid var(--border-color);">
                    <div class="crm-user-avatar" style="width:64px;height:64px;font-size:24px;">
                        ${
                          (user.first_name?.[0] || "") +
                          (user.last_name?.[0] || "")
                        }
                    </div>
                    <div>
                        <h3 style="margin:0; font-size:18px;">${
                          user.first_name
                        } ${user.last_name}</h3>
                        <p style="margin:4px 0 0; color:var(--text-muted);">${
                          user.email
                        }</p>
                    </div>
                </div>

                <div class="crm-form-row">
                    <div class="crm-form-group">
                        <label class="crm-form-label">Prénom</label>
                        <input type="text" class="crm-form-input" name="first_name" value="${
                          user.first_name || ""
                        }">
                    </div>
                    <div class="crm-form-group">
                        <label class="crm-form-label">Nom</label>
                        <input type="text" class="crm-form-input" name="last_name" value="${
                          user.last_name || ""
                        }">
                    </div>
                </div>
                <div class="crm-form-group">
                    <label class="crm-form-label">Entreprise</label>
                    <input type="text" class="crm-form-input" name="company" value="${
                      user.company || ""
                    }">
                </div>
                <div class="crm-form-row">
                    <div class="crm-form-group">
                        <label class="crm-form-label">Statut</label>
                        <select class="crm-form-select" name="status">
                            <option value="pending" ${
                              user.status === "pending" ? "selected" : ""
                            }>⏳ En attente</option>
                            <option value="active" ${
                              user.status === "active" ? "selected" : ""
                            }>✅ Actif</option>
                            <option value="suspended" ${
                              user.status === "suspended" ? "selected" : ""
                            }>🚫 Suspendu</option>
                        </select>
                    </div>
                    <div class="crm-form-group">
                        <label class="crm-form-label">Rôle global</label>
                        <select class="crm-form-select" name="global_role">
                            <option value="user" ${
                              user.global_role === "user" ? "selected" : ""
                            }>Utilisateur</option>
                            <option value="super_admin" ${
                              user.global_role === "super_admin"
                                ? "selected"
                                : ""
                            }>Super Admin</option>
                        </select>
                    </div>
                </div>
                <div class="crm-form-group">
                    <label class="crm-form-label">Notes admin</label>
                    <textarea class="crm-form-textarea" name="admin_notes" placeholder="Notes internes...">${
                      user.admin_notes || ""
                    }</textarea>
                </div>
            </form>
        `,
      `
            <button class="crm-btn crm-btn-secondary" onclick="window.CRM.closeModal()">Annuler</button>
            <button class="crm-btn crm-btn-primary" onclick="window.CRM.saveUserProfile()">Enregistrer</button>
        `
    );
  }

  async function saveUserProfile() {
    const form = document.getElementById("edit-user-form");
    const formData = new FormData(form);
    const data = Object.fromEntries(formData);

    try {
      await apiCall("/admin/users.php", "PUT", data);
      CRM.showToast("Profil mis à jour", "success");
      CRM.closeModal();
      loadUsers();
    } catch (error) {
      CRM.showToast(error.message, "error");
    }
  }

  // === ASSIGN ROLE TO USER ===
  async function assignRoleToUser(userId, userName) {
    CRM.closeAllMenus();

    // Charger la liste des espaces
    const spacesResult = await apiCall("/admin/spaces.php");
    const spaces = spacesResult.spaces || [];

    CRM.openModal(
      `🎭 Attribuer un rôle à ${userName}`,
      `
            <form id="assign-role-form">
                <input type="hidden" name="user_id" value="${userId}">
                
                <div class="crm-form-group">
                    <label class="crm-form-label">Espace</label>
                    <select class="crm-form-select" name="space_id" onchange="window.CRM.onSpaceChangeForRole(this.value)">
                        <option value="">Sélectionner un espace</option>
                        ${spaces
                          .map(
                            (s) => `<option value="${s.id}">${s.name}</option>`
                          )
                          .join("")}
                    </select>
                </div>
                
                <div class="crm-form-group">
                    <label class="crm-form-label">Type de rôle</label>
                    <select class="crm-form-select" name="role" onchange="window.CRM.onRoleTypeChange(this.value)">
                        <option value="">Sélectionner un rôle</option>
                        <option value="viewer">👁️ Viewer (lecture seule)</option>
                        <option value="zone_admin">📍 Zone Admin (une zone)</option>
                        <option value="space_admin">📦 Space Admin (tout l'espace)</option>
                    </select>
                </div>
                
                <div class="crm-form-group" id="zone-select-group" style="display: none;">
                    <label class="crm-form-label">Zone</label>
                    <select class="crm-form-select" name="zone_id" id="role-zone-select">
                        <option value="">Sélectionner d'abord un espace</option>
                    </select>
                </div>
            </form>
        `,
      `
            <button class="crm-btn crm-btn-secondary" onclick="window.CRM.closeModal()">Annuler</button>
            <button class="crm-btn crm-btn-primary" onclick="window.CRM.saveAssignedRole(${userId})">Attribuer</button>
        `
    );
  }

  async function onSpaceChangeForRole(spaceId) {
    const zoneSelect = document.getElementById("role-zone-select");
    if (!spaceId) {
      zoneSelect.innerHTML =
        '<option value="">Sélectionner d\'abord un espace</option>';
      return;
    }

    zoneSelect.innerHTML = '<option value="">Chargement...</option>';

    try {
      const result = await apiCall(`/admin/zones.php?space_id=${spaceId}`);
      const zones = result.zones || [];

      // Mettre en cache pour réutilisation
      state.cachedZones = zones;

      zoneSelect.innerHTML = `
                <option value="">Sélectionner une zone</option>
                ${zones
                  .map((z) => `<option value="${z.id}">${z.name}</option>`)
                  .join("")}
            `;
    } catch (error) {
      zoneSelect.innerHTML = '<option value="">Erreur de chargement</option>';
    }
  }

  function onRoleTypeChange(roleType) {
    const zoneGroup = document.getElementById("zone-select-group");
    if (zoneGroup) {
      zoneGroup.style.display = roleType === "zone_admin" ? "block" : "none";
    }
  }

  async function saveAssignedRole(userId) {
    const form = document.getElementById("assign-role-form");
    const formData = new FormData(form);
    const data = Object.fromEntries(formData);

    // Valider
    if (!data.space_id) {
      CRM.showToast("Veuillez sélectionner un espace", "error");
      return;
    }
    if (!data.role) {
      CRM.showToast("Veuillez sélectionner un rôle", "error");
      return;
    }
    if (data.role === "zone_admin" && !data.zone_id) {
      CRM.showToast(
        "Veuillez sélectionner une zone pour un Zone Admin",
        "error"
      );
      return;
    }

    // Ne pas envoyer zone_id si pas zone_admin
    if (data.role !== "zone_admin") {
      delete data.zone_id;
    }

    try {
      await apiCall("/admin/roles.php", "POST", data);
      CRM.showToast("Rôle attribué avec succès", "success");
      CRM.closeModal();
    } catch (error) {
      CRM.showToast(error.message, "error");
    }
  }

  // === VIEW USER ROLES ===
  async function viewUserRoles(userId, userName) {
    CRM.closeAllMenus();

    const result = await apiCall(`/admin/roles.php?user_id=${userId}`);
    const roles = result.roles || [];

    const rolesHtml =
      roles.length > 0
        ? `
            <table class="crm-table">
                <thead>
                    <tr>
                        <th>Espace</th>
                        <th>Zone</th>
                        <th>Rôle</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    ${roles
                      .map(
                        (role) => `
                        <tr>
                            <td><span class="crm-badge crm-badge-primary">${
                              role.space_name
                            }</span></td>
                            <td>${
                              role.zone_name
                                ? `<span class="crm-badge crm-badge-info">${role.zone_name}</span>`
                                : '<em style="color:var(--text-muted)">Tout l\'espace</em>'
                            }</td>
                            <td><span class="crm-badge ${getRoleBadge(
                              role.role
                            )}">${role.role}</span></td>
                            <td>
                                <button class="crm-btn crm-btn-sm crm-btn-danger crm-btn-icon" onclick="window.CRM.deleteRoleFromView(${
                                  role.id
                                }, ${userId}, '${userName}')" title="Supprimer">
                                    🗑️
                                </button>
                            </td>
                        </tr>
                    `
                      )
                      .join("")}
                </tbody>
            </table>
        `
        : '<div class="crm-empty"><p>Aucun rôle attribué</p></div>';

    CRM.openModal(
      `📋 Rôles de ${userName}`,
      `
            <div style="margin-bottom: 20px;">
                ${rolesHtml}
            </div>
        `,
      `
            <button class="crm-btn crm-btn-primary" onclick="window.CRM.assignRoleToUser(${userId}, '${userName}')">➕ Ajouter un rôle</button>
            <button class="crm-btn crm-btn-secondary" onclick="window.CRM.closeModal()">Fermer</button>
        `
    );
  }

  async function deleteRoleFromView(roleId, userId, userName) {
    if (!confirm("Voulez-vous vraiment supprimer ce rôle ?")) return;

    try {
      await apiCall(`/admin/roles.php?id=${roleId}`, "DELETE");
      CRM.showToast("Rôle supprimé", "success");
      // Rafraîchir la vue
      viewUserRoles(userId, userName);
    } catch (error) {
      CRM.showToast(error.message, "error");
    }
  }

  // === DELETE USER ===
  async function deleteUser(userId) {
    CRM.closeAllMenus();

    if (
      !confirm(
        "Voulez-vous vraiment supprimer cet utilisateur ? Cette action est irréversible."
      )
    )
      return;

    try {
      await apiCall(`/admin/users.php?id=${userId}`, "DELETE");
      CRM.showToast("Utilisateur supprimé", "success");
      loadUsers();
    } catch (error) {
      CRM.showToast(error.message, "error");
    }
  }

  // === EXPOSE TO WINDOW.CRM ===
  Object.assign(CRM, {
    loadUsers,
    sortUsers,
    toggleUserMenu,
    closeAllMenus,
    editUserProfile,
    saveUserProfile,
    assignRoleToUser,
    onSpaceChangeForRole,
    onRoleTypeChange,
    saveAssignedRole,
    viewUserRoles,
    deleteRoleFromView,
    deleteUser,
  });

  console.log("✅ CRM Module Users chargé");
})();
