/**
 * ============================================
 * 🎛️ CRM ATLANTIS CITY - DASHBOARD MODULE
 * Dashboard + Activity helpers
 * ============================================
 */

(function () {
  "use strict";

  const { state, apiCall, formatDate } = window.CRM;

  // === ACTIVITY HELPERS ===
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
      plv_created: "🎨",
      plv_upload: "📤",
    };
    return icons[action] || "📋";
  }

  function getActivityColor(action) {
    if (action.includes("deleted")) return "crm-badge-danger";
    if (action.includes("created")) return "crm-badge-success";
    if (action.includes("login")) return "crm-badge-info";
    if (action.includes("plv")) return "crm-badge-purple";
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
      plv_created: "a créé un projet PLV",
      plv_upload: "a uploadé une texture",
    };
    return texts[action] || action;
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

  // === EXTEND CRM API ===
  Object.assign(window.CRM, {
    loadDashboard,
    getActivityIcon,
    getActivityColor,
    getActivityText,
  });

  console.log("✅ CRM Dashboard loaded");
})();
