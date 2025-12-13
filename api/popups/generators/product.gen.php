<?php
/**
 * ============================================
 * GENERATEUR POPUP PRODUCT
 * Atlantis City
 * v1.0 - 2024-12-13 - Version initiale
 * v1.1 - 2024-12-13 - Fix: CSS inline comme gallery3d
 *
 * Genere le code JS pour une popup fiche produit
 * avec galerie, prix et boutons d'action.
 * ============================================
 */

if (!defined('ATLANTIS_API')) {
    die('Acces direct interdit');
}

/**
 * Genere le code JS pour une popup Product
 *
 * @param string $objectName Nom de l'objet 3D
 * @param array $config Configuration du template
 * @param string $timestamp Date de generation
 * @return string Code JS complet
 */
function generateProductPopupJS($objectName, $config, $timestamp) {
    // Extraire les donnees avec valeurs par defaut
    $title = escapeJS($config['title'] ?? 'Titre du Produit');
    $price = escapeJS($config['price'] ?? '$0.00');
    $oldPrice = escapeJS($config['oldPrice'] ?? '');
    $description = escapeJS($config['description'] ?? '');

    $tags = $config['tags'] ?? [];
    $services = $config['services'] ?? [];
    $images = $config['images'] ?? [];

    $buyButton = $config['buyButton'] ?? ['visible' => true, 'label' => 'Acheter', 'link' => '#'];
    $previewButton = $config['previewButton'] ?? ['visible' => true, 'link' => '#'];

    $style = $config['style'] ?? ['accent' => '#6366f1', 'radius' => 20, 'height' => 550, 'infoWidth' => 45];

    // Construction du code des tags
    $tagsCode = [];
    foreach ($tags as $tag) {
        $icon = escapeJS($tag['icon'] ?? 'star');
        $label = escapeJS($tag['label'] ?? '');
        $tagsCode[] = "{icon:\"{$icon}\",label:\"{$label}\"}";
    }
    $tagsCodeStr = implode(',', $tagsCode);

    // Construction du code des services
    $servicesCode = [];
    foreach ($services as $service) {
        $servicesCode[] = '"' . escapeJS($service) . '"';
    }
    $servicesCodeStr = implode(',', $servicesCode);

    // Construction du code des images
    $imagesCode = [];
    foreach ($images as $img) {
        $imagesCode[] = '"' . escapeJS($img) . '"';
    }
    $imagesCodeStr = implode(',', $imagesCode);

    // Valeurs des boutons
    $buyVisible = ($buyButton['visible'] ?? true) ? 'true' : 'false';
    $buyLabel = escapeJS($buyButton['label'] ?? 'Acheter');
    $buyLink = escapeJS($buyButton['link'] ?? '#');

    $previewVisible = ($previewButton['visible'] ?? true) ? 'true' : 'false';
    $previewLink = escapeJS($previewButton['link'] ?? '#');

    // Valeurs de style
    $accent = escapeJS($style['accent'] ?? '#6366f1');
    $radius = intval($style['radius'] ?? 20);
    $height = intval($style['height'] ?? 550);
    $infoWidth = intval($style['infoWidth'] ?? 45);

    return <<<JS
/**
 * Product Popup - {$objectName}
 * Genere le {$timestamp}
 */
(function(){
"use strict";

var ID = "{$objectName}";
var CONFIG = {
  title: "{$title}",
  price: "{$price}",
  oldPrice: "{$oldPrice}",
  description: "{$description}",
  tags: [{$tagsCodeStr}],
  services: [{$servicesCodeStr}],
  images: [{$imagesCodeStr}],
  buyButton: {
    visible: {$buyVisible},
    label: "{$buyLabel}",
    link: "{$buyLink}"
  },
  previewButton: {
    visible: {$previewVisible},
    link: "{$previewLink}"
  },
  style: {
    accent: "{$accent}",
    radius: {$radius},
    height: {$height},
    infoWidth: {$infoWidth}
  }
};

var overlay = null;
var activeImageIndex = 0;

function injectFontAwesome() {
  if (document.getElementById("product-fa-" + ID)) return;
  var existing = document.querySelector('link[href*="font-awesome"]') || document.querySelector('link[href*="fontawesome"]');
  if (!existing) {
    var link = document.createElement("link");
    link.id = "product-fa-" + ID;
    link.rel = "stylesheet";
    link.href = "https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css";
    document.head.appendChild(link);
  }
}

function injectStyles() {
  if (document.getElementById("popup-" + ID + "-styles")) return;
  var s = document.createElement("style");
  s.id = "popup-" + ID + "-styles";
  s.textContent = ".popup-" + ID + "-overlay{position:fixed;inset:0;background:rgba(0,0,0,0.85);display:flex;align-items:center;justify-content:center;z-index:99999;opacity:0;transition:opacity 0.3s}" +
    ".popup-" + ID + "-overlay.visible{opacity:1}" +
    ".popup-" + ID + "-card{width:900px;max-width:95%;height:" + CONFIG.style.height + "px;background:rgba(20,20,25,0.95);backdrop-filter:blur(20px);border-radius:" + CONFIG.style.radius + "px;border:1px solid rgba(255,255,255,0.08);box-shadow:0 50px 100px -20px rgba(0,0,0,0.7);display:flex;overflow:hidden;transform:scale(0.9);transition:transform 0.3s}" +
    ".popup-" + ID + "-overlay.visible .popup-" + ID + "-card{transform:scale(1)}" +
    ".popup-" + ID + "-gallery{width:calc(100% - " + CONFIG.style.infoWidth + "%);position:relative;background:#000;display:flex;flex-direction:column}" +
    ".popup-" + ID + "-main-image{flex:1;position:relative;overflow:hidden}" +
    ".popup-" + ID + "-main-image img{width:100%;height:100%;object-fit:cover;transition:transform 0.5s}" +
    ".popup-" + ID + "-main-image:hover img{transform:scale(1.05)}" +
    ".popup-" + ID + "-thumbs{height:80px;background:rgba(0,0,0,0.8);display:flex;padding:10px;gap:8px;overflow:hidden;border-top:1px solid rgba(255,255,255,0.1)}" +
    ".popup-" + ID + "-thumb{height:100%;flex:1;min-width:0;border-radius:6px;cursor:pointer;opacity:0.6;border:2px solid transparent;transition:all 0.2s;object-fit:cover}" +
    ".popup-" + ID + "-thumb:hover,.popup-" + ID + "-thumb.active{opacity:1;border-color:" + CONFIG.style.accent + "}" +
    ".popup-" + ID + "-info{width:" + CONFIG.style.infoWidth + "%;padding:40px;display:flex;flex-direction:column;overflow-y:auto}" +
    ".popup-" + ID + "-tags{display:flex;gap:8px;margin-bottom:20px;flex-wrap:wrap}" +
    ".popup-" + ID + "-tag{font-size:10px;padding:4px 8px;border-radius:4px;background:rgba(255,255,255,0.05);color:#94a3b8;border:1px solid rgba(255,255,255,0.05);display:flex;align-items:center;gap:5px}" +
    ".popup-" + ID + "-tag i{color:" + CONFIG.style.accent + "}" +
    ".popup-" + ID + "-title{font-family:Rajdhani,sans-serif;font-size:2.5rem;font-weight:700;line-height:0.95;color:white;margin:0 0 10px 0;text-transform:uppercase}" +
    ".popup-" + ID + "-price{font-size:1.8rem;font-weight:700;color:" + CONFIG.style.accent + ";margin-bottom:20px;display:flex;align-items:center;gap:10px}" +
    ".popup-" + ID + "-old-price{font-size:1rem;color:#64748b;text-decoration:line-through;font-weight:400}" +
    ".popup-" + ID + "-desc{font-size:0.9rem;color:#cbd5e1;line-height:1.6;margin-bottom:25px;flex-grow:1}" +
    ".popup-" + ID + "-specs{margin-bottom:30px;display:grid;grid-template-columns:repeat(2, 1fr);gap:10px 20px}" +
    ".popup-" + ID + "-spec{display:flex;align-items:center;gap:10px;font-size:0.85rem;color:#e2e8f0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}" +
    ".popup-" + ID + "-spec i{color:" + CONFIG.style.accent + ";width:16px;text-align:center;flex-shrink:0}" +
    ".popup-" + ID + "-actions{display:flex;gap:15px;margin-top:auto}" +
    ".popup-" + ID + "-btn-buy{flex:2;background:" + CONFIG.style.accent + ";color:white;border:none;padding:15px;border-radius:12px;font-weight:700;text-transform:uppercase;letter-spacing:1px;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:10px;text-decoration:none;transition:all 0.3s}" +
    ".popup-" + ID + "-btn-buy:hover{box-shadow:0 0 25px " + CONFIG.style.accent + ";transform:translateY(-2px)}" +
    ".popup-" + ID + "-btn-preview{flex:1;background:rgba(255,255,255,0.05);color:white;border:1px solid rgba(255,255,255,0.1);padding:15px;border-radius:12px;cursor:pointer;display:flex;align-items:center;justify-content:center;text-decoration:none;transition:all 0.2s}" +
    ".popup-" + ID + "-btn-preview:hover{background:rgba(255,255,255,0.1);border-color:white}" +
    "@media(max-width:900px){.popup-" + ID + "-card{flex-direction:column;height:auto;max-height:90vh;overflow-y:auto}.popup-" + ID + "-gallery,.popup-" + ID + "-info{width:100%!important}.popup-" + ID + "-gallery{height:250px;flex-shrink:0}.popup-" + ID + "-thumbs{display:none}.popup-" + ID + "-specs{grid-template-columns:1fr}}";
  document.head.appendChild(s);
}

function show() {
  injectFontAwesome();
  injectStyles();
  if (overlay) return;
  activeImageIndex = 0;

  var o = document.createElement("div");
  o.className = "popup-" + ID + "-overlay";

  var galleryHTML = '<div class="popup-' + ID + '-gallery">';
  galleryHTML += '<div class="popup-' + ID + '-main-image">';
  if (CONFIG.images.length > 0) {
    galleryHTML += '<img id="popup-main-img-' + ID + '" src="' + CONFIG.images[0] + '" alt="Product">';
  }
  galleryHTML += '</div>';

  if (CONFIG.images.length > 1) {
    galleryHTML += '<div class="popup-' + ID + '-thumbs">';
    for (var i = 0; i < CONFIG.images.length; i++) {
      galleryHTML += '<img src="' + CONFIG.images[i] + '" class="popup-' + ID + '-thumb' + (i === 0 ? ' active' : '') + '" data-index="' + i + '">';
    }
    galleryHTML += '</div>';
  }
  galleryHTML += '</div>';

  var infoHTML = '<div class="popup-' + ID + '-info">';

  if (CONFIG.tags.length > 0) {
    infoHTML += '<div class="popup-' + ID + '-tags">';
    for (var t = 0; t < CONFIG.tags.length; t++) {
      infoHTML += '<span class="popup-' + ID + '-tag"><i class="fas fa-' + CONFIG.tags[t].icon + '"></i> ' + CONFIG.tags[t].label + '</span>';
    }
    infoHTML += '</div>';
  }

  infoHTML += '<h1 class="popup-' + ID + '-title">' + CONFIG.title + '</h1>';
  infoHTML += '<div class="popup-' + ID + '-price"><span>' + CONFIG.price + '</span>';
  if (CONFIG.oldPrice) {
    infoHTML += '<span class="popup-' + ID + '-old-price">' + CONFIG.oldPrice + '</span>';
  }
  infoHTML += '</div>';

  infoHTML += '<p class="popup-' + ID + '-desc">' + CONFIG.description + '</p>';

  if (CONFIG.services.length > 0) {
    infoHTML += '<div class="popup-' + ID + '-specs">';
    for (var s = 0; s < CONFIG.services.length; s++) {
      infoHTML += '<div class="popup-' + ID + '-spec"><i class="fas fa-check-circle"></i> ' + CONFIG.services[s] + '</div>';
    }
    infoHTML += '</div>';
  }

  infoHTML += '<div class="popup-' + ID + '-actions">';
  if (CONFIG.buyButton.visible) {
    infoHTML += '<a href="' + CONFIG.buyButton.link + '" class="popup-' + ID + '-btn-buy" target="_blank"><i class="fas fa-shopping-cart"></i> ' + CONFIG.buyButton.label + '</a>';
  }
  if (CONFIG.previewButton.visible) {
    infoHTML += '<a href="' + CONFIG.previewButton.link + '" class="popup-' + ID + '-btn-preview" target="_blank"><i class="fas fa-eye"></i></a>';
  }
  infoHTML += '</div>';
  infoHTML += '</div>';

  o.innerHTML = '<div class="popup-' + ID + '-card">' + galleryHTML + infoHTML + '</div>';

  document.body.appendChild(o);
  overlay = o;

  setTimeout(function() {
    o.classList.add("visible");
  }, 10);

  var thumbs = o.querySelectorAll(".popup-" + ID + "-thumb");
  for (var th = 0; th < thumbs.length; th++) {
    thumbs[th].onclick = function() {
      setImage(parseInt(this.dataset.index));
    };
  }

  o.onclick = function(e) {
    if (e.target === o) close();
  };

  document.addEventListener("keydown", handleKeydown);

  if (window.atlantisLog) window.atlantisLog("Product popup " + ID + " ouvert");
}

function setImage(index) {
  if (index < 0 || index >= CONFIG.images.length) return;
  activeImageIndex = index;
  var mainImg = document.getElementById("popup-main-img-" + ID);
  if (mainImg) mainImg.src = CONFIG.images[index];
  var thumbs = overlay.querySelectorAll(".popup-" + ID + "-thumb");
  for (var i = 0; i < thumbs.length; i++) {
    if (i === index) {
      thumbs[i].classList.add("active");
    } else {
      thumbs[i].classList.remove("active");
    }
  }
}

function close() {
  if (!overlay) return;
  overlay.classList.remove("visible");
  setTimeout(function() {
    if (overlay && overlay.parentNode) {
      overlay.parentNode.removeChild(overlay);
    }
    overlay = null;
  }, 300);
  document.removeEventListener("keydown", handleKeydown);
}

function handleKeydown(e) {
  if (!overlay) return;
  if (e.key === "Escape") close();
  if (e.key === "ArrowLeft") setImage(activeImageIndex - 1);
  if (e.key === "ArrowRight") setImage(activeImageIndex + 1);
}

window.atlantisPopups = window.atlantisPopups || {};
window.atlantisPopups[ID] = {
  show: show,
  close: close,
  setImage: setImage,
  config: CONFIG
};

if (window.atlantisLog) window.atlantisLog("Product popup " + ID + " charge");
})();
JS;
}
