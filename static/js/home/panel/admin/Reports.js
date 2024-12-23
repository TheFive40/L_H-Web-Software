document.getElementById('filter-form').addEventListener('submit', function (e) {
    e.preventDefault();

    const startDate = document.getElementById('start-date').value;
    const endDate = document.getElementById('end-date').value;
    const employee = document.getElementById('employee').value;

    fetch(`/admin/reports?start_date=${startDate}&end_date=${endDate}&employee=${employee}`)
        .then(response => response.json())
        .then(data => {
            const table = document.getElementById('reports-table');
            table.innerHTML = ''; // Limpiar tabla

            data.forEach(report => {
                const row = `
                    <tr>
                        <td>${report.empleado}</td>
                        <td>${report.fecha}</td>
                        <td>${report.horas_totales}</td>
                        <td>${report.horas_extras}</td>
                    </tr>
                `;
                table.innerHTML += row;
            });
        })
        .catch(error => console.error('Error:', error));
});
