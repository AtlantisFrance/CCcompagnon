/**
 * ============================================
 * 🚀 CRM MODULE - INIT
 * Navigation, logout et initialisation
 * ============================================
 */

(function() {
    'use strict';

    const CRM = window.CRM;
    const { CONFIG, state, apiCall, getToken, getUser, clearAuth } = CRM;

    // === NAVIGATION ===
    function navigateTo(section) {
        state.currentSection = section;

        // Update nav items
        document.querySelectorAll('.crm-nav-item').forEach(item => {
            item.classList.toggle('active', item.dataset.section === section);
        });

        // Update sections
        document.querySelectorAll('.crm-section').forEach(sec => {
            sec.classList.toggle('active', sec.id === `section-${section}`);
        });

        // Update header title
        const titles = {
            dashboard: { icon: '📊', text: 'Dashboard' },
            users: { icon: '👥', text: 'Utilisateurs' },
            spaces: { icon: '📦', text: 'Espaces' },
            zones: { icon: '📍', text: 'Zones' },
            roles: { icon: '🎭', text: 'Rôles' },
            contents: { icon: '🖼️', text: 'Contenus' },
            textures: { icon: '🎨', text: 'Textures PLV' },
            logs: { icon: '📝', text: 'Journal d\'activité' }
        };

        const title = titles[section] || { icon: '📋', text: section };
        document.querySelector('.crm-page-title').innerHTML = `
            <span class="icon">${title.icon}</span>
            <h2>${title.text}</h2>
        `;

        // Load data
        loadSectionData(section);
    }

    async function loadSectionData(section) {
        const contentEl = document.querySelector(`#section-${section} .crm-section-content`);
        if (contentEl) {
            contentEl.innerHTML = '<div class="crm-loading"><div class="crm-spinner"></div></div>';
        }

        try {
            switch (section) {
                case 'dashboard':
                    await CRM.loadDashboard();
                    break;
                case 'users':
                    await CRM.loadUsers();
                    break;
                case 'spaces':
                    await CRM.loadSpaces();
                    break;
                case 'zones':
                    await CRM.loadZones();
                    break;
                case 'roles':
                    await CRM.loadRoles();
                    break;
                case 'contents':
                    await CRM.loadContents();
                    break;
                case 'textures':
                    await CRM.loadTextures();
                    break;
                case 'logs':
                    await CRM.loadLogs();
                    break;
            }
        } catch (error) {
            CRM.showToast(error.message, 'error');
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

    // === LOGOUT ===
    async function logout() {
        try {
            await apiCall('/auth/logout.php', 'POST');
        } catch (e) {
            // Ignorer les erreurs
        }
        clearAuth();
        state.initialized = false;
        document.body.classList.remove('logged-in');
        document.body.classList.add('not-logged-in');
        CRM.showToast('Déconnexion réussie', 'success');
    }

    // === UPDATE SIDEBAR USER ===
    function updateSidebarUser() {
        if (!state.user) return;

        const avatarEl = document.getElementById('sidebar-avatar');
        const nameEl = document.getElementById('sidebar-name');
        const roleEl = document.getElementById('sidebar-role');
        const headerInfo = document.getElementById('header-user-info');

        if (avatarEl) {
            avatarEl.textContent = (state.user.first_name?.[0] || '') + (state.user.last_name?.[0] || '');
        }
        if (nameEl) {
            nameEl.textContent = `${state.user.first_name || ''} ${state.user.last_name || ''}`.trim() || 'Admin';
        }
        if (roleEl) {
            roleEl.textContent = state.user.global_role === 'super_admin' ? 'Super Admin' : 'Admin';
        }
        if (headerInfo) {
            headerInfo.textContent = `Connecté en tant que ${state.user.email}`;
        }
    }

    // === INIT ===
    function init() {
        // Éviter double init
        if (state.initialized) {
            console.log('CRM: Déjà initialisé');
            return;
        }

        state.token = getToken();
        state.user = getUser();

        // Vérifier auth
        if (!state.token || !state.user) {
            console.log('CRM: Non authentifié');
            document.body.classList.remove('logged-in', 'loading');
            document.body.classList.add('not-logged-in');
            return;
        }

        // Vérifier rôle
        if (state.user.global_role !== 'super_admin') {
            console.log('CRM: Pas super_admin');
            clearAuth();
            document.body.classList.remove('logged-in', 'loading');
            document.body.classList.add('not-logged-in');
            CRM.showToast('Accès refusé. Vous devez être Super Admin.', 'error');
            return;
        }

        console.log('CRM: Initialisation...', state.user.email);
        state.initialized = true;

        // Mettre à jour l'UI
        document.body.classList.remove('not-logged-in', 'loading');
        document.body.classList.add('logged-in');

        // Update sidebar user info
        updateSidebarUser();

        // Setup navigation
        document.querySelectorAll('.crm-nav-item').forEach(item => {
            item.addEventListener('click', () => navigateTo(item.dataset.section));
        });

        // Load dashboard
        navigateTo('dashboard');

        console.log('CRM: ✅ Prêt');
    }

    // === EXPOSE TO WINDOW.CRM ===
    Object.assign(CRM, {
        init,
        navigateTo,
        logout
    });

    // === AUTO-INIT ===
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            setTimeout(() => {
                if (document.body.classList.contains('logged-in')) {
                    init();
                }
            }, 100);
        });
    } else {
        setTimeout(() => {
            if (document.body.classList.contains('logged-in')) {
                init();
            }
        }, 100);
    }

    console.log('✅ CRM Module Init chargé');
})();
