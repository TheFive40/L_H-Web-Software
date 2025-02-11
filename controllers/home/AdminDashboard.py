from flask import Blueprint, render_template

from decorators import role_required, login_required

admin = Blueprint("admin", __name__, template_folder="templates/home/panel/admin")


@admin.route("/")
@role_required('Admin')
@login_required
def adminDashboard():
    return render_template("home/panel/admin/Dashboard.html")


@admin.route("/reports")
@role_required('Admin')
@login_required
def reports():
    return render_template("home/panel/admin/Report.html")


@admin.route("/employee")
@login_required
def employee():
    return render_template("home/panel/admin/EmployeeManagement.html")


@admin.route("/settings")
@role_required('Admin')
@login_required
def settings():
    return render_template("home/panel/admin/Settings.html")


@admin.route("/employee/register")
@role_required('Admin')
@login_required
def employeeRegister():
    return render_template('home/panel/admin/forms/EmployeeRegister.html')

