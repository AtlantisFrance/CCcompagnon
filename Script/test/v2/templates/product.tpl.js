/**
 * ============================================
 * TEMPLATE PRODUCT - FICHE PRODUIT
 * Atlantis City
 * v1.0 - 2024-12-13 - Version initiale
 *
 * Popup de vente avec galerie d'images,
 * infos produit, prix et boutons d'action.
 * Style responsive avec sliders de configuration.
 * ============================================
 */

(function () {
  "use strict";

  // ============================================
  // STATE GLOBAL POUR LA PREVIEW
  // ============================================

  window._productPreview = {
    activeImageIndex: 0,
    images: [],
    style: {}
  };

  // ============================================
  // FONCTIONS GLOBALES POUR LA PREVIEW
  // ============================================

  /**
   * Change l'image principale de la preview
   */
  window._productSetImage = function (index) {
    var state = window._productPreview;
    if (index < 0 || index >= state.images.length) return;

    state.activeImageIndex = index;

    // Mettre a jour l'image principale
    var mainImg = document.getElementById("product-preview-main-img");
    if (mainImg) {
      mainImg.src = state.images[index];
    }

    // Mettre a jour les thumbs actifs
    var thumbs = document.querySelectorAll(".product-preview-thumb");
    thumbs.forEach(function (thumb, i) {
      if (i === index) {
        thumb.classList.add("active");
        thumb.style.opacity = "1";
        thumb.style.borderColor = "var(--product-accent)";
      } else {
        thumb.classList.remove("active");
        thumb.style.opacity = "0.6";
        thumb.style.borderColor = "transparent";
      }
    });
  };

  /**
   * Met a jour les variables CSS de style
   */
  window._productUpdateStyles = function (style) {
    var container = document.getElementById("product-preview-container");
    if (!container) return;

    if (style.accent) {
      container.style.setProperty("--product-accent", style.accent);
    }
    if (style.radius !== undefined) {
      container.style.setProperty("--product-radius", style.radius + "px");
    }
    if (style.height !== undefined) {
      container.style.setProperty("--product-height", style.height + "px");
    }
    if (style.infoWidth !== undefined) {
      container.style.setProperty("--product-info-width", style.infoWidth + "%");
    }
  };

  // ============================================
  // OBJET PRINCIPAL DU TEMPLATE
  // ============================================

  window.ATLANTIS_TEMPLATES = window.ATLANTIS_TEMPLATES || {};

  window.ATLANTIS_TEMPLATES.product = {
    name: "Fiche Produit",
    icon: "\uD83D\uDED2",
    description: "Popup de vente avec galerie, prix et CTA",

    // ==========================================
    // DONNEES PAR DEFAUT
    // ==========================================

    getDefaultData: function () {
      return {
        // Infos produit
        title: "Cyberpunk Loft v2",
        price: "$49.00",
        oldPrice: "$89.00",
        description: "Un environnement virtuel haute fidelite optimise pour Unreal Engine 5. Eclairage Lumen pre-calcule et textures 4K.",

        // Tags editables (icone FA + label)
        tags: [
          { icon: "cube", label: "Asset 3D" },
          { icon: "vr-cardboard", label: "VR Ready" }
        ],

        // Services/caracteristiques (liste)
        services: [
          "Compatible VR Ready",
          "Textures 4K PBR",
          "Format .FBX & .BLEND",
          "Licence Commerciale",
          "Support 24/7"
        ],

        // Galerie (max 5 images)
        images: [
          "https://images.unsplash.com/photo-1614726365723-49cfae967a5b?q=80&w=800&auto=format&fit=crop",
          "https://images.unsplash.com/photo-1555680202-c86f0e12f086?q=80&w=800&auto=format&fit=crop",
          "https://images.unsplash.com/photo-1626379953822-baec19c3accd?q=80&w=800&auto=format&fit=crop"
        ],

        // Boutons d'action
        buyButton: {
          visible: true,
          label: "Acheter",
          link: "#"
        },
        previewButton: {
          visible: true,
          link: "#"
        },

        // Style
        style: {
          accent: "#6366f1",
          radius: 20,
          height: 550,
          infoWidth: 45
        }
      };
    },

    // ==========================================
    // FORMULAIRE D'EDITION
    // ==========================================

    renderForm: function (data, helpers) {
      var self = this;
      var tags = data.tags || [];
      var services = data.services || [];
      var images = data.images || [];
      var buyButton = data.buyButton || { visible: true, label: "Acheter", link: "#" };
      var previewButton = data.previewButton || { visible: true, link: "#" };
      var style = data.style || { accent: "#6366f1", radius: 20, height: 550, infoWidth: 45 };

      // Liste des icones FA disponibles
      var faIcons = [
        "cube", "vr-cardboard", "star", "heart", "check-circle", "award",
        "bolt", "fire", "gem", "crown", "rocket", "shield-alt",
        "cog", "tools", "palette", "video", "image", "music",
        "globe", "map-marker-alt", "clock", "calendar", "user", "users"
      ];

      var html = "";

      // ========== PANEL: INFORMATIONS PRODUIT ==========
      html += '<div class="tpl-glass-panel">';
      html += '<div class="tpl-section-title">Informations Produit</div>';

      // Titre
      html += '<div class="tpl-field-group">';
      html += '<label class="tpl-field-label" for="tpl-product-title">Titre</label>';
      html += '<input type="text" id="tpl-product-title" class="tpl-input" data-field="title" value="' + self.escapeJS(data.title || "") + '" placeholder="Nom du produit">';
      html += "</div>";

      // Prix
      html += '<div class="tpl-field-row">';
      html += '<div class="tpl-field-group" style="flex:1">';
      html += '<label class="tpl-field-label" for="tpl-product-price">Prix</label>';
      html += '<input type="text" id="tpl-product-price" class="tpl-input" data-field="price" value="' + self.escapeJS(data.price || "") + '" placeholder="$49.00">';
      html += "</div>";
      html += '<div class="tpl-field-group" style="flex:1">';
      html += '<label class="tpl-field-label" for="tpl-product-oldprice">Ancien prix (opt.)</label>';
      html += '<input type="text" id="tpl-product-oldprice" class="tpl-input" data-field="oldPrice" value="' + self.escapeJS(data.oldPrice || "") + '" placeholder="$89.00">';
      html += "</div>";
      html += "</div>";

      html += "</div>"; // Fin panel infos

      // ========== PANEL: STYLE & AMBIANCE ==========
      html += '<div class="tpl-glass-panel">';
      html += '<div class="tpl-section-title">Style & Ambiance</div>';

      // Couleur accent
      html += '<div class="tpl-field-group">';
      html += '<label class="tpl-field-label" for="tpl-product-accent">Couleur Accent</label>';
      html += '<input type="color" id="tpl-product-accent" data-field="style.accent" value="' + (style.accent || "#6366f1") + '" style="width:100%;height:36px;border:none;border-radius:6px;cursor:pointer;">';
      html += "</div>";

      // Slider radius
      html += '<div class="tpl-field-group">';
      html += '<div class="tpl-field-label">Arrondi Carte: <span id="tpl-radius-value">' + (style.radius || 20) + '</span>px</div>';
      html += '<input type="range" id="tpl-product-radius" data-field="style.radius" min="0" max="40" value="' + (style.radius || 20) + '" style="width:100%">';
      html += "</div>";

      // Slider hauteur
      html += '<div class="tpl-field-group">';
      html += '<div class="tpl-field-label">Hauteur Carte: <span id="tpl-height-value">' + (style.height || 550) + '</span>px</div>';
      html += '<input type="range" id="tpl-product-height" data-field="style.height" min="400" max="800" value="' + (style.height || 550) + '" style="width:100%">';
      html += "</div>";

      // Slider largeur info
      html += '<div class="tpl-field-group">';
      html += '<div class="tpl-field-label">Largeur Zone Texte: <span id="tpl-infowidth-value">' + (style.infoWidth || 45) + '</span>%</div>';
      html += '<input type="range" id="tpl-product-infowidth" data-field="style.infoWidth" min="30" max="70" value="' + (style.infoWidth || 45) + '" style="width:100%">';
      html += "</div>";

      html += "</div>"; // Fin panel style

      // ========== PANEL: TAGS ==========
      html += '<div class="tpl-glass-panel">';
      html += '<div class="tpl-section-title">Tags</div>';

      html += '<div id="tpl-tags-list">';
      tags.forEach(function (tag, index) {
        html += self.renderTagItem(tag, index, faIcons);
      });
      html += "</div>";

      html += '<button type="button" id="btn-add-tag" class="tpl-btn-add" style="margin-top:8px;">+ Ajouter un tag</button>';

      html += "</div>"; // Fin panel tags

      // ========== PANEL: DESCRIPTION & SERVICES ==========
      html += '<div class="tpl-glass-panel">';
      html += '<div class="tpl-section-title">Description & Services</div>';

      // Description
      html += '<div class="tpl-field-group">';
      html += '<label class="tpl-field-label" for="tpl-product-desc">Description</label>';
      html += '<textarea id="tpl-product-desc" class="tpl-textarea" data-field="description" rows="3" placeholder="Description du produit...">' + self.escapeJS(data.description || "") + "</textarea>";
      html += "</div>";

      // Services
      html += '<div class="tpl-field-group">';
      html += '<label class="tpl-field-label" for="tpl-product-services">Services / Caracteristiques (1 par ligne)</label>';
      html += '<textarea id="tpl-product-services" class="tpl-textarea" data-field="services" rows="5" style="font-family:monospace;font-size:12px;">' + services.join("\n") + "</textarea>";
      html += "</div>";

      html += "</div>"; // Fin panel description

      // ========== PANEL: GALERIE IMAGES ==========
      html += '<div class="tpl-glass-panel" style="border-left:2px solid #6366f1;">';
      html += '<div class="tpl-section-title">Galerie Images (Max 5)</div>';

      html += '<div id="tpl-images-list">';
      images.forEach(function (url, index) {
        html += self.renderImageItem(url, index);
      });
      html += "</div>";

      var canAddMore = images.length < 5;
      html += '<button type="button" id="btn-add-image" class="tpl-btn-add" style="margin-top:8px;' + (canAddMore ? "" : "opacity:0.5;cursor:not-allowed;") + '">' + (canAddMore ? "+ Ajouter une image" : "Max 5 images atteint") + "</button>";

      html += "</div>"; // Fin panel galerie

      // ========== PANEL: BOUTONS D'ACTION ==========
      html += '<div class="tpl-glass-panel">';
      html += '<div class="tpl-section-title">Boutons d\'action</div>';

      // Bouton Achat
      html += '<div class="tpl-field-group" style="margin-bottom:16px;">';
      html += '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">';
      html += '<label class="tpl-field-label" for="tpl-buy-link" style="margin-bottom:0;">Bouton Achat</label>';
      html += '<input type="checkbox" id="tpl-buy-visible" data-field="buyButton.visible" ' + (buyButton.visible ? "checked" : "") + ' style="width:16px;height:16px;cursor:pointer;">';
      html += "</div>";
      html += '<input type="text" id="tpl-buy-label" class="tpl-input" data-field="buyButton.label" value="' + self.escapeJS(buyButton.label || "Acheter") + '" placeholder="Texte du bouton" style="margin-bottom:6px;">';
      html += '<input type="text" id="tpl-buy-link" class="tpl-input" data-field="buyButton.link" value="' + self.escapeJS(buyButton.link || "#") + '" placeholder="Lien achat">';
      html += "</div>";

      // Bouton Preview
      html += '<div class="tpl-field-group">';
      html += '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">';
      html += '<label class="tpl-field-label" for="tpl-preview-link" style="margin-bottom:0;">Bouton "En savoir plus"</label>';
      html += '<input type="checkbox" id="tpl-preview-visible" data-field="previewButton.visible" ' + (previewButton.visible ? "checked" : "") + ' style="width:16px;height:16px;cursor:pointer;">';
      html += "</div>";
      html += '<input type="text" id="tpl-preview-link" class="tpl-input" data-field="previewButton.link" value="' + self.escapeJS(previewButton.link || "#") + '" placeholder="Lien 3D Preview">';
      html += "</div>";

      html += "</div>"; // Fin panel boutons

      return html;
    },

    /**
     * Rendu d'un item tag
     */
    renderTagItem: function (tag, index, faIcons) {
      var self = this;
      var html = "";

      html += '<div class="tpl-item-card" data-tag-index="' + index + '" style="margin-bottom:8px;padding:10px;background:rgba(0,0,0,0.3);border-radius:8px;">';

      html += '<div style="display:flex;gap:8px;align-items:center;">';

      // Select icone
      html += '<select id="tpl-tag-icon-' + index + '" data-tag-field="icon" data-tag-index="' + index + '" style="width:120px;padding:6px;background:#1a1a2e;border:1px solid rgba(255,255,255,0.1);border-radius:4px;color:white;font-size:12px;">';
      faIcons.forEach(function (icon) {
        html += '<option value="' + icon + '"' + (tag.icon === icon ? " selected" : "") + '>' + icon + "</option>";
      });
      html += "</select>";

      // Input label
      html += '<input type="text" id="tpl-tag-label-' + index + '" data-tag-field="label" data-tag-index="' + index + '" value="' + self.escapeJS(tag.label || "") + '" placeholder="Label" style="flex:1;padding:6px;background:rgba(0,0,0,0.4);border:1px solid rgba(255,255,255,0.1);border-radius:4px;color:white;font-size:12px;">';

      // Bouton supprimer
      html += '<button type="button" data-remove-tag="' + index + '" style="width:28px;height:28px;background:rgba(239,68,68,0.2);border:1px solid rgba(239,68,68,0.3);border-radius:4px;color:#ef4444;cursor:pointer;font-size:14px;">x</button>';

      html += "</div>";
      html += "</div>";

      return html;
    },

    /**
     * Rendu d'un item image
     */
    renderImageItem: function (url, index) {
      var self = this;
      var html = "";

      html += '<div class="tpl-item-card" data-image-index="' + index + '" style="margin-bottom:8px;display:flex;gap:8px;align-items:center;">';

      // Miniature
      html += '<div style="width:50px;height:50px;border-radius:6px;overflow:hidden;flex-shrink:0;background:#000;">';
      html += '<img src="' + self.escapeJS(url) + '" style="width:100%;height:100%;object-fit:cover;" onerror="this.style.display=\'none\'">';
      html += "</div>";

      // Input URL
      html += '<input type="text" id="tpl-image-url-' + index + '" data-image-field="url" data-image-index="' + index + '" value="' + self.escapeJS(url) + '" placeholder="URL de l\'image" style="flex:1;padding:8px;background:rgba(0,0,0,0.4);border:1px solid rgba(255,255,255,0.1);border-radius:6px;color:#60a5fa;font-size:11px;font-family:monospace;">';

      // Bouton supprimer
      html += '<button type="button" data-remove-image="' + index + '" style="width:32px;height:32px;background:rgba(239,68,68,0.2);border:1px solid rgba(239,68,68,0.3);border-radius:6px;color:#ef4444;cursor:pointer;font-size:16px;">x</button>';

      html += "</div>";

      return html;
    },

    // ==========================================
    // PREVIEW EN TEMPS REEL
    // ==========================================

    renderPreview: function (data, helpers) {
      var self = this;
      var title = data.title || "Titre du Produit";
      var price = data.price || "$0.00";
      var oldPrice = data.oldPrice || "";
      var description = data.description || "";
      var tags = data.tags || [];
      var services = data.services || [];
      var images = data.images || [];
      var buyButton = data.buyButton || { visible: true, label: "Acheter", link: "#" };
      var previewButton = data.previewButton || { visible: true, link: "#" };
      var style = data.style || { accent: "#6366f1", radius: 20, height: 550, infoWidth: 45 };

      // Mettre a jour le state global
      window._productPreview.images = images;
      window._productPreview.style = style;

      // S'assurer que l'index actif est valide
      if (window._productPreview.activeImageIndex >= images.length) {
        window._productPreview.activeImageIndex = Math.max(0, images.length - 1);
      }
      var activeIndex = window._productPreview.activeImageIndex;

      var html = "";

      // Container avec variables CSS
      html += '<div id="product-preview-container" style="';
      html += "--product-accent:" + style.accent + ";";
      html += "--product-radius:" + style.radius + "px;";
      html += "--product-height:" + style.height + "px;";
      html += "--product-info-width:" + style.infoWidth + "%;";
      html += 'width:100%;height:100%;display:flex;align-items:center;justify-content:center;perspective:1500px;background:radial-gradient(circle at center, #1e1e24 0%, #000000 100%);">';

      // Grille de fond
      html += '<div style="position:absolute;width:200%;height:200%;background-image:linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px),linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px);background-size:50px 50px;transform:rotateX(60deg) translateY(-20%) translateZ(-200px);pointer-events:none;mask-image:linear-gradient(to bottom, transparent, black 20%, black 80%, transparent);"></div>';

      // La carte produit
      html += '<div class="product-card" style="';
      html += "width:900px;max-width:95%;height:var(--product-height);";
      html += "background:rgba(20, 20, 25, 0.85);backdrop-filter:blur(20px);";
      html += "border-radius:var(--product-radius);border:1px solid rgba(255,255,255,0.08);";
      html += 'box-shadow:0 50px 100px -20px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.05);display:flex;overflow:hidden;position:relative;">';

      // ========== GAUCHE: GALERIE ==========
      html += '<div class="card-gallery" style="width:calc(100% - var(--product-info-width));position:relative;background:#000;display:flex;flex-direction:column;">';

      // Image principale
      html += '<div class="main-image-container" style="flex:1;position:relative;overflow:hidden;">';
      if (images.length > 0) {
        html += '<img id="product-preview-main-img" src="' + self.escapeJS(images[activeIndex]) + '" style="width:100%;height:100%;object-fit:cover;transition:transform 0.5s ease;" onmouseover="this.style.transform=\'scale(1.05)\'" onmouseout="this.style.transform=\'scale(1)\'">';
      } else {
        html += '<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;color:#64748b;font-size:14px;">Aucune image</div>';
      }
      html += "</div>";

      // Strip de thumbnails
      if (images.length > 1) {
        html += '<div class="gallery-strip" style="height:80px;background:rgba(0,0,0,0.8);display:flex;padding:10px;gap:8px;overflow:hidden;border-top:1px solid rgba(255,255,255,0.1);">';
        images.forEach(function (img, i) {
          var isActive = i === activeIndex;
          html += '<img src="' + self.escapeJS(img) + '" class="product-preview-thumb' + (isActive ? " active" : "") + '" onclick="window._productSetImage(' + i + ')" style="height:100%;flex:1;min-width:0;border-radius:6px;cursor:pointer;opacity:' + (isActive ? "1" : "0.6") + ";border:2px solid " + (isActive ? "var(--product-accent)" : "transparent") + ';transition:all 0.2s;object-fit:cover;">';
        });
        html += "</div>";
      }

      html += "</div>"; // Fin galerie

      // ========== DROITE: INFO ==========
      html += '<div class="card-info" style="width:var(--product-info-width);padding:40px;display:flex;flex-direction:column;position:relative;overflow-y:auto;">';

      // Tags
      if (tags.length > 0) {
        html += '<div class="tags-row" style="display:flex;gap:8px;margin-bottom:20px;flex-wrap:wrap;">';
        tags.forEach(function (tag) {
          html += '<span class="tag" style="font-size:10px;padding:4px 8px;border-radius:4px;background:rgba(255,255,255,0.05);color:#94a3b8;border:1px solid rgba(255,255,255,0.05);display:flex;align-items:center;gap:5px;">';
          html += '<i class="fas fa-' + self.escapeJS(tag.icon || "star") + '" style="color:var(--product-accent);"></i>';
          html += self.escapeJS(tag.label || "");
          html += "</span>";
        });
        html += "</div>";
      }

      // Titre
      html += '<h1 class="product-title" style="font-family:Rajdhani,sans-serif;font-size:2.5rem;font-weight:700;line-height:0.95;color:white;margin:0 0 10px 0;text-transform:uppercase;">' + self.escapeJS(title) + "</h1>";

      // Prix
      html += '<div class="product-price" style="font-size:1.8rem;font-weight:700;color:var(--product-accent);margin-bottom:20px;display:flex;align-items:center;gap:10px;">';
      html += "<span>" + self.escapeJS(price) + "</span>";
      if (oldPrice) {
        html += '<span style="font-size:1rem;color:#64748b;text-decoration:line-through;font-weight:400;">' + self.escapeJS(oldPrice) + "</span>";
      }
      html += "</div>";

      // Description
      html += '<p class="product-desc" style="font-size:0.9rem;color:#cbd5e1;line-height:1.6;margin-bottom:25px;flex-grow:1;">' + self.escapeJS(description) + "</p>";

      // Services
      if (services.length > 0) {
        html += '<div class="specs-list" style="margin-bottom:30px;display:grid;grid-template-columns:repeat(2, 1fr);gap:10px 20px;">';
        services.forEach(function (service) {
          html += '<div class="spec-item" style="display:flex;align-items:center;gap:10px;font-size:0.85rem;color:#e2e8f0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">';
          html += '<i class="fas fa-check-circle" style="color:var(--product-accent);width:16px;text-align:center;flex-shrink:0;"></i>';
          html += "<span>" + self.escapeJS(service) + "</span>";
          html += "</div>";
        });
        html += "</div>";
      }

      // Boutons d'action
      html += '<div class="actions-row" style="display:flex;gap:15px;margin-top:auto;">';

      // Bouton Achat
      if (buyButton.visible) {
        html += '<a href="' + self.escapeJS(buyButton.link || "#") + '" class="btn-buy" style="flex:2;background:var(--product-accent);color:white;border:none;padding:15px;border-radius:12px;font-weight:700;text-transform:uppercase;letter-spacing:1px;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:10px;text-decoration:none;transition:all 0.3s;">';
        html += '<i class="fas fa-shopping-cart"></i> ' + self.escapeJS(buyButton.label || "Acheter");
        html += "</a>";
      }

      // Bouton Preview
      if (previewButton.visible) {
        html += '<a href="' + self.escapeJS(previewButton.link || "#") + '" class="btn-preview" style="flex:1;background:rgba(255,255,255,0.05);color:white;border:1px solid rgba(255,255,255,0.1);padding:15px;border-radius:12px;cursor:pointer;display:flex;align-items:center;justify-content:center;text-decoration:none;transition:all 0.2s;">';
        html += '<i class="fas fa-eye"></i>';
        html += "</a>";
      }

      html += "</div>"; // Fin actions

      html += "</div>"; // Fin card-info

      html += "</div>"; // Fin product-card
      html += "</div>"; // Fin container

      return html;
    },

    // ==========================================
    // GENERATION DU CODE JS FINAL
    // ==========================================

    generateJS: function (objectName, config, timestamp) {
      var self = this;
      var title = self.escapeJS(config.title || "Titre du Produit");
      var price = self.escapeJS(config.price || "$0.00");
      var oldPrice = self.escapeJS(config.oldPrice || "");
      var description = self.escapeJS(config.description || "");
      var tags = config.tags || [];
      var services = config.services || [];
      var images = config.images || [];
      var buyButton = config.buyButton || { visible: true, label: "Acheter", link: "#" };
      var previewButton = config.previewButton || { visible: true, link: "#" };
      var style = config.style || { accent: "#6366f1", radius: 20, height: 550, infoWidth: 45 };

      // Construction du code des tags
      var tagsCode = tags
        .map(function (tag) {
          return '{icon:"' + self.escapeJS(tag.icon || "star") + '",label:"' + self.escapeJS(tag.label || "") + '"}';
        })
        .join(",");

      // Construction du code des services
      var servicesCode = services
        .map(function (s) {
          return '"' + self.escapeJS(s) + '"';
        })
        .join(",");

      // Construction du code des images
      var imagesCode = images
        .map(function (url) {
          return '"' + self.escapeJS(url) + '"';
        })
        .join(",");

      var js = "";

      // Header
      js += "/**\n";
      js += " * Product Popup - " + objectName + "\n";
      js += " * Genere le " + timestamp + "\n";
      js += " */\n";

      // IIFE
      js += "(function() {\n";
      js += '  "use strict";\n\n';

      // Config
      js += '  var ID = "' + objectName + '";\n';
      js += "  var CONFIG = {\n";
      js += '    title: "' + title + '",\n';
      js += '    price: "' + price + '",\n';
      js += '    oldPrice: "' + oldPrice + '",\n';
      js += '    description: "' + description + '",\n';
      js += "    tags: [" + tagsCode + "],\n";
      js += "    services: [" + servicesCode + "],\n";
      js += "    images: [" + imagesCode + "],\n";
      js += "    buyButton: {\n";
      js += "      visible: " + (buyButton.visible ? "true" : "false") + ",\n";
      js += '      label: "' + self.escapeJS(buyButton.label || "Acheter") + '",\n';
      js += '      link: "' + self.escapeJS(buyButton.link || "#") + '"\n';
      js += "    },\n";
      js += "    previewButton: {\n";
      js += "      visible: " + (previewButton.visible ? "true" : "false") + ",\n";
      js += '      link: "' + self.escapeJS(previewButton.link || "#") + '"\n';
      js += "    },\n";
      js += "    style: {\n";
      js += '      accent: "' + (style.accent || "#6366f1") + '",\n';
      js += "      radius: " + (style.radius || 20) + ",\n";
      js += "      height: " + (style.height || 550) + ",\n";
      js += "      infoWidth: " + (style.infoWidth || 45) + "\n";
      js += "    }\n";
      js += "  };\n\n";

      js += "  var overlay = null;\n";
      js += "  var activeImageIndex = 0;\n";
      js += "  var stylesInjected = false;\n";
      js += "  var fontAwesomeLoaded = false;\n\n";

      // Fonction injection Font Awesome
      js += "  function injectFontAwesome() {\n";
      js += "    if (fontAwesomeLoaded) return;\n";
      js += '    if (!document.querySelector("link[href*=\\"font-awesome\\"]") && !document.querySelector("link[href*=\\"fontawesome\\"]")) {\n';
      js += '      var link = document.createElement("link");\n';
      js += '      link.rel = "stylesheet";\n';
      js += '      link.href = "https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css";\n';
      js += "      document.head.appendChild(link);\n";
      js += "    }\n";
      js += "    fontAwesomeLoaded = true;\n";
      js += "  }\n\n";

      // Fonction injection styles
      js += "  function injectStyles() {\n";
      js += "    if (stylesInjected) return;\n";
      js += '    var styleId = "product-popup-styles-" + ID;\n';
      js += "    if (document.getElementById(styleId)) return;\n";
      js += '    var style = document.createElement("style");\n';
      js += "    style.id = styleId;\n";
      js += '    style.textContent = "' + self.getPopupCSS() + '";\n';
      js += "    document.head.appendChild(style);\n";
      js += "    stylesInjected = true;\n";
      js += "  }\n\n";

      // Fonction show
      js += "  function show() {\n";
      js += "    injectFontAwesome();\n";
      js += "    injectStyles();\n";
      js += "    if (overlay) return;\n";
      js += "    activeImageIndex = 0;\n\n";

      js += '    overlay = document.createElement("div");\n';
      js += '    overlay.className = "product-popup-overlay";\n';
      js += "    overlay.innerHTML = buildHTML();\n";
      js += "    document.body.appendChild(overlay);\n\n";

      js += "    setTimeout(function() {\n";
      js += '      overlay.classList.add("visible");\n';
      js += "    }, 10);\n\n";

      js += '    overlay.addEventListener("click", function(e) {\n';
      js += '      if (e.target === overlay) close();\n';
      js += "    });\n\n";

      js += '    document.addEventListener("keydown", handleKeydown);\n';

      js += '    if (window.atlantisLog) window.atlantisLog("Product popup " + ID + " ouvert");\n';
      js += "  }\n\n";

      // Fonction buildHTML
      js += "  function buildHTML() {\n";
      js += '    var html = "";\n';

      // Carte
      js += '    html += \'<div class="product-popup-card" style="--product-accent:\' + CONFIG.style.accent + \';--product-radius:\' + CONFIG.style.radius + \'px;--product-height:\' + CONFIG.style.height + \'px;--product-info-width:\' + CONFIG.style.infoWidth + \'%;">\';\n\n';

      // Galerie
      js += '    html += \'<div class="product-popup-gallery">\';\n';
      js += '    html += \'<div class="product-popup-main-image">\';\n';
      js += "    if (CONFIG.images.length > 0) {\n";
      js += '      html += \'<img id="product-main-img-\' + ID + \'" src="\' + CONFIG.images[0] + \'" alt="Product">\';\n';
      js += "    }\n";
      js += '    html += \'</div>\';\n';

      // Thumbs
      js += "    if (CONFIG.images.length > 1) {\n";
      js += '      html += \'<div class="product-popup-thumbs">\';\n';
      js += "      CONFIG.images.forEach(function(img, i) {\n";
      js += '        html += \'<img src="\' + img + \'" class="product-popup-thumb\' + (i === 0 ? " active" : "") + \'" data-index="\' + i + \'" onclick="window.atlantisPopups[\\\'\' + ID + \'\\\'].setImage(\' + i + \')">\';\n';
      js += "      });\n";
      js += '      html += \'</div>\';\n';
      js += "    }\n";
      js += '    html += \'</div>\';\n\n';

      // Info
      js += '    html += \'<div class="product-popup-info">\';\n';

      // Tags
      js += "    if (CONFIG.tags.length > 0) {\n";
      js += '      html += \'<div class="product-popup-tags">\';\n';
      js += "      CONFIG.tags.forEach(function(tag) {\n";
      js += '        html += \'<span class="product-popup-tag"><i class="fas fa-\' + tag.icon + \'"></i> \' + tag.label + \'</span>\';\n';
      js += "      });\n";
      js += '      html += \'</div>\';\n';
      js += "    }\n\n";

      // Titre & Prix
      js += '    html += \'<h1 class="product-popup-title">\' + CONFIG.title + \'</h1>\';\n';
      js += '    html += \'<div class="product-popup-price"><span>\' + CONFIG.price + \'</span>\';\n';
      js += "    if (CONFIG.oldPrice) {\n";
      js += '      html += \'<span class="product-popup-old-price">\' + CONFIG.oldPrice + \'</span>\';\n';
      js += "    }\n";
      js += '    html += \'</div>\';\n\n';

      // Description
      js += '    html += \'<p class="product-popup-desc">\' + CONFIG.description + \'</p>\';\n\n';

      // Services
      js += "    if (CONFIG.services.length > 0) {\n";
      js += '      html += \'<div class="product-popup-specs">\';\n';
      js += "      CONFIG.services.forEach(function(s) {\n";
      js += '        html += \'<div class="product-popup-spec"><i class="fas fa-check-circle"></i> \' + s + \'</div>\';\n';
      js += "      });\n";
      js += '      html += \'</div>\';\n';
      js += "    }\n\n";

      // Boutons
      js += '    html += \'<div class="product-popup-actions">\';\n';
      js += "    if (CONFIG.buyButton.visible) {\n";
      js += '      html += \'<a href="\' + CONFIG.buyButton.link + \'" class="product-popup-btn-buy" target="_blank"><i class="fas fa-shopping-cart"></i> \' + CONFIG.buyButton.label + \'</a>\';\n';
      js += "    }\n";
      js += "    if (CONFIG.previewButton.visible) {\n";
      js += '      html += \'<a href="\' + CONFIG.previewButton.link + \'" class="product-popup-btn-preview" target="_blank"><i class="fas fa-eye"></i></a>\';\n';
      js += "    }\n";
      js += '    html += \'</div>\';\n\n';

      js += '    html += \'</div>\';\n'; // Fin info
      js += '    html += \'</div>\';\n'; // Fin card

      js += "    return html;\n";
      js += "  }\n\n";

      // Fonction setImage
      js += "  function setImage(index) {\n";
      js += "    if (index < 0 || index >= CONFIG.images.length) return;\n";
      js += "    activeImageIndex = index;\n";
      js += '    var mainImg = document.getElementById("product-main-img-" + ID);\n';
      js += "    if (mainImg) mainImg.src = CONFIG.images[index];\n";
      js += '    var thumbs = overlay.querySelectorAll(".product-popup-thumb");\n';
      js += "    thumbs.forEach(function(t, i) {\n";
      js += '      t.classList.toggle("active", i === index);\n';
      js += "    });\n";
      js += "  }\n\n";

      // Fonction close
      js += "  function close() {\n";
      js += "    if (!overlay) return;\n";
      js += '    overlay.classList.remove("visible");\n';
      js += "    setTimeout(function() {\n";
      js += "      if (overlay && overlay.parentNode) {\n";
      js += "        overlay.parentNode.removeChild(overlay);\n";
      js += "      }\n";
      js += "      overlay = null;\n";
      js += "    }, 300);\n";
      js += '    document.removeEventListener("keydown", handleKeydown);\n';
      js += "  }\n\n";

      // Fonction handleKeydown
      js += "  function handleKeydown(e) {\n";
      js += '    if (e.key === "Escape") close();\n';
      js += '    if (e.key === "ArrowLeft") setImage(activeImageIndex - 1);\n';
      js += '    if (e.key === "ArrowRight") setImage(activeImageIndex + 1);\n';
      js += "  }\n\n";

      // Export
      js += "  window.atlantisPopups = window.atlantisPopups || {};\n";
      js += "  window.atlantisPopups[ID] = {\n";
      js += "    show: show,\n";
      js += "    close: close,\n";
      js += "    setImage: setImage,\n";
      js += "    config: CONFIG\n";
      js += "  };\n\n";

      js += '  if (window.atlantisLog) window.atlantisLog("Product popup " + ID + " charge");\n';
      js += "})();\n";

      return js;
    },

    /**
     * CSS de la popup (inline dans generateJS)
     */
    getPopupCSS: function () {
      var css = "";

      // Overlay
      css += ".product-popup-overlay{position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.85);display:flex;align-items:center;justify-content:center;z-index:99999;opacity:0;transition:opacity 0.3s;}";
      css += ".product-popup-overlay.visible{opacity:1;}";

      // Card
      css += ".product-popup-card{width:900px;max-width:95%;height:var(--product-height);background:rgba(20,20,25,0.95);backdrop-filter:blur(20px);border-radius:var(--product-radius);border:1px solid rgba(255,255,255,0.08);box-shadow:0 50px 100px -20px rgba(0,0,0,0.7);display:flex;overflow:hidden;transform:scale(0.9);transition:transform 0.3s;}";
      css += ".product-popup-overlay.visible .product-popup-card{transform:scale(1);}";

      // Gallery
      css += ".product-popup-gallery{width:calc(100% - var(--product-info-width));position:relative;background:#000;display:flex;flex-direction:column;}";
      css += ".product-popup-main-image{flex:1;position:relative;overflow:hidden;}";
      css += ".product-popup-main-image img{width:100%;height:100%;object-fit:cover;transition:transform 0.5s;}";
      css += ".product-popup-main-image:hover img{transform:scale(1.05);}";
      css += ".product-popup-thumbs{height:80px;background:rgba(0,0,0,0.8);display:flex;padding:10px;gap:8px;overflow:hidden;border-top:1px solid rgba(255,255,255,0.1);}";
      css += ".product-popup-thumb{height:100%;flex:1;min-width:0;border-radius:6px;cursor:pointer;opacity:0.6;border:2px solid transparent;transition:all 0.2s;object-fit:cover;}";
      css += ".product-popup-thumb:hover,.product-popup-thumb.active{opacity:1;border-color:var(--product-accent);}";

      // Info
      css += ".product-popup-info{width:var(--product-info-width);padding:40px;display:flex;flex-direction:column;overflow-y:auto;}";

      // Tags
      css += ".product-popup-tags{display:flex;gap:8px;margin-bottom:20px;flex-wrap:wrap;}";
      css += ".product-popup-tag{font-size:10px;padding:4px 8px;border-radius:4px;background:rgba(255,255,255,0.05);color:#94a3b8;border:1px solid rgba(255,255,255,0.05);display:flex;align-items:center;gap:5px;}";
      css += ".product-popup-tag i{color:var(--product-accent);}";

      // Title & Price
      css += ".product-popup-title{font-family:Rajdhani,sans-serif;font-size:2.5rem;font-weight:700;line-height:0.95;color:white;margin:0 0 10px 0;text-transform:uppercase;}";
      css += ".product-popup-price{font-size:1.8rem;font-weight:700;color:var(--product-accent);margin-bottom:20px;display:flex;align-items:center;gap:10px;}";
      css += ".product-popup-old-price{font-size:1rem;color:#64748b;text-decoration:line-through;font-weight:400;}";

      // Desc
      css += ".product-popup-desc{font-size:0.9rem;color:#cbd5e1;line-height:1.6;margin-bottom:25px;flex-grow:1;}";

      // Specs
      css += ".product-popup-specs{margin-bottom:30px;display:grid;grid-template-columns:repeat(2, 1fr);gap:10px 20px;}";
      css += ".product-popup-spec{display:flex;align-items:center;gap:10px;font-size:0.85rem;color:#e2e8f0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}";
      css += ".product-popup-spec i{color:var(--product-accent);width:16px;text-align:center;flex-shrink:0;}";

      // Actions
      css += ".product-popup-actions{display:flex;gap:15px;margin-top:auto;}";
      css += ".product-popup-btn-buy{flex:2;background:var(--product-accent);color:white;border:none;padding:15px;border-radius:12px;font-weight:700;text-transform:uppercase;letter-spacing:1px;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:10px;text-decoration:none;transition:all 0.3s;}";
      css += ".product-popup-btn-buy:hover{box-shadow:0 0 25px var(--product-accent);transform:translateY(-2px);}";
      css += ".product-popup-btn-preview{flex:1;background:rgba(255,255,255,0.05);color:white;border:1px solid rgba(255,255,255,0.1);padding:15px;border-radius:12px;cursor:pointer;display:flex;align-items:center;justify-content:center;text-decoration:none;transition:all 0.2s;}";
      css += ".product-popup-btn-preview:hover{background:rgba(255,255,255,0.1);border-color:white;}";

      // Responsive
      css += "@media (max-width:900px){.product-popup-card{flex-direction:column;height:auto;max-height:90vh;overflow-y:auto;}.product-popup-gallery,.product-popup-info{width:100% !important;}.product-popup-gallery{height:250px;flex-shrink:0;}.product-popup-thumbs{display:none;}.product-popup-specs{grid-template-columns:1fr;}}";

      return css;
    },

    // ==========================================
    // UTILITAIRE: ECHAPPEMENT JS
    // ==========================================

    escapeJS: function (str) {
      if (!str) return "";
      return String(str)
        .replace(/\\/g, "\\\\")
        .replace(/"/g, '\\"')
        .replace(/'/g, "\\'")
        .replace(/\n/g, "\\n")
        .replace(/\r/g, "\\r");
    }
  };

  if (window.atlantisLog) {
    window.atlantisLog("Template product charge");
  }
  console.log("Template product charge");
})();
