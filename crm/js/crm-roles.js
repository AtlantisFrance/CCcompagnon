/**
 * ============================================
 * 🎭 CRM MODULE - ROLES
 * Attribution des rôles
 * ============================================
 */

(function() {
    'use strict';

    const CRM = window.CRM;
    const { CONFIG, state, apiCall, getRoleBadge } = CRM;

    // === LOAD ROLES ===
    async function loadRoles() {
        const result = await apiCall('/admin/roles.php');
        state.data.roles = result.roles || [];

        const el = document.querySelector('#section-roles .crm-section-content');
        el.innerHTML = `
            <div class="crm-card">
                <div class="crm-card-header">
                    <h3 class="crm-card-title">🎭 Attribution des rôles</h3>
                    <button class="crm-btn crm-btn-primary" onclick="window.CRM.createRole()">
                        ➕ Assigner un rôle
                    </button>
                </div>
                ${state.data.roles.length > 0 ? `
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
                            ${state.data.roles.map(role => `
                                <tr>
                                    <td>
                                        <strong>${role.first_name} ${role.last_name}</strong>
                                        <div style="font-size: 12px; color: var(--text-muted);">${role.email}</div>
                                    </td>
                                    <td>
                                        <span class="crm-badge crm-badge-primary">${role.space_name}</span>
                                    </td>
                                    <td>
                                        ${role.zone_name 
                                            ? `<span class="crm-badge crm-badge-info">${role.zone_name}</span>` 
                                            : '<em style="color:var(--text-muted)">Tout l\'espace</em>'}
                                    </td>
                                    <td>
                                        <span class="crm-badge ${getRoleBadge(role.role)}">${role.role}</span>
                                    </td>
                                    <td>
                                        <button class="crm-btn crm-btn-sm crm-btn-danger crm-btn-icon" onclick="window.CRM.deleteRole(${role.id})">
                                            🗑️
                                        </button>
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
                ` : '<div class="crm-empty"><p>Aucun rôle assigné</p></div>'}
            </div>
        `;
    }

    // === CREATE ROLE ===
    async function createRole() {
        // Charger users et spaces pour les selects
        const [usersRes, spacesRes] = await Promise.all([
            apiCall('/admin/users.php'),
            apiCall('/admin/spaces.php')
        ]);

        const users = usersRes.users || [];
        const spaces = spacesRes.spaces || [];

        CRM.openModal('➕ Assigner un rôle', `
            <form id="create-role-form">
                <div class="crm-form-group">
                    <label class="crm-form-label">Utilisateur</label>
                    <select class="crm-form-select" name="user_id" required>
                        <option value="">Sélectionner un utilisateur</option>
                        ${users.map(u => `<option value="${u.id}">${u.first_name} ${u.last_name} (${u.email})</option>`).join('')}
                    </select>
                </div>
                <div class="crm-form-group">
                    <label class="crm-form-label">Espace</label>
                    <select class="crm-form-select" name="space_id" required onchange="window.CRM.onSpaceChangeForRole(this.value)">
                        <option value="">Sélectionner un espace</option>
                        ${spaces.map(s => `<option value="${s.id}">${s.name}</option>`).join('')}
                    </select>
                </div>
                <div class="crm-form-group">
                    <label class="crm-form-label">Rôle</label>
                    <select class="crm-form-select" name="role" required onchange="window.CRM.onRoleTypeChange(this.value)">
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
        `, `
            <button class="crm-btn crm-btn-secondary" onclick="window.CRM.closeModal()">Annuler</button>
            <button class="crm-btn crm-btn-primary" onclick="window.CRM.saveNewRole()">Assigner</button>
        `);
    }

    async function saveNewRole() {
        const form = document.getElementById('create-role-form');
        const formData = new FormData(form);
        const data = Object.fromEntries(formData);

        if (!data.zone_id) delete data.zone_id;

        try {
            await apiCall('/admin/roles.php', 'POST', data);
            CRM.showToast('Rôle assigné', 'success');
            CRM.closeModal();
            loadRoles();
        } catch (error) {
            CRM.showToast(error.message, 'error');
        }
    }

    // === DELETE ROLE ===
    async function deleteRole(roleId) {
        if (!confirm('Voulez-vous vraiment supprimer ce rôle ?')) return;

        try {
            await apiCall(`/admin/roles.php?id=${roleId}`, 'DELETE');
            CRM.showToast('Rôle supprimé', 'success');
            loadRoles();
        } catch (error) {
            CRM.showToast(error.message, 'error');
        }
    }

    // === EXPOSE TO WINDOW.CRM ===
    Object.assign(CRM, {
        loadRoles,
        createRole,
        saveNewRole,
        deleteRole
    });

    console.log('✅ CRM Module Roles chargé');
})();
