/**
 * ============================================
 * 📝 CRM MODULE - LOGS
 * Journal d'activité
 * ============================================
 */

(function() {
    'use strict';

    const CRM = window.CRM;
    const { CONFIG, state, apiCall, formatDate, getActivityIcon, getActivityColor } = CRM;

    // === LOAD LOGS ===
    async function loadLogs() {
        const result = await apiCall('/admin/logs.php?limit=100');
        state.data.logs = result.logs || [];

        const el = document.querySelector('#section-logs .crm-section-content');
        el.innerHTML = `
            <div class="crm-card">
                <div class="crm-card-header">
                    <h3 class="crm-card-title">📝 Journal d'activité</h3>
                </div>
                ${state.data.logs.length > 0 ? `
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
                            ${state.data.logs.map(log => `
                                <tr>
                                    <td>${formatDate(log.created_at)}</td>
                                    <td>${log.first_name ? `${log.first_name} ${log.last_name}` : 'Système'}</td>
                                    <td>
                                        <span class="crm-badge ${getActivityColor(log.action)}">
                                            ${getActivityIcon(log.action)} ${log.action}
                                        </span>
                                    </td>
                                    <td style="max-width:300px;overflow:hidden;text-overflow:ellipsis;">
                                        ${log.details ? JSON.stringify(log.details).substring(0, 100) : '—'}
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
                ` : '<div class="crm-empty"><p>Aucune activité enregistrée</p></div>'}
            </div>
        `;
    }

    // === EXPOSE TO WINDOW.CRM ===
    Object.assign(CRM, {
        loadLogs
    });

    console.log('✅ CRM Module Logs chargé');
})();
