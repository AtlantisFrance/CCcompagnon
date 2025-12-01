/**
 * ============================================
 * 🎛️ CRM ATLANTIS CITY - UI MODULE
 * Toast notifications, Modal, Dropdown menus
 * ============================================
 */

(function () {
  "use strict";

  const { state } = window.CRM;

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

  // === DROPDOWN USER MENU ===
  function toggleUserMenu(userId, event) {
    event.stopPropagation();

    document.querySelectorAll(".user-action-menu").forEach((m) => m.remove());

    if (state.openMenuId === userId) {
      state.openMenuId = null;
      return;
    }

    state.openMenuId = userId;

    const user = state.data.users.find((u) => u.id == userId);
    if (!user) return;

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

    const btn = event.currentTarget;
    const rect = btn.getBoundingClientRect();
    menu.style.cssText = `
      position: fixed;
      top: ${rect.bottom + 5}px;
      right: ${window.innerWidth - rect.right}px;
      z-index: 1000;
    `;

    document.body.appendChild(menu);

    setTimeout(() => {
      document.addEventListener("click", closeAllMenus);
    }, 10);
  }

  function closeAllMenus() {
    document.querySelectorAll(".user-action-menu").forEach((m) => m.remove());
    state.openMenuId = null;
    document.removeEventListener("click", closeAllMenus);
  }

  // === EXTEND CRM API ===
  Object.assign(window.CRM, {
    showToast,
    openModal,
    closeModal,
    toggleUserMenu,
    closeAllMenus,
  });

  console.log("✅ CRM UI loaded");
})();
