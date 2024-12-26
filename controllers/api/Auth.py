from flask import Blueprint, jsonify, request, session
from sqlalchemy.exc import SQLAlchemyError
from werkzeug.security import check_password_hash, generate_password_hash
from model.db import db
from model.entities.Tables import User

authAPI = Blueprint('authAPI', __name__)


# Registro de usuario
@authAPI.route('/register', methods=['POST'])
def register():
    try:
        data = request.json
        if not data or not all(key in data for key in ('full_name', 'email', 'password')):
            return jsonify({"status": "error", "message": "Invalid data"}), 400

        role_id = 1

        new_user = User(
            nombre_completo=data['full_name'],
            correo=data['email'],
            contrasena=generate_password_hash(data['password']),
            rol_id=role_id,
            foto_perfil=data.get('profile_picture', None)
        )
        db.session.add(new_user)
        db.session.commit()
        return jsonify({"status": "success", "message": "User registered successfully"}), 201
    except SQLAlchemyError as e:
        return jsonify({"status": "error", "message": str(e)}), 500


@authAPI.route('/login', methods=['POST'])
def login():
    try:
        # Obtener los datos del JSON
        data = request.get_json()

        # Validar los datos de entrada
        if not data or not all(key in data for key in ('email', 'password')):
            return jsonify({"status": "error", "message": "Email and password are required"}), 400

        # Consultar el usuario en la base de datos
        user = db.session.query(User).filter_by(correo=data['email']).first()

        # Verificar si el usuario existe y las credenciales son correctas
        if user and check_password_hash(user.contrasena, data['password']):
            # Establecer datos de sesión
            session['user_id'] = user.id
            session['full_name'] = user.nombre_completo
            role_map = {2: 'Admin', 1: 'Empleado', 3: 'Supervisor'}
            session['role'] = role_map.get(user.rol_id, 'Desconocido')
            session.permanent = True  # La sesión será permanente según configuración

            return jsonify({
                "status": "success",
                "message": "Login successful",
                "data": {
                    "user_id": user.id,
                    "full_name": user.nombre_completo,
                    "role_id": user.rol_id
                }
            }), 200

        # Si las credenciales son incorrectas
        return jsonify({"status": "error", "message": "Invalid credentials"}), 401

    except SQLAlchemyError as e:
        # Manejo de errores en la base de datos
        db.session.rollback()  # Revertir cualquier cambio en caso de error
        return jsonify({
            "status": "error",
            "message": "Database error: " + str(e)
        }), 500

    except Exception as e:
        # Manejo de cualquier otro error inesperado
        return jsonify({
            "status": "error",
            "message": "An unexpected error occurred: " + str(e)
        }), 500


@authAPI.route('/user/info', methods=['GET'])
def get_user_info():
    """
    Endpoint para obtener información del usuario autenticado.
    """
    try:
        # Verificar si hay un usuario autenticado en la sesión
        if 'user_id' not in session:
            return jsonify({"status": "error", "message": "No user is logged in."}), 401

        # Obtener el ID del usuario desde la sesión
        user_id = session['user_id']

        # Buscar al usuario en la base de datos
        user = db.session.query(User).filter_by(id=user_id).first()
        if not user:
            return jsonify({"status": "error", "message": "User not found."}), 404

        # Devolver la información del usuario
        return jsonify({
            "status": "success",
            "data": {
                "user_id": user.id,
                "full_name": user.nombre_completo,
                "email": user.correo,
                "role_id": user.rol_id,
                "profile_picture": user.foto_perfil
            }
        }), 200

    except SQLAlchemyError as e:
        return jsonify({"status": "error", "message": f"Database error: {str(e)}"}), 500
    except Exception as e:
        return jsonify({"status": "error", "message": f"Unexpected error: {str(e)}"}), 500


