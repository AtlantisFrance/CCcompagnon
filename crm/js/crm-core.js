/**
 * CRM ATLANTIS CITY - CORE MODULE
 * Config, State, API, Helpers
 */
(function () {
  "use strict";

  const CONFIG = {
    API_BASE: "https://compagnon.atlantis-city.com/api",
    TOKEN_KEY: "atlantis_auth_token",
    USER_KEY: "atlantis_auth_user",
  };

  const state = {
    user: null,
    token: null,
    currentSection: "dashboard",
    initialized: false,
    cachedZones: [],
    openMenuId: null,
    userSort: { column: "last_name", direction: "asc" },
    spaceSort: { direction: "asc" },
    plvProjects: [],
    currentPLVProject: null,
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

  function getToken() {
    return localStorage.getItem(CONFIG.TOKEN_KEY);
  }

  function getUser() {
    const user = localStorage.getItem(CONFIG.USER_KEY);
    try { return user ? JSON.parse(user) : null; } catch (e) { return null; }
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

  async function apiCall(endpoint, method = "GET", data = null) {
    const token = getToken();
    const options = {
      method,
      headers: {
        "Content-Type": "application/json",
        Authorization: token ? `Bearer ${token}` : "",
      },
    };
    if (data && method !== "GET") options.body = JSON.stringify(data);

    try {
      const response = await fetch(`${CONFIG.API_BASE}${endpoint}`, options);
      const result = await response.json();
      if (response.status === 401) {
        clearAuth();
        document.body.classList.remove("logged-in");
        document.body.classList.add("not-logged-in");
        throw new Error("Session expirée. Veuillez vous reconnecter.");
      }
      if (!response.ok) throw new Error(result.error || "Erreur serveur");
      return result.data || result;
    } catch (error) {
      console.error("API Error:", error);
      throw error;
    }
  }

  async function apiUpload(endpoint, formData) {
    const token = getToken();
    const options = {
      method: "POST",
      headers: { Authorization: token ? `Bearer ${token}` : "" },
      body: formData,
    };
    try {
      const response = await fetch(`${CONFIG.API_BASE}${endpoint}`, options);
      const result = await response.json();
      if (response.status === 401) {
        clearAuth();
        document.body.classList.remove("logged-in");
        document.body.classList.add("not-logged-in");
        throw new Error("Session expirée.");
      }
      if (!response.ok) throw new Error(result.error || "Erreur serveur");
      return result.data || result;
    } catch (error) {
      console.error("Upload Error:", error);
      throw error;
    }
  }

  function formatDate(dateStr) {
    if (!dateStr) return "—";
    const date = new Date(dateStr);
    return date.toLocaleDateString("fr-FR") + " " + date.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
  }

  function getStatusBadge(status) {
    const badges = { active: "crm-badge-success", suspended: "crm-badge-danger" };
    return badges[status] || "crm-badge-info";
  }

  function getRoleBadge(role) {
    const badges = { space_admin: "crm-badge-purple", zone_admin: "crm-badge-info", viewer: "crm-badge-success" };
    return badges[role] || "crm-badge-info";
  }

  window.CRM = {
    CONFIG, state, getToken, getUser, setAuth, clearAuth,
    apiCall, apiUpload, formatDate, getStatusBadge, getRoleBadge
  };
  console.log("✅ CRM Core loaded");
})();
