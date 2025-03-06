<?php

$dbtype = "sqlite";
$databaseConfigs = array(
    // sample mysql conf, change it accordingly
    'mysql' => array(
        'host' => '192.168.0.101',
        'user' => 'food',
        'password' => 'mypassword',
        'name' => 'carbsimple'
    ),
    'sqlite' => array(
        'location' => 'sqdblite', // You really don't need to change this
        'name' => 'carbsimple'
    )
);
$dbconf = $databaseConfigs[$dbtype];

