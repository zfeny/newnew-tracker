<?php
// Start session
session_start();

// Check if user is already logged in
if (isset($_SESSION['authenticated']) && $_SESSION['authenticated'] === true) {
    // Redirect to index page
    header('Location: index.php');
    exit;
}
?>
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>登录 - 手艺生活记录</title>
    <link rel="stylesheet" href="css/style.css">
    <style>
        .login-container {
            max-width: 400px;
            margin: 50px auto;
        }
        
        .login-form {
            display: flex;
            flex-direction: column;
            padding: 20px;
        }
        
        .form-title {
            text-align: center;
            margin-bottom: 20px;
            color: var(--primary-color);
        }
        
        .form-group {
            margin-bottom: 15px;
        }
        
        .form-label {
            display: block;
            margin-bottom: 5px;
            font-weight: 500;
        }
        
        .form-input {
            width: 100%;
            padding: 10px;
            border: 1px solid #ddd;
            border-radius: 4px;
            font-size: 16px;
            box-sizing: border-box;
        }
        
        .login-button {
            background-color: var(--primary-color);
            color: white;
            border: none;
            border-radius: 4px;
            padding: 12px;
            font-size: 16px;
            cursor: pointer;
            margin-top: 10px;
        }
        
        .login-button:hover {
            background-color: #0c7cd5;
        }
        
        .toggle-form {
            text-align: center;
            margin-top: 15px;
            font-size: 14px;
        }
        
        .toggle-link {
            color: var(--primary-color);
            cursor: pointer;
            text-decoration: underline;
        }
        
        .error-message {
            color: #ff4d4f;
            margin-top: 10px;
            text-align: center;
            padding: 8px;
            background-color: rgba(255, 77, 79, 0.1);
            border-radius: 4px;
            display: none;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="glass-card login-container">
            <div class="login-form" id="loginForm">
                <h2 class="form-title">登录</h2>
                
                <div class="form-group">
                    <label for="loginUsername" class="form-label">用户名</label>
                    <input type="text" id="loginUsername" class="form-input" placeholder="请输入用户名">
                </div>
                
                <div class="form-group">
                    <label for="loginPassword" class="form-label">密码</label>
                    <input type="password" id="loginPassword" class="form-input" placeholder="请输入密码">
                </div>
                
                <button id="loginButton" class="login-button">登录</button>
                
                <div class="error-message" id="loginError"></div>
                
                <div class="toggle-form">
                    没有账号？<span class="toggle-link" id="showRegister">立即注册</span>
                </div>
            </div>
            
            <div class="login-form" id="registerForm" style="display: none;">
                <h2 class="form-title">注册</h2>
                
                <div class="form-group">
                    <label for="registerUsername" class="form-label">用户名</label>
                    <input type="text" id="registerUsername" class="form-input" placeholder="请输入用户名">
                </div>
                
                <div class="form-group">
                    <label for="registerPassword" class="form-label">密码</label>
                    <input type="password" id="registerPassword" class="form-input" placeholder="请输入密码">
                </div>
                
                <div class="form-group">
                    <label for="confirmPassword" class="form-label">确认密码</label>
                    <input type="password" id="confirmPassword" class="form-input" placeholder="请再次输入密码">
                </div>
                
                <button id="registerButton" class="login-button">注册</button>
                
                <div class="error-message" id="registerError"></div>
                
                <div class="toggle-form">
                    已有账号？<span class="toggle-link" id="showLogin">立即登录</span>
                </div>
            </div>
        </div>
    </div>
    
    <script>
        document.addEventListener('DOMContentLoaded', function() {
            // DOM elements
            const loginForm = document.getElementById('loginForm');
            const registerForm = document.getElementById('registerForm');
            const showRegister = document.getElementById('showRegister');
            const showLogin = document.getElementById('showLogin');
            const loginButton = document.getElementById('loginButton');
            const registerButton = document.getElementById('registerButton');
            const loginError = document.getElementById('loginError');
            const registerError = document.getElementById('registerError');
            
            // Toggle between login and register forms
            showRegister.addEventListener('click', () => {
                loginForm.style.display = 'none';
                registerForm.style.display = 'flex';
            });
            
            showLogin.addEventListener('click', () => {
                registerForm.style.display = 'none';
                loginForm.style.display = 'flex';
            });
            
            // Handle login
            loginButton.addEventListener('click', () => {
                const username = document.getElementById('loginUsername').value.trim();
                const password = document.getElementById('loginPassword').value;
                
                // Validate input
                if (!username || !password) {
                    showError(loginError, '请输入用户名和密码');
                    return;
                }
                
                // Send login request
                fetch('/api/auth.php', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        action: 'login',
                        username: username,
                        password: password
                    })
                })
                .then(response => response.json())
                .then(data => {
                    if (data.success) {
                        // Redirect to main page
                        window.location.href = 'index.php';
                    } else {
                        showError(loginError, data.error || '登录失败，请检查用户名和密码');
                    }
                })
                .catch(error => {
                    console.error('Error:', error);
                    showError(loginError, '登录过程中发生错误，请稍后再试');
                });
            });
            
            // Handle registration
            registerButton.addEventListener('click', () => {
                const username = document.getElementById('registerUsername').value.trim();
                const password = document.getElementById('registerPassword').value;
                const confirmPassword = document.getElementById('confirmPassword').value;
                
                // Validate input
                if (!username || !password || !confirmPassword) {
                    showError(registerError, '请填写所有字段');
                    return;
                }
                
                if (password !== confirmPassword) {
                    showError(registerError, '两次输入的密码不一致');
                    return;
                }
                
                if (username.length < 3) {
                    showError(registerError, '用户名至少需要3个字符');
                    return;
                }
                
                if (password.length < 6) {
                    showError(registerError, '密码至少需要6个字符');
                    return;
                }
                
                // Send registration request
                fetch('/api/auth.php', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        action: 'register',
                        username: username,
                        password: password
                    })
                })
                .then(response => response.json())
                .then(data => {
                    if (data.success) {
                        // Redirect to main page
                        window.location.href = 'index.php';
                    } else {
                        showError(registerError, data.error || '注册失败，请稍后再试');
                    }
                })
                .catch(error => {
                    console.error('Error:', error);
                    showError(registerError, '注册过程中发生错误，请稍后再试');
                });
            });
            
            // Show error message
            function showError(element, message) {
                element.textContent = message;
                element.style.display = 'block';
                
                // Hide error after 5 seconds
                setTimeout(() => {
                    element.style.display = 'none';
                }, 5000);
            }
        });
    </script>
</body>
</html>