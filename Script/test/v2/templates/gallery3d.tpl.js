/**
 * ============================================
 * 🎠 TEMPLATE GALLERY 3D - POPUP STUDIO DESIGN
 * Atlantis City
 * v1.0 - 2024-12-11 - Carrousel 3D avec popup détail
 * v1.1 - 2024-12-11 - Fix échappement quotes dans generateJS
 * v1.2 - 2024-12-11 - Standardisation classes popup-{ID}-*
 * v1.3 - 2024-12-11 - Preview interactive (navigation, détails, temps réel)
 * v1.4 - 2024-12-11 - Amélioration preview (fidélité au rendu final)
 * v1.5 - 2024-12-11 - Cartes resserrées (offset*40±80 vs offset*60±120)
 * v1.6 - 2024-12-11 - Flèches aux bords, tooltips en haut, largeur dynamique
 * v1.7 - 2024-12-11 - Layout centré, stage largeur fixe, tooltips compacts
 * v1.8 - 2024-12-11 - Preview: flèches s'écartent sans limite (+80px/photo)
 * ============================================
 */

window.ATLANTIS_TEMPLATES = window.ATLANTIS_TEMPLATES || {};

// State global pour la preview interactive
window._gallery3dPreview = {
  activeIndex: 0,
  items: [],
  settings: {},
};

// Fonctions globales pour l'interactivité de la preview
window._gallery3dPreviewNav = function (dir) {
  var state = window._gallery3dPreview;
  var newIndex = state.activeIndex + dir;
  if (newIndex < 0) newIndex = state.items.length - 1;
  if (newIndex >= state.items.length) newIndex = 0;
  state.activeIndex = newIndex;
  window._gallery3dPreviewUpdate();
};

window._gallery3dPreviewGoTo = function (index) {
  var state = window._gallery3dPreview;
  if (index === state.activeIndex) {
    // Clic sur carte active → ouvrir détail
    if (state.settings.showDetailPopup) {
      window._gallery3dPreviewShowDetail(index);
    }
  } else {
    state.activeIndex = index;
    window._gallery3dPreviewUpdate();
  }
};

window._gallery3dPreviewUpdate = function () {
  var state = window._gallery3dPreview;
  var cards = document.querySelectorAll(".preview-gallery-card");

  cards.forEach(function (card, i) {
    var offset = i - state.activeIndex;

    if (offset === 0) {
      card.style.transform = "translateX(0) translateZ(80px) rotateY(0deg)";
      card.style.zIndex = 100;
      card.style.opacity = 1;
      card.style.filter = "brightness(1.1)";
      card.classList.add("active");
      // Afficher le hover text
      var hover = card.querySelector(".preview-hover-text");
      if (hover) hover.style.display = "block";
    } else if (offset < 0) {
      card.style.zIndex = 50 + offset;
      card.style.transform =
        "translateX(" +
        (offset * 40 - 80) +
        "px) translateZ(-50px) rotateY(40deg) scale(0.7)";
      card.style.opacity = 0.5;
      card.style.filter = "brightness(0.4)";
      card.classList.remove("active");
      var hover = card.querySelector(".preview-hover-text");
      if (hover) hover.style.display = "none";
    } else {
      card.style.zIndex = 50 - offset;
      card.style.transform =
        "translateX(" +
        (offset * 40 + 80) +
        "px) translateZ(-50px) rotateY(-40deg) scale(0.7)";
      card.style.opacity = 0.5;
      card.style.filter = "brightness(0.4)";
      card.classList.remove("active");
      var hover = card.querySelector(".preview-hover-text");
      if (hover) hover.style.display = "none";
    }
  });

  // Mettre à jour le compteur
  var counter = document.getElementById("preview-gallery-counter");
  if (counter) {
    counter.textContent = state.activeIndex + 1 + " / " + state.items.length;
  }
};

