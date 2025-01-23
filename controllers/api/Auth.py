from flask import Blueprint, jsonify, request, session
from sqlalchemy.exc import SQLAlchemyError
from werkzeug.security import check_password_hash, generate_password_hash
from model.db import db
from model.entities.Tables import User
from itsdangerous import URLSafeTimedSerializer

authAPI = Blueprint('authAPI', __name__)


def generate_token(email, secret_key, salt='email-confirm'):
    serializer = URLSafeTimedSerializer(secret_key)
    return serializer.dumps(email, salt=salt)


def confirm_token(token, secret_key, salt='email-confirm', expiration=3600):
    serializer = URLSafeTimedSerializer(secret_key)
    try:
        email = serializer.loads(token, salt=salt, max_age=expiration)
    except Exception:
        return None
    return email


@authAPI.route('/register', methods=['POST'])
def register():
    try:
        data = request.json
        if not data or not all(key in data for key in ('full_name', 'email', 'password')):
            return jsonify({"status": "error", "message": "Invalid data"}), 400

        existing_user = db.session.query(User).filter_by(correo=data['email']).first()
        if existing_user:
            return jsonify({"status": "error", "message": "El correo ya está registrado"}), 409  # Código 409: Conflict

        role_id = 1
        new_user = User(
            nombre_completo=data['full_name'],
            correo=data['email'],
            contrasena=generate_password_hash(data['password']),
            rol_id=role_id,
            foto_perfil=data.get('profile_picture', None),
            estado='ACTIVO'
        )
        db.session.add(new_user)
        db.session.commit()
        return jsonify({"status": "success", "message": "User registered successfully"}), 201
    except SQLAlchemyError as e:
        return jsonify({"status": "error", "message": str(e)}), 500


@authAPI.route('/login', methods=['POST'])
def login():
    try:
        data = request.get_json()

        if not data or not all(key in data for key in ('email', 'password')):
            return jsonify({"status": "error", "message": "Email and password are required"}), 400

        user = db.session.query(User).filter_by(correo=data['email']).first()

        if user and check_password_hash(user.contrasena, data['password']):
            session['user_id'] = user.id
            session['full_name'] = user.nombre_completo
            role_map = {2: 'Admin', 1: 'Empleado', 3: 'Supervisor'}
            session['role'] = role_map.get(user.rol_id, 'Desconocido')
            session.permanent = True

            return jsonify({
                "status": "success",
                "message": "Login successful",
                "data": {
                    "user_id": user.id,
                    "full_name": user.nombre_completo,
                    "role_id": user.rol_id
                }
            }), 200

        return jsonify({"status": "error", "message": "Invalid credentials"}), 401

    except SQLAlchemyError as e:
        db.session.rollback()
        return jsonify({
            "status": "error",
            "message": "Database error: " + str(e)
        }), 500

    except Exception as e:
        return jsonify({
            "status": "error",
            "message": "An unexpected error occurred: " + str(e)
        }), 500


@authAPI.route('/user/info', methods=['GET'])
def get_user_info():
    try:
        if 'user_id' not in session:
            return jsonify({"status": "error", "message": "No user is logged in."}), 401

        user_id = session['user_id']

        user = db.session.query(User).filter_by(id=user_id).first()
        if not user:
            return jsonify({"status": "error", "message": "User not found."}), 404

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


@authAPI.route('/logout', methods=['POST'])
def logout():

    try:
        session.clear()
        return jsonify({"status": "success", "message": "Sesión cerrada correctamente"}), 200
    except Exception as e:
        return jsonify({"status": "error", "message": f"Error al cerrar sesión: {str(e)}"}), 500
