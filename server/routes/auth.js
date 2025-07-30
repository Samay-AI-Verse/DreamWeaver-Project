const signUpButton = document.getElementById('signUp');
const signInButton = document.getElementById('signIn');
const container = document.getElementById('container');

signUpButton.addEventListener('click', () => container.classList.add("right-panel-active"));
signInButton.addEventListener('click', () => container.classList.remove("right-panel-active"));

// Handle social login buttons
document.querySelectorAll('.social-container .social').forEach(button => {
    button.addEventListener('click', (e) => {
        e.preventDefault();
        const provider = button.querySelector('i').classList.contains('fa-facebook-f') ? 'facebook' :
            button.querySelector('i').classList.contains('fa-google') ? 'google' :
                button.querySelector('i').classList.contains('fa-github') ? 'github' : null;
        if (provider) {
            window.location.href = `http://localhost:3000/auth/${provider}`;
        }
    });
});

// Email/Password Signup
document.getElementById("signup-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    const name = document.getElementById("signup-name").value;
    const email = document.getElementById("signup-email").value;
    const password = document.getElementById("signup-password").value;
    const errorDiv = document.getElementById("signup-error");

    try {
        const response = await fetch("http://localhost:3000/register", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name, email, password })
        });
        const data = await response.json();
        if (data.token) {
            localStorage.setItem("token", data.token);
            window.location.href = `preferences.html?token=${data.token}`;
        }

        if (response.ok) {
            if (data.token) {
                localStorage.setItem("token", data.token);
                window.location.href = `preferences.html?token=${data.token}`;
            } else {
                alert(data.message || "Registration successful. Please set your preferences.");
                window.location.href = `preferences.html`;
            }

        } else {
            errorDiv.textContent = data.message;
            errorDiv.style.display = "block";
        }
    } catch (err) {
        errorDiv.textContent = "An error occurred. Please try again.";
        errorDiv.style.display = "block";
    }
});

// Email/Password Login
document.getElementById("login-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = document.getElementById("login-email").value;
    const password = document.getElementById("login-password").value;
    const errorDiv = document.getElementById("login-error");

    try {
        const response = await fetch("http://localhost:3000/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password })
        });
        const data = await response.json();
        if (response.ok) {
            localStorage.setItem("token", data.token);
            window.location.href = "demo.html";
        } else {
            errorDiv.textContent = data.message;
            errorDiv.style.display = "block";
        }
    } catch (err) {
        errorDiv.textContent = "An error occurred. Please try again.";
        errorDiv.style.display = "block";
    }
});

// Handle OAuth callback (if redirected back with token)
window.addEventListener('load', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    if (token) {
        localStorage.setItem("token", token);
        window.location.href = "demo.html";
    }
});