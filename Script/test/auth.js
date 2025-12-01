/**
 * ============================================
 * 🔐 AUTHENTIFICATION ATLANTIS CITY
 * Module d'authentification pour Shapespark
 * ============================================
 */

(function () {
  if (window.__atlantisAuthInitialized) return;
  window.__atlantisAuthInitialized = true;

  // === CONFIGURATION ===
  const AUTH_CONFIG = {
    apiBase: "https://compagnon.atlantis-city.com/api",
    tokenKey: "atlantis_auth_token",
    userKey: "atlantis_auth_user",
  };

  // === STATE ===
  let currentUser = null;
  let authToken = null;
  let userMenuOpen = false;

  // === INIT ===
  function init() {
    console.log("🔐 Atlantis Auth: Initialisation...");

    // Charger le token sauvegardé
    loadStoredAuth();

    // Créer le bouton d'auth
    createAuthButton();

    // Vérifier si le token est valide
    if (authToken) {
      checkAuth();
    }

    console.log("✅ Atlantis Auth: Prêt");
  }

  // === STORAGE ===
  function loadStoredAuth() {
    try {
      authToken = localStorage.getItem(AUTH_CONFIG.tokenKey);
      const storedUser = localStorage.getItem(AUTH_CONFIG.userKey);
      if (storedUser) {
        currentUser = JSON.parse(storedUser);
      }
    } catch (e) {
      console.warn("Atlantis Auth: Erreur lecture storage", e);
    }
  }

  function saveAuth(token, user) {
    authToken = token;
    currentUser = user;
    try {
      localStorage.setItem(AUTH_CONFIG.tokenKey, token);
      localStorage.setItem(AUTH_CONFIG.userKey, JSON.stringify(user));
    } catch (e) {
      console.warn("Atlantis Auth: Erreur sauvegarde storage", e);
    }
  }

  function clearAuth() {
    authToken = null;
    currentUser = null;
    try {
      localStorage.removeItem(AUTH_CONFIG.tokenKey);
      localStorage.removeItem(AUTH_CONFIG.userKey);
    } catch (e) {
      console.warn("Atlantis Auth: Erreur suppression storage", e);
    }
  }

  // === API CALLS ===
  async function apiCall(endpoint, method = "GET", data = null) {
    const options = {
      method: method,
      headers: {
        "Content-Type": "application/json",
      },
    };

    if (authToken) {
      options.headers["Authorization"] = "Bearer " + authToken;
    }

    if (data) {
      options.body = JSON.stringify(data);
    }

    try {
      const response = await fetch(AUTH_CONFIG.apiBase + endpoint, options);
      const json = await response.json();
      return { status: response.status, ...json };
    } catch (error) {
      console.error("Atlantis Auth: Erreur API", error);
      return { success: false, error: "Erreur de connexion au serveur" };
    }
  }

  // === AUTH FUNCTIONS ===
  async function checkAuth() {
    const result = await apiCall("/auth/me.php", "GET");
    if (result.success && result.data?.user) {
      currentUser = result.data.user;
      saveAuth(authToken, currentUser);
      updateAuthButton();
    } else {
      clearAuth();
      updateAuthButton();
    }
  }

  async function login(email, password) {
    const result = await apiCall("/auth/login.php", "POST", {
      email,
      password,
    });

    if (result.success && result.data?.token) {
      saveAuth(result.data.token, result.data.user);
      updateAuthButton();
      closeAuthPopup();
      showNotification("Connexion réussie !", "success");
      return { success: true };
    }

    return { success: false, error: result.error || "Erreur de connexion" };
  }

  async function register(data) {
    const result = await apiCall("/auth/register.php", "POST", data);

    if (result.success) {
      return {
        success: true,
        message:
          "Compte créé avec succès ! Vous pouvez maintenant vous connecter.",
      };
    }

    return { success: false, error: result.error || "Erreur d'inscription" };
  }

  async function logout() {
    // Éviter les appels multiples
    if (!authToken) {
      clearAuth();
      updateAuthButton();
      closeUserMenu();
      return;
    }

    // Sauvegarder et effacer le token avant l'appel API
    const tokenToInvalidate = authToken;
    clearAuth();
    updateAuthButton();
    closeUserMenu();

    // Appel API pour invalider côté serveur (on ignore les erreurs)
    try {
      await fetch(AUTH_CONFIG.apiBase + "/auth/logout.php", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + tokenToInvalidate,
        },
      });
    } catch (e) {
      // Ignorer les erreurs - la déconnexion locale est déjà faite
    }

    showNotification("Déconnexion réussie", "success");
  }

  // === UI: AUTH BUTTON ===
  function createAuthButton() {
    const btn = document.createElement("button");
    btn.id = "atlantis-auth-btn";
    btn.innerHTML = `
     <svg class="auth-icon" viewBox="0 0 24 24">
       <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
     </svg>
     <span>Se connecter</span>
   `;
    btn.onclick = handleAuthButtonClick;
    document.body.appendChild(btn);

    updateAuthButton();
  }

  function updateAuthButton() {
    const btn = document.getElementById("atlantis-auth-btn");
    if (!btn) return;

    if (currentUser) {
      const initials = getInitials(
        currentUser.first_name,
        currentUser.last_name
      );
      btn.classList.add("logged-in");
      btn.innerHTML = `
       <div class="auth-avatar">${initials}</div>
       <span>${currentUser.first_name || "Mon compte"}</span>
     `;
    } else {
      btn.classList.remove("logged-in");
      btn.innerHTML = `
       <svg class="auth-icon" viewBox="0 0 24 24">
         <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
       </svg>
       <span>Se connecter</span>
     `;
    }
  }

  function handleAuthButtonClick() {
    if (currentUser) {
      toggleUserMenu();
    } else {
      openAuthPopup();
    }
  }

  function getInitials(firstName, lastName) {
    const f = (firstName || "").charAt(0).toUpperCase();
    const l = (lastName || "").charAt(0).toUpperCase();
    return f + l || "?";
  }

  // === UI: AUTH POPUP ===
  function openAuthPopup() {
    closeUserMenu();

    const overlay = document.createElement("div");
    overlay.className = "atlantis-auth-overlay";
    overlay.onclick = (e) => {
      if (e.target === overlay) closeAuthPopup();
    };

    overlay.innerHTML = `
     <div class="atlantis-auth-popup">
       <div class="auth-header">
         <div class="auth-logo">
           <svg viewBox="0 0 24 24">
             <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
           </svg>
         </div>
         <h2 class="auth-title">Atlantis City</h2>
         <p class="auth-subtitle">Accédez à votre espace</p>
         <button class="auth-close" onclick="window.atlantisAuth.closePopup()">×</button>
         
         <div class="auth-tabs">
           <button class="auth-tab active" data-tab="login">Se connecter</button>
           <button class="auth-tab" data-tab="register">S'inscrire</button>
         </div>
       </div>

       <div class="auth-forms">
         <!-- Message -->
         <div class="auth-message" id="auth-message"></div>

         <!-- Login Form -->
         <form class="auth-form active" id="auth-login-form">
           <div class="auth-input-group">
             <label class="auth-label">Email</label>
             <input type="email" class="auth-input" name="email" placeholder="votre@email.com" required>
           </div>
           <div class="auth-input-group">
             <label class="auth-label">Mot de passe</label>
             <input type="password" class="auth-input" name="password" placeholder="••••••••" required>
           </div>
           <button type="submit" class="auth-submit">Se connecter</button>
         </form>

         <!-- Register Form -->
         <form class="auth-form" id="auth-register-form">
           <div class="auth-input-row">
             <div class="auth-input-group">
               <label class="auth-label">Prénom</label>
               <input type="text" class="auth-input" name="first_name" placeholder="Jean" required>
             </div>
             <div class="auth-input-group">
               <label class="auth-label">Nom</label>
               <input type="text" class="auth-input" name="last_name" placeholder="Dupont" required>
             </div>
           </div>
           <div class="auth-input-group">
             <label class="auth-label">Email</label>
             <input type="email" class="auth-input" name="email" placeholder="votre@email.com" required>
           </div>
           <div class="auth-input-group">
             <label class="auth-label">Société (optionnel)</label>
             <input type="text" class="auth-input" name="company" placeholder="Ma Société">
           </div>
           <div class="auth-input-group">
             <label class="auth-label">Mot de passe</label>
             <input type="password" class="auth-input" name="password" placeholder="6 caractères minimum" minlength="6" required>
           </div>
           <button type="submit" class="auth-submit">Créer mon compte</button>
         </form>
       </div>
     </div>
   `;

    document.body.appendChild(overlay);

    // Tab switching
    overlay.querySelectorAll(".auth-tab").forEach((tab) => {
      tab.onclick = () => switchTab(tab.dataset.tab);
    });

    // Form submissions
    document.getElementById("auth-login-form").onsubmit = handleLogin;
    document.getElementById("auth-register-form").onsubmit = handleRegister;
  }

  function closeAuthPopup() {
    const overlay = document.querySelector(".atlantis-auth-overlay");
    if (overlay) {
      overlay.style.opacity = "0";
      setTimeout(() => overlay.remove(), 300);
    }
  }

  function switchTab(tabName) {
    // Update tabs
    document.querySelectorAll(".auth-tab").forEach((tab) => {
      tab.classList.toggle("active", tab.dataset.tab === tabName);
    });

    // Update forms
    document.querySelectorAll(".auth-form").forEach((form) => {
      form.classList.remove("active");
    });
    document.getElementById(`auth-${tabName}-form`).classList.add("active");

    // Clear message
    hideMessage();
  }

  function showMessage(text, type = "error") {
    const msg = document.getElementById("auth-message");
    if (msg) {
      msg.textContent = text;
      msg.className = `auth-message show ${type}`;
    }
  }

  function hideMessage() {
    const msg = document.getElementById("auth-message");
    if (msg) {
      msg.className = "auth-message";
    }
  }

  // === FORM HANDLERS ===
  async function handleLogin(e) {
    e.preventDefault();
    const form = e.target;
    const btn = form.querySelector(".auth-submit");

    const email = form.email.value.trim();
    const password = form.password.value;

    btn.classList.add("loading");
    btn.disabled = true;

    const result = await login(email, password);

    btn.classList.remove("loading");
    btn.disabled = false;

    if (!result.success) {
      showMessage(result.error, "error");
    }
  }

  async function handleRegister(e) {
    e.preventDefault();
    const form = e.target;
    const btn = form.querySelector(".auth-submit");

    const data = {
      email: form.email.value.trim(),
      password: form.password.value,
      first_name: form.first_name.value.trim(),
      last_name: form.last_name.value.trim(),
      company: form.company.value.trim(),
    };

    btn.classList.add("loading");
    btn.disabled = true;

    const result = await register(data);

    btn.classList.remove("loading");
    btn.disabled = false;

    if (result.success) {
      showMessage(result.message, "success");
      form.reset();
      // Basculer vers l'onglet connexion après 2 secondes
      setTimeout(() => {
        switchTab("login");
      }, 2000);
    } else {
      showMessage(result.error, "error");
    }
  }

  // === UI: USER MENU ===
  function toggleUserMenu() {
    if (userMenuOpen) {
      closeUserMenu();
    } else {
      openUserMenu();
    }
  }

  function openUserMenu() {
    closeUserMenu(); // Fermer si déjà ouvert

    const menu = document.createElement("div");
    menu.className = "auth-user-menu";
    menu.id = "atlantis-user-menu";

    const roleLabel = getRoleLabel(currentUser.global_role);

    menu.innerHTML = `
     <div class="auth-user-header">
       <p class="auth-user-name">${currentUser.first_name} ${
      currentUser.last_name
    }</p>
       <p class="auth-user-email">${currentUser.email}</p>
       ${roleLabel ? `<span class="auth-user-role">${roleLabel}</span>` : ""}
     </div>
     <div class="auth-user-actions">
       <button class="auth-user-action" onclick="window.atlantisAuth.openProfile()">
         <svg viewBox="0 0 24 24"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 3c1.93 0 3.5 1.57 3.5 3.5S13.93 13 12 13s-3.5-1.57-3.5-3.5S10.07 6 12 6zm7 13H5v-.23c0-.62.28-1.2.76-1.58C7.47 15.82 9.64 15 12 15s4.53.82 6.24 2.19c.48.38.76.97.76 1.58V19z"/></svg>
         Mon profil
       </button>
       ${
         currentUser.global_role === "super_admin"
           ? `
       <button class="auth-user-action" onclick="window.atlantisAuth.openAdmin()">
         <svg viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>
         Administration
       </button>
       `
           : ""
       }
       <button class="auth-user-action logout" onclick="window.atlantisAuth.logout()">
         <svg viewBox="0 0 24 24"><path d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z"/></svg>
         Déconnexion
       </button>
     </div>
   `;

    document.body.appendChild(menu);
    userMenuOpen = true;

    // Fermer au clic extérieur
    setTimeout(() => {
      document.addEventListener("click", handleOutsideClick);
    }, 100);
  }

  function closeUserMenu() {
    const menu = document.getElementById("atlantis-user-menu");
    if (menu) {
      menu.remove();
    }
    userMenuOpen = false;
    document.removeEventListener("click", handleOutsideClick);
  }

  function handleOutsideClick(e) {
    const menu = document.getElementById("atlantis-user-menu");
    const btn = document.getElementById("atlantis-auth-btn");
    if (menu && !menu.contains(e.target) && !btn.contains(e.target)) {
      closeUserMenu();
    }
  }

  function getRoleLabel(role) {
    const labels = {
      super_admin: "Super Admin",
      space_admin: "Admin Espace",
      zone_admin: "Admin Zone",
      user: "",
    };
    return labels[role] || "";
  }

  // === NOTIFICATIONS ===
  function showNotification(text, type = "success") {
    // Créer une notification temporaire
    const notif = document.createElement("div");
    notif.style.cssText = `
     position: fixed;
     bottom: 30px;
     right: 30px;
     padding: 16px 24px;
     background: ${type === "success" ? "#10b981" : "#ef4444"};
     color: white;
     border-radius: 10px;
     font-size: 14px;
     font-weight: 600;
     z-index: 10002;
     box-shadow: 0 10px 40px rgba(0,0,0,0.3);
     animation: authNotifIn 0.3s ease;
   `;
    notif.textContent = text;

    // Ajouter l'animation CSS
    const style = document.createElement("style");
    style.textContent = `
     @keyframes authNotifIn {
       from { opacity: 0; transform: translateY(20px); }
       to { opacity: 1; transform: translateY(0); }
     }
   `;
    document.head.appendChild(style);

    document.body.appendChild(notif);

    setTimeout(() => {
      notif.style.opacity = "0";
      notif.style.transform = "translateY(20px)";
      notif.style.transition = "all 0.3s ease";
      setTimeout(() => notif.remove(), 300);
    }, 3000);
  }

  // === PUBLIC API ===
  window.atlantisAuth = {
    init: init,
    login: login,
    logout: logout,
    register: register,
    getUser: () => currentUser,
    getToken: () => authToken,
    isLoggedIn: () => !!currentUser,
    openPopup: openAuthPopup,
    closePopup: closeAuthPopup,
    openProfile: () => {
      closeUserMenu();
      console.log("TODO: Ouvrir profil");
      showNotification("Profil - Bientôt disponible", "success");
    },
    openAdmin: () => {
      closeUserMenu();
      window.open("https://compagnon.atlantis-city.com/crm/", "_blank");
    },
    refresh: checkAuth,
  };

  // === AUTO-INIT ===
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
