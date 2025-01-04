let filteredRecords = [];
document.addEventListener("DOMContentLoaded", () => {
    const profilePicture = document.querySelector(".profile-picture");
    const userNameElement = document.querySelector(".user-name");
    const userRoleElement = document.querySelector(".user-role");
    const logoutButton = document.querySelector(".btn-logout");
    const currentUserApiUrl = "/api/user/current-user";
    const recordsTable = document.getElementById("records-table");
    const recordsPerPage = 7; // Registros por página
    let currentPage = 1; // Página actual
    let totalRecords = 0; // Total de registros
    let records = []; // Almacena todos los registros
    const paginationContainer = document.getElementById("pagination");
    const apiEndpoints = {
        getAllRecords: "/api/work-records/all",
        deleteRecord: "/api/work-records/delete",
        updateRecord: "/api/work-records/update"
    };

    function decimalToTime(decimalHours) {
        const hours = Math.floor(decimalHours); // Parte entera (horas)
        const minutes = Math.round((decimalHours - hours) * 60); // Parte decimal convertida a minutos
        return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`; // Formato hh:mm
    }

    // Cargar datos del usuario actual desde el backend
    async function loadCurrentUser() {
        try {
            const response = await fetch(currentUserApiUrl);
            const userData = await response.json();

            if (userData.status === "success") {
                const currentUser = userData.data;

                // Mostrar el nombre del usuario
                userNameElement.textContent = currentUser.nombre_completo || "Usuario Desconocido";

                // Mostrar el rol del usuario
                userRoleElement.textContent = currentUser.cargo || "Rol no asignado";

                // Mostrar la foto de perfil
                if (currentUser.foto_perfil) {
                    profilePicture.src = `data:image/png;base64,${currentUser.foto_perfil}`;
                } else {
                    profilePicture.src = "/static/images/default-profile.png"; // Imagen por defecto
                }

                // Almacenar el ID del usuario en el elemento de la foto
                profilePicture.dataset.userId = currentUser.id;
            } else {
                console.error("Error al obtener usuario actual:", userData.message);
                userNameElement.textContent = "Usuario Desconocido";
                userRoleElement.textContent = "Rol no asignado";
                profilePicture.src = "/static/images/default-profile.png"; // Imagen por defecto
            }
        } catch (error) {
            console.error("Error al cargar el usuario actual:", error);
            userNameElement.textContent = "Usuario Desconocido";
            userRoleElement.textContent = "Rol no asignado";
            profilePicture.src = "/static/images/default-profile.png"; // Imagen por defecto
        }
    }

    // Actualizar la foto de perfil
    async function updateProfilePicture(userId, base64Image) {
        try {
            const response = await fetch(`/api/user/usuarios/${userId}`, {
                method: "PUT",
                headers: {"Content-Type": "application/json"},
                body: JSON.stringify({foto_perfil: base64Image}),
            });

            const data = await response.json();
            if (data.message === "Usuario actualizado exitosamente") {
                Swal.fire({
                    icon: "success",
                    title: "Foto de perfil actualizada",
                    text: "Tu foto de perfil se ha actualizado correctamente.",
                });
                profilePicture.src = `data:image/png;base64,${base64Image}`;
            } else {
                Swal.fire({
                    icon: "error",
                    title: "Error",
                    text: data.message || "No se pudo actualizar la foto de perfil.",
                });
            }
        } catch (error) {
            console.error("Error al actualizar la foto de perfil:", error);
            Swal.fire({
                icon: "error",
                title: "Error de conexión",
                text: "Hubo un problema al actualizar tu foto de perfil. Intenta nuevamente.",
            });
        }
    }

    function convertImageToBase64(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result.split(",")[1]); // Base64 sin el encabezado
            reader.onerror = (error) => reject(error);
            reader.readAsDataURL(file);
        });
    }

    // Evento para cambiar la foto de perfil al hacer doble clic
    if (profilePicture) {
        profilePicture.addEventListener("dblclick", async () => {
            const fileInput = document.createElement("input");
            fileInput.type = "file";
            fileInput.accept = "image/*";

            fileInput.addEventListener("change", async (event) => {
                const file = event.target.files[0];
                if (file) {
                    try {
                        const base64Image = await convertImageToBase64(file);
                        const userId = profilePicture.dataset.userId;
                        await updateProfilePicture(userId, base64Image);
                    } catch (error) {
                        console.error("Error al procesar la imagen:", error);
                        Swal.fire({
                            icon: "error",
                            title: "Error",
                            text: "No se pudo procesar la imagen. Intenta nuevamente.",
                        });
                    }
                }
            });

            fileInput.click();
        });
    }
    if (logoutButton) {
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
                    fetch("/api/auth/logout", {method: "POST"})
                        .then((response) => {
                            if (response.ok) {
                                Swal.fire({
                                    icon: "success",
                                    title: "Sesión cerrada",
                                    text: "Tu sesión se cerró correctamente.",
                                }).then(() => {
                                    window.location.href = "/"; // Redirigir al inicio o página de login
                                });
                            } else {
                                Swal.fire({
                                    icon: "error",
                                    title: "Error al cerrar sesión",
                                    text: "Hubo un problema al cerrar tu sesión. Intenta nuevamente.",
                                });
                            }
                        })
                        .catch((error) => {
                            console.error("Error al cerrar sesión:", error);
                            Swal.fire({
                                icon: "error",
                                title: "Error de conexión",
                                text: "No se pudo cerrar la sesión. Intenta nuevamente.",
                            });
                        });
                }
            });
        });
    }

    function renderPagination() {
        const totalPages = Math.ceil(filteredRecords.length / recordsPerPage); // Usar registros filtrados
        paginationContainer.innerHTML = ""; // Limpiar paginador

        const maxVisibleButtons = 5; // Máximo de botones visibles
        const halfRange = Math.floor(maxVisibleButtons / 2);

        let startPage = Math.max(currentPage - halfRange, 1);
        let endPage = Math.min(startPage + maxVisibleButtons - 1, totalPages);

        if (endPage - startPage + 1 < maxVisibleButtons) {
            startPage = Math.max(endPage - maxVisibleButtons + 1, 1);
        }

        // Botón "Anterior"
        const prevButton = document.createElement("button");
        prevButton.textContent = "Anterior";
        prevButton.disabled = currentPage === 1;
        prevButton.addEventListener("click", () => {
            currentPage--;
            renderPagination();
            renderPage(currentPage, filteredRecords); // Pasar registros filtrados
        });
        paginationContainer.appendChild(prevButton);

        // Botones de números
        for (let i = startPage; i <= endPage; i++) {
            const pageButton = document.createElement("button");
            pageButton.textContent = i;
            pageButton.classList.toggle("active", i === currentPage);
            pageButton.addEventListener("click", () => {
                currentPage = i;
                renderPagination();
                renderPage(currentPage, filteredRecords); // Pasar registros filtrados
            });
            paginationContainer.appendChild(pageButton);
        }

        // Botón "Siguiente"
        const nextButton = document.createElement("button");
        nextButton.textContent = "Siguiente";
        nextButton.disabled = currentPage === totalPages;
        nextButton.addEventListener("click", () => {
            currentPage++;
            renderPagination();
            renderPage(currentPage, filteredRecords); // Pasar registros filtrados
        });
        paginationContainer.appendChild(nextButton);
    }

    function filterByName(records, nameFilter) {
        return nameFilter
            ? records.filter(record => record.user.toLowerCase().trim().includes(nameFilter.toLowerCase().trim()))
            : records;
    }

    function filterByDate(records, dateFilter) {
        return dateFilter
            ? records.filter(record => record.date === dateFilter)
            : records;
    }

    function filterByExtraHours(records, extraHoursFilter) {
        if (isNaN(extraHoursFilter) || extraHoursFilter <= 0) return records; // Si no hay filtro válido, devolver todos los registros

        return records.filter(record => {
            const extraHours = record.extra_hours || 0; // Asegurar que extra_hours tenga un valor numérico
            return extraHours === extraHoursFilter;
        });
    }


    function applyFilters() {
        const nameFilter = document.getElementById("filter-name").value.trim().toLowerCase();
        const extraHoursFilter = parseFloat(document.getElementById("filter-hours").value || 0);
        const dateFilter = document.getElementById("filter-date").value;

        let filtered = records; // Iniciar con todos los registros

        // Aplicar filtros
        filtered = filterByName(filtered, nameFilter); // Filtrar por nombre
        filtered = filterByDate(filtered, dateFilter); // Filtrar por fecha
        filtered = filterByExtraHours(filtered, extraHoursFilter); // Filtrar por horas extras

        // Actualizar registros filtrados y reiniciar paginación
        filteredRecords = filtered;
        if (filteredRecords.length === 0) {
            recordsTable.innerHTML = `<tr><td colspan="8" style="text-align: center; color: red;">No se encontraron registros con los filtros aplicados.</td></tr>`;
            paginationContainer.innerHTML = ""; // Limpiar paginación
        } else {
            currentPage = 1; // Reiniciar a la primera página
            renderPagination();
            renderPage(currentPage, filteredRecords);
        }
    }

    function makeCellsEditable() {
        const tableCells = document.querySelectorAll("#records-table td[data-field]");

        tableCells.forEach(cell => {
            cell.addEventListener("dblclick", () => {
                if (!cell.hasAttribute("contenteditable")) {
                    cell.setAttribute("contenteditable", "true");
                    cell.focus();
                }
            });
        });
    }



    function clearFilters() {
        document.getElementById("filter-name").value = "";
        document.getElementById("filter-hours").value = "";
        document.getElementById("filter-date").value = "";

        filteredRecords = [...records]; // Restaurar todos los registros
        currentPage = 1; // Reiniciar a la primera página
        renderPagination();
        renderPage(currentPage, filteredRecords);
    }


    async function loadRecords() {
        try {
            const response = await fetch(apiEndpoints.getAllRecords);
            const data = await response.json();

            if (data.status === "success") {
                records = data.data.sort((a, b) => new Date(b.date) - new Date(a.date)); // Ordenar por fecha descendente
                filteredRecords = [...records]; // Inicialmente, los registros filtrados son todos los registros
                renderPagination();
                renderPage(currentPage, filteredRecords);
            } else {
                console.error("Error al cargar registros:", data.message);
                recordsTable.innerHTML = `<tr><td colspan="7">No se pudieron cargar los registros.</td></tr>`;
            }
        } catch (error) {
            console.error("Error al cargar registros:", error);
            recordsTable.innerHTML = `<tr><td colspan="7">Error al cargar registros.</td></tr>`;
        }
    }

    function updateExtraHoursInTable(row, extraHours) {
        const extraHoursCell = row.querySelector('[data-field="extra_hours"]');
        if (extraHoursCell) {
            extraHoursCell.textContent = decimalToTime(extraHours); // Mostrar como hh:mm
        }
    }

    function calculateExtraHours(totalHours, standardHours = 8) {
        const [workedHours, workedMinutes] = totalHours.split(":").map(Number);
        const workedDecimal = workedHours + workedMinutes / 60;

        const extraHours = Math.max(0, workedDecimal - standardHours);
        return decimalToTime(extraHours); // Convertir a formato hh:mm
    }
    function calculateTotalHours(checkIn, checkOut) {
        if (!checkIn || !checkOut) return "00:00";

        const [checkInHours, checkInMinutes] = checkIn.split(":").map(Number);
        const [checkOutHours, checkOutMinutes] = checkOut.split(":").map(Number);

        // Convertir horas y minutos a minutos totales
        const checkInTotalMinutes = checkInHours * 60 + checkInMinutes;
        const checkOutTotalMinutes = checkOutHours * 60 + checkOutMinutes;

        const workedMinutes = checkOutTotalMinutes - checkInTotalMinutes;
        const workedHours = Math.floor(workedMinutes / 60);
        const remainingMinutes = workedMinutes % 60;

        return `${String(workedHours).padStart(2, "0")}:${String(remainingMinutes).padStart(2, "0")}`;
    }

    function addEventListenersToButtons() {
        const updateButtons = document.querySelectorAll(".btn-update");
        const deleteButtons = document.querySelectorAll(".btn-delete");

        updateButtons.forEach(button => {
            button.addEventListener("click", async () => {
                const recordId = button.dataset.id;
                const row = button.closest("tr");
                const updatedData = {};

                let checkIn, checkOut;

                row.querySelectorAll("td[data-field]").forEach(cell => {
                    const field = cell.dataset.field;
                    let value = cell.textContent.trim();

                    if (field === "check_in") checkIn = value;
                    if (field === "check_out") checkOut = value;

                    updatedData[field] = value;
                });

                // Recalcular horas totales y extras
                const totalHoursCell = row.querySelector("td[data-field='total_hours']");
                const extraHoursCell = row.querySelector("td[data-field='extra_hours']");

                if (checkIn && checkOut) {
                    const totalHours = calculateTotalHours(checkIn, checkOut);
                    const extraHours = calculateExtraHours(totalHours);

                    totalHoursCell.textContent = totalHours; // Actualizar horas totales
                    extraHoursCell.textContent = extraHours; // Actualizar horas extras
                    updatedData.total_hours = timeToDecimal(totalHours); // Guardar en formato decimal
                    updatedData.extra_hours = timeToDecimal(extraHours); // Guardar horas extras en decimal
                }

                console.log("Datos enviados al servidor:", updatedData);

                // Llamar a la API para actualizar
                try {
                    const response = await fetch(`/api/work-records/update/${recordId}`, {
                        method: "PUT",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify(updatedData),
                    });

                    const result = await response.json();
                    if (result.status === "success") {
                        Swal.fire("Actualizado", "El registro se actualizó correctamente.", "success");
                    } else {
                        Swal.fire("Error", result.message || "Error al actualizar el registro.", "error");
                    }
                } catch (error) {
                    Swal.fire("Error", "No se pudo actualizar el registro.", "error");
                }
            });
        });

        deleteButtons.forEach(button => {
            button.addEventListener("click", () => {
                const recordId = button.dataset.id;
                deleteRecord(recordId);
            });
        });
    }



    async function deleteRecord(recordId) {
        // Mostrar mensaje de confirmación
        const confirmation = await Swal.fire({
            title: "¿Estás seguro?",
            text: "Esta acción no se puede deshacer.",
            icon: "warning",
            showCancelButton: true,
            confirmButtonText: "Sí, eliminar",
            cancelButtonText: "Cancelar",
        });

        // Si el usuario confirma, proceder con la eliminación
        if (confirmation.isConfirmed) {
            try {
                const response = await fetch(`${apiEndpoints.deleteRecord}/${recordId}`, {
                    method: "DELETE",
                });

                const result = await response.json();
                if (result.status === "success") {
                    Swal.fire("Eliminado", "El registro se eliminó con éxito.", "success");
                    loadRecords(); // Recargar la tabla
                } else {
                    Swal.fire("Error", result.message, "error");
                }
            } catch (error) {
                console.error("Error al eliminar registro:", error);
                Swal.fire("Error", "No se pudo eliminar el registro.", "error");
            }
        } else {
            // Opción cancelar
            Swal.fire("Cancelado", "El registro no fue eliminado.", "info");
        }
    }

    async function updateRecord(recordId, updatedData) {
        try {
            const response = await fetch(`${apiEndpoints.updateRecord}/${recordId}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(updatedData),
            });

            const result = await response.json();
            if (result.status === "success") {
                Swal.fire("Actualizado", "El registro se actualizó con éxito.", "success");
                loadRecords(); // Recargar registros
            } else {
                Swal.fire("Error", result.message || "Error al actualizar el registro.", "error");
            }
        } catch (error) {
            console.error("Error en la actualización:", error);
            Swal.fire("Error", "No se pudo actualizar el registro. Revisa la consola para más detalles.", "error");
        }
    }

    function timeToDecimal(timeString) {
        const [hours, minutes] = timeString.split(":").map(Number);
        return hours + minutes / 60;
    }


    function renderPage(page, data) {
        recordsTable.innerHTML = ""; // Limpiar la tabla
        const startIndex = (page - 1) * recordsPerPage;
        const endIndex = startIndex + recordsPerPage;
        const pageRecords = data.slice(startIndex, endIndex); // Mostrar solo registros de la página actual

        if (pageRecords.length === 0) {
            recordsTable.innerHTML = `<tr><td colspan="8" style="text-align: center; color: red;">No hay registros para mostrar.</td></tr>`;
            return;
        }

        pageRecords.forEach(record => {
            const totalHours = calculateTotalHours(record.check_in, record.check_out); // Calcular horas totales
            const extraHours = calculateExtraHours(totalHours); // Calcular horas extras

            const row = document.createElement("tr");
            row.innerHTML = `
            <td>${record.id}</td>
            <td data-field="user" contenteditable="true">${record.user}</td>
            <td data-field="date">${record.date}</td>
            <td data-field="check_in" contenteditable="true">${record.check_in}</td>
            <td data-field="check_out" contenteditable="true">${record.check_out || "No registrado"}</td>
            <td data-field="total_hours">${totalHours}</td> <!-- Mostrar horas totales calculadas -->
            <td data-field="extra_hours">${extraHours}</td> <!-- Mostrar horas extras calculadas -->
            <td>
                <button class="btn-update" data-id="${record.id}">Actualizar</button>
                <button class="btn-delete" data-id="${record.id}">Eliminar</button>
            </td>
        `;
            recordsTable.appendChild(row);
        });

        makeCellsEditable(); // Hacer celdas editables
        addEventListenersToButtons(); // Añadir eventos a los botones
    }


    document.getElementById("filter-name").addEventListener("input", applyFilters);
    document.getElementById("filter-date").addEventListener("change", applyFilters);
    document.getElementById("filter-hours").addEventListener("input", applyFilters);
    document.getElementById("clear-filters").addEventListener("click", clearFilters);
    addEventListenersToButtons()
    loadRecords();
    loadCurrentUser();
});