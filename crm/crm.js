/**
 * ============================================
 * 🎛️ CRM ATLANTIS CITY
 * Application de gestion complète
 * ============================================
 */

(function () {
  "use strict";

  // === CONFIGURATION ===
  const CONFIG = {
    API_BASE: "https://compagnon.atlantis-city.com/api",
    TOKEN_KEY: "atlantis_auth_token",
    USER_KEY: "atlantis_auth_user",
  };

  // === STATE ===
  let state = {
    user: null,
    token: null,
    currentSection: "dashboard",
    initialized: false,
    data: {
      dashboard: null,
      users: [],
      spaces: [],
      zones: [],
      logs: [],
    },
  };

  // === HELPERS ===
  function getToken() {
    return localStorage.getItem(CONFIG.TOKEN_KEY);
  }

  function getUser() {
    const user = localStorage.getItem(CONFIG.USER_KEY);
    try {
      return user ? JSON.parse(user) : null;
    } catch (e) {
      return null;
    }
  }

  function setAuth(token, user) {
    localStorage.setItem(CONFIG.TOKEN_KEY, token);
    localStorage.setItem(CONFIG.USER_KEY, JSON.stringify(user));
    state.token = token;
    state.user = user;
  }

  function clearAuth() {
    localStorage.removeItem(CONFIG.TOKEN_KEY);
    localStorage.removeItem(CONFIG.USER_KEY);
    state.token = null;
    state.user = null;
  }

  // === API CALLS ===
  async function apiCall(endpoint, method = "GET", data = null) {
    const token = getToken();

    const options = {
      method,
      headers: {
        "Content-Type": "application/json",
        Authorization: token ? `Bearer ${token}` : "",
      },
    };

    if (data && method !== "GET") {
      options.body = JSON.stringify(data);
    }

    try {
      const response = await fetch(`${CONFIG.API_BASE}${endpoint}`, options);
      const result = await response.json();

      if (response.status === 401) {
        clearAuth();
        document.body.classList.remove("logged-in");
        document.body.classList.add("not-logged-in");
        throw new Error("Session expirée. Veuillez vous reconnecter.");
      }

      if (!response.ok) {
        throw new Error(result.error || "Erreur serveur");
      }

      return result.data || result;
    } catch (error) {
      console.error("API Error:", error);
      throw error;
    }
  }

  // === TOAST NOTIFICATIONS ===
  function showToast(message, type = "info") {
    let container = document.querySelector(".crm-toast-container");
    if (!container) {
      container = document.createElement("div");
      container.className = "crm-toast-container";
      document.body.appendChild(container);
    }

    const icons = { success: "✅", error: "❌", warning: "⚠️", info: "ℹ️" };

    const toast = document.createElement("div");
    toast.className = `crm-toast ${type}`;
    toast.innerHTML = `
            <span style="font-size: 20px;">${icons[type]}</span>
            <span>${message}</span>
        `;
    container.appendChild(toast);

    setTimeout(() => {
      toast.style.animation = "slideIn 0.3s ease reverse";
      setTimeout(() => toast.remove(), 300);
    }, 4000);
  }

  // === MODAL ===
  function openModal(title, content, footer = "") {
    closeModal();

    const modal = document.createElement("div");
    modal.className = "crm-modal-overlay";
    modal.innerHTML = `
            <div class="crm-modal">
                <div class="crm-modal-header">
                    <h3 class="crm-modal-title">${title}</h3>
                    <button class="crm-modal-close" onclick="window.CRM.closeModal()">&times;</button>
                </div>
                <div class="crm-modal-body">${content}</div>
                ${footer ? `<div class="crm-modal-footer">${footer}</div>` : ""}
            </div>
        `;

    document.body.appendChild(modal);
    modal.addEventListener("click", (e) => {
      if (e.target === modal) closeModal();
    });
    requestAnimationFrame(() => modal.classList.add("active"));
  }

  function closeModal() {
    const modal = document.querySelector(".crm-modal-overlay");
    if (modal) {
      modal.classList.remove("active");
      setTimeout(() => modal.remove(), 300);
    }
  }

  // === NAVIGATION ===
  function navigateTo(section) {
    state.currentSection = section;

    document.querySelectorAll(".crm-nav-item").forEach((item) => {
      item.classList.toggle("active", item.dataset.section === section);
    });

    document.querySelectorAll(".crm-section").forEach((sec) => {
      sec.classList.toggle("active", sec.id === `section-${section}`);
    });

    const titles = {
      dashboard: { icon: "📊", text: "Dashboard" },
      users: { icon: "👥", text: "Utilisateurs" },
      spaces: { icon: "📦", text: "Espaces" },
      logs: { icon: "📝", text: "Journal d'activité" },
    };

    const title = titles[section] || { icon: "📋", text: section };
    document.querySelector(".crm-page-title").innerHTML = `
            <span class="icon">${title.icon}</span>
            <h2>${title.text}</h2>
        `;

    loadSectionData(section);
  }

  async function loadSectionData(section) {
    const contentEl = document.querySelector(
      `#section-${section} .crm-section-content`
    );
    if (contentEl) {
      contentEl.innerHTML =
        '<div class="crm-loading"><div class="crm-spinner"></div></div>';
    }

    try {
      switch (section) {
        case "dashboard":
          await loadDashboard();
          break;
        case "users":
          await loadUsers();
          break;
        case "spaces":
          await loadSpaces();
          break;
        case "logs":
          await loadLogs();
          break;
      }
    } catch (error) {
      showToast(error.message, "error");
      if (contentEl) {
        contentEl.innerHTML = `
                    <div class="crm-empty">
                        <div class="crm-empty-icon">❌</div>
                        <h3>Erreur de chargement</h3>
                        <p>${error.message}</p>
                    </div>
                `;
      }
    }
  }

  // === DASHBOARD ===
  async function loadDashboard() {
    const result = await apiCall("/admin/dashboard.php");
    state.data.dashboard = result;

    const el = document.querySelector(
      "#section-dashboard .crm-section-content"
    );
    el.innerHTML = `
            <div class="crm-stats-grid">
                <div class="crm-stat-card">
                    <div class="crm-stat-icon blue">👥</div>
                    <div class="crm-stat-content">
                        <h3>${result.users?.total || 0}</h3>
                        <p>Utilisateurs</p>
                    </div>
                </div>
                <div class="crm-stat-card">
                    <div class="crm-stat-icon green">✅</div>
                    <div class="crm-stat-content">
                        <h3>${result.users?.active || 0}</h3>
                        <p>Actifs</p>
                    </div>
                </div>
                <div class="crm-stat-card">
                    <div class="crm-stat-icon orange">⏳</div>
                    <div class="crm-stat-content">
                        <h3>${result.users?.pending || 0}</h3>
                        <p>En attente</p>
                    </div>
                </div>
                <div class="crm-stat-card">
                    <div class="crm-stat-icon purple">📦</div>
                    <div class="crm-stat-content">
                        <h3>${result.spaces?.total || 0}</h3>
                        <p>Espaces</p>
                    </div>
                </div>
                <div class="crm-stat-card">
                    <div class="crm-stat-icon cyan">📍</div>
                    <div class="crm-stat-content">
                        <h3>${result.zones?.total || 0}</h3>
                        <p>Zones</p>
                    </div>
                </div>
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 24px;">
                <div class="crm-card">
                    <div class="crm-card-header">
                        <h3 class="crm-card-title">⏳ Utilisateurs en attente</h3>
                    </div>
                    ${
                      result.pending_users && result.pending_users.length > 0
                        ? `
                        <div class="crm-table-wrapper">
                            <table class="crm-table">
                                <thead><tr><th>Nom</th><th>Email</th><th>Actions</th></tr></thead>
                                <tbody>
                                    ${result.pending_users
                                      .map(
                                        (user) => `
                                        <tr>
                                            <td>${user.first_name} ${user.last_name}</td>
                                            <td>${user.email}</td>
                                            <td>
                                                <button class="crm-btn crm-btn-sm crm-btn-primary" onclick="window.CRM.activateUser(${user.id})">Activer</button>
                                            </td>
                                        </tr>
                                    `
                                      )
                                      .join("")}
                                </tbody>
                            </table>
                        </div>
                    `
                        : '<div class="crm-empty"><p>Aucun utilisateur en attente</p></div>'
                    }
                </div>

                <div class="crm-card">
                    <div class="crm-card-header">
                        <h3 class="crm-card-title">📝 Activité récente</h3>
                    </div>
                    ${
                      result.recent_activity &&
                      result.recent_activity.length > 0
                        ? `
                        <div>
                            ${result.recent_activity
                              .slice(0, 5)
                              .map(
                                (log) => `
                                <div class="crm-activity-item">
                                    <div class="crm-activity-icon ${getActivityColor(
                                      log.action
                                    )}">
                                        ${getActivityIcon(log.action)}
                                    </div>
                                    <div class="crm-activity-content">
                                        <div class="crm-activity-text">
                                            <strong>${
                                              log.first_name || "Système"
                                            }</strong> ${getActivityText(
                                  log.action
                                )}
                                        </div>
                                        <div class="crm-activity-time">${formatDate(
                                          log.created_at
                                        )}</div>
                                    </div>
                                </div>
                            `
                              )
                              .join("")}
                        </div>
                    `
                        : '<div class="crm-empty"><p>Aucune activité récente</p></div>'
                    }
                </div>
            </div>
        `;
  }

  // === USERS ===
  async function loadUsers() {
    const result = await apiCall("/admin/users.php");
    state.data.users = result.users || [];
    const stats = result.stats || {
      total: 0,
      active: 0,
      pending: 0,
      suspended: 0,
    };

    const el = document.querySelector("#section-users .crm-section-content");
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
                        <span class="crm-badge crm-badge-warning">${
                          stats.pending
                        } en attente</span>
                    </div>
                </div>
                <div class="crm-table-wrapper">
                    <table class="crm-table">
                        <thead>
                            <tr>
                                <th>Utilisateur</th>
                                <th>Email</th>
                                <th>Entreprise</th>
                                <th>Rôle Global</th>
                                <th>Statut</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${state.data.users
                              .map(
                                (user) => `
                                <tr>
                                    <td>
                                        <div style="display: flex; align-items: center; gap: 10px;">
                                            <div class="crm-user-avatar" style="width:32px;height:32px;font-size:12px;">
                                                ${
                                                  (user.first_name?.[0] || "") +
                                                  (user.last_name?.[0] || "")
                                                }
                                            </div>
                                            ${user.first_name} ${user.last_name}
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
                                        <span class="crm-badge ${getStatusBadge(
                                          user.status
                                        )}">${user.status}</span>
                                    </td>
                                    <td>
                                        <div style="display: flex; gap: 6px;">
                                            <button class="crm-btn crm-btn-sm crm-btn-secondary crm-btn-icon" onclick="window.CRM.editUser(${
                                              user.id
                                            })" title="Modifier & Rôles">
                                                ✏️
                                            </button>
                                            ${
                                              user.status === "pending"
                                                ? `
                                                <button class="crm-btn crm-btn-sm crm-btn-primary crm-btn-icon" onclick="window.CRM.activateUser(${user.id})" title="Activer">✅</button>
                                            `
                                                : ""
                                            }
                                            ${
                                              user.status === "active"
                                                ? `
                                                <button class="crm-btn crm-btn-sm crm-btn-warning crm-btn-icon" onclick="window.CRM.suspendUser(${user.id})" title="Suspendre">🚫</button>
                                            `
                                                : ""
                                            }
                                            <button class="crm-btn crm-btn-sm crm-btn-danger crm-btn-icon" onclick="window.CRM.deleteUser(${
                                              user.id
                                            })" title="Supprimer">🗑️</button>
                                        </div>
                                    </td>
                                </tr>
                            `
                              )
                              .join("")}
                        </tbody>
                    </table>
                </div>
            </div>
        `;
  }

  async function editUser(userId) {
    // Charger user, ses rôles, et les espaces/zones disponibles
    const [userRes, rolesRes, spacesRes] = await Promise.all([
      apiCall(`/admin/users.php?id=${userId}`),
      apiCall(`/admin/roles.php?user_id=${userId}`),
      apiCall("/admin/spaces.php"),
    ]);

    const user = userRes.user || userRes;
    const userRoles = rolesRes.roles || [];
    const spaces = spacesRes.spaces || [];

    // Charger toutes les zones
    const zonesRes = await apiCall("/admin/zones.php");
    const allZones = zonesRes.zones || [];

    openModal(
      "✏️ Modifier l'utilisateur",
      `
            <form id="edit-user-form">
                <input type="hidden" name="id" value="${user.id}">
                
                <!-- Infos de base -->
                <div style="background: var(--bg-tertiary); padding: 16px; border-radius: 10px; margin-bottom: 20px;">
                    <h4 style="margin-bottom: 12px; color: var(--text-secondary);">📋 Informations</h4>
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
                                }>En attente</option>
                                <option value="active" ${
                                  user.status === "active" ? "selected" : ""
                                }>Actif</option>
                                <option value="suspended" ${
                                  user.status === "suspended" ? "selected" : ""
                                }>Suspendu</option>
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
                </div>

                <!-- Rôles par espace/zone -->
                <div style="background: var(--bg-tertiary); padding: 16px; border-radius: 10px; margin-bottom: 20px;">
                    <h4 style="margin-bottom: 12px; color: var(--text-secondary);">🎭 Rôles par Espace/Zone</h4>
                    
                    <!-- Liste des rôles existants -->
                    <div id="user-roles-list" style="margin-bottom: 16px;">
                        ${
                          userRoles.length > 0
                            ? userRoles
                                .map(
                                  (role) => `
                            <div class="user-role-item" style="display: flex; align-items: center; gap: 10px; padding: 10px; background: var(--bg-secondary); border-radius: 8px; margin-bottom: 8px;">
                                <span class="crm-badge crm-badge-primary">${
                                  role.space_name
                                }</span>
                                ${
                                  role.zone_name
                                    ? `<span class="crm-badge crm-badge-info">${role.zone_name}</span>`
                                    : '<span style="color: var(--text-muted);">Tout l\'espace</span>'
                                }
                                <span class="crm-badge ${getRoleBadge(
                                  role.role
                                )}">${role.role}</span>
                                <button type="button" class="crm-btn crm-btn-sm crm-btn-danger crm-btn-icon" onclick="window.CRM.removeUserRole(${
                                  role.id
                                }, this)" style="margin-left: auto;">✖</button>
                            </div>
                        `
                                )
                                .join("")
                            : '<p style="color: var(--text-muted); font-size: 13px;">Aucun rôle assigné</p>'
                        }
                    </div>
                    
                    <!-- Ajouter un nouveau rôle -->
                    <div style="border-top: 1px solid var(--border-color); padding-top: 16px;">
                        <h5 style="margin-bottom: 10px; font-size: 13px; color: var(--text-muted);">➕ Ajouter un rôle</h5>
                        <div class="crm-form-row" style="gap: 10px;">
                            <div class="crm-form-group" style="margin-bottom: 0;">
                                <select class="crm-form-select" id="new-role-space" onchange="window.CRM.loadZonesForSpace(this.value)">
                                    <option value="">Espace...</option>
                                    ${spaces
                                      .map(
                                        (s) =>
                                          `<option value="${s.id}">${s.name}</option>`
                                      )
                                      .join("")}
                                </select>
                            </div>
                            <div class="crm-form-group" style="margin-bottom: 0;">
                                <select class="crm-form-select" id="new-role-zone">
                                    <option value="">Tout l'espace</option>
                                </select>
                            </div>
                            <div class="crm-form-group" style="margin-bottom: 0;">
                                <select class="crm-form-select" id="new-role-type">
                                    <option value="viewer">Viewer</option>
                                    <option value="zone_admin">Zone Admin</option>
                                    <option value="space_admin">Space Admin</option>
                                </select>
                            </div>
                            <button type="button" class="crm-btn crm-btn-primary crm-btn-sm" onclick="window.CRM.addUserRole(${
                              user.id
                            })">
                                ➕
                            </button>
                        </div>
                    </div>
                </div>

                <!-- Notes admin -->
                <div class="crm-form-group">
                    <label class="crm-form-label">Notes admin</label>
                    <textarea class="crm-form-textarea" name="admin_notes" style="min-height: 60px;">${
                      user.admin_notes || ""
                    }</textarea>
                </div>
            </form>
        `,
      `
            <button class="crm-btn crm-btn-secondary" onclick="window.CRM.closeModal()">Fermer</button>
            <button class="crm-btn crm-btn-primary" onclick="window.CRM.saveUser()">Enregistrer</button>
        `
    );

    // Stocker les zones pour les charger dynamiquement
    window._allZones = allZones;
  }

  function loadZonesForSpace(spaceId) {
    const select = document.getElementById("new-role-zone");
    if (!spaceId) {
      select.innerHTML = '<option value="">Tout l\'espace</option>';
      return;
    }

    const zones = window._allZones.filter((z) => z.space_id == spaceId);
    select.innerHTML = `
            <option value="">Tout l'espace</option>
            ${zones
              .map((z) => `<option value="${z.id}">${z.name}</option>`)
              .join("")}
        `;
  }

  async function addUserRole(userId) {
    const spaceId = document.getElementById("new-role-space").value;
    const zoneId = document.getElementById("new-role-zone").value;
    const role = document.getElementById("new-role-type").value;

    if (!spaceId) {
      showToast("Sélectionnez un espace", "warning");
      return;
    }

    try {
      const data = { user_id: userId, space_id: spaceId, role };
      if (zoneId) data.zone_id = zoneId;

      await apiCall("/admin/roles.php", "POST", data);
      showToast("Rôle ajouté", "success");

      // Recharger le modal
      closeModal();
      editUser(userId);
    } catch (error) {
      showToast(error.message, "error");
    }
  }

  async function removeUserRole(roleId, btn) {
    try {
      await apiCall(`/admin/roles.php?id=${roleId}`, "DELETE");
      btn.closest(".user-role-item").remove();
      showToast("Rôle supprimé", "success");
    } catch (error) {
      showToast(error.message, "error");
    }
  }

  async function saveUser() {
    const form = document.getElementById("edit-user-form");
    const formData = new FormData(form);
    const data = Object.fromEntries(formData);

    try {
      await apiCall("/admin/users.php", "PUT", data);
      showToast("Utilisateur mis à jour", "success");
      closeModal();
      loadUsers();
    } catch (error) {
      showToast(error.message, "error");
    }
  }

  async function activateUser(userId) {
    try {
      await apiCall("/admin/users.php", "PUT", {
        id: userId,
        status: "active",
      });
      showToast("Utilisateur activé", "success");
      loadSectionData(state.currentSection);
    } catch (error) {
      showToast(error.message, "error");
    }
  }

  async function suspendUser(userId) {
    if (!confirm("Voulez-vous vraiment suspendre cet utilisateur ?")) return;

    try {
      await apiCall("/admin/users.php", "PUT", {
        id: userId,
        status: "suspended",
      });
      showToast("Utilisateur suspendu", "success");
      loadUsers();
    } catch (error) {
      showToast(error.message, "error");
    }
  }

  async function deleteUser(userId) {
    if (
      !confirm(
        "⚠️ Voulez-vous vraiment SUPPRIMER cet utilisateur ?\n\nCette action est irréversible !"
      )
    )
      return;

    try {
      await apiCall(`/admin/users.php?id=${userId}`, "DELETE");
      showToast("Utilisateur supprimé", "success");
      loadUsers();
    } catch (error) {
      showToast(error.message, "error");
    }
  }

  // === SPACES ===
  async function loadSpaces() {
    const result = await apiCall("/admin/spaces.php");
    state.data.spaces = result.spaces || [];

    const el = document.querySelector("#section-spaces .crm-section-content");
    el.innerHTML = `
            <div class="crm-card">
                <div class="crm-card-header">
                    <h3 class="crm-card-title">📦 Espaces Shapespark</h3>
                    <button class="crm-btn crm-btn-primary" onclick="window.CRM.createSpace()">
                        ➕ Nouvel espace
                    </button>
                </div>
                ${
                  state.data.spaces.length > 0
                    ? `
                <div class="crm-tree">
                    ${state.data.spaces
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
                        } zones
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
                                    })" title="Modifier">✏️</button>
                                    <button class="crm-btn crm-btn-sm crm-btn-primary crm-btn-icon" onclick="window.CRM.createZone(${
                                      space.id
                                    })" title="Ajouter zone">➕</button>
                                    <button class="crm-btn crm-btn-sm crm-btn-danger crm-btn-icon" onclick="window.CRM.deleteSpace(${
                                      space.id
                                    })" title="Supprimer">🗑️</button>
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
                                    <div style="font-weight: 500;">${zone.name}</div>
                                    <div style="font-size: 12px; color: var(--text-muted);">${zone.slug}</div>
                                </div>
                            </div>
                            <div style="display: flex; gap: 6px;">
                                <button class="crm-btn crm-btn-sm crm-btn-secondary crm-btn-icon" onclick="window.CRM.editZone(${zone.id})" title="Modifier">✏️</button>
                                <button class="crm-btn crm-btn-sm crm-btn-danger crm-btn-icon" onclick="window.CRM.deleteZone(${zone.id})" title="Supprimer">🗑️</button>
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

  function createSpace() {
    openModal(
      "➕ Nouvel espace",
      `
            <form id="create-space-form">
                <div class="crm-form-group">
                    <label class="crm-form-label">Slug (identifiant technique)</label>
                    <input type="text" class="crm-form-input" name="slug" placeholder="mon-espace" pattern="[a-z0-9-]+" required>
                    <small style="color: var(--text-muted);">Lettres minuscules, chiffres et tirets uniquement</small>
                </div>
                <div class="crm-form-group">
                    <label class="crm-form-label">Nom</label>
                    <input type="text" class="crm-form-input" name="name" placeholder="Mon Espace" required>
                </div>
                <div class="crm-form-group">
                    <label class="crm-form-label">Description</label>
                    <textarea class="crm-form-textarea" name="description" placeholder="Description..."></textarea>
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
    const data = Object.fromEntries(new FormData(form));

    try {
      await apiCall("/admin/spaces.php", "POST", data);
      showToast("Espace créé", "success");
      closeModal();
      loadSpaces();
    } catch (error) {
      showToast(error.message, "error");
    }
  }

  async function editSpace(spaceId) {
    const result = await apiCall(`/admin/spaces.php?id=${spaceId}`);
    const space = result.space || result;

    openModal(
      "✏️ Modifier l'espace",
      `
            <form id="edit-space-form">
                <input type="hidden" name="id" value="${space.id}">
                <div class="crm-form-group">
                    <label class="crm-form-label">Slug</label>
                    <input type="text" class="crm-form-input" value="${
                      space.slug
                    }" disabled>
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
  }

  async function saveSpace() {
    const form = document.getElementById("edit-space-form");
    const data = Object.fromEntries(new FormData(form));
    data.is_active = form.querySelector('[name="is_active"]').checked;

    try {
      await apiCall("/admin/spaces.php", "PUT", data);
      showToast("Espace mis à jour", "success");
      closeModal();
      loadSpaces();
    } catch (error) {
      showToast(error.message, "error");
    }
  }

  async function deleteSpace(spaceId) {
    if (!confirm("Supprimer cet espace et toutes ses zones ?")) return;

    try {
      await apiCall(`/admin/spaces.php?id=${spaceId}`, "DELETE");
      showToast("Espace supprimé", "success");
      loadSpaces();
    } catch (error) {
      showToast(error.message, "error");
    }
  }

  // === ZONES ===
  async function createZone(spaceId) {
    openModal(
      "➕ Nouvelle zone",
      `
            <form id="create-zone-form">
                <input type="hidden" name="space_id" value="${spaceId}">
                <div class="crm-form-group">
                    <label class="crm-form-label">Slug</label>
                    <input type="text" class="crm-form-input" name="slug" placeholder="ma-zone" pattern="[a-z0-9-]+" required>
                </div>
                <div class="crm-form-group">
                    <label class="crm-form-label">Nom</label>
                    <input type="text" class="crm-form-input" name="name" placeholder="Ma Zone" required>
                </div>
                <div class="crm-form-group">
                    <label class="crm-form-label">Description</label>
                    <textarea class="crm-form-textarea" name="description"></textarea>
                </div>
            </form>
        `,
      `
            <button class="crm-btn crm-btn-secondary" onclick="window.CRM.closeModal()">Annuler</button>
            <button class="crm-btn crm-btn-primary" onclick="window.CRM.saveNewZone()">Créer</button>
        `
    );
  }

  async function saveNewZone() {
    const form = document.getElementById("create-zone-form");
    const data = Object.fromEntries(new FormData(form));

    try {
      await apiCall("/admin/zones.php", "POST", data);
      showToast("Zone créée", "success");
      closeModal();
      loadSpaces();
    } catch (error) {
      showToast(error.message, "error");
    }
  }

  async function editZone(zoneId) {
    const result = await apiCall(`/admin/zones.php?id=${zoneId}`);
    const zone = result.zone || result;

    openModal(
      "✏️ Modifier la zone",
      `
            <form id="edit-zone-form">
                <input type="hidden" name="id" value="${zone.id}">
                <div class="crm-form-group">
                    <label class="crm-form-label">Slug</label>
                    <input type="text" class="crm-form-input" value="${
                      zone.slug
                    }" disabled>
                </div>
                <div class="crm-form-group">
                    <label class="crm-form-label">Nom</label>
                    <input type="text" class="crm-form-input" name="name" value="${
                      zone.name
                    }" required>
                </div>
                <div class="crm-form-group">
                    <label class="crm-form-label">Description</label>
                    <textarea class="crm-form-textarea" name="description">${
                      zone.description || ""
                    }</textarea>
                </div>
                <div class="crm-form-group">
                    <label class="crm-form-label">
                        <input type="checkbox" name="is_active" ${
                          zone.is_active ? "checked" : ""
                        }>
                        Zone active
                    </label>
                </div>
            </form>
        `,
      `
            <button class="crm-btn crm-btn-secondary" onclick="window.CRM.closeModal()">Annuler</button>
            <button class="crm-btn crm-btn-primary" onclick="window.CRM.saveZone()">Enregistrer</button>
        `
    );
  }

  async function saveZone() {
    const form = document.getElementById("edit-zone-form");
    const data = Object.fromEntries(new FormData(form));
    data.is_active = form.querySelector('[name="is_active"]').checked;

    try {
      await apiCall("/admin/zones.php", "PUT", data);
      showToast("Zone mise à jour", "success");
      closeModal();
      loadSpaces();
    } catch (error) {
      showToast(error.message, "error");
    }
  }

  async function deleteZone(zoneId) {
    if (!confirm("Supprimer cette zone ?")) return;

    try {
      await apiCall(`/admin/zones.php?id=${zoneId}`, "DELETE");
      showToast("Zone supprimée", "success");
      loadSpaces();
    } catch (error) {
      showToast(error.message, "error");
    }
  }

  // === LOGS ===
  async function loadLogs() {
    const result = await apiCall("/admin/logs.php?limit=100");
    state.data.logs = result.logs || [];

    const el = document.querySelector("#section-logs .crm-section-content");
    el.innerHTML = `
            <div class="crm-card">
                <div class="crm-card-header">
                    <h3 class="crm-card-title">📝 Journal d'activité</h3>
                </div>
                ${
                  state.data.logs.length > 0
                    ? `
                <div class="crm-table-wrapper">
                    <table class="crm-table">
                        <thead><tr><th>Date</th><th>Utilisateur</th><th>Action</th><th>Détails</th></tr></thead>
                        <tbody>
                            ${state.data.logs
                              .map(
                                (log) => `
                                <tr>
                                    <td>${formatDate(log.created_at)}</td>
                                    <td>${
                                      log.first_name
                                        ? `${log.first_name} ${log.last_name}`
                                        : "Système"
                                    }</td>
                                    <td><span class="crm-badge ${getActivityColor(
                                      log.action
                                    )}">${log.action}</span></td>
                                    <td style="max-width:300px;overflow:hidden;text-overflow:ellipsis;">
                                        ${
                                          log.details
                                            ? JSON.stringify(
                                                log.details
                                              ).substring(0, 100)
                                            : "—"
                                        }
                                    </td>
                                </tr>
                            `
                              )
                              .join("")}
                        </tbody>
                    </table>
                </div>
                `
                    : '<div class="crm-empty"><p>Aucune activité</p></div>'
                }
            </div>
        `;
  }

  // === HELPERS ===
  function formatDate(dateStr) {
    if (!dateStr) return "—";
    const date = new Date(dateStr);
    return (
      date.toLocaleDateString("fr-FR") +
      " " +
      date.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })
    );
  }

  function getStatusBadge(status) {
    return (
      {
        active: "crm-badge-success",
        pending: "crm-badge-warning",
        suspended: "crm-badge-danger",
      }[status] || "crm-badge-info"
    );
  }

  function getRoleBadge(role) {
    return (
      {
        space_admin: "crm-badge-purple",
        zone_admin: "crm-badge-info",
        viewer: "crm-badge-success",
      }[role] || "crm-badge-info"
    );
  }

  function getActivityIcon(action) {
    const icons = {
      login_success: "🔓",
      logout: "🔒",
      register: "📝",
      user_updated: "✏️",
      user_deleted: "🗑️",
      space_created: "📦",
      zone_created: "📍",
      role_assigned: "🎭",
    };
    return icons[action] || "📋";
  }

  function getActivityColor(action) {
    if (action.includes("deleted")) return "crm-badge-danger";
    if (action.includes("created")) return "crm-badge-success";
    if (action.includes("login")) return "crm-badge-info";
    return "crm-badge-primary";
  }

  function getActivityText(action) {
    const texts = {
      login_success: "s'est connecté",
      logout: "s'est déconnecté",
      register: "s'est inscrit",
      user_updated: "a modifié un utilisateur",
      user_deleted: "a supprimé un utilisateur",
      space_created: "a créé un espace",
      zone_created: "a créé une zone",
      role_assigned: "a assigné un rôle",
    };
    return texts[action] || action;
  }

  // === LOGOUT ===
  async function logout() {
    try {
      await apiCall("/auth/logout.php", "POST");
    } catch (e) {}
    clearAuth();
    state.initialized = false;
    document.body.classList.remove("logged-in");
    document.body.classList.add("not-logged-in");
    showToast("Déconnexion réussie", "success");
  }

  // === UPDATE UI ===
  function updateSidebarUser() {
    if (!state.user) return;
    const avatarEl = document.getElementById("sidebar-avatar");
    const nameEl = document.getElementById("sidebar-name");
    const roleEl = document.getElementById("sidebar-role");
    const headerInfo = document.getElementById("header-user-info");

    if (avatarEl)
      avatarEl.textContent =
        (state.user.first_name?.[0] || "") + (state.user.last_name?.[0] || "");
    if (nameEl)
      nameEl.textContent =
        `${state.user.first_name || ""} ${state.user.last_name || ""}`.trim() ||
        "Admin";
    if (roleEl)
      roleEl.textContent =
        state.user.global_role === "super_admin" ? "Super Admin" : "Admin";
    if (headerInfo) headerInfo.textContent = `Connecté: ${state.user.email}`;
  }

  // === INIT ===
  function init() {
    if (state.initialized) return;

    state.token = getToken();
    state.user = getUser();

    if (!state.token || !state.user) {
      document.body.classList.remove("logged-in", "loading");
      document.body.classList.add("not-logged-in");
      return;
    }

    if (state.user.global_role !== "super_admin") {
      clearAuth();
      document.body.classList.remove("logged-in", "loading");
      document.body.classList.add("not-logged-in");
      showToast("Accès refusé. Super Admin requis.", "error");
      return;
    }

    state.initialized = true;
    document.body.classList.remove("not-logged-in", "loading");
    document.body.classList.add("logged-in");

    updateSidebarUser();

    document.querySelectorAll(".crm-nav-item").forEach((item) => {
      item.addEventListener("click", () => navigateTo(item.dataset.section));
    });

    navigateTo("dashboard");
    console.log("CRM: ✅ Prêt");
  }

  // === EXPOSE API ===
  window.CRM = {
    init,
    navigateTo,
    closeModal,
    logout,
    // Users
    editUser,
    saveUser,
    activateUser,
    suspendUser,
    deleteUser,
    addUserRole,
    removeUserRole,
    loadZonesForSpace,
    // Spaces
    createSpace,
    saveNewSpace,
    editSpace,
    saveSpace,
    deleteSpace,
    toggleTreeItem,
    // Zones
    createZone,
    saveNewZone,
    editZone,
    saveZone,
    deleteZone,
  };

  // Auto init
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => {
      setTimeout(() => {
        if (document.body.classList.contains("logged-in")) init();
      }, 100);
    });
  } else {
    setTimeout(() => {
      if (document.body.classList.contains("logged-in")) init();
    }, 100);
  }
})();
