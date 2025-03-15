<?php
require_once __DIR__ . '/../config.php';

$dbChoice = $config['database'] ?? [];
$sqliteConf = $config['sqlite'] ?? [];
$mysqlConf = $config['mysql'] ?? [];

// Determine the database type
$dbtype = $dbChoice['dbtype'] ?? 'sqlite';  // Default to sqlite if missing

// Dynamically build database configs based on presence in config.ini
$databaseConfigs = [];

if (!empty($mysqlConf)) {
    $databaseConfigs['mysql'] = [
        'host' => $mysqlConf['host'] ?? 'localhost',
        'user' => $mysqlConf['user'] ?? '',
        'password' => $mysqlConf['password'] ?? '',
        'name' => $mysqlConf['name'] ?? ''
    ];
}

if (!empty($sqliteConf)) {
    $databaseConfigs['sqlite'] = [
        'location' => $sqliteConf['location'] ?? 'sqdblite',
        'name' => $sqliteConf['name'] ?? 'carbsimple'
    ];
}

// Ensure the selected database type exists
if (!isset($databaseConfigs[$dbtype])) {
    error_log("Unknown or missing database type: {$dbtype}");
    exit;
}

$dbconf = $databaseConfigs[$dbtype];

// SQLite Initialization Logic
if ($dbtype === 'sqlite') {
    try {
        $directory = __DIR__ . DIRECTORY_SEPARATOR . $dbconf['location'];
        $dbPath = $directory . DIRECTORY_SEPARATOR . $dbconf['name'] . '.sqlite';

        if (!is_dir($directory)) {
            if (!mkdir($directory, 0777, true)) {
                die("Failed to create SQLite directory.");
            }
        }

        $db = new SQLite3($dbPath);

        // Create the 'foodcarbs' table if it doesn't exist
        $query = "CREATE TABLE IF NOT EXISTS foodcarbs (
                    food TEXT PRIMARY KEY,
                    gramsPerCarb REAL NOT NULL,
                    CONSTRAINT enforce_uppercase_food CHECK (food = UPPER(food))
                  )";

        if (!$db->exec($query)) {
            die("Failed to create table: " . $db->lastErrorMsg());
        }

        error_log("SQLite database initialized successfully.");

        // Close the database connection
        $db->close();
    } catch (Exception $e) {
        die("Failed to initialize SQLite database: " . $e->getMessage());
    }
}

?>
