// auth.js
document.addEventListener('DOMContentLoaded', function() {
    const container = document.getElementById('container');
    const signUpButton = document.getElementById('signUp');
    const signInButton = document.getElementById('signIn');
    const signupForm = document.getElementById('signup-form');
    const loginForm = document.getElementById('login-form');

    signUpButton.addEventListener('click', () => {
        container.classList.add('right-panel-active');
    });

    signInButton.addEventListener('click', () => {
        container.classList.remove('right-panel-active');
    });

    signupForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        const name = document.getElementById('signup-name').value;
        const email = document.getElementById('signup-email').value;
        const password = document.getElementById('signup-password').value;
        const errorElement = document.getElementById('signup-error');
        try {
            const response = await fetch('http://localhost:3000/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ name, email, password })
            });
            const data = await response.json();
            if (response.ok) {
                localStorage.setItem('dreamweaver_token', data.token);
                window.location.href = `ChatUI.html?token=${data.token}`;
            } else {
                errorElement.textContent = data.message || 'Registration failed';
                errorElement.style.display = 'block';
            }
        } catch (err) {
            errorElement.textContent = 'Network error. Please try again.';
            errorElement.style.display = 'block';
        }
    });

    loginForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;
        const errorElement = document.getElementById('login-error');
        try {
            const response = await fetch('http://localhost:3000/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, password })
            });
            const data = await response.json();
            if (response.ok) {
                localStorage.setItem('dreamweaver_token', data.token);
                window.location.href = `ChatUI.html?token=${data.token}`;
            } else {
                errorElement.textContent = data.message || 'Login failed';
                errorElement.style.display = 'block';
            }
        } catch (err) {
            errorElement.textContent = 'Network error. Please try again.';
            errorElement.style.display = 'block';
        }
    });
});