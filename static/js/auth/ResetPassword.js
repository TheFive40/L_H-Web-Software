
document.addEventListener("DOMContentLoaded", () => {
    const email = document.getElementById('email-container').dataset.email;
    const passwordField = document.getElementById('password');
    const confirmPasswordField = document.getElementById('confirm-password');
    const message = document.getElementById('message');
    const form = document.getElementById('form')

    form.addEventListener("submit", async (e) => {
        e.preventDefault()
        const response = await fetch('/api/user/usuarios/reset_password', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                correo: email,  // Usamos la variable `email` obtenida del atributo `data-email`
                nueva_contrasena: passwordField.value
            })
        });
        const result = await response.json();
        console.log(result)
        if (response.ok) {
            console.log('Respuesta del servidor:', result.message);
            Swal.fire({
                icon: 'success',
                title: 'Éxito',
                text: 'Contraseña actualizada exitosamente',
                confirmButtonColor: '#0066cc',
            });
        } else {
            console.error('Error:', result.message);
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: result.message,
                confirmButtonColor: '#cc0000',
            });
        }
    });

    confirmPasswordField.addEventListener('input', function () {
        if (passwordField.value !== confirmPasswordField.value) {
            message.textContent = 'Las contraseñas no coinciden';
        } else {
            message.textContent = '';
        }
    });

});

