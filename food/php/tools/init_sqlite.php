<?php
include_once 'config.php';

extract($databaseConfigs['sqlite']);

// Create a new SQLite database or open an existing one
try {
    echo $location . DIRECTORY_SEPARATOR . $name . '.sqlite';
    $directory = $location;
    if (!is_dir($directory)) {
        // Create the directory
        if (!mkdir($directory, 0777, true)) {
            die("Failed to create directory.");
        }
    }
    $db = new SQLite3($location . DIRECTORY_SEPARATOR . $name . '.sqlite');
} catch (Exception $e) {
    die("Failed to open database: " . $e->getMessage());
}

// Create the foodcarbs table if it doesn't exist
$query = "CREATE TABLE IF NOT EXISTS foodcarbs (
            food TEXT PRIMARY KEY,
            gramsPerCarb REAL NOT NULL,
            CONSTRAINT enforce_uppercase_food CHECK (food = UPPER(food))
          )";

if (!$db->exec($query)) {
    die("Failed to create table: " . $db->lastErrorMsg());
}

echo "Database initialized successfully.";

// Close the database connection
$db->close();