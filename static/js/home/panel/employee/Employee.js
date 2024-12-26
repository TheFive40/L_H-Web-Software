document.addEventListener("DOMContentLoaded", () => {
    // Elementos existentes para la gestión de asistencia
    const startWorkBtn = document.getElementById('start-work');
    const endWorkBtn = document.getElementById('end-work');
    const historyTable = document.getElementById('history-table');

    // Elementos nuevos para la gestión de empleados
    const addEmployeeBtn = document.getElementById("add-employee-btn");
    const employeeModal = document.getElementById("employee-modal");
    const closeModalBtn = document.getElementById("close-modal");
    const employeeForm = document.getElementById("employee-form");

    // Función para mostrar alertas modales
    function showModal(message, status) {
        Swal.fire({
            title: status === 'success' ? '¡Éxito!' : 'Error',
            text: message,
            icon: status,
            confirmButtonText: 'Aceptar'
        });
    }

    // Función para obtener la información del usuario
    function getUserInfo() {
        return fetch('/api/auth/user/info')
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP Error: ${response.status}`);
                }
                return response.json();
            })
            .then(data => {
                if (data.status === 'success') {
                    return data.data.user_id; // Retornamos el user_id
                } else {
                    throw new Error(data.message || 'Error desconocido al obtener el usuario.');
                }
            })
            .catch(error => {
                console.error('Error al obtener la información del usuario:', error);
                showModal('Error al obtener la información del usuario.', 'error');
                throw error; // Propagamos el error para que pueda ser manejado en el lugar de la llamada
            });
    }

    // Función para cargar el historial de asistencia
    async function loadHistory() {
        const userId = await getUserInfo();
        fetch(`/api/work-records/work/history/${userId}`)
            .then(response => response.json())
            .then(data => {
                historyTable.innerHTML = ''; // Limpiar tabla

                // Verificar que la respuesta sea exitosa y tenga registros
                if (data.status === 'success' && Array.isArray(data.records)) {
                    data.records.forEach(record => {
                        const row = `
                            <tr>
                                <td>${record.date}</td>
                                <td>${record.check_in}</td>
                                <td>${record.check_out || 'Pendiente'}</td>
                            </tr>
                        `;
                        historyTable.innerHTML += row;
                    });
                } else {
                    // Si no hay registros, mostrar un mensaje en la tabla
                    historyTable.innerHTML = '<tr><td colspan="3">No se encontraron registros.</td></tr>';
                }
            })
            .catch(error => console.error('Error:', error));
    }

    // Registrar entrada
    startWorkBtn.addEventListener('click', () => {
        const usuarioId = 3; // Cambiar por el ID real del usuario
        const today = new Date().toISOString().split('T')[0]; // Fecha en formato YYYY-MM-DD
        const now = new Date();
        const currentTime = now.toTimeString().split(' ')[0]; // Hora en formato HH:MM:SS

        fetch('/api/work-records/add', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                usuario_id: usuarioId,
                fecha: today,
                hora_entrada: currentTime
            })
        })
            .then(response => response.json())
            .then(data => {
                showModal(data.message, data.status === 'success' ? 'success' : 'error');
                if (data.status === 'success') loadHistory();
            })
            .catch(error => {
                console.error('Error:', error);
                showModal('Ocurrió un error al registrar la entrada.', 'error');
            });
    });

    // Registrar salida
    endWorkBtn.addEventListener('click', () => {
        const usuarioId = 3; // Cambiar por el ID real del usuario
        fetch(`/api/work-records/work/end/${usuarioId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' }
        })
            .then(response => response.json())
            .then(data => {
                showModal(data.message, data.status === 'success' ? 'success' : 'error');
                if (data.status === 'success') loadHistory();
            })
            .catch(error => {
                console.error('Error:', error);
                showModal('Ocurrió un error al registrar la salida.', 'error');
            });
    });

    // Abrir el modal para agregar empleados
    addEmployeeBtn.addEventListener("click", () => {
        employeeModal.classList.remove("hidden");
    });

    // Cerrar el modal
    closeModalBtn.addEventListener("click", () => {
        employeeModal.classList.add("hidden");
    });

    // Guardar empleado
    employeeForm.addEventListener("submit", async (event) => {
        event.preventDefault();

        const employeeName = document.getElementById("employee-name").value;
        const employeeEmail = document.getElementById("employee-email").value;
        const employeeRole = document.getElementById("employee-role").value;

        if (!employeeName || !employeeEmail || !employeeRole) {
            showModal("Por favor, completa todos los campos.", "error");
            return;
        }

        const data = {
            name: employeeName,
            email: employeeEmail,
            role: employeeRole,
        };

        try {
            const response = await fetch("/api/employees/add", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(data),
            });

            const result = await response.json();

            if (result.status === "success") {
                showModal("Empleado agregado con éxito.", "success");
                employeeModal.classList.add("hidden");
                employeeForm.reset();
                loadEmployees(); // Función para recargar la tabla de empleados
            } else {
                showModal(result.message, "error");
            }
        } catch (error) {
            console.error("Error al agregar empleado:", error);
        }
    });

    // Función para cargar empleados
    async function loadEmployees() {
        try {
            const response = await fetch("/api/employees/all");
            const result = await response.json();

            if (result.status === "success") {
                const employeeTable = document.getElementById("employee-table");
                employeeTable.innerHTML = ""; // Limpiar tabla

                result.data.forEach((employee) => {
                    const row = `
                        <tr>
                            <td>${employee.id}</td>
                            <td>${employee.name}</td>
                            <td>${employee.email}</td>
                            <td>${employee.role}</td>
                            <td>
                                <button class="edit-btn" data-id="${employee.id}">Editar</button>
                                <button class="delete-btn" data-id="${employee.id}">Eliminar</button>
                            </td>
                        </tr>
                    `;
                    employeeTable.innerHTML += row;
                });
            }
        } catch (error) {
            console.error("Error al cargar empleados:", error);
        }
    }

    // Cargar historial de asistencia al inicio
    loadHistory();

    // Cargar empleados al inicio
    loadEmployees();
});
