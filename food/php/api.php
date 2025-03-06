<?php

require_once "../session_check.php";
require_once 'config.php';



if ($dbtype === "mysql") {
    require_once 'FoodDatabaseMySQL.php';
    $foodDatabase = new FoodDatabaseMySQL();
} else if ($dbtype === "sqlite") {
    require_once 'FoodDatabaseSQLite.php';
    $foodDatabase = new FoodDatabaseSQLite();
}

// Define routes and corresponding handler functions
$method = $_SERVER['REQUEST_METHOD'];
$code_resp = array(500, array('error' => "Shit went down"));
$code = 500;

function respondBack($cr) {
    global $foodDatabase;
    header('Content-Type: application/json; charset=UTF-8');
    http_response_code($cr[0]);
    echo json_encode($cr[1]);
    $foodDatabase->closeConnection();
    exit;
}

function validateInputJson($jsonData) {
    $bad_request = 400;
    if (!empty($jsonData)) {
        $data = json_decode($jsonData, true);
        if ($data !== null) {
            $food = $data["newFood"];
            $gramsOfFood = $data["newGramsOfFood"];
            $gramsOfCarbs = $data["newGramsOfCarbs"];

            if (empty($food)) {
                respondBack(array($bad_request, array("error" => "food cannot be empty")));
            }
            if ($gramsOfFood < 0) {
                respondBack(array($bad_request, array("error" => "grams of carbs should be zero or more")));
            }
            if ($gramsOfCarbs <= 0) {
                respondBack(array($bad_request, array("error" => "grams of carbs should be greater than zero")));
            }
        } else {
            respondBack(array($bad_request, array("error" => "empty payload")));
        }
    } else {
        respondBack(array($bad_request, array("error" => "no payload")));
    }
    
    return [mb_strtoupper(trim($food), 'UTF-8'), $gramsOfFood / $gramsOfCarbs];
}


if ($method === 'GET') {
    // Handle GET request (e.g., fetch data)
    $searchQuery = isset($_GET['q']) ? $_GET['q'] : '';

    // Check if search query is empty
    if (empty($searchQuery)) {
        // Return error response
        $code_resp = array(400, array('error' => "Search query parameter 'q' is required"));
    } else {
        $searchQuery = mb_strtoupper(trim($searchQuery), 'UTF-8');
        $code_resp = $foodDatabase->fetchFood($searchQuery);
    }
} elseif ($method === 'POST') {
    $jsonData = file_get_contents('php://input');
    $ret = validateInputJson($jsonData);
    $code_resp = $foodDatabase->insertFood(...$ret);
} elseif ($method === 'PUT') {
    $jsonData = file_get_contents('php://input');
    $ret = validateInputJson($jsonData);
    $code_resp = $foodDatabase->updateFood(...$ret);
} elseif ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    // Respond with CORS headers
    $http_origin = $_SERVER['HTTP_ORIGIN'];
    // header("Access-Control-Allow-Origin: $http_origin");
    header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE");
    header("Access-Control-Allow-Headers: Content-Type");
    header("Access-Control-Max-Age: 3600");
    http_response_code(204); // No Content
    exit;
} else {
    // Unsupported HTTP method
    $code_resp = array(405, array('error' => 'Unsupported HTTP method'));
}
respondBack($code_resp);
