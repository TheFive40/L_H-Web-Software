from functools import wraps

from flask import Flask, render_template, flash, redirect, url_for, session
from controllers.auth.Auth import auth
from controllers.home.AdminDashboard import admin
from controllers.api.Settings import settings
from controllers.api.WorkRecords import work_records
from controllers.api.RoleManagement import role_management
from controllers.api.Auth import authAPI
from decorators import login_required
from model.db import db  # Importa db desde extensions

app = Flask(__name__)
app.secret_key = '20050528'
# Configuración de la base de datos
DATABASE_URL = "postgresql://postgres:0219@localhost/lh_distribuciones"
app.config['SQLALCHEMY_DATABASE_URI'] = DATABASE_URL
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

# Inicializar la base de datos
db.init_app(app)

# Crear tablas al iniciar la app
with app.app_context():
    db.create_all()  # Crear todas las tablas usando Flask-SQLAlchemy

# Registro de Blueprints con prefijo /api/
app.register_blueprint(auth, url_prefix="/auth")
app.register_blueprint(admin, url_prefix="/admin")
app.register_blueprint(settings, url_prefix="/api/settings")
app.register_blueprint(work_records, url_prefix="/api/work-records")
app.register_blueprint(authAPI, url_prefix="/api/auth")
app.register_blueprint(role_management, url_prefix="/api/roles")


# Rutas base para vistas
@app.route('/')
@login_required
def home():
    return render_template("home/Home.html")


@app.route('/employee')
def employee_panel():
    return render_template("home/panel/employee/Employee.html")


@app.route('/unauthorized')
def unauthorized():
    return render_template("errors/unauthorized.html"), 403


if __name__ == '__main__':
    app.run()