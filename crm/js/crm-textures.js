/**
 * ============================================
 * 🎨 CRM MODULE - TEXTURES / PLV
 * Gestion des projets PLV et textures Shapespark
 * ============================================
 */

(function() {
    'use strict';

    const CRM = window.CRM;
    const { CONFIG, state, apiCall, apiUpload } = CRM;

    // === PLV STYLES (injected once) ===
    const PLV_STYLES = `
        .plv-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
            gap: 20px;
        }
        .plv-project-card {
            background: var(--bg-card);
            border: 1px solid var(--border-color);
            border-radius: var(--radius-lg);
            overflow: hidden;
            transition: all 0.3s ease;
        }
        .plv-project-card:hover {
            border-color: var(--accent-primary);
            box-shadow: var(--shadow-glow);
        }
        .plv-project-header {
            padding: 16px 20px;
            background: var(--bg-tertiary);
            border-bottom: 1px solid var(--border-color);
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        .plv-project-title {
            font-weight: 600;
            font-size: 16px;
        }
        .plv-project-id {
            font-size: 12px;
            color: var(--text-muted);
            font-family: monospace;
        }
        .plv-project-body {
            padding: 16px 20px;
        }
        .plv-project-meta {
            display: flex;
            gap: 12px;
            flex-wrap: wrap;
            margin-bottom: 12px;
        }
        .plv-project-stats {
            display: flex;
            gap: 20px;
            padding: 12px 0;
            border-top: 1px solid var(--border-color);
            margin-top: 12px;
        }
        .plv-stat {
            text-align: center;
            flex: 1;
        }
        .plv-stat-value {
            font-size: 24px;
            font-weight: 700;
            color: var(--accent-primary);
        }
        .plv-stat-label {
            font-size: 11px;
            color: var(--text-muted);
            text-transform: uppercase;
        }
        .plv-project-actions {
            display: flex;
            gap: 8px;
            padding: 16px 20px;
            background: var(--bg-tertiary);
            border-top: 1px solid var(--border-color);
        }
        .plv-slot-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
            gap: 12px;
            margin-top: 16px;
        }
        .plv-slot-card {
            background: var(--bg-tertiary);
            border: 2px dashed var(--border-color);
            border-radius: 12px;
            padding: 12px;
            text-align: center;
            cursor: pointer;
            transition: all 0.2s ease;
            position: relative;
        }
        .plv-slot-card:hover {
            border-color: var(--accent-primary);
            background: var(--bg-hover);
        }
        .plv-slot-card.has-image {
            border-style: solid;
            border-color: var(--success);
        }
        .plv-slot-preview {
            width: 100%;
            aspect-ratio: 1;
            background: var(--bg-secondary);
            border-radius: 8px;
            margin-bottom: 8px;
            display: flex;
            align-items: center;
            justify-content: center;
            overflow: hidden;
        }
        .plv-slot-preview img {
            width: 100%;
            height: 100%;
            object-fit: cover;
        }
        .plv-slot-preview .placeholder {
            font-size: 32px;
            opacity: 0.3;
        }
        .plv-slot-label {
            font-size: 12px;
            font-weight: 600;
            color: var(--text-primary);
        }
        .plv-slot-shader {
            font-size: 10px;
            color: var(--text-muted);
            font-family: monospace;
        }
        .plv-format-section {
            margin-bottom: 24px;
        }
        .plv-format-title {
            font-size: 14px;
            font-weight: 600;
            color: var(--text-secondary);
            margin-bottom: 12px;
            display: flex;
            align-items: center;
            gap: 8px;
        }
        .plv-summary-row {
            display: flex;
            gap: 8px;
            padding: 8px 12px;
            background: var(--bg-tertiary);
            border-radius: 8px;
            font-size: 13px;
        }
        .plv-summary-row span {
            color: var(--text-muted);
        }
        .plv-summary-row strong {
            color: var(--accent-primary);
        }
    `;

    // === LOAD TEXTURES ===
    async function loadTextures() {
        const [spacesRes, projectsRes] = await Promise.all([
            apiCall('/admin/spaces.php'),
            apiCall('/plv/projects.php')
        ]);

        const spaces = spacesRes.spaces || [];
        const projects = projectsRes.projects || [];
        state.plvProjects = projects;

        const el = document.querySelector('#section-textures .crm-section-content');
        el.innerHTML = `
            <style>${PLV_STYLES}</style>

            <div class="crm-card">
                <div class="crm-card-header">
                    <h3 class="crm-card-title">🎨 Projets PLV / Textures</h3>
                    <button class="crm-btn crm-btn-primary" onclick="window.CRM.createPLVProject()">
                        ➕ Nouveau projet PLV
                    </button>
                </div>

                ${projects.length > 0 ? `
                    <div class="plv-grid" style="padding: 20px;">
                        ${projects.map(project => `
                            <div class="plv-project-card">
                                <div class="plv-project-header">
                                    <div>
                                        <div class="plv-project-title">${project.name}</div>
                                        <div class="plv-project-id">${project.folder_name}</div>
                                    </div>
                                    <span class="crm-badge ${project.is_active ? 'crm-badge-success' : 'crm-badge-danger'}">
                                        ${project.is_active ? 'Actif' : 'Inactif'}
                                    </span>
                                </div>
                                <div class="plv-project-body">
                                    <div class="plv-project-meta">
                                        <span class="crm-badge crm-badge-primary">${project.space_name || '—'}</span>
                                        ${project.zone_name ? `<span class="crm-badge crm-badge-info">${project.zone_name}</span>` : ''}
                                    </div>
                                    ${project.description ? `<p style="font-size: 13px; color: var(--text-muted); margin: 0;">${project.description}</p>` : ''}
                                    <div class="plv-project-stats">
                                        <div class="plv-stat">
                                            <div class="plv-stat-value">${project.total_slots || 0}</div>
                                            <div class="plv-stat-label">Total slots</div>
                                        </div>
                                        <div class="plv-stat">
                                            <div class="plv-stat-value" style="color: var(--success);">${project.uploaded_slots || 0}</div>
                                            <div class="plv-stat-label">Uploadés</div>
                                        </div>
                                    </div>
                                </div>
                                <div class="plv-project-actions">
                                    <button class="crm-btn crm-btn-sm crm-btn-primary" onclick="window.CRM.managePLVProject(${project.id})" style="flex: 1;">
                                        🎨 Gérer les textures
                                    </button>
                                    <button class="crm-btn crm-btn-sm crm-btn-danger crm-btn-icon" onclick="window.CRM.deletePLVProject(${project.id})" title="Supprimer">
                                        🗑️
                                    </button>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                ` : `
                    <div class="crm-empty" style="padding: 60px 20px;">
                        <div style="font-size: 64px; margin-bottom: 20px;">🎨</div>
                        <h3 style="margin-bottom: 8px;">Aucun projet PLV</h3>
                        <p style="color: var(--text-muted); margin-bottom: 20px;">Créez votre premier projet pour commencer à gérer les textures Shapespark.</p>
                        <button class="crm-btn crm-btn-primary" onclick="window.CRM.createPLVProject()">
                            ➕ Créer un projet PLV
                        </button>
                    </div>
                `}
            </div>
        `;
    }

    // === CREATE PLV PROJECT ===
    async function createPLVProject() {
        const spacesRes = await apiCall('/admin/spaces.php');
        const spaces = spacesRes.spaces || [];

        CRM.openModal('➕ Nouveau projet PLV', `
            <form id="create-plv-form">
                <div class="crm-form-group">
                    <label class="crm-form-label">Nom du projet</label>
                    <input type="text" class="crm-form-input" name="name" placeholder="Showroom Principal" required>
                </div>
                
                <div class="crm-form-group">
                    <label class="crm-form-label">Description (optionnel)</label>
                    <textarea class="crm-form-textarea" name="description" placeholder="Description du projet..."></textarea>
                </div>
                
                <div class="crm-form-row">
                    <div class="crm-form-group">
                        <label class="crm-form-label">Espace Shapespark</label>
                        <select class="crm-form-select" name="space_id" required onchange="window.CRM.onPLVSpaceChange(this.value)">
                            <option value="">-- Sélectionner --</option>
                            ${spaces.map(s => `<option value="${s.id}">${s.name}</option>`).join('')}
                        </select>
                    </div>
                    <div class="crm-form-group">
                        <label class="crm-form-label">Zone (optionnel)</label>
                        <select class="crm-form-select" name="zone_id" id="plv-zone-select">
                            <option value="">Tout l'espace</option>
                        </select>
                    </div>
                </div>
                
                <div style="background: var(--bg-tertiary); padding: 20px; border-radius: 12px; margin-top: 20px;">
                    <h4 style="margin: 0 0 16px; font-size: 14px; color: var(--text-secondary);">📐 Configuration des slots</h4>
                    
                    <div class="crm-form-row">
                        <div class="crm-form-group" style="margin-bottom: 0;">
                            <label class="crm-form-label">Carrés opaques</label>
                            <input type="number" class="crm-form-input" name="carre_opaque" value="0" min="0" max="100" onchange="window.CRM.updatePLVSummary()">
                        </div>
                        <div class="crm-form-group" style="margin-bottom: 0;">
                            <label class="crm-form-label">Carrés transparents</label>
                            <input type="number" class="crm-form-input" name="carre_transparent" value="0" min="0" max="100" onchange="window.CRM.updatePLVSummary()">
                        </div>
                    </div>
                    
                    <div class="crm-form-row" style="margin-top: 16px;">
                        <div class="crm-form-group" style="margin-bottom: 0;">
                            <label class="crm-form-label">Portraits opaques</label>
                            <input type="number" class="crm-form-input" name="portrait_opaque" value="0" min="0" max="100" onchange="window.CRM.updatePLVSummary()">
                        </div>
                        <div class="crm-form-group" style="margin-bottom: 0;">
                            <label class="crm-form-label">Portraits transparents</label>
                            <input type="number" class="crm-form-input" name="portrait_transparent" value="0" min="0" max="100" onchange="window.CRM.updatePLVSummary()">
                        </div>
                    </div>
                    
                    <div class="crm-form-row" style="margin-top: 16px;">
                        <div class="crm-form-group" style="margin-bottom: 0;">
                            <label class="crm-form-label">Paysages opaques</label>
                            <input type="number" class="crm-form-input" name="paysage_opaque" value="0" min="0" max="100" onchange="window.CRM.updatePLVSummary()">
                        </div>
                        <div class="crm-form-group" style="margin-bottom: 0;">
                            <label class="crm-form-label">Paysages transparents</label>
                            <input type="number" class="crm-form-input" name="paysage_transparent" value="0" min="0" max="100" onchange="window.CRM.updatePLVSummary()">
                        </div>
                    </div>
                    
                    <div id="plv-summary" class="plv-summary-row" style="margin-top: 16px;">
                        <span>Total:</span> <strong>0 slots</strong>
                    </div>
                </div>
            </form>
        `, `
            <button class="crm-btn crm-btn-secondary" onclick="window.CRM.closeModal()">Annuler</button>
            <button class="crm-btn crm-btn-primary" onclick="window.CRM.saveNewPLVProject()">🎨 Créer le projet</button>
        `);
    }

    async function onPLVSpaceChange(spaceId) {
        const zoneSelect = document.getElementById('plv-zone-select');
        if (!spaceId) {
            zoneSelect.innerHTML = '<option value="">Tout l\'espace</option>';
            return;
        }

        try {
            const result = await apiCall(`/admin/zones.php?space_id=${spaceId}`);
            const zones = result.zones || [];
            zoneSelect.innerHTML = `
                <option value="">Tout l'espace</option>
                ${zones.map(z => `<option value="${z.id}">${z.name}</option>`).join('')}
            `;
        } catch (error) {
            console.error('Error loading zones:', error);
        }
    }

    function updatePLVSummary() {
        const form = document.getElementById('create-plv-form');
        if (!form) return;

        const getValue = (name) => parseInt(form.querySelector(`[name="${name}"]`)?.value || 0);

        const total = getValue('carre_opaque') + getValue('carre_transparent') +
                      getValue('portrait_opaque') + getValue('portrait_transparent') +
                      getValue('paysage_opaque') + getValue('paysage_transparent');

        const summaryEl = document.getElementById('plv-summary');
        if (summaryEl) {
            summaryEl.innerHTML = `<span>Total:</span> <strong>${total} slot${total > 1 ? 's' : ''}</strong>`;
        }
    }

    async function saveNewPLVProject() {
        const form = document.getElementById('create-plv-form');
        const formData = new FormData(form);
        const data = Object.fromEntries(formData);

        // Construire l'objet slots_config
        data.slots_config = {
            carre_opaque: parseInt(data.carre_opaque) || 0,
            carre_transparent: parseInt(data.carre_transparent) || 0,
            portrait_opaque: parseInt(data.portrait_opaque) || 0,
            portrait_transparent: parseInt(data.portrait_transparent) || 0,
            paysage_opaque: parseInt(data.paysage_opaque) || 0,
            paysage_transparent: parseInt(data.paysage_transparent) || 0
        };

        // Nettoyer les champs individuels
        delete data.carre_opaque;
        delete data.carre_transparent;
        delete data.portrait_opaque;
        delete data.portrait_transparent;
        delete data.paysage_opaque;
        delete data.paysage_transparent;

        // Vérifier qu'il y a au moins un slot
        const totalSlots = Object.values(data.slots_config).reduce((a, b) => a + b, 0);
        if (totalSlots === 0) {
            CRM.showToast('Veuillez configurer au moins un slot', 'warning');
            return;
        }

        try {
            await apiCall('/plv/projects.php', 'POST', data);
            CRM.showToast('Projet PLV créé avec succès', 'success');
            CRM.closeModal();
            loadTextures();
        } catch (error) {
            CRM.showToast(error.message, 'error');
        }
    }

    // === MANAGE PLV PROJECT ===
    async function managePLVProject(projectId) {
        try {
            const result = await apiCall(`/plv/projects.php?id=${projectId}`);
            const project = result.project || result;
            state.currentPLVProject = project;

            const slotsRes = await apiCall(`/plv/slots.php?project_id=${projectId}`);
            const slots = slotsRes;

            CRM.openModal(`🎨 ${project.name}`, `
                <style>${PLV_STYLES}</style>
                <div style="max-height: 70vh; overflow-y: auto;">
                    <div style="display: flex; gap: 12px; margin-bottom: 20px;">
                        <span class="crm-badge crm-badge-primary">${project.space_name || '—'}</span>
                        ${project.zone_name ? `<span class="crm-badge crm-badge-info">${project.zone_name}</span>` : ''}
                        <span class="crm-badge" style="background: rgba(99, 102, 241, 0.2); color: #818cf8;">${project.folder_name}</span>
                    </div>
                    
                    ${slots.carres && slots.carres.length > 0 ? `
                        <div class="plv-format-section">
                            <div class="plv-format-title">
                                <span>⬛</span> Carrés (${slots.carres.length})
                            </div>
                            <div class="plv-slot-grid">
                                ${slots.carres.map(slot => renderSlotCard(slot, project)).join('')}
                            </div>
                        </div>
                    ` : ''}
                    
                    ${slots.portraits && slots.portraits.length > 0 ? `
                        <div class="plv-format-section">
                            <div class="plv-format-title">
                                <span>📱</span> Portraits (${slots.portraits.length})
                            </div>
                            <div class="plv-slot-grid">
                                ${slots.portraits.map(slot => renderSlotCard(slot, project)).join('')}
                            </div>
                        </div>
                    ` : ''}
                    
                    ${slots.paysages && slots.paysages.length > 0 ? `
                        <div class="plv-format-section">
                            <div class="plv-format-title">
                                <span>🖼️</span> Paysages (${slots.paysages.length})
                            </div>
                            <div class="plv-slot-grid">
                                ${slots.paysages.map(slot => renderSlotCard(slot, project)).join('')}
                            </div>
                        </div>
                    ` : ''}
                </div>
                
                <input type="file" id="plv-upload-input" accept="image/jpeg,image/png,image/webp" style="display: none;" onchange="window.CRM.handlePLVUpload(event)">
            `, `
                <button class="crm-btn crm-btn-secondary" onclick="window.CRM.closeModal()">Fermer</button>
            `);
        } catch (error) {
            CRM.showToast(error.message, 'error');
        }
    }

    function renderSlotCard(slot, project) {
        const imageUrl = slot.is_uploaded 
            ? `https://compagnon.atlantis-city.com/plv/${project.folder_name}/${slot.filename}?v=${Date.now()}`
            : null;

        const transparentIcon = slot.is_transparent ? '🔲' : '⬛';

        return `
            <div class="plv-slot-card ${slot.is_uploaded ? 'has-image' : ''}" 
                 onclick="window.CRM.triggerPLVUpload(${slot.id})"
                 title="Cliquer pour uploader">
                <div class="plv-slot-preview">
                    ${imageUrl 
                        ? `<img src="${imageUrl}" alt="${slot.label}">` 
                        : `<span class="placeholder">📷</span>`}
                </div>
                <div class="plv-slot-label">${transparentIcon} ${slot.label}</div>
                <div class="plv-slot-shader">${slot.shader_name}</div>
            </div>
        `;
    }

    function triggerPLVUpload(slotId) {
        const input = document.getElementById('plv-upload-input');
        if (input) {
            input.dataset.slotId = slotId;
            input.click();
        }
    }

    async function handlePLVUpload(event) {
        const file = event.target.files[0];
        if (!file) return;

        const slotId = event.target.dataset.slotId;
        if (!slotId) {
            CRM.showToast('Erreur: slot non identifié', 'error');
            return;
        }

        // Vérifier le type
        const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
        if (!allowedTypes.includes(file.type)) {
            CRM.showToast('Format non supporté. Utilisez JPG, PNG ou WebP.', 'error');
            return;
        }

        // Vérifier la taille (10 Mo max)
        if (file.size > 10 * 1024 * 1024) {
            CRM.showToast('Fichier trop volumineux (max 10 Mo)', 'error');
            return;
        }

        const formData = new FormData();
        formData.append('slot_id', slotId);
        formData.append('image', file);

        try {
            CRM.showToast('Upload en cours...', 'info');
            await apiUpload('/plv/upload.php', formData);
            CRM.showToast('Image uploadée avec succès', 'success');

            // Rafraîchir la modal
            if (state.currentPLVProject) {
                managePLVProject(state.currentPLVProject.id);
            }
        } catch (error) {
            CRM.showToast(error.message, 'error');
        }

        // Reset input
        event.target.value = '';
    }

    // === DELETE PLV PROJECT ===
    async function deletePLVProject(projectId) {
        if (!confirm('Voulez-vous vraiment supprimer ce projet PLV ?\n\nToutes les images uploadées seront supprimées.')) return;

        try {
            await apiCall(`/plv/projects.php?id=${projectId}`, 'DELETE');
            CRM.showToast('Projet PLV supprimé', 'success');
            loadTextures();
        } catch (error) {
            CRM.showToast(error.message, 'error');
        }
    }

    // === EXPOSE TO WINDOW.CRM ===
    Object.assign(CRM, {
        loadTextures,
        createPLVProject,
        onPLVSpaceChange,
        updatePLVSummary,
        saveNewPLVProject,
        managePLVProject,
        triggerPLVUpload,
        handlePLVUpload,
        deletePLVProject
    });

    console.log('✅ CRM Module Textures chargé');
})();
