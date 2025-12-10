/**
 * ============================================
 * ⏱️ PERFORMANCE MONITOR - Atlantis City
 * Module de diagnostic des temps de chargement
 * ============================================
 * v1.0 - 2024-12-10 - Création initiale
 * v1.1 - 2024-12-10 - Ajout atlantisLog() centralisé
 *
 * INJECTION: Doit être chargé EN PREMIER dans body-end.html
 *
 * Commandes console:
 *   perf_check()      - Affiche le résumé des performances
 *   perf_details()    - Affiche les détails complets
 *   perf_slow()       - Affiche uniquement les modules lents
 *   perf_reset()      - Réinitialise les mesures
 *   perf_logs()       - Affiche l'historique des logs
 * ============================================
 */

(function () {
  "use strict";

  // ============================================
  // ============================================
  // 📝 SYSTÈME DE LOGS CENTRALISÉ
  // ============================================
  // ============================================

  const logsHistory = [];
  const MAX_LOGS = 500;

  /**
   * ╔════════════════════════════════════════════════════════════╗
   * ║  📝 FONCTION DE LOG CENTRALISÉE                            ║
   * ╠════════════════════════════════════════════════════════════╣
   * ║  Usage: window.atlantisLog(module, message, type)          ║
   * ║                                                            ║
   * ║  Types: "info" | "success" | "warn" | "error"              ║
   * ║                                                            ║
   * ║  Si perf.js n'est pas chargé → aucun log affiché           ║
   * ╚════════════════════════════════════════════════════════════╝
   */
  function atlantisLog(module, message, type = "info") {
    const timestamp = performance.now().toFixed(0);
    const entry = { timestamp, module, message, type };

    // Stocker dans l'historique
    logsHistory.push(entry);
    if (logsHistory.length > MAX_LOGS) {
      logsHistory.shift();
    }

    // Icônes par module
    const moduleIcons = {
      autotextures: "🎨",
      auth: "🔐",
      "objects-config": "⚙️",
      "plv-upload": "📤",
      permissions: "🔑",
      "template-editor": "✏️",
      "click-controller": "🖱️",
      perf: "⏱️",
    };

    // Icônes par type
    const typeIcons = {
      info: "ℹ️",
      success: "✅",
      warn: "⚠️",
      error: "❌",
    };

    const moduleIcon = moduleIcons[module] || "📦";
    const typeIcon = typeIcons[type] || "";

    // Formater le message
    const prefix = `${moduleIcon} [${module}]`;
    const fullMessage = `${prefix} ${typeIcon} ${message}`;

    // Afficher selon le type
    switch (type) {
      case "error":
        console.error(fullMessage);
        break;
      case "warn":
        console.warn(fullMessage);
        break;
      case "success":
        console.log(`%c${fullMessage}`, "color: #22c55e");
        break;
      default:
        console.log(fullMessage);
    }
  }

  // Exposer globalement IMMÉDIATEMENT
  window.atlantisLog = atlantisLog;

  // ============================================
  // ⚙️ CONFIGURATION
  // ============================================
  const CONFIG = {
    // Seuils de performance (en ms)
    thresholds: {
      fast: 100, // < 100ms = ✅ Rapide
      medium: 300, // < 300ms = ⚠️ Moyen
      slow: 500, // >= 500ms = 🔴 Lent
    },
    // Modules à surveiller (dans l'ordre de chargement)
    modules: [
      {
        name: "autotextures.js",
        key: "autotextures",
        check: () => typeof window.reloadPLVTextures === "function",
      },
      { name: "auth.js", key: "auth", check: () => !!window.atlantisAuth },
      {
        name: "objects-config.js",
        key: "objects_config",
        check: () => !!window.ATLANTIS_OBJECTS_CONFIG,
      },
      {
        name: "plv-upload.js",
        key: "plv_upload",
        check: () => !!window.atlantisPLVUpload,
      },
      {
        name: "permissions.js",
        key: "permissions",
        check: () => !!window.atlantisPermissions,
      },
      {
        name: "template-editor.js",
        key: "template_editor",
        check: () => !!window.atlantisTemplateEditor,
      },
      {
        name: "click-controller.js",
        key: "click_controller",
        check: () =>
          !!window.atlantisClickController || !!window.atlantisPopups,
      },
    ],
    // Intervalle de vérification (ms)
    checkInterval: 50,
    // Timeout maximum (ms)
    maxTimeout: 10000,
  };

  // ============================================
  // 📊 ÉTAT
  // ============================================
  const state = {
    startTime: performance.now(),
    timings: {},
    moduleStatus: {},
    isComplete: false,
    totalTime: 0,
  };

  // Initialiser les timings
  CONFIG.modules.forEach((m) => {
    state.timings[m.key] = null;
    state.moduleStatus[m.key] = "pending";
  });

  // ============================================
  // 🔍 SURVEILLANCE DES MODULES
  // ============================================
  function checkModules() {
    const now = performance.now();
    const elapsed = now - state.startTime;

    let allLoaded = true;

    CONFIG.modules.forEach((module) => {
      // Si déjà enregistré, skip
      if (state.timings[module.key] !== null) return;

      try {
        if (module.check()) {
          // Module chargé !
          state.timings[module.key] = Math.round(elapsed);
          state.moduleStatus[module.key] = "loaded";
          atlantisLog(
            "perf",
            `${module.name} chargé en ${state.timings[module.key]}ms`,
            "success"
          );
        } else {
          allLoaded = false;
        }
      } catch (e) {
        allLoaded = false;
      }
    });

    // Vérifier si tout est chargé ou timeout
    if (allLoaded) {
      finalize("complete");
    } else if (elapsed > CONFIG.maxTimeout) {
      finalize("timeout");
    } else {
      // Continuer à vérifier
      setTimeout(checkModules, CONFIG.checkInterval);
    }
  }

  function finalize(status) {
    if (state.isComplete) return;

    state.isComplete = true;
    state.totalTime = Math.round(performance.now() - state.startTime);

    // Marquer les modules non chargés
    CONFIG.modules.forEach((module) => {
      if (state.timings[module.key] === null) {
        state.timings[module.key] = -1; // Non chargé
        state.moduleStatus[module.key] = "failed";
      }
    });

    // Log final
    if (status === "complete") {
      atlantisLog(
        "perf",
        `Tous les modules chargés en ${state.totalTime}ms`,
        "success"
      );
    } else {
      atlantisLog(
        "perf",
        `Timeout après ${state.totalTime}ms - certains modules non chargés`,
        "warn"
      );
    }

    console.log("📊 Tapez perf_check() pour voir le détail\n");
  }

  // ============================================
  // 🎨 AFFICHAGE
  // ============================================
  function getStatusIcon(time) {
    if (time === -1) return "❌";
    if (time < CONFIG.thresholds.fast) return "🟢";
    if (time < CONFIG.thresholds.medium) return "🟡";
    if (time < CONFIG.thresholds.slow) return "🟠";
    return "🔴";
  }

  function getStatusLabel(time) {
    if (time === -1) return "NON CHARGÉ";
    if (time < CONFIG.thresholds.fast) return "Rapide";
    if (time < CONFIG.thresholds.medium) return "OK";
    if (time < CONFIG.thresholds.slow) return "Moyen";
    return "LENT";
  }

  function formatTime(time) {
    if (time === -1) return "---";
    return `${time}ms`;
  }

  // ============================================
  // 📋 COMMANDES CONSOLE
  // ============================================

  /**
   * Affiche un résumé des performances
   */
  function perfCheck() {
    console.log("\n");
    console.log(
      "╔════════════════════════════════════════════════════════════╗"
    );
    console.log(
      "║        ⏱️  ATLANTIS CITY - PERFORMANCE MONITOR              ║"
    );
    console.log(
      "╠════════════════════════════════════════════════════════════╣"
    );

    let loaded = 0;
    let failed = 0;
    let slowest = { name: "", time: 0 };
    let fastest = { name: "", time: Infinity };

    CONFIG.modules.forEach((module) => {
      const time = state.timings[module.key];
      const icon = getStatusIcon(time);
      const label = getStatusLabel(time);
      const timeStr = formatTime(time).padStart(6);
      const nameStr = module.name.padEnd(22);

      console.log(`║  ${icon} ${nameStr} ${timeStr}  (${label})`);

      if (time === -1) {
        failed++;
      } else {
        loaded++;
        if (time > slowest.time) {
          slowest = { name: module.name, time };
        }
        if (time < fastest.time) {
          fastest = { name: module.name, time };
        }
      }
    });

    console.log(
      "╠════════════════════════════════════════════════════════════╣"
    );
    console.log(`║  📦 Modules: ${loaded}/${CONFIG.modules.length} chargés`);
    if (failed > 0) {
      console.log(`║  ❌ Échecs: ${failed}`);
    }
    console.log(`║  ⏱️  Temps total: ${state.totalTime}ms`);
    if (loaded > 0) {
      console.log(`║  🚀 Plus rapide: ${fastest.name} (${fastest.time}ms)`);
      console.log(`║  🐌 Plus lent: ${slowest.name} (${slowest.time}ms)`);
    }
    console.log(
      "╚════════════════════════════════════════════════════════════╝"
    );
    console.log("\n");

    // Retourner les données pour usage programmatique
    return {
      modules: state.timings,
      total: state.totalTime,
      loaded,
      failed,
      slowest,
      fastest,
    };
  }

  /**
   * Affiche les détails complets avec timeline
   */
  function perfDetails() {
    console.log("\n");
    console.log(
      "╔════════════════════════════════════════════════════════════════════╗"
    );
    console.log(
      "║              📊 DÉTAILS COMPLETS - TIMELINE                         ║"
    );
    console.log(
      "╠════════════════════════════════════════════════════════════════════╣"
    );

    // Trier par temps de chargement
    const sorted = CONFIG.modules
      .map((m) => ({ ...m, time: state.timings[m.key] }))
      .filter((m) => m.time !== -1)
      .sort((a, b) => a.time - b.time);

    // Afficher la timeline
    const maxTime = state.totalTime || 1;
    const barWidth = 40;

    sorted.forEach((module) => {
      const progress = Math.round((module.time / maxTime) * barWidth);
      const bar = "█".repeat(progress) + "░".repeat(barWidth - progress);
      const icon = getStatusIcon(module.time);

      console.log(
        `║  ${icon} ${module.name.padEnd(20)} [${bar}] ${module.time}ms`
      );
    });

    // Modules non chargés
    const failedModules = CONFIG.modules.filter(
      (m) => state.timings[m.key] === -1
    );
    if (failedModules.length > 0) {
      console.log(
        "╠════════════════════════════════════════════════════════════════════╣"
      );
      console.log("║  ❌ MODULES NON CHARGÉS:");
      failedModules.forEach((m) => {
        console.log(`║     • ${m.name}`);
      });
    }

    console.log(
      "╠════════════════════════════════════════════════════════════════════╣"
    );
    console.log("║  LÉGENDE:");
    console.log(
      `║    🟢 < ${CONFIG.thresholds.fast}ms    🟡 < ${CONFIG.thresholds.medium}ms    🟠 < ${CONFIG.thresholds.slow}ms    🔴 >= ${CONFIG.thresholds.slow}ms`
    );
    console.log(
      "╚════════════════════════════════════════════════════════════════════╝"
    );
    console.log("\n");

    return state;
  }

  /**
   * Affiche uniquement les modules lents
   */
  function perfSlow() {
    console.log("\n");
    console.log(
      "╔════════════════════════════════════════════════════════════╗"
    );
    console.log(
      "║              🐌 MODULES LENTS (>= 300ms)                    ║"
    );
    console.log(
      "╠════════════════════════════════════════════════════════════╣"
    );

    const slowModules = CONFIG.modules
      .map((m) => ({ ...m, time: state.timings[m.key] }))
      .filter((m) => m.time >= CONFIG.thresholds.medium || m.time === -1);

    if (slowModules.length === 0) {
      console.log("║  ✅ Aucun module lent détecté !");
    } else {
      slowModules.forEach((module) => {
        const icon = getStatusIcon(module.time);
        const timeStr = module.time === -1 ? "NON CHARGÉ" : `${module.time}ms`;
        console.log(`║  ${icon} ${module.name.padEnd(22)} ${timeStr}`);
      });
    }

    console.log(
      "╚════════════════════════════════════════════════════════════╝"
    );
    console.log("\n");

    return slowModules;
  }

  /**
   * Affiche l'historique des logs
   */
  function perfLogs(filter = null) {
    console.log("\n");
    console.log(
      "╔════════════════════════════════════════════════════════════════════╗"
    );
    console.log(
      "║              📝 HISTORIQUE DES LOGS                                 ║"
    );
    console.log(
      "╠════════════════════════════════════════════════════════════════════╣"
    );

    let logs = logsHistory;

    // Filtrer par module si spécifié
    if (filter) {
      logs = logs.filter((l) => l.module === filter || l.type === filter);
      console.log(`║  Filtre: "${filter}"`);
      console.log(
        "╠════════════════════════════════════════════════════════════════════╣"
      );
    }

    if (logs.length === 0) {
      console.log("║  Aucun log enregistré");
    } else {
      logs.forEach((log) => {
        const time = `${log.timestamp}ms`.padStart(8);
        const module = log.module.padEnd(16);
        const type = log.type.padEnd(7);
        console.log(`║  ${time} [${module}] ${type} ${log.message}`);
      });
    }

    console.log(
      "╠════════════════════════════════════════════════════════════════════╣"
    );
    console.log(`║  Total: ${logs.length} logs`);
    console.log(`║  Usage: perf_logs("autotextures") pour filtrer par module`);
    console.log(
      "╚════════════════════════════════════════════════════════════════════╝"
    );
    console.log("\n");

    return logs;
  }

  /**
   * Réinitialise les mesures (pour re-test)
   */
  function perfReset() {
    state.startTime = performance.now();
    state.isComplete = false;
    state.totalTime = 0;

    CONFIG.modules.forEach((m) => {
      state.timings[m.key] = null;
      state.moduleStatus[m.key] = "pending";
    });

    atlantisLog("perf", "Performance monitor réinitialisé");
    atlantisLog("perf", "Surveillance des modules...");

    checkModules();
  }

  /**
   * Export des données brutes (pour intégration)
   */
  function perfExport() {
    return {
      version: "1.1",
      space: window.ATLANTIS_SPACE || "unknown",
      timestamp: new Date().toISOString(),
      totalTime: state.totalTime,
      modules: CONFIG.modules.map((m) => ({
        name: m.name,
        key: m.key,
        time: state.timings[m.key],
        status: state.moduleStatus[m.key],
      })),
      thresholds: CONFIG.thresholds,
      logs: logsHistory,
    };
  }

  // ============================================
  // 🌐 EXPOSER GLOBALEMENT
  // ============================================
  window.perf_check = perfCheck;
  window.perf_details = perfDetails;
  window.perf_slow = perfSlow;
  window.perf_logs = perfLogs;
  window.perf_reset = perfReset;
  window.perf_export = perfExport;

  // API structurée
  window.atlantisPerf = {
    check: perfCheck,
    details: perfDetails,
    slow: perfSlow,
    logs: perfLogs,
    reset: perfReset,
    export: perfExport,
    getState: () => ({ ...state }),
    getConfig: () => ({ ...CONFIG }),
    getLogs: () => [...logsHistory],
  };

  // ============================================
  // 🚀 DÉMARRAGE
  // ============================================
  atlantisLog("perf", "Performance Monitor v1.1 - Surveillance démarrée...");
  console.log("📊 Commandes: perf_check() | perf_details() | perf_logs()\n");

  // Démarrer la surveillance
  setTimeout(checkModules, CONFIG.checkInterval);
})();
