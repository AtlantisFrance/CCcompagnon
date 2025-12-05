/**
 * ============================================
 * 📇 TEMPLATE CONTACT - POPUP STUDIO DESIGN
 * Atlantis City
 * v2.3 - Avec renderContactsList pour updates smooth
 * ============================================
 */

window.ATLANTIS_TEMPLATES = window.ATLANTIS_TEMPLATES || {};

window.ATLANTIS_TEMPLATES.contact = {
  name: "Fiche Contact",
  icon: "📇",
  description: "Carte de contact avec liens sociaux",

  SOCIAL_ICONS: {
    phone: null,
    email: null,
    youtube:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/0/09/YouTube_full-color_icon_%282017%29.svg/1024px-YouTube_full-color_icon_%282017%29.svg.png",
    facebook:
      "https://aavyuxeirkpgtbarjdce.supabase.co/storage/v1/object/public/julienscript/testree/facebook.png",
    instagram:
      "https://aavyuxeirkpgtbarjdce.supabase.co/storage/v1/object/public/julienscript/testree/instagram.png",
    linkedin:
      "https://aavyuxeirkpgtbarjdce.supabase.co/storage/v1/object/public/julienscript/testree/linkedin.png",
    tiktok:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/3/34/Ionicons_logo-tiktok.svg/512px-Ionicons_logo-tiktok.svg.png",
    twitter:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/6/6f/Logo_of_Twitter.svg/512px-Logo_of_Twitter.svg.png",
    website: null,
  },

  EMOJI_ICONS: {
    phone: "📱",
    email: "✉️",
    youtube: "▶️",
    facebook: "📘",
    instagram: "📷",
    linkedin: "💼",
    tiktok: "🎵",
    twitter: "🐦",
    website: "🌐",
    other: "🔗",
  },

  getDefaultData: function () {
    return {
      name: "Diego de la Fuintes",
      title: "Contact & Réseaux",
      initials: "DLF",
      avatarUrl: "",
      theme: { hue: 260, glow: 20 },
      contacts: [
        {
          type: "phone",
          label: "Téléphone",
          value: "06 88 940 133",
          href: "tel:0688940133",
        },
        {
          type: "email",
          label: "Email",
          value: "contact@diegodelafuintes.fr",
          href: "mailto:contact@diegodelafuintes.fr",
        },
        {
          type: "youtube",
          label: "YouTube",
          value: "Ma Chaîne",
          href: "https://youtube.com/@diego",
        },
        {
          type: "facebook",
          label: "Facebook",
          value: "Diego Perso",
          href: "https://www.facebook.com/diego.perso.5",
        },
        {
          type: "instagram",
          label: "Instagram",
          value: "@diego.delafuintes",
          href: "https://www.instagram.com/diego.delafuintes",
        },
        {
          type: "linkedin",
          label: "LinkedIn",
          value: "Diego de la Fuintes",
          href: "https://linkedin.com/in/diego...",
        },
      ],
    };
  },

  renderForm: function (data, helpers) {
    const self = this;
    const theme = data.theme || { hue: 260, glow: 20 };

    return `
      <div class="tpl-glass-panel">
        <div class="tpl-section-title purple">
          <i class="fas fa-swatchbook"></i>
          Thème & Ambiance
        </div>
        
        <div class="tpl-slider-group">
          <div class="tpl-slider-header">
            <label class="tpl-slider-label" for="tpl-slider-hue">Teinte (Couleur de fond)</label>
            <span class="tpl-slider-value" id="tpl-slider-hue-value">${
              theme.hue
            }°</span>
          </div>
          <input type="range" class="tpl-range tpl-range-hue" id="tpl-slider-hue" name="theme_hue"
                 data-slider-key="hue" min="0" max="360" value="${
                   theme.hue
                 }" autocomplete="off">
        </div>
        
        <div class="tpl-slider-group">
          <div class="tpl-slider-header">
            <label class="tpl-slider-label" for="tpl-slider-glow">Intensité Halo (Glow)</label>
            <span class="tpl-slider-value" id="tpl-slider-glow-value">${
              theme.glow
            }px</span>
          </div>
          <input type="range" class="tpl-range" id="tpl-slider-glow" name="theme_glow"
                 data-slider-key="glow" min="0" max="100" value="${
                   theme.glow
                 }" autocomplete="off">
        </div>
      </div>

      <div class="tpl-glass-panel">
        <div class="tpl-section-title gray">Identité</div>
        
        <div class="tpl-field-group">
          <label class="tpl-field-label" for="tpl-field-name">Nom</label>
          <input type="text" class="tpl-input" id="tpl-field-name" name="name" data-field="name" autocomplete="off"
                 value="${helpers.escapeHtml(data.name || "")}">
        </div>
        
        <div class="tpl-field-group">
          <label class="tpl-field-label" for="tpl-field-title">Titre</label>
          <input type="text" class="tpl-input" id="tpl-field-title" name="title" data-field="title" autocomplete="off"
                 value="${helpers.escapeHtml(data.title || "")}">
        </div>
        
        <div class="tpl-field-group">
          <label class="tpl-field-label" for="tpl-field-initials">Initiales</label>
          <input type="text" class="tpl-input" id="tpl-field-initials" name="initials" data-field="initials" autocomplete="off"
                 value="${helpers.escapeHtml(
                   data.initials || ""
                 )}" maxlength="3">
        </div>
        
        <div class="tpl-field-group">
          <label class="tpl-field-label" for="tpl-field-avatar">Photo (Lien URL)</label>
          <input type="text" class="tpl-input url" id="tpl-field-avatar" name="avatarUrl" data-field="avatarUrl" autocomplete="off"
                 value="${helpers.escapeHtml(
                   data.avatarUrl || ""
                 )}" placeholder="https://...">
        </div>
      </div>

      <div class="tpl-glass-panel">
        <div class="tpl-contacts-header">
          <div class="tpl-section-title green" style="margin-bottom:0;border:none;padding:0;">
            Liens Actifs
          </div>
          <button type="button" class="tpl-add-btn" id="tpl-add-contact">
            <i class="fas fa-plus"></i>
          </button>
        </div>
        
        <div id="tpl-contacts-list">
          ${(data.contacts || [])
            .map((c, i) => self.renderContactCard(c, i, helpers))
            .join("")}
        </div>
      </div>
    `;
  },

  // Rend SEULEMENT la liste des contacts (pour update partiel)
  renderContactsList: function (data, helpers) {
    const self = this;
    return (data.contacts || [])
      .map((c, i) => self.renderContactCard(c, i, helpers))
      .join("");
  },

  renderContactCard: function (contact, index, helpers) {
    const isSmartLink = contact.type === "phone" || contact.type === "email";
    const iconUrl = this.SOCIAL_ICONS[contact.type];
    const emoji = this.EMOJI_ICONS[contact.type] || "🔗";
    const iconPreview = iconUrl
      ? `<img src="${iconUrl}" alt="${contact.type}">`
      : `<span>${emoji}</span>`;

    let valuePlaceholder = "Texte affiché";
    if (contact.type === "phone") valuePlaceholder = "Numéro (06...)";
    if (contact.type === "email") valuePlaceholder = "adresse@email.com";

    const urlField = isSmartLink
      ? ""
      : `
      <div class="tpl-contact-field full">
        <label for="tpl-contact-href-${index}">Lien URL</label>
        <input type="text" class="url" id="tpl-contact-href-${index}" name="contact_href_${index}" autocomplete="off"
               data-contact-field="href" data-index="${index}"
               value="${helpers.escapeHtml(
                 contact.href || ""
               )}" placeholder="https://...">
      </div>
    `;

    return `
      <div class="tpl-contact-card" data-index="${index}">
        <div class="tpl-contact-header">
          <div class="tpl-type-selector">
            <select id="tpl-contact-type-${index}" name="contact_type_${index}" 
                    data-contact-field="type" data-index="${index}">
              <option value="phone" ${
                contact.type === "phone" ? "selected" : ""
              }>Téléphone</option>
              <option value="email" ${
                contact.type === "email" ? "selected" : ""
              }>Email</option>
              <option value="youtube" ${
                contact.type === "youtube" ? "selected" : ""
              }>YouTube</option>
              <option value="facebook" ${
                contact.type === "facebook" ? "selected" : ""
              }>Facebook</option>
              <option value="instagram" ${
                contact.type === "instagram" ? "selected" : ""
              }>Instagram</option>
              <option value="linkedin" ${
                contact.type === "linkedin" ? "selected" : ""
              }>LinkedIn</option>
              <option value="tiktok" ${
                contact.type === "tiktok" ? "selected" : ""
              }>TikTok</option>
              <option value="twitter" ${
                contact.type === "twitter" ? "selected" : ""
              }>Twitter/X</option>
              <option value="website" ${
                contact.type === "website" ? "selected" : ""
              }>Site web</option>
              <option value="other" ${
                contact.type === "other" ? "selected" : ""
              }>Autre</option>
            </select>
            <div class="tpl-type-icon">${iconPreview}</div>
            <span class="tpl-type-name">${contact.type.toUpperCase()} <i class="fas fa-chevron-down"></i></span>
          </div>
          <button type="button" class="tpl-contact-remove" data-remove-index="${index}">
            <i class="fas fa-times"></i>
          </button>
        </div>
        
        <div class="tpl-contact-fields">
          <div class="tpl-contact-field">
            <label for="tpl-contact-label-${index}">Label</label>
            <input type="text" id="tpl-contact-label-${index}" name="contact_label_${index}" autocomplete="off"
                   data-contact-field="label" data-index="${index}"
                   value="${helpers.escapeHtml(contact.label || "")}">
          </div>
          <div class="tpl-contact-field">
            <label for="tpl-contact-value-${index}">Valeur / Numéro</label>
            <input type="text" id="tpl-contact-value-${index}" name="contact_value_${index}" autocomplete="off"
                   data-contact-field="value" data-index="${index}"
                   value="${helpers.escapeHtml(
                     contact.value || ""
                   )}" placeholder="${valuePlaceholder}">
          </div>
          ${urlField}
        </div>
      </div>
    `;
  },

  renderPreview: function (data, helpers) {
    const self = this;
    const hue = data.theme?.hue ?? 260;
    const glow = data.theme?.glow ?? 20;

    const avatarContent = data.avatarUrl
      ? `<img src="${helpers.escapeHtml(
          data.avatarUrl
        )}" alt="" style="width:100%;height:100%;object-fit:cover;">`
      : helpers.escapeHtml(data.initials || "AB");

    const contactsHTML = (data.contacts || [])
      .map((c) => {
        const iconUrl = self.SOCIAL_ICONS[c.type];
        const emoji = self.EMOJI_ICONS[c.type] || "🔗";
        const iconContent = iconUrl
          ? `<img src="${iconUrl}" alt="" style="width:24px;height:24px;object-fit:contain;">`
          : `<span style="font-size:20px;">${emoji}</span>`;

        return `
        <div style="
          display:flex; align-items:center; gap:16px;
          background:rgba(255,255,255,0.03);
          border:1px solid rgba(255,255,255,0.08);
          border-radius:16px; padding:14px 16px;
        ">
          <div style="width:44px;height:44px;border-radius:12px;background:rgba(0,0,0,0.3);
                      display:flex;align-items:center;justify-content:center;flex-shrink:0;">
            ${iconContent}
          </div>
          <div style="flex:1;">
            <div style="font-size:11px;text-transform:uppercase;color:rgba(255,255,255,0.5);
                        font-weight:600;margin-bottom:3px;letter-spacing:0.5px;">
              ${helpers.escapeHtml(c.label || c.type)}
            </div>
            <div style="font-size:14px;font-weight:500;color:rgba(255,255,255,0.95);">
              ${helpers.escapeHtml(c.value || "")}
            </div>
          </div>
          <div style="opacity:0.3;font-size:16px;">→</div>
        </div>
      `;
      })
      .join("");

    return `
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600;700&display=swap');
        .tpl-popup-preview::-webkit-scrollbar { width: 6px; }
        .tpl-popup-preview::-webkit-scrollbar-track { background: transparent; }
        .tpl-popup-preview::-webkit-scrollbar-thumb { 
          background: hsla(${hue},50%,50%,0.3); 
          border-radius: 3px; 
        }
        .tpl-popup-preview::-webkit-scrollbar-thumb:hover { 
          background: hsla(${hue},50%,50%,0.5); 
        }
        .tpl-popup-preview { scrollbar-width: thin; scrollbar-color: hsla(${hue},50%,50%,0.3) transparent; }
      </style>
      <div class="tpl-popup-preview" style="
        font-family:'Outfit',sans-serif;
        width:380px; max-width:100%; max-height:800px;
        background:linear-gradient(160deg, hsl(${hue},30%,15%) 0%, hsl(${hue},40%,5%) 100%);
        border-radius:24px;
        border:1px solid hsla(${hue},70%,70%,0.2);
        box-shadow: 0 25px 60px rgba(0,0,0,0.6), 0 0 ${glow}px hsla(${hue},80%,60%,0.5);
        overflow-y:auto; overflow-x:hidden; color:white;
      ">
        <div style="position:relative;padding:40px 20px 28px;text-align:center;
                    background:linear-gradient(to bottom,rgba(255,255,255,0.04),transparent);
                    border-bottom:1px solid hsla(${hue},50%,50%,0.15);">
          <div style="position:absolute;top:15px;right:15px;width:32px;height:32px;
                      background:rgba(255,255,255,0.08);border-radius:50%;
                      display:flex;align-items:center;justify-content:center;
                      color:rgba(255,255,255,0.6);font-size:18px;cursor:pointer;">×</div>
          <div style="width:88px;height:88px;margin:0 auto 16px;border-radius:50%;
                      background:linear-gradient(135deg,hsl(${hue},50%,25%),hsl(${hue},60%,15%));
                      display:flex;align-items:center;justify-content:center;
                      font-size:32px;font-weight:600;
                      border:3px solid hsla(${hue},70%,60%,0.5);
                      box-shadow:0 8px 25px rgba(0,0,0,0.4);overflow:hidden;">
            ${avatarContent}
          </div>
          <h2 style="font-size:24px;font-weight:700;margin:0 0 6px;
                     text-shadow:0 2px 8px rgba(0,0,0,0.4);">
            ${helpers.escapeHtml(data.name || "Nom")}
          </h2>
          <p style="font-size:12px;color:hsla(${hue},30%,75%,0.8);font-weight:400;
                    letter-spacing:1.5px;text-transform:uppercase;margin:0;">
            ${helpers.escapeHtml(data.title || "Titre")}
          </p>
        </div>
        <div style="padding:24px 20px;display:flex;flex-direction:column;gap:12px;">
          ${
            contactsHTML ||
            '<div style="text-align:center;opacity:0.4;padding:20px;">Aucun contact</div>'
          }
        </div>
      </div>
    `;
  },

  // ============================================
  // 🔧 GÉNÉRATION JS - IDENTIQUE À PREVIEW
  // ============================================
  generateJS: function (objectName, config, timestamp) {
    const name = this.escapeJS(config.name || "Contact");
    const title = this.escapeJS(config.title || "");
    const initials = this.escapeJS(config.initials || "AB");
    const avatarUrl = this.escapeJS(config.avatarUrl || "");
    const hue = config.theme?.hue ?? 260;
    const glow = config.theme?.glow ?? 20;

    const processedContacts = (config.contacts || []).map((c) => {
      const contact = { ...c };
      if (c.type === "phone")
        contact.href = `tel:${(c.value || "").replace(/\s+/g, "")}`;
      else if (c.type === "email")
        contact.href = `mailto:${(c.value || "").trim()}`;
      return contact;
    });

    return `/**
 * 📇 Popup Contact - ${objectName}
 * Généré le ${timestamp}
 */
(function(){
"use strict";

const ID = "${objectName}";
const CFG = {
  name: "${name}",
  title: "${title}",
  initials: "${initials}",
  avatarUrl: "${avatarUrl}",
  hue: ${hue},
  glow: ${glow},
  contacts: ${JSON.stringify(processedContacts)}
};

const ICONS = {
  youtube: "https://upload.wikimedia.org/wikipedia/commons/thumb/0/09/YouTube_full-color_icon_%282017%29.svg/1024px-YouTube_full-color_icon_%282017%29.svg.png",
  facebook: "https://aavyuxeirkpgtbarjdce.supabase.co/storage/v1/object/public/julienscript/testree/facebook.png",
  instagram: "https://aavyuxeirkpgtbarjdce.supabase.co/storage/v1/object/public/julienscript/testree/instagram.png",
  linkedin: "https://aavyuxeirkpgtbarjdce.supabase.co/storage/v1/object/public/julienscript/testree/linkedin.png",
  tiktok: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/34/Ionicons_logo-tiktok.svg/512px-Ionicons_logo-tiktok.svg.png",
  twitter: "https://upload.wikimedia.org/wikipedia/commons/thumb/6/6f/Logo_of_Twitter.svg/512px-Logo_of_Twitter.svg.png"
};
const EMOJI = {phone:"📱",email:"✉️",youtube:"▶️",facebook:"📘",instagram:"📷",linkedin:"💼",tiktok:"🎵",twitter:"🐦",website:"🌐",other:"🔗"};

let popup = null;

function injectFont() {
  if (!document.getElementById("outfit-font")) {
    const l = document.createElement("link");
    l.id = "outfit-font";
    l.rel = "stylesheet";
    l.href = "https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600;700&display=swap";
    document.head.appendChild(l);
  }
}

function injectScrollbarStyle() {
  if (document.getElementById("popup-" + ID + "-scrollbar")) return;
  const s = document.createElement("style");
  s.id = "popup-" + ID + "-scrollbar";
  s.textContent = ".popup-" + ID + "::-webkit-scrollbar{width:6px}.popup-" + ID + "::-webkit-scrollbar-track{background:transparent}.popup-" + ID + "::-webkit-scrollbar-thumb{background:hsla(" + CFG.hue + ",50%,50%,0.3);border-radius:3px}.popup-" + ID + "::-webkit-scrollbar-thumb:hover{background:hsla(" + CFG.hue + ",50%,50%,0.5)}.popup-" + ID + "{scrollbar-width:thin;scrollbar-color:hsla(" + CFG.hue + ",50%,50%,0.3) transparent}";
  document.head.appendChild(s);
}

function show() {
  if (popup) { close(); return; }
  injectFont();
  injectScrollbarStyle();

  const o = document.createElement("div");
  o.className = "popup-" + ID + "-overlay";
  o.style.cssText = "position:fixed;inset:0;background:rgba(0,0,0,0.75);backdrop-filter:blur(8px);z-index:99999;display:flex;align-items:center;justify-content:center;opacity:0;transition:opacity 0.3s;font-family:'Outfit',sans-serif;";

  const avatar = CFG.avatarUrl 
    ? '<img src="' + CFG.avatarUrl + '" style="width:100%;height:100%;object-fit:cover;border-radius:50%;">'
    : CFG.initials;

  const links = CFG.contacts.map(function(c) {
    const iconUrl = ICONS[c.type];
    const icon = iconUrl 
      ? '<img src="' + iconUrl + '" style="width:24px;height:24px;object-fit:contain;">'
      : '<span style="font-size:20px;">' + (EMOJI[c.type] || "🔗") + '</span>';
    const target = (c.type === "phone" || c.type === "email") ? "_self" : "_blank";
    return '<a href="' + (c.href || "#") + '" target="' + target + '" rel="noopener" style="display:flex;align-items:center;gap:16px;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.08);border-radius:16px;padding:14px 16px;text-decoration:none;color:white;transition:all 0.3s;" onmouseover="this.style.background=\\'hsla(' + CFG.hue + ',60%,50%,0.15)\\';this.style.borderColor=\\'hsla(' + CFG.hue + ',60%,60%,0.4)\\';this.style.transform=\\'translateY(-2px)\\'" onmouseout="this.style.background=\\'rgba(255,255,255,0.03)\\';this.style.borderColor=\\'rgba(255,255,255,0.08)\\';this.style.transform=\\'none\\'"><div style="width:44px;height:44px;border-radius:12px;background:rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;flex-shrink:0;">' + icon + '</div><div style="flex:1;"><div style="font-size:11px;text-transform:uppercase;color:rgba(255,255,255,0.5);font-weight:600;margin-bottom:3px;letter-spacing:0.5px;">' + (c.label || c.type) + '</div><div style="font-size:14px;font-weight:500;color:rgba(255,255,255,0.95);">' + (c.value || "") + '</div></div><span style="opacity:0.3;font-size:16px;">→</span></a>';
  }).join("");

  o.innerHTML = '<div class="popup-' + ID + '" style="width:380px;max-width:92vw;max-height:800px;overflow-y:auto;background:linear-gradient(160deg,hsl(' + CFG.hue + ',30%,15%) 0%,hsl(' + CFG.hue + ',40%,5%) 100%);border-radius:24px;border:1px solid hsla(' + CFG.hue + ',70%,70%,0.2);box-shadow:0 25px 60px rgba(0,0,0,0.6),0 0 ' + CFG.glow + 'px hsla(' + CFG.hue + ',80%,60%,0.5);color:white;transform:scale(0.95);transition:transform 0.3s;"><div style="position:relative;padding:40px 20px 28px;text-align:center;background:linear-gradient(to bottom,rgba(255,255,255,0.04),transparent);border-bottom:1px solid hsla(' + CFG.hue + ',50%,50%,0.15);"><button onclick="window.atlantisPopups[\\''+ID+'\\'].close()" style="position:absolute;top:15px;right:15px;width:32px;height:32px;background:rgba(255,255,255,0.08);border:none;border-radius:50%;color:rgba(255,255,255,0.6);font-size:18px;cursor:pointer;display:flex;align-items:center;justify-content:center;">×</button><div style="width:88px;height:88px;margin:0 auto 16px;border-radius:50%;background:linear-gradient(135deg,hsl(' + CFG.hue + ',50%,25%),hsl(' + CFG.hue + ',60%,15%));display:flex;align-items:center;justify-content:center;font-size:32px;font-weight:600;border:3px solid hsla(' + CFG.hue + ',70%,60%,0.5);box-shadow:0 8px 25px rgba(0,0,0,0.4);overflow:hidden;">' + avatar + '</div><h2 style="font-size:24px;font-weight:700;margin:0 0 6px;text-shadow:0 2px 8px rgba(0,0,0,0.4);">' + CFG.name + '</h2><p style="font-size:12px;color:hsla(' + CFG.hue + ',30%,75%,0.8);font-weight:400;letter-spacing:1.5px;text-transform:uppercase;margin:0;">' + CFG.title + '</p></div><div style="padding:24px 20px;display:flex;flex-direction:column;gap:12px;">' + links + '</div></div>';

  document.body.appendChild(o);
  popup = o;

  requestAnimationFrame(function() {
    o.style.opacity = "1";
    var inner = o.querySelector(".popup-" + ID);
    if (inner) inner.style.transform = "scale(1)";
  });

  o.addEventListener("click", function(e) { if (e.target === o) close(); });
}

function close() {
  if (popup) {
    popup.style.opacity = "0";
    var inner = popup.querySelector(".popup-" + ID);
    if (inner) inner.style.transform = "scale(0.95)";
    setTimeout(function() { if(popup) { popup.remove(); popup = null; } }, 300);
  }
}

document.addEventListener("keydown", function(e) { if (e.key === "Escape" && popup) close(); });

window.atlantisPopups = window.atlantisPopups || {};
window.atlantisPopups[ID] = { show: show, close: close, config: CFG };

console.log("📇 Popup " + ID + " chargée");
})();`;
  },

  escapeJS: function (str) {
    if (!str) return "";
    return String(str)
      .replace(/\\/g, "\\\\")
      .replace(/"/g, '\\"')
      .replace(/'/g, "\\'")
      .replace(/\n/g, "\\n");
  },
};

console.log("📇 Template Contact chargé");
