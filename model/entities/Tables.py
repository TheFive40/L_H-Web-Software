from sqlalchemy import (
    Column, Integer, String, ForeignKey, Date, Time, Numeric, Text, TIMESTAMP
)
from sqlalchemy.orm import relationship
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.sql import func

Base = declarative_base()


# Tabla de Roles
class Role(Base):
    __tablename__ = 'roles'

    id = Column(Integer, primary_key=True, autoincrement=True)
    nombre = Column(String(50), nullable=False, unique=True)
    descripcion = Column(String(255), nullable=True)
    creado_en = Column(TIMESTAMP, server_default=func.current_timestamp())

    # Relación con la tabla usuarios
    usuarios = relationship("User", back_populates="rol")

    def __repr__(self):
        return f"<Role(id={self.id}, nombre='{self.nombre}')>"


# Tabla de Usuarios
class User(Base):
    __tablename__ = 'usuarios'

    id = Column(Integer, primary_key=True, autoincrement=True)
    nombre_completo = Column(String(100), nullable=False)
    correo = Column(String(100), nullable=False, unique=True)
    contrasena = Column(String(255), nullable=False)
    foto_perfil = Column(Text, nullable=True)  # Ruta o URL de la foto
    rol_id = Column(Integer, ForeignKey('roles.id'), nullable=False)
    creado_en = Column(TIMESTAMP, server_default=func.current_timestamp())
    actualizado_en = Column(TIMESTAMP, server_default=func.current_timestamp(), onupdate=func.current_timestamp())

    # Relación con la tabla roles
    rol = relationship("Role", back_populates="usuarios")

    # Relación con la tabla registros_trabajo
    registros = relationship("WorkRecord", back_populates="usuario")

    def __repr__(self):
        return f"<User(id={self.id}, nombre_completo='{self.nombre_completo}')>"


# Tabla de Registros de Trabajo
class WorkRecord(Base):
    __tablename__ = 'registros_trabajo'

    id = Column(Integer, primary_key=True, autoincrement=True)
    usuario_id = Column(Integer, ForeignKey('usuarios.id'), nullable=False)
    fecha = Column(Date, nullable=False)
    hora_entrada = Column(Time, nullable=False)
    hora_salida = Column(Time, nullable=True)
    horas_extras = Column(Numeric(5, 2), default=0)  # Horas extras trabajadas
    creado_en = Column(TIMESTAMP, server_default=func.current_timestamp())

    # Relación con la tabla usuarios
    usuario = relationship("User", back_populates="registros")

    def __repr__(self):
        return f"WorkRecord(id={self.id}, usuario_id={self.usuario_id}, fecha={self.fecha})"


class Configuration(Base):
    __tablename__ = 'configuraciones'

    id = Column(Integer, primary_key=True, autoincrement=True)
    clave = Column(String(50), nullable=False, unique=True)
    valor = Column(Text, nullable=False)
    descripcion = Column(Text, nullable=True)
    actualizado_en = Column(TIMESTAMP, server_default=func.current_timestamp(), onupdate=func.current_timestamp())

    def __repr__(self):
        return f"<Configuration(id={self.id}, clave='{self.clave}', valor='{self.valor}')>"