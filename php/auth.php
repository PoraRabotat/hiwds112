<?php
require_once 'config.php';

$action = $_GET['action'] ?? '';

switch ($action) {
    case 'register':
        registerUser();
        break;
    case 'login':
        loginUser();
        break;
    default:
        echo json_encode(['success' => false, 'message' => 'Неизвестное действие']);
}

function registerUser() {
    global $pdo;
    
    $username = trim($_POST['username'] ?? '');
    $password = $_POST['password'] ?? '';
    $confirm_password = $_POST['confirm_password'] ?? '';
    $full_name = trim($_POST['full_name'] ?? '');
    $role = $_POST['role'] ?? 'client';
    
    // Валидация
    if (empty($username) || empty($password) || empty($full_name)) {
        echo json_encode(['success' => false, 'message' => 'Все поля обязательны для заполнения']);
        return;
    }
    
    if ($password !== $confirm_password) {
        echo json_encode(['success' => false, 'message' => 'Пароли не совпадают']);
        return;
    }
    
    if (strlen($password) < 6) {
        echo json_encode(['success' => false, 'message' => 'Пароль должен содержать минимум 6 символов']);
        return;
    }
    
    if (strlen($username) < 3 || strlen($username) > 20) {
        echo json_encode(['success' => false, 'message' => 'Имя пользователя должно быть от 3 до 20 символов']);
        return;
    }
    
    if (!in_array($role, ['client', 'seller'])) {
        echo json_encode(['success' => false, 'message' => 'Неверная роль']);
        return;
    }
    
    try {
        // Проверка существующего пользователя
        $stmt = $pdo->prepare("SELECT id FROM users WHERE username = ?");
        $stmt->execute([$username]);
        
        if ($stmt->rowCount() > 0) {
            echo json_encode(['success' => false, 'message' => 'Пользователь с таким именем уже существует']);
            return;
        }
        
        // Хеширование пароля
        $hashed_password = hashPassword($password);
        
        // Сохранение пользователя
        $stmt = $pdo->prepare("INSERT INTO users (username, password, full_name, role) VALUES (?, ?, ?, ?)");
        $stmt->execute([$username, $hashed_password, $full_name, $role]);
        
        echo json_encode(['success' => true, 'message' => 'Регистрация успешна! Теперь вы можете войти.']);
        
    } catch(PDOException $e) {
        error_log("Registration error: " . $e->getMessage());
        echo json_encode(['success' => false, 'message' => 'Ошибка базы данных']);
    }
}

function loginUser() {
    global $pdo;
    
    $username = trim($_POST['username'] ?? '');
    $password = $_POST['password'] ?? '';
    
    if (empty($username) || empty($password)) {
        echo json_encode(['success' => false, 'message' => 'Все поля обязательны для заполнения']);
        return;
    }
    
    try {
        // Поиск пользователя
        $stmt = $pdo->prepare("SELECT id, username, password, role, full_name FROM users WHERE username = ?");
        $stmt->execute([$username]);
        
        if ($stmt->rowCount() == 1) {
            $user = $stmt->fetch();
            
            // Проверка пароля
            if (verifyPassword($password, $user['password'])) {
                $_SESSION['user_id'] = $user['id'];
                $_SESSION['username'] = $user['username'];
                $_SESSION['user_role'] = $user['role'];
                $_SESSION['full_name'] = $user['full_name'];
                $_SESSION['login_time'] = time();
                
                echo json_encode(['success' => true, 'message' => 'Вход успешен!']);
            } else {
                echo json_encode(['success' => false, 'message' => 'Неверный пароль']);
            }
        } else {
            echo json_encode(['success' => false, 'message' => 'Пользователь не найден']);
        }
    } catch(PDOException $e) {
        error_log("Login error: " . $e->getMessage());
        echo json_encode(['success' => false, 'message' => 'Ошибка базы данных']);
    }
}
?>