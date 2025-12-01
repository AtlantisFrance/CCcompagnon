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
    cachedZones: [],
    openMenuId: null, // Pour tracker le menu ouvert
    data: {
      dashboard: null,
      users: [],
      spaces: [],
      zones: [],
      roles: [],
      contents: [],
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

    const icons = {
      success: "✅",
      error: "❌",
      warning: "⚠️",
      info: "ℹ️",
    };

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

  // === DROPDOWN MENU ===
  function toggleUserMenu(userId, event) {
    event.stopPropagation();

    // Fermer tous les menus ouverts
    document.querySelectorAll(".user-action-menu").forEach((m) => m.remove());

    if (state.openMenuId === userId) {
      state.openMenuId = null;
      return;
    }

    state.openMenuId = userId;

    // Trouver l'utilisateur
    const user = state.data.users.find((u) => u.id == userId);
    if (!user) return;

    // Créer le menu
    const menu = document.createElement("div");
    menu.className = "user-action-menu";
    menu.innerHTML = `
      <div class="user-menu-item" onclick="window.CRM.editUserProfile(${userId}); event.stopPropagation();">
        <span>👤</span> Profil
      </div>
      <div class="user-menu-item" onclick="window.CRM.assignRoleToUser(${userId}, '${user.first_name} ${user.last_name}'); event.stopPropagation();">
        <span>🎭</span> Attribuer un rôle
      </div>
      <div class="user-menu-item" onclick="window.CRM.viewUserRoles(${userId}, '${user.first_name} ${user.last_name}'); event.stopPropagation();">
        <span>📋</span> Voir les rôles
      </div>
      <div class="user-menu-divider"></div>
      <div class="user-menu-item danger" onclick="window.CRM.deleteUser(${userId}); event.stopPropagation();">
        <span>🗑️</span> Supprimer
      </div>
    `;

    // Positionner le menu
    const btn = event.currentTarget;
    const rect = btn.getBoundingClientRect();
    menu.style.cssText = `
      position: fixed;
      top: ${rect.bottom + 5}px;
      right: ${window.innerWidth - rect.right}px;
      z-index: 1000;
    `;

    document.body.appendChild(menu);

    // Fermer au clic ailleurs
    setTimeout(() => {
      document.addEventListener("click", closeAllMenus);
    }, 10);
  }

  function closeAllMenus() {
    document.querySelectorAll(".user-action-menu").forEach((m) => m.remove());
    state.openMenuId = null;
    document.removeEventListener("click", closeAllMenus);
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
      zones: { icon: "📍", text: "Zones" },
      roles: { icon: "🎭", text: "Rôles" },
      contents: { icon: "🖼️", text: "Contenus" },
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
        case "zones":
          await loadZones();
          break;
        case "roles":
          await loadRoles();
          break;
        case "contents":
          await loadContents();
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
      <!-- Stats Cards -->
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
          <div class="crm-stat-icon red">🚫</div>
          <div class="crm-stat-content">
            <h3>${result.users?.suspended || 0}</h3>
            <p>Suspendus</p>
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
        <div class="crm-stat-card">
          <div class="crm-stat-icon orange">🖼️</div>
          <div class="crm-stat-content">
            <h3>${result.contents?.total || 0}</h3>
            <p>Contenus</p>
          </div>
        </div>
      </div>

      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 24px;">
        <!-- Recent Logins -->
        <div class="crm-card">
          <div class="crm-card-header">
            <h3 class="crm-card-title">🔐 Dernières connexions</h3>
          </div>
          ${
            result.recent_logins && result.recent_logins.length > 0
              ? `
              <div class="crm-table-wrapper">
                <table class="crm-table">
                  <thead>
                    <tr>
                      <th>Utilisateur</th>
                      <th>Connexions</th>
                      <th>Dernière</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${result.recent_logins
                      .map(
                        (user) => `
                        <tr>
                          <td>${user.first_name} ${user.last_name}</td>
                          <td>${user.login_count || 0}</td>
                          <td>${formatDate(user.last_login_at)}</td>
                        </tr>
                      `
                      )
                      .join("")}
                  </tbody>
                </table>
              </div>
            `
              : '<div class="crm-empty"><p>Aucune connexion récente</p></div>'
          }
        </div>

        <!-- Recent Activity -->
        <div class="crm-card">
          <div class="crm-card-header">
            <h3 class="crm-card-title">📝 Activité récente</h3>
          </div>
          ${
            result.recent_activity && result.recent_activity.length > 0
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
                          }</strong> ${getActivityText(log.action)}
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
      suspended: 0,
    };

    const el = document.querySelector("#section-users .crm-section-content");
    el.innerHTML = `
      <style>
        .user-action-menu {
          background: var(--bg-secondary);
          border: 1px solid var(--border-color);
          border-radius: 10px;
          box-shadow: 0 10px 40px rgba(0,0,0,0.4);
          min-width: 180px;
          overflow: hidden;
          animation: menuFadeIn 0.15s ease;
        }
        @keyframes menuFadeIn {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .user-menu-item {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 12px 16px;
          color: var(--text-secondary);
          cursor: pointer;
          transition: all 0.2s ease;
          font-size: 14px;
        }
        .user-menu-item:hover {
          background: var(--bg-hover);
          color: var(--text-primary);
        }
        .user-menu-item.danger {
          color: var(--danger);
        }
        .user-menu-item.danger:hover {
          background: rgba(239, 68, 68, 0.1);
        }
        .user-menu-divider {
          height: 1px;
          background: var(--border-color);
          margin: 4px 0;
        }
        .action-btn-dots {
          background: var(--bg-tertiary);
          border: 1px solid var(--border-color);
          border-radius: 8px;
          padding: 8px 12px;
          cursor: pointer;
          font-size: 16px;
          color: var(--text-secondary);
          transition: all 0.2s ease;
        }
        .action-btn-dots:hover {
          background: var(--bg-hover);
          color: var(--text-primary);
          border-color: var(--accent-primary);
        }
      </style>
      
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
                <th>Utilisateur</th>
                <th>Email</th>
                <th>Entreprise</th>
                <th>Rôle</th>
                <th>Statut</th>
                <th>Connexions</th>
                <th style="width: 80px; text-align: center;">Actions</th>
              </tr>
            </thead>
            <tbody>
              ${state.data.users
                .filter((user) => user.status !== "pending")
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
                        ${
                          user.global_role === "super_admin"
                            ? "SUPER ADMIN"
                            : "USER"
                        }
                      </span>
                    </td>
                    <td>
                      <span class="crm-badge ${getStatusBadge(user.status)}">
                        ${user.status === "active" ? "ACTIF" : "SUSPENDU"}
                      </span>
                    </td>
                    <td>${user.login_count || 0}</td>
                    <td style="text-align: center;">
                      <button class="action-btn-dots" onclick="window.CRM.toggleUserMenu(${
                        user.id
                      }, event)" title="Actions">
                        ⋮
                      </button>
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

  // === EDIT USER PROFILE ===
  async function editUserProfile(userId) {
    closeAllMenus();

    const result = await apiCall(`/admin/users.php?id=${userId}`);
    const user = result.user || result;

    openModal(
      "👤 Profil utilisateur",
      `
        <form id="edit-user-form">
          <input type="hidden" name="id" value="${user.id}">
          
          <div style="display: flex; align-items: center; gap: 16px; margin-bottom: 24px; padding-bottom: 20px; border-bottom: 1px solid var(--border-color);">
            <div class="crm-user-avatar" style="width: 60px; height: 60px; font-size: 24px;">
              ${(user.first_name?.[0] || "") + (user.last_name?.[0] || "")}
            </div>
            <div>
              <div style="font-size: 18px; font-weight: 600;">${
                user.first_name
              } ${user.last_name}</div>
              <div style="color: var(--text-muted);">${user.email}</div>
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
              <label class="crm-form-label">Rôle global</label>
              <select class="crm-form-select" name="global_role">
                <option value="user" ${
                  user.global_role === "user" ? "selected" : ""
                }>Utilisateur</option>
                <option value="super_admin" ${
                  user.global_role === "super_admin" ? "selected" : ""
                }>Super Admin</option>
              </select>
            </div>
            <div class="crm-form-group">
              <label class="crm-form-label">Statut</label>
              <select class="crm-form-select" name="status">
                <option value="active" ${
                  user.status === "active" ? "selected" : ""
                }>✅ Actif</option>
                <option value="suspended" ${
                  user.status === "suspended" ? "selected" : ""
                }>🚫 Suspendu</option>
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
        <button class="crm-btn crm-btn-primary" onclick="window.CRM.saveUserProfile()">💾 Enregistrer</button>
      `
    );
  }

  async function saveUserProfile() {
    const form = document.getElementById("edit-user-form");
    const formData = new FormData(form);
    const data = Object.fromEntries(formData);

    try {
      await apiCall("/admin/users.php", "PUT", data);
      showToast("Profil mis à jour", "success");
      closeModal();
      loadUsers();
    } catch (error) {
      showToast(error.message, "error");
    }
  }

  // === ASSIGN ROLE TO USER ===
  async function assignRoleToUser(userId, userName) {
    closeAllMenus();

    const spacesRes = await apiCall("/admin/spaces.php");
    const spaces = spacesRes.spaces || [];

    openModal(
      `🎭 Attribuer un rôle à ${userName}`,
      `
        <form id="assign-role-form">
          <input type="hidden" name="user_id" value="${userId}">
          
          <div class="crm-form-group">
            <label class="crm-form-label">Espace</label>
            <select class="crm-form-select" name="space_id" required onchange="window.CRM.onSpaceChangeForRole(this.value)">
              <option value="">-- Sélectionner un espace --</option>
              ${spaces
                .map((s) => `<option value="${s.id}">${s.name}</option>`)
                .join("")}
            </select>
          </div>
          
          <div class="crm-form-group">
            <label class="crm-form-label">Type de rôle</label>
            <select class="crm-form-select" name="role" required onchange="window.CRM.onRoleTypeChange(this.value)">
              <option value="">-- Sélectionner un rôle --</option>
              <option value="space_admin">🏢 Space Admin (tout l'espace)</option>
              <option value="zone_admin">📍 Zone Admin (zones spécifiques)</option>
              <option value="viewer">👁️ Viewer (lecture seule)</option>
            </select>
          </div>
          
          <div id="zone-selection-container" style="display: none;">
            <!-- Dynamically populated -->
          </div>
        </form>
      `,
      `
        <button class="crm-btn crm-btn-secondary" onclick="window.CRM.closeModal()">Annuler</button>
        <button class="crm-btn crm-btn-primary" onclick="window.CRM.saveAssignedRole()">✅ Attribuer</button>
      `
    );
  }

  async function onSpaceChangeForRole(spaceId) {
    if (!spaceId) {
      state.cachedZones = [];
      return;
    }

    try {
      const result = await apiCall(`/admin/zones.php?space_id=${spaceId}`);
      state.cachedZones = result.zones || [];

      // Refresh zone display if role is selected
      const roleSelect = document.querySelector('[name="role"]');
      if (roleSelect && roleSelect.value) {
        onRoleTypeChange(roleSelect.value);
      }
    } catch (error) {
      console.error("Error loading zones:", error);
      state.cachedZones = [];
    }
  }

  function onRoleTypeChange(role) {
    const container = document.getElementById("zone-selection-container");
    if (!container) return;

    if (!role) {
      container.style.display = "none";
      container.innerHTML = "";
      return;
    }

    container.style.display = "block";

    if (role === "space_admin") {
      // Space Admin = toutes les zones automatiquement
      container.innerHTML = `
        <div class="crm-form-group">
          <label class="crm-form-label">Zones</label>
          <div style="padding: 16px; background: rgba(34, 197, 94, 0.1); border: 1px solid rgba(34, 197, 94, 0.3); border-radius: 10px; color: #22c55e;">
            <div style="display: flex; align-items: center; gap: 10px; font-weight: 600;">
              <span style="font-size: 20px;">✅</span>
              Accès à toutes les zones
            </div>
            <p style="margin: 8px 0 0; font-size: 13px; color: var(--text-muted);">
              Un Space Admin peut gérer toutes les zones de l'espace sélectionné.
            </p>
          </div>
        </div>
      `;
    } else if (role === "zone_admin") {
      // Zone Admin = multi-sélection
      container.innerHTML = `
        <div class="crm-form-group">
          <label class="crm-form-label">Sélectionner les zones à gérer</label>
          ${
            state.cachedZones.length > 0
              ? `
              <div style="max-height: 200px; overflow-y: auto; border: 1px solid var(--border-color); border-radius: 10px;">
                ${state.cachedZones
                  .map(
                    (zone) => `
                    <label style="display: flex; align-items: center; gap: 12px; padding: 12px 16px; cursor: pointer; border-bottom: 1px solid var(--border-color); transition: background 0.2s;">
                      <input type="checkbox" name="zone_ids" value="${zone.id}" style="width: 18px; height: 18px; accent-color: var(--accent-primary);">
                      <div style="flex: 1;">
                        <div style="font-weight: 500;">📍 ${zone.name}</div>
                        <div style="font-size: 12px; color: var(--text-muted);">${zone.slug}</div>
                      </div>
                    </label>
                  `
                  )
                  .join("")}
              </div>
              <p style="margin-top: 8px; font-size: 12px; color: var(--text-muted);">
                ⚠️ Un rôle sera créé pour chaque zone cochée.
              </p>
            `
              : `
              <div style="padding: 20px; text-align: center; color: var(--text-muted); background: var(--bg-tertiary); border-radius: 10px;">
                Sélectionnez d'abord un espace pour voir ses zones.
              </div>
            `
          }
        </div>
      `;
    } else if (role === "viewer") {
      // Viewer = tout l'espace ou une zone spécifique
      container.innerHTML = `
        <div class="crm-form-group">
          <label class="crm-form-label">Périmètre d'accès</label>
          <div style="border: 1px solid var(--border-color); border-radius: 10px; overflow: hidden;">
            <label style="display: flex; align-items: center; gap: 12px; padding: 14px 16px; cursor: pointer; background: rgba(59, 130, 246, 0.1); border-bottom: 1px solid var(--border-color);">
              <input type="radio" name="viewer_scope" value="all" checked style="width: 18px; height: 18px; accent-color: var(--accent-primary);">
              <div>
                <div style="font-weight: 600;">🏢 Tout l'espace</div>
                <div style="font-size: 12px; color: var(--text-muted);">Accès en lecture à toutes les zones</div>
              </div>
            </label>
            ${state.cachedZones
              .map(
                (zone) => `
                <label style="display: flex; align-items: center; gap: 12px; padding: 12px 16px; cursor: pointer; border-bottom: 1px solid var(--border-color); transition: background 0.2s;">
                  <input type="radio" name="viewer_scope" value="${zone.id}" style="width: 18px; height: 18px; accent-color: var(--accent-primary);">
                  <div>
                    <div style="font-weight: 500;">📍 ${zone.name}</div>
                    <div style="font-size: 12px; color: var(--text-muted);">${zone.slug}</div>
                  </div>
                </label>
              `
              )
              .join("")}
          </div>
        </div>
      `;
    }
  }

  async function saveAssignedRole() {
    const form = document.getElementById("assign-role-form");
    const userId = form.querySelector('[name="user_id"]').value;
    const spaceId = form.querySelector('[name="space_id"]').value;
    const role = form.querySelector('[name="role"]').value;

    if (!spaceId || !role) {
      showToast("Veuillez sélectionner un espace et un rôle", "warning");
      return;
    }

    try {
      let rolesCreated = 0;

      if (role === "space_admin") {
        await apiCall("/admin/roles.php", "POST", {
          user_id: userId,
          space_id: spaceId,
          role: "space_admin",
        });
        rolesCreated = 1;
      } else if (role === "zone_admin") {
        const checkedZones = form.querySelectorAll('[name="zone_ids"]:checked');
        if (checkedZones.length === 0) {
          showToast("Veuillez sélectionner au moins une zone", "warning");
          return;
        }
        for (const checkbox of checkedZones) {
          await apiCall("/admin/roles.php", "POST", {
            user_id: userId,
            space_id: spaceId,
            zone_id: checkbox.value,
            role: "zone_admin",
          });
          rolesCreated++;
        }
      } else if (role === "viewer") {
        const viewerScope = form.querySelector('[name="viewer_scope"]:checked');
        const data = {
          user_id: userId,
          space_id: spaceId,
          role: "viewer",
        };
        if (viewerScope && viewerScope.value !== "all") {
          data.zone_id = viewerScope.value;
        }
        await apiCall("/admin/roles.php", "POST", data);
        rolesCreated = 1;
      }

      showToast(`${rolesCreated} rôle(s) attribué(s) avec succès`, "success");
      closeModal();

      if (state.currentSection === "roles") {
        loadRoles();
      }
    } catch (error) {
      showToast(error.message, "error");
    }
  }

  // === VIEW USER ROLES ===
  async function viewUserRoles(userId, userName) {
    closeAllMenus();

    try {
      const result = await apiCall(`/admin/roles.php?user_id=${userId}`);
      const roles = result.roles || [];

      const content =
        roles.length > 0
          ? `
          <div style="margin-bottom: 16px; padding: 12px; background: var(--bg-tertiary); border-radius: 8px;">
            <span style="color: var(--text-muted);">Total :</span>
            <strong>${roles.length} rôle(s)</strong>
          </div>
          
          <div style="border: 1px solid var(--border-color); border-radius: 10px; overflow: hidden;">
            ${roles
              .map(
                (role) => `
                <div style="display: flex; align-items: center; justify-content: space-between; padding: 14px 16px; border-bottom: 1px solid var(--border-color);">
                  <div style="display: flex; align-items: center; gap: 12px;">
                    <span style="font-size: 20px;">${
                      role.role === "space_admin"
                        ? "🏢"
                        : role.role === "zone_admin"
                        ? "📍"
                        : "👁️"
                    }</span>
                    <div>
                      <div style="font-weight: 600;">${role.space_name}</div>
                      <div style="font-size: 13px; color: var(--text-muted);">
                        ${
                          role.zone_name
                            ? `Zone: ${role.zone_name}`
                            : "Tout l'espace"
                        }
                      </div>
                    </div>
                  </div>
                  <div style="display: flex; align-items: center; gap: 10px;">
                    <span class="crm-badge ${getRoleBadge(role.role)}">${
                  role.role
                }</span>
                    <button class="crm-btn crm-btn-sm crm-btn-danger crm-btn-icon" onclick="window.CRM.deleteRoleFromView(${
                      role.id
                    }, ${userId}, '${userName}')" title="Supprimer">
                      🗑️
                    </button>
                  </div>
                </div>
              `
              )
              .join("")}
          </div>
        `
          : `
          <div style="text-align: center; padding: 40px; color: var(--text-muted);">
            <div style="font-size: 48px; margin-bottom: 16px; opacity: 0.5;">📋</div>
            <p>Aucun rôle attribué</p>
            <button class="crm-btn crm-btn-primary" style="margin-top: 16px;" onclick="window.CRM.closeModal(); window.CRM.assignRoleToUser(${userId}, '${userName}');">
              🎭 Attribuer un rôle
            </button>
          </div>
        `;

      openModal(
        `📋 Rôles de ${userName}`,
        content,
        roles.length > 0
          ? `
            <button class="crm-btn crm-btn-secondary" onclick="window.CRM.closeModal()">Fermer</button>
            <button class="crm-btn crm-btn-primary" onclick="window.CRM.closeModal(); window.CRM.assignRoleToUser(${userId}, '${userName}');">
              ➕ Ajouter un rôle
            </button>
          `
          : ""
      );
    } catch (error) {
      showToast(error.message, "error");
    }
  }

  async function deleteRoleFromView(roleId, userId, userName) {
    if (!confirm("Voulez-vous vraiment supprimer ce rôle ?")) return;

    try {
      await apiCall(`/admin/roles.php?id=${roleId}`, "DELETE");
      showToast("Rôle supprimé", "success");

      // Recharger la vue des rôles
      viewUserRoles(userId, userName);

      if (state.currentSection === "roles") {
        loadRoles();
      }
    } catch (error) {
      showToast(error.message, "error");
    }
  }

  // === DELETE USER ===
  async function deleteUser(userId) {
    closeAllMenus();

    const user = state.data.users.find((u) => u.id == userId);
    if (!user) return;

    if (user.id == state.user?.id) {
      showToast("Vous ne pouvez pas supprimer votre propre compte", "error");
      return;
    }

    if (
      !confirm(
        `Voulez-vous vraiment supprimer l'utilisateur "${user.first_name} ${user.last_name}" ?\n\nCette action est irréversible.`
      )
    ) {
      return;
    }

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
                      <div style="font-weight: 600;">${space.name}</div>
                      <div style="font-size: 12px; color: var(--text-muted);">
                        ${space.slug} • ${space.zone_count || 0} zones • ${
                  space.admin_count || 0
                } admins
                      </div>
                    </div>
                    <span class="crm-badge ${
                      space.is_active ? "crm-badge-success" : "crm-badge-danger"
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
                  <div class="crm-tree-children" id="zones-${space.id}">
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
                    <div style="font-size: 12px; color: var(--text-muted);">
                      ${zone.slug} • ${zone.content_count || 0} contenus
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
  }

  async function saveSpace() {
    const form = document.getElementById("edit-space-form");
    const formData = new FormData(form);
    const data = Object.fromEntries(formData);
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
    if (
      !confirm(
        "Voulez-vous vraiment supprimer cet espace ? Toutes les zones et contenus associés seront supprimés."
      )
    )
      return;

    try {
      await apiCall(`/admin/spaces.php?id=${spaceId}`, "DELETE");
      showToast("Espace supprimé", "success");
      loadSpaces();
    } catch (error) {
      showToast(error.message, "error");
    }
  }

  // === ZONES ===
  async function loadZones() {
    const result = await apiCall("/admin/zones.php");
    state.data.zones = result.zones || [];

    const el = document.querySelector("#section-zones .crm-section-content");
    el.innerHTML = `
      <div class="crm-card">
        <div class="crm-card-header">
          <h3 class="crm-card-title">📍 Toutes les zones</h3>
        </div>
        ${
          state.data.zones.length > 0
            ? `
          <div class="crm-table-wrapper">
            <table class="crm-table">
              <thead>
                <tr>
                  <th>Zone</th>
                  <th>Espace</th>
                  <th>Slug</th>
                  <th>Contenus</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                ${state.data.zones
                  .map(
                    (zone) => `
                    <tr>
                      <td><strong>${zone.name}</strong></td>
                      <td>
                        <span class="crm-badge crm-badge-primary">${
                          zone.space_name
                        }</span>
                      </td>
                      <td><code>${zone.slug}</code></td>
                      <td>${zone.content_count || 0}</td>
                      <td>
                        <div style="display: flex; gap: 6px;">
                          <button class="crm-btn crm-btn-sm crm-btn-secondary crm-btn-icon" onclick="window.CRM.editZone(${
                            zone.id
                          })">
                            ✏️
                          </button>
                          <button class="crm-btn crm-btn-sm crm-btn-danger crm-btn-icon" onclick="window.CRM.deleteZone(${
                            zone.id
                          })">
                            🗑️
                          </button>
                        </div>
                      </td>
                    </tr>
                  `
                  )
                  .join("")}
              </tbody>
            </table>
          </div>
        `
            : '<div class="crm-empty"><p>Aucune zone créée</p></div>'
        }
      </div>
    `;
  }

  async function createZone(spaceId) {
    openModal(
      "➕ Nouvelle zone",
      `
        <form id="create-zone-form">
          <input type="hidden" name="space_id" value="${spaceId}">
          <div class="crm-form-group">
            <label class="crm-form-label">Slug (identifiant technique)</label>
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
    const formData = new FormData(form);
    const data = Object.fromEntries(formData);

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
            <label class="crm-form-label">Espace</label>
            <input type="text" class="crm-form-input" value="${
              zone.space_name || ""
            }" disabled>
          </div>
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
    const formData = new FormData(form);
    const data = Object.fromEntries(formData);
    data.is_active = form.querySelector('[name="is_active"]').checked;

    try {
      await apiCall("/admin/zones.php", "PUT", data);
      showToast("Zone mise à jour", "success");
      closeModal();
      loadSpaces();
      loadZones();
    } catch (error) {
      showToast(error.message, "error");
    }
  }

  async function deleteZone(zoneId) {
    if (!confirm("Voulez-vous vraiment supprimer cette zone ?")) return;

    try {
      await apiCall(`/admin/zones.php?id=${zoneId}`, "DELETE");
      showToast("Zone supprimée", "success");
      loadSpaces();
    } catch (error) {
      showToast(error.message, "error");
    }
  }

  // === ROLES ===
  async function loadRoles() {
    const result = await apiCall("/admin/roles.php");
    state.data.roles = result.roles || [];

    const el = document.querySelector("#section-roles .crm-section-content");
    el.innerHTML = `
      <div class="crm-card">
        <div class="crm-card-header">
          <h3 class="crm-card-title">🎭 Attribution des rôles</h3>
          <button class="crm-btn crm-btn-primary" onclick="window.CRM.createRole()">
            ➕ Assigner un rôle
          </button>
        </div>
        ${
          state.data.roles.length > 0
            ? `
          <div class="crm-table-wrapper">
            <table class="crm-table">
              <thead>
                <tr>
                  <th>Utilisateur</th>
                  <th>Espace</th>
                  <th>Zone</th>
                  <th>Rôle</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                ${state.data.roles
                  .map(
                    (role) => `
                    <tr>
                      <td>
                        <strong>${role.first_name} ${role.last_name}</strong>
                        <div style="font-size: 12px; color: var(--text-muted);">${
                          role.email
                        }</div>
                      </td>
                      <td>
                        <span class="crm-badge crm-badge-primary">${
                          role.space_name
                        }</span>
                      </td>
                      <td>
                        ${
                          role.zone_name
                            ? `<span class="crm-badge crm-badge-info">${role.zone_name}</span>`
                            : '<em style="color:var(--text-muted)">Tout l\'espace</em>'
                        }
                      </td>
                      <td>
                        <span class="crm-badge ${getRoleBadge(role.role)}">${
                      role.role
                    }</span>
                      </td>
                      <td>
                        <button class="crm-btn crm-btn-sm crm-btn-danger crm-btn-icon" onclick="window.CRM.deleteRole(${
                          role.id
                        })">
                          🗑️
                        </button>
                      </td>
                    </tr>
                  `
                  )
                  .join("")}
              </tbody>
            </table>
          </div>
        `
            : '<div class="crm-empty"><p>Aucun rôle assigné</p></div>'
        }
      </div>
    `;
  }

  async function createRole() {
    const [usersRes, spacesRes] = await Promise.all([
      apiCall("/admin/users.php"),
      apiCall("/admin/spaces.php"),
    ]);

    const users = (usersRes.users || []).filter((u) => u.status === "active");
    const spaces = spacesRes.spaces || [];

    openModal(
      "➕ Assigner un rôle",
      `
        <form id="assign-role-form">
          <div class="crm-form-group">
            <label class="crm-form-label">Utilisateur</label>
            <select class="crm-form-select" name="user_id" required>
              <option value="">-- Sélectionner un utilisateur --</option>
              ${users
                .map(
                  (u) =>
                    `<option value="${u.id}">${u.first_name} ${u.last_name} (${u.email})</option>`
                )
                .join("")}
            </select>
          </div>
          
          <div class="crm-form-group">
            <label class="crm-form-label">Espace</label>
            <select class="crm-form-select" name="space_id" required onchange="window.CRM.onSpaceChangeForRole(this.value)">
              <option value="">-- Sélectionner un espace --</option>
              ${spaces
                .map((s) => `<option value="${s.id}">${s.name}</option>`)
                .join("")}
            </select>
          </div>
          
          <div class="crm-form-group">
            <label class="crm-form-label">Type de rôle</label>
            <select class="crm-form-select" name="role" required onchange="window.CRM.onRoleTypeChange(this.value)">
              <option value="">-- Sélectionner un rôle --</option>
              <option value="space_admin">🏢 Space Admin (tout l'espace)</option>
              <option value="zone_admin">📍 Zone Admin (zones spécifiques)</option>
              <option value="viewer">👁️ Viewer (lecture seule)</option>
            </select>
          </div>
          
          <div id="zone-selection-container" style="display: none;">
          </div>
        </form>
      `,
      `
        <button class="crm-btn crm-btn-secondary" onclick="window.CRM.closeModal()">Annuler</button>
        <button class="crm-btn crm-btn-primary" onclick="window.CRM.saveAssignedRole()">✅ Attribuer</button>
      `
    );
  }

  async function deleteRole(roleId) {
    if (!confirm("Voulez-vous vraiment supprimer ce rôle ?")) return;

    try {
      await apiCall(`/admin/roles.php?id=${roleId}`, "DELETE");
      showToast("Rôle supprimé", "success");
      loadRoles();
    } catch (error) {
      showToast(error.message, "error");
    }
  }

  // === CONTENTS ===
  async function loadContents() {
    const result = await apiCall("/admin/contents.php");
    state.data.contents = result.contents || [];

    const el = document.querySelector("#section-contents .crm-section-content");
    el.innerHTML = `
      <div class="crm-card">
        <div class="crm-card-header">
          <h3 class="crm-card-title">🖼️ Contenus modifiables</h3>
          <button class="crm-btn crm-btn-primary" onclick="window.CRM.createContent()">
            ➕ Nouveau contenu
          </button>
        </div>
        ${
          state.data.contents.length > 0
            ? `
          <div class="crm-table-wrapper">
            <table class="crm-table">
              <thead>
                <tr>
                  <th>Aperçu</th>
                  <th>Clé</th>
                  <th>Espace / Zone</th>
                  <th>Type</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                ${state.data.contents
                  .map(
                    (content) => `
                    <tr>
                      <td>
                        ${
                          content.content_type === "image"
                            ? `<img src="${content.content_value}" style="width:60px;height:40px;object-fit:cover;border-radius:4px;">`
                            : "—"
                        }
                      </td>
                      <td><code>${content.content_key}</code></td>
                      <td>
                        <span class="crm-badge crm-badge-primary">${
                          content.space_name
                        }</span>
                        <span class="crm-badge crm-badge-info">${
                          content.zone_name
                        }</span>
                      </td>
                      <td>${content.content_type}</td>
                      <td>
                        <div style="display: flex; gap: 6px;">
                          <button class="crm-btn crm-btn-sm crm-btn-secondary crm-btn-icon" onclick="window.CRM.editContent(${
                            content.id
                          })">
                            ✏️
                          </button>
                          <button class="crm-btn crm-btn-sm crm-btn-danger crm-btn-icon" onclick="window.CRM.deleteContent(${
                            content.id
                          })">
                            🗑️
                          </button>
                        </div>
                      </td>
                    </tr>
                  `
                  )
                  .join("")}
              </tbody>
            </table>
          </div>
        `
            : '<div class="crm-empty"><p>Aucun contenu créé</p></div>'
        }
      </div>
    `;
  }

  async function createContent() {
    const zonesRes = await apiCall("/admin/zones.php");
    const zones = zonesRes.zones || [];

    openModal(
      "➕ Nouveau contenu",
      `
        <form id="create-content-form">
          <div class="crm-form-group">
            <label class="crm-form-label">Zone</label>
            <select class="crm-form-select" name="zone_id" required>
              <option value="">Sélectionner une zone</option>
              ${zones
                .map(
                  (z) =>
                    `<option value="${z.id}">${z.space_name} → ${z.name}</option>`
                )
                .join("")}
            </select>
          </div>
          <div class="crm-form-group">
            <label class="crm-form-label">Clé (content_key)</label>
            <input type="text" class="crm-form-input" name="content_key" placeholder="plv1" pattern="[a-z0-9_]+" required>
            <small style="color: var(--text-muted);">Lettres minuscules, chiffres et underscores</small>
          </div>
          <div class="crm-form-group">
            <label class="crm-form-label">Type</label>
            <select class="crm-form-select" name="content_type">
              <option value="image">Image</option>
              <option value="texture">Texture</option>
              <option value="video">Vidéo</option>
              <option value="url">URL</option>
            </select>
          </div>
          <div class="crm-form-group">
            <label class="crm-form-label">URL du contenu</label>
            <input type="url" class="crm-form-input" name="content_value" placeholder="https://..." required>
          </div>
        </form>
      `,
      `
        <button class="crm-btn crm-btn-secondary" onclick="window.CRM.closeModal()">Annuler</button>
        <button class="crm-btn crm-btn-primary" onclick="window.CRM.saveNewContent()">Créer</button>
      `
    );
  }

  async function saveNewContent() {
    const form = document.getElementById("create-content-form");
    const formData = new FormData(form);
    const data = Object.fromEntries(formData);

    try {
      await apiCall("/admin/contents.php", "POST", data);
      showToast("Contenu créé", "success");
      closeModal();
      loadContents();
    } catch (error) {
      showToast(error.message, "error");
    }
  }

  async function editContent(contentId) {
    const contentsRes = await apiCall("/admin/contents.php");
    const contents = contentsRes.contents || [];
    const content = contents.find((c) => c.id == contentId);

    if (!content) {
      showToast("Contenu non trouvé", "error");
      return;
    }

    openModal(
      "✏️ Modifier le contenu",
      `
        <form id="edit-content-form">
          <input type="hidden" name="id" value="${content.id}">
          <div class="crm-form-group">
            <label class="crm-form-label">Zone</label>
            <input type="text" class="crm-form-input" value="${
              content.space_name
            } → ${content.zone_name}" disabled>
          </div>
          <div class="crm-form-group">
            <label class="crm-form-label">Clé</label>
            <input type="text" class="crm-form-input" value="${
              content.content_key
            }" disabled>
          </div>
          <div class="crm-form-group">
            <label class="crm-form-label">Type</label>
            <select class="crm-form-select" name="content_type">
              <option value="image" ${
                content.content_type === "image" ? "selected" : ""
              }>Image</option>
              <option value="texture" ${
                content.content_type === "texture" ? "selected" : ""
              }>Texture</option>
              <option value="video" ${
                content.content_type === "video" ? "selected" : ""
              }>Vidéo</option>
              <option value="url" ${
                content.content_type === "url" ? "selected" : ""
              }>URL</option>
            </select>
          </div>
          <div class="crm-form-group">
            <label class="crm-form-label">URL du contenu</label>
            <input type="url" class="crm-form-input" name="content_value" value="${
              content.content_value
            }" required>
          </div>
          ${
            content.content_type === "image"
              ? `
              <div class="crm-form-group">
                <label class="crm-form-label">Aperçu actuel</label>
                <img src="${content.content_value}" style="max-width:100%;max-height:200px;border-radius:8px;">
              </div>
            `
              : ""
          }
        </form>
      `,
      `
        <button class="crm-btn crm-btn-secondary" onclick="window.CRM.closeModal()">Annuler</button>
        <button class="crm-btn crm-btn-primary" onclick="window.CRM.saveContent()">Enregistrer</button>
      `
    );
  }

  async function saveContent() {
    const form = document.getElementById("edit-content-form");
    const formData = new FormData(form);
    const data = Object.fromEntries(formData);

    try {
      await apiCall("/admin/contents.php", "PUT", data);
      showToast("Contenu mis à jour", "success");
      closeModal();
      loadContents();
    } catch (error) {
      showToast(error.message, "error");
    }
  }

  async function deleteContent(contentId) {
    if (!confirm("Voulez-vous vraiment supprimer ce contenu ?")) return;

    try {
      await apiCall(`/admin/contents.php?id=${contentId}`, "DELETE");
      showToast("Contenu supprimé", "success");
      loadContents();
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
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Utilisateur</th>
                  <th>Action</th>
                  <th>Détails</th>
                </tr>
              </thead>
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
                      <td>
                        <span class="crm-badge ${getActivityColor(log.action)}">
                          ${log.action}
                        </span>
                      </td>
                      <td style="max-width:300px;overflow:hidden;text-overflow:ellipsis;">
                        ${
                          log.details
                            ? JSON.stringify(log.details).substring(0, 100)
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
            : '<div class="crm-empty"><p>Aucune activité enregistrée</p></div>'
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
    const badges = {
      active: "crm-badge-success",
      suspended: "crm-badge-danger",
    };
    return badges[status] || "crm-badge-info";
  }

  function getRoleBadge(role) {
    const badges = {
      space_admin: "crm-badge-purple",
      zone_admin: "crm-badge-info",
      viewer: "crm-badge-success",
    };
    return badges[role] || "crm-badge-info";
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
      content_updated: "🖼️",
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
      content_updated: "a modifié un contenu",
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

    if (avatarEl) {
      avatarEl.textContent =
        (state.user.first_name?.[0] || "") + (state.user.last_name?.[0] || "");
    }
    if (nameEl) {
      nameEl.textContent =
        `${state.user.first_name || ""} ${state.user.last_name || ""}`.trim() ||
        "Admin";
    }
    if (roleEl) {
      roleEl.textContent =
        state.user.global_role === "super_admin" ? "Super Admin" : "Admin";
    }
    if (headerInfo) {
      headerInfo.textContent = `Connecté en tant que ${state.user.email}`;
    }
  }

  // === INIT ===
  function init() {
    if (state.initialized) {
      console.log("CRM: Déjà initialisé");
      return;
    }

    state.token = getToken();
    state.user = getUser();

    if (!state.token || !state.user) {
      console.log("CRM: Non authentifié");
      document.body.classList.remove("logged-in", "loading");
      document.body.classList.add("not-logged-in");
      return;
    }

    if (state.user.global_role !== "super_admin") {
      console.log("CRM: Pas super_admin");
      clearAuth();
      document.body.classList.remove("logged-in", "loading");
      document.body.classList.add("not-logged-in");
      showToast("Accès refusé. Vous devez être Super Admin.", "error");
      return;
    }

    console.log("CRM: Initialisation...", state.user.email);
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

    // User Menu
    toggleUserMenu,
    editUserProfile,
    saveUserProfile,
    assignRoleToUser,
    viewUserRoles,
    deleteRoleFromView,
    deleteUser,

    // Role assignment
    onSpaceChangeForRole,
    onRoleTypeChange,
    saveAssignedRole,

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

    // Roles
    createRole,
    deleteRole,

    // Contents
    createContent,
    saveNewContent,
    editContent,
    saveContent,
    deleteContent,
  };

  // Auto init on DOM ready
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => {
      setTimeout(() => {
        if (document.body.classList.contains("logged-in")) {
          init();
        }
      }, 100);
    });
  } else {
    setTimeout(() => {
      if (document.body.classList.contains("logged-in")) {
        init();
      }
    }, 100);
  }
})();
