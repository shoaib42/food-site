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

if (!file_exists(CONFIG_FILE)) {
    // If the file doesn't exist, send a response to the user
    header('Content-Type: text/html; charset=utf-8');
    echo <<<HTML
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Configuration Required</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            background-color: #f4f4f4;
            color: #333;
            text-align: center;
            padding: 50px;
        }
        .message {
            background-color: #fff;
            padding: 20px;
            border-radius: 5px;
            box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
            display: inline-block;
        }
        .message h1 {
            color: #d9534f;
        }
    </style>
</head>
<body>
    <div class="message">
        <h1>Configuration Required</h1>
        <p>Please ensure the <code>config.ini</code> file is set up in the <code>conf</code> directory.</p>
        <p>If you haven't created the file yet, please create it and configure it properly.</p>
    </div>
</body>
</html>
HTML;
    exit(); // Stop further execution
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
