<?php
// Include database configuration
require_once '../config.php';

// Start session
session_start();

// Check if user is authenticated
if (!isset($_SESSION['authenticated']) || $_SESSION['authenticated'] !== true) {
    header('Content-Type: application/json');
    http_response_code(401);
    echo json_encode(['error' => 'Unauthorized access']);
    exit;
}

// Set headers for JSON responses
header('Content-Type: application/json');

// Get database connection
$db = getDbConnection();

// Determine request method
$method = $_SERVER['REQUEST_METHOD'];

// Process based on request method
switch ($method) {
    case 'GET':
        getRecords($db);
        break;
    case 'POST':
        addRecord($db);
        break;
    case 'DELETE':
        deleteRecord($db);
        break;
    default:
        http_response_code(405); // Method not allowed
        echo json_encode(['error' => 'Method not allowed']);
        break;
}

/**
 * Get records with optional filtering
 */
function getRecords($db) {
    $user_id = $_SESSION['user_id']; // Get user ID from session
    
    // Initialize base query
    $query = "SELECT * FROM records WHERE user_id = :user_id";
    $params = [':user_id' => $user_id];
    
    // Apply filters if available
    if (isset($_GET['filter_type'])) {
        $filter_type = $_GET['filter_type'];
        
        if ($filter_type === 'month' && isset($_GET['year']) && isset($_GET['month'])) {
            $year = (int)$_GET['year'];
            $month = (int)$_GET['month'];
            
            // Filter by specific month and year
            $query .= " AND YEAR(date) = :year AND MONTH(date) = :month";
            $params[':year'] = $year;
            $params[':month'] = $month + 1; // JavaScript months are 0-based, MySQL is 1-based
        } 
        elseif ($filter_type === 'year' && isset($_GET['year'])) {
            $year = (int)$_GET['year'];
            
            // Filter by specific year
            $query .= " AND YEAR(date) = :year";
            $params[':year'] = $year;
        }
    }
    
    // Order by date (newest first)
    $query .= " ORDER BY date DESC";
    
    // Execute query
    try {
        $stmt = $db->prepare($query);
        $stmt->execute($params);
        $records = $stmt->fetchAll();
        
        echo json_encode(['success' => true, 'records' => $records]);
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['error' => 'Failed to fetch records: ' . $e->getMessage()]);
    }
}

/**
 * Add a new record
 */
function addRecord($db) {
    // Get request body
    $data = json_decode(file_get_contents('php://input'), true);
    
    if (!isset($data['date']) || !isset($data['duration'])) {
        http_response_code(400);
        echo json_encode(['error' => 'Missing required fields']);
        return;
    }
    
    $user_id = $_SESSION['user_id']; // Get user ID from session
    
    // Format the date to be MySQL compatible
    $date = $data['date'];
    
    // Convert ISO format to MySQL DATETIME format
    try {
        $dateObj = new DateTime($date);
        $formattedDate = $dateObj->format('Y-m-d H:i:s');
    } catch (Exception $e) {
        http_response_code(400);
        echo json_encode(['error' => 'Invalid date format']);
        return;
    }
    
    $duration = (float)$data['duration'];
    $notes = isset($data['notes']) ? $data['notes'] : '';
    
    // Insert the record
    try {
        $stmt = $db->prepare("INSERT INTO records (user_id, date, duration, notes) VALUES (:user_id, :date, :duration, :notes)");
        $result = $stmt->execute([
            ':user_id' => $user_id,
            ':date' => $formattedDate,
            ':duration' => $duration,
            ':notes' => $notes
        ]);
        
        if ($result) {
            $record_id = $db->lastInsertId();
            echo json_encode([
                'success' => true, 
                'message' => 'Record added successfully',
                'record_id' => $record_id
            ]);
        } else {
            http_response_code(500);
            echo json_encode(['error' => 'Failed to add record']);
        }
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['error' => 'Database error: ' . $e->getMessage()]);
    }
}

/**
 * Delete a record
 */
function deleteRecord($db) {
    $record_id = isset($_GET['id']) ? (int)$_GET['id'] : null;
    
    if (!$record_id) {
        http_response_code(400);
        echo json_encode(['error' => 'Record ID is required']);
        return;
    }
    
    $user_id = $_SESSION['user_id']; // Get user ID from session
    
    // Delete the record
    try {
        $stmt = $db->prepare("DELETE FROM records WHERE record_id = :record_id AND user_id = :user_id");
        $result = $stmt->execute([
            ':record_id' => $record_id,
            ':user_id' => $user_id
        ]);
        
        if ($result && $stmt->rowCount() > 0) {
            echo json_encode([
                'success' => true,
                'message' => 'Record deleted successfully'
            ]);
        } else {
            http_response_code(404);
            echo json_encode(['error' => 'Record not found or already deleted']);
        }
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['error' => 'Database error: ' . $e->getMessage()]);
    }
}