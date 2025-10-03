// Глобальные переменные
let currentUser = null;
let users = JSON.parse(localStorage.getItem('users')) || [];
let products = JSON.parse(localStorage.getItem('products')) || [];
let purchases = JSON.parse(localStorage.getItem('purchases')) || [];

// Инициализация
document.addEventListener('DOMContentLoaded', function() {
    checkAuthStatus();
    initializeDefaultData();
});

// Инициализация тестовых данных
function initializeDefaultData() {
    if (users.length === 0) {
        const adminUser = {
            id: 1,
            username: 'admin',
            fullName: 'Администратор Системы',
            password: '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', // password
            role: 'admin',
            balance: 100000,
            registrationDate: new Date().toISOString()
        };
        users.push(adminUser);
        saveUsers();
    }

    if (products.length === 0) {
        const sampleProducts = [
            {
                id: 1,
                name: 'iPhone 14 Pro',
                price: 99990,
                description: 'Новый смартфон от Apple',
                sellerId: 1,
                category: 'Электроника',
                image: '📱'
            },
            {
                id: 2,
                name: 'MacBook Air',
                price: 129990,
                description: 'Мощный ноутбук для работы',
                sellerId: 1,
                category: 'Электроника',
                image: '💻'
            }
        ];
        products.push(...sampleProducts);
        saveProducts();
    }
}

// Хеширование пароля (упрощенная версия)
async function hashPassword(password) {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hash = await crypto.subtle.digest('SHA-256', data);
    return Array.from(new Uint8Array(hash))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
}

// Проверка пароля
async function verifyPassword(password, hash) {
    const hashedPassword = await hashPassword(password);
    return hashedPassword === hash;
}

// Сохранение данных
function saveUsers() {
    localStorage.setItem('users', JSON.stringify(users));
}

function saveProducts() {
    localStorage.setItem('products', JSON.stringify(products));
}

function savePurchases() {
    localStorage.setItem('purchases', JSON.stringify(purchases));
}

// Авторизация
function checkAuthStatus() {
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
        currentUser = JSON.parse(savedUser);
        showMainApp();
    } else {
        showAuth();
    }
}

// Показать формы авторизации
function showAuth() {
    document.getElementById('authContainer').classList.remove('hidden');
    document.getElementById('mainContainer').classList.add('hidden');
    document.getElementById('header').classList.add('hidden');
}

// Показать основное приложение
function showMainApp() {
    document.getElementById('authContainer').classList.add('hidden');
    document.getElementById('mainContainer').classList.remove('hidden');
    document.getElementById('header').classList.remove('hidden');
    
    updateUserInterface();
    showSection('dashboard');
}

// Переключение форм авторизации
function showAuthForm(formType) {
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    const loginBtn = document.querySelector('.toggle-btn:nth-child(1)');
    const registerBtn = document.querySelector('.toggle-btn:nth-child(2)');

    if (formType === 'login') {
        loginForm.classList.remove('hidden');
        registerForm.classList.add('hidden');
        loginBtn.classList.add('active');
        registerBtn.classList.remove('active');
    } else {
        loginForm.classList.add('hidden');
        registerForm.classList.remove('hidden');
        loginBtn.classList.remove('active');
        registerBtn.classList.add('active');
    }
    clearAuthMessage();
}

// Обработка входа
async function handleLogin(event) {
    event.preventDefault();
    
    const username = document.getElementById('loginUsername').value;
    const password = document.getElementById('loginPassword').value;
    
    const user = users.find(u => u.username === username);
    
    if (user && await verifyPassword(password, user.password)) {
        currentUser = user;
        localStorage.setItem('currentUser', JSON.stringify(user));
        showMainApp();
        showAuthMessage('Вход выполнен успешно!', 'success');
    } else {
        showAuthMessage('Неверное имя пользователя или пароль', 'error');
    }
}

// Обработка регистрации
async function handleRegister(event) {
    event.preventDefault();
    
    const username = document.getElementById('regUsername').value;
    const fullName = document.getElementById('regFullName').value;
    const password = document.getElementById('regPassword').value;
    const role = document.getElementById('regRole').value;
    
    if (users.find(u => u.username === username)) {
        showAuthMessage('Пользователь с таким именем уже существует', 'error');
        return;
    }
    
    const newUser = {
        id: users.length > 0 ? Math.max(...users.map(u => u.id)) + 1 : 1,
        username: username,
        fullName: fullName,
        password: await hashPassword(password),
        role: role,
        balance: role === 'seller' ? 0 : 10000,
        registrationDate: new Date().toISOString()
    };
    
    users.push(newUser);
    saveUsers();
    
    showAuthMessage('Регистрация успешна! Теперь вы можете войти.', 'success');
    showAuthForm('login');
    document.getElementById('registerForm').reset();
}

