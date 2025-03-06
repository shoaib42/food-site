<?php
include_once 'config.php';
include_once 'FoodDatabase.php';

class FoodDatabaseMySQL extends FoodDatabase {

    private $conn;

    protected function connect()
    {
        global $dbconf;
        extract($dbconf);
        $this->conn = new mysqli($host, $user, $password, $name);
        $this->conn->set_charset("utf8mb4");
        if ($this->conn->connect_error) {
            die("Connection failed: " . $this->conn->connect_error);
        }
    }


    public function __construct()
    {
        global $dbHost, $dbUser, $dbPassword, $dbName;
        $this->conn = new mysqli($dbHost, $dbUser, $dbPassword, $dbName);
        $this->conn->set_charset("utf8mb4");
        if ($this->conn->connect_error) {
            die("Connection failed: " . $this->conn->connect_error);
        }
    }

    public function fetchFood($searchQuery)
    {

        // Prepare SQL statement with case-insensitive search query
        $select_sql = "SELECT food, gramsPerCarb FROM foodcarbs WHERE UPPER(food) LIKE ?";
        $stmt = $this->conn->prepare($select_sql);
        $searchParam = '%' . $searchQuery . '%'; // Add wildcard to search for partial matches
        $stmt->bind_param("s", $searchParam);
        $stmt->execute();
        $result = $stmt->get_result();

        // Initialize an empty array to store food data
        $foodData = array();

        // Check if any rows were returned
        if ($result->num_rows > 0) {
            // Loop through each row and fetch data
            while ($row = $result->fetch_assoc()) {
                // Add food data to the array
                $foodData[] = array(
                    "food" => mb_convert_case($row["food"], MB_CASE_TITLE, "UTF-8"),
                    "gramsPerCarb" => $row["gramsPerCarb"]
                );
            }
        }
        $stmt->close();
        return array(200, array("found" => (bool) $foodData, "data" => $foodData));
    }

    private function fetchRecord($food)
    {
        $stmt = $this->conn->prepare("SELECT * FROM foodcarbs WHERE food = ?");
        $stmt->bind_param("s", $food);
        $stmt->execute();
        $result = $stmt->get_result();
        $record = $result->fetch_assoc();
        $stmt->close();
        return $record;
    }

    public function insertFood($food, $gramsPerCarb)
    {
        $ret = array();
        try {
            // Prepare SQL statement for insertion
            $stmt = $this->conn->prepare("INSERT INTO foodcarbs (food, gramsPerCarb) VALUES (?, ?)");
            $stmt->bind_param("sd", $food, $gramsPerCarb);

            // Execute the statement
            $stmt->execute();

            // Close statement
            $stmt->close();
            $ret = [201, ["success" => true]];
        } catch (mysqli_sql_exception $e) {
            // Check for primary key violation
            if ($this->conn->errno == 1062) { // Error code for duplicate entry (primary key violation)
                $existingRecord = $this->fetchRecord($food);
                $ret = [409, ["success" => false, "message" => "pk violation", "foodUpper" => $food, "record" => $existingRecord]];
            } else {
                $ret = [500, ["success" => false, "message" => "server error ".$food." ".$e->getMessage()]];
            }
        }
        return $ret;
    }

    public function updateFood($food, $gramsPerCarb)
    {
        $ret = array();
        try {
            // Prepare SQL statement for insertion
            $stmt = $this->conn->prepare("UPDATE foodcarbs SET gramsPerCarb = ? WHERE food = ?");
            $stmt->bind_param("ds", $gramsPerCarb, $food);
    
            // Execute the statement
            $stmt->execute();
    
            // Close statement
            $stmt->close();
            $ret = [204, []];
        } catch (mysqli_sql_exception $e) {
            $ret = [500, ["success"=> false,"message"=>"server error"]];
        }
        return $ret;
    }

    public function closeConnection()
    {
        $this->conn->close();
    }
}
