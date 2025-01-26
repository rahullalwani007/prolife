// Simple user storage using localStorage
const getUsers = () => JSON.parse(localStorage.getItem('users')) || [];

// Signup functionality
const signupForm = document.getElementById('signupForm');
if (signupForm) {
    signupForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const fullname = document.getElementById('fullname').value;
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        const confirmPassword = document.getElementById('confirmPassword').value;

        if (password !== confirmPassword) {
            alert('Passwords do not match!');
            return;
        }

        const users = getUsers();
        // Check if user already exists
        if (users.find(user => user.email === email)) {
            alert('User already exists!');
            return;
        }

        // Add new user
        const newUser = { fullname, email, password };
        users.push(newUser);
        localStorage.setItem('users', JSON.stringify(users));
        
        alert('Registration successful! Please login.');
        window.location.href = 'login.html';
    });
}

// Login functionality
const loginForm = document.getElementById('loginForm');
if (loginForm) {
    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;

        // Get updated users list from localStorage
        const users = getUsers();
        
        // Debug log to check stored users
        console.log('Stored users:', users);
        console.log('Attempting login with:', { username, password });

        // Find user
        const user = users.find(u => u.email === username && u.password === password);
        
        if (user) {
            // Store login status
            localStorage.setItem('isLoggedIn', 'true');
            localStorage.setItem('currentUser', JSON.stringify(user));
            
            // Redirect to dashboard
            window.location.href = 'dashboard.html';
        } else {
            alert('Invalid credentials! Please check your email and password.');
        }
    });
}

// Check login status on dashboard
if (window.location.pathname.includes('dashboard.html')) {
    const isLoggedIn = localStorage.getItem('isLoggedIn');
    if (!isLoggedIn) {
        window.location.href = 'login.html';
    }
}