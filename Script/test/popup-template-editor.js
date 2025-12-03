/**
 * ============================================
 * 🎨 ÉDITEUR DE TEMPLATES POPUP - ATLANTIS CITY
 * v3.0 - Templates chargés depuis BDD
 * ============================================
 *
 * Interface visuelle 3 colonnes
 * Gauche: Liste des templates (depuis API)
 * Centre: Paramètres du template
 * Droite: Preview temps réel
 *
 * CHANGELOG v3.0:
 * - Templates chargés depuis /api/popups/templates.php
 * - Plus de templates hardcodés
 * - Cache des templates en mémoire
 * - Fallback si API indisponible
 */

(function () {
  "use strict";

  if (window.__templateEditorInit) return;
  window.__templateEditorInit = true;

  // ============================================
  // 📋 TEMPLATES (chargés depuis API)
  // ============================================

  let TEMPLATES = {};
  let templatesLoaded = false;
  let templatesLoading = false;

  // Fallback si API indisponible (copie des défauts)
  const FALLBACK_TEMPLATES = {
    contact: {
      id: "contact",
      name: "Contact",
      icon: "📇",
      description: "Fiche contact avec réseaux",
      defaultConfig: {
        name: "Nom Prénom",
        title: "Contact & Réseaux",
        avatarText: "NP",
        avatarImage: "",
        bgGradientStart: "#2a2a2a",
        bgGradientEnd: "#1a1a1a",
        headerGradientStart: "#3a3a3a",
        headerGradientEnd: "#2a2a2a",
        textColor: "#ffffff",
        contacts: [
          {
            type: "phone",
            label: "Téléphone",
            value: "",
            href: "",
            enabled: true,
          },
          { type: "email", label: "Email", value: "", href: "", enabled: true },
          {
            type: "facebook",
            label: "Facebook",
            value: "",
            href: "",
            enabled: false,
          },
          {
            type: "instagram",
            label: "Instagram",
            value: "",
            href: "",
            enabled: false,
          },
          {
            type: "linkedin",
            label: "LinkedIn",
            value: "",
            href: "",
            enabled: false,
          },
          {
            type: "website",
            label: "Site Web",
            value: "",
            href: "",
            enabled: false,
          },
        ],
      },
    },
    info: {
      id: "info",
      name: "Info",
      icon: "ℹ️",
      description: "Panneau d'information",
      defaultConfig: {
        title: "Titre",
        subtitle: "",
        content: "Contenu de l'information...",
        bgGradientStart: "#1e3a5f",
        bgGradientEnd: "#0f172a",
        accentColor: "#3b82f6",
        textColor: "#ffffff",
        showIcon: true,
        icon: "ℹ️",
      },
    },
    product: {
      id: "product",
      name: "Produit",
      icon: "🛍️",
      description: "Fiche produit avec prix",
      defaultConfig: {
        productName: "Nom du produit",
        description: "Description du produit...",
        price: "0.00",
        currency: "€",
        imageUrl: "",
        ctaText: "En savoir plus",
        ctaUrl: "",
        bgGradientStart: "#1a1a2e",
        bgGradientEnd: "#16213e",
        accentColor: "#f59e0b",
        textColor: "#ffffff",
      },
    },
    iframe: {
      id: "iframe",
      name: "iFrame",
      icon: "🖼️",
      description: "Contenu externe",
      defaultConfig: {
        url: "",
        width: "100%",
        height: "400px",
        allowFullscreen: true,
        bgColor: "#000000",
      },
    },
    youtube: {
      id: "youtube",
      name: "YouTube",
      icon: "▶️",
      description: "Vidéo YouTube",
      defaultConfig: {
        videoId: "",
        autoplay: false,
        controls: true,
        muted: false,
        loop: false,
        aspectRatio: "16:9",
        bgColor: "#000000",
      },
    },
  };

  // ============================================
  // 🌐 CHARGEMENT TEMPLATES DEPUIS API
  // ============================================

  async function loadTemplatesFromAPI() {
    if (templatesLoaded || templatesLoading) {
      return templatesLoaded;
    }

    templatesLoading = true;
    console.log("🎨 Template Editor: Chargement templates depuis API...");

    try {
      const response = await fetch(
        "https://compagnon.atlantis-city.com/api/popups/templates.php",
        {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        }
      );

      const result = await response.json();

      if (result.success && result.data?.templates) {
        // Mapper les données API vers le format interne
        TEMPLATES = {};

        for (const [key, tpl] of Object.entries(result.data.templates)) {
          TEMPLATES[key] = {
            id: tpl.template_key,
            name: tpl.name,
            icon: tpl.icon || "📋",
            description: tpl.description || "",
            defaultConfig: tpl.default_config || {},
          };
        }

        templatesLoaded = true;
        console.log(
          `✅ Templates chargés depuis API: ${Object.keys(TEMPLATES).length}`
        );
      } else {
        throw new Error(result.error || "Réponse API invalide");
      }
    } catch (error) {
      console.warn(
        "⚠️ API templates indisponible, utilisation fallback:",
        error.message
      );
      TEMPLATES = JSON.parse(JSON.stringify(FALLBACK_TEMPLATES));
      templatesLoaded = true;
    } finally {
      templatesLoading = false;
    }

    return templatesLoaded;
  }

  // ============================================
  // 🔧 ÉTAT
  // ============================================

  let state = {
    isOpen: false,
    currentTemplate: null,
    currentConfig: {},
    objectConfig: null,
    previewDebounce: null,
  };

  // ============================================
  // 🎨 GÉNÉRATION DU HTML DE L'ÉDITEUR
  // ============================================

  function generateEditorHTML() {
    const templatesList = Object.values(TEMPLATES)
      .map(
        (t) => `
      <div class="te-template-item" data-template="${t.id}">
        <div class="te-template-icon ${t.id}">${t.icon}</div>
        <div class="te-template-info">
          <div class="te-template-name">${t.name}</div>
          <div class="te-template-desc">${t.description}</div>
        </div>
      </div>
    `
      )
      .join("");

    return `
      <div class="template-editor-overlay" id="template-editor-overlay">
        <div class="template-editor">
          <!-- Header -->
          <div class="template-editor-header">
            <div class="template-editor-title">
              <span class="icon">🎨</span>
              <span>Éditeur de Template</span>
              <span id="te-object-info" style="font-size: 12px; color: #64748b; margin-left: 12px;"></span>
            </div>
            <div class="template-editor-actions">
              <button class="te-btn te-btn-cancel" onclick="window.templateEditor.close()">
                ✕ Annuler
              </button>
              <button class="te-btn te-btn-save" id="te-save-btn" onclick="window.templateEditor.save()">
                💾 Enregistrer
              </button>
            </div>
          </div>

          <!-- Corps 3 colonnes -->
          <div class="template-editor-body">
            <!-- Gauche: Templates -->
            <div class="template-editor-templates">
              <div class="te-section-title">📋 Choisir un template</div>
              <div class="te-template-list">
                ${templatesList}
              </div>
            </div>

            <!-- Centre: Paramètres -->
            <div class="template-editor-params" id="te-params-container">
              <div class="te-empty-state" style="text-align: center; padding: 60px 20px; color: #64748b;">
                <div style="font-size: 48px; margin-bottom: 16px;">👈</div>
                <div style="font-size: 16px;">Sélectionnez un template</div>
              </div>
            </div>

            <!-- Droite: Preview -->
            <div class="template-editor-preview">
              <div class="te-preview-header">
                <div class="te-preview-title">
                  <span>👁️</span>
                  <span>Aperçu</span>
                </div>
                <div class="te-preview-format">
                  <button class="te-preview-format-btn active" data-format="auto">Auto</button>
                  <button class="te-preview-format-btn" data-format="carre">Carré</button>
                  <button class="te-preview-format-btn" data-format="paysage">Paysage</button>
                  <button class="te-preview-format-btn" data-format="portrait">Portrait</button>
                </div>
              </div>
              <div class="te-preview-container">
                <div class="te-preview-frame format-auto" id="te-preview-frame">
                  <iframe class="te-preview-iframe" id="te-preview-iframe"></iframe>
                </div>
              </div>
            </div>
          </div>

          <!-- Status message -->
          <div class="te-status" id="te-status"></div>
        </div>
      </div>
    `;
  }

  // ============================================
  // 📝 GÉNÉRATION DES PARAMÈTRES PAR TEMPLATE
  // ============================================

  function generateParamsHTML(templateId, config) {
    const template = TEMPLATES[templateId];
    if (!template) return "";

    switch (templateId) {
      case "contact":
        return generateContactParams(config);
      case "info":
        return generateInfoParams(config);
      case "product":
        return generateProductParams(config);
      case "iframe":
        return generateIframeParams(config);
      case "youtube":
        return generateYoutubeParams(config);
      default:
        return `<div class="te-empty-state" style="text-align:center;padding:40px;color:#64748b;">
          <p>Paramètres non disponibles pour ce template</p>
        </div>`;
    }
  }

  // === PARAMS CONTACT ===
  function generateContactParams(config) {
    // S'assurer que contacts existe
    if (!config.contacts) {
      config.contacts = [
        {
          type: "phone",
          label: "Téléphone",
          value: "",
          href: "",
          enabled: true,
        },
        { type: "email", label: "Email", value: "", href: "", enabled: true },
        {
          type: "facebook",
          label: "Facebook",
          value: "",
          href: "",
          enabled: false,
        },
        {
          type: "instagram",
          label: "Instagram",
          value: "",
          href: "",
          enabled: false,
        },
        {
          type: "linkedin",
          label: "LinkedIn",
          value: "",
          href: "",
          enabled: false,
        },
        {
          type: "website",
          label: "Site Web",
          value: "",
          href: "",
          enabled: false,
        },
      ];
    }

    const contactsHTML = config.contacts
      .map(
        (contact, index) => `
      <div class="te-contact-item ${
        !contact.enabled ? "disabled" : ""
      }" data-index="${index}">
        <div class="te-contact-header">
          <div class="te-contact-type">
            <div class="te-contact-type-icon ${contact.type}">${getContactIcon(
          contact.type
        )}</div>
            <span class="te-contact-type-name">${contact.label}</span>
          </div>
          <label class="te-toggle">
            <input type="checkbox" ${contact.enabled ? "checked" : ""} 
                   onchange="window.templateEditor.updateContact(${index}, 'enabled', this.checked)">
            <span class="te-toggle-slider"></span>
          </label>
        </div>
        <div class="te-contact-fields">
          <div class="te-contact-field">
            <span class="te-contact-field-label">Valeur</span>
            <input type="text" class="te-contact-field-input" value="${escapeHtml(
              contact.value
            )}"
                   placeholder="Ex: 06 12 34 56 78"
                   onchange="window.templateEditor.updateContact(${index}, 'value', this.value)">
          </div>
          <div class="te-contact-field">
            <span class="te-contact-field-label">Lien</span>
            <input type="text" class="te-contact-field-input" value="${escapeHtml(
              contact.href
            )}"
                   placeholder="Ex: tel:0612345678"
                   onchange="window.templateEditor.updateContact(${index}, 'href', this.value)">
          </div>
        </div>
      </div>
    `
      )
      .join("");

    return `
      <!-- Identité -->
      <div class="te-params-section">
        <div class="te-params-section-title">👤 Identité</div>
        <div class="te-form-group">
          <label class="te-form-label">Nom complet</label>
          <input type="text" class="te-form-input" value="${escapeHtml(
            config.name || ""
          )}"
                 onchange="window.templateEditor.updateConfig('name', this.value)">
        </div>
        <div class="te-form-group">
          <label class="te-form-label">Titre / Fonction</label>
          <input type="text" class="te-form-input" value="${escapeHtml(
            config.title || ""
          )}"
                 onchange="window.templateEditor.updateConfig('title', this.value)">
        </div>
        <div class="te-form-row">
          <div class="te-form-group">
            <label class="te-form-label">Initiales avatar</label>
            <input type="text" class="te-form-input" value="${escapeHtml(
              config.avatarText || ""
            )}" maxlength="3"
                   onchange="window.templateEditor.updateConfig('avatarText', this.value)">
          </div>
          <div class="te-form-group">
            <label class="te-form-label">Image avatar (URL)</label>
            <input type="url" class="te-form-input" value="${escapeHtml(
              config.avatarImage || ""
            )}"
                   placeholder="https://..."
                   onchange="window.templateEditor.updateConfig('avatarImage', this.value)">
          </div>
        </div>
      </div>

      <!-- Couleurs -->
      <div class="te-params-section">
        <div class="te-params-section-title">🎨 Couleurs</div>
        <div class="te-form-row">
          <div class="te-form-group">
            <label class="te-form-label">Fond dégradé - Début</label>
            <div class="te-color-group">
              <input type="color" class="te-color-input" value="${
                config.bgGradientStart || "#2a2a2a"
              }"
                     onchange="window.templateEditor.updateConfig('bgGradientStart', this.value)">
              <input type="text" class="te-color-value" value="${
                config.bgGradientStart || "#2a2a2a"
              }" readonly>
            </div>
          </div>
          <div class="te-form-group">
            <label class="te-form-label">Fond dégradé - Fin</label>
            <div class="te-color-group">
              <input type="color" class="te-color-input" value="${
                config.bgGradientEnd || "#1a1a1a"
              }"
                     onchange="window.templateEditor.updateConfig('bgGradientEnd', this.value)">
              <input type="text" class="te-color-value" value="${
                config.bgGradientEnd || "#1a1a1a"
              }" readonly>
            </div>
          </div>
        </div>
        <div class="te-form-row">
          <div class="te-form-group">
            <label class="te-form-label">Header - Début</label>
            <div class="te-color-group">
              <input type="color" class="te-color-input" value="${
                config.headerGradientStart || "#3a3a3a"
              }"
                     onchange="window.templateEditor.updateConfig('headerGradientStart', this.value)">
              <input type="text" class="te-color-value" value="${
                config.headerGradientStart || "#3a3a3a"
              }" readonly>
            </div>
          </div>
          <div class="te-form-group">
            <label class="te-form-label">Header - Fin</label>
            <div class="te-color-group">
              <input type="color" class="te-color-input" value="${
                config.headerGradientEnd || "#2a2a2a"
              }"
                     onchange="window.templateEditor.updateConfig('headerGradientEnd', this.value)">
              <input type="text" class="te-color-value" value="${
                config.headerGradientEnd || "#2a2a2a"
              }" readonly>
            </div>
          </div>
        </div>
      </div>

      <!-- Contacts -->
      <div class="te-params-section">
        <div class="te-params-section-title">📱 Coordonnées</div>
        <div class="te-contacts-list">
          ${contactsHTML}
        </div>
      </div>
    `;
  }

  // === PARAMS INFO ===
  function generateInfoParams(config) {
    return `
      <div class="te-params-section">
        <div class="te-params-section-title">📝 Contenu</div>
        <div class="te-form-group">
          <label class="te-form-label">Titre</label>
          <input type="text" class="te-form-input" value="${escapeHtml(
            config.title || ""
          )}"
                 onchange="window.templateEditor.updateConfig('title', this.value)">
        </div>
        <div class="te-form-group">
          <label class="te-form-label">Sous-titre</label>
          <input type="text" class="te-form-input" value="${escapeHtml(
            config.subtitle || ""
          )}"
                 onchange="window.templateEditor.updateConfig('subtitle', this.value)">
        </div>
        <div class="te-form-group">
          <label class="te-form-label">Contenu</label>
          <textarea class="te-form-textarea" rows="4"
                    onchange="window.templateEditor.updateConfig('content', this.value)">${escapeHtml(
                      config.content || ""
                    )}</textarea>
        </div>
        <div class="te-form-row">
          <div class="te-form-group">
            <label class="te-form-label">Icône</label>
            <input type="text" class="te-form-input" value="${escapeHtml(
              config.icon || "ℹ️"
            )}" maxlength="4"
                   onchange="window.templateEditor.updateConfig('icon', this.value)">
          </div>
          <div class="te-toggle-group">
            <span class="te-toggle-label">Afficher l'icône</span>
            <label class="te-toggle">
              <input type="checkbox" ${
                config.showIcon !== false ? "checked" : ""
              }
                     onchange="window.templateEditor.updateConfig('showIcon', this.checked)">
              <span class="te-toggle-slider"></span>
            </label>
          </div>
        </div>
      </div>

      <div class="te-params-section">
        <div class="te-params-section-title">🎨 Apparence</div>
        <div class="te-form-row">
          <div class="te-form-group">
            <label class="te-form-label">Fond - Début</label>
            <div class="te-color-group">
              <input type="color" class="te-color-input" value="${
                config.bgGradientStart || "#1e3a5f"
              }"
                     onchange="window.templateEditor.updateConfig('bgGradientStart', this.value)">
              <input type="text" class="te-color-value" value="${
                config.bgGradientStart || "#1e3a5f"
              }" readonly>
            </div>
          </div>
          <div class="te-form-group">
            <label class="te-form-label">Fond - Fin</label>
            <div class="te-color-group">
              <input type="color" class="te-color-input" value="${
                config.bgGradientEnd || "#0f172a"
              }"
                     onchange="window.templateEditor.updateConfig('bgGradientEnd', this.value)">
              <input type="text" class="te-color-value" value="${
                config.bgGradientEnd || "#0f172a"
              }" readonly>
            </div>
          </div>
        </div>
        <div class="te-form-group">
          <label class="te-form-label">Couleur d'accent</label>
          <div class="te-color-group">
            <input type="color" class="te-color-input" value="${
              config.accentColor || "#3b82f6"
            }"
                   onchange="window.templateEditor.updateConfig('accentColor', this.value)">
            <input type="text" class="te-color-value" value="${
              config.accentColor || "#3b82f6"
            }" readonly>
          </div>
        </div>
      </div>
    `;
  }

  // === PARAMS PRODUCT ===
  function generateProductParams(config) {
    return `
      <div class="te-params-section">
        <div class="te-params-section-title">🛍️ Produit</div>
        <div class="te-form-group">
          <label class="te-form-label">Nom du produit</label>
          <input type="text" class="te-form-input" value="${escapeHtml(
            config.productName || ""
          )}"
                 onchange="window.templateEditor.updateConfig('productName', this.value)">
        </div>
        <div class="te-form-group">
          <label class="te-form-label">Description</label>
          <textarea class="te-form-textarea" rows="3"
                    onchange="window.templateEditor.updateConfig('description', this.value)">${escapeHtml(
                      config.description || ""
                    )}</textarea>
        </div>
        <div class="te-form-row">
          <div class="te-form-group">
            <label class="te-form-label">Prix</label>
            <input type="text" class="te-form-input" value="${escapeHtml(
              config.price || ""
            )}"
                   onchange="window.templateEditor.updateConfig('price', this.value)">
          </div>
          <div class="te-form-group">
            <label class="te-form-label">Devise</label>
            <select class="te-form-select" onchange="window.templateEditor.updateConfig('currency', this.value)">
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
        <div class="te-form-group">
          <label class="te-form-label">Image produit (URL)</label>
          <input type="url" class="te-form-input" value="${escapeHtml(
            config.imageUrl || ""
          )}"
                 placeholder="https://..."
                 onchange="window.templateEditor.updateConfig('imageUrl', this.value)">
        </div>
      </div>

      <div class="te-params-section">
        <div class="te-params-section-title">🔗 Call-to-action</div>
        <div class="te-form-row">
          <div class="te-form-group">
            <label class="te-form-label">Texte du bouton</label>
            <input type="text" class="te-form-input" value="${escapeHtml(
              config.ctaText || ""
            )}"
                   onchange="window.templateEditor.updateConfig('ctaText', this.value)">
          </div>
          <div class="te-form-group">
            <label class="te-form-label">Lien</label>
            <input type="url" class="te-form-input" value="${escapeHtml(
              config.ctaUrl || ""
            )}"
                   placeholder="https://..."
                   onchange="window.templateEditor.updateConfig('ctaUrl', this.value)">
          </div>
        </div>
      </div>

      <div class="te-params-section">
        <div class="te-params-section-title">🎨 Apparence</div>
        <div class="te-form-row">
          <div class="te-form-group">
            <label class="te-form-label">Fond - Début</label>
            <div class="te-color-group">
              <input type="color" class="te-color-input" value="${
                config.bgGradientStart || "#1a1a2e"
              }"
                     onchange="window.templateEditor.updateConfig('bgGradientStart', this.value)">
              <input type="text" class="te-color-value" value="${
                config.bgGradientStart || "#1a1a2e"
              }" readonly>
            </div>
          </div>
          <div class="te-form-group">
            <label class="te-form-label">Fond - Fin</label>
            <div class="te-color-group">
              <input type="color" class="te-color-input" value="${
                config.bgGradientEnd || "#16213e"
              }"
                     onchange="window.templateEditor.updateConfig('bgGradientEnd', this.value)">
              <input type="text" class="te-color-value" value="${
                config.bgGradientEnd || "#16213e"
              }" readonly>
            </div>
          </div>
        </div>
        <div class="te-form-group">
          <label class="te-form-label">Couleur d'accent (bouton)</label>
          <div class="te-color-group">
            <input type="color" class="te-color-input" value="${
              config.accentColor || "#f59e0b"
            }"
                   onchange="window.templateEditor.updateConfig('accentColor', this.value)">
            <input type="text" class="te-color-value" value="${
              config.accentColor || "#f59e0b"
            }" readonly>
          </div>
        </div>
      </div>
    `;
  }

  // === PARAMS IFRAME ===
  function generateIframeParams(config) {
    return `
      <div class="te-params-section">
        <div class="te-params-section-title">🖼️ Source</div>
        <div class="te-form-group">
          <label class="te-form-label">URL de la page</label>
          <input type="url" class="te-form-input" value="${escapeHtml(
            config.url || ""
          )}"
                 placeholder="https://exemple.com"
                 onchange="window.templateEditor.updateConfig('url', this.value)">
        </div>
        <div class="te-form-row">
          <div class="te-form-group">
            <label class="te-form-label">Largeur</label>
            <input type="text" class="te-form-input" value="${
              config.width || "100%"
            }"
                   placeholder="100% ou 400px"
                   onchange="window.templateEditor.updateConfig('width', this.value)">
          </div>
          <div class="te-form-group">
            <label class="te-form-label">Hauteur</label>
            <input type="text" class="te-form-input" value="${
              config.height || "400px"
            }"
                   placeholder="400px"
                   onchange="window.templateEditor.updateConfig('height', this.value)">
          </div>
        </div>
        <div class="te-toggle-group">
          <span class="te-toggle-label">Autoriser plein écran</span>
          <label class="te-toggle">
            <input type="checkbox" ${
              config.allowFullscreen !== false ? "checked" : ""
            }
                   onchange="window.templateEditor.updateConfig('allowFullscreen', this.checked)">
            <span class="te-toggle-slider"></span>
          </label>
        </div>
      </div>

      <div class="te-params-section">
        <div class="te-params-section-title">🎨 Apparence</div>
        <div class="te-form-group">
          <label class="te-form-label">Couleur de fond</label>
          <div class="te-color-group">
            <input type="color" class="te-color-input" value="${
              config.bgColor || "#000000"
            }"
                   onchange="window.templateEditor.updateConfig('bgColor', this.value)">
            <input type="text" class="te-color-value" value="${
              config.bgColor || "#000000"
            }" readonly>
          </div>
        </div>
      </div>
    `;
  }

  // === PARAMS YOUTUBE ===
  function generateYoutubeParams(config) {
    return `
      <div class="te-params-section">
        <div class="te-params-section-title">▶️ Vidéo</div>
        <div class="te-form-group">
          <label class="te-form-label">ID de la vidéo YouTube</label>
          <input type="text" class="te-form-input" value="${escapeHtml(
            config.videoId || ""
          )}"
                 placeholder="Ex: dQw4w9WgXcQ"
                 onchange="window.templateEditor.updateConfig('videoId', this.value)">
          <small style="color: #64748b; font-size: 11px; margin-top: 4px; display: block;">
            L'ID se trouve dans l'URL: youtube.com/watch?v=<strong>ID_ICI</strong>
          </small>
        </div>
        <div class="te-form-group">
          <label class="te-form-label">Format</label>
          <select class="te-form-select" onchange="window.templateEditor.updateConfig('aspectRatio', this.value)">
            <option value="16:9" ${
              config.aspectRatio === "16:9" ? "selected" : ""
            }>16:9 (Standard)</option>
            <option value="4:3" ${
              config.aspectRatio === "4:3" ? "selected" : ""
            }>4:3 (Ancien)</option>
            <option value="1:1" ${
              config.aspectRatio === "1:1" ? "selected" : ""
            }>1:1 (Carré)</option>
            <option value="9:16" ${
              config.aspectRatio === "9:16" ? "selected" : ""
            }>9:16 (Vertical)</option>
          </select>
        </div>
      </div>

      <div class="te-params-section">
        <div class="te-params-section-title">⚙️ Options</div>
        <div class="te-toggle-group">
          <span class="te-toggle-label">Lecture automatique</span>
          <label class="te-toggle">
            <input type="checkbox" ${config.autoplay ? "checked" : ""}
                   onchange="window.templateEditor.updateConfig('autoplay', this.checked)">
            <span class="te-toggle-slider"></span>
          </label>
        </div>
        <div class="te-toggle-group" style="margin-top: 8px;">
          <span class="te-toggle-label">Afficher les contrôles</span>
          <label class="te-toggle">
            <input type="checkbox" ${config.controls !== false ? "checked" : ""}
                   onchange="window.templateEditor.updateConfig('controls', this.checked)">
            <span class="te-toggle-slider"></span>
          </label>
        </div>
        <div class="te-toggle-group" style="margin-top: 8px;">
          <span class="te-toggle-label">Muet</span>
          <label class="te-toggle">
            <input type="checkbox" ${config.muted ? "checked" : ""}
                   onchange="window.templateEditor.updateConfig('muted', this.checked)">
            <span class="te-toggle-slider"></span>
          </label>
        </div>
        <div class="te-toggle-group" style="margin-top: 8px;">
          <span class="te-toggle-label">Boucle</span>
          <label class="te-toggle">
            <input type="checkbox" ${config.loop ? "checked" : ""}
                   onchange="window.templateEditor.updateConfig('loop', this.checked)">
            <span class="te-toggle-slider"></span>
          </label>
        </div>
      </div>
    `;
  }

  // ============================================
  // 🖼️ GÉNÉRATION DU HTML FINAL (PREVIEW & SAVE)
  // ============================================

  function generateFinalHTML(templateId, config) {
    switch (templateId) {
      case "contact":
        return generateContactHTML(config);
      case "info":
        return generateInfoHTML(config);
      case "product":
        return generateProductHTML(config);
      case "iframe":
        return generateIframeHTML(config);
      case "youtube":
        return generateYoutubeHTML(config);
      default:
        return "<p>Template non reconnu</p>";
    }
  }

  function generateContactHTML(config) {
    const contacts = config.contacts || [];
    const enabledContacts = contacts.filter((c) => c.enabled && c.value);

    const contactsHTML = enabledContacts
      .map((contact) => {
        const icon = getContactIcon(contact.type);
        const iconClass = contact.type;

        return `
        <a href="${escapeHtml(contact.href)}" class="contact-link ${iconClass}" 
           target="${
             ["phone", "email"].includes(contact.type) ? "_self" : "_blank"
           }"
           rel="${
             !["phone", "email"].includes(contact.type)
               ? "noopener noreferrer"
               : ""
           }">
          <div class="contact-icon">${icon}</div>
          <div class="contact-text">
            <div class="contact-label">${escapeHtml(contact.label)}</div>
            <div class="contact-value">${escapeHtml(contact.value)}</div>
          </div>
          <div class="contact-arrow">→</div>
        </a>
      `;
      })
      .join("");

    const avatarContent = config.avatarImage
      ? `<img src="${escapeHtml(config.avatarImage)}" alt="${escapeHtml(
          config.name || ""
        )}" style="width:100%;height:100%;object-fit:cover;border-radius:50%;">`
      : escapeHtml(config.avatarText || "");

    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      background: linear-gradient(135deg, ${
        config.bgGradientStart || "#2a2a2a"
      } 0%, ${config.bgGradientEnd || "#1a1a1a"} 100%);
      min-height: 100vh;
      color: ${config.textColor || "#ffffff"};
    }
    .contact-popup { width: 100%; max-width: 400px; margin: 0 auto; }
    .contact-header {
      background: linear-gradient(135deg, ${
        config.headerGradientStart || "#3a3a3a"
      } 0%, ${config.headerGradientEnd || "#2a2a2a"} 100%);
      padding: 30px 20px 20px;
      text-align: center;
      border-bottom: 1px solid rgba(255,255,255,0.1);
    }
    .contact-avatar {
      width: 80px; height: 80px;
      background: linear-gradient(135deg, #4a4a4a, #3a3a3a);
      border-radius: 50%;
      margin: 0 auto 15px;
      display: flex; align-items: center; justify-content: center;
      font-size: 28px; font-weight: 600;
      box-shadow: 0 8px 20px rgba(0,0,0,0.3);
      overflow: hidden;
    }
    .contact-name { font-size: 22px; font-weight: 600; margin-bottom: 5px; }
    .contact-title { font-size: 14px; opacity: 0.7; }
    .contact-links { padding: 20px; }
    .contact-link {
      display: flex; align-items: center; gap: 15px;
      background: rgba(255,255,255,0.05);
      border: 1px solid rgba(255,255,255,0.1);
      border-radius: 12px;
      padding: 15px 18px;
      margin-bottom: 12px;
      text-decoration: none;
      color: rgba(255,255,255,0.9);
      transition: all 0.3s ease;
    }
    .contact-link:hover {
      background: rgba(255,255,255,0.1);
      transform: translateX(5px);
    }
    .contact-icon {
      width: 40px; height: 40px;
      border-radius: 10px;
      display: flex; align-items: center; justify-content: center;
      font-size: 20px;
    }
    .contact-link.phone .contact-icon { background: linear-gradient(135deg, #25d366, #128c7e); }
    .contact-link.email .contact-icon { background: linear-gradient(135deg, #ea4335, #fbbc05); }
    .contact-link.facebook .contact-icon { background: linear-gradient(135deg, #1877f2, #0c63d4); }
    .contact-link.instagram .contact-icon { background: linear-gradient(135deg, #f58529, #dd2a7b); }
    .contact-link.linkedin .contact-icon { background: linear-gradient(135deg, #0077b5, #005885); }
    .contact-link.website .contact-icon { background: linear-gradient(135deg, #6366f1, #4f46e5); }
    .contact-text { flex: 1; }
    .contact-label { font-size: 11px; opacity: 0.6; text-transform: uppercase; letter-spacing: 1px; }
    .contact-value { font-size: 15px; font-weight: 500; }
    .contact-arrow { opacity: 0.4; transition: all 0.3s; }
    .contact-link:hover .contact-arrow { opacity: 0.8; transform: translateX(3px); }
  </style>
</head>
<body>
  <div class="contact-popup">
    <div class="contact-header">
      <div class="contact-avatar">${avatarContent}</div>
      <h2 class="contact-name">${escapeHtml(config.name || "")}</h2>
      <p class="contact-title">${escapeHtml(config.title || "")}</p>
    </div>
    <div class="contact-links">
      ${contactsHTML}
    </div>
  </div>
</body>
</html>`;
  }

  function generateInfoHTML(config) {
    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      background: linear-gradient(135deg, ${
        config.bgGradientStart || "#1e3a5f"
      } 0%, ${config.bgGradientEnd || "#0f172a"} 100%);
      min-height: 100vh;
      color: ${config.textColor || "#ffffff"};
      padding: 30px;
    }
    .info-popup { max-width: 400px; margin: 0 auto; }
    .info-header {
      display: flex;
      align-items: center;
      gap: 16px;
      margin-bottom: 20px;
    }
    .info-icon {
      width: 50px; height: 50px;
      background: ${config.accentColor || "#3b82f6"};
      border-radius: 12px;
      display: ${config.showIcon !== false ? "flex" : "none"};
      align-items: center;
      justify-content: center;
      font-size: 24px;
    }
    .info-title { font-size: 24px; font-weight: 600; }
    .info-subtitle { font-size: 14px; opacity: 0.7; margin-top: 4px; }
    .info-content {
      font-size: 15px;
      line-height: 1.6;
      opacity: 0.9;
      padding: 20px;
      background: rgba(255,255,255,0.05);
      border-radius: 12px;
      border-left: 3px solid ${config.accentColor || "#3b82f6"};
    }
  </style>
</head>
<body>
  <div class="info-popup">
    <div class="info-header">
      <div class="info-icon">${escapeHtml(config.icon || "ℹ️")}</div>
      <div>
        <h1 class="info-title">${escapeHtml(config.title || "")}</h1>
        ${
          config.subtitle
            ? `<p class="info-subtitle">${escapeHtml(config.subtitle)}</p>`
            : ""
        }
      </div>
    </div>
    <div class="info-content">${escapeHtml(config.content || "")}</div>
  </div>
</body>
</html>`;
  }

  function generateProductHTML(config) {
    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      background: linear-gradient(135deg, ${
        config.bgGradientStart || "#1a1a2e"
      } 0%, ${config.bgGradientEnd || "#16213e"} 100%);
      min-height: 100vh;
      color: ${config.textColor || "#ffffff"};
    }
    .product-popup { max-width: 380px; margin: 0 auto; padding: 20px; }
    .product-image {
      width: 100%;
      height: 200px;
      background: rgba(255,255,255,0.1);
      border-radius: 16px;
      overflow: hidden;
      margin-bottom: 20px;
    }
    .product-image img { width: 100%; height: 100%; object-fit: cover; }
    .product-name { font-size: 22px; font-weight: 600; margin-bottom: 8px; }
    .product-desc { font-size: 14px; opacity: 0.8; line-height: 1.5; margin-bottom: 16px; }
    .product-price {
      font-size: 28px;
      font-weight: 700;
      color: ${config.accentColor || "#f59e0b"};
      margin-bottom: 20px;
    }
    .product-cta {
      display: block;
      width: 100%;
      padding: 16px;
      background: ${config.accentColor || "#f59e0b"};
      color: white;
      text-align: center;
      text-decoration: none;
      border-radius: 12px;
      font-weight: 600;
      font-size: 15px;
      transition: all 0.3s;
    }
    .product-cta:hover { transform: translateY(-2px); box-shadow: 0 8px 20px rgba(0,0,0,0.3); }
  </style>
</head>
<body>
  <div class="product-popup">
    ${
      config.imageUrl
        ? `<div class="product-image"><img src="${escapeHtml(
            config.imageUrl
          )}" alt="${escapeHtml(config.productName || "")}"></div>`
        : ""
    }
    <h1 class="product-name">${escapeHtml(config.productName || "")}</h1>
    <p class="product-desc">${escapeHtml(config.description || "")}</p>
    <div class="product-price">${escapeHtml(config.price || "")} ${escapeHtml(
      config.currency || "€"
    )}</div>
    ${
      config.ctaUrl
        ? `<a href="${escapeHtml(
            config.ctaUrl
          )}" class="product-cta" target="_blank">${escapeHtml(
            config.ctaText || "En savoir plus"
          )}</a>`
        : ""
    }
  </div>
</body>
</html>`;
  }

  function generateIframeHTML(config) {
    if (!config.url) {
      return `<div style="display:flex;align-items:center;justify-content:center;height:100%;background:${
        config.bgColor || "#000000"
      };color:white;font-family:sans-serif;">
        <p>Aucune URL définie</p>
      </div>`;
    }
    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    * { margin: 0; padding: 0; }
    body { background: ${config.bgColor || "#000000"}; }
    iframe { width: ${config.width || "100%"}; height: ${
      config.height || "400px"
    }; border: none; }
  </style>
</head>
<body>
  <iframe src="${escapeHtml(config.url)}" ${
      config.allowFullscreen !== false ? "allowfullscreen" : ""
    }></iframe>
</body>
</html>`;
  }

  function generateYoutubeHTML(config) {
    if (!config.videoId) {
      return `<div style="display:flex;align-items:center;justify-content:center;height:100%;background:#000;color:white;font-family:sans-serif;">
        <p>Aucun ID vidéo défini</p>
      </div>`;
    }

    const params = [];
    if (config.autoplay) params.push("autoplay=1");
    if (config.controls === false) params.push("controls=0");
    if (config.muted) params.push("mute=1");
    if (config.loop) params.push("loop=1", `playlist=${config.videoId}`);
    params.push("rel=0");

    const paramString = params.length > 0 ? "?" + params.join("&") : "";

    let paddingRatio = "56.25%"; // 16:9
    if (config.aspectRatio === "4:3") paddingRatio = "75%";
    if (config.aspectRatio === "1:1") paddingRatio = "100%";
    if (config.aspectRatio === "9:16") paddingRatio = "177.78%";

    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    * { margin: 0; padding: 0; }
    body { background: ${config.bgColor || "#000000"}; }
    .video-container {
      position: relative;
      width: 100%;
      padding-bottom: ${paddingRatio};
    }
    iframe {
      position: absolute;
      top: 0; left: 0;
      width: 100%; height: 100%;
      border: none;
    }
  </style>
</head>
<body>
  <div class="video-container">
    <iframe src="https://www.youtube.com/embed/${escapeHtml(
      config.videoId
    )}${paramString}" 
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
            allowfullscreen></iframe>
  </div>
</body>
</html>`;
  }

  // ============================================
  // 🔧 HELPERS
  // ============================================

  function escapeHtml(str) {
    if (!str) return "";
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function getContactIcon(type) {
    const icons = {
      phone: "📱",
      email: "✉️",
      facebook: "f",
      instagram: "📷",
      linkedin: "in",
      website: "🌐",
      tiktok: "🎵",
    };
    return icons[type] || "🔗";
  }

  function showStatus(message, type = "info") {
    const el = document.getElementById("te-status");
    if (el) {
      el.textContent = message;
      el.className = `te-status show ${type}`;
      setTimeout(() => el.classList.remove("show"), 3000);
    }
  }

  // ============================================
  // 🎯 ACTIONS PRINCIPALES
  // ============================================

  /**
   * Ouvrir l'éditeur
   * @param {Object} objectConfig - Config de l'objet PLV {id, zoneSlug, spaceSlug, format...}
   * @param {Object} existingData - Données existantes (optionnel)
   */
  async function open(objectConfig, existingData = null) {
    // Charger les templates depuis l'API si pas encore fait
    if (!templatesLoaded) {
      await loadTemplatesFromAPI();
    }

    state.objectConfig = objectConfig;
    state.isOpen = true;

    // Injecter le HTML si pas déjà présent
    if (!document.getElementById("template-editor-overlay")) {
      document.body.insertAdjacentHTML("beforeend", generateEditorHTML());
    }

    const overlay = document.getElementById("template-editor-overlay");
    overlay.style.display = "flex";

    // Afficher info objet
    const infoEl = document.getElementById("te-object-info");
    if (infoEl && objectConfig) {
      infoEl.textContent = `PLV: ${
        objectConfig.id || objectConfig.objectName || "?"
      } | Zone: ${objectConfig.zoneSlug || objectConfig.zone || "-"}`;
    }

    // Setup événements templates
    document.querySelectorAll(".te-template-item").forEach((item) => {
      item.addEventListener("click", () =>
        selectTemplate(item.dataset.template)
      );
    });

    // Setup événements format preview
    document.querySelectorAll(".te-preview-format-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        document
          .querySelectorAll(".te-preview-format-btn")
          .forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");
        const frame = document.getElementById("te-preview-frame");
        frame.className = `te-preview-frame format-${btn.dataset.format}`;
      });
    });

    // Si données existantes, les charger
    if (existingData) {
      const templateType =
        existingData.template_type || existingData.templateType;
      const templateConfig = existingData.config || existingData.templateConfig;

      if (templateType && TEMPLATES[templateType]) {
        state.currentTemplate = templateType;
        state.currentConfig =
          templateConfig ||
          JSON.parse(JSON.stringify(TEMPLATES[templateType].defaultConfig));
        selectTemplate(templateType, false);
      }
    }

    console.log("🎨 Template Editor: Ouvert", objectConfig?.id);
  }

  function close() {
    state.isOpen = false;
    state.currentTemplate = null;
    state.currentConfig = {};

    const overlay = document.getElementById("template-editor-overlay");
    if (overlay) {
      overlay.style.opacity = "0";
      setTimeout(() => {
        overlay.style.display = "none";
        overlay.style.opacity = "1";
      }, 300);
    }
    console.log("🎨 Template Editor: Fermé");
  }

  function selectTemplate(templateId, resetConfig = true) {
    const template = TEMPLATES[templateId];
    if (!template) {
      console.warn(`Template non trouvé: ${templateId}`);
      return;
    }

    state.currentTemplate = templateId;

    if (resetConfig) {
      // Deep clone du config par défaut
      state.currentConfig = JSON.parse(JSON.stringify(template.defaultConfig));
    }

    // Mettre à jour l'UI
    document.querySelectorAll(".te-template-item").forEach((item) => {
      item.classList.toggle("active", item.dataset.template === templateId);
    });

    // Générer les paramètres
    const paramsContainer = document.getElementById("te-params-container");
    paramsContainer.innerHTML = generateParamsHTML(
      templateId,
      state.currentConfig
    );

    // Mettre à jour la preview
    updatePreview();

    console.log(`🎨 Template sélectionné: ${templateId}`);
  }

  function updateConfig(key, value) {
    state.currentConfig[key] = value;

    // Debounce preview update
    clearTimeout(state.previewDebounce);
    state.previewDebounce = setTimeout(updatePreview, 150);

    // Mettre à jour l'affichage de la couleur si c'est un color input
    if (key.includes("Gradient") || key.includes("Color")) {
      const colorValue = document
        .querySelector(`input[value="${value}"]`)
        ?.closest(".te-color-group")
        ?.querySelector(".te-color-value");
      if (colorValue) colorValue.value = value;
    }
  }

  function updateContact(index, key, value) {
    if (state.currentConfig.contacts && state.currentConfig.contacts[index]) {
      state.currentConfig.contacts[index][key] = value;

      // Mettre à jour la classe disabled
      if (key === "enabled") {
        const item = document.querySelector(
          `.te-contact-item[data-index="${index}"]`
        );
        if (item) item.classList.toggle("disabled", !value);
      }

      clearTimeout(state.previewDebounce);
      state.previewDebounce = setTimeout(updatePreview, 150);
    }
  }

  function updatePreview() {
    if (!state.currentTemplate) return;

    const iframe = document.getElementById("te-preview-iframe");
    if (!iframe) return;

    const html = generateFinalHTML(state.currentTemplate, state.currentConfig);

    // Écrire dans l'iframe
    const doc = iframe.contentDocument || iframe.contentWindow.document;
    doc.open();
    doc.write(html);
    doc.close();
  }

  /**
   * Sauvegarder le template
   */
  async function save() {
    if (!state.currentTemplate) {
      showStatus("Veuillez sélectionner un template", "error");
      return;
    }

    const saveBtn = document.getElementById("te-save-btn");
    saveBtn.disabled = true;
    saveBtn.textContent = "⏳ Enregistrement...";

    try {
      // Générer le HTML final
      const htmlContent = generateFinalHTML(
        state.currentTemplate,
        state.currentConfig
      );

      // Préparer les données
      const objectName =
        state.objectConfig?.id || state.objectConfig?.objectName;
      const spaceSlug =
        state.objectConfig?.spaceSlug ||
        window.atlantisPopup?.getSpaceSlug?.() ||
        window.ATLANTIS_SPACE;

      if (!objectName || !spaceSlug) {
        throw new Error(
          "Informations objet manquantes (objectName ou spaceSlug)"
        );
      }

      // Récupérer le token
      const token =
        window.atlantisAuth?.getToken?.() ||
        localStorage.getItem("atlantis_auth_token");

      // Appeler l'API
      const response = await fetch(
        "https://compagnon.atlantis-city.com/api/popups/save.php",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            space_slug: spaceSlug,
            object_name: objectName,
            template_type: state.currentTemplate,
            template_config: JSON.stringify(state.currentConfig),
            html_content: htmlContent,
            auth_token: token,
          }),
        }
      );

      const result = await response.json();

      if (result.success) {
        showStatus("✅ Template enregistré !", "success");

        // 🔄 LIVE UPDATE - Notifier popup-admin.js
        if (window.atlantisPopupAdmin?.onContentSaved) {
          window.atlantisPopupAdmin.onContentSaved(
            objectName,
            state.currentTemplate,
            state.currentConfig,
            htmlContent
          );
          console.log("🔄 Live update déclenché via atlantisPopupAdmin");
        } else if (window.atlantisPopup?.updateContent) {
          window.atlantisPopup.updateContent(
            objectName,
            state.currentTemplate,
            state.currentConfig,
            htmlContent
          );
          console.log("🔄 Live update déclenché via atlantisPopup directement");
        }

        // Fermer après un délai
        setTimeout(close, 1200);
      } else {
        throw new Error(result.error || "Erreur de sauvegarde");
      }
    } catch (error) {
      console.error("Erreur sauvegarde template:", error);
      showStatus("❌ " + error.message, "error");
    } finally {
      saveBtn.disabled = false;
      saveBtn.textContent = "💾 Enregistrer";
    }
  }

  // ============================================
  // 🌐 API PUBLIQUE
  // ============================================

  const publicAPI = {
    open,
    close,
    selectTemplate,
    updateConfig,
    updateContact,
    save,

    // Chargement templates
    loadTemplates: loadTemplatesFromAPI,
    isTemplatesLoaded: () => templatesLoaded,

    // Getters
    getTemplates: () => TEMPLATES,
    getCurrentConfig: () => ({
      template: state.currentTemplate,
      config: state.currentConfig,
    }),
    isOpen: () => state.isOpen,

    // Génération HTML (pour usage externe)
    generateHTML: (templateId, config) => generateFinalHTML(templateId, config),
  };

  // Exposer sous les deux noms pour compatibilité
  window.templateEditor = publicAPI;
  window.atlantisTemplateEditor = publicAPI;

  console.log(
    "🎨 Template Editor v3.0: ✅ Prêt (templates chargés depuis API)"
  );
})();
