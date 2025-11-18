// ======== auth.js ========

// ✅ Backend API URL
const BASE_URL = "https://harley-referral-app.onrender.com/api/auth"; 

// Helper: show inline input errors
function showError(input, message) {
  let error = input.parentElement.querySelector(".error-message");
  if (!error) {
    error = document.createElement("small");
    error.classList.add("error-message");
    input.parentElement.appendChild(error);
  }
  error.textContent = message;
  error.style.color = "red";
  error.style.fontSize = "12px";
  input.style.border = "1px solid red";
}

function clearError(input) {
  const error = input.parentElement.querySelector(".error-message");
  if (error) error.textContent = "";
  input.style.border = "";
}

// Helper: show success/error messages below form
function showMessage(message, type = "success") {
  let msgBox = document.querySelector(".form-message");
  const formEl = document.querySelector("form");
  if (!msgBox) {
    msgBox = document.createElement("div");
    msgBox.classList.add("form-message");
    // Insert the message above the form so it's visible at the top
    if (formEl && formEl.parentElement) {
      formEl.parentElement.insertBefore(msgBox, formEl);
    } else if (formEl) {
      formEl.insertBefore(msgBox, formEl.firstChild);
    } else {
      // fallback to top of body
      document.body.insertBefore(msgBox, document.body.firstChild);
    }
  }

  msgBox.textContent = message;
  msgBox.style.marginTop = "10px";
  msgBox.style.padding = "8px";
  msgBox.style.borderRadius = "5px";
  msgBox.style.textAlign = "center";
  msgBox.style.fontSize = "14px";
  msgBox.style.color = type === "success" ? "green" : "red";
}

document.addEventListener("DOMContentLoaded", () => {
  const formTitle = document.querySelector("h2")?.textContent || "";

  // ====== SIGNUP PAGE ======
  if (formTitle.includes("Sign Up")) {
    const form = document.querySelector("form");
    const nameInput = document.getElementById("name");
    const usernameInput = document.getElementById("username");
    const emailInput = document.getElementById("email");
    const passwordInput = document.getElementById("password");

    [nameInput, usernameInput, emailInput, passwordInput].forEach(input =>
      input.addEventListener("input", () => clearError(input))
    );

    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      let valid = true;

      if (nameInput.value.trim().length < 3) {
        showError(nameInput, "Full name must be at least 3 characters.");
        valid = false;
      }

      if (usernameInput.value.trim().length < 3) {
        showError(usernameInput, "Username must be at least 3 characters.");
        valid = false;
      } else if (!/^[a-zA-Z0-9_]+$/.test(usernameInput.value)) {
        showError(usernameInput, "Only letters, numbers, and underscores allowed.");
        valid = false;
      }

      if (!/^\S+@\S+\.\S+$/.test(emailInput.value.trim())) {
        showError(emailInput, "Enter a valid email address.");
        valid = false;
      }

      if (passwordInput.value.trim().length < 6) {
        showError(passwordInput, "Password must be at least 6 characters.");
        valid = false;
      }

      if (!valid) return;

      try {
        const res = await fetch(`${BASE_URL}/register`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: nameInput.value.trim(),
            username: usernameInput.value.trim(),
            email: emailInput.value.trim(),
            password: passwordInput.value.trim()
          }),
        });

        const data = await res.json();

        if (res.ok && data.success !== false) {
          showMessage(data.message || "Signup successful!", "success");
          setTimeout(() => (window.location.href = "login.html"), 1500);
        } else {
          showMessage(data.message || "Signup failed!", "error");
        }
      } catch (err) {
        console.error("Signup error:", err);
        showMessage("Unable to connect to server.", "error");
      }
    });
  }

  // ====== LOGIN PAGE ======
  if (formTitle.includes("Login")) {
    const form = document.querySelector("form");
    const emailInput = document.getElementById("email");
    const passwordInput = document.getElementById("password");

    [emailInput, passwordInput].forEach(input =>
      input.addEventListener("input", () => clearError(input))
    );

    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      let valid = true;

      if (!/^\S+@\S+\.\S+$/.test(emailInput.value.trim())) {
        showError(emailInput, "Enter a valid email address.");
        valid = false;
      }

      if (passwordInput.value.trim().length < 6) {
        showError(passwordInput, "Password must be at least 6 characters.");
        valid = false;
      }

      if (!valid) return;

      try {
        const res = await fetch(`${BASE_URL}/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            emailOrUsername: emailInput.value.trim(),
            password: passwordInput.value.trim(),
          }),
        });

        const data = await res.json();

        if (data.success) {
  localStorage.setItem("token", data.token);
  localStorage.setItem("username", data.user.username); // <-- add this
  showMessage("Login successful! Redirecting...", "success");
  setTimeout(() => (window.location.href = "dashboard.html"), 1500);
} else {
  showMessage(data.message || "Invalid login credentials.", "error");
}
      } catch (err) {
        console.error("Login error:", err);
        showMessage("Unable to connect to server.", "error");
      }
    });
  }
});
