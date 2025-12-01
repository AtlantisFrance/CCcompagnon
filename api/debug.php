<?php
/**
 * DIAGNOSTIC - À supprimer après debug
 */

error_reporting(E_ALL);
ini_set('display_errors', 1);

header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");

echo json_encode(array(
    'step' => 'start',
    'php_version' => PHP_VERSION
));

// Test 1: Config file exists?
$configPath = __DIR__ . '/config/database.php';
if (!file_exists($configPath)) {
    die(json_encode(array('error' => 'database.php not found', 'path' => $configPath)));
}

echo "\n";

// Test 2: Include config
try {
    require_once $configPath;
    echo json_encode(array('step' => 'config loaded', 'DB_HOST' => defined('DB_HOST') ? 'defined' : 'not defined'));
} catch (Exception $e) {
    die(json_encode(array('error' => 'config error', 'message' => $e->getMessage())));
}

echo "\n";

// Test 3: Init file exists?
$initPath = __DIR__ . '/config/init.php';
if (!file_exists($initPath)) {
    die(json_encode(array('error' => 'init.php not found', 'path' => $initPath)));
}

echo "\n";

// Test 4: Include init (this is likely where it fails)
try {
    require_once $initPath;
    echo json_encode(array('step' => 'init loaded'));
} catch (Exception $e) {
    die(json_encode(array('error' => 'init error', 'message' => $e->getMessage())));
}

echo "\n";

// Test 5: Database connection
try {
    $db = getDB();
    echo json_encode(array('step' => 'database connected'));
} catch (Exception $e) {
    die(json_encode(array('error' => 'database error', 'message' => $e->getMessage())));
}

echo "\n";

// Test 6: Query users table
try {
    $stmt = $db->query("SELECT COUNT(*) as count FROM users");
    $result = $stmt->fetch();
    echo json_encode(array('step' => 'query ok', 'users_count' => $result['count']));
} catch (Exception $e) {
    die(json_encode(array('error' => 'query error', 'message' => $e->getMessage())));
}

echo "\n";
echo json_encode(array('status' => 'ALL OK'));
