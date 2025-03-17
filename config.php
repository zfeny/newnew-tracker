<?php
// Database connection configuration
$db_config = [
    'host'     => '00.00.00.00',      // 数据库服务器地址
    'dbname'   => 'nntracker',        // 数据库名称（已修正为同名数据库）
    'username' => 'nntracker',        // 用户名（与数据库同名）
    'password' => 'password',         // 密码
    'charset'  => 'utf8mb4'           // 支持完整Unicode的字符集
];

/**
 * Get database connection
 * @return PDO Database connection
 */
function getDbConnection() {
    global $db_config;
    
    try {
        $dsn = "mysql:host={$db_config['host']};dbname={$db_config['dbname']};charset={$db_config['charset']}";
        $options = [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false,
        ];
        
        return new PDO($dsn, $db_config['username'], $db_config['password'], $options);
    } catch (PDOException $e) {
        // Handle connection error
        http_response_code(500);
        echo json_encode(['error' => 'Database connection failed: ' . $e->getMessage()]);
        exit;
    }
}