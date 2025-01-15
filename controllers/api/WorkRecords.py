from flask import Blueprint, jsonify, request
from flask import Blueprint, jsonify, request
from sqlalchemy.exc import SQLAlchemyError
from model.entities.Tables import WorkRecord, User, Configuration
from model.db import db

work_records = Blueprint('work_records', __name__)

@work_records.route('/all', methods=['GET'])
def get_all_records():
    try:
        records = db.session.query(WorkRecord).join(User).all()
        result = [
            {
                "id": record.id,
                "user": record.usuario.nombre_completo,
                "date": record.fecha.strftime('%Y-%m-%d'),
                "check_in": record.hora_entrada.strftime('%H:%M:%S'),
                "check_out": record.hora_salida.strftime('%H:%M:%S') if record.hora_salida else None,
                "extra_hours": float(record.horas_extras) if record.horas_extras is not None else 0.0
            } for record in records
        ]
        return jsonify({"status": "success", "data": result}), 200
    except SQLAlchemyError as e:
        return jsonify({"status": "error", "message": str(e)}), 500


@work_records.route('/add', methods=['POST'])
def add_work_record():
    """
    Registrar entrada de trabajo.
    """
    try:
        # Obtener los datos del request
        data = request.json
        if not all(key in data for key in ('usuario_id', 'fecha', 'hora_entrada')):
            return jsonify({"status": "error", "message": "Faltan datos obligatorios."}), 400

        usuario_id = data['usuario_id']
        fecha = data['fecha']
        hora_entrada = data['hora_entrada']

        # Buscar si ya existe un registro para este usuario en la fecha indicada
        existing_record = db.session.query(WorkRecord).filter_by(usuario_id=usuario_id, fecha=fecha).first()
        if existing_record:
            return jsonify({"status": "error", "message": "Ya existe un registro de entrada para hoy."}), 400

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
        db.session.rollback()  # Si hay un error, deshacer la transacción
        return jsonify({"status": "error", "message": f"Error en la base de datos: {str(e)}"}), 500


@work_records.route('/update/<int:record_id>', methods=['PUT'])
def update_record(record_id):
    try:
        data = request.json

        # Buscar el registro en la base de datos
        record = db.session.query(WorkRecord).filter_by(id=record_id).first()
        if not record:
            return jsonify({"status": "error", "message": "Registro no encontrado"}), 404

        # Validar y asignar fecha
        if 'date' in data:
            record.fecha = data['date']

        # Validar y asignar hora_entrada
        record.hora_entrada = data.get('check_in', record.hora_entrada)

        # Validar y asignar hora_salida (usar None si es "No registrado")
        hora_salida = data.get('check_out')
        if hora_salida == "No registrado" or not hora_salida:
            record.hora_salida = None
        else:
            record.hora_salida = hora_salida

        # Validar y asignar horas_extras
        record.horas_extras = data.get('extra_hours', record.horas_extras)

        # Confirmar cambios
        db.session.commit()
        return jsonify({"status": "success", "message": "Registro actualizado correctamente"}), 200

    except SQLAlchemyError as e:
        db.session.rollback()
        return jsonify({"status": "error", "message": str(e)}), 500


@work_records.route('/delete/<int:record_id>', methods=['DELETE'])
def delete_record(record_id):
    try:
        record = db.session.query(WorkRecord).filter_by(id=record_id).first()
        if not record:
            return jsonify({"status": "error", "message": "Record not found"}), 404

        db.session.delete(record)
        db.session.commit()
        return jsonify({"status": "success", "message": "Work record deleted successfully"}), 200
    except SQLAlchemyError as e:
        db.session.rollback()
        return jsonify({"status": "error", "message": str(e)}), 500


# Obtener historial de asistencia para un usuario
@work_records.route('work/history/<int:user_id>', methods=['GET'])
def get_user_history(user_id):
    try:
        records = db.session.query(WorkRecord).filter_by(usuario_id=user_id).all()
        if not records:
            return jsonify({"status": "error", "message": "No attendance records found."}), 404

        result = [
            {
                "date": record.fecha.strftime('%Y-%m-%d'),
                "check_in": record.hora_entrada.strftime('%H:%M:%S'),
                "check_out": record.hora_salida.strftime('%H:%M:%S') if record.hora_salida else None
            }
            for record in records
        ]
        return jsonify({"status": "success", "records": result}), 200
    except SQLAlchemyError as e:
        return jsonify({"status": "error", "message": str(e)}), 500


@work_records.route("/work/end/<int:usuario_id>", methods=["PUT"])
def end_work(usuario_id):
    """
    Registrar la hora de salida y calcular horas extras según configuración.
    """
    try:
        from datetime import date, datetime

        # Fecha actual
        today = date.today()

        # Obtener el valor de las horas de jornada laboral desde la configuración
        jornada_laboral = get_config_value('horas_jornada_laboral', default=8)

        # Buscar el registro de trabajo del día actual para este usuario
        record = db.session.query(WorkRecord).filter_by(usuario_id=usuario_id, fecha=today).first()
        if not record:
            return jsonify({"status": "error", "message": "No se encontró un registro de entrada para hoy."}), 404

        # Verificar si ya se registró la salida
        if record.hora_salida:
            return jsonify({"status": "error", "message": "La salida ya fue registrada."}), 400

        # Registrar la hora de salida actual
        record.hora_salida = datetime.now().time()

        # Calcular horas extras
        if record.hora_entrada:
            tiempo_trabajado = datetime.combine(today, record.hora_salida) - datetime.combine(today,
                                                                                              record.hora_entrada)
            horas_trabajadas = tiempo_trabajado.total_seconds() / 3600
            record.horas_extras = max(0, horas_trabajadas - jornada_laboral)  # Calcular extras según la configuración

        # Guardar los cambios en la base de datos
        db.session.commit()

        return jsonify({"status": "success", "message": "Salida registrada con éxito."}), 200

    except SQLAlchemyError as e:
        db.session.rollback()  # Deshacer cambios en caso de error
        return jsonify({"status": "error", "message": f"Error en la base de datos: {str(e)}"}), 500


def get_config_value(key, default=None):
    """
    Obtener el valor de una configuración desde la base de datos.
    :param key: Clave de la configuración.
    :param default: Valor predeterminado si no se encuentra la configuración.
    :return: Valor de la configuración o valor predeterminado.
    """
    try:
        config = db.session.query(Configuration).filter_by(clave=key).first()
        if config:
            return float(config.valor)  # Asegúrate de convertirlo a un número flotante
        return default
    except SQLAlchemyError as e:
        print(f"Error al obtener configuración {key}: {e}")
        return default
