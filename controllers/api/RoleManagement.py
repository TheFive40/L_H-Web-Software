from flask import Blueprint, jsonify, request
from sqlalchemy.exc import SQLAlchemyError
from model.db import db
from model.entities.Tables import Role

role_management = Blueprint('role_management', __name__)


@role_management.route('/all', methods=['GET'])
def get_all_roles():
    try:
        roles = db.session.query(Role).all()
        result = [{"id": role.id, "name": role.nombre, "description": role.descripcion} for role in roles]
        return jsonify({"status": "success", "data": result}), 200
    except SQLAlchemyError as e:
        return jsonify({"status": "error", "message": str(e)}), 500


@role_management.route('/add', methods=['POST'])
def add_role():
    try:
        data = request.json
        if not data or not "name" in data:
            return jsonify({"status": "error", "message": "Invalid data"}), 400

        new_role = Role(nombre=data['name'], descripcion=data.get('description', None))
        db.session.add(new_role)
        db.session.commit()
        return jsonify({"status": "success", "message": "Role added successfully"}), 201
    except SQLAlchemyError as e:
        return jsonify({"status": "error", "message": str(e)}), 500


@role_management.route('/update/<int:role_id>', methods=['PUT'])
def update_role(role_id):
    try:
        data = request.json
        role = db.session.query(Role).filter_by(id=role_id).first()
        if not role:
            return jsonify({"status": "error", "message": "Role not found"}), 404

        role.nombre = data.get('name', role.nombre)
        role.descripcion = data.get('description', role.descripcion)
        db.session.commit()
        return jsonify({"status": "success", "message": "Role updated successfully"}), 200
    except SQLAlchemyError as e:
        return jsonify({"status": "error", "message": str(e)}), 500


@role_management.route('/delete/<int:role_id>', methods=['DELETE'])
def delete_role(role_id):
    try:
        role = db.session.query(Role).filter_by(id=role_id).first()
        if not role:
            return jsonify({"status": "error", "message": "Role not found"}), 404

        db.session.delete(role)
        db.session.commit()
        return jsonify({"status": "success", "message": "Role deleted successfully"}), 200
    except SQLAlchemyError as e:
        return jsonify({"status": "error", "message": str(e)}), 500


@role_management.route('/gohan/<string:message>', methods=['GET'])
def gohan(message):
    return jsonify({"status": "success", "message": "Mensaje recibido desde el servidor"}), 200
