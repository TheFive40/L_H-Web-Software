from flask import Blueprint, render_template

from decorators import role_required

admin = Blueprint("admin", __name__, template_folder="templates/home/panel/admin")


@admin.route("/")
@role_required('Admin')
def adminDashboard():
    return render_template("home/panel/admin/Dashboard.html")


@admin.route("/reports")
def reports():
    return render_template("home/panel/admin/Report.html")


@admin.route("/employee")
def employee():
    return render_template("home/panel/admin/EmployeeManagement.html")


@admin.route("/settings")
def settings():
    return render_template("home/panel/admin/Settings.html")


@admin.route("/employee/register")
def employeeRegister():
    return render_template('home/panel/admin/forms/EmployeeRegister.html')
