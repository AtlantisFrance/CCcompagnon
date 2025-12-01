/**
 * ============================================
 * 📍 CRM MODULE - ZONES
 * Gestion des zones
 * ============================================
 */

(function() {
    'use strict';

    const CRM = window.CRM;
    const { CONFIG, state, apiCall } = CRM;

    // === LOAD ZONES ===
    async function loadZones() {
        const result = await apiCall('/admin/zones.php');
        state.data.zones = result.zones || [];

        const el = document.querySelector('#section-zones .crm-section-content');
        el.innerHTML = `
            <div class="crm-card">
                <div class="crm-card-header">
                    <h3 class="crm-card-title">📍 Toutes les zones</h3>
                </div>
                ${state.data.zones.length > 0 ? `
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
                            ${state.data.zones.map(zone => `
                                <tr>
                                    <td><strong>${zone.name}</strong></td>
                                    <td>
                                        <span class="crm-badge crm-badge-primary">${zone.space_name}</span>
                                    </td>
                                    <td><code>${zone.slug}</code></td>
                                    <td>${zone.content_count || 0}</td>
                                    <td>
                                        <div style="display: flex; gap: 6px;">
                                            <button class="crm-btn crm-btn-sm crm-btn-secondary crm-btn-icon" onclick="window.CRM.editZone(${zone.id})">
                                                ✏️
                                            </button>
                                            <button class="crm-btn crm-btn-sm crm-btn-danger crm-btn-icon" onclick="window.CRM.deleteZone(${zone.id})">
                                                🗑️
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
                ` : '<div class="crm-empty"><p>Aucune zone créée</p></div>'}
            </div>
        `;
    }

    // === CREATE ZONE ===
    async function createZone(spaceId) {
        CRM.openModal('➕ Nouvelle zone', `
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
        `, `
            <button class="crm-btn crm-btn-secondary" onclick="window.CRM.closeModal()">Annuler</button>
            <button class="crm-btn crm-btn-primary" onclick="window.CRM.saveNewZone()">Créer</button>
        `);
    }

    async function saveNewZone() {
        const form = document.getElementById('create-zone-form');
        const formData = new FormData(form);
        const data = Object.fromEntries(formData);

        try {
            await apiCall('/admin/zones.php', 'POST', data);
            CRM.showToast('Zone créée', 'success');
            CRM.closeModal();
            CRM.loadSpaces();
        } catch (error) {
            CRM.showToast(error.message, 'error');
        }
    }

    // === EDIT ZONE ===
    async function editZone(zoneId) {
        const result = await apiCall(`/admin/zones.php?id=${zoneId}`);
        const zone = result.zone || result;

        CRM.openModal('✏️ Modifier la zone', `
            <form id="edit-zone-form">
                <input type="hidden" name="id" value="${zone.id}">
                <div class="crm-form-group">
                    <label class="crm-form-label">Espace</label>
                    <input type="text" class="crm-form-input" value="${zone.space_name || ''}" disabled>
                </div>
                <div class="crm-form-group">
                    <label class="crm-form-label">Slug</label>
                    <input type="text" class="crm-form-input" value="${zone.slug}" disabled>
                </div>
                <div class="crm-form-group">
                    <label class="crm-form-label">Nom</label>
                    <input type="text" class="crm-form-input" name="name" value="${zone.name}" required>
                </div>
                <div class="crm-form-group">
                    <label class="crm-form-label">Description</label>
                    <textarea class="crm-form-textarea" name="description">${zone.description || ''}</textarea>
                </div>
                <div class="crm-form-group">
                    <label class="crm-form-label">
                        <input type="checkbox" name="is_active" ${zone.is_active ? 'checked' : ''}>
                        Zone active
                    </label>
                </div>
            </form>
        `, `
            <button class="crm-btn crm-btn-secondary" onclick="window.CRM.closeModal()">Annuler</button>
            <button class="crm-btn crm-btn-primary" onclick="window.CRM.saveZone()">Enregistrer</button>
        `);
    }

    async function saveZone() {
        const form = document.getElementById('edit-zone-form');
        const formData = new FormData(form);
        const data = Object.fromEntries(formData);
        data.is_active = form.querySelector('[name="is_active"]').checked;

        try {
            await apiCall('/admin/zones.php', 'PUT', data);
            CRM.showToast('Zone mise à jour', 'success');
            CRM.closeModal();
            CRM.loadSpaces();
            loadZones();
        } catch (error) {
            CRM.showToast(error.message, 'error');
        }
    }

    // === DELETE ZONE ===
    async function deleteZone(zoneId) {
        if (!confirm('Voulez-vous vraiment supprimer cette zone ?')) return;

        try {
            await apiCall(`/admin/zones.php?id=${zoneId}`, 'DELETE');
            CRM.showToast('Zone supprimée', 'success');
            CRM.loadSpaces();
        } catch (error) {
            CRM.showToast(error.message, 'error');
        }
    }

    // === EXPOSE TO WINDOW.CRM ===
    Object.assign(CRM, {
        loadZones,
        createZone,
        saveNewZone,
        editZone,
        saveZone,
        deleteZone
    });

    console.log('✅ CRM Module Zones chargé');
})();
