/**
 * ============================================
 * 🛍️ TEMPLATE PRODUCT - Atlantis City
 * Fiche produit avec prix et CTA
 * ============================================
 */

(function () {
  "use strict";

  // Vérifier que le registre existe
  if (!window.atlantisTemplates) {
    console.error("❌ Template Product: atlantisTemplates registry not found!");
    return;
  }

  // Helper escape HTML
  function escapeHtml(text) {
    if (!text) return "";
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
  }

  // Enregistrer le template
  window.atlantisTemplates.register("product", {
    name: "Produit",
    icon: "🛍️",
    description: "Fiche produit avec image, prix et bouton d'action",

    defaultConfig: {
      productName: "Nom du produit",
      description:
        "Description du produit avec ses caractéristiques principales.",
      price: "99.00",
      currency: "€",
      imageUrl: "",
      ctaText: "Acheter",
      ctaUrl: "#",
      bgGradientStart: "#1a1a2e",
      bgGradientEnd: "#16213e",
      accentColor: "#e94560",
      textColor: "#ffffff",
    },

    generateParamsHTML: function (config) {
      return `
        <!-- Section Produit -->
        <div class="params-section">
          <div class="params-section-title">🛍️ Produit</div>
          
          <div class="param-group">
            <label class="param-label">Nom du produit</label>
            <input type="text" class="param-input" id="param-productName" 
                   value="${escapeHtml(config.productName)}" 
                   onchange="window.templateEditor.updateConfig('productName', this.value)">
          </div>

          <div class="param-group">
            <label class="param-label">Description</label>
            <textarea class="param-input" id="param-description" rows="3"
                      onchange="window.templateEditor.updateConfig('description', this.value)">${escapeHtml(
                        config.description
                      )}</textarea>
          </div>

          <div class="param-row">
            <div class="param-group">
              <label class="param-label">Prix</label>
              <input type="text" class="param-input" id="param-price" 
                     value="${escapeHtml(config.price)}" 
                     onchange="window.templateEditor.updateConfig('price', this.value)">
            </div>
            <div class="param-group">
              <label class="param-label">Devise</label>
              <select class="param-input" id="param-currency" 
                      onchange="window.templateEditor.updateConfig('currency', this.value)">
                <option value="€" ${
                  config.currency === "€" ? "selected" : ""
                }>€ Euro</option>
                <option value="$" ${
                  config.currency === "$" ? "selected" : ""
                }>$ Dollar</option>
                <option value="£" ${
                  config.currency === "£" ? "selected" : ""
                }>£ Livre</option>
              </select>
            </div>
          </div>

          <div class="param-group">
            <label class="param-label">URL de l'image</label>
            <input type="url" class="param-input" id="param-imageUrl" 
                   value="${escapeHtml(config.imageUrl)}" 
                   placeholder="https://..."
                   onchange="window.templateEditor.updateConfig('imageUrl', this.value)">
          </div>
        </div>

        <!-- Section CTA -->
        <div class="params-section">
          <div class="params-section-title">🔗 Call-to-action</div>
          
          <div class="param-group">
            <label class="param-label">Texte du bouton</label>
            <input type="text" class="param-input" id="param-ctaText" 
                   value="${escapeHtml(config.ctaText)}" 
                   onchange="window.templateEditor.updateConfig('ctaText', this.value)">
          </div>

          <div class="param-group">
            <label class="param-label">URL du bouton</label>
            <input type="url" class="param-input" id="param-ctaUrl" 
                   value="${escapeHtml(config.ctaUrl)}" 
                   placeholder="https://..."
                   onchange="window.templateEditor.updateConfig('ctaUrl', this.value)">
          </div>
        </div>

        <!-- Section Apparence -->
        <div class="params-section">
          <div class="params-section-title">🎨 Apparence</div>
          
          <div class="param-row">
            <div class="param-group">
              <label class="param-label">Dégradé début</label>
              <input type="color" class="param-color" id="param-bgGradientStart" 
                     value="${config.bgGradientStart}" 
                     onchange="window.templateEditor.updateConfig('bgGradientStart', this.value)">
            </div>
            <div class="param-group">
              <label class="param-label">Dégradé fin</label>
              <input type="color" class="param-color" id="param-bgGradientEnd" 
                     value="${config.bgGradientEnd}" 
                     onchange="window.templateEditor.updateConfig('bgGradientEnd', this.value)">
            </div>
          </div>

          <div class="param-row">
            <div class="param-group">
              <label class="param-label">Couleur accent</label>
              <input type="color" class="param-color" id="param-accentColor" 
                     value="${config.accentColor}" 
                     onchange="window.templateEditor.updateConfig('accentColor', this.value)">
            </div>
            <div class="param-group">
              <label class="param-label">Couleur texte</label>
              <input type="color" class="param-color" id="param-textColor" 
                     value="${config.textColor}" 
                     onchange="window.templateEditor.updateConfig('textColor', this.value)">
            </div>
          </div>
        </div>
      `;
    },

    generateHTML: function (config) {
      const imageSection = config.imageUrl
        ? `
        <div style="width: 100%; height: 200px; overflow: hidden; border-radius: 12px; margin-bottom: 20px;">
          <img src="${escapeHtml(config.imageUrl)}" alt="${escapeHtml(
            config.productName
          )}" 
               style="width: 100%; height: 100%; object-fit: cover;">
        </div>
      `
        : `
        <div style="width: 100%; height: 200px; background: linear-gradient(135deg, ${config.accentColor}33, ${config.accentColor}11); 
                    border-radius: 12px; margin-bottom: 20px; display: flex; align-items: center; justify-content: center;">
          <span style="font-size: 48px;">🛍️</span>
        </div>
      `;

      return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
      background: linear-gradient(135deg, ${config.bgGradientStart}, ${
        config.bgGradientEnd
      });
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
      color: ${config.textColor};
    }
    .product-card {
      width: 100%;
      max-width: 360px;
    }
    .product-name {
      font-size: 24px;
      font-weight: 700;
      margin-bottom: 12px;
      line-height: 1.3;
    }
    .product-description {
      font-size: 14px;
      opacity: 0.8;
      line-height: 1.6;
      margin-bottom: 20px;
    }
    .product-price {
      font-size: 32px;
      font-weight: 700;
      color: ${config.accentColor};
      margin-bottom: 20px;
    }
    .product-cta {
      display: block;
      width: 100%;
      padding: 16px 24px;
      background: ${config.accentColor};
      color: white;
      text-align: center;
      text-decoration: none;
      font-size: 16px;
      font-weight: 600;
      border-radius: 12px;
      transition: all 0.3s ease;
    }
    .product-cta:hover {
      transform: translateY(-2px);
      box-shadow: 0 10px 30px ${config.accentColor}66;
    }
  </style>
</head>
<body>
  <div class="product-card">
    ${imageSection}
    <h1 class="product-name">${escapeHtml(config.productName)}</h1>
    <p class="product-description">${escapeHtml(config.description)}</p>
    <div class="product-price">${escapeHtml(config.price)} ${escapeHtml(
        config.currency
      )}</div>
    <a href="${escapeHtml(
      config.ctaUrl
    )}" class="product-cta" target="_blank">${escapeHtml(config.ctaText)}</a>
  </div>
</body>
</html>`;
    },
  });

  console.log("✅ Template Product enregistré");
})();
