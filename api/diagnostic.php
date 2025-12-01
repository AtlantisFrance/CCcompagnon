<?php
/**
 * 🔧 DIAGNOSTIC API ATLANTIS
 * 
 * Upload ce fichier dans /api/ et accède à :
 * https://compagnon.atlantis-city.com/api/diagnostic.php
 */

error_reporting(E_ALL);
ini_set('display_errors', 1);

header('Content-Type: text/html; charset=utf-8');

echo "<h1>🔧 Diagnostic API Atlantis</h1>";

// Test 1: Version PHP
echo "<h2>1️⃣ Version PHP</h2>";
echo "<p>PHP Version: <strong>" . phpversion() . "</strong></p>";

// Test 2: Extensions requises
echo "<h2>2️⃣ Extensions PHP</h2>";
$extensions = ['pdo', 'pdo_mysql', 'json', 'mbstring'];
foreach ($extensions as $ext) {
    $status = extension_loaded($ext) ? '✅' : '❌';
    echo "<p>$status $ext</p>";
}

// Test 3: Vérifier les fichiers
echo "<h2>3️⃣ Fichiers de configuration</h2>";

$configPath = __DIR__ . '/config/database.php';
$initPath = __DIR__ . '/config/init.php';

echo "<p>Chemin actuel: <code>" . __DIR__ . "</code></p>";
echo "<p>database.php: " . (file_exists($configPath) ? '✅ Trouvé' : '❌ Non trouvé') . "</p>";
echo "<p>init.php: " . (file_exists($initPath) ? '✅ Trouvé' : '❌ Non trouvé') . "</p>";

// Test 4: Connexion BDD
echo "<h2>4️⃣ Test connexion MySQL</h2>";

// Définir la constante pour autoriser l'inclusion
define('ATLANTIS_API', true);

try {
    // Inclure manuellement database.php pour voir les erreurs
    if (file_exists($configPath)) {
        include $configPath;
        
        echo "<p>✅ database.php chargé</p>";
        echo "<p>Host: <code>" . (defined('DB_HOST') ? DB_HOST : 'NON DÉFINI') . "</code></p>";
        echo "<p>Database: <code>" . (defined('DB_NAME') ? DB_NAME : 'NON DÉFINI') . "</code></p>";
        echo "<p>User: <code>" . (defined('DB_USER') ? DB_USER : 'NON DÉFINI') . "</code></p>";
        echo "<p>Password: <code>" . (defined('DB_PASS') ? '***défini***' : 'NON DÉFINI') . "</code></p>";
        
        // Tenter la connexion
        echo "<h3>Tentative de connexion...</h3>";
        
        $dsn = "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=utf8mb4";
        $pdo = new PDO($dsn, DB_USER, DB_PASS, [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION
        ]);
        
        echo "<p style='color:green; font-size:20px;'>✅ CONNEXION RÉUSSIE !</p>";
        
        // Vérifier les tables
        echo "<h3>Tables dans la base :</h3>";
        $stmt = $pdo->query("SHOW TABLES");
        $tables = $stmt->fetchAll(PDO::FETCH_COLUMN);
        
        if (empty($tables)) {
            echo "<p>⚠️ Aucune table trouvée. As-tu exécuté le script SQL ?</p>";
        } else {
            echo "<ul>";
            foreach ($tables as $table) {
                echo "<li>$table</li>";
            }
            echo "</ul>";
        }
        
        // Vérifier le compte admin
        echo "<h3>Compte admin :</h3>";
        $stmt = $pdo->query("SELECT id, email, global_role, status FROM users WHERE global_role = 'super_admin' LIMIT 1");
        $admin = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if ($admin) {
            echo "<p>✅ Admin trouvé : {$admin['email']} (status: {$admin['status']})</p>";
        } else {
            echo "<p>❌ Aucun compte super_admin trouvé</p>";
        }
        
    } else {
        echo "<p style='color:red;'>❌ Fichier database.php introuvable !</p>";
        echo "<p>Chemin recherché: <code>$configPath</code></p>";
    }
    
} catch (PDOException $e) {
    echo "<p style='color:red; font-size:18px;'>❌ ERREUR CONNEXION BDD</p>";
    echo "<p><strong>Message:</strong> " . htmlspecialchars($e->getMessage()) . "</p>";
    echo "<p><strong>Code:</strong> " . $e->getCode() . "</p>";
    
    echo "<h3>🔍 Vérifications à faire :</h3>";
    echo "<ul>";
    echo "<li>Le nom de la base de données est-il correct ?</li>";
    echo "<li>L'utilisateur MySQL a-t-il les droits sur cette base ?</li>";
    echo "<li>Le mot de passe est-il correct ?</li>";
    echo "<li>L'hôte MySQL est-il correct ? (format OVH: nombase.mysql.db)</li>";
    echo "</ul>";
    
} catch (Exception $e) {
    echo "<p style='color:red;'>❌ Erreur: " . htmlspecialchars($e->getMessage()) . "</p>";
}

echo "<hr>";
echo "<p><em>Supprime ce fichier après diagnostic !</em></p>";
?>