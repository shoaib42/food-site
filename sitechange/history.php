<?php

require_once "../session_check.php";
require_once "defs.php";

function respondBack($cr) {
    header('Content-Type: application/json; charset=UTF-8');
    http_response_code($cr[0]);
    echo json_encode($cr[1]);
    exit;
}

function compreBeforeAfterImage($a, $b) {
    if (count($a) !== count($b)) {
        return false;
    }
    for ($i = 0; $i < count($a); $i++) {
        foreach ($a[$i] as $key => $value) {
            if (!array_key_exists($key, $b[$i]) || $value !== $b[$i][$key]) {
                return false;
            }
        }
    }
    return true;
}

function validateAndUpdateJson($jsonData) {
    $data = json_decode($jsonData, true);
    if (!isset($data['prev'], $data['new'])) {
        respondBack(array(BAD_REQUEST, array("error" => "Invalid payload structure")));
    }

    $fp = fopen(DATA_FILE, "r+");
    if (!$fp) {
        respondBack(array(SERVER_ERROR, array("error" => "Failed to find resource")));
    }

    if (!flock($fp, LOCK_EX)) {
        fclose($fp);
        respondBack(array(SERVER_ERROR, array("error" => "Failed to get resource")));
    }

    $fileContent = stream_get_contents($fp);
    $storedData = json_decode($fileContent, true) ?: [];

    // Check if the stored data matches the 'prev' data
    if (!compreBeforeAfterImage($storedData, $data['prev'])) {
        flock($fp, LOCK_UN);
        fclose($fp);
        respondBack(array(BAD_REQUEST, array("error" => "Newer updates exist retry sending", "current" => $storedData)));
    }

    // Check if any site was updated within the last 2 hours
    $now = time();
    $twoHoursAgo = 1000*($now - (2 * 60 * 60));
    $recentUpdate = false;

    foreach ($storedData as $site) {
        if ($site['last'] > $twoHoursAgo) {
            error_log(print_r($site['last'], true));
            error_log(print_r($twoHoursAgo, true));
            $recentUpdate = true;
            break;
        }
    }

    if ($recentUpdate) {
        flock($fp, LOCK_UN);
        fclose($fp);
        respondBack(array(BAD_REQUEST, array("error" => "Today's site was recorded less than 2 hours ago, you can revert to an earlier backup and correct", "current" => $storedData)));
    }

    // Create a backup before modifying
    if (!is_dir(BACKUP_DIR)) {
        mkdir(BACKUP_DIR, 0755, true); 
    }

    $backupFile = BACKUP_DIR . "/site_data_" . time() . ".json";
    if (!copy(DATA_FILE, $backupFile)) {
        flock($fp, LOCK_UN);
        fclose($fp);
        respondBack(array(SERVER_ERROR, array("error" => "Failed to create backup")));
    }

    // Write the new data to a temporary file
    $tmpFp = fopen(TEMP_FILE, "w");
    if (!$tmpFp) {
        flock($fp, LOCK_UN);
        fclose($fp);
        respondBack(array(SERVER_ERROR, array("error" => "Failed to create temp resource")));
    }

    fwrite($tmpFp, json_encode($data['new'], JSON_PRETTY_PRINT));
    fflush($tmpFp);
    fclose($tmpFp);

    // Rename temp file to original (atomic)
    if (!rename(TEMP_FILE, DATA_FILE)) {
        flock($fp, LOCK_UN);
        fclose($fp);
        respondBack(array(SERVER_ERROR, array("error" => "Failed to apply changes")));
    }

    // Release the lock and close the file
    flock($fp, LOCK_UN);
    fclose($fp);

    // Prune old backups (keep only the last 7 days)
    pruneOldBackups();

    respondBack(array(OK, array("status" => "ok", "backup" => $backupFile)));
}

function pruneOldBackups() {
    $backupFiles = glob(BACKUP_DIR . "/site_data_*.json");
    $now = time();
    $retentionPeriod = 7 * 24 * 60 * 60;
    foreach ($backupFiles as $file) {
        if (($now - filemtime($file)) > $retentionPeriod) {
            unlink($file);
        }
    }
}

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    $fp = fopen(DATA_FILE, "r");
    if (!$fp) {
        respondBack(array(SERVER_ERROR, array("error" => "Failed to open data file")));
    }

    if (!flock($fp, LOCK_SH)) {
        fclose($fp);
        respondBack(array(SERVER_ERROR, array("error" => "Could not lock file")));
    }

    $content = stream_get_contents($fp);
    flock($fp, LOCK_UN);
    fclose($fp);

    respondBack(array(OK, json_decode($content, true) ?: []));
} elseif ($method === 'PUT') {
    validateAndUpdateJson(file_get_contents('php://input'));
} elseif ($method === 'OPTIONS') {
    header("Access-Control-Allow-Methods: GET, PUT");
    header("Access-Control-Allow-Headers: Content-Type");
    header("Access-Control-Max-Age: 600");
    http_response_code(204);
} else {
    respondBack(array(405, array("error" => "Unsupported HTTP method")));
}
?>