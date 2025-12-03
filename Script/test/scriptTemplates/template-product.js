/**
 * ============================================
 * 🛒 TEMPLATE PRODUCT - Atlantis City - CORRIGÉ
 * Fiche produit avec prix et CTA
 * Utilise les classes .param-* du CSS
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

  // Configuration par défaut
  const defaultConfig = {
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
  };

  // Génération des paramètres
  function generateParamsHTML(config) {
    const cfg = { ...defaultConfig, ...config };

    return `
      <!-- Section Produit -->
      <div class="params-section">
        <div class="params-section-title">🛒 Produit</div>
        
        <div class="param-group">
          <label class="param-label">Nom du produit</label>
          <input type="text" class="param-input" 
                 value="${escapeHtml(cfg.productName)}" 
                 onchange="window.templateEditor.updateConfig('productName', this.value)">
        </div>

        <div class="param-group">
          <label class="param-label">Description</label>
          <textarea class="param-input" rows="3" style="resize: vertical;"
                    onchange="window.templateEditor.updateConfig('description', this.value)">${escapeHtml(
                      cfg.description
                    )}</textarea>
        </div>

        <div class="param-group">
          <label class="param-label">Prix</label>
          <input type="text" class="param-input" 
                 value="${escapeHtml(cfg.price)}" 
                 onchange="window.templateEditor.updateConfig('price', this.value)">
        </div>
        
        <div class="param-group">
          <label class="param-label">Devise</label>
          <select class="param-input" 
                  onchange="window.templateEditor.updateConfig('currency', this.value)">
            <option value="€" ${
              cfg.currency === "€" ? "selected" : ""
            }>€ Euro</option>
            <option value="$" ${
              cfg.currency === "$" ? "selected" : ""
            }>$ Dollar</option>
            <option value="£" ${
              cfg.currency === "£" ? "selected" : ""
            }>£ Livre</option>
          </select>
        </div>

        <div class="param-group">
          <label class="param-label">URL de l'image</label>
          <input type="url" class="param-input" 
                 value="${escapeHtml(cfg.imageUrl)}" 
                 placeholder="https://..."
                 onchange="window.templateEditor.updateConfig('imageUrl', this.value)">
        </div>
      </div>

      <!-- Section CTA -->
      <div class="params-section">
        <div class="params-section-title">🔗 Call-to-action</div>
        
        <div class="param-group">
          <label class="param-label">Texte du bouton</label>
          <input type="text" class="param-input" 
                 value="${escapeHtml(cfg.ctaText)}" 
                 onchange="window.templateEditor.updateConfig('ctaText', this.value)">
        </div>

        <div class="param-group">
          <label class="param-label">URL du bouton</label>
          <input type="url" class="param-input" 
                 value="${escapeHtml(cfg.ctaUrl)}" 
                 placeholder="https://..."
                 onchange="window.templateEditor.updateConfig('ctaUrl', this.value)">
        </div>
      </div>

      <!-- Section Apparence -->
      <div class="params-section">
        <div class="params-section-title">🎨 Apparence</div>
        
        <div class="param-group">
          <label class="param-label">Fond (dégradé)</label>
          <div class="param-gradient-row">
            <input type="color" class="param-color" 
                   value="${cfg.bgGradientStart}" 
                   onchange="window.templateEditor.updateConfig('bgGradientStart', this.value)">
            <span class="gradient-arrow">→</span>
            <input type="color" class="param-color" 
                   value="${cfg.bgGradientEnd}" 
                   onchange="window.templateEditor.updateConfig('bgGradientEnd', this.value)">
          </div>
        </div>

        <div class="param-group">
          <label class="param-label">Couleur d'accent (bouton)</label>
          <div class="param-gradient-row">
            <input type="color" class="param-color" 
                   value="${cfg.accentColor}" 
                   onchange="window.templateEditor.updateConfig('accentColor', this.value)">
            <span style="color: #64748b; font-size: 12px; margin-left: 8px;">${
              cfg.accentColor
            }</span>
          </div>
        </div>
      </div>
    `;
  }

  // Génération du HTML final
  function generateHTML(config) {
    const cfg = { ...defaultConfig, ...config };

    const imageSection = cfg.imageUrl
      ? `
      <div style="width: 100%; height: 200px; overflow: hidden; border-radius: 12px; margin-bottom: 20px;">
        <img src="${escapeHtml(cfg.imageUrl)}" alt="${escapeHtml(
          cfg.productName
        )}" 
             style="width: 100%; height: 100%; object-fit: cover;">
      </div>
    `
      : `
      <div style="width: 100%; height: 200px; background: linear-gradient(135deg, ${cfg.accentColor}33, ${cfg.accentColor}11); 
                  border-radius: 12px; margin-bottom: 20px; display: flex; align-items: center; justify-content: center;">
        <span style="font-size: 48px;">🛒</span>
      </div>
    `;

    return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body { width: 100%; height: 100%; }
    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
      background: linear-gradient(135deg, ${cfg.bgGradientStart}, ${
      cfg.bgGradientEnd
    });
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
      color: ${cfg.textColor};
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
      color: ${cfg.accentColor};
      margin-bottom: 20px;
    }
    .product-cta {
      display: block;
      width: 100%;
      padding: 16px 24px;
      background: ${cfg.accentColor};
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
      box-shadow: 0 10px 30px ${cfg.accentColor}66;
    }
  </style>
</head>
<body>
  <div class="product-card">
    ${imageSection}
    <h1 class="product-name">${escapeHtml(cfg.productName)}</h1>
    <p class="product-description">${escapeHtml(cfg.description)}</p>
    <div class="product-price">${escapeHtml(cfg.price)} ${escapeHtml(
      cfg.currency
    )}</div>
    <a href="${escapeHtml(
      cfg.ctaUrl
    )}" class="product-cta" target="_blank">${escapeHtml(cfg.ctaText)}</a>
  </div>
</body>
</html>`;
  }

  // Enregistrer le template
  window.atlantisTemplates.register("product", {
    name: "Produit",
    icon: "🛒",
    description: "Fiche produit avec image, prix et bouton d'action",
    defaultConfig: defaultConfig,
    generateHTML: generateHTML,
    generateParamsHTML: generateParamsHTML,
  });

  console.log("✅ Template Product enregistré");
})();
