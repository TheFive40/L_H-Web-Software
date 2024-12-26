from flask import Blueprint, jsonify, request
from sqlalchemy.exc import SQLAlchemyError
from model.entities.Tables import WorkRecord, User
from model.db import db
from datetime import datetime

work_records = Blueprint('work_records', __name__)

# Obtener todos los registros de trabajo con búsqueda y filtros
@work_records.route('/all', methods=['GET'])
def get_all_records():
    try:
        usuario_id = request.args.get('usuario_id')
        fecha_inicio = request.args.get('fecha_inicio')
        fecha_fin = request.args.get('fecha_fin')

        query = db.session.query(WorkRecord).join(User)

        # Filtrar por usuario_id si está presente
        if usuario_id:
            query = query.filter(WorkRecord.usuario_id == usuario_id)

        # Filtrar por rango de fechas si están presentes
        if fecha_inicio and fecha_fin:
            query = query.filter(WorkRecord.fecha.between(fecha_inicio, fecha_fin))

        records = query.all()

        result = [
            {
                "id": record.id,
                "user": record.usuario.nombre_completo,
                "date": record.fecha.strftime('%Y-%m-%d'),
                "check_in": record.hora_entrada.strftime('%H:%M:%S'),
                "check_out": record.hora_salida.strftime('%H:%M:%S') if record.hora_salida else None,
                "extra_hours": float(record.horas_extras)
            } for record in records
        ]

        return jsonify({"status": "success", "data": result}), 200
    except SQLAlchemyError as e:
        return jsonify({"status": "error", "message": str(e)}), 500

# Agregar un nuevo registro
@work_records.route('/add', methods=['POST'])
def add_work_record():
    try:
        data = request.json
        if not all(key in data for key in ('usuario_id', 'fecha', 'hora_entrada')):
            return jsonify({"status": "error", "message": "Faltan datos obligatorios."}), 400

        usuario_id = data['usuario_id']
        fecha = data['fecha']
        hora_entrada = data['hora_entrada']

        # Validar si ya existe un registro para ese usuario en la fecha indicada
        existing_record = db.session.query(WorkRecord).filter_by(usuario_id=usuario_id, fecha=fecha).first()
        if existing_record:
            return jsonify({"status": "error", "message": "Ya existe un registro de entrada para este día."}), 400

        # Crear un nuevo registro
        new_record = WorkRecord(
            usuario_id=usuario_id,
            fecha=fecha,
            hora_entrada=hora_entrada,
            horas_extras=0  # Inicialmente 0
        )
        db.session.add(new_record)
        db.session.commit()

        return jsonify({"status": "success", "message": "Entrada registrada con éxito."}), 201

    except SQLAlchemyError as e:
        db.session.rollback()
        return jsonify({"status": "error", "message": f"Error en la base de datos: {str(e)}"}), 500

# Actualizar un registro existente
@work_records.route('/update/<int:record_id>', methods=['PUT'])
def update_record(record_id):
    try:
        data = request.json
        record = db.session.query(WorkRecord).filter_by(id=record_id).first()
        if not record:
            return jsonify({"status": "error", "message": "Registro no encontrado."}), 404

        record.hora_entrada = data.get('hora_entrada', record.hora_entrada)
        record.hora_salida = data.get('hora_salida', record.hora_salida)
        record.horas_extras = data.get('horas_extras', record.horas_extras)

        db.session.commit()
        return jsonify({"status": "success", "message": "Registro actualizado con éxito."}), 200
    except SQLAlchemyError as e:
        db.session.rollback()
        return jsonify({"status": "error", "message": str(e)}), 500

# Eliminar un registro por ID
@work_records.route('/delete/<int:record_id>', methods=['DELETE'])
def delete_record(record_id):
    try:
        record = db.session.query(WorkRecord).filter_by(id=record_id).first()
        if not record:
            return jsonify({"status": "error", "message": "Registro no encontrado."}), 404

        db.session.delete(record)
        db.session.commit()
        return jsonify({"status": "success", "message": "Registro eliminado con éxito."}), 200
    except SQLAlchemyError as e:
        db.session.rollback()
        return jsonify({"status": "error", "message": str(e)}), 500

# Obtener historial de asistencia para un usuario específico
@work_records.route('/history/<int:usuario_id>', methods=['GET'])
def get_user_history(usuario_id):
    try:
        records = db.session.query(WorkRecord).filter_by(usuario_id=usuario_id).all()
        if not records:
            return jsonify({"status": "error", "message": "No se encontraron registros."}), 404

        result = [
            {
                "date": record.fecha.strftime('%Y-%m-%d'),
                "check_in": record.hora_entrada.strftime('%H:%M:%S'),
                "check_out": record.hora_salida.strftime('%H:%M:%S') if record.hora_salida else None,
                "extra_hours": float(record.horas_extras)
            } for record in records
        ]

        return jsonify({"status": "success", "data": result}), 200
    except SQLAlchemyError as e:
        return jsonify({"status": "error", "message": str(e)}), 500
