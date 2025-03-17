<?php
// Include database configuration
require_once '../config.php';

// Set headers for JSON responses
header('Content-Type: application/json');

// Get database connection
$db = getDbConnection();

// Determine request method
$method = $_SERVER['REQUEST_METHOD'];

// Process based on request method
switch ($method) {
    case 'POST':
        // Handle login or registration based on action parameter
        $data = json_decode(file_get_contents('php://input'), true);
        $action = isset($data['action']) ? $data['action'] : '';
        
        if ($action === 'login') {
            handleLogin($db, $data);
        } elseif ($action === 'register') {
            handleRegistration($db, $data);
        } else {
            http_response_code(400);
            echo json_encode(['error' => 'Invalid action parameter']);
        }
        break;
        
    case 'GET':
        // Check session status
        checkAuth();
        break;
        
    case 'DELETE':
        // Handle logout
        handleLogout();
        break;
        
    default:
        http_response_code(405); // Method not allowed
        echo json_encode(['error' => 'Method not allowed']);
        break;
}

/**
 * Handle user login
 */
function handleLogin($db, $data) {
    // Validate input
    if (!isset($data['username']) || !isset($data['password'])) {
        http_response_code(400);
        echo json_encode(['error' => 'Missing username or password']);
        return;
    }
    
    $username = $data['username'];
    $password = $data['password'];
    
    try {
        // Get user from database
        $stmt = $db->prepare("SELECT user_id, username, password_hash FROM users WHERE username = :username");
        $stmt->execute([':username' => $username]);
        $user = $stmt->fetch();
        
        if (!$user) {
            http_response_code(401);
            echo json_encode(['error' => 'Invalid username or password']);
            return;
        }
        
        // Verify password
        if (password_verify($password, $user['password_hash'])) {
            // Start session if not already started
            if (session_status() === PHP_SESSION_NONE) {
                session_start();
            }
            
            // Store user information in session
            $_SESSION['user_id'] = $user['user_id'];
            $_SESSION['username'] = $user['username'];
            $_SESSION['authenticated'] = true;
            
            echo json_encode([
                'success' => true,
                'message' => 'Login successful',
                'user' => [
                    'id' => $user['user_id'],
                    'username' => $user['username']
                ]
            ]);
        } else {
            http_response_code(401);
            echo json_encode(['error' => 'Invalid username or password']);
        }
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['error' => 'Database error: ' . $e->getMessage()]);
    }
}

/**
 * Handle user registration
 */
function handleRegistration($db, $data) {
    // Validate input
    if (!isset($data['username']) || !isset($data['password'])) {
        http_response_code(400);
        echo json_encode(['error' => 'Missing username or password']);
        return;
    }
    
    $username = $data['username'];
    $password = $data['password'];
    
    // Validate username (at least 3 characters, alphanumeric)
    if (strlen($username) < 3 || !preg_match('/^[a-zA-Z0-9_]+$/', $username)) {
        http_response_code(400);
        echo json_encode(['error' => 'Username must be at least 3 characters and contain only letters, numbers, and underscores']);
        return;
    }
    
    // Validate password (at least 6 characters)
    if (strlen($password) < 6) {
        http_response_code(400);
        echo json_encode(['error' => 'Password must be at least 6 characters']);
        return;
    }
    
    try {
        // Check if username already exists
        $stmt = $db->prepare("SELECT COUNT(*) AS count FROM users WHERE username = :username");
        $stmt->execute([':username' => $username]);
        $result = $stmt->fetch();
        
        if ($result['count'] > 0) {
            http_response_code(409); // Conflict
            echo json_encode(['error' => 'Username already exists']);
            return;
        }
        
        // Hash the password
        $passwordHash = password_hash($password, PASSWORD_DEFAULT);
        
        // Insert new user
        $stmt = $db->prepare("INSERT INTO users (username, password_hash) VALUES (:username, :password_hash)");
        $result = $stmt->execute([
            ':username' => $username,
            ':password_hash' => $passwordHash
        ]);
        
        if ($result) {
            $userId = $db->lastInsertId();
            
            // Start session
            if (session_status() === PHP_SESSION_NONE) {
                session_start();
            }
            
            // Store user information in session
            $_SESSION['user_id'] = $userId;
            $_SESSION['username'] = $username;
            $_SESSION['authenticated'] = true;
            
            echo json_encode([
                'success' => true,
                'message' => 'Registration successful',
                'user' => [
                    'id' => $userId,
                    'username' => $username
                ]
            ]);
        } else {
            http_response_code(500);
            echo json_encode(['error' => 'Failed to register user']);
        }
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['error' => 'Database error: ' . $e->getMessage()]);
    }
}

/**
 * Check if user is authenticated
 */
function checkAuth() {
    // Start session if not already started
    if (session_status() === PHP_SESSION_NONE) {
        session_start();
    }
    
    if (isset($_SESSION['authenticated']) && $_SESSION['authenticated'] === true) {
        echo json_encode([
            'authenticated' => true,
            'user' => [
                'id' => $_SESSION['user_id'],
                'username' => $_SESSION['username']
            ]
        ]);
    } else {
        echo json_encode(['authenticated' => false]);
    }
}

/**
 * Handle user logout
 */
function handleLogout() {
    // Start session if not already started
    if (session_status() === PHP_SESSION_NONE) {
        session_start();
    }
    
    // Destroy session
    $_SESSION = [];
    session_destroy();
    
    echo json_encode([
        'success' => true,
        'message' => 'Logout successful'
    ]);
}