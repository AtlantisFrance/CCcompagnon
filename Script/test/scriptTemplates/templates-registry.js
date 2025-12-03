/**
 * ============================================
 * 📋 REGISTRE DES TEMPLATES - ATLANTIS CITY
 * ============================================
 *
 * Registre central pour tous les templates popup.
 * Les templates s'enregistrent via atlantisTemplates.register()
 *
 * ORDRE DE CHARGEMENT (body-end.html):
 * 1. templates-registry.js  (ce fichier)
 * 2. template-*.js          (chaque template)
 * 3. popup-template-editor.js (utilise le registre)
 */

(function () {
  "use strict";

  if (window.atlantisTemplates) {
    console.warn("📋 Templates Registry: Déjà initialisé");
    return;
  }

  // ============================================
  // 📦 STOCKAGE DES TEMPLATES
  // ============================================

  const templates = {};
  let isLocked = false;

  // ============================================
  // 🔧 API PUBLIQUE
  // ============================================

  const registry = {
    /**
     * Enregistrer un template
     * @param {string} id - Identifiant unique (ex: "contact", "info")
     * @param {object} template - Définition du template
     * @param {string} template.name - Nom affiché
     * @param {string} template.icon - Emoji icône
     * @param {string} template.description - Description courte
     * @param {object} template.defaultConfig - Configuration par défaut
     * @param {function} template.generateHTML - Fonction (config) => HTML
     * @param {function} [template.generateParamsHTML] - Fonction (config) => HTML du formulaire
     */
    register: function (id, template) {
      if (isLocked) {
        console.error(
          `📋 Registry: Impossible d'enregistrer "${id}" - registre verrouillé`
        );
        return false;
      }

      if (!id || typeof id !== "string") {
        console.error("📋 Registry: ID invalide");
        return false;
      }

      if (!template || !template.name || !template.generateHTML) {
        console.error(
          `📋 Registry: Template "${id}" invalide (name et generateHTML requis)`
        );
        return false;
      }

      if (templates[id]) {
        console.warn(`📋 Registry: Template "${id}" remplacé`);
      }

      templates[id] = {
        id: id,
        name: template.name,
        icon: template.icon || "📋",
        description: template.description || "",
        defaultConfig: template.defaultConfig || {},
        generateHTML: template.generateHTML,
        generateParamsHTML: template.generateParamsHTML || null,
      };

      console.log(`📋 Registry: Template "${id}" enregistré`);
      return true;
    },

    /**
     * Récupérer un template par ID
     */
    get: function (id) {
      return templates[id] || null;
    },

    /**
     * Récupérer tous les templates
     */
    getAll: function () {
      return { ...templates };
    },

    /**
     * Liste des IDs disponibles
     */
    list: function () {
      return Object.keys(templates);
    },

    /**
     * Vérifier si un template existe
     */
    has: function (id) {
      return !!templates[id];
    },

    /**
     * Nombre de templates enregistrés
     */
    count: function () {
      return Object.keys(templates).length;
    },

    /**
     * Verrouiller le registre (empêche les modifications)
     */
    lock: function () {
      isLocked = true;
      console.log(`📋 Registry: Verrouillé avec ${this.count()} templates`);
    },

    /**
     * Déverrouiller le registre
     */
    unlock: function () {
      isLocked = false;
    },

    /**
     * Générer le HTML d'un template avec une config
     */
    generateHTML: function (templateId, config) {
      const template = templates[templateId];
      if (!template) {
        console.error(`📋 Registry: Template "${templateId}" non trouvé`);
        return "<div>Template non trouvé</div>";
      }

      try {
        return template.generateHTML(config || template.defaultConfig);
      } catch (error) {
        console.error(
          `📋 Registry: Erreur génération HTML pour "${templateId}"`,
          error
        );
        return "<div>Erreur de génération</div>";
      }
    },

    /**
     * Générer le HTML du formulaire de paramètres
     */
    generateParamsHTML: function (templateId, config) {
      const template = templates[templateId];
      if (!template || !template.generateParamsHTML) {
        return null;
      }

      try {
        return template.generateParamsHTML(config || template.defaultConfig);
      } catch (error) {
        console.error(
          `📋 Registry: Erreur génération params pour "${templateId}"`,
          error
        );
        return null;
      }
    },

    /**
     * Obtenir la config par défaut d'un template
     */
    getDefaultConfig: function (templateId) {
      const template = templates[templateId];
      if (!template) return {};
      return JSON.parse(JSON.stringify(template.defaultConfig));
    },
  };

  // Exposer globalement
  window.atlantisTemplates = registry;

  console.log("📋 Templates Registry: ✅ Initialisé");
})();
