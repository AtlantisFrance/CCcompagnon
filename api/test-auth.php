<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Headers: Authorization, Content-Type');

echo json_encode([
    'getallheaders' => function_exists('getallheaders') ? getallheaders() : 'non disponible',
    'HTTP_AUTHORIZATION' => $_SERVER['HTTP_AUTHORIZATION'] ?? 'non défini',
    'REDIRECT_HTTP_AUTHORIZATION' => $_SERVER['REDIRECT_HTTP_AUTHORIZATION'] ?? 'non défini',
    'all_server_auth' => array_filter($_SERVER, function($k) {
        return stripos($k, 'AUTH') !== false;
    }, ARRAY_FILTER_USE_KEY)
], JSON_PRETTY_PRINT);