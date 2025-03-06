<?php
define("USER_DIR", __DIR__ . "/userdir");
define("USERS_FILE", USER_DIR . "/users.json");
// the ip ranges (CIDR) will allow paswordless access
$allowed_ip_ranges = [
    // change this or remove it
    '10.16.0.0/16'
];

$root_path = "/foobar";

$paths = [
    'rootPath' => $root_path . "/",
    'foodPath' => $root_path . "/food/",
    'sitePath' => $root_path . "/sitechange/",
    'login'    => $root_path . "/login/"
];

// rate limit
$max_login_attempts = 5;
$rl_login_time_window = 60;

?>