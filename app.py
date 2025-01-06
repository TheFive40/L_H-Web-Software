import os
from functools import wraps

from flask import Flask, render_template, flash, redirect, url_for, session

from controllers.api.Reports import reports_bp
from controllers.auth.Auth import auth
from controllers.home.AdminDashboard import admin
from controllers.api.Settings import settings
from controllers.api.WorkRecords import work_records
from controllers.api.RoleManagement import role_management
from controllers.api.Auth import authAPI
from controllers.api.User import user_bp
from decorators import login_required
from model.db import db

app = Flask(__name__)
app.secret_key = '20050528'
DATABASE_URL = "postgresql://postgres:ACDQEJUpWEACGVLbeEqTcyuwTUKeKzeu@viaduct.proxy.rlwy.net:43367/railway"
app.config['SQLALCHEMY_DATABASE_URI'] = DATABASE_URL
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db.init_app(app)

with app.app_context():
    db.create_all()

app.register_blueprint(auth, url_prefix="/auth")
app.register_blueprint(admin, url_prefix="/admin")
app.register_blueprint(settings, url_prefix="/api/settings")
app.register_blueprint(work_records, url_prefix="/api/work-records")
app.register_blueprint(authAPI, url_prefix="/api/auth")
app.register_blueprint(role_management, url_prefix="/api/roles")
app.register_blueprint(user_bp, url_prefix='/api/user')
app.register_blueprint(reports_bp, url_prefix='/api/report')


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
    port = int(os.environ.get("PORT", 5000))
    app.run(host='0.0.0.0', port=port)