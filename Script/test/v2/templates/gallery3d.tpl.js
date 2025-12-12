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
 * v1.9 - 2024-12-11 - Focal Point Picker: clic sur miniature pour choisir le point focal
 * v2.0 - 2024-12-11 - Fix Focal: conteneur carré + contain + calcul coordonnées correct
 * v2.1 - 2024-12-11 - Fix Focal: dispatch event pour X ET Y (preview temps réel)
 * v3.0 - 2024-12-11 - Focal Point sur images supplémentaires (extraImages devient objets)
 * v3.1 - 2024-12-12 - Fix: détail update en place + track extra sélectionné
 * ============================================
 */

window.ATLANTIS_TEMPLATES = window.ATLANTIS_TEMPLATES || {};

// State global pour la preview interactive
window._gallery3dPreview = {
  activeIndex: 0,
  items: [],
  settings: {},
  detailOpenIndex: null, // v3.1 - Garde l'état du détail ouvert
  detailExtraIndex: null, // v3.1 - Garde l'index de l'extra affiché (null = image principale)
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

  // v3.1 - Garder trace du détail ouvert + reset extra sélectionné
  state.detailOpenIndex = index;
  state.detailExtraIndex = null; // On repart sur l'image principale

  var focalX = item.focalX !== undefined ? item.focalX : 50;
  var focalY = item.focalY !== undefined ? item.focalY : 50;

  // Créer le détail avec support focal sur extras
  var extraImagesHTML = "";
  if (item.extraImages && item.extraImages.length > 0) {
    extraImagesHTML =
      '<p style="color:rgba(255,255,255,0.4);font-size:11px;text-transform:uppercase;letter-spacing:1px;margin:16px 0 8px;">' +
      (state.settings.extraImagesLabel || "Plus de photos") +
      "</p>" +
      '<div style="display:flex;gap:8px;flex-wrap:wrap;">';
    item.extraImages.forEach(function (extra, ei) {
      var extraUrl = typeof extra === "object" ? extra.url : extra;
      var extraFX =
        typeof extra === "object" && extra.focalX !== undefined
          ? extra.focalX
          : 50;
      var extraFY =
        typeof extra === "object" && extra.focalY !== undefined
          ? extra.focalY
          : 50;
      extraImagesHTML +=
        '<img src="' +
        extraUrl +
        '" ' +
        'data-extra="' +
        ei +
        '" ' +
        'data-focal-x="' +
        extraFX +
        '" ' +
        'data-focal-y="' +
        extraFY +
        '" ' +
        'style="width:60px;height:45px;object-fit:cover;object-position:' +
        extraFX +
        "% " +
        extraFY +
        '%;border-radius:6px;cursor:pointer;opacity:0.7;transition:opacity 0.2s;" ' +
        'onmouseover="this.style.opacity=1" onmouseout="this.style.opacity=0.7">';
    });
    extraImagesHTML += "</div>";
  }

  var detailHTML =
    '<div id="preview-detail-overlay" style="' +
    "position:absolute;inset:0;background:rgba(0,0,0,0.95);z-index:200;" +
    "display:flex;align-items:center;justify-content:center;" +
    "animation:fadeIn 0.3s ease;" +
    '">' +
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
    "object-position:" +
    focalX +
    "% " +
    focalY +
    "%;" +
    '">' +
    '<button onclick="window._gallery3dPreviewCloseDetail()" style="' +
    "position:absolute;top:12px;right:12px;width:32px;height:32px;" +
    "background:rgba(0,0,0,0.6);border:none;border-radius:50%;" +
    "color:white;font-size:16px;cursor:pointer;" +
    '">✕</button>' +
    "</div>" +
    '<div style="padding:20px;">' +
    '<h3 id="preview-detail-title" style="color:white;font-size:18px;margin:0 0 8px;font-weight:600;">' +
    (item.title || "Sans titre") +
    "</h3>" +
    '<div id="preview-detail-back-link"></div>' +
    '<p id="preview-detail-desc" style="color:rgba(255,255,255,0.7);font-size:13px;line-height:1.5;margin:0;">' +
    (item.description || "Aucune description") +
    "</p>" +
    '<div id="preview-detail-extras">' +
    extraImagesHTML +
    "</div>" +
    "</div>" +
    "</div>" +
    "</div>";

  var container = document.getElementById("tpl-preview-stage");
  if (container) {
    container.insertAdjacentHTML("beforeend", detailHTML);

    // Ajouter le listener pour les clics sur les extras
    var overlay = document.getElementById("preview-detail-overlay");
    if (overlay) {
      overlay.addEventListener("click", function (e) {
        if (e.target === overlay) {
          window._gallery3dPreviewCloseDetail();
          return;
        }
        if (e.target.dataset.extra !== undefined) {
          var extraIndex = parseInt(e.target.dataset.extra, 10);
          // v3.1 - Tracker quel extra est affiché
          window._gallery3dPreview.detailExtraIndex = extraIndex;

          var mainImg = document.getElementById("preview-detail-main-img");
          if (mainImg) {
            mainImg.src = e.target.src;
            var newFX = e.target.dataset.focalX || 50;
            var newFY = e.target.dataset.focalY || 50;
            mainImg.style.objectPosition = newFX + "% " + newFY + "%";
          }
        }
      });
    }
  }
};

