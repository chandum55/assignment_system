<?php
// api/auth.php
require_once 'config.php';

$data = json_decode(file_get_contents("php://input"));

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $action = $_GET['action'] ?? '';

    if ($action === 'register') {
        if (!empty($data->name) && !empty($data->email) && !empty($data->password) && !empty($data->role) && !empty($data->department)) {
            $check = $conn->prepare("SELECT id FROM users WHERE email = ?");
            $check->execute([$data->email]);
            if ($check->rowCount() > 0) {
                echo json_encode(["error" => "User already exists"]);
                exit();
            }

            $query = "INSERT INTO users (name, email, password, role, department) VALUES (?, ?, ?, ?, ?)";
            $stmt = $conn->prepare($query);
            $hashed_password = password_hash($data->password, PASSWORD_DEFAULT);
            
            if ($stmt->execute([$data->name, $data->email, $hashed_password, $data->role, $data->department])) {
                $user_id = $conn->lastInsertId();
                echo json_encode([
                    "message" => "User registered successfully",
                    "user" => [
                        "id" => $user_id,
                        "name" => $data->name,
                        "email" => $data->email,
                        "role" => $data->role,
                        "department" => $data->department
                    ]
                ]);
            } else {
                echo json_encode(["error" => "Registration failed"]);
            }
        } else {
            echo json_encode(["error" => "Incomplete data"]);
        }
    } elseif ($action === 'login') {
        if (!empty($data->email) && !empty($data->password)) {
            $query = "SELECT * FROM users WHERE email = ?";
            $stmt = $conn->prepare($query);
            $stmt->execute([$data->email]);
            $user = $stmt->fetch(PDO::FETCH_ASSOC);

            if ($user && password_verify($data->password, $user['password'])) {
                unset($user['password']); // Don't return password
                echo json_encode(["user" => $user]);
            } else {
                echo json_encode(["error" => "Invalid email or password"]);
            }
        } else {
            echo json_encode(["error" => "Email and password required"]);
        }
    }
}
?>
