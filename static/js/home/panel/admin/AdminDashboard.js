document.addEventListener("DOMContentLoaded", () => {
    const profilePicture = document.querySelector(".profile-picture");
    const userNameElement = document.querySelector(".user-name");
    const userRoleElement = document.querySelector(".user-role");
    const logoutButton = document.querySelector(".btn-logout");

    const currentUserApiUrl = "/api/user/current-user";

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
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ foto_perfil: base64Image }),
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

    // Cerrar sesión
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
                    fetch("/api/auth/logout", { method: "POST" })
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

    // Cargar usuario actual al inicio
    loadCurrentUser();
});