window._gallery3dPreviewSetMainImg = function (url) {
  var img = document.getElementById("preview-detail-main-img");
  if (img) img.src = url;
};

// v3.1 - Met à jour le contenu du détail en place (sans recréer le HTML)
window._gallery3dPreviewUpdateDetail = function () {
  var state = window._gallery3dPreview;
  var index = state.detailOpenIndex;
  if (index === null || index === undefined) return;

  var item = state.items[index];
  if (!item) return;

  // v3.1 - Si un extra est sélectionné, afficher l'extra, sinon l'image principale
  var imgSrc, focalX, focalY;
  var extraIdx = state.detailExtraIndex;

  if (
    extraIdx !== null &&
    extraIdx !== undefined &&
    item.extraImages &&
    item.extraImages[extraIdx]
  ) {
    var extra = item.extraImages[extraIdx];
    imgSrc = typeof extra === "object" ? extra.url : extra;
    focalX =
      typeof extra === "object" && extra.focalX !== undefined
        ? extra.focalX
        : 50;
    focalY =
      typeof extra === "object" && extra.focalY !== undefined
        ? extra.focalY
        : 50;
  } else {
    imgSrc = item.image || "";
    focalX = item.focalX !== undefined ? item.focalX : 50;
    focalY = item.focalY !== undefined ? item.focalY : 50;
  }

  // Mettre à jour l'image principale du détail
  var mainImg = document.getElementById("preview-detail-main-img");
  if (mainImg) {
    mainImg.src = imgSrc;
    mainImg.style.objectPosition = focalX + "% " + focalY + "%";
  }

  // Mettre à jour le titre
  var titleEl = document.getElementById("preview-detail-title");
  if (titleEl) {
    titleEl.textContent = item.title || "Sans titre";
  }

  // v3.1 - Mettre à jour le lien de retour (visible seulement si un extra est affiché)
  var backLinkEl = document.getElementById("preview-detail-back-link");
  if (backLinkEl) {
    if (extraIdx !== null && extraIdx !== undefined) {
      backLinkEl.innerHTML =
        '<a href="#" onclick="window._gallery3dPreviewBackToMain();return false;" ' +
        'style="color:#6366f1;font-size:11px;text-decoration:none;display:inline-block;margin-bottom:8px;">' +
        "← Retour à l'image principale</a>";
    } else {
      backLinkEl.innerHTML = "";
    }
  }

  // Mettre à jour la description
  var descEl = document.getElementById("preview-detail-desc");
  if (descEl) {
    descEl.textContent = item.description || "Aucune description";
  }

  // Mettre à jour les extras
  var extrasContainer = document.getElementById("preview-detail-extras");
  if (extrasContainer) {
    var extraImagesHTML = "";
    if (item.extraImages && item.extraImages.length > 0) {
      extraImagesHTML =
        '<p style="color:rgba(255,255,255,0.4);font-size:11px;text-transform:uppercase;letter-spacing:1px;margin:16px 0 8px;">' +
        (state.settings.extraImagesLabel || "Plus de photos") +
        "</p>" +
        '<div style="display:flex;gap:8px;flex-wrap:wrap;">';
      item.extraImages.forEach(function (extra, ei) {
        var extraUrl = typeof extra === "object" ? extra.url : extra;
        var extraFX =
          typeof extra === "object" && extra.focalX !== undefined
            ? extra.focalX
            : 50;
        var extraFY =
          typeof extra === "object" && extra.focalY !== undefined
            ? extra.focalY
            : 50;
        // v3.1 - Highlight si cet extra est sélectionné
        var isSelected = state.detailExtraIndex === ei;
        var borderStyle = isSelected
          ? "2px solid #6366f1"
          : "2px solid transparent";
        var opacityStyle = isSelected ? "1" : "0.7";
        extraImagesHTML +=
          '<img src="' +
          extraUrl +
          '" ' +
          'data-extra="' +
          ei +
          '" ' +
          'data-focal-x="' +
          extraFX +
          '" ' +
          'data-focal-y="' +
          extraFY +
          '" ' +
          'style="width:60px;height:45px;object-fit:cover;object-position:' +
          extraFX +
          "% " +
          extraFY +
          "%;border-radius:6px;cursor:pointer;" +
          "opacity:" +
          opacityStyle +
          ";border:" +
          borderStyle +
          ';transition:all 0.2s;" ' +
          'onmouseover="this.style.opacity=1" onmouseout="this.style.opacity=' +
          opacityStyle +
          '">';
      });
      extraImagesHTML += "</div>";
    }
    extrasContainer.innerHTML = extraImagesHTML;
  }
};

