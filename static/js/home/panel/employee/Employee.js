document.addEventListener("DOMContentLoaded", () => {
    const startWorkButton = document.getElementById('start-work');
    const endWorkButton = document.getElementById('end-work');
    const logoutButton = document.getElementById("logout");
    const tableBody = document.getElementById("history-table");
    const paginationContainer = document.getElementById("pagination");

    const recordsPerPage = 10;
    let currentPage = 1;
    let records = [];

    // Registrar entrada de trabajo
    startWorkButton.addEventListener('click', () => {
        const today = new Date().toISOString().split('T')[0];
        const currentTime = new Date().toTimeString().split(' ')[0];

        fetch('/api/work-records/add', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                usuario_id: 3,
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

    // Registrar salida de trabajo
    endWorkButton.addEventListener('click', () => {
        fetch('/api/work-records/work/end/3', {
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

    // Cargar historial de trabajo
    async function loadHistory() {
        try {
            const userId = await getUserInfo();
            const response = await fetch(`/api/work-records/work/history/${userId}`);
            const data = await response.json();

            if (data.status === "success" && Array.isArray(data.records)) {
                records = data.records;
                displayPage(currentPage);
                createPaginationButtons();
            } else {
                tableBody.innerHTML = '<tr><td colspan="3">No se encontraron registros.</td></tr>';
                paginationContainer.innerHTML = "";
            }
        } catch (error) {
            console.error("Error al cargar el historial:", error);
        }
    }

    // Mostrar registros para la página actual
    function displayPage(page) {
        const startIndex = (page - 1) * recordsPerPage;
        const endIndex = startIndex + recordsPerPage;
        const pageRecords = records.slice(startIndex, endIndex);

        tableBody.innerHTML = "";
        pageRecords.forEach(record => {
            const row = `
                <tr>
                    <td>${record.date}</td>
                    <td>${record.check_in}</td>
                    <td>${record.check_out || "Pendiente"}</td>
                </tr>
            `;
            tableBody.innerHTML += row;
        });
    }

    // Crear botones de paginación
    function createPaginationButtons() {
        const totalPages = Math.ceil(records.length / recordsPerPage);
        const maxButtons = 5;
        const halfButtons = Math.floor(maxButtons / 2);

        paginationContainer.innerHTML = "";

        const createButton = (page, label, disabled = false, active = false) => {
            const button = document.createElement("button");
            button.textContent = label;
            button.classList.add("pagination-button");
            if (active) button.classList.add("active");
            if (disabled) button.disabled = true;
            button.addEventListener("click", () => {
                currentPage = page;
                displayPage(currentPage);
                createPaginationButtons();
            });
            return button;
        };

        // Botón Anterior
        if (currentPage > 1) {
            paginationContainer.appendChild(createButton(currentPage - 1, "Anterior"));
        }

        // Botones dinámicos
        const startPage = Math.max(1, currentPage - halfButtons);
        const endPage = Math.min(totalPages, startPage + maxButtons - 1);

        for (let i = startPage; i <= endPage; i++) {
            paginationContainer.appendChild(createButton(i, i, false, i === currentPage));
        }

        // Botón Siguiente
        if (currentPage < totalPages) {
            paginationContainer.appendChild(createButton(currentPage + 1, "Siguiente"));
        }
    }

    // Obtener información del usuario
    function getUserInfo() {
        return fetch('/api/auth/user/info')
            .then(response => response.json())
            .then(data => data.status === 'success' ? data.data.user_id : null)
            .catch(error => {
                console.error("Error al obtener la información del usuario:", error);
                throw error;
            });
    }

    // Mostrar modales
    function showModal(message, status) {
        Swal.fire({
            title: status === 'success' ? '¡Éxito!' : 'Error',
            text: message,
            icon: status,
            confirmButtonText: 'Aceptar'
        });
    }

    // Lógica de cierre de sesión
    logoutButton.addEventListener("click", () => {
        Swal.fire({
            title: "¿Estás seguro?",
            text: "Esto cerrará tu sesión actual.",
            icon: "warning",
            showCancelButton: true,
            confirmButtonText: "Cerrar sesión",
            cancelButtonText: "Cancelar",
        }).then((result) => {
            if (result.isConfirmed) {
                fetch("/api/auth/logout", { method: "POST" })
                    .then(response => response.ok ? window.location.href = "/" : Promise.reject())
                    .catch(() => showModal("No se pudo cerrar la sesión. Intenta nuevamente.", "error"));
            }
        });
    });

    // Cargar historial al inicio
    loadHistory();
});
