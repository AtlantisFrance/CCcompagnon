<?php
/**
 * ============================================
 * 🎠 GÉNÉRATEUR POPUP - GALLERY 3D
 * Atlantis City
 * v1.0 - 2024-12-11 - Création initiale
 * v1.1 - 2024-12-11 - Standardisation classes popup-{ID}-*
 * v1.2 - 2024-12-11 - Support Focal Point (focalX, focalY) pour object-position
 * ============================================
 */

if (!defined('ATLANTIS_API')) {
    die('Accès direct interdit');
}

/**
 * Génère le JS pour une popup Gallery 3D avec focal point
 */
function generateGallery3dPopupJS($objectName, $config, $timestamp) {
    
    // Paramètres par défaut
    $settings = $config['settings'] ?? [];
    $showDetailPopup = isset($settings['showDetailPopup']) ? ($settings['showDetailPopup'] ? 'true' : 'false') : 'true';
    $extraImagesLabel = escapeJS($settings['extraImagesLabel'] ?? 'Plus de photos');
    
    // Items du carrousel
    $items = $config['items'] ?? [];
    $itemsArray = [];
    
    foreach ($items as $item) {
        // Récupérer les focal points (défaut: 50%)
        $focalX = isset($item['focalX']) ? intval($item['focalX']) : 50;
        $focalY = isset($item['focalY']) ? intval($item['focalY']) : 50;
        
        // Clamp entre 0 et 100
        $focalX = max(0, min(100, $focalX));
        $focalY = max(0, min(100, $focalY));
        
        $extraImages = [];
        if (!empty($item['extraImages']) && is_array($item['extraImages'])) {
            foreach ($item['extraImages'] as $url) {
                $extraImages[] = '"' . escapeJS($url) . '"';
            }
        }
        
        $itemsArray[] = '{' .
            'image:"' . escapeJS($item['image'] ?? '') . '",' .
            'hoverText:"' . escapeJS($item['hoverText'] ?? '👁 Voir détails') . '",' .
            'title:"' . escapeJS($item['title'] ?? '') . '",' .
            'description:"' . escapeJS($item['description'] ?? '') . '",' .
            'focalX:' . $focalX . ',' .
            'focalY:' . $focalY . ',' .
            'extraImages:[' . implode(',', $extraImages) . ']' .
        '}';
    }
    
    $itemsJSON = '[' . implode(',', $itemsArray) . ']';

    return <<<JS
/**
 * 🎠 Popup Gallery 3D - {$objectName}
 * Généré le {$timestamp}
 * Avec support Focal Point pour le cadrage d'image
 */
(function(){
"use strict";

var ID = "{$objectName}";
var SETTINGS = {
  showDetailPopup: {$showDetailPopup},
  extraImagesLabel: "{$extraImagesLabel}"
};
var ITEMS = {$itemsJSON};

var overlay = null;
var activeIndex = 0;

function injectStyles() {
  if (document.getElementById("popup-" + ID + "-styles")) return;
  var s = document.createElement("style");
  s.id = "popup-" + ID + "-styles";
  s.textContent = ".popup-" + ID + "-overlay{position:fixed;inset:0;background:rgba(0,0,0,0.85);backdrop-filter:blur(10px);z-index:99999;display:flex;opacity:0;transition:opacity 0.5s ease;perspective:1000px;overflow:hidden;font-family:sans-serif}" +
    ".popup-" + ID + "-overlay.active{opacity:1}" +
    ".popup-" + ID + "-carousel{position:absolute;top:45%;left:50%;transform:translate(-50%,-50%);width:100%;height:60%;display:flex;justify-content:center;align-items:center;transform-style:preserve-3d}" +
    ".popup-" + ID + "-card{position:absolute;width:500px;height:350px;background:#000;border-radius:12px;box-shadow:0 20px 50px rgba(0,0,0,0.8);transition:all 0.6s cubic-bezier(0.25,0.8,0.25,1);cursor:pointer;overflow:visible;will-change:transform,opacity,filter;backface-visibility:hidden}" +
    ".popup-" + ID + "-card img{width:100%;height:100%;object-fit:cover;pointer-events:none;border-radius:12px}" +
    ".popup-" + ID + "-reflection{position:absolute;top:100%;left:0;width:100%;height:60%;margin-top:10px;background-size:cover;transform:scaleY(-1);border-radius:12px;pointer-events:none;-webkit-mask-image:linear-gradient(to top,rgba(0,0,0,0.35) 0%,rgba(0,0,0,0.1) 50%,transparent 100%);mask-image:linear-gradient(to top,rgba(0,0,0,0.35) 0%,rgba(0,0,0,0.1) 50%,transparent 100%)}" +
    ".popup-" + ID + "-hover{position:absolute;bottom:15px;left:50%;transform:translateX(-50%) translateY(10px);background:rgba(0,0,0,0.7);color:white;padding:8px 16px;border-radius:20px;font-size:13px;opacity:0;transition:all 0.3s ease;pointer-events:none;white-space:nowrap}" +
    ".popup-" + ID + "-card.active:hover .popup-" + ID + "-hover{opacity:1;transform:translateX(-50%) translateY(0)}" +
    ".popup-" + ID + "-card.active:hover{transform:translateX(0) translateZ(270px) rotateY(0deg) scale(1.05)!important;box-shadow:0 30px 80px rgba(0,0,0,0.9),0 0 40px rgba(255,255,255,0.15)}" +
    ".popup-" + ID + "-nav{position:absolute;top:50%;transform:translateY(-50%);background:none;border:none;color:white;font-size:60px;cursor:pointer;z-index:10001;opacity:0.5;transition:opacity 0.3s,transform 0.2s;text-shadow:0 0 10px black}" +
    ".popup-" + ID + "-nav:hover{opacity:1;transform:translateY(-50%) scale(1.1)}" +
    ".popup-" + ID + "-prev{left:5%}" +
    ".popup-" + ID + "-next{right:5%}" +
    ".popup-" + ID + "-detail{position:fixed;inset:0;background:rgba(0,0,0,0.95);backdrop-filter:blur(20px);z-index:100000;display:none;opacity:0;transition:opacity 0.4s ease;overflow-y:auto}" +
    ".popup-" + ID + "-detail.active{opacity:1}" +
    ".popup-" + ID + "-detail-content{max-width:900px;margin:50px auto;padding:40px;animation:popupSlideIn 0.5s ease}" +
    "@keyframes popupSlideIn{from{transform:translateY(30px);opacity:0}to{transform:translateY(0);opacity:1}}" +
    ".popup-" + ID + "-detail-close{position:fixed;top:25px;right:30px;width:50px;height:50px;background:rgba(255,255,255,0.1);border:1px solid rgba(255,255,255,0.3);color:white;font-size:24px;border-radius:50%;cursor:pointer;z-index:100001;display:flex;align-items:center;justify-content:center;transition:all 0.3s}" +
    ".popup-" + ID + "-detail-close:hover{background:rgba(255,255,255,0.2);transform:rotate(90deg)}" +
    ".popup-" + ID + "-extra-img{width:200px;height:140px;object-fit:cover;border-radius:10px;cursor:pointer;transition:all 0.3s;opacity:0.8}" +
    ".popup-" + ID + "-extra-img:hover{opacity:1;transform:scale(1.05)}" +
    ".popup-" + ID + "-lightbox{position:fixed;inset:0;background:rgba(0,0,0,0.95);z-index:100000;display:none;opacity:0;transition:opacity 0.3s;align-items:center;justify-content:center}" +
    ".popup-" + ID + "-lightbox.active{opacity:1;display:flex}" +
    ".popup-" + ID + "-lightbox img{max-width:90vw;max-height:90vh;border-radius:8px;box-shadow:0 20px 60px rgba(0,0,0,0.5)}" +
    "@media(max-width:768px){.popup-" + ID + "-card{width:300px;height:200px}.popup-" + ID + "-nav{font-size:40px}.popup-" + ID + "-prev{left:2%}.popup-" + ID + "-next{right:2%}}";
  document.head.appendChild(s);
}

function show() {
  if (overlay) { closeOverlay(); return; }
  if (ITEMS.length === 0) { console.warn("🎠 Galerie vide"); return; }
  injectStyles();
  activeIndex = 0;

  var o = document.createElement("div");
  o.className = "popup-" + ID + "-overlay";

  var cardsHTML = "";
  for (var i = 0; i < ITEMS.length; i++) {
    var imgUrl = ITEMS[i].image.replace(/'/g, "\\\\'");
    var fX = ITEMS[i].focalX || 50;
    var fY = ITEMS[i].focalY || 50;
    cardsHTML += '<div class="popup-' + ID + '-card" data-index="' + i + '">' +
      '<img src="' + ITEMS[i].image + '" alt="" style="object-position:' + fX + '% ' + fY + '%">' +
      '<div class="popup-' + ID + '-reflection" style="background-image:url(\\'' + imgUrl + '\\');background-position:' + fX + '% ' + fY + '%"></div>' +
      '<div class="popup-' + ID + '-hover">' + ITEMS[i].hoverText + '</div>' +
    '</div>';
  }

  o.innerHTML = '<button class="popup-' + ID + '-nav popup-' + ID + '-prev">❮</button>' +
    '<button class="popup-' + ID + '-nav popup-' + ID + '-next">❯</button>' +
    '<div class="popup-' + ID + '-carousel">' + cardsHTML + '</div>';

  document.body.appendChild(o);
  overlay = o;

  update3D(0);

  requestAnimationFrame(function() {
    o.classList.add("active");
  });

  o.querySelector(".popup-" + ID + "-prev").onclick = function() { navigate(-1); };
  o.querySelector(".popup-" + ID + "-next").onclick = function() { navigate(1); };
  
  var cards = o.querySelectorAll(".popup-" + ID + "-card");
  for (var c = 0; c < cards.length; c++) {
    (function(card, idx) {
      card.onclick = function() {
        if (idx === activeIndex) {
          if (SETTINGS.showDetailPopup) openDetail(idx);
          else openLightbox(idx);
        } else {
          update3D(idx);
        }
      };
    })(cards[c], parseInt(cards[c].dataset.index));
  }

  o.onclick = function(e) {
    if (e.target === o) closeOverlay();
  };
}

function update3D(index) {
  activeIndex = index;
  var cards = overlay.querySelectorAll(".popup-" + ID + "-card");
  for (var i = 0; i < cards.length; i++) {
    var offset = i - activeIndex;
    var card = cards[i];
    card.classList.toggle("active", offset === 0);
    if (offset === 0) {
      card.style.transform = "translateX(0) translateZ(250px) rotateY(0deg)";
      card.style.zIndex = 100;
      card.style.opacity = 1;
      card.style.filter = "brightness(1.1)";
    } else if (offset < 0) {
      card.style.zIndex = 100 + offset;
      card.style.transform = "translateX(" + (offset * 120 - 200) + "px) translateZ(0px) rotateY(45deg) scale(0.8)";
      card.style.opacity = 0.6;
      card.style.filter = "brightness(0.6)";
    } else {
      card.style.zIndex = 100 - offset;
      card.style.transform = "translateX(" + (offset * 120 + 200) + "px) translateZ(0px) rotateY(-45deg) scale(0.8)";
      card.style.opacity = 0.6;
      card.style.filter = "brightness(0.6)";
    }
  }
}

function navigate(dir) {
  var newIndex = activeIndex + dir;
  if (newIndex < 0) newIndex = ITEMS.length - 1;
  if (newIndex >= ITEMS.length) newIndex = 0;
  update3D(newIndex);
}

function openDetail(index) {
  var item = ITEMS[index];
  var fX = item.focalX || 50;
  var fY = item.focalY || 50;
  var d = document.createElement("div");
  d.className = "popup-" + ID + "-detail";
  d.id = "popup-" + ID + "-detail";

  var extrasHTML = "";
  if (item.extraImages && item.extraImages.length > 0) {
    extrasHTML = '<p style="color:rgba(255,255,255,0.5);font-size:14px;text-transform:uppercase;letter-spacing:2px;margin:35px 0 15px;">' + SETTINGS.extraImagesLabel + '</p><div style="display:flex;gap:15px;flex-wrap:wrap;">';
    for (var e = 0; e < item.extraImages.length; e++) {
      extrasHTML += '<img src="' + item.extraImages[e] + '" data-extra="' + e + '" class="popup-' + ID + '-extra-img">';
    }
    extrasHTML += "</div>";
  }

  d.innerHTML = '<button class="popup-' + ID + '-detail-close">✕</button>' +
    '<div class="popup-' + ID + '-detail-content">' +
    '<img id="popup-' + ID + '-main-img" src="' + item.image + '" style="width:100%;max-height:450px;object-fit:cover;border-radius:16px;box-shadow:0 20px 60px rgba(0,0,0,0.5);object-position:' + fX + '% ' + fY + '%">' +
    '<h2 style="color:white;font-size:32px;margin:30px 0 15px;font-weight:600;">' + item.title + '</h2>' +
    '<p style="color:rgba(255,255,255,0.8);font-size:17px;line-height:1.7;margin-bottom:35px;">' + item.description + '</p>' +
    extrasHTML +
    '</div>';

  document.body.appendChild(d);

  setTimeout(function() { d.style.display = "block"; d.classList.add("active"); }, 10);

  d.querySelector(".popup-" + ID + "-detail-close").onclick = closeDetail;
  d.onclick = function(e) {
    if (e.target === d) closeDetail();
    if (e.target.dataset.extra !== undefined) {
      document.getElementById("popup-" + ID + "-main-img").src = item.extraImages[e.target.dataset.extra];
    }
  };
}

function closeDetail() {
  var d = document.getElementById("popup-" + ID + "-detail");
  if (d) {
    d.classList.remove("active");
    setTimeout(function() { d.remove(); }, 400);
  }
}

function openLightbox(index) {
  var item = ITEMS[index];
  var fX = item.focalX || 50;
  var fY = item.focalY || 50;
  var lb = document.createElement("div");
  lb.className = "popup-" + ID + "-lightbox";
  lb.id = "popup-" + ID + "-lightbox";
  lb.innerHTML = '<img src="' + item.image + '" alt="" style="object-position:' + fX + '% ' + fY + '%">';
  document.body.appendChild(lb);
  setTimeout(function() { lb.classList.add("active"); }, 10);
  lb.onclick = closeLightbox;
}

function closeLightbox() {
  var lb = document.getElementById("popup-" + ID + "-lightbox");
  if (lb) {
    lb.classList.remove("active");
    setTimeout(function() { lb.remove(); }, 300);
  }
}

function closeOverlay() {
  if (overlay) {
    overlay.classList.remove("active");
    setTimeout(function() { if (overlay) { overlay.remove(); overlay = null; } }, 500);
  }
}

function closeAll() {
  closeDetail();
  closeLightbox();
  closeOverlay();
}

document.addEventListener("keydown", function(e) {
  if (!overlay) return;
  var detail = document.getElementById("popup-" + ID + "-detail");
  var lightbox = document.getElementById("popup-" + ID + "-lightbox");
  if (e.key === "Escape") {
    if (detail) closeDetail();
    else if (lightbox) closeLightbox();
    else closeOverlay();
  }
  if (e.key === "ArrowRight" && !detail && !lightbox) navigate(1);
  if (e.key === "ArrowLeft" && !detail && !lightbox) navigate(-1);
  if (e.key === "Enter" && !detail && !lightbox) {
    if (SETTINGS.showDetailPopup) openDetail(activeIndex);
    else openLightbox(activeIndex);
  }
});

window.atlantisPopups = window.atlantisPopups || {};
window.atlantisPopups[ID] = { show: show, close: closeAll, config: { settings: SETTINGS, items: ITEMS } };

console.log("🎠 Popup Gallery 3D " + ID + " chargée (" + ITEMS.length + " images)");
})();
JS;
}