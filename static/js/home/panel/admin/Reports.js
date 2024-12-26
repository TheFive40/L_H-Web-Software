const reportsApiUrl = '/api/report'; // URL base para reportes
const usersApiUrl = '/api/user/usuarios'; // URL base para obtener empleados
const currentUserApiUrl = '/api/user/current-user'; // Endpoint para el usuario actual

document.addEventListener('DOMContentLoaded', () => {
    loadEmployeesIntoSelect(); // Cargar empleados al iniciar la página
    document.getElementById('filter-form').addEventListener('submit', generateReport);
    document.getElementById('export-btn').addEventListener('click', exportToExcel);
    loadCurrentUser()
});

// Cargar empleados dinámicamente en el combo
function loadEmployeesIntoSelect() {
    fetch(usersApiUrl)
        .then(response => response.json())
        .then(data => {
            if (data.status === 'success') {
                const employees = data.data;
                const employeeSelect = document.getElementById('employee');
                employees.forEach(emp => {
                    const option = document.createElement('option');
                    option.value = emp.id; // ID del empleado
                    option.textContent = emp.nombre_completo; // Nombre completo del empleado
                    employeeSelect.appendChild(option);
                });
            } else {
                Swal.fire({
                    icon: 'error',
                    title: 'Error al cargar empleados',
                    text: data.message || 'No se pudieron cargar los empleados.',
                });
            }
        })
        .catch(error => {
            console.error('Error al cargar empleados:', error);
            Swal.fire({
                icon: 'error',
                title: 'Error de conexión',
                text: 'No se pudieron cargar los empleados. Verifica la conexión con el servidor.',
            });
        });
}

function generateReport(event) {
    event.preventDefault();

    const startDate = document.getElementById('start-date').value;
    const endDate = document.getElementById('end-date').value;
    const employeeId = document.getElementById('employee').value;

    const params = new URLSearchParams();
    if (startDate) params.append('start_date', startDate);
    if (endDate) params.append('end_date', endDate);
    if (employeeId) params.append('employee', employeeId);

    fetch(`${reportsApiUrl}/reports?${params.toString()}`)
        .then(response => response.json())
        .then(data => {
            if (data.status === 'success') {
                displayReportResults(data.data);
            } else {
                Swal.fire({
                    icon: 'error',
                    title: 'Error al generar reporte',
                    text: data.message || 'No se pudo generar el reporte.',
                });
            }
        })
        .catch(error => {
            console.error('Error al generar reporte:', error);
            Swal.fire({
                icon: 'error',
                title: 'Error de conexión',
                text: 'Hubo un problema al generar el reporte. Intenta nuevamente.',
            });
        });
}

