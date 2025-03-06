<?php
require_once "session_check.php";

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
            cursor: pointer;
            transition: background-color 0.3s ease, box-shadow 0.3s ease;
        }

        .container:hover {
            background-color: #f0f0f0;
            box-shadow: 0 0 15px rgba(0, 0, 0, 0.2);
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
    </style>
</head>

<body>
    <div id="food" class="container" onclick="location.href='./food'">
        <div class="icon-group">
            <i class="fa-solid fa-bowl-rice"></i>
            <i class="fa-solid fa-syringe"></i>
        </div>
    </div>
    <div id="pumpsite" class="container" onclick="location.href='./sitechange'">
        <div class="icon-group">
            <i class="fa-solid fa-syringe"></i>
            <i class="fa-solid fa-gas-pump"></i>
        </div>
    </div>
</body>

</html>

