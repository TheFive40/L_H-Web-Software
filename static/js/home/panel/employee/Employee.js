document.getElementById('start-work').addEventListener('click', () => {
    const usuarioId = 3 // Cambiar por el ID real del usuario
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


document.getElementById('end-work').addEventListener('click', () => {
    const usuarioId = 3 // Cambiar por el ID real del usuario
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

async function loadHistory() {
    const userId = await getUserInfo();
    fetch(`/api/work-records/work/history/${userId}`)
        .then(response => response.json())
        .then(data => {
            const table = document.getElementById('history-table');
            table.innerHTML = ''; // Limpiar tabla

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
                    table.innerHTML += row;
                });
            } else {
                // Si no hay registros, mostrar un mensaje en la tabla
                table.innerHTML = '<tr><td colspan="3">No se encontraron registros.</td></tr>';
            }
        })
        .catch(error => console.error('Error:', error));
}
function showModal(message, status) {
    Swal.fire({
        title: status === 'success' ? '¡Éxito!' : 'Error',
        text: message,
        icon: status,
        confirmButtonText: 'Aceptar'
    });
}
loadHistory();
