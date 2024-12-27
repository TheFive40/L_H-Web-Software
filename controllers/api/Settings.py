from flask import Blueprint, jsonify, request
from sqlalchemy.exc import SQLAlchemyError
from model.db import db
from model.entities.Tables import Configuration

settings = Blueprint('settings', __name__)


# Obtener todas las configuraciones
@settings.route('/all', methods=['GET'])
def get_all_settings():
    try:
        configs = db.session.query(Configuration).all()
        result = [{"id": config.id, "key": config.clave, "value": config.valor, "description": config.descripcion} for
                  config in configs]
        return jsonify({"status": "success", "data": result}), 200
    except SQLAlchemyError as e:
        return jsonify({"status": "error", "message": str(e)}), 500


# Actualizar o agregar una configuración
@settings.route('/update', methods=['POST'])
def update_setting():
    try:
        data = request.json
        if not data or not "key" in data:
            return jsonify({"status": "error", "message": "Invalid data"}), 400

        config = db.session.query(Configuration).filter_by(clave=data['key']).first()
        if not config:
            config = Configuration(clave=data['key'], valor=data['value'], descripcion=data.get('description', None))
            db.session.add(config)
        else:
            config.valor = data['value']
            config.descripcion = data.get('description', config.descripcion)

        db.session.commit()
        return jsonify({"status": "success", "message": "Configuration updated successfully"}), 200
    except SQLAlchemyError as e:
        return jsonify({"status": "error", "message": str(e)}), 500


# Eliminar una configuración
@settings.route('/delete/<string:key>', methods=['DELETE'])
def delete_setting(key):
    try:
        config = db.session.query(Configuration).filter_by(clave=key).first()
        if not config:
            return jsonify({"status": "error", "message": "Configuration not found"}), 404

        db.session.delete(config)
        db.session.commit()
        return jsonify({"status": "success", "message": "Configuration deleted successfully"}), 200
    except SQLAlchemyError as e:
        return jsonify({"status": "error", "message": str(e)}), 500
