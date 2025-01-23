from flask import Blueprint, request, jsonify
from model.db import db
from model.entities.Tables import User, WorkRecord
from sqlalchemy.sql import func, cast
from sqlalchemy.types import TIMESTAMP

reports_bp = Blueprint('reports_bp', __name__)


@reports_bp.route('/reports', methods=['GET'])
def get_reports():
    try:
        start_date = request.args.get('start_date')
        end_date = request.args.get('end_date')
        employee_id = request.args.get('employee')

        query = db.session.query(
            User.nombre_completo.label('empleado'),
            WorkRecord.fecha,
            WorkRecord.hora_entrada,
            WorkRecord.hora_salida,
            WorkRecord.horas_extras,
            func.sum(
                func.extract(
                    'epoch',
                    func.coalesce(
                        func.cast(WorkRecord.fecha + WorkRecord.hora_salida, TIMESTAMP),
                        func.now()
                    ) - func.cast(WorkRecord.fecha + WorkRecord.hora_entrada, TIMESTAMP)
                ) / 3600
            ).label('horas_totales')
        ).join(WorkRecord).group_by(User.id, WorkRecord.id)

        if start_date:
            query = query.filter(WorkRecord.fecha >= start_date)
        if end_date:
            query = query.filter(WorkRecord.fecha <= end_date)
        if employee_id:
            query = query.filter(WorkRecord.usuario_id == int(employee_id))

        results = query.all()

        response = [
            {
                "empleado": row.empleado,
                "fecha": row.fecha.strftime('%Y-%m-%d'),
                "hora_entrada": row.hora_entrada.strftime('%H:%M'),
                "hora_salida": row.hora_salida.strftime('%H:%M') if row.hora_salida else 'No registrada',
                "horas_totales": round(row.horas_totales, 2) if row.horas_totales else 0,
                "horas_extras": float(row.horas_extras) if row.horas_extras else 0
            }
            for row in results
        ]

        return jsonify({"status": "success", "data": response}), 200
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500