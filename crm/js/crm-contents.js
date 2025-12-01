/**
 * ============================================
 * 🖼️ CRM MODULE - CONTENTS
 * Gestion des contenus modifiables
 * ============================================
 */

(function() {
    'use strict';

    const CRM = window.CRM;
    const { CONFIG, state, apiCall } = CRM;

    // === LOAD CONTENTS ===
    async function loadContents() {
        const result = await apiCall('/admin/contents.php');
        state.data.contents = result.contents || [];

        const el = document.querySelector('#section-contents .crm-section-content');
        el.innerHTML = `
            <div class="crm-card">
                <div class="crm-card-header">
                    <h3 class="crm-card-title">🖼️ Contenus modifiables</h3>
                    <button class="crm-btn crm-btn-primary" onclick="window.CRM.createContent()">
                        ➕ Nouveau contenu
                    </button>
                </div>
                ${state.data.contents.length > 0 ? `
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
                            ${state.data.contents.map(content => `
                                <tr>
                                    <td>
                                        ${content.content_type === 'image' 
                                            ? `<img src="${content.content_value}" style="width:60px;height:40px;object-fit:cover;border-radius:4px;" onerror="this.src='data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%2260%22 height=%2240%22><rect fill=%22%23334155%22 width=%22100%%22 height=%22100%%22/><text x=%2250%%22 y=%2250%%22 fill=%22%2364748b%22 text-anchor=%22middle%22 dy=%22.3em%22 font-size=%2210%22>No img</text></svg>'">` 
                                            : '—'}
                                    </td>
                                    <td><code>${content.content_key}</code></td>
                                    <td>
                                        <span class="crm-badge crm-badge-primary">${content.space_name}</span>
                                        <span class="crm-badge crm-badge-info">${content.zone_name}</span>
                                    </td>
                                    <td>${content.content_type}</td>
                                    <td>
                                        <div style="display: flex; gap: 6px;">
                                            <button class="crm-btn crm-btn-sm crm-btn-secondary crm-btn-icon" onclick="window.CRM.editContent(${content.id})">
                                                ✏️
                                            </button>
                                            <button class="crm-btn crm-btn-sm crm-btn-danger crm-btn-icon" onclick="window.CRM.deleteContent(${content.id})">
                                                🗑️
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
                ` : '<div class="crm-empty"><p>Aucun contenu créé</p></div>'}
            </div>
        `;
    }

    // === CREATE CONTENT ===
    async function createContent() {
        const zonesRes = await apiCall('/admin/zones.php');
        const zones = zonesRes.zones || [];

        CRM.openModal('➕ Nouveau contenu', `
            <form id="create-content-form">
                <div class="crm-form-group">
                    <label class="crm-form-label">Zone</label>
                    <select class="crm-form-select" name="zone_id" required>
                        <option value="">Sélectionner une zone</option>
                        ${zones.map(z => `<option value="${z.id}">${z.space_name} → ${z.name}</option>`).join('')}
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
        `, `
            <button class="crm-btn crm-btn-secondary" onclick="window.CRM.closeModal()">Annuler</button>
            <button class="crm-btn crm-btn-primary" onclick="window.CRM.saveNewContent()">Créer</button>
        `);
    }

    async function saveNewContent() {
        const form = document.getElementById('create-content-form');
        const formData = new FormData(form);
        const data = Object.fromEntries(formData);

        try {
            await apiCall('/admin/contents.php', 'POST', data);
            CRM.showToast('Contenu créé', 'success');
            CRM.closeModal();
            loadContents();
        } catch (error) {
            CRM.showToast(error.message, 'error');
        }
    }

    // === EDIT CONTENT ===
    async function editContent(contentId) {
        const contentsRes = await apiCall('/admin/contents.php');
        const contents = contentsRes.contents || [];
        const content = contents.find(c => c.id == contentId);

        if (!content) {
            CRM.showToast('Contenu non trouvé', 'error');
            return;
        }

        CRM.openModal('✏️ Modifier le contenu', `
            <form id="edit-content-form">
                <input type="hidden" name="id" value="${content.id}">
                <div class="crm-form-group">
                    <label class="crm-form-label">Zone</label>
                    <input type="text" class="crm-form-input" value="${content.space_name} → ${content.zone_name}" disabled>
                </div>
                <div class="crm-form-group">
                    <label class="crm-form-label">Clé</label>
                    <input type="text" class="crm-form-input" value="${content.content_key}" disabled>
                </div>
                <div class="crm-form-group">
                    <label class="crm-form-label">Type</label>
                    <select class="crm-form-select" name="content_type">
                        <option value="image" ${content.content_type === 'image' ? 'selected' : ''}>Image</option>
                        <option value="texture" ${content.content_type === 'texture' ? 'selected' : ''}>Texture</option>
                        <option value="video" ${content.content_type === 'video' ? 'selected' : ''}>Vidéo</option>
                        <option value="url" ${content.content_type === 'url' ? 'selected' : ''}>URL</option>
                    </select>
                </div>
                <div class="crm-form-group">
                    <label class="crm-form-label">URL du contenu</label>
                    <input type="url" class="crm-form-input" name="content_value" value="${content.content_value}" required>
                </div>
                ${content.content_type === 'image' ? `
                    <div class="crm-form-group">
                        <label class="crm-form-label">Aperçu actuel</label>
                        <img src="${content.content_value}" style="max-width:100%;max-height:200px;border-radius:8px;" onerror="this.style.display='none'">
                    </div>
                ` : ''}
            </form>
        `, `
            <button class="crm-btn crm-btn-secondary" onclick="window.CRM.closeModal()">Annuler</button>
            <button class="crm-btn crm-btn-primary" onclick="window.CRM.saveContent()">Enregistrer</button>
        `);
    }

    async function saveContent() {
        const form = document.getElementById('edit-content-form');
        const formData = new FormData(form);
        const data = Object.fromEntries(formData);

        try {
            await apiCall('/admin/contents.php', 'PUT', data);
            CRM.showToast('Contenu mis à jour', 'success');
            CRM.closeModal();
            loadContents();
        } catch (error) {
            CRM.showToast(error.message, 'error');
        }
    }

    // === DELETE CONTENT ===
    async function deleteContent(contentId) {
        if (!confirm('Voulez-vous vraiment supprimer ce contenu ?')) return;

        try {
            await apiCall(`/admin/contents.php?id=${contentId}`, 'DELETE');
            CRM.showToast('Contenu supprimé', 'success');
            loadContents();
        } catch (error) {
            CRM.showToast(error.message, 'error');
        }
    }

    // === EXPOSE TO WINDOW.CRM ===
    Object.assign(CRM, {
        loadContents,
        createContent,
        saveNewContent,
        editContent,
        saveContent,
        deleteContent
    });

    console.log('✅ CRM Module Contents chargé');
})();
