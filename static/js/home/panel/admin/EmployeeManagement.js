const apiUrl = '/api/user/usuarios';
const rolesApiUrl = '/api/roles/all';

let rolesCache = {};
let employeesData = [];
let currentPage = 1;
const recordsPerPage = 10;
document.addEventListener('DOMContentLoaded', () => {
    loadRolesAndEmployees();
    document.getElementById('search-input').addEventListener('input', filterEmployees);
    document.getElementById('filter-select').addEventListener('change', filterEmployees);
});

function loadRolesAndEmployees() {
    fetch(rolesApiUrl)
        .then(response => response.json())
        .then(data => {
            if (data.status === 'success') {
                data.data.forEach(role => {
                    rolesCache[role.id] = role.name;
                });
                loadEmployees();
            } else {
                Swal.fire({
                    icon: 'error',
                    title: 'Error al cargar roles',
                    text: data.message || 'No se pudieron cargar los roles.',
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

function loadEmployees() {
    fetch(apiUrl)
        .then(response => response.json())
        .then(data => {
            if (data.status === 'success' && Array.isArray(data.data)) {
                employeesData = data.data;
                displayPage(currentPage);
                setupPagination();
            } else {
                Swal.fire({
                    icon: 'error',
                    title: 'Error al cargar empleados',
                    text: data.message || 'No se encontraron empleados registrados.',
                });
            }
        })
        .catch(error => {
            Swal.fire({
                icon: 'error',
                title: 'Error de conexión',
                text: 'No se pudieron cargar los empleados. Verifica la conexión con el servidor.',
            });
            console.error('Error al cargar empleados:', error);
        });
}

function displayPage(page) {
    const tableBody = document.getElementById('employees-table');
    tableBody.innerHTML = '';

    const startIndex = (page - 1) * recordsPerPage;
    const endIndex = startIndex + recordsPerPage;

    const employeesToDisplay = employeesData.slice(startIndex, endIndex);

    employeesToDisplay.forEach(employee => {
        const row = document.createElement('tr');
        const roleName = rolesCache[employee.rol_id] || 'Rol desconocido';

        row.innerHTML = `
            <td>${employee.id}</td>
            <td contenteditable="true" data-field="nombre_completo">${employee.nombre_completo}</td>
            <td contenteditable="true" data-field="correo">${employee.correo}</td>
            <td contenteditable="true" data-field="rol">${roleName}</td>
            <td>
                <button class="btn-edit" onclick="updateEmployee(${employee.id}, this)">Actualizar</button>
                <button class="btn-delete" onclick="deleteEmployee(${employee.id})">Eliminar</button>
            </td>
        `;
        tableBody.appendChild(row);
    });
}

function setupPagination() {
    const totalPages = Math.ceil(employeesData.length / recordsPerPage);
    const paginationContainer = document.getElementById('pagination');
    const maxVisiblePages = 5;
    const startPage = Math.max(currentPage - Math.floor(maxVisiblePages / 2), 1);
    const endPage = Math.min(startPage + maxVisiblePages - 1, totalPages);

    paginationContainer.innerHTML = '';

    if (currentPage > 1) {
        const prevButton = document.createElement('button');
        prevButton.textContent = 'Anterior';
        prevButton.classList.add('pagination-button');
        prevButton.addEventListener('click', () => {
            currentPage--;
            displayPage(currentPage);
            setupPagination();
        });
        paginationContainer.appendChild(prevButton);
    }

    for (let i = startPage; i <= endPage; i++) {
        const button = document.createElement('button');
        button.textContent = i;
        button.classList.add('pagination-button');
        if (i === currentPage) {
            button.classList.add('active');
        }
        button.addEventListener('click', () => {
            currentPage = i;
            displayPage(currentPage);
            setupPagination();
        });
        paginationContainer.appendChild(button);
    }

    // Botón "Siguiente"
    if (currentPage < totalPages) {
        const nextButton = document.createElement('button');
        nextButton.textContent = 'Siguiente';
        nextButton.classList.add('pagination-button');
        nextButton.addEventListener('click', () => {
            currentPage++;
            displayPage(currentPage);
            setupPagination();
        });
        paginationContainer.appendChild(nextButton);
    }
}


function updateEmployee(id, button) {
    const row = button.closest('tr');
    const updatedData = {};

    row.querySelectorAll('[contenteditable="true"]').forEach(cell => {
        updatedData[cell.getAttribute('data-field')] = cell.innerText.trim();
    });

    const roleName = updatedData.rol.trim().replace(/\n/g, '').toLowerCase();
    const roleId = Object.keys(rolesCache).find(id => rolesCache[id].trim().replace(/\n/g, '').toLowerCase() === roleName);

    if (!roleId) {
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: `Rol "${updatedData.rol}" no encontrado. Por favor, verifica el nombre del rol.`,
        });
        return;
    }

    updatedData.rol_id = parseInt(roleId, 10);
    delete updatedData.rol;

    fetch(`${apiUrl}/${id}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedData),
    })
        .then(async (response) => {
            const data = await response.json();
            if (response.ok) {
                Swal.fire({
                    icon: 'success',
                    title: 'Empleado Actualizado',
                    text: 'El empleado ha sido actualizado exitosamente.',
                });
                loadEmployees(); // Recargar los empleados
            } else {
                throw new Error(data.message || 'Error desconocido');
            }
        })
        .catch(error => {
            console.error('Error al actualizar empleado:', error);
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: `No se pudo actualizar el empleado: ${error.message}`,
            });
        });
}

// Eliminar empleado
function deleteEmployee(id) {
    Swal.fire({
        title: '¿Estás seguro?',
        text: '¡Esta acción eliminará al empleado permanentemente!',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#3085d6',
        confirmButtonText: 'Sí, eliminar',
        cancelButtonText: 'Cancelar',
    }).then((result) => {
        if (result.isConfirmed) {
            fetch(`${apiUrl}/${id}`, {
                method: 'DELETE',
            })
                .then(async (response) => {
                    if (!response.ok) {
                        const errorText = await response.text(); // Captura el error en texto
                        throw new Error(`Error del servidor: ${errorText}`);
                    }
                    return response.json();
                })
                .then(data => {
                    Swal.fire({
                        icon: 'success',
                        title: 'Empleado Eliminado',
                        text: 'El empleado ha sido eliminado correctamente.',
                    });
                    loadEmployees();
                })
                .catch(error => {
                    console.error('Error al eliminar empleado:', error);
                    Swal.fire({
                        icon: 'error',
                        title: 'Error',
                        text: `No se pudo eliminar el empleado: ${error.message}`,
                    });
                });
        }
    });
}

function filterEmployees() {
    const searchValue = document.getElementById('search-input').value.toLowerCase();
    const filterField = document.getElementById('filter-select').value;

    // Filtrar los empleados en función del campo seleccionado y el valor de búsqueda
    const filteredEmployees = employeesData.filter(employee => {
        if (filterField === 'rol') {
            const roleName = rolesCache[employee.rol_id]?.toLowerCase() || 'rol desconocido';
            return roleName.includes(searchValue);
        }
        if (filterField === 'nombre_completo') {
            return employee.nombre_completo.toLowerCase().includes(searchValue);
        }
        return true;
    });

    // Mostrar los empleados filtrados sin modificar employeesData
    displayFilteredEmployees(filteredEmployees);
}

function displayFilteredEmployees(filteredEmployees) {
    const tableBody = document.getElementById('employees-table');
    tableBody.innerHTML = ''; // Limpia el contenido de la tabla

    filteredEmployees.forEach(employee => {
        const row = document.createElement('tr');
        const roleName = rolesCache[employee.rol_id] || 'Rol desconocido';

        row.innerHTML = `
            <td>${employee.id}</td>
            <td contenteditable="true" data-field="nombre_completo">${employee.nombre_completo}</td>
            <td contenteditable="true" data-field="correo">${employee.correo}</td>
            <td contenteditable="true" data-field="rol">${roleName}</td>
            <td>
                <button class="btn-edit" onclick="updateEmployee(${employee.id}, this)">Actualizar</button>
                <button class="btn-delete" onclick="deleteEmployee(${employee.id})">Eliminar</button>
            </td>
        `;
        tableBody.appendChild(row);
    });

    // Configurar la paginación para los empleados filtrados
    setupPaginationForFilteredEmployees(filteredEmployees);
}

function setupPaginationForFilteredEmployees(filteredEmployees) {
    const totalPages = Math.ceil(filteredEmployees.length / recordsPerPage);
    const paginationContainer = document.getElementById('pagination');
    const maxVisiblePages = 5;
    const startPage = Math.max(currentPage - Math.floor(maxVisiblePages / 2), 1);
    const endPage = Math.min(startPage + maxVisiblePages - 1, totalPages);

    paginationContainer.innerHTML = ''; // Limpia los botones de paginación

    if (currentPage > 1) {
        const prevButton = document.createElement('button');
        prevButton.textContent = 'Anterior';
        prevButton.classList.add('pagination-button');
        prevButton.addEventListener('click', () => {
            currentPage--;
            displayFilteredEmployees(getEmployeesForPage(filteredEmployees, currentPage));
            setupPaginationForFilteredEmployees(filteredEmployees);
        });
        paginationContainer.appendChild(prevButton);
    }

    for (let i = startPage; i <= endPage; i++) {
        const button = document.createElement('button');
        button.textContent = i;
        button.classList.add('pagination-button');
        if (i === currentPage) {
            button.classList.add('active');
        }
        button.addEventListener('click', () => {
            currentPage = i;
            displayFilteredEmployees(getEmployeesForPage(filteredEmployees, currentPage));
            setupPaginationForFilteredEmployees(filteredEmployees);
        });
        paginationContainer.appendChild(button);
    }

    if (currentPage < totalPages) {
        const nextButton = document.createElement('button');
        nextButton.textContent = 'Siguiente';
        nextButton.classList.add('pagination-button');
        nextButton.addEventListener('click', () => {
            currentPage++;
            displayFilteredEmployees(getEmployeesForPage(filteredEmployees, currentPage));
            setupPaginationForFilteredEmployees(filteredEmployees);
        });
        paginationContainer.appendChild(nextButton);
    }
}

function getEmployeesForPage(filteredEmployees, page) {
    const startIndex = (page - 1) * recordsPerPage;
    const endIndex = startIndex + recordsPerPage;
    return filteredEmployees.slice(startIndex, endIndex);
}
