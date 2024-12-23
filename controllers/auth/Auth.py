from flask import Blueprint, render_template

auth = Blueprint("auth", __name__, template_folder="templates/auth")


@auth.route("/login")
def login_render():
    return render_template("auth/Login.html")


@auth.route("/register")
def register_render():
    return render_template("auth/SignUp.html")
