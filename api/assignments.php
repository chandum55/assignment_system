<?php
// api/assignments.php
require_once 'config.php';

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    $department = $_GET['department'] ?? null;
    $faculty_id = $_GET['faculty_id'] ?? null;
    $id = $_GET['id'] ?? null;

    if ($id) {
        $stmt = $conn->prepare("SELECT * FROM assignments WHERE id = ?");
        $stmt->execute([$id]);
        echo json_encode($stmt->fetch(PDO::FETCH_ASSOC));
        exit();
    }
    elseif ($faculty_id) {
        $stmt = $conn->prepare("SELECT * FROM assignments WHERE faculty_id = ?");
        $stmt->execute([$faculty_id]);
    }
    elseif ($department) {
        $stmt = $conn->prepare("SELECT * FROM assignments WHERE department = ?");
        $stmt->execute([$department]);
    }
    else {
        $stmt = $conn->query("SELECT * FROM assignments");
    }
    echo json_encode($stmt->fetchAll(PDO::FETCH_ASSOC));

}
elseif ($method === 'POST') {
    // Note: This expects Multipart/form-data for file uploads
    $title = $_POST['title'] ?? null;
    $deadline = $_POST['deadline'] ?? null;
    $faculty_id = $_POST['faculty_id'] ?? null;
    $department = $_POST['department'] ?? null;

    if (isset($_FILES['question_file'])) {
        $file = $_FILES['question_file'];
        $filename = time() . '_' . $file['name'];
        $upload_path = '../uploads/' . $filename;

        if (move_uploaded_file($file['tmp_name'], $upload_path)) {
            $stmt = $conn->prepare("INSERT INTO assignments (title, question_file, deadline, faculty_id, department) VALUES (?, ?, ?, ?, ?)");
            if ($stmt->execute([$title, $filename, $deadline, $faculty_id, $department])) {
                echo json_encode(["message" => "Assignment created successfully"]);
            }
            else {
                echo json_encode(["error" => "Database save failed"]);
            }
        }
        else {
            echo json_encode(["error" => "File upload failed"]);
        }
    }
    else {
        echo json_encode(["error" => "Question file required"]);
    }
}
?>
