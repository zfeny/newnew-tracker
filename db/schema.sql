-- 删除历史遗留数据库（根据需求可选）
DROP DATABASE IF EXISTS `handiwork_tracker`;

-- 创建指定字符集的数据库
CREATE DATABASE IF NOT EXISTS `nntracker` 
CHARACTER SET utf8mb4 
COLLATE utf8mb4_unicode_ci;

USE `nntracker`;

-- 用户表（增强版）
CREATE TABLE IF NOT EXISTS `users` (
    `user_id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `username` VARCHAR(50) UNIQUE NOT NULL,
    `password_hash` VARCHAR(255) NOT NULL,
    `email` VARCHAR(100) UNIQUE COMMENT '预留邮箱字段',
    `is_active` BOOLEAN DEFAULT 1 COMMENT '账户启用状态',
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- 核心数据表（优化索引）
CREATE TABLE IF NOT EXISTS `records` (
    `record_id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `user_id` INT UNSIGNED NOT NULL DEFAULT 1,
    `date` DATETIME NOT NULL,
    `duration` DECIMAL(10,2) NOT NULL COMMENT '单位：小时（精度更高）',
    `notes` TEXT,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX `idx_user_date` (`user_id`, `date`),  -- 复合索引加速查询
    CONSTRAINT `fk_user_records` 
        FOREIGN KEY (`user_id`) 
        REFERENCES `users`(`user_id`)
        ON DELETE CASCADE 
        ON UPDATE RESTRICT
) ENGINE=InnoDB ROW_FORMAT=COMPRESSED;

-- 插入默认用户（安全增强）
INSERT INTO `users` (`user_id`, `username`, `password_hash`) 
VALUES (
    1, 
    'default', 
    '$argon2i$v=19$m=65536,t=4,p=1$d0ZqLzRlSGwuTjNqWTQwRA$4l6lWMM6QD7FgV7GoXjGjqVp6lPv0bf6Xe4cVjZ4hX4'  -- 密码仍为 'password'，但使用更安全的 argon2 算法
) 
ON DUPLICATE KEY UPDATE 
    username = VALUES(username),
    password_hash = VALUES(password_hash);

-- 授予 nntracker 用户权限（冗余操作，确保权限正确）
GRANT SELECT, INSERT, UPDATE, DELETE, EXECUTE 
ON `nntracker`.* 
TO 'nntracker'@'%';

FLUSH PRIVILEGES;