// Выход из системы
function logout() {
    currentUser = null;
    localStorage.removeItem('currentUser');
    showAuth();
    document.getElementById('loginForm').reset();
}

// Обновление интерфейса пользователя
function updateUserInterface() {
    if (!currentUser) return;
    
    document.getElementById('userWelcome').textContent = `Привет, ${currentUser.username}!`;
    document.getElementById('userRole').textContent = getRoleDisplayName(currentUser.role);
    document.getElementById('userRole').className = `role-badge role-${currentUser.role}`;
    
    document.getElementById('dashboardUsername').textContent = currentUser.username;
    document.getElementById('statRole').textContent = getRoleDisplayName(currentUser.role);
    document.getElementById('statBalance').textContent = `${currentUser.balance} ₽`;
    
    // Обновление статистики
    const userPurchases = purchases.filter(p => p.userId === currentUser.id);
    const userSales = purchases.filter(p => {
        const product = products.find(prod => prod.id === p.productId);
        return product && product.sellerId === currentUser.id;
    });
    
    document.getElementById('statPurchases').textContent = userPurchases.length;
    document.getElementById('statSales').textContent = userSales.length;
    
    // Показ/скрытие элементов в зависимости от роли
    const isSeller = currentUser.role === 'seller' || currentUser.role === 'admin';
    const isAdmin = currentUser.role === 'admin';
    
    document.getElementById('salesMenu').style.display = isSeller ? 'block' : 'none';
    document.getElementById('adminMenu').style.display = isAdmin ? 'block' : 'none';
    document.getElementById('adminBtn').style.display = isAdmin ? 'block' : 'none';
    document.getElementById('addProductBtn').style.display = isSeller ? 'block' : 'none';
    
    // Обновление профиля
    updateProfileSection();
    
    // Загрузка данных
    loadProducts();
    loadPurchaseHistory();
    if (isAdmin) {
        loadAdminData();
    }
}

// Получение отображаемого имени роли
function getRoleDisplayName(role) {
    const roles = {
        'client': 'Клиент',
        'seller': 'Продавец',
        'admin': 'Администратор'
    };
    return roles[role] || role;
}

// Переключение секций
function showSection(sectionName) {
    // Скрыть все секции
    document.querySelectorAll('.section').forEach(section => {
        section.classList.remove('active');
    });
    
    // Скрыть активные кнопки навигации
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    document.querySelectorAll('.sidebar-menu a').forEach(link => {
        link.classList.remove('active');
    });
    
    // Показать выбранную секцию
    document.getElementById(sectionName + 'Section').classList.add('active');
    
    // Активировать соответствующую кнопку навигации
    const activeNavBtn = Array.from(document.querySelectorAll('.nav-btn')).find(btn => 
        btn.textContent.includes(getSectionDisplayName(sectionName))
    );
    if (activeNavBtn) {
        activeNavBtn.classList.add('active');
    }
}

function getSectionDisplayName(section) {
    const sections = {
        'dashboard': 'Главная',
        'products': 'Товары',
        'purchases': 'Мои покупки',
        'profile': 'Профиль',
        'admin': 'Админ-панель'
    };
    return sections[section] || section;
}

// Загрузка товаров
function loadProducts() {
    const productsGrid = document.getElementById('productsGrid');
    productsGrid.innerHTML = '';
    
    products.forEach(product => {
        const seller = users.find(u => u.id === product.sellerId);
        const productCard = `
            <div class="product-card">
                <div style="font-size: 2rem; text-align: center; margin-bottom: 10px;">${product.image}</div>
                <h3>${product.name}</h3>
                <p>${product.description}</p>
                <div class="product-price">${product.price} ₽</div>
                <p><small>Категория: ${product.category}</small></p>
                <p><small>Продавец: ${seller ? seller.fullName : 'Неизвестен'}</small></p>
                ${currentUser && currentUser.role !== 'seller' ? `
                    <button class="btn btn-primary" onclick="buyProduct(${product.id})">Купить</button>
                ` : ''}
            </div>
        `;
        productsGrid.innerHTML += productCard;
    });
}