// v3.1 - Fermer le détail et rafraîchir le carrousel
window._gallery3dPreviewCloseDetail = function () {
  window._gallery3dPreview.detailOpenIndex = null;
  window._gallery3dPreview.detailExtraIndex = null; // Reset l'extra aussi
  var overlay = document.getElementById("preview-detail-overlay");
  if (overlay) overlay.remove();

  // Demander à template-editor de rafraîchir la preview (si disponible)
  if (typeof window._atlantisRefreshPreview === "function") {
    window._atlantisRefreshPreview();
  }
};

// v3.1 - Revenir à l'image principale (depuis un extra)
window._gallery3dPreviewBackToMain = function () {
  window._gallery3dPreview.detailExtraIndex = null;
  window._gallery3dPreviewUpdateDetail();
};

// ===== FOCAL POINT PICKER - IMAGE PRINCIPALE =====
window._gallery3dFocalPick = function (event, index) {
  event.stopPropagation();
  var container = event.currentTarget;
  var img = container.querySelector("img");
  var rect = container.getBoundingClientRect();

  // Calculer les coordonnées brutes dans le conteneur
  var clickX = event.clientX - rect.left;
  var clickY = event.clientY - rect.top;

  // Avec object-fit:contain, l'image peut avoir des bandes vides
  // On doit calculer où l'image est réellement positionnée
  var containerW = rect.width;
  var containerH = rect.height;

  // Récupérer les dimensions naturelles de l'image
  var imgW = img.naturalWidth || containerW;
  var imgH = img.naturalHeight || containerH;

  // Calculer le ratio de l'image vs conteneur
  var imgRatio = imgW / imgH;
  var containerRatio = containerW / containerH;

  var displayW, displayH, offsetX, offsetY;

  if (imgRatio > containerRatio) {
    // Image plus large que le conteneur (bandes en haut/bas)
    displayW = containerW;
    displayH = containerW / imgRatio;
    offsetX = 0;
    offsetY = (containerH - displayH) / 2;
  } else {
    // Image plus haute que le conteneur (bandes gauche/droite)
    displayH = containerH;
    displayW = containerH * imgRatio;
    offsetX = (containerW - displayW) / 2;
    offsetY = 0;
  }

  // Convertir le clic en coordonnées relatives à l'image
  var relX = (clickX - offsetX) / displayW;
  var relY = (clickY - offsetY) / displayH;

  // Convertir en pourcentage (0-100)
  var x = Math.round(relX * 100);
  var y = Math.round(relY * 100);

  // Clamp entre 0 et 100
  x = Math.max(0, Math.min(100, x));
  y = Math.max(0, Math.min(100, y));

  // Mettre à jour le point visuel - position par rapport au CONTENEUR
  var dot = container.querySelector(".focal-dot");
  if (dot) {
    // Convertir les coordonnées image (x%, y%) en coordonnées conteneur
    var dotLeft = offsetX + (displayW * x) / 100;
    var dotTop = offsetY + (displayH * y) / 100;
    dot.style.left = (dotLeft / containerW) * 100 + "%";
    dot.style.top = (dotTop / containerH) * 100 + "%";
  }

  // Mettre à jour le label
  var label = document.getElementById("focal-label-" + index);
  if (label) {
    label.textContent = x + "%, " + y + "%";
  }

  // Mettre à jour les champs cachés
  var inputX = document.getElementById("tpl-item-focalX-" + index);
  var inputY = document.getElementById("tpl-item-focalY-" + index);
  if (inputX) inputX.value = x;
  if (inputY) inputY.value = y;

  // Déclencher les events pour la mise à jour des données (X ET Y)
  if (inputX) {
    inputX.dispatchEvent(new Event("input", { bubbles: true }));
  }
  if (inputY) {
    inputY.dispatchEvent(new Event("input", { bubbles: true }));
  }
};

