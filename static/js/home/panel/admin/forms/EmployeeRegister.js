document.addEventListener('DOMContentLoaded', () => {
    loadRolesIntoSelect();
    document.getElementById('create-employee-form').addEventListener('submit', createEmployee);
});

// Cargar los roles dinámicamente en el combo box
function loadRolesIntoSelect() {
    fetch('/api/roles/all')
        .then(response => response.json())
        .then(data => {
            if (data.status === 'success') {
                const roles = data.data;
                const select = document.getElementById('rol');
                roles.forEach(role => {
                    const option = document.createElement('option');
                    option.value = role.id;
                    option.textContent = role.name;
                    select.appendChild(option);
                });
            } else {
                Swal.fire({
                    icon: 'error',
                    title: 'Error al cargar roles',
                    text: data.message || 'Ocurrió un problema al cargar los roles.',
                });
            }
        })
        .catch(error => {
            Swal.fire({
                icon: 'error',
                title: 'Error de conexión',
                text: 'No se pudieron cargar los roles. Verifica la conexión con el servidor.',
            });
            console.error('Error al cargar roles:', error);
        });
}

function createEmployee(event) {
    event.preventDefault();

    // Obtener datos del formulario
    const nombre = document.getElementById('nombre').value.trim();
    const correo = document.getElementById('correo').value.trim();
    const contrasena = document.getElementById('contrasena').value.trim();
    const fotoPerfil = document.getElementById('foto_perfil').files[0];
    const rolId = document.getElementById('rol').value;

    if (!nombre || !correo || !contrasena || !rolId) {
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'Por favor, completa todos los campos obligatorios.',
        });
        return;
    }

    // Convertir la foto de perfil a Base64 si existe
    if (fotoPerfil) {
        const reader = new FileReader();
        reader.onload = () => {
            const fotoBase64 = reader.result.split(',')[1]; // Eliminar el prefijo "data:image/png;base64,"
            const newEmployee = {
                nombre_completo: nombre,
                correo: correo,
                contrasena: contrasena,
                foto_perfil: fotoBase64,
                rol_id: parseInt(rolId),
            };
            enviarDatosAlServidor(newEmployee);
        };
        reader.readAsDataURL(fotoPerfil); // Leer archivo como Base64
    } else {
        const newEmployee = {
            nombre_completo: nombre,
            correo: correo,
            contrasena: contrasena,
            foto_perfil: null,
            rol_id: parseInt(rolId),
        };
        enviarDatosAlServidor(newEmployee);
    }
}

function enviarDatosAlServidor(newEmployee) {
    fetch('/api/user/usuarios', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(newEmployee),
    })
        .then(response => {
            if (!response.ok) {
                return response.json().then(error => {
                    throw new Error(error.message || 'Error desconocido');
                });
            }
            return response.json();
        })
        .then(data => {
            Swal.fire({
                icon: 'success',
                title: 'Empleado Creado',
                text: 'El empleado ha sido creado exitosamente.',
            });
            document.getElementById('create-employee-form').reset();
        })
        .catch(error => {
            console.error('Error al crear empleado:', error);
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: `No se pudo crear el empleado: ${error.message}`,
            });
        });
}
