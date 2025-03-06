<?php

abstract class FoodDatabase
{
    protected $conn;

    abstract protected function connect();

    public function __construct()
    {
        $this->connect();
    }

    public function closeConnection()
    {
        $this->conn->close();
    }

    abstract public function fetchFood($searchQuery);
    abstract public function insertFood($food, $gramsPerCarb);
    abstract public function updateFood($food, $gramsPerCarb);
}
?>