window._gallery3dFocalReset = function (event, index) {
  event.stopPropagation();
  event.preventDefault();

  // Reset à 50%, 50%
  var container = document.getElementById("focal-picker-" + index);
  if (container) {
    var dot = container.querySelector(".focal-dot");
    if (dot) {
      dot.style.left = "50%";
      dot.style.top = "50%";
    }
  }

  var label = document.getElementById("focal-label-" + index);
  if (label) {
    label.textContent = "50%, 50%";
  }

  var inputX = document.getElementById("tpl-item-focalX-" + index);
  var inputY = document.getElementById("tpl-item-focalY-" + index);
  if (inputX) inputX.value = 50;
  if (inputY) inputY.value = 50;

  // Déclencher les events pour la mise à jour des données (X ET Y)
  if (inputX) {
    inputX.dispatchEvent(new Event("input", { bubbles: true }));
  }
  if (inputY) {
    inputY.dispatchEvent(new Event("input", { bubbles: true }));
  }
};

// ===== FOCAL POINT PICKER - IMAGES SUPPLÉMENTAIRES (v3.0) =====
window._gallery3dExtraFocalPick = function (event, itemIndex, extraIndex) {
  event.stopPropagation();
  var container = event.currentTarget;
  var img = container.querySelector("img");
  var rect = container.getBoundingClientRect();

  var clickX = event.clientX - rect.left;
  var clickY = event.clientY - rect.top;
  var containerW = rect.width;
  var containerH = rect.height;
  var imgW = img.naturalWidth || containerW;
  var imgH = img.naturalHeight || containerH;
  var imgRatio = imgW / imgH;
  var containerRatio = containerW / containerH;

  var displayW, displayH, offsetX, offsetY;
  if (imgRatio > containerRatio) {
    displayW = containerW;
    displayH = containerW / imgRatio;
    offsetX = 0;
    offsetY = (containerH - displayH) / 2;
  } else {
    displayH = containerH;
    displayW = containerH * imgRatio;
    offsetX = (containerW - displayW) / 2;
    offsetY = 0;
  }

  var relX = (clickX - offsetX) / displayW;
  var relY = (clickY - offsetY) / displayH;
  var x = Math.round(relX * 100);
  var y = Math.round(relY * 100);
  x = Math.max(0, Math.min(100, x));
  y = Math.max(0, Math.min(100, y));

  var dot = container.querySelector(".focal-dot");
  if (dot) {
    var dotLeft = offsetX + (displayW * x) / 100;
    var dotTop = offsetY + (displayH * y) / 100;
    dot.style.left = (dotLeft / containerW) * 100 + "%";
    dot.style.top = (dotTop / containerH) * 100 + "%";
  }

  var label = document.getElementById(
    "extra-focal-label-" + itemIndex + "-" + extraIndex
  );
  if (label) label.textContent = x + "%, " + y + "%";

  var inputX = document.getElementById(
    "tpl-extra-focalX-" + itemIndex + "-" + extraIndex
  );
  var inputY = document.getElementById(
    "tpl-extra-focalY-" + itemIndex + "-" + extraIndex
  );
  if (inputX) inputX.value = x;
  if (inputY) inputY.value = y;

  if (inputX) inputX.dispatchEvent(new Event("input", { bubbles: true }));
  if (inputY) inputY.dispatchEvent(new Event("input", { bubbles: true }));
};

window._gallery3dExtraFocalReset = function (event, itemIndex, extraIndex) {
  event.stopPropagation();
  event.preventDefault();

  var container = document.getElementById(
    "extra-focal-picker-" + itemIndex + "-" + extraIndex
  );
  if (container) {
    var dot = container.querySelector(".focal-dot");
    if (dot) {
      dot.style.left = "50%";
      dot.style.top = "50%";
    }
  }

  var label = document.getElementById(
    "extra-focal-label-" + itemIndex + "-" + extraIndex
  );
  if (label) label.textContent = "50%, 50%";

  var inputX = document.getElementById(
    "tpl-extra-focalX-" + itemIndex + "-" + extraIndex
  );
  var inputY = document.getElementById(
    "tpl-extra-focalY-" + itemIndex + "-" + extraIndex
  );
  if (inputX) inputX.value = 50;
  if (inputY) inputY.value = 50;

  if (inputX) inputX.dispatchEvent(new Event("input", { bubbles: true }));
  if (inputY) inputY.dispatchEvent(new Event("input", { bubbles: true }));
};

