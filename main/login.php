<?php
// login.php

session_start();
require_once __DIR__ . '/users.php';
require_once __DIR__ . '/defs.php';


function validate($username, $password)
{
    global $users;

    // Check if the username exists in the array
    if (array_key_exists($username, $users)) {
        error_log($users[$username]);
        return password_verify($password, $users[$username]);
    }

    return false;
}

// Function to get the client's IP address
function get_client_ip() {
    if (!empty($_SERVER['HTTP_CLIENT_IP'])) {
        return $_SERVER['HTTP_CLIENT_IP'];
    } elseif (!empty($_SERVER['HTTP_X_FORWARDED_FOR'])) {
        return $_SERVER['HTTP_X_FORWARDED_FOR'];
    } else {
        return $_SERVER['REMOTE_ADDR'];
    }
}

function is_rate_limited($ip) {
    global $max_login_attempts, $rl_login_time_window;

    if (!isset($_SESSION['login_attempts'][$ip])) {
        return false;
    }

    $attempts = $_SESSION['login_attempts'][$ip];

    if (time() - $attempts['last_attempt'] > $rl_login_time_window) {
        unset($_SESSION['login_attempts'][$ip]);
        return false;
    }

    if ($attempts['count'] >= $max_login_attempts) {
        return true;
    }

    return false;
}

function increment_failed_attempt($ip) {
    global $max_login_attempts;

    if (!isset($_SESSION['login_attempts'][$ip])) {
        $_SESSION['login_attempts'][$ip] = [
            'count' => 1,
            'last_attempt' => time()
        ];
    } else {
        $_SESSION['login_attempts'][$ip]['count']++;
        $_SESSION['login_attempts'][$ip]['last_attempt'] = time();
    }
}

function reset_failed_attempts($ip) {
    unset($_SESSION['login_attempts'][$ip]);
}

$ip = get_client_ip();

if (is_rate_limited($ip)) {
    $error = "Too many failed login attempts. Try again later.";
} elseif ($_SERVER["REQUEST_METHOD"] == "POST") {
    $username = $_POST['username'];
    $password = $_POST['password'];
    $redirect = $_POST['redirect'];

    // Need to check if we allow a redirect based on the paths we have preset
    // else just head over to the root
    if (!array_search($redirect, $paths)) {
        $redirect = $paths['rootPath'];
    }

    if (validate($username, $password)) {
        reset_failed_attempts($ip);

        $_SESSION['username'] = $username;
        $_SESSION['authenticated'] = true;
        $_SESSION['last_activity'] = time();
        header("Location: " . $redirect);
        exit();
    } else {
        increment_failed_attempt($ip);
        $error = "Invalid username or password";
    }
}

?>

<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Login</title>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.2/css/all.min.css"
        integrity="sha512-SnH5WK+bZxgPHs44uWIX+LLJAJ9/2PkPKZ5QiAj6Ta86w+fsb2TkcmfRyVX3pBnMFcV7oQPJkl9QevSCWr3W6A=="
        crossorigin="anonymous" referrerpolicy="no-referrer" />
    <style>
        body {
            font-family: Arial, sans-serif;
        }

        .container {
            width: 300px;
            margin: 100px auto;
            padding: 20px;
            border: 1px solid #ccc;
            border-radius: 5px;
            box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
        }

        .login-container {
            width: 250px;
            margin: 0 auto;
        }

        input[type="text"],
        input[type="password"],
        input[type="submit"] {
            width: 100%;
            padding: 10px;
            margin-bottom: 10px;
            border-radius: 3px;
            border: 1px solid #ccc;
            box-sizing: border-box;
        }

        input[type="submit"] {
            background-color: #007bff;
            color: #fff;
            cursor: pointer;
        }

        .icon-group {
            display: flex;
            justify-content: center;
            margin-bottom: 50px;
            scale: 2;
            margin-top: 27px;
        }

        .icon-group i {
            font-size: 24px;
            margin: 0 10px;
        }
        @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
        }

        .error-message {
            display: flex;
            justify-content: center;
            color: #ff0000;
            margin-bottom: 15px;
            font-size: 14px;
            animation: fadeIn 0.5s ease-in-out;
        }
    </style>
</head>

<body>
    <div class="container">
        <div class="icon-group">
            <i class="fa-solid fa-bowl-rice"></i>
            <i class="fa-solid fa-syringe"></i>
            <i class="fa-solid fa-gas-pump"></i>
        </div>
        <?php if (!empty($error)): ?>
            <div class="error-message">
                <?php echo $error; ?>
            </div>
        <?php endif; ?>
        <div class="login-container">
            <form action="" method="post">
                <input type="hidden" name="redirect" value="<?php echo $_GET['redirect'] ?? $paths['rootPath']; ?>">
                <input type="text" name="username" placeholder="admin" required>
                <input type="password" name="password" placeholder="admin123" required>
                <input type="submit" value="Login">
            </form>
        </div>
    </div>
</body>

</html>

