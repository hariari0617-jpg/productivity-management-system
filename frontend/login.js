document.getElementById("loginForm").addEventListener("submit", async function (event) {
    event.preventDefault();

    const username = document.getElementById("username").value.trim();
    const password = document.getElementById("password").value;

    const message = document.getElementById("loginMessage");

    try {
        const response = await fetch("http://localhost:5000/api/login", {
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

        if (!response.ok) {
            message.textContent = data.message || "Login failed";
            message.className = "error";
            return;
        }

        localStorage.setItem("loggedInUser", JSON.stringify(data.user));

        message.textContent = "Login successful!";
        message.className = "success";

        setTimeout(() => {
            window.location.href = "index.html";
        }, 500);

    } catch (error) {
        console.error(error);
        message.textContent = "Cannot connect to server.";
        message.className = "error";
    }
});