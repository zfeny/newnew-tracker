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
        exportRecords($db);
        break;
    case 'POST':
        importRecords($db);
        break;
    default:
        http_response_code(405); // Method not allowed
        echo json_encode(['error' => 'Method not allowed']);
        break;
}

/**
 * Export all records for a user
 */
function exportRecords($db) {
    $user_id = $_SESSION['user_id']; // Get user ID from session
    
    try {
        $stmt = $db->prepare("SELECT record_id, date, duration, notes FROM records WHERE user_id = :user_id ORDER BY date");
        $stmt->execute([':user_id' => $user_id]);
        $records = $stmt->fetchAll();
        
        // Format the data to match the original structure
        $formattedRecords = [];
        foreach ($records as $record) {
            $formattedRecords[] = [
                'id' => (int)$record['record_id'],
                'date' => $record['date'],
                'duration' => (float)$record['duration'],
                'notes' => $record['notes']
            ];
        }
        
        echo json_encode($formattedRecords);
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['error' => 'Failed to export records: ' . $e->getMessage()]);
    }
}

/**
 * Import records for a user
 */
function importRecords($db) {
    // Get request body
    $records = json_decode(file_get_contents('php://input'), true);
    
    if (!is_array($records)) {
        http_response_code(400);
        echo json_encode(['error' => 'Invalid data format']);
        return;
    }
    
    $user_id = $_SESSION['user_id']; // Get user ID from session
    
    try {
        // Begin transaction
        $db->beginTransaction();
        
        // Delete existing records for this user
        $stmt = $db->prepare("DELETE FROM records WHERE user_id = :user_id");
        $stmt->execute([':user_id' => $user_id]);
        
        // Insert new records
        $stmt = $db->prepare("INSERT INTO records (user_id, date, duration, notes) VALUES (:user_id, :date, :duration, :notes)");
        
        $counter = 0;
        foreach ($records as $record) {
            // Validate record has required fields
            if (!isset($record['date']) || !isset($record['duration'])) {
                continue;
            }
            
            // Format the date to be MySQL compatible
            try {
                $dateObj = new DateTime($record['date']);
                $formattedDate = $dateObj->format('Y-m-d H:i:s');
            } catch (Exception $e) {
                // Skip records with invalid dates
                continue;
            }
            
            $stmt->execute([
                ':user_id' => $user_id,
                ':date' => $formattedDate,
                ':duration' => (float)$record['duration'],
                ':notes' => isset($record['notes']) ? $record['notes'] : ''
            ]);
            
            $counter++;
        }
        
        // Commit transaction
        $db->commit();
        
        echo json_encode([
            'success' => true,
            'message' => 'Data imported successfully',
            'count' => $counter
        ]);
    } catch (PDOException $e) {
        // Roll back transaction on error
        $db->rollBack();
        
        http_response_code(500);
        echo json_encode(['error' => 'Failed to import records: ' . $e->getMessage()]);
    }
}