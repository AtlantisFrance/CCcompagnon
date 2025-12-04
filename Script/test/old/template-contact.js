/**
 * ============================================
 * 📇 TEMPLATE CONTACT - Générateur JS/CSS natif
 * ============================================
 *
 * Génère les fichiers popup_xxx.js et popup_xxx.css
 * pour le template contact.
 *
 * Usage:
 *   const { js, css } = window.atlantisTemplates.contact.generate(config, objectName);
 */

(function () {
  "use strict";

  // === GÉNÉRATEUR CSS ===
  function generateCSS(config, objectName) {
    const primaryColor = config.primaryColor || "#1a1a2e";
    const accentColor = config.accentColor || "#4a90d9";
    const textColor = config.textColor || "#ffffff";

    return `
/* ============================================
   Popup Contact - ${objectName}
   Généré automatiquement par Atlantis CRM
   ============================================ */

.popup-${objectName}-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.75);
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 10000;
    opacity: 0;
    visibility: hidden;
    transition: opacity 0.3s ease, visibility 0.3s ease;
}

.popup-${objectName}-overlay.active {
    opacity: 1;
    visibility: visible;
}

.popup-${objectName}-container {
    background: linear-gradient(145deg, ${primaryColor} 0%, ${adjustColor(
      primaryColor,
      -20
    )} 100%);
    border-radius: 20px;
    padding: 30px;
    width: 400px;
    max-width: 90vw;
    max-height: 85vh;
    overflow-y: auto;
    box-shadow: 0 25px 80px rgba(0, 0, 0, 0.5),
                0 0 40px ${accentColor}33,
                inset 0 1px 0 rgba(255, 255, 255, 0.1);
    border: 1px solid rgba(255, 255, 255, 0.1);
    transform: scale(0.9) translateY(20px);
    transition: transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
    position: relative;
}

.popup-${objectName}-overlay.active .popup-${objectName}-container {
    transform: scale(1) translateY(0);
}

/* Header */
.popup-${objectName}-header {
    text-align: center;
    margin-bottom: 25px;
}

.popup-${objectName}-avatar {
    width: 100px;
    height: 100px;
    border-radius: 50%;
    margin: 0 auto 15px;
    border: 3px solid ${accentColor};
    box-shadow: 0 0 20px ${accentColor}66;
    object-fit: cover;
    animation: popup-${objectName}-pulse 2s ease-in-out infinite;
}

@keyframes popup-${objectName}-pulse {
    0%, 100% { box-shadow: 0 0 20px ${accentColor}66; }
    50% { box-shadow: 0 0 30px ${accentColor}99; }
}

.popup-${objectName}-name {
    font-size: 24px;
    font-weight: 700;
    color: ${textColor};
    margin: 0 0 5px;
    letter-spacing: -0.5px;
}

.popup-${objectName}-title {
    font-size: 14px;
    color: ${accentColor};
    margin: 0;
    text-transform: uppercase;
    letter-spacing: 1px;
}

/* Liens contact */
.popup-${objectName}-links {
    display: flex;
    flex-direction: column;
    gap: 12px;
}

.popup-${objectName}-link {
    display: flex;
    align-items: center;
    gap: 15px;
    padding: 14px 18px;
    background: rgba(255, 255, 255, 0.08);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 12px;
    color: ${textColor};
    text-decoration: none;
    transition: all 0.3s ease;
    opacity: 0;
    transform: translateX(-20px);
}

.popup-${objectName}-overlay.active .popup-${objectName}-link {
    opacity: 1;
    transform: translateX(0);
}

.popup-${objectName}-link:nth-child(1) { transition-delay: 0.1s; }
.popup-${objectName}-link:nth-child(2) { transition-delay: 0.15s; }
.popup-${objectName}-link:nth-child(3) { transition-delay: 0.2s; }
.popup-${objectName}-link:nth-child(4) { transition-delay: 0.25s; }
.popup-${objectName}-link:nth-child(5) { transition-delay: 0.3s; }
.popup-${objectName}-link:nth-child(6) { transition-delay: 0.35s; }

.popup-${objectName}-link:hover {
    background: ${accentColor}33;
    border-color: ${accentColor}66;
    transform: translateX(5px);
}

.popup-${objectName}-link-icon {
    width: 24px;
    height: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 18px;
    flex-shrink: 0;
}

.popup-${objectName}-link-content {
    flex: 1;
    min-width: 0;
}

.popup-${objectName}-link-label {
    font-size: 11px;
    color: rgba(255, 255, 255, 0.5);
    text-transform: uppercase;
    letter-spacing: 0.5px;
    margin-bottom: 2px;
}

.popup-${objectName}-link-value {
    font-size: 14px;
    font-weight: 500;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

/* Bouton fermer */
.popup-${objectName}-close {
    position: absolute;
    top: 15px;
    right: 15px;
    width: 32px;
    height: 32px;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.1);
    border: none;
    color: rgba(255, 255, 255, 0.6);
    font-size: 20px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s ease;
}

.popup-${objectName}-close:hover {
    background: rgba(255, 255, 255, 0.2);
    color: rgba(255, 255, 255, 0.9);
}

/* Responsive */
@media (max-width: 480px) {
    .popup-${objectName}-container {
        width: 95vw;
        padding: 20px;
    }
    
    .popup-${objectName}-avatar {
        width: 80px;
        height: 80px;
    }
    
    .popup-${objectName}-name {
        font-size: 20px;
    }
}
`.trim();
  }

  // === GÉNÉRATEUR JS ===
  function generateJS(config, objectName, spaceSlug) {
    const contacts = config.contacts || [];
    const name = config.name || "Contact";
    const title = config.title || "";
    const avatar = config.avatar || "";

    // Générer le HTML des liens
    const linksHTML = contacts
      .map((contact) => {
        const icon = getContactIcon(contact.type);
        const href = getContactHref(contact.type, contact.value);
        const target = contact.type === "website" ? ' target="_blank"' : "";

        return `
            <a href="${href}" class="popup-${objectName}-link"${target}>
                <span class="popup-${objectName}-link-icon">${icon}</span>
                <div class="popup-${objectName}-link-content">
                    <div class="popup-${objectName}-link-label">${
          contact.label || contact.type
        }</div>
                    <div class="popup-${objectName}-link-value">${escapeHtml(
          contact.value
        )}</div>
                </div>
            </a>`;
      })
      .join("");

    return `
/**
 * ============================================
 * Popup Contact - ${objectName}
 * Généré automatiquement par Atlantis CRM
 * Espace: ${spaceSlug}
 * ============================================
 */
(function() {
    'use strict';

    const OBJECT_NAME = '${objectName}';
    let isOpen = false;
    let overlayEl = null;

    // Configuration
    const config = {
        name: ${JSON.stringify(name)},
        title: ${JSON.stringify(title)},
        avatar: ${JSON.stringify(avatar)}
    };

    // Créer le DOM
    function createPopup() {
        if (overlayEl) return;

        overlayEl = document.createElement('div');
        overlayEl.className = 'popup-${objectName}-overlay';
        overlayEl.innerHTML = \`
            <div class="popup-${objectName}-container">
                <button class="popup-${objectName}-close" aria-label="Fermer">&times;</button>
                
                <div class="popup-${objectName}-header">
                    \${config.avatar ? \`<img src="\${config.avatar}" alt="\${config.name}" class="popup-${objectName}-avatar">\` : ''}
                    <h2 class="popup-${objectName}-name">\${config.name}</h2>
                    \${config.title ? \`<p class="popup-${objectName}-title">\${config.title}</p>\` : ''}
                </div>
                
                <div class="popup-${objectName}-links">
                    ${linksHTML}
                </div>
            </div>
        \`;

        // Event listeners
        overlayEl.addEventListener('click', function(e) {
            if (e.target === overlayEl) {
                close();
            }
        });

        overlayEl.querySelector('.popup-${objectName}-close').addEventListener('click', close);

        document.body.appendChild(overlayEl);
    }

    // Ouvrir
    function show() {
        if (isOpen) return;
        
        createPopup();
        
        // Force reflow pour l'animation
        overlayEl.offsetHeight;
        
        overlayEl.classList.add('active');
        isOpen = true;
        document.body.style.overflow = 'hidden';
    }

    // Fermer
    function close() {
        if (!isOpen || !overlayEl) return;
        
        overlayEl.classList.remove('active');
        isOpen = false;
        document.body.style.overflow = '';
        
        // Nettoyer après animation
        setTimeout(function() {
            if (overlayEl && overlayEl.parentNode) {
                overlayEl.parentNode.removeChild(overlayEl);
                overlayEl = null;
            }
        }, 300);
    }

    // Fermer avec Escape
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && isOpen) {
            close();
        }
    });

    // API publique
    window.atlantisPopups = window.atlantisPopups || {};
    window.atlantisPopups['${objectName}'] = {
        show: show,
        close: close,
        isOpen: function() { return isOpen; },
        getConfig: function() { return config; }
    };

    console.log('📇 Popup ${objectName} chargé');
})();
`.trim();
  }

  // === HELPERS ===
  function getContactIcon(type) {
    const icons = {
      phone: "📞",
      email: "✉️",
      website: "🌐",
      linkedin: "💼",
      whatsapp: "💬",
      address: "📍",
      facebook: "👤",
      instagram: "📷",
      twitter: "🐦",
      youtube: "▶️",
    };
    return icons[type] || "📎";
  }

  function getContactHref(type, value) {
    switch (type) {
      case "phone":
        return `tel:${value.replace(/\s/g, "")}`;
      case "email":
        return `mailto:${value}`;
      case "whatsapp":
        return `https://wa.me/${value.replace(/\D/g, "")}`;
      case "linkedin":
        return value.startsWith("http")
          ? value
          : `https://linkedin.com/in/${value}`;
      case "facebook":
        return value.startsWith("http")
          ? value
          : `https://facebook.com/${value}`;
      case "instagram":
        return value.startsWith("http")
          ? value
          : `https://instagram.com/${value}`;
      case "twitter":
        return value.startsWith("http")
          ? value
          : `https://twitter.com/${value}`;
      case "youtube":
        return value.startsWith("http")
          ? value
          : `https://youtube.com/${value}`;
      case "website":
        return value.startsWith("http") ? value : `https://${value}`;
      case "address":
        return `https://maps.google.com/?q=${encodeURIComponent(value)}`;
      default:
        return value;
    }
  }

  function adjustColor(hex, percent) {
    // Assombrir ou éclaircir une couleur
    const num = parseInt(hex.replace("#", ""), 16);
    const amt = Math.round(2.55 * percent);
    const R = Math.max(0, Math.min(255, (num >> 16) + amt));
    const G = Math.max(0, Math.min(255, ((num >> 8) & 0x00ff) + amt));
    const B = Math.max(0, Math.min(255, (num & 0x0000ff) + amt));
    return (
      "#" + (0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1)
    );
  }

  function escapeHtml(text) {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
  }

  // === API PUBLIQUE ===
  window.atlantisTemplates = window.atlantisTemplates || {};
  window.atlantisTemplates.contact = {
    generate: function (config, objectName, spaceSlug) {
      return {
        js: generateJS(config, objectName, spaceSlug || "default"),
        css: generateCSS(config, objectName),
      };
    },

    // Pour le preview dans l'éditeur
    preview: function (config) {
      const contacts = config.contacts || [];
      const name = config.name || "Contact";
      const title = config.title || "";
      const avatar = config.avatar || "";
      const primaryColor = config.primaryColor || "#1a1a2e";
      const accentColor = config.accentColor || "#4a90d9";

      let linksHTML = contacts
        .map((contact) => {
          const icon = getContactIcon(contact.type);
          return `
                    <div style="display:flex;align-items:center;gap:12px;padding:12px 15px;background:rgba(255,255,255,0.08);border-radius:10px;margin-bottom:8px;">
                        <span style="font-size:18px;">${icon}</span>
                        <div>
                            <div style="font-size:10px;color:rgba(255,255,255,0.5);text-transform:uppercase;">${
                              contact.label || contact.type
                            }</div>
                            <div style="font-size:13px;color:#fff;">${escapeHtml(
                              contact.value
                            )}</div>
                        </div>
                    </div>
                `;
        })
        .join("");

      return `
                <div style="background:linear-gradient(145deg,${primaryColor},${adjustColor(
        primaryColor,
        -20
      )});border-radius:16px;padding:25px;color:#fff;font-family:system-ui,sans-serif;">
                    <div style="text-align:center;margin-bottom:20px;">
                        ${
                          avatar
                            ? `<img src="${avatar}" style="width:80px;height:80px;border-radius:50%;border:3px solid ${accentColor};object-fit:cover;margin-bottom:10px;">`
                            : ""
                        }
                        <h3 style="margin:0;font-size:20px;font-weight:700;">${escapeHtml(
                          name
                        )}</h3>
                        ${
                          title
                            ? `<p style="margin:5px 0 0;font-size:12px;color:${accentColor};text-transform:uppercase;">${escapeHtml(
                                title
                              )}</p>`
                            : ""
                        }
                    </div>
                    <div>${linksHTML}</div>
                </div>
            `;
    },
  };

  console.log("📇 Template Contact chargé");
})();
