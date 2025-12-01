<?php
// =============================================
// SERVEUR D'IMAGES CORS - Atlantis City
// Versioning automatique par date de modification
// =============================================

// Headers CORS
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Origin, Content-Type, Accept");

// Gérer les requêtes OPTIONS (preflight)
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Uniquement GET autorisé
if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    die("Method not allowed");
}

// Récupérer les paramètres
$project = isset($_GET['project']) ? $_GET['project'] : '';
$file = isset($_GET['file']) ? $_GET['file'] : '';
// Le paramètre "v" est ignoré côté serveur mais force le refresh côté navigateur

// Sécurité : nettoyer les paramètres
$project = preg_replace('/[^a-zA-Z0-9_-]/', '', $project);
$file = preg_replace('/[^a-zA-Z0-9_.-]/', '', $file);

// Vérifier les paramètres requis
if (empty($project) || empty($file)) {
    http_response_code(400);
    die("Bad request: missing project or file parameter");
}

// Construire le chemin
$filepath = __DIR__ . '/' . $project . '/' . $file;

// Sécurité : empêcher path traversal
$realBase = realpath(__DIR__);
$realPath = realpath($filepath);

if ($realPath === false || strpos($realPath, $realBase) !== 0) {
    http_response_code(403);
    die("Forbidden");
}

// Vérifier que le fichier existe
if (!file_exists($filepath) || !is_file($filepath)) {
    http_response_code(404);
    die("Image not found: $project/$file");
}

// Types MIME autorisés
$extension = strtolower(pathinfo($file, PATHINFO_EXTENSION));
$mimeTypes = [
    'jpg'  => 'image/jpeg',
    'jpeg' => 'image/jpeg',
    'png'  => 'image/png',
    'gif'  => 'image/gif',
    'webp' => 'image/webp',
    'svg'  => 'image/svg+xml',
];

// Vérifier l'extension autorisée
if (!isset($mimeTypes[$extension])) {
    http_response_code(415);
    die("Unsupported file type: $extension");
}

$mimeType = $mimeTypes[$extension];
$fileSize = filesize($filepath);
$lastModified = filemtime($filepath);
$etag = md5($filepath . $lastModified);

// Headers de réponse
header("Content-Type: " . $mimeType);
header("Content-Length: " . $fileSize);
header("Cache-Control: public, max-age=604800, immutable");
header("ETag: " . $etag);
header("Last-Modified: " . gmdate('D, d M Y H:i:s', $lastModified) . ' GMT');
header("X-Content-Type-Options: nosniff");

// Envoyer l'image
readfile($filepath);
exit();