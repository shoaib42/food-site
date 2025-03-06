<?php
// index.php

require_once "../session_check.php";

$htmlContent = file_get_contents('index.html');

echo $htmlContent;

?>