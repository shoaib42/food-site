<?php
define("DATA_DIR", "sitedata"); // Directory where site_data.json resides
define("DATA_FILE", DATA_DIR . "/site_data.json");
define("TEMP_FILE", DATA_DIR . "/site_data.tmp");
define("BACKUP_DIR", DATA_DIR . "/backups"); // Directory to store backups

define("BAD_REQUEST", 400);
define("SERVER_ERROR", 500);
define("OK", 200);

// Create the site data file if it doesn't exist
if (!file_exists(DATA_FILE)) {
    // Ensure the sitedata directory exists
    if (!is_dir(DATA_DIR)) {
        mkdir(DATA_DIR, 0755, true);
    }

    // Create an empty JSON file
    file_put_contents(DATA_FILE, '{}');
}

// Create the backups directory if it doesn't exist
if (!is_dir(BACKUP_DIR)) {
    mkdir(BACKUP_DIR, 0755, true);
}
?>