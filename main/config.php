<?php
define("CONFIG_FILE", __DIR__ . "/conf/config.ini");

function writeIniFile($file, $array) {
    $content = '';
    foreach ($array as $section => $values) {
        $content .= "[{$section}]\n";  // Add the section header
        
        foreach ($values as $key => $value) {
            // If the value is an array (like allowed_ip_ranges)
            if (is_array($value)) {
                foreach ($value as $index => $item) {
                    $content .= "{$index} = {$item}\n";
                }
            } else {
                $content .= "{$key} = {$value}\n";
            }
        }
        
        $content .= "\n";
    }
    if (file_put_contents($file, $content) === false) {
        // Handle file write failure
        error_log("Failed to write to config file.");
    }
}

// Parse the ini file and load its contents
$config = parse_ini_file(CONFIG_FILE, true);

$allowed_ip_ranges = $config['allowed_ip_ranges'];
$root_path = $config['paths']['rootPath'];

$paths = [
    'rootPath' => $root_path . "/",
    'foodPath' => $root_path . "/food/",
    'sitePath' => $root_path . "/sitechange/",
    'login'    => $root_path . "/login/"
];

$max_login_attempts = $config['rate_limit']['max_login_attempts'];
$rl_login_time_window = $config['rate_limit']['rl_login_time_window'];
$timeout_seconds = $config['session_timeout']['timeout'];

$users = $config['users'];

$plntxtfound = false;
// Loop through users and check for plain text passwords an hash em
foreach ($users as $username => $password) {
    if (strlen($password) < 60 || substr($password, 0, 4) !== '$2y$') {
        $users[$username] = password_hash($password, PASSWORD_BCRYPT);
        $plntxtfound = true;
    }
}

// If any passwords were hashed, write the updated config back to the .ini file
if ($plntxtfound) {
    $config['users'] = $users;
    writeIniFile(CONFIG_FILE, $config);
}

?>
