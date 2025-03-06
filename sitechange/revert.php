<?php

require_once "../session_check.php";
require_once "defs.php";

function respondBack($cr) {
    header('Content-Type: application/json; charset=UTF-8');
    http_response_code($cr[0]);
    echo json_encode($cr[1]);
    exit;
}

$method = $_SERVER['REQUEST_METHOD'];
error_log("Request Method: " . $method);
if ($method === 'GET') {

    $timestamp = isset($_GET['q']) ? $_GET['q'] : '';

    if (empty($timestamp)) {
        $backupFiles = glob(BACKUP_DIR . "/site_data_*.json");
        $backups = [];

        foreach ($backupFiles as $file) {
            $timestamp = basename($file, ".json");
            $timestamp = str_replace("site_data_", "", $timestamp);
            $backups[] = (int)$timestamp;
        }

        respondBack([OK, $backups]);
    } else {
        $fp = fopen(BACKUP_DIR . "/site_data_" . $timestamp . ".json", "r");
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
        $searchQuery = mb_strtoupper(trim($searchQuery), 'UTF-8');
        $code_resp = $foodDatabase->fetchFood($searchQuery);
    }

    
} elseif ($method === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);
    if (!isset($input['timestamp'])) {
        respondBack([BAD_REQUEST, ["error" => "Missing timestamp"]]);
    }

    $backupFile = BACKUP_DIR . "/site_data_" . $input['timestamp'] . ".json";
    if (!file_exists($backupFile)) {
        respondBack([BAD_REQUEST, ["error" => "Backup not found"]]);
    }

    $fp = fopen(DATA_FILE, "r+");
    if (!$fp) {
        respondBack([SERVER_ERROR, ["error" => "Failed to open data file"]]);
    }

    if (!flock($fp, LOCK_EX)) {
        fclose($fp);
        respondBack([SERVER_ERROR, ["error" => "Failed to get resource"]]);
    }

    if (!copy($backupFile, DATA_FILE)) {
        flock($fp, LOCK_UN);
        fclose($fp);
        respondBack([SERVER_ERROR, ["error" => "Failed to restore backup"]]);
    }

    flock($fp, LOCK_UN);
    fclose($fp);

    respondBack([OK, ["status" => "ok", "message" => "Backup restored successfully"]]);
} elseif ($method === 'OPTIONS') {
    header("Access-Control-Allow-Methods: GET, POST, DELETE");
    header("Access-Control-Allow-Headers: Content-Type");
    header("Access-Control-Max-Age: 600");
    http_response_code(204);
} elseif ($method === "DELETE") {
    
    $timestamp = isset($_GET['t']) ? $_GET['t'] : '';

    if (empty($timestamp)) {
        respondBack([BAD_REQUEST, ["error" => "Missing timestamp"]]);
    }

    $backupFile = BACKUP_DIR . "/site_data_" . $timestamp . ".json";

    if (!file_exists($backupFile)) {
        respondBack([BAD_REQUEST, ["error" => "Backup not found"]]);
    }

    $fp = fopen($backupFile, "r+");
    if (!$fp) {
        respondBack([SERVER_ERROR, ["error" => "Failed to open backup file"]]);
    }

    if (!flock($fp, LOCK_EX | LOCK_NB)) {
        fclose($fp);
        respondBack([SERVER_ERROR, ["error" => "Backup file is currently locked"]]);
    }

    if (!unlink($backupFile)) {
        flock($fp, LOCK_UN);
        fclose($fp);
        respondBack([SERVER_ERROR, ["error" => "Failed to delete backup file"]]);
    }
    
    flock($fp, LOCK_UN);
    fclose($fp);

    respondBack([OK, ["status" => "ok", "message" => "Backup deleted successfully"]]);
} else {
    respondBack(array(405, array("error" => "Unsupported HTTP method")));
}
?>