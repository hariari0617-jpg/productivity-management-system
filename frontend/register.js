const registerForm = document.getElementById("registerForm");
const registerMessage = document.getElementById("registerMessage");

registerForm.addEventListener("submit", async function (e) {

    e.preventDefault();

    const username = document.getElementById("username").value.trim();
    const password = document.getElementById("password").value;
    const confirmPassword =
        document.getElementById("confirmPassword").value;

    if (password !== confirmPassword) {
        registerMessage.textContent = "Passwords do not match.";
        return;
    }

    try {

        const response = await fetch("/api/register", {

            method: "POST",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify({
                username: username,
                password: password
            })

        });

        const data = await response.json();

        if (response.ok) {

            registerMessage.textContent =
                "Account created successfully!";

            registerForm.reset();

            setTimeout(() => {
                window.location.href = "login.html";
            }, 1000);

        } else {

            registerMessage.textContent =
                data.message || "Registration failed.";

        }

    } catch (error) {

        console.error(error);

        registerMessage.textContent =
            "Unable to connect to server.";

    }

});