// Покупка товара
function buyProduct(productId) {
    const product = products.find(p => p.id === productId);
    if (!product) return;
    
    if (currentUser.balance < product.price) {
        alert('Недостаточно средств на балансе!');
        return;
    }
    
    // Создание покупки
    const purchase = {
        id: purchases.length > 0 ? Math.max(...purchases.map(p => p.id)) + 1 : 1,
        userId: currentUser.id,
        productId: productId,
        quantity: 1,
        totalPrice: product.price,
        purchaseDate: new Date().toISOString(),
        status: 'completed'
    };
    
    purchases.push(purchase);
    savePurchases();
    
    // Обновление балансов
    currentUser.balance -= product.price;
    const seller = users.find(u => u.id === product.sellerId);
    if (seller) {
        seller.balance += product.price;
    }
    
    saveUsers();
    localStorage.setItem('currentUser', JSON.stringify(currentUser));
    
    updateUserInterface();
    alert('Покупка совершена успешно!');
}

// Загрузка истории покупок
function loadPurchaseHistory() {
    const purchaseHistory = document.getElementById('purchaseHistory');
    purchaseHistory.innerHTML = '';
    
    const userPurchases = purchases.filter(p => p.userId === currentUser.id);
    
    if (userPurchases.length === 0) {
        purchaseHistory.innerHTML = '<p>У вас пока нет покупок.</p>';
        return;
    }
    
    userPurchases.forEach(purchase => {
        const product = products.find(p => p.id === purchase.productId);
        if (!product) return;
        
        const purchaseItem = `
            <div class="purchase-item">
                <div class="purchase-info">
                    <div>
                        <h4>${product.name}</h4>
                        <p>${product.description}</p>
                    </div>
                    <div>
                        <div class="product-price">${purchase.totalPrice} ₽</div>
                        <span class="purchase-status status-${purchase.status}">
                            ${getStatusDisplayName(purchase.status)}
                        </span>
                    </div>
                </div>
                <div>
                    <small>${new Date(purchase.purchaseDate).toLocaleDateString()}</small>
                </div>
            </div>
        `;
        purchaseHistory.innerHTML += purchaseItem;
    });
}

function getStatusDisplayName(status) {
    const statuses = {
        'completed': 'Завершено',
        'pending': 'В обработке',
        'cancelled': 'Отменено'
    };
    return statuses[status] || status;
}

// Обновление раздела профиля
function updateProfileSection() {
    document.getElementById('profileUsername').textContent = currentUser.username;
    document.getElementById('profileFullName').textContent = currentUser.fullName;
    document.getElementById('profileRole').textContent = getRoleDisplayName(currentUser.role);
    document.getElementById('profileRegDate').textContent = new Date(currentUser.registrationDate).toLocaleDateString();
}

// Загрузка данных для админ-панели
function loadAdminData() {
    document.getElementById('totalUsers').textContent = users.length;
    document.getElementById('totalProducts').textContent = products.length;
    document.getElementById('totalPurchases').textContent = purchases.length;
    
    const usersTable = document.getElementById('usersTable');
    usersTable.innerHTML = '';
    
    users.forEach(user => {
        const userRow = `
            <tr>
                <td>${user.id}</td>
                <td>${user.username}</td>
                <td>${user.fullName}</td>
                <td><span class="role-badge role-${user.role}">${getRoleDisplayName(user.role)}</span></td>
                <td>${new Date(user.registrationDate).toLocaleDateString()}</td>
                <td>
                    <button class="btn" onclick="editUser(${user.id})">Редактировать</button>
                    ${user.id !== currentUser.id ? `<button class="btn" onclick="deleteUser(${user.id})">Удалить</button>` : ''}
                </td>
            </tr>
        `;
        usersTable.innerHTML += userRow;
    });
}

// Вспомогательные функции для сообщений
function showAuthMessage(message, type) {
    const messageDiv = document.getElementById('authMessage');
    messageDiv.innerHTML = `<div class="message ${type}">${message}</div>`;
}

function clearAuthMessage() {
    document.getElementById('authMessage').innerHTML = '';
}

// Функции администратора
function editUser(userId) {
    const user = users.find(u => u.id === userId);
    if (!user) return;
    
    const newRole = prompt('Введите новую роль (client/seller/admin):', user.role);
    if (newRole && ['client', 'seller', 'admin'].includes(newRole)) {
        user.role = newRole;
        saveUsers();
        loadAdminData();
        alert('Роль пользователя обновлена!');
    }
}

function deleteUser(userId) {
    if (confirm('Вы уверены, что хотите удалить этого пользователя?')) {
        users = users.filter(u => u.id !== userId);
        saveUsers();
        loadAdminData();
        alert('Пользователь удален!');
    }
}