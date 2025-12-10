<?php
/**
 * ============================================
 * 📋 API POPUPS - LIST TEMPLATES
 * Atlantis City
 * v1.0 - 2024-12-10 - Création initiale
 * 
 * Liste dynamiquement tous les templates disponibles
 * dans le dossier /Script/test/v2/templates/
 * 
 * GET /api/popups/list.php
 * ============================================
 */

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json; charset=utf-8");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Chemin vers le dossier des templates
$templatesDir = realpath(__DIR__ . '/../../Script/test/v2/templates');

if (!$templatesDir || !is_dir($templatesDir)) {
    // Fallback si le chemin n'existe pas
    $templatesDir = __DIR__ . '/../../Script/test/v2/templates';
}

$templates = [];

if (is_dir($templatesDir)) {
    // Scanner le dossier pour les fichiers *.tpl.js
    $files = glob($templatesDir . '/*.tpl.js');
    
    foreach ($files as $file) {
        $filename = basename($file);
        // Extraire le nom du template (ex: "contact.tpl.js" → "contact")
        $templateId = str_replace('.tpl.js', '', $filename);
        
        // Lire les premières lignes pour extraire les métadonnées
        $content = file_get_contents($file, false, null, 0, 2000);
        
        // Extraire le nom depuis le commentaire ou le code
        $name = $templateId;
        $icon = "📄";
        $description = "";
        
        // Chercher dans window.ATLANTIS_TEMPLATES.xxx = { name: "...", icon: "...", description: "..." }
        if (preg_match('/name:\s*["\']([^"\']+)["\']/', $content, $matches)) {
            $name = $matches[1];
        }
        if (preg_match('/icon:\s*["\']([^"\']+)["\']/', $content, $matches)) {
            $icon = $matches[1];
        }
        if (preg_match('/description:\s*["\']([^"\']+)["\']/', $content, $matches)) {
            $description = $matches[1];
        }
        
        $templates[] = [
            'id' => $templateId,
            'file' => $filename,
            'name' => $name,
            'icon' => $icon,
            'description' => $description
        ];
    }
    
    // Trier par nom
    usort($templates, function($a, $b) {
        return strcmp($a['name'], $b['name']);
    });
}

echo json_encode([
    'success' => true,
    'count' => count($templates),
    'templates' => $templates,
    'base_url' => 'https://compagnon.atlantis-city.com/Script/test/v2/templates/'
], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);