/**
 * Product Popup - c1_obj
 * Genere le 2025-12-13 07:52:59
 */
(function(){
"use strict";

var ID = "c1_obj";
var CONFIG = {
  title: "dsaa",
  price: "$49.00",
  oldPrice: "$89.00",
  description: "Un environnement virtuel haute fidelite optimise pour Unreal Engine 5. Eclairage Lumen pre-calcule et textures 4K.",
  tags: [{icon:"cube",label:"Asset 3D"},{icon:"vr-cardboard",label:"VR Ready"}],
  services: ["Compatible VR Ready","Textures 4K PBR","Format .FBX & .BLEND","Licence Commerciale","Support 24/7"],
  images: ["https://images.unsplash.com/photo-1614726365723-49cfae967a5b?q=80&w=800&auto=format&fit=crop","https://images.unsplash.com/photo-1555680202-c86f0e12f086?q=80&w=800&auto=format&fit=crop","https://images.unsplash.com/photo-1626379953822-baec19c3accd?q=80&w=800&auto=format&fit=crop"],
  buyButton: {
    visible: true,
    label: "Acheter",
    link: "#"
  },
  previewButton: {
    visible: true,
    link: "#"
  },
  style: {
    accent: "#6366f1",
    radius: 20,
    height: 550,
    infoWidth: 45
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
  if (document.getElementById("product-" + ID + "-styles")) return;
  var s = document.createElement("style");
  s.id = "product-" + ID + "-styles";
  s.textContent = ".product-" + ID + "-overlay{position:fixed;inset:0;background:rgba(0,0,0,0.85);display:flex;align-items:center;justify-content:center;z-index:99999;opacity:0;transition:opacity 0.3s}" +
    ".product-" + ID + "-overlay.visible{opacity:1}" +
    ".product-" + ID + "-card{width:900px;max-width:95%;height:" + CONFIG.style.height + "px;background:rgba(20,20,25,0.95);backdrop-filter:blur(20px);border-radius:" + CONFIG.style.radius + "px;border:1px solid rgba(255,255,255,0.08);box-shadow:0 50px 100px -20px rgba(0,0,0,0.7);display:flex;overflow:hidden;transform:scale(0.9);transition:transform 0.3s}" +
    ".product-" + ID + "-overlay.visible .product-" + ID + "-card{transform:scale(1)}" +
    ".product-" + ID + "-gallery{width:calc(100% - " + CONFIG.style.infoWidth + "%);position:relative;background:#000;display:flex;flex-direction:column}" +
    ".product-" + ID + "-main-image{flex:1;position:relative;overflow:hidden}" +
    ".product-" + ID + "-main-image img{width:100%;height:100%;object-fit:cover;transition:transform 0.5s}" +
    ".product-" + ID + "-main-image:hover img{transform:scale(1.05)}" +
    ".product-" + ID + "-thumbs{height:80px;background:rgba(0,0,0,0.8);display:flex;padding:10px;gap:8px;overflow:hidden;border-top:1px solid rgba(255,255,255,0.1)}" +
    ".product-" + ID + "-thumb{height:100%;flex:1;min-width:0;border-radius:6px;cursor:pointer;opacity:0.6;border:2px solid transparent;transition:all 0.2s;object-fit:cover}" +
    ".product-" + ID + "-thumb:hover,.product-" + ID + "-thumb.active{opacity:1;border-color:" + CONFIG.style.accent + "}" +
    ".product-" + ID + "-info{width:" + CONFIG.style.infoWidth + "%;padding:40px;display:flex;flex-direction:column;overflow-y:auto}" +
    ".product-" + ID + "-tags{display:flex;gap:8px;margin-bottom:20px;flex-wrap:wrap}" +
    ".product-" + ID + "-tag{font-size:10px;padding:4px 8px;border-radius:4px;background:rgba(255,255,255,0.05);color:#94a3b8;border:1px solid rgba(255,255,255,0.05);display:flex;align-items:center;gap:5px}" +
    ".product-" + ID + "-tag i{color:" + CONFIG.style.accent + "}" +
    ".product-" + ID + "-title{font-family:Rajdhani,sans-serif;font-size:2.5rem;font-weight:700;line-height:0.95;color:white;margin:0 0 10px 0;text-transform:uppercase}" +
    ".product-" + ID + "-price{font-size:1.8rem;font-weight:700;color:" + CONFIG.style.accent + ";margin-bottom:20px;display:flex;align-items:center;gap:10px}" +
    ".product-" + ID + "-old-price{font-size:1rem;color:#64748b;text-decoration:line-through;font-weight:400}" +
    ".product-" + ID + "-desc{font-size:0.9rem;color:#cbd5e1;line-height:1.6;margin-bottom:25px;flex-grow:1}" +
    ".product-" + ID + "-specs{margin-bottom:30px;display:grid;grid-template-columns:repeat(2, 1fr);gap:10px 20px}" +
    ".product-" + ID + "-spec{display:flex;align-items:center;gap:10px;font-size:0.85rem;color:#e2e8f0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}" +
    ".product-" + ID + "-spec i{color:" + CONFIG.style.accent + ";width:16px;text-align:center;flex-shrink:0}" +
    ".product-" + ID + "-actions{display:flex;gap:15px;margin-top:auto}" +
    ".product-" + ID + "-btn-buy{flex:2;background:" + CONFIG.style.accent + ";color:white;border:none;padding:15px;border-radius:12px;font-weight:700;text-transform:uppercase;letter-spacing:1px;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:10px;text-decoration:none;transition:all 0.3s}" +
    ".product-" + ID + "-btn-buy:hover{box-shadow:0 0 25px " + CONFIG.style.accent + ";transform:translateY(-2px)}" +
    ".product-" + ID + "-btn-preview{flex:1;background:rgba(255,255,255,0.05);color:white;border:1px solid rgba(255,255,255,0.1);padding:15px;border-radius:12px;cursor:pointer;display:flex;align-items:center;justify-content:center;text-decoration:none;transition:all 0.2s}" +
    ".product-" + ID + "-btn-preview:hover{background:rgba(255,255,255,0.1);border-color:white}" +
    "@media(max-width:900px){.product-" + ID + "-card{flex-direction:column;height:auto;max-height:90vh;overflow-y:auto}.product-" + ID + "-gallery,.product-" + ID + "-info{width:100%!important}.product-" + ID + "-gallery{height:250px;flex-shrink:0}.product-" + ID + "-thumbs{display:none}.product-" + ID + "-specs{grid-template-columns:1fr}}";
  document.head.appendChild(s);
}

function show() {
  injectFontAwesome();
  injectStyles();
  if (overlay) return;
  activeImageIndex = 0;

  var o = document.createElement("div");
  o.className = "product-" + ID + "-overlay";

  var galleryHTML = '<div class="product-' + ID + '-gallery">';
  galleryHTML += '<div class="product-' + ID + '-main-image">';
  if (CONFIG.images.length > 0) {
    galleryHTML += '<img id="product-main-img-' + ID + '" src="' + CONFIG.images[0] + '" alt="Product">';
  }
  galleryHTML += '</div>';

  if (CONFIG.images.length > 1) {
    galleryHTML += '<div class="product-' + ID + '-thumbs">';
    for (var i = 0; i < CONFIG.images.length; i++) {
      galleryHTML += '<img src="' + CONFIG.images[i] + '" class="product-' + ID + '-thumb' + (i === 0 ? ' active' : '') + '" data-index="' + i + '">';
    }
    galleryHTML += '</div>';
  }
  galleryHTML += '</div>';

  var infoHTML = '<div class="product-' + ID + '-info">';

  if (CONFIG.tags.length > 0) {
    infoHTML += '<div class="product-' + ID + '-tags">';
    for (var t = 0; t < CONFIG.tags.length; t++) {
      infoHTML += '<span class="product-' + ID + '-tag"><i class="fas fa-' + CONFIG.tags[t].icon + '"></i> ' + CONFIG.tags[t].label + '</span>';
    }
    infoHTML += '</div>';
  }

  infoHTML += '<h1 class="product-' + ID + '-title">' + CONFIG.title + '</h1>';
  infoHTML += '<div class="product-' + ID + '-price"><span>' + CONFIG.price + '</span>';
  if (CONFIG.oldPrice) {
    infoHTML += '<span class="product-' + ID + '-old-price">' + CONFIG.oldPrice + '</span>';
  }
  infoHTML += '</div>';

  infoHTML += '<p class="product-' + ID + '-desc">' + CONFIG.description + '</p>';

  if (CONFIG.services.length > 0) {
    infoHTML += '<div class="product-' + ID + '-specs">';
    for (var s = 0; s < CONFIG.services.length; s++) {
      infoHTML += '<div class="product-' + ID + '-spec"><i class="fas fa-check-circle"></i> ' + CONFIG.services[s] + '</div>';
    }
    infoHTML += '</div>';
  }

  infoHTML += '<div class="product-' + ID + '-actions">';
  if (CONFIG.buyButton.visible) {
    infoHTML += '<a href="' + CONFIG.buyButton.link + '" class="product-' + ID + '-btn-buy" target="_blank"><i class="fas fa-shopping-cart"></i> ' + CONFIG.buyButton.label + '</a>';
  }
  if (CONFIG.previewButton.visible) {
    infoHTML += '<a href="' + CONFIG.previewButton.link + '" class="product-' + ID + '-btn-preview" target="_blank"><i class="fas fa-eye"></i></a>';
  }
  infoHTML += '</div>';
  infoHTML += '</div>';

  o.innerHTML = '<div class="product-' + ID + '-card">' + galleryHTML + infoHTML + '</div>';

  document.body.appendChild(o);
  overlay = o;

  setTimeout(function() {
    o.classList.add("visible");
  }, 10);

  var thumbs = o.querySelectorAll(".product-" + ID + "-thumb");
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
  var mainImg = document.getElementById("product-main-img-" + ID);
  if (mainImg) mainImg.src = CONFIG.images[index];
  var thumbs = overlay.querySelectorAll(".product-" + ID + "-thumb");
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