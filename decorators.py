# decorators.py
from functools import wraps
from flask import session, flash, redirect, url_for


def login_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'user_id' not in session:
            flash("Por favor, inicia sesión para acceder a esta página.", "warning")
            return redirect(url_for('auth.login_render'))
        return f(*args, **kwargs)

    return decorated_function


def role_required(role):
    def wrapper(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            # Verificar que el usuario tiene el rol necesario
            if 'role' not in session or session['role'].lower() != role.lower():
                user_role = session.get('role')
                flash(f"No tienes permiso para acceder a esta página como {user_role}.", "danger")
                print(f"Acceso denegado: Se requiere el rol '{role}', pero el usuario tiene '{user_role}'.")
                return redirect(url_for('unauthorized'))
            return f(*args, **kwargs)

        return decorated_function

    return wrapper