window.ATLANTIS_TEMPLATES.gallery3d = {
  name: "Galerie 3D",
  icon: "🎠",
  description: "Carrousel 3D avec vue détaillée",

  // ===== DONNÉES PAR DÉFAUT (v3.0 - extraImages comme objets) =====
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
            {
              url: "https://images.unsplash.com/photo-1519052537078-e6302a4968d4?w=400",
              focalX: 50,
              focalY: 50,
            },
            {
              url: "https://images.unsplash.com/photo-1574144611937-0df059b5ef3e?w=400",
              focalX: 50,
              focalY: 50,
            },
          ],
          focalX: 50,
          focalY: 50,
        },
        {
          image:
            "https://images.unsplash.com/photo-1573865526739-10659fec78a5?w=800",
          hoverText: "👁 Voir détails",
          title: "Moustache le Curieux",
          description:
            "Ce chat tigré est toujours en quête d'aventure. Sa curiosité légendaire l'amène à explorer chaque recoin de la maison.",
          extraImages: [
            {
              url: "https://images.unsplash.com/photo-1526336024174-e58f5cdd8e13?w=400",
              focalX: 50,
              focalY: 50,
            },
          ],
          focalX: 50,
          focalY: 30,
        },
        {
          image:
            "https://images.unsplash.com/photo-1495360010541-f48722b34f7d?w=800",
          hoverText: "👁 Voir détails",
          title: "Émeraude",
          description:
            "Ses yeux verts hypnotiques lui ont valu son nom. Émeraude est une chatte douce et câline.",
          extraImages: [],
          focalX: 50,
          focalY: 50,
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
    var focalX = item.focalX !== undefined ? item.focalX : 50;
    var focalY = item.focalY !== undefined ? item.focalY : 50;

    // v3.0 - Render extra images avec focal picker
    var extraImagesHTML = (item.extraImages || [])
      .map(function (extra, ei) {
        var extraUrl = typeof extra === "object" ? extra.url : extra;
        var extraFX =
          typeof extra === "object" && extra.focalX !== undefined
            ? extra.focalX
            : 50;
        var extraFY =
          typeof extra === "object" && extra.focalY !== undefined
            ? extra.focalY
            : 50;

        return (
          '<div class="tpl-extra-image-card" style="background:rgba(15,23,42,0.5);border:1px solid #1e293b;border-radius:10px;padding:12px;margin-top:10px;">' +
          // URL input + remove button
          '<div style="display:flex;gap:8px;align-items:center;margin-bottom:10px;">' +
          '<input type="text" class="tpl-input url" style="flex:1;font-size:11px;"' +
          ' id="tpl-item-' +
          index +
          "-extra-" +
          ei +
          '"' +
          ' name="item_' +
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
          helpers.escapeHtml(extraUrl) +
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
          "</div>" +
          // Focal picker pour l'extra
          '<div style="display:flex;gap:10px;align-items:flex-start;">' +
          '<div id="extra-focal-picker-' +
          index +
          "-" +
          ei +
          '"' +
          ' onclick="window._gallery3dExtraFocalPick(event, ' +
          index +
          ", " +
          ei +
          ')"' +
          ' style="position:relative;width:80px;height:80px;border-radius:6px;overflow:hidden;cursor:crosshair;border:2px solid #334155;flex-shrink:0;background:#1e293b;">' +
          '<img src="' +
          helpers.escapeHtml(extraUrl) +
          '"' +
          ' style="width:100%;height:100%;object-fit:contain;pointer-events:none;"' +
          " onerror=\"this.src='data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 80 80%22><rect fill=%22%23374151%22 width=%2280%22 height=%2280%22/><text x=%2240%22 y=%2245%22 fill=%22%239CA3AF%22 text-anchor=%22middle%22 font-size=%228%22>Image</text></svg>'\">" +
          '<div class="focal-dot" style="position:absolute;width:12px;height:12px;background:rgba(239,68,68,0.9);border:2px solid white;border-radius:50%;box-shadow:0 2px 6px rgba(0,0,0,0.5);transform:translate(-50%,-50%);pointer-events:none;left:' +
          extraFX +
          "%;top:" +
          extraFY +
          '%;"></div>' +
          "</div>" +
          '<div style="flex:1;">' +
          '<div style="color:#94a3b8;font-size:10px;margin-bottom:6px;">📍 Point focal</div>' +
          '<div style="display:flex;align-items:center;gap:8px;">' +
          '<span style="color:#e2e8f0;font-size:11px;">Position: <span id="extra-focal-label-' +
          index +
          "-" +
          ei +
          '" style="color:#6366f1;font-weight:600;">' +
          extraFX +
          "%, " +
          extraFY +
          "%</span></span>" +
          '<button type="button" onclick="window._gallery3dExtraFocalReset(event, ' +
          index +
          ", " +
          ei +
          ')"' +
          ' style="background:#1e293b;border:1px solid #334155;color:#94a3b8;padding:3px 8px;border-radius:4px;font-size:10px;cursor:pointer;">↺</button>' +
          "</div>" +
          "</div>" +
          "</div>" +
          // Hidden inputs pour focal
          '<input type="hidden" id="tpl-extra-focalX-' +
          index +
          "-" +
          ei +
          '"' +
          ' name="extra_focalX_' +
          index +
          "_" +
          ei +
          '"' +
          ' data-extra-field="focalX" data-item-index="' +
          index +
          '" data-extra-index="' +
          ei +
          '"' +
          ' value="' +
          extraFX +
          '">' +
          '<input type="hidden" id="tpl-extra-focalY-' +
          index +
          "-" +
          ei +
          '"' +
          ' name="extra_focalY_' +
          index +
          "_" +
          ei +
          '"' +
          ' data-extra-field="focalY" data-item-index="' +
          index +
          '" data-extra-index="' +
          ei +
          '"' +
          ' value="' +
          extraFY +
          '">' +
          "</div>"
        );
      })
      .join("");

    // Focal Point Picker HTML pour image principale
    var focalPickerHTML =
      '<div class="tpl-field-group" style="margin-top:16px;">' +
      '<div class="tpl-field-label">📍 Point focal (cliquez sur l\'image)</div>' +
      '<div style="display:flex;gap:12px;align-items:flex-start;margin-top:8px;">' +
      // Miniature cliquable - CARRÉ pour voir toute l'image
      '<div id="focal-picker-' +
      index +
      '" ' +
      'onclick="window._gallery3dFocalPick(event, ' +
      index +
      ')" ' +
      'style="' +
      "position:relative;" +
      "width:120px;" +
      "height:120px;" +
      "border-radius:8px;" +
      "overflow:hidden;" +
      "cursor:crosshair;" +
      "border:2px solid #334155;" +
      "flex-shrink:0;" +
      "background:#1e293b;" +
      '">' +
      '<img src="' +
      helpers.escapeHtml(item.image || "") +
      '" ' +
      'style="width:100%;height:100%;object-fit:contain;pointer-events:none;" ' +
      "onerror=\"this.src='data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 120 120%22><rect fill=%22%23374151%22 width=%22120%22 height=%22120%22/><text x=%2260%22 y=%2265%22 fill=%22%239CA3AF%22 text-anchor=%22middle%22 font-size=%2210%22>Image</text></svg>'\">" +
      // Point focal (dot)
      '<div class="focal-dot" style="' +
      "position:absolute;" +
      "width:16px;" +
      "height:16px;" +
      "background:rgba(239,68,68,0.9);" +
      "border:2px solid white;" +
      "border-radius:50%;" +
      "box-shadow:0 2px 8px rgba(0,0,0,0.5);" +
      "transform:translate(-50%,-50%);" +
      "pointer-events:none;" +
      "left:" +
      focalX +
      "%;" +
      "top:" +
      focalY +
      "%;" +
      '"></div>' +
      // Crosshair overlay
      '<div style="' +
      "position:absolute;inset:0;" +
      "pointer-events:none;" +
      "background:linear-gradient(to right, transparent 49.5%, rgba(255,255,255,0.15) 49.5%, rgba(255,255,255,0.15) 50.5%, transparent 50.5%)," +
      "linear-gradient(to bottom, transparent 49.5%, rgba(255,255,255,0.15) 49.5%, rgba(255,255,255,0.15) 50.5%, transparent 50.5%);" +
      '"></div>' +
      "</div>" +
      // Info + Reset button
      '<div style="flex:1;">' +
      '<div style="color:#94a3b8;font-size:11px;margin-bottom:8px;">' +
      "Cliquez sur la miniature pour définir le point de focus. " +
      "C'est la zone qui restera visible si l'image est recadrée." +
      "</div>" +
      '<div style="display:flex;align-items:center;gap:10px;">' +
      '<span style="color:#e2e8f0;font-size:12px;">Position: <span id="focal-label-' +
      index +
      '" style="color:#6366f1;font-weight:600;">' +
      focalX +
      "%, " +
      focalY +
      "%</span></span>" +
      '<button type="button" onclick="window._gallery3dFocalReset(event, ' +
      index +
      ')" ' +
      'style="' +
      "background:#1e293b;" +
      "border:1px solid #334155;" +
      "color:#94a3b8;" +
      "padding:4px 10px;" +
      "border-radius:6px;" +
      "font-size:11px;" +
      "cursor:pointer;" +
      '">↺ Centrer</button>' +
      "</div>" +
      "</div>" +
      "</div>" +
      // Hidden inputs pour stocker les valeurs
      '<input type="hidden" id="tpl-item-focalX-' +
      index +
      '" name="item_focalX_' +
      index +
      '" ' +
      'data-item-field="focalX" data-index="' +
      index +
      '" value="' +
      focalX +
      '">' +
      '<input type="hidden" id="tpl-item-focalY-' +
      index +
      '" name="item_focalY_' +
      index +
      '" ' +
      'data-item-field="focalY" data-index="' +
      index +
      '" value="' +
      focalY +
      '">' +
      "</div>";

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
      // URL Image
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
      // ===== FOCAL POINT PICKER =====
      focalPickerHTML +
      // Hover text
      '<div class="tpl-field-group" style="margin-top:16px;">' +
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
      // Détails popup
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
      '<div class="tpl-field-label" style="margin:0;">Images supplémentaires</div>' +
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

  // ===== APERÇU LIVE INTERACTIF - v3.0 avec focal point sur extras =====
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
        var focalX = item.focalX !== undefined ? item.focalX : 50;
        var focalY = item.focalY !== undefined ? item.focalY : 50;

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
          "object-position:" +
          focalX +
          "% " +
          focalY +
          "%;" +
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
          "background-position:" +
          focalX +
          "% " +
          focalY +
          "%;" +
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
      '">' +
      '<span style="color:#94a3b8;font-size:12px;" id="preview-gallery-counter">' +
      (activeIndex + 1) +
      " / " +
      items.length +
      "</span>" +
      '<span style="opacity:0.5;">•</span>' +
      '<span style="color:#6366f1;">Cliquez sur l\'image active pour voir les détails</span>' +
      "</div>";

    return (
      stylesHTML +
      '<div style="display:flex;flex-direction:column;align-items:center;justify-content:center;width:100%;height:100%;">' +
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

  // ===== GÉNÉRATION DU JS FINAL (v3.0 - extraImages comme objets avec focal) =====
  generateJS: function (objectName, data) {
    var self = this;
    var settings = data.settings || {
      showDetailPopup: true,
      extraImagesLabel: "Plus de photos",
    };
    var items = data.items || [];

    // Construire le tableau d'items avec focal points (y compris sur extras)
    var itemsCode = items
      .map(function (item) {
        var focalX = item.focalX !== undefined ? item.focalX : 50;
        var focalY = item.focalY !== undefined ? item.focalY : 50;

        // v3.0 - Générer les extraImages comme tableau d'objets avec focal
        var extraImgsCode = (item.extraImages || [])
          .map(function (extra) {
            var url = typeof extra === "object" ? extra.url : extra;
            var fX =
              typeof extra === "object" && extra.focalX !== undefined
                ? extra.focalX
                : 50;
            var fY =
              typeof extra === "object" && extra.focalY !== undefined
                ? extra.focalY
                : 50;
            return (
              '{url:"' +
              self.escapeJS(url) +
              '",focalX:' +
              fX +
              ",focalY:" +
              fY +
              "}"
            );
          })
          .join(",");

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
          "focalX:" +
          focalX +
          "," +
          "focalY:" +
          focalY +
          "," +
          "extraImages:[" +
          extraImgsCode +
          "]" +
          "}"
        );
      })
      .join(",\n  ");

    return (
      "/**\n * 🎠 Popup Gallery 3D - " +
      objectName +
      "\n * Généré le " +
      new Date().toISOString().replace("T", " ").substr(0, 19) +
      "\n */\n" +
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
      "var ITEMS = [\n  " +
      itemsCode +
      "\n];\n" +
      "\n" +
      "var overlay = null;\n" +
      "var activeIndex = 0;\n" +
      "\n" +
      "function injectStyles() {\n" +
      '  if (document.getElementById("popup-" + ID + "-styles")) return;\n' +
      '  var s = document.createElement("style");\n' +
      '  s.id = "popup-" + ID + "-styles";\n' +
      "  s.textContent = " +
      '".popup-" + ID + "-overlay{position:fixed;inset:0;background:rgba(0,0,0,0.85);backdrop-filter:blur(10px);z-index:99999;display:flex;opacity:0;transition:opacity 0.5s ease;perspective:1000px;overflow:hidden;font-family:sans-serif}" +\n' +
      '    ".popup-" + ID + "-overlay.active{opacity:1}" +\n' +
      '    ".popup-" + ID + "-carousel{position:absolute;top:45%;left:50%;transform:translate(-50%,-50%);width:100%;height:60%;display:flex;justify-content:center;align-items:center;transform-style:preserve-3d}" +\n' +
      '    ".popup-" + ID + "-card{position:absolute;width:500px;height:350px;background:#000;border-radius:12px;box-shadow:0 20px 50px rgba(0,0,0,0.8);transition:all 0.6s cubic-bezier(0.25,0.8,0.25,1);cursor:pointer;overflow:visible;will-change:transform,opacity,filter;backface-visibility:hidden}" +\n' +
      '    ".popup-" + ID + "-card img{width:100%;height:100%;object-fit:cover;pointer-events:none;border-radius:12px}" +\n' +
      '    ".popup-" + ID + "-reflection{position:absolute;top:100%;left:0;width:100%;height:60%;margin-top:10px;background-size:cover;transform:scaleY(-1);border-radius:12px;pointer-events:none;-webkit-mask-image:linear-gradient(to top,rgba(0,0,0,0.35) 0%,rgba(0,0,0,0.1) 50%,transparent 100%);mask-image:linear-gradient(to top,rgba(0,0,0,0.35) 0%,rgba(0,0,0,0.1) 50%,transparent 100%)}" +\n' +
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
      "    var fX = ITEMS[i].focalX || 50;\n" +
      "    var fY = ITEMS[i].focalY || 50;\n" +
      "    cardsHTML += '<div class=\"popup-' + ID + '-card\" data-index=\"' + i + '\">' +\n" +
      "      '<img src=\"' + ITEMS[i].image + '\" alt=\"\" style=\"object-position:' + fX + '% ' + fY + '%\">' +\n" +
      "      '<div class=\"popup-' + ID + '-reflection\" style=\"background-image:url(\\'' + imgUrl + '\\');background-position:' + fX + '% ' + fY + '%\">' + '</div>' +\n" +
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
      "// v3.0 - openDetail avec support focal sur extras\n" +
      "function openDetail(index) {\n" +
      "  var item = ITEMS[index];\n" +
      "  var fX = item.focalX || 50;\n" +
      "  var fY = item.focalY || 50;\n" +
      '  var d = document.createElement("div");\n' +
      '  d.className = "popup-" + ID + "-detail";\n' +
      '  d.id = "popup-" + ID + "-detail";\n' +
      "\n" +
      '  var extrasHTML = "";\n' +
      "  if (item.extraImages && item.extraImages.length > 0) {\n" +
      "    extrasHTML = '<p style=\"color:rgba(255,255,255,0.5);font-size:14px;text-transform:uppercase;letter-spacing:2px;margin:35px 0 15px;\">' + SETTINGS.extraImagesLabel + '</p><div style=\"display:flex;gap:15px;flex-wrap:wrap;\">';\n" +
      "    for (var e = 0; e < item.extraImages.length; e++) {\n" +
      "      var extra = item.extraImages[e];\n" +
      "      // v3.0 - Support both string and object format\n" +
      '      var extraUrl = typeof extra === "object" ? extra.url : extra;\n' +
      '      var extraFX = typeof extra === "object" && extra.focalX !== undefined ? extra.focalX : 50;\n' +
      '      var extraFY = typeof extra === "object" && extra.focalY !== undefined ? extra.focalY : 50;\n' +
      "      extrasHTML += '<img src=\"' + extraUrl + '\" data-extra=\"' + e + '\" data-focal-x=\"' + extraFX + '\" data-focal-y=\"' + extraFY + '\" class=\"popup-' + ID + '-extra-img\" style=\"object-position:' + extraFX + '% ' + extraFY + '%\">';\n" +
      "    }\n" +
      '    extrasHTML += "</div>";\n' +
      "  }\n" +
      "\n" +
      "  d.innerHTML = '<button class=\"popup-' + ID + '-detail-close\">✕</button>' +\n" +
      "    '<div class=\"popup-' + ID + '-detail-content\">' +\n" +
      "    '<img id=\"popup-' + ID + '-main-img\" src=\"' + item.image + '\" style=\"width:100%;max-height:450px;object-fit:cover;border-radius:16px;box-shadow:0 20px 60px rgba(0,0,0,0.5);object-position:' + fX + '% ' + fY + '%\">' +\n" +
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
      "    // v3.0 - Click on extra updates main image with its focal point\n" +
      "    if (ev.target.dataset.extra !== undefined) {\n" +
      '      var mainImg = document.getElementById("popup-" + ID + "-main-img");\n' +
      "      var newFX = ev.target.dataset.focalX || 50;\n" +
      "      var newFY = ev.target.dataset.focalY || 50;\n" +
      "      mainImg.src = ev.target.src;\n" +
      '      mainImg.style.objectPosition = newFX + "% " + newFY + "%";\n' +
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
      "  var fX = item.focalX || 50;\n" +
      "  var fY = item.focalY || 50;\n" +
      '  var lb = document.createElement("div");\n' +
      '  lb.className = "popup-" + ID + "-lightbox";\n' +
      '  lb.id = "popup-" + ID + "-lightbox";\n' +
      "  lb.innerHTML = '<img src=\"' + item.image + '\" alt=\"\" style=\"object-position:' + fX + '% ' + fY + '%\">';\n" +
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
      .replace(/\n/g, "\\n")
      .replace(/\r/g, "\\r");
  },
};

console.log("🎠 Template Gallery 3D v3.0 chargé (focal point sur extras)");
