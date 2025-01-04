from flask import Blueprint, jsonify, request, session
from werkzeug.security import generate_password_hash, check_password_hash
from sqlalchemy.exc import IntegrityError, SQLAlchemyError
from model.entities.Tables import User, Role
from model.db import db

user_bp = Blueprint('user_bp', __name__)


@user_bp.route('/usuarios', methods=['POST'])
def create_user():
    try:
        data = request.json
        if not data or not all(key in data for key in ('nombre_completo', 'correo', 'contrasena', 'rol_id')):
            return jsonify({'status': 'error', 'message': 'Faltan campos obligatorios'}), 400

        new_user = User(
            nombre_completo=data['nombre_completo'],
            correo=data['correo'],
            contrasena=generate_password_hash(data['contrasena']),
            foto_perfil=data.get('foto_perfil'),
            rol_id=data['rol_id']
        )
        db.session.add(new_user)
        db.session.commit()

        return jsonify({'status': 'success', 'message': 'Usuario creado exitosamente'}), 201

    except SQLAlchemyError as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 400


@user_bp.route('/usuarios/<int:id>', methods=['GET'])
def get_user_by_id(id):
    usuario = db.session.query(User).filter_by(id=id).first()
    if not usuario:
        return jsonify({'status': 'error', 'message': 'Usuario no encontrado'}), 404

    result = {
        'id': usuario.id,
        'nombre_completo': usuario.nombre_completo,
        'correo': usuario.correo,
        'rol_id': usuario.rol_id,
    }
    return jsonify({'status': 'success', 'data': result}), 200

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


@user_bp.route('/usuarios/<int:userId>', methods=['DELETE'])
def delete_user(userId):
    usuario = db.session.query(User).filter_by(id=userId).first()
    if not usuario:
        return jsonify({'error': 'Usuario no encontrado'}), 404
    db.session.delete(usuario)
    db.session.commit()
    return jsonify({'message': 'Usuario eliminado exitosamente'}), 200


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

    user = db.session.query(User).filter_by(id=user_id).first()
    if not user:
        return jsonify({"status": "error", "message": "Usuario no encontrado"}), 404

    role = db.session.query(Role).filter_by(id=user.rol_id).first()
    role_name = getattr(role, 'nombre', "Rol no asignado")

    return jsonify({
        "status": "success",
        "data": {
            "id": user.id,
            "nombre_completo": user.nombre_completo,
            "correo": user.correo,
            "cargo": role_name,
            "foto_perfil": user.foto_perfil
        }
    }), 200
