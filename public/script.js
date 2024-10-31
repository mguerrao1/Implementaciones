document.getElementById("loginForm").addEventListener("submit", async function (event) {
    event.preventDefault();

    const username = document.getElementById("username").value;
    const password = document.getElementById("password").value;

    try {
        const response = await fetch("/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username, password })
        });

        const result = await response.json();
        document.getElementById("message").innerText = result.message;

        if (result.token) {
            localStorage.setItem("authToken", result.token);
            window.location.href = "dashboard.html";
        }
    } catch (error) {
        console.error("Error:", error);
        document.getElementById("message").innerText = "Error de conexión";
    }
});
