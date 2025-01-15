from flask import Blueprint, render_template
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from flask import request
from controllers.api.Auth import confirm_token, generate_token

auth = Blueprint("auth", __name__, template_folder="templates/auth")


def sendEmail(fromEmail, toEmail, token):
    smtp_server = "smtp.gmail.com"
    port = 587
    email = fromEmail
    password = "igjo zfzk zhxx jkvo"
    url_raiz = f"{request.scheme}://{request.host}"

    msg = MIMEMultipart()
    msg["From"] = email
    msg["To"] = toEmail
    reset_url = f"{url_raiz}/auth/reset_password/{token}"
    msg["Subject"] = "Recuperación de Contraseña - [L&H Distribuciones S.A.S]"
    mensaje = f"""
    <html>
    <head>
        <style>
            body {{
                font-family: Arial, sans-serif;
                line-height: 1.6;
                color: #333333;
                margin: 0;
                padding: 0;
                background-color: #f7f7f7;
            }}
            .container {{
                max-width: 600px;
                margin: 20px auto;
                background: #ffffff;
                border: 1px solid #e0e0e0;
                border-radius: 8px;
                box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
                padding: 20px;
            }}
            .header {{
                text-align: center;
                padding: 10px 0;
                background: #6a11cb;
                color: #ffffff;
                border-radius: 8px 8px 0 0;
            }}
            .header h1 {{
                margin: 0;
                font-size: 22px;
            }}
            .content {{
                padding: 20px;
            }}
            .content p {{
                margin-bottom: 15px;
            }}
            .cta {{
                display: block;
                width: fit-content;
                margin: 20px auto;
                padding: 10px 20px;
                color: #ffffff;
                text-decoration: none;
                font-weight: bold;
                text-align: center;
                border-radius: 5px;
                transition: background 0.3s ease;
            }}
            .cta:visited {{
            color: #ffffff; /* Asegura que el texto siga siendo blanco después de hacer clic */
            }}
            .footer {{
                text-align: center;
                margin-top: 20px;
                font-size: 12px;
                color: #888888;
            }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>Restablecer Contraseña</h1>
            </div>
            <div class="content">
                <p>Estimado(a) usuario,</p>
                <p>
                    Hemos recibido una solicitud para restablecer tu contraseña. Si realizaste esta solicitud, por favor haz clic en el botón a continuación para crear una nueva contraseña:
                </p>
                <a class="cta" href="{reset_url}"><strong>Restablecer Contraseña</strong></a>
                <p>
                    Si no realizaste esta solicitud, puedes ignorar este mensaje y tu contraseña permanecerá sin cambios.
                </p>
            </div>
            <div class="footer">
                Atentamente,<br>
                El equipo de <strong>L&H Distribuciones S.A.S</strong>
            </div>
        </div>
    </body>
    </html>
    """

    msg.attach(MIMEText(mensaje, "html"))

    try:
        # Conectar al servidor y enviar
        with smtplib.SMTP(smtp_server, port) as server:
            server.starttls()
            server.login(email, password)
            server.sendmail(email, toEmail, msg.as_string())
        print("Correo enviado exitosamente.")
    except Exception as e:
        print(f"Error al enviar correo: {e}")


@auth.route("/login")
def login_render():
    return render_template("auth/Login.html")


@auth.route("/register")
def register_render():
    return render_template("auth/SignUp.html")


@auth.route('/forgot_password')
def forgotPassword():
    return render_template('auth/ForgotPassword.html')


@auth.route('/forgot_password/<string:correo>')
def forgot(correo):
    token = generate_token(correo, '20050528')
    sendEmail("boomajeanfranco@gmail.com", correo, token)
    return "Correo de recuperación enviado."


@auth.route('/reset_password/<string:token>')
def reset_password(token):
    email = confirm_token(token, '20050528')
    return render_template('auth/CreatePassword.html', email=email)