function displayReportResults(reports) {
    const tableBody = document.getElementById('reports-table');
    tableBody.innerHTML = ''; // Limpiar contenido previo

    if (reports.length === 0) {
        const noDataRow = document.createElement('tr');
        noDataRow.innerHTML = `<td colspan="6" style="text-align:center;">No se encontraron resultados</td>`;
        tableBody.appendChild(noDataRow);
        return;
    }

    reports.forEach(report => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${report.empleado}</td>
            <td>${report.fecha}</td>
            <td>${report.hora_entrada}</td>
            <td>${report.hora_salida}</td>
            <td>${report.horas_totales}</td>
            <td>${report.horas_extras}</td>
        `;
        tableBody.appendChild(row);
    });
}

let currentUser = {}; // Objeto para almacenar los datos del usuario actual

function loadCurrentUser() {
    fetch(currentUserApiUrl)
        .then(response => response.json())
        .then(data => {
            if (data.status === 'success') {
                currentUser = data.data; // Guardar los datos del usuario actual
            } else {
                Swal.fire({
                    icon: 'error',
                    title: 'Error al cargar usuario actual',
                    text: data.message || 'No se pudo cargar el usuario actual.',
                });
            }
        })
        .catch(error => {
            console.error('Error al cargar usuario actual:', error);
            Swal.fire({
                icon: 'error',
                title: 'Error de conexión',
                text: 'No se pudo cargar el usuario actual. Verifica la conexión con el servidor.',
            });
        });
}

async function exportToExcel() {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Reporte Detallado');

    // Estilos de colores
    const titleColor = '1F4E78'; // Azul oscuro
    const headerColor = '4F81BD'; // Azul intermedio
    const subHeaderColor = 'D9E1F2'; // Azul claro
    const borderColor = 'BFBFBF'; // Gris para bordes

    // Estilos de fuente y alineación
    const boldFont = { name: 'Arial', size: 12, bold: true };
    const titleFont = { name: 'Arial', size: 16, bold: true, color: { argb: 'FFFFFF' } };
    const subtitleFont = { name: 'Arial', size: 12, italic: true, color: { argb: 'FFFFFF' } };
    const centeredAlignment = { vertical: 'middle', horizontal: 'center' };

    // Obtener información del empleado seleccionado
    const selectedEmployeeId = document.getElementById('employee').value || 'N/A';
    const selectedEmployeeName = document.getElementById('employee').selectedOptions[0]?.textContent || 'Todos';
    let selectedEmployeeEmail = 'N/A';

    if (selectedEmployeeId !== 'N/A') {
        try {
            const response = await fetch(`/api/user/usuarios/${selectedEmployeeId}`);
            if (response.ok) {
                const data = await response.json();
                console.log('Respuesta del servidor:', data); // Verificar formato
                if (data.status === 'success' && data.data?.correo) {
                    selectedEmployeeEmail = data.data.correo; // Asignar correo si existe
                } else {
                    console.error(`No se pudo obtener el correo del empleado. Respuesta:`, data);
                }
            } else {
                console.error(
                    `Error al obtener datos del empleado: ${response.status} ${response.statusText}`
                );
            }
        } catch (error) {
            console.error('Error al conectar con el backend:', error);
        }
    }


    // Título principal
    worksheet.mergeCells('A1:F1');
    const titleRow = worksheet.getCell('A1');
    titleRow.value = 'L&H Distribuciones S.A.S';
    titleRow.font = titleFont;
    titleRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: titleColor } };
    titleRow.alignment = centeredAlignment;

    // Subtítulo
    worksheet.mergeCells('A2:F2');
    const subtitleRow = worksheet.getCell('A2');
    subtitleRow.value = 'Reporte Detallado de Desempeño de Empleados';
    subtitleRow.font = subtitleFont;
    subtitleRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: titleColor } };
    subtitleRow.alignment = centeredAlignment;

    // Fecha de generación
    worksheet.mergeCells('A3:F3');
    const dateRow = worksheet.getCell('A3');
    dateRow.value = `Generado el ${new Date().toLocaleDateString()} a las ${new Date().toLocaleTimeString()}`;
    dateRow.font = { name: 'Arial', size: 10, italic: true };
    dateRow.alignment = centeredAlignment;

    // Espacio en blanco
    worksheet.addRow([]);

    // Información del usuario actual
    worksheet.addRow(['Generado por:', 'Nombre', 'Correo', 'Cargo']).eachCell((cell) => {
        cell.font = boldFont;
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: subHeaderColor } };
        cell.border = {
            top: { style: 'thin', color: { argb: borderColor } },
            left: { style: 'thin', color: { argb: borderColor } },
            bottom: { style: 'thin', color: { argb: borderColor } },
            right: { style: 'thin', color: { argb: borderColor } },
        };
    });

    worksheet.addRow([
        '',
        currentUser.nombre_completo || 'N/A',
        currentUser.correo || 'N/A',
        currentUser.cargo || 'N/A',
    ]).eachCell((cell) => {
        cell.border = {
            top: { style: 'thin', color: { argb: borderColor } },
            left: { style: 'thin', color: { argb: borderColor } },
            bottom: { style: 'thin', color: { argb: borderColor } },
            right: { style: 'thin', color: { argb: borderColor } },
        };
    });

    // Información del empleado seleccionado
    worksheet.addRow([]);
    worksheet.addRow(['Empleado:', 'Nombre', 'Correo', 'ID']).eachCell((cell) => {
        cell.font = boldFont;
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: subHeaderColor } };
        cell.border = {
            top: { style: 'thin', color: { argb: borderColor } },
            left: { style: 'thin', color: { argb: borderColor } },
            bottom: { style: 'thin', color: { argb: borderColor } },
            right: { style: 'thin', color: { argb: borderColor } },
        };
    });

    worksheet.addRow([
        '',
        selectedEmployeeName,
        selectedEmployeeEmail,
        selectedEmployeeId,
    ]).eachCell((cell) => {
        cell.border = {
            top: { style: 'thin', color: { argb: borderColor } },
            left: { style: 'thin', color: { argb: borderColor } },
            bottom: { style: 'thin', color: { argb: borderColor } },
            right: { style: 'thin', color: { argb: borderColor } },
        };
    });

    // Espacio en blanco
    worksheet.addRow([]);

    // Encabezados de la tabla
    const headers = [
        'Empleado',
        'Fecha',
        'Hora Entrada',
        'Hora Salida',
        'Horas Totales',
        'Horas Extras',
    ];
    worksheet.addRow(headers).eachCell((cell) => {
        cell.font = boldFont;
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: headerColor } };
        cell.alignment = centeredAlignment;
        cell.border = {
            top: { style: 'thin', color: { argb: borderColor } },
            left: { style: 'thin', color: { argb: borderColor } },
            bottom: { style: 'thin', color: { argb: borderColor } },
            right: { style: 'thin', color: { argb: borderColor } },
        };
    });

    // Datos de la tabla
    const tableRows = Array.from(document.querySelectorAll('#reports-table tr')).map(row => {
        return Array.from(row.querySelectorAll('td')).map(cell => cell.textContent.trim());
    });

    tableRows.forEach(row => {
        const excelRow = worksheet.addRow(row);
        excelRow.eachCell((cell) => {
            cell.alignment = centeredAlignment;
            cell.border = {
                top: { style: 'thin', color: { argb: borderColor } },
                left: { style: 'thin', color: { argb: borderColor } },
                bottom: { style: 'thin', color: { argb: borderColor } },
                right: { style: 'thin', color: { argb: borderColor } },
            };
        });
    });

    // Ajustar ancho de columnas automáticamente
    worksheet.columns.forEach(column => {
        column.width = 20;
    });

    // Descargar archivo
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/octet-stream' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'Reporte_LH_Distribuciones.xlsx';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
}
