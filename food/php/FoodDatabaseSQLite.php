<?php
include_once 'config.php';
include_once 'FoodDatabase.php';

class FoodDatabaseSQLite extends FoodDatabase
{

    protected function connect()
    {
        global $dbconf;
        extract($dbconf);
        $this->conn = new SQLite3($location . DIRECTORY_SEPARATOR . $name . '.sqlite');
        if (!$this->conn) {
            die("Connection failed");
        }
    }

    public function fetchFood($searchQuery)
    {
        // Prepare SQL statement with case-insensitive search query
        $select_sql = "SELECT food, gramsPerCarb FROM foodcarbs WHERE UPPER(food) LIKE ?";
        $stmt = $this->conn->prepare($select_sql);
        $searchParam = '%' . $searchQuery . '%'; // Add wildcard to search for partial matches
        $stmt->bindValue(1, strtoupper($searchParam), SQLITE3_TEXT);
        $result = $stmt->execute();

        // Initialize an empty array to store food data
        $foodData = array();

        // Check if any rows were returned
        while ($row = $result->fetchArray(SQLITE3_ASSOC)) {
            // Add food data to the array
            $foodData[] = array(
                "food" => mb_convert_case($row["food"], MB_CASE_TITLE, "UTF-8"),
                "gramsPerCarb" => $row["gramsPerCarb"]
            );
        }
        return array(200, array("found" => (bool) $foodData, "data" => $foodData));
    }

    private function fetchRecord($food)
    {
        $stmt = $this->conn->prepare("SELECT * FROM foodcarbs WHERE food = ?");
        $stmt->bindValue(1, $food, SQLITE3_TEXT);
        $result = $stmt->execute();
        $record = $result->fetchArray(SQLITE3_ASSOC);
        return $record;
    }

    public function insertFood($food, $gramsPerCarb)
    {
        $ret = array();
        try {
            // Prepare SQL statement for insertion
            $stmt = $this->conn->prepare("INSERT INTO foodcarbs (food, gramsPerCarb) VALUES (?, ?)");
            $stmt->bindValue(1, $food, SQLITE3_TEXT);
            $stmt->bindValue(2, $gramsPerCarb, SQLITE3_FLOAT);
    
            // Execute the statement
            $result = $stmt->execute();
    
            // Close statement
            $stmt->close();
    
            // Check if the insertion was successful
            if ($result === false) {
                // Handle UNIQUE constraint violation
                $existingRecord = $this->fetchRecord($food);
                $ret = [409, ["success" => false, "message" => "pk violation", "foodUpper" => $food, "record" => $existingRecord]];
            } else {
                $ret = [201, ["success" => true]];
            }
        } catch (Exception $e) {
            // Handle other exceptions
            $ret = [500, ["success" => false, "message" => "server error ".$food." ".$e->getMessage()]];
        }
        return $ret;
    }

    public function updateFood($food, $gramsPerCarb)
    {
        $ret = array();
        try {
            // Prepare SQL statement for insertion
            $stmt = $this->conn->prepare("UPDATE foodcarbs SET gramsPerCarb = ? WHERE food = ?");
            $stmt->bindValue(1, $gramsPerCarb, SQLITE3_FLOAT);
            $stmt->bindValue(2, $food, SQLITE3_TEXT);
    
            // Execute the statement
            $stmt->execute();
    
            // Close statement
            $stmt->close();
            $ret = [204, []];
        } catch (Exception $e) {
            $ret = [500, ["success"=> false,"message"=>"server error"]];
        }
        return $ret;
    }

    public function closeConnection()
    {
        $this->conn->close();
    }
}