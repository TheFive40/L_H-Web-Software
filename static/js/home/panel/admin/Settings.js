const settingsApiUrl = '/api/settings'; // Base URL para los endpoints de configuración

document.addEventListener('DOMContentLoaded', () => {
    loadSettings(); // Cargar configuraciones al iniciar la página
    document.getElementById('settings-form').addEventListener('submit', saveSettings);
});

// Cargar todas las configuraciones del sistema
function loadSettings() {
    fetch(`${settingsApiUrl}/all`)
        .then((response) => response.json())
        .then((data) => {
            if (data.status === 'success') {
                const settings = data.data;
                populateSettingsForm(settings);
            } else {
                Swal.fire({
                    icon: 'error',
                    title: 'Error al cargar configuraciones',
                    text: data.message || 'No se pudieron cargar las configuraciones.',
                });
            }
        })
        .catch((error) => {
            console.error('Error al cargar configuraciones:', error);
            Swal.fire({
                icon: 'error',
                title: 'Error de conexión',
                text: 'No se pudieron cargar las configuraciones. Verifica la conexión con el servidor.',
            });
        });
}
function populateSettingsForm(settings) {
    settings.forEach((setting) => {
        switch (setting.key) {
            case 'theme':
                document.getElementById('theme').value = setting.value;
                break;
            case 'work_hours':
                document.getElementById('work-hours').value = setting.value;
                break;
            case 'notifications':
                document.getElementById('notifications').value = setting.value;
                break;
        }
    });
}
function saveSettings(event) {
    event.preventDefault();

    const theme = document.getElementById('theme').value;
    const workHours = document.getElementById('work-hours').value;
    const notifications = document.getElementById('notifications').value;
    const updates = [
        { key: 'theme', value: theme },
        { key: 'work_hours', value: workHours },
        { key: 'notifications', value: notifications },
    ];

    Promise.all(
        updates.map((update) =>
            fetch(`${settingsApiUrl}/update`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(update),
            })
        )
    )
        .then((responses) => Promise.all(responses.map((res) => res.json())))
        .then((results) => {
            const errors = results.filter((result) => result.status !== 'success');
            if (errors.length === 0) {
                Swal.fire({
                    icon: 'success',
                    title: 'Configuraciones guardadas',
                    text: 'Todas las configuraciones se guardaron correctamente.',
                });
                loadSettings(); // Recargar configuraciones actualizadas
            } else {
                Swal.fire({
                    icon: 'error',
                    title: 'Error al guardar configuraciones',
                    text: 'Algunas configuraciones no se pudieron guardar. Verifica los detalles.',
                });
                console.error('Errores al guardar configuraciones:', errors);
            }
        })
        .catch((error) => {
            console.error('Error al guardar configuraciones:', error);
            Swal.fire({
                icon: 'error',
                title: 'Error de conexión',
                text: 'Hubo un problema al guardar las configuraciones. Intenta nuevamente.',
            });
        });
}
