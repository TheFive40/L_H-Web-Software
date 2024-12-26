document.addEventListener('DOMContentLoaded', () => {
    const recordsTable = document.getElementById('records-table');
    const filterBtn = document.getElementById('filter-btn');
    const addRecordBtn = document.getElementById('add-record-btn');
    const recordModal = document.getElementById('record-modal');
    const recordForm = document.getElementById('record-form');
    const closeModalBtn = document.getElementById('close-modal');

    // Nueva función para cargar registros con async/await
    async function loadRecords() {
        try {
            const response = await fetch("/api/work-records/all");
            const result = await response.json();

            if (result.status === "success") {
                recordsTable.innerHTML = ""; // Limpiar tabla

                result.data.forEach(record => {
                    const row = `
                        <tr>
                            <td>${record.user}</td>
                            <td>${record.date}</td>
                            <td>${record.check_in}</td>
                            <td>${record.check_out || "N/A"}</td>
                            <td>${record.extra_hours}</td>
                            <td>
                                <button class="edit-btn" data-id="${record.id}">Editar</button>
                                <button class="delete-btn" data-id="${record.id}">Eliminar</button>
                            </td>
                        </tr>
                    `;
                    recordsTable.innerHTML += row;
                });

                // Añadir eventos dinámicos a los botones de acciones
                document.querySelectorAll(".edit-btn").forEach(btn =>
                    btn.addEventListener("click", (e) => openModal(result.data.find(r => r.id === parseInt(e.target.dataset.id))))
                );

                document.querySelectorAll(".delete-btn").forEach(btn =>
                    btn.addEventListener("click", (e) => deleteRecord(parseInt(e.target.dataset.id)))
                );

            } else {
                alert(result.message);
            }
        } catch (error) {
            console.error("Error al cargar registros:", error);
        }
    }

    // Función para llenar la tabla (ya existente en tu código)
    const populateTable = (records) => {
        recordsTable.innerHTML = '';
        records.forEach(record => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${record.user}</td>
                <td>${record.date}</td>
                <td>${record.check_in}</td>
                <td>${record.check_out || 'N/A'}</td>
                <td>${record.extra_hours}</td>
                <td>
                    <button class="edit-btn" data-id="${record.id}">Editar</button>
                    <button class="delete-btn" data-id="${record.id}">Eliminar</button>
                </td>
            `;
            recordsTable.appendChild(row);

            // Añadir eventos para editar y eliminar
            row.querySelector('.edit-btn').addEventListener('click', () => openModal(record));
            row.querySelector('.delete-btn').addEventListener('click', () => deleteRecord(record.id));
        });
    };

    // Función para abrir el modal
    const openModal = (record = null) => {
        if (record) {
            document.getElementById('record-id').value = record.id;
            document.getElementById('usuario-id').value = record.user;
            document.getElementById('fecha').value = record.date;
            document.getElementById('hora-entrada').value = record.check_in;
            document.getElementById('hora-salida').value = record.check_out || '';
        } else {
            recordForm.reset();
        }
        recordModal.classList.remove('hidden');
    };

    // Función para cerrar el modal
    const closeModal = () => {
        recordModal.classList.add('hidden');
    };

    // Función para guardar un registro (ya existente)
    const saveRecord = async (event) => {
        event.preventDefault();

        const usuarioId = document.getElementById("usuario-id").value;
        const fecha = document.getElementById("fecha").value;
        const horaEntrada = document.getElementById("hora-entrada").value;
        const horaSalida = document.getElementById("hora-salida").value;

        if (!usuarioId || !fecha || !horaEntrada) {
            alert("Por favor, completa los campos obligatorios.");
            return;
        }

        const data = {
            usuario_id: usuarioId,
            fecha: fecha,
            hora_entrada: horaEntrada,
            hora_salida: horaSalida || null
        };

        const recordId = document.getElementById('record-id').value;
        const url = recordId ? `/api/work-records/update/${recordId}` : '/api/work-records/add';
        const method = recordId ? 'PUT' : 'POST';

        try {
            const response = await fetch(url, {
                method: method,
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(data)
            });

            const result = await response.json();

            if (result.status === "success") {
                alert(result.message);
                loadRecords(); // Actualizar la tabla después de guardar
                closeModal();
            } else {
                alert(result.message);
            }
        } catch (error) {
            console.error("Error al guardar el registro:", error);
        }
    };

    // Función para eliminar un registro
    const deleteRecord = (id) => {
        if (confirm('¿Estás seguro de eliminar este registro?')) {
            fetch(`/api/work-records/delete/${id}`, {
                method: 'DELETE',
            })
                .then(response => response.json())
                .then(data => {
                    if (data.status === 'success') {
                        loadRecords();
                    } else {
                        console.error(data.message);
                    }
                })
                .catch(error => console.error('Error al eliminar el registro:', error));
        }
    };

    // Event listeners
    filterBtn.addEventListener('click', () => {
        const name = document.getElementById('search-name').value;
        const startDate = document.getElementById('start-date').value;
        const endDate = document.getElementById('end-date').value;

        const filters = {};
        if (name) filters.usuario_id = name; // O ajusta según el backend
        if (startDate) filters.fecha_inicio = startDate;
        if (endDate) filters.fecha_fin = endDate;

        loadRecords(filters);
    });

    addRecordBtn.addEventListener('click', () => openModal());
    closeModalBtn.addEventListener('click', closeModal);
    recordForm.addEventListener('submit', saveRecord);

    // Cargar registros al inicio
    loadRecords(); // Nueva función reemplaza el anterior llamado
});
