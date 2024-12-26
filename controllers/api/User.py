import base64
import os

from flask import Blueprint, jsonify, request, session
from werkzeug.security import generate_password_hash, check_password_hash
from sqlalchemy.exc import IntegrityError, SQLAlchemyError
from model.entities.Tables import User, Role
from model.db import db

user_bp = Blueprint('user_bp', __name__)


@user_bp.route('/usuarios', methods=['POST'])
def create_user():
    try:
        # Obtener datos del JSON
        data = request.json
        if not data or not all(key in data for key in ('nombre_completo', 'correo', 'contrasena', 'rol_id')):
            return jsonify({'status': 'error', 'message': 'Faltan campos obligatorios'}), 400

        # Guardar usuario con foto en Base64
        new_user = User(
            nombre_completo=data['nombre_completo'],
            correo=data['correo'],
            contrasena=generate_password_hash(data['contrasena']),
            foto_perfil=data.get('foto_perfil'),  # Almacena el Base64 tal cual
            rol_id=data['rol_id']
        )
        db.session.add(new_user)
        db.session.commit()

        return jsonify({'status': 'success', 'message': 'Usuario creado exitosamente'}), 201

    except SQLAlchemyError as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 400


# Obtener un usuario por ID
@user_bp.route('/usuarios/<int:id>', methods=['GET'])
def get_user_by_id(id):
    usuario = db.session.query(User).filter_by(id=id).first()
    if not usuario:
        return jsonify({'status': 'error', 'message': 'Usuario no encontrado'}), 404

    # Devuelve todos los datos necesarios, incluyendo el correo
    result = {
        'id': usuario.id,
        'nombre_completo': usuario.nombre_completo,
        'correo': usuario.correo,  # Asegúrate de que este campo existe en tu modelo
        'rol_id': usuario.rol_id,
    }
    return jsonify({'status': 'success', 'data': result}), 200

# Actualizar un usuario
@user_bp.route('/usuarios/<int:userId>', methods=['PUT'])
def update_user(userId):
    data = request.json
    usuario = db.session.query(User).filter_by(id=userId).first()
    if not usuario:
        return jsonify({'error': 'Usuario no encontrado'}), 404
    try:
        usuario.nombre_completo = data.get('nombre_completo', usuario.nombre_completo)
        usuario.correo = data.get('correo', usuario.correo)
        if 'contrasena' in data:
            usuario.contrasena = generate_password_hash(data['contrasena'])
        usuario.foto_perfil = data.get('foto_perfil', usuario.foto_perfil)
        usuario.rol_id = data.get('rol_id', usuario.rol_id)
        db.session.commit()
        return jsonify({'message': 'Usuario actualizado exitosamente'}), 200
    except IntegrityError:
        db.session.rollback()
        return jsonify({'error': 'El correo ya está en uso'}), 400


# Eliminar un usuario
@user_bp.route('/usuarios/<int:userId>', methods=['DELETE'])
def delete_user(userId):
    usuario = db.session.query(User).filter_by(id=userId).first()
    if not usuario:
        return jsonify({'error': 'Usuario no encontrado'}), 404
    db.session.delete(usuario)
    db.session.commit()
    return jsonify({'message': 'Usuario eliminado exitosamente'}), 200


# Obtener todos los usuarios
@user_bp.route('/usuarios', methods=['GET'])
def get_all_users():
    try:
        usuarios = db.session.query(User).all()
        if not usuarios:
            return jsonify({'status': 'error', 'message': 'No hay usuarios registrados'}), 404

        result = [
            {
                'id': usuario.id,
                'nombre_completo': usuario.nombre_completo,
                'correo': usuario.correo,
                'foto_perfil': usuario.foto_perfil,
                'rol_id': usuario.rol_id,
                'creado_en': usuario.creado_en,
                'actualizado_en': usuario.actualizado_en
            } for usuario in usuarios
        ]
        return jsonify({'status': 'success', 'data': result}), 200
    except SQLAlchemyError as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500


@user_bp.route('/current-user', methods=['GET'])
def get_current_user():
    user_id = session.get('user_id')
    if not user_id:
        return jsonify({"status": "error", "message": "No hay usuario autenticado"}), 401

    # Buscar el usuario autenticado
    user = db.session.query(User).filter_by(id=user_id).first()
    if not user:
        return jsonify({"status": "error", "message": "Usuario no encontrado"}), 404

    # Buscar el nombre del rol asociado al ID del rol del usuario
    role = db.session.query(Role).filter_by(id=user.rol_id).first()
    role_name = getattr(role, 'nombre', "Rol no asignado")  # Usar getattr para manejar errores si no existe el campo

    return jsonify({
        "status": "success",
        "data": {
            "id": user.id,
            "nombre_completo": user.nombre_completo,
            "correo": user.correo,
            "cargo": role_name  # Nombre del rol asociado
        }
    }), 200
