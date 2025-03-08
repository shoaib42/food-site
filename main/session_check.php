<?php
// session_check.php
require_once __DIR__ . "/defs.php";

session_start();


function is_internal_ip() {
    global $allowed_ip_ranges;

    $ip = $_SERVER['REMOTE_ADDR'];

    foreach ($allowed_ip_ranges as $range) {
        if (cidr_match($ip, $range)) {
            return true;
        }
    }

    return false;
}

function cidr_match($ip, $cidr) {
    list($subnet, $mask) = explode('/', $cidr);
    $ip_long = ip2long($ip);
    $subnet_long = ip2long($subnet);
    $mask_long = ~((1 << (32 - $mask)) - 1);

    return ($ip_long & $mask_long) === ($subnet_long & $mask_long);
}

function check_session() {
    if (is_internal_ip()) {
        return;
    }
    global $paths;

    if (!isset($_SESSION['authenticated']) || $_SESSION['authenticated'] !== true) {
        $redirect = $_SERVER['REQUEST_URI'];
        $location = $paths['login'] . "?redirect=" . urlencode($redirect);
        header("Location: ". $location);
        exit();
    }

    $timeout = 600; // 10 miutes
    if (isset($_SESSION['last_activity']) && (time() - $_SESSION['last_activity']) > $timeout) {
        $redirect = $_SERVER['REQUEST_URI'];
        $location = $paths['login'] . "?redirect=" . urlencode($redirect);
        session_unset();
        session_destroy();
        header("Location: ". $location);
        exit();
    }

    $_SESSION['last_activity'] = time();
}

check_session();
?>