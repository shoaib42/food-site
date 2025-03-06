<?php

require_once  __DIR__ . '/../defs.php';
// bcrypt
function hash_password($password) {
    return password_hash($password, PASSWORD_BCRYPT);
}

function prompt($message) {
    echo $message;
    return trim(fgets(STDIN));
}

// Get username and password securely
$username = prompt("Enter username: ");
$password = prompt("Enter password: ");

// Hash the password
$hash = hash_password($password);

$write_to_file = in_array('--write', $argv);

if ($write_to_file) {
    $user_data = [
        'username' => $username,
        'hash' => $hash,
    ];
    
    $users = [];

    // Read existing users if the file exists
    if (file_exists(USERS_FILE)) {
        $users = json_decode(file_get_contents(USERS_FILE), true);
    }

    // Add the new user
    $users[$username] = $hash;

    // Write back to the file
    file_put_contents(USERS_FILE, json_encode($users, JSON_PRETTY_PRINT));

    echo "User '$username' has been written to '" . USERS_FILE . "'.\n";
} else {
    echo "Add this to users.php \$users associative array\n";
    echo "'$username' => '$hash',\n";
}