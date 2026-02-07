<?php
// api/config.php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json; charset=UTF-8");

$host = getenv('DB_HOST') ?: "localhost";
$db_name = getenv('DB_NAME') ?: "gradeflow";
$username = getenv('DB_USER') ?: "root";
$password = getenv('DB_PASSWORD') ?: "";

try {
    $conn = new PDO("mysql:host=" . $host . ";dbname=" . $db_name, $username, $password);
    $conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
}
catch (PDOException $exception) {
    echo json_encode(["error" => "Connection error: " . $exception->getMessage()]);
    exit();
}
?>
