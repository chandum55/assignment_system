<?php
// api/submissions.php
require_once 'config.php';

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    $assignment_id = $_GET['assignment_id'] ?? null;
    $student_id = $_GET['student_id'] ?? null;

    if ($assignment_id) {
        // Faculty viewing submissions for an assignment
        $stmt = $conn->prepare("SELECT s.*, u.name as student_name FROM submissions s JOIN users u ON s.student_id = u.id WHERE s.assignment_id = ?");
        $stmt->execute([$assignment_id]);
    }
    elseif ($student_id) {
        // Student viewing their own submissions
        $stmt = $conn->prepare("SELECT * FROM submissions WHERE student_id = ?");
        $stmt->execute([$student_id]);
    }
    echo json_encode($stmt->fetchAll(PDO::FETCH_ASSOC));

}
elseif ($method === 'POST') {
    $action = $_GET['action'] ?? 'submit';

    if ($action === 'submit') {
        $assignment_id = $_POST['assignment_id'] ?? null;
        $student_id = $_POST['student_id'] ?? null;

        if (isset($_FILES['file'])) {
            $file = $_FILES['file'];
            $filename = time() . '_' . $file['name'];
            $upload_path = '../uploads/' . $filename;

            if (move_uploaded_file($file['tmp_name'], $upload_path)) {
                $stmt = $conn->prepare("INSERT INTO submissions (assignment_id, student_id, file_path, file_name) VALUES (?, ?, ?, ?)");
                if ($stmt->execute([$assignment_id, $student_id, $filename, $file['name']])) {
                    echo json_encode(["message" => "Assignment submitted successfully"]);
                }
                else {
                    echo json_encode(["error" => "Database save failed"]);
                }
            }
            else {
                echo json_encode(["error" => "File upload failed"]);
            }
        }
    }
    elseif ($action === 'grade') {
        $data = json_decode(file_get_contents("php://input"));
        if (!empty($data->id) && !empty($data->grade)) {
            $stmt = $conn->prepare("UPDATE submissions SET grade = ?, feedback = ? WHERE id = ?");
            if ($stmt->execute([$data->grade, $data->feedback, $data->id])) {
                echo json_encode(["message" => "Grade submitted successfully"]);
            }
            else {
                echo json_encode(["error" => "Grading failed"]);
            }
        }
    }
}
?>
