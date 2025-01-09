document.addEventListener("DOMContentLoaded", () => {
    const registerForm = document.getElementById("registerForm");

    // Listener para el formulario de registro
    registerForm.addEventListener("submit", (e) => {
        e.preventDefault(); // Previene el comportamiento por defecto del formulario
        handleRegister();
    });
});

// Manejo del registro
function handleRegister() {
    const name = document.getElementById("name").value.trim();
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value.trim();
    const confirmPassword = document.getElementById("confirm-password").value.trim();

    // Validaciones
    if (!name || !email || !password || !confirmPassword) {
        Swal.fire({
            icon: "error",
            title: "Campos incompletos",
            text: "Por favor, completa todos los campos.",
        });
        return;
    }

    if (password !== confirmPassword) {
        Swal.fire({
            icon: "error",
            title: "Contraseñas no coinciden",
            text: "Asegúrate de que ambas contraseñas coincidan.",
        });
        return;
    }

    // Enviar datos al servidor
    fetch("/api/auth/register", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            full_name: name,
            email: email,
            password: password,
        }),
    })
        .then((response) => {
            if (!response.ok) {
                throw new Error("Error en el registro.");
            }
            return response.json();
        })
        .then((data) => {
            if (data.status === "success") {
                Swal.fire({
                    icon: "success",
                    title: "Registro exitoso",
                    text: data.message,
                    timer: 2000,
                    showConfirmButton: false,
                }).then(() => {
                    window.location.href = "/"; // Redirige al login
                });
            } else {
                Swal.fire({
                    icon: "error",
                    title: "Error",
                    text: data.message || "Hubo un problema con el registro.",
                });
            }
        })
        .catch((error) => {
            console.error("Error al registrar usuario:", error);
            Swal.fire({
                icon: "error",
                title: "Error",
                text: "No se pudo conectar con el servidor.",
            });
        });
}
