<?php
require_once  __DIR__ . 'defs.php';

// associative array with users and their hashed passwords
$users = [
    // add 'user' => 'hashed password', here, run tools/register_users.php to get the hashed password
    // remove the following, this will not work at all!
    // 'foo' => '$2y$10$W4MvfXpgx3YEiLn16aVWFevZuJIDSGCXSghw.i8wCcYHpF90AwCVe',
];

if (file_exists(USERS_FILE)) {
    $file_users = json_decode(file_get_contents(USERS_FILE), true);
    if (is_array($file_users)) {
        $users = array_merge($users, $file_users);
    }
}
?>