window._gallery3dPreviewShowDetail = function (index) {
  var state = window._gallery3dPreview;
  var item = state.items[index];
  if (!item) return;

  // Supprimer ancien détail si présent
  var old = document.getElementById("preview-detail-overlay");
  if (old) old.remove();

  // Créer le détail
  var extraImagesHTML = "";
  if (item.extraImages && item.extraImages.length > 0) {
    extraImagesHTML =
      '<p style="color:rgba(255,255,255,0.4);font-size:11px;text-transform:uppercase;letter-spacing:1px;margin:16px 0 8px;">' +
      (state.settings.extraImagesLabel || "Plus de photos") +
      "</p>" +
      '<div style="display:flex;gap:8px;flex-wrap:wrap;">';
    item.extraImages.forEach(function (url, ei) {
      extraImagesHTML +=
        '<img src="' +
        url +
        '" onclick="window._gallery3dPreviewSetMainImg(\'' +
        url.replace(/'/g, "\\'") +
        '\')" style="width:60px;height:45px;object-fit:cover;border-radius:6px;cursor:pointer;opacity:0.7;transition:opacity 0.2s;" onmouseover="this.style.opacity=1" onmouseout="this.style.opacity=0.7">';
    });
    extraImagesHTML += "</div>";
  }

  var detailHTML =
    '<div id="preview-detail-overlay" style="' +
    "position:absolute;inset:0;background:rgba(0,0,0,0.95);z-index:200;" +
    "display:flex;align-items:center;justify-content:center;" +
    "animation:fadeIn 0.3s ease;" +
    '" onclick="if(event.target===this)this.remove()">' +
    '<div style="' +
    "width:90%;max-width:500px;max-height:90%;overflow-y:auto;" +
    "background:linear-gradient(160deg,#1e293b 0%,#0f172a 100%);" +
    "border-radius:16px;border:1px solid rgba(255,255,255,0.1);" +
    "box-shadow:0 25px 50px rgba(0,0,0,0.5);" +
    "animation:slideUp 0.3s ease;" +
    '">' +
    '<div style="position:relative;">' +
    '<img id="preview-detail-main-img" src="' +
    (item.image || "") +
    '" style="' +
    "width:100%;height:200px;object-fit:cover;border-radius:16px 16px 0 0;" +
    '">' +
    '<button onclick="document.getElementById(\'preview-detail-overlay\').remove()" style="' +
    "position:absolute;top:12px;right:12px;width:32px;height:32px;" +
    "background:rgba(0,0,0,0.6);border:none;border-radius:50%;" +
    "color:white;font-size:16px;cursor:pointer;" +
    '">✕</button>' +
    "</div>" +
    '<div style="padding:20px;">' +
    '<h3 style="color:white;font-size:18px;margin:0 0 8px;font-weight:600;">' +
    (item.title || "Sans titre") +
    "</h3>" +
    '<p style="color:rgba(255,255,255,0.7);font-size:13px;line-height:1.5;margin:0;">' +
    (item.description || "Aucune description") +
    "</p>" +
    extraImagesHTML +
    "</div>" +
    "</div>" +
    "</div>";

  var container = document.getElementById("tpl-preview-stage");
  if (container) {
    container.insertAdjacentHTML("beforeend", detailHTML);
  }
};

window._gallery3dPreviewSetMainImg = function (url) {
  var img = document.getElementById("preview-detail-main-img");
  if (img) img.src = url;
};

window.ATLANTIS_TEMPLATES.gallery3d = {
  name: "Galerie 3D",
  icon: "🎠",
  description: "Carrousel 3D avec vue détaillée",

  // ===== DONNÉES PAR DÉFAUT =====
  getDefaultData: function () {
    return {
      settings: {
        showDetailPopup: true,
        extraImagesLabel: "Plus de photos",
      },
      items: [
        {
          image:
            "https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=800",
          hoverText: "👁 Voir détails",
          title: "Félix le Roux",
          description:
            "Un magnifique chat roux au regard perçant. Félix adore se prélasser au soleil et chasser les papillons dans le jardin.",
          extraImages: [
            "https://images.unsplash.com/photo-1519052537078-e6302a4968d4?w=400",
            "https://images.unsplash.com/photo-1574144611937-0df059b5ef3e?w=400",
          ],
        },
        {
          image:
            "https://images.unsplash.com/photo-1573865526739-10659fec78a5?w=800",
          hoverText: "👁 Voir détails",
          title: "Moustache le Curieux",
          description:
            "Ce chat tigré est toujours en quête d'aventure. Sa curiosité légendaire l'amène à explorer chaque recoin de la maison.",
          extraImages: [
            "https://images.unsplash.com/photo-1526336024174-e58f5cdd8e13?w=400",
          ],
        },
        {
          image:
            "https://images.unsplash.com/photo-1495360010541-f48722b34f7d?w=800",
          hoverText: "👁 Voir détails",
          title: "Émeraude",
          description:
            "Ses yeux verts hypnotiques lui ont valu son nom. Émeraude est une chatte douce et câline.",
          extraImages: [],
        },
      ],
    };
  },

  // ===== FORMULAIRE D'ÉDITION =====
  renderForm: function (data, helpers) {
    var self = this;
    var settings = data.settings || {
      showDetailPopup: true,
      extraImagesLabel: "Plus de photos",
    };

    return (
      '<div class="tpl-glass-panel">' +
      '<div class="tpl-section-title purple">' +
      '<i class="fas fa-cog"></i>' +
      "Options d'affichage" +
      "</div>" +
      '<div class="tpl-field-group" style="display:flex;align-items:center;gap:12px;margin-bottom:16px;">' +
      '<input type="checkbox" id="tpl-setting-showDetailPopup" name="showDetailPopup"' +
      ' data-setting-field="showDetailPopup" autocomplete="off"' +
      (settings.showDetailPopup ? " checked" : "") +
      ' style="width:18px;height:18px;accent-color:#6366f1;">' +
      '<label for="tpl-setting-showDetailPopup" class="tpl-field-label" style="margin:0;cursor:pointer;">' +
      'Popup détaillée <span style="color:#64748b;font-weight:400;">(sinon lightbox simple)</span>' +
      "</label>" +
      "</div>" +
      '<div class="tpl-field-group">' +
      '<label class="tpl-field-label" for="tpl-setting-extraImagesLabel">Titre section images extras</label>' +
      '<input type="text" class="tpl-input" id="tpl-setting-extraImagesLabel" name="extraImagesLabel"' +
      ' data-setting-field="extraImagesLabel" autocomplete="off"' +
      ' value="' +
      helpers.escapeHtml(settings.extraImagesLabel || "Plus de photos") +
      '"' +
      ' placeholder="Plus de photos">' +
      "</div>" +
      "</div>" +
      '<div class="tpl-glass-panel">' +
      '<div class="tpl-contacts-header">' +
      '<div class="tpl-section-title green" style="margin-bottom:0;border:none;padding:0;">' +
      '<i class="fas fa-images"></i>' +
      "Images du carrousel" +
      "</div>" +
      '<button type="button" class="tpl-add-btn" id="tpl-add-item">' +
      '<i class="fas fa-plus"></i>' +
      "</button>" +
      "</div>" +
      '<div id="tpl-items-list">' +
      (data.items || [])
        .map(function (item, i) {
          return self.renderItemCard(
            item,
            i,
            helpers,
            settings.showDetailPopup
          );
        })
        .join("") +
      "</div>" +
      "</div>"
    );
  },

  // Rend SEULEMENT la liste des items (pour update partiel)
  renderItemsList: function (data, helpers) {
    var self = this;
    var settings = data.settings || { showDetailPopup: true };
    return (data.items || [])
      .map(function (item, i) {
        return self.renderItemCard(item, i, helpers, settings.showDetailPopup);
      })
      .join("");
  },

  renderItemCard: function (item, index, helpers, showDetailPopup) {
    var self = this;
    var extraImagesHTML = (item.extraImages || [])
      .map(function (url, ei) {
        return (
          '<div class="tpl-extra-image-row" style="display:flex;gap:8px;align-items:center;margin-top:8px;">' +
          '<input type="text" class="tpl-input url" style="flex:1;"' +
          ' id="tpl-item-' +
          index +
          "-extra-" +
          ei +
          '" name="item_' +
          index +
          "_extra_" +
          ei +
          '"' +
          ' data-extra-field="url" data-item-index="' +
          index +
          '" data-extra-index="' +
          ei +
          '"' +
          ' autocomplete="off" value="' +
          helpers.escapeHtml(url) +
          '" placeholder="https://...">' +
          '<button type="button" class="tpl-contact-remove"' +
          ' data-remove-extra-index="' +
          ei +
          '" data-remove-extra-item="' +
          index +
          '"' +
          ' style="width:32px;height:32px;flex-shrink:0;">' +
          '<i class="fas fa-times"></i>' +
          "</button>" +
          "</div>"
        );
      })
      .join("");

    return (
      '<div class="tpl-contact-card tpl-item-card" data-item-index="' +
      index +
      '" style="margin-bottom:16px;">' +
      '<div class="tpl-contact-header" style="background:rgba(34,197,94,0.1);">' +
      '<div style="display:flex;align-items:center;gap:10px;">' +
      '<span style="font-size:18px;">🖼️</span>' +
      '<span style="font-weight:600;color:#e2e8f0;">Image ' +
      (index + 1) +
      "</span>" +
      "</div>" +
      '<button type="button" class="tpl-contact-remove" data-remove-item-index="' +
      index +
      '">' +
      '<i class="fas fa-times"></i>' +
      "</button>" +
      "</div>" +
      '<div class="tpl-contact-fields" style="padding:16px;">' +
      '<div class="tpl-field-group">' +
      '<label class="tpl-field-label" for="tpl-item-image-' +
      index +
      '">Image principale (URL)</label>' +
      '<input type="text" class="tpl-input url" id="tpl-item-image-' +
      index +
      '" name="item_image_' +
      index +
      '"' +
      ' data-item-field="image" data-index="' +
      index +
      '" autocomplete="off"' +
      ' value="' +
      helpers.escapeHtml(item.image || "") +
      '" placeholder="https://...">' +
      "</div>" +
      '<div class="tpl-field-group">' +
      '<label class="tpl-field-label" for="tpl-item-hoverText-' +
      index +
      '">Texte au survol</label>' +
      '<input type="text" class="tpl-input" id="tpl-item-hoverText-' +
      index +
      '" name="item_hoverText_' +
      index +
      '"' +
      ' data-item-field="hoverText" data-index="' +
      index +
      '" autocomplete="off"' +
      ' value="' +
      helpers.escapeHtml(item.hoverText || "👁 Voir détails") +
      '" placeholder="👁 Voir détails">' +
      "</div>" +
      '<div class="tpl-detail-fields" style="' +
      "margin-top:16px;" +
      "padding-top:16px;" +
      "border-top:1px dashed rgba(255,255,255,0.1);" +
      (showDetailPopup ? "" : "opacity:0.4;pointer-events:none;") +
      '">' +
      '<div style="font-size:11px;text-transform:uppercase;color:#64748b;margin-bottom:12px;letter-spacing:1px;">' +
      '<i class="fas fa-info-circle"></i> Détails popup' +
      "</div>" +
      '<div class="tpl-field-group">' +
      '<label class="tpl-field-label" for="tpl-item-title-' +
      index +
      '">Titre</label>' +
      '<input type="text" class="tpl-input" id="tpl-item-title-' +
      index +
      '" name="item_title_' +
      index +
      '"' +
      ' data-item-field="title" data-index="' +
      index +
      '" autocomplete="off"' +
      ' value="' +
      helpers.escapeHtml(item.title || "") +
      '">' +
      "</div>" +
      '<div class="tpl-field-group">' +
      '<label class="tpl-field-label" for="tpl-item-description-' +
      index +
      '">Description</label>' +
      '<textarea class="tpl-input" id="tpl-item-description-' +
      index +
      '" name="item_description_' +
      index +
      '"' +
      ' data-item-field="description" data-index="' +
      index +
      '" autocomplete="off"' +
      ' rows="3" style="resize:vertical;min-height:80px;">' +
      helpers.escapeHtml(item.description || "") +
      "</textarea>" +
      "</div>" +
      '<div class="tpl-field-group">' +
      '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">' +
      '<label class="tpl-field-label" style="margin:0;">Images supplémentaires</label>' +
      '<button type="button" class="tpl-add-btn" style="width:28px;height:28px;font-size:12px;"' +
      ' data-add-extra-to="' +
      index +
      '">' +
      '<i class="fas fa-plus"></i>' +
      "</button>" +
      "</div>" +
      '<div class="tpl-extra-images-list" data-extras-for="' +
      index +
      '">' +
      (extraImagesHTML ||
        '<div style="color:#64748b;font-size:12px;padding:8px 0;">Aucune image supplémentaire</div>') +
      "</div>" +
      "</div>" +
      "</div>" +
      "</div>" +
      "</div>"
    );
  },

  // ===== APERÇU LIVE INTERACTIF - v1.4 amélioré =====
  renderPreview: function (data, helpers) {
    var settings = data.settings || {
      showDetailPopup: true,
      extraImagesLabel: "Plus de photos",
    };
    var items = data.items || [];

    // Mettre à jour le state global
    window._gallery3dPreview.items = items;
    window._gallery3dPreview.settings = settings;
    // Garder l'index actif valide
    if (window._gallery3dPreview.activeIndex >= items.length) {
      window._gallery3dPreview.activeIndex = Math.max(0, items.length - 1);
    }
    var activeIndex = window._gallery3dPreview.activeIndex;

    if (items.length === 0) {
      return (
        '<div style="color:#64748b;text-align:center;padding:60px 20px;">' +
        '<div style="font-size:48px;margin-bottom:16px;">🎠</div>' +
        "<div>Ajoutez des images au carrousel</div>" +
        "</div>"
      );
    }

    // Générer les cartes avec positionnement 3D amélioré
    var cardsHTML = items
      .map(function (item, i) {
        var offset = i - activeIndex;
        var transform, zIndex, opacity, filter, isActive;

        if (offset === 0) {
          // Carte active - au centre, en avant
          transform = "translateX(0) translateZ(80px) rotateY(0deg)";
          zIndex = 100;
          opacity = 1;
          filter = "brightness(1.1)";
          isActive = true;
        } else if (offset < 0) {
          // Cartes à gauche - plus serrées
          transform =
            "translateX(" +
            (offset * 40 - 80) +
            "px) translateZ(-50px) rotateY(40deg) scale(0.7)";
          zIndex = 50 + offset;
          opacity = 0.5;
          filter = "brightness(0.4)";
          isActive = false;
        } else {
          // Cartes à droite - plus serrées
          transform =
            "translateX(" +
            (offset * 40 + 80) +
            "px) translateZ(-50px) rotateY(-40deg) scale(0.7)";
          zIndex = 50 - offset;
          opacity = 0.5;
          filter = "brightness(0.4)";
          isActive = false;
        }

        return (
          '<div class="preview-gallery-card' +
          (isActive ? " active" : "") +
          '" data-preview-index="' +
          i +
          '" ' +
          'onclick="window._gallery3dPreviewGoTo(' +
          i +
          ')" ' +
          'style="' +
          "position:absolute;" +
          "width:280px;" +
          "height:190px;" +
          "background:#1e293b;" +
          "border-radius:16px;" +
          "box-shadow:0 20px 50px rgba(0,0,0,0.8);" +
          "overflow:visible;" +
          "cursor:pointer;" +
          "transition:all 0.5s cubic-bezier(0.25,0.8,0.25,1);" +
          "transform:" +
          transform +
          ";" +
          "z-index:" +
          zIndex +
          ";" +
          "opacity:" +
          opacity +
          ";" +
          "filter:" +
          filter +
          ";" +
          '">' +
          '<img src="' +
          helpers.escapeHtml(item.image || "") +
          '" alt="" style="' +
          "width:100%;height:100%;object-fit:cover;border-radius:16px;pointer-events:none;" +
          '" onerror="this.src=\'data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 280 190%22><rect fill=%22%23374151%22 width=%22280%22 height=%22190%22/><text x=%22140%22 y=%22100%22 fill=%22%239CA3AF%22 text-anchor=%22middle%22 font-size=%2212%22>Image</text></svg>\'">' +
          // Reflet
          '<div style="' +
          "position:absolute;" +
          "top:100%;left:0;width:100%;height:50%;" +
          "margin-top:8px;" +
          "background-image:url('" +
          helpers.escapeHtml(item.image || "") +
          "');" +
          "background-size:cover;" +
          "background-position:bottom center;" +
          "transform:scaleY(-1);" +
          "border-radius:16px;" +
          "-webkit-mask-image:linear-gradient(to top,rgba(0,0,0,0.25) 0%,transparent 70%);" +
          "mask-image:linear-gradient(to top,rgba(0,0,0,0.25) 0%,transparent 70%);" +
          "pointer-events:none;" +
          '"></div>' +
          // Hover text (seulement sur carte active)
          '<div class="preview-hover-text" style="' +
          "position:absolute;bottom:12px;left:50%;transform:translateX(-50%);" +
          "background:rgba(0,0,0,0.85);color:white;padding:8px 16px;" +
          "border-radius:20px;font-size:13px;white-space:nowrap;" +
          "pointer-events:none;" +
          "display:" +
          (isActive ? "block" : "none") +
          ";" +
          '">' +
          helpers.escapeHtml(item.hoverText || "👁 Voir détails") +
          "</div>" +
          "</div>"
        );
      })
      .join("");

    // Styles et animations
    // Largeur du stage basée sur le nombre d'items (sans limite)
    var stageWidthPx = 280 + (items.length - 1) * 80 + 140; // container + 80px par carte latérale + marges flèches

    var stylesHTML =
      "<style>" +
      "@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }" +
      "@keyframes slideUp { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }" +
      ".preview-gallery-stage {" +
      "position:relative;" +
      "width:" +
      stageWidthPx +
      "px;" +
      "max-width:100%;" +
      "height:320px;" +
      "display:flex;" +
      "align-items:center;" +
      "justify-content:center;" +
      "}" +
      ".preview-gallery-container {" +
      "position:relative;" +
      "width:280px;" +
      "height:250px;" +
      "transform-style:preserve-3d;" +
      "perspective:1000px;" +
      "}" +
      ".preview-gallery-card:hover {" +
      "filter:brightness(1.2) !important;" +
      "}" +
      ".preview-gallery-card.active:hover {" +
      "transform:translateX(0) translateZ(100px) rotateY(0deg) scale(1.03) !important;" +
      "box-shadow:0 30px 60px rgba(0,0,0,0.9);" +
      "}" +
      ".preview-nav-btn {" +
      "position:absolute;" +
      "top:50%;" +
      "transform:translateY(-50%);" +
      "background:rgba(255,255,255,0.15);" +
      "border:1px solid rgba(255,255,255,0.3);" +
      "color:white;" +
      "font-size:18px;" +
      "width:40px;" +
      "height:40px;" +
      "border-radius:50%;" +
      "cursor:pointer;" +
      "z-index:150;" +
      "transition:all 0.2s;" +
      "display:flex;" +
      "align-items:center;" +
      "justify-content:center;" +
      "}" +
      ".preview-nav-btn:hover {" +
      "background:rgba(255,255,255,0.25);" +
      "transform:translateY(-50%) scale(1.1);" +
      "}" +
      "</style>";

    // Navigation (seulement si plusieurs images) - flèches près des bords
    var navHTML = "";
    if (items.length > 1) {
      navHTML =
        '<button class="preview-nav-btn" style="left:5px;" onclick="window._gallery3dPreviewNav(-1)">❮</button>' +
        '<button class="preview-nav-btn" style="right:5px;" onclick="window._gallery3dPreviewNav(1)">❯</button>';
    }

    // Info bar - AU DESSUS du carrousel, centré
    var infoHTML =
      '<div style="' +
      "text-align:center;" +
      "margin-bottom:12px;" +
      "display:flex;" +
      "justify-content:center;" +
      "align-items:center;" +
      "gap:10px;" +
      "color:#64748b;" +
      "font-size:11px;" +
      "flex-wrap:wrap;" +
      '">' +
      '<span id="preview-gallery-counter" style="' +
      "background:rgba(99,102,241,0.2);" +
      "padding:5px 12px;" +
      "border-radius:12px;" +
      "color:#a5b4fc;" +
      "font-weight:600;" +
      '">' +
      (activeIndex + 1) +
      " / " +
      items.length +
      "</span>" +
      "<span>🖱️ Clic image active = détails</span>" +
      '<span style="color:#475569;">💡 Flèches/clic latéral = naviguer</span>' +
      "</div>";

    // Structure: wrapper centré contenant tooltips + stage avec flèches intégrées
    return (
      stylesHTML +
      '<div style="display:flex;flex-direction:column;align-items:center;width:100%;">' +
      infoHTML +
      '<div class="preview-gallery-stage">' +
      navHTML +
      '<div class="preview-gallery-container">' +
      cardsHTML +
      "</div>" +
      "</div>" +
      "</div>"
    );
  },

  // ===== GÉNÉRATION JS FINALE =====
  generateJS: function (objectName, config, timestamp) {
    var self = this;
    var settings = config.settings || {
      showDetailPopup: true,
      extraImagesLabel: "Plus de photos",
    };

    var itemsArray = (config.items || []).map(function (item) {
      var extraImgs = (item.extraImages || []).map(function (url) {
        return '"' + self.escapeJS(url) + '"';
      });
      return (
        "{" +
        'image:"' +
        self.escapeJS(item.image || "") +
        '",' +
        'hoverText:"' +
        self.escapeJS(item.hoverText || "👁 Voir détails") +
        '",' +
        'title:"' +
        self.escapeJS(item.title || "") +
        '",' +
        'description:"' +
        self.escapeJS(item.description || "") +
        '",' +
        "extraImages:[" +
        extraImgs.join(",") +
        "]" +
        "}"
      );
    });
    var itemsJSON = "[" + itemsArray.join(",") + "]";

    return (
      "/**\n" +
      " * 🎠 Popup Gallery 3D - " +
      objectName +
      "\n" +
      " * Généré le " +
      timestamp +
      "\n" +
      " */\n" +
      "(function(){\n" +
      '"use strict";\n' +
      "\n" +
      'var ID = "' +
      objectName +
      '";\n' +
      "var SETTINGS = {\n" +
      "  showDetailPopup: " +
      (settings.showDetailPopup ? "true" : "false") +
      ",\n" +
      '  extraImagesLabel: "' +
      self.escapeJS(settings.extraImagesLabel || "Plus de photos") +
      '"\n' +
      "};\n" +
      "var ITEMS = " +
      itemsJSON +
      ";\n" +
      "\n" +
      "var overlay = null;\n" +
      "var activeIndex = 0;\n" +
      "\n" +
      "function injectStyles() {\n" +
      '  if (document.getElementById("popup-" + ID + "-styles")) return;\n' +
      '  var s = document.createElement("style");\n' +
      '  s.id = "popup-" + ID + "-styles";\n' +
      '  s.textContent = ".popup-" + ID + "-overlay{position:fixed;inset:0;background:rgba(0,0,0,0.85);backdrop-filter:blur(10px);z-index:99999;display:flex;opacity:0;transition:opacity 0.5s ease;perspective:1000px;overflow:hidden;font-family:sans-serif}" +\n' +
      '    ".popup-" + ID + "-overlay.active{opacity:1}" +\n' +
      '    ".popup-" + ID + "-carousel{position:absolute;top:45%;left:50%;transform:translate(-50%,-50%);width:100%;height:60%;display:flex;justify-content:center;align-items:center;transform-style:preserve-3d}" +\n' +
      '    ".popup-" + ID + "-card{position:absolute;width:500px;height:350px;background:#000;border-radius:12px;box-shadow:0 20px 50px rgba(0,0,0,0.8);transition:all 0.6s cubic-bezier(0.25,0.8,0.25,1);cursor:pointer;overflow:visible;will-change:transform,opacity,filter;backface-visibility:hidden}" +\n' +
      '    ".popup-" + ID + "-card img{width:100%;height:100%;object-fit:cover;pointer-events:none;border-radius:12px}" +\n' +
      '    ".popup-" + ID + "-reflection{position:absolute;top:100%;left:0;width:100%;height:60%;margin-top:10px;background-size:cover;background-position:bottom center;transform:scaleY(-1);border-radius:12px;pointer-events:none;-webkit-mask-image:linear-gradient(to top,rgba(0,0,0,0.35) 0%,rgba(0,0,0,0.1) 50%,transparent 100%);mask-image:linear-gradient(to top,rgba(0,0,0,0.35) 0%,rgba(0,0,0,0.1) 50%,transparent 100%)}" +\n' +
      '    ".popup-" + ID + "-hover{position:absolute;bottom:15px;left:50%;transform:translateX(-50%) translateY(10px);background:rgba(0,0,0,0.7);color:white;padding:8px 16px;border-radius:20px;font-size:13px;opacity:0;transition:all 0.3s ease;pointer-events:none;white-space:nowrap}" +\n' +
      '    ".popup-" + ID + "-card.active:hover .popup-" + ID + "-hover{opacity:1;transform:translateX(-50%) translateY(0)}" +\n' +
      '    ".popup-" + ID + "-card.active:hover{transform:translateX(0) translateZ(270px) rotateY(0deg) scale(1.05)!important;box-shadow:0 30px 80px rgba(0,0,0,0.9),0 0 40px rgba(255,255,255,0.15)}" +\n' +
      '    ".popup-" + ID + "-nav{position:absolute;top:50%;transform:translateY(-50%);background:none;border:none;color:white;font-size:60px;cursor:pointer;z-index:10001;opacity:0.5;transition:opacity 0.3s,transform 0.2s;text-shadow:0 0 10px black}" +\n' +
      '    ".popup-" + ID + "-nav:hover{opacity:1;transform:translateY(-50%) scale(1.1)}" +\n' +
      '    ".popup-" + ID + "-prev{left:5%}" +\n' +
      '    ".popup-" + ID + "-next{right:5%}" +\n' +
      '    ".popup-" + ID + "-detail{position:fixed;inset:0;background:rgba(0,0,0,0.95);backdrop-filter:blur(20px);z-index:100000;display:none;opacity:0;transition:opacity 0.4s ease;overflow-y:auto}" +\n' +
      '    ".popup-" + ID + "-detail.active{opacity:1}" +\n' +
      '    ".popup-" + ID + "-detail-content{max-width:900px;margin:50px auto;padding:40px;animation:popupSlideIn 0.5s ease}" +\n' +
      '    "@keyframes popupSlideIn{from{transform:translateY(30px);opacity:0}to{transform:translateY(0);opacity:1}}" +\n' +
      '    ".popup-" + ID + "-detail-close{position:fixed;top:25px;right:30px;width:50px;height:50px;background:rgba(255,255,255,0.1);border:1px solid rgba(255,255,255,0.3);color:white;font-size:24px;border-radius:50%;cursor:pointer;z-index:100001;display:flex;align-items:center;justify-content:center;transition:all 0.3s}" +\n' +
      '    ".popup-" + ID + "-detail-close:hover{background:rgba(255,255,255,0.2);transform:rotate(90deg)}" +\n' +
      '    ".popup-" + ID + "-extra-img{width:200px;height:140px;object-fit:cover;border-radius:10px;cursor:pointer;transition:all 0.3s;opacity:0.8}" +\n' +
      '    ".popup-" + ID + "-extra-img:hover{opacity:1;transform:scale(1.05)}" +\n' +
      '    ".popup-" + ID + "-lightbox{position:fixed;inset:0;background:rgba(0,0,0,0.95);z-index:100000;display:none;opacity:0;transition:opacity 0.3s;align-items:center;justify-content:center}" +\n' +
      '    ".popup-" + ID + "-lightbox.active{opacity:1;display:flex}" +\n' +
      '    ".popup-" + ID + "-lightbox img{max-width:90vw;max-height:90vh;border-radius:8px;box-shadow:0 20px 60px rgba(0,0,0,0.5)}" +\n' +
      '    "@media(max-width:768px){.popup-" + ID + "-card{width:300px;height:200px}.popup-" + ID + "-nav{font-size:40px}.popup-" + ID + "-prev{left:2%}.popup-" + ID + "-next{right:2%}}";\n' +
      "  document.head.appendChild(s);\n" +
      "}\n" +
      "\n" +
      "function show() {\n" +
      "  if (overlay) { closeOverlay(); return; }\n" +
      '  if (ITEMS.length === 0) { console.warn("🎠 Galerie vide"); return; }\n' +
      "  injectStyles();\n" +
      "  activeIndex = 0;\n" +
      "\n" +
      '  var o = document.createElement("div");\n' +
      '  o.className = "popup-" + ID + "-overlay";\n' +
      "\n" +
      '  var cardsHTML = "";\n' +
      "  for (var i = 0; i < ITEMS.length; i++) {\n" +
      "    var imgUrl = ITEMS[i].image.replace(/'/g, \"\\\\'\");\n" +
      "    cardsHTML += '<div class=\"popup-' + ID + '-card\" data-index=\"' + i + '\">' +\n" +
      "      '<img src=\"' + ITEMS[i].image + '\" alt=\"\">' +\n" +
      "      '<div class=\"popup-' + ID + '-reflection\" style=\"background-image:url(\\'' + imgUrl + '\\')\">' + '</div>' +\n" +
      "      '<div class=\"popup-' + ID + '-hover\">' + ITEMS[i].hoverText + '</div>' +\n" +
      "    '</div>';\n" +
      "  }\n" +
      "\n" +
      "  o.innerHTML = '<button class=\"popup-' + ID + '-nav popup-' + ID + '-prev\">❮</button>' +\n" +
      "    '<button class=\"popup-' + ID + '-nav popup-' + ID + '-next\">❯</button>' +\n" +
      "    '<div class=\"popup-' + ID + '-carousel\">' + cardsHTML + '</div>';\n" +
      "\n" +
      "  document.body.appendChild(o);\n" +
      "  overlay = o;\n" +
      "\n" +
      "  update3D(0);\n" +
      "\n" +
      "  requestAnimationFrame(function() {\n" +
      '    o.classList.add("active");\n' +
      "  });\n" +
      "\n" +
      '  o.querySelector(".popup-" + ID + "-prev").onclick = function() { navigate(-1); };\n' +
      '  o.querySelector(".popup-" + ID + "-next").onclick = function() { navigate(1); };\n' +
      "  \n" +
      '  var cards = o.querySelectorAll(".popup-" + ID + "-card");\n' +
      "  for (var c = 0; c < cards.length; c++) {\n" +
      "    (function(card, idx) {\n" +
      "      card.onclick = function() {\n" +
      "        if (idx === activeIndex) {\n" +
      "          if (SETTINGS.showDetailPopup) openDetail(idx);\n" +
      "          else openLightbox(idx);\n" +
      "        } else {\n" +
      "          update3D(idx);\n" +
      "        }\n" +
      "      };\n" +
      "    })(cards[c], parseInt(cards[c].dataset.index));\n" +
      "  }\n" +
      "\n" +
      "  o.onclick = function(e) {\n" +
      "    if (e.target === o) closeOverlay();\n" +
      "  };\n" +
      "}\n" +
      "\n" +
      "function update3D(index) {\n" +
      "  activeIndex = index;\n" +
      '  var cards = overlay.querySelectorAll(".popup-" + ID + "-card");\n' +
      "  for (var i = 0; i < cards.length; i++) {\n" +
      "    var offset = i - activeIndex;\n" +
      "    var card = cards[i];\n" +
      '    card.classList.toggle("active", offset === 0);\n' +
      "    if (offset === 0) {\n" +
      '      card.style.transform = "translateX(0) translateZ(250px) rotateY(0deg)";\n' +
      "      card.style.zIndex = 100;\n" +
      "      card.style.opacity = 1;\n" +
      '      card.style.filter = "brightness(1.1)";\n' +
      "    } else if (offset < 0) {\n" +
      "      card.style.zIndex = 100 + offset;\n" +
      '      card.style.transform = "translateX(" + (offset * 120 - 200) + "px) translateZ(0px) rotateY(45deg) scale(0.8)";\n' +
      "      card.style.opacity = 0.6;\n" +
      '      card.style.filter = "brightness(0.6)";\n' +
      "    } else {\n" +
      "      card.style.zIndex = 100 - offset;\n" +
      '      card.style.transform = "translateX(" + (offset * 120 + 200) + "px) translateZ(0px) rotateY(-45deg) scale(0.8)";\n' +
      "      card.style.opacity = 0.6;\n" +
      '      card.style.filter = "brightness(0.6)";\n' +
      "    }\n" +
      "  }\n" +
      "}\n" +
      "\n" +
      "function navigate(dir) {\n" +
      "  var newIndex = activeIndex + dir;\n" +
      "  if (newIndex < 0) newIndex = ITEMS.length - 1;\n" +
      "  if (newIndex >= ITEMS.length) newIndex = 0;\n" +
      "  update3D(newIndex);\n" +
      "}\n" +
      "\n" +
      "function openDetail(index) {\n" +
      "  var item = ITEMS[index];\n" +
      '  var d = document.createElement("div");\n' +
      '  d.className = "popup-" + ID + "-detail";\n' +
      '  d.id = "popup-" + ID + "-detail";\n' +
      "\n" +
      '  var extrasHTML = "";\n' +
      "  if (item.extraImages && item.extraImages.length > 0) {\n" +
      "    extrasHTML = '<p style=\"color:rgba(255,255,255,0.5);font-size:14px;text-transform:uppercase;letter-spacing:2px;margin:35px 0 15px;\">' + SETTINGS.extraImagesLabel + '</p><div style=\"display:flex;gap:15px;flex-wrap:wrap;\">';\n" +
      "    for (var e = 0; e < item.extraImages.length; e++) {\n" +
      "      extrasHTML += '<img src=\"' + item.extraImages[e] + '\" data-extra=\"' + e + '\" class=\"popup-' + ID + '-extra-img\">';\n" +
      "    }\n" +
      '    extrasHTML += "</div>";\n' +
      "  }\n" +
      "\n" +
      "  d.innerHTML = '<button class=\"popup-' + ID + '-detail-close\">✕</button>' +\n" +
      "    '<div class=\"popup-' + ID + '-detail-content\">' +\n" +
      "    '<img id=\"popup-' + ID + '-main-img\" src=\"' + item.image + '\" style=\"width:100%;max-height:450px;object-fit:cover;border-radius:16px;box-shadow:0 20px 60px rgba(0,0,0,0.5);\">' +\n" +
      "    '<h2 style=\"color:white;font-size:32px;margin:30px 0 15px;font-weight:600;\">' + item.title + '</h2>' +\n" +
      "    '<p style=\"color:rgba(255,255,255,0.8);font-size:17px;line-height:1.7;margin-bottom:35px;\">' + item.description + '</p>' +\n" +
      "    extrasHTML +\n" +
      "    '</div>';\n" +
      "\n" +
      "  document.body.appendChild(d);\n" +
      "\n" +
      '  setTimeout(function() { d.style.display = "block"; d.classList.add("active"); }, 10);\n' +
      "\n" +
      '  d.querySelector(".popup-" + ID + "-detail-close").onclick = closeDetail;\n' +
      "  d.onclick = function(ev) {\n" +
      "    if (ev.target === d) closeDetail();\n" +
      "    if (ev.target.dataset.extra !== undefined) {\n" +
      '      document.getElementById("popup-" + ID + "-main-img").src = item.extraImages[ev.target.dataset.extra];\n' +
      "    }\n" +
      "  };\n" +
      "}\n" +
      "\n" +
      "function closeDetail() {\n" +
      '  var d = document.getElementById("popup-" + ID + "-detail");\n' +
      "  if (d) {\n" +
      '    d.classList.remove("active");\n' +
      "    setTimeout(function() { d.remove(); }, 400);\n" +
      "  }\n" +
      "}\n" +
      "\n" +
      "function openLightbox(index) {\n" +
      "  var item = ITEMS[index];\n" +
      '  var lb = document.createElement("div");\n' +
      '  lb.className = "popup-" + ID + "-lightbox";\n' +
      '  lb.id = "popup-" + ID + "-lightbox";\n' +
      "  lb.innerHTML = '<img src=\"' + item.image + '\" alt=\"\">';\n" +
      "  document.body.appendChild(lb);\n" +
      '  setTimeout(function() { lb.classList.add("active"); }, 10);\n' +
      "  lb.onclick = closeLightbox;\n" +
      "}\n" +
      "\n" +
      "function closeLightbox() {\n" +
      '  var lb = document.getElementById("popup-" + ID + "-lightbox");\n' +
      "  if (lb) {\n" +
      '    lb.classList.remove("active");\n' +
      "    setTimeout(function() { lb.remove(); }, 300);\n" +
      "  }\n" +
      "}\n" +
      "\n" +
      "function closeOverlay() {\n" +
      "  if (overlay) {\n" +
      '    overlay.classList.remove("active");\n' +
      "    setTimeout(function() { if (overlay) { overlay.remove(); overlay = null; } }, 500);\n" +
      "  }\n" +
      "}\n" +
      "\n" +
      "function closeAll() {\n" +
      "  closeDetail();\n" +
      "  closeLightbox();\n" +
      "  closeOverlay();\n" +
      "}\n" +
      "\n" +
      'document.addEventListener("keydown", function(ev) {\n' +
      "  if (!overlay) return;\n" +
      '  var detail = document.getElementById("popup-" + ID + "-detail");\n' +
      '  var lightbox = document.getElementById("popup-" + ID + "-lightbox");\n' +
      '  if (ev.key === "Escape") {\n' +
      "    if (detail) closeDetail();\n" +
      "    else if (lightbox) closeLightbox();\n" +
      "    else closeOverlay();\n" +
      "  }\n" +
      '  if (ev.key === "ArrowRight" && !detail && !lightbox) navigate(1);\n' +
      '  if (ev.key === "ArrowLeft" && !detail && !lightbox) navigate(-1);\n' +
      '  if (ev.key === "Enter" && !detail && !lightbox) {\n' +
      "    if (SETTINGS.showDetailPopup) openDetail(activeIndex);\n" +
      "    else openLightbox(activeIndex);\n" +
      "  }\n" +
      "});\n" +
      "\n" +
      "window.atlantisPopups = window.atlantisPopups || {};\n" +
      "window.atlantisPopups[ID] = { show: show, close: closeAll, config: { settings: SETTINGS, items: ITEMS } };\n" +
      "\n" +
      'console.log("🎠 Popup Gallery 3D " + ID + " chargée (" + ITEMS.length + " images)");\n' +
      "})();"
    );
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

console.log("🎠 Template Gallery 3D v1.4 chargé (preview améliorée)");
