from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()

class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password = db.Column(db.String(200), nullable=False)

class EmailConfig(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(200), default='')
    password = db.Column(db.String(200), default='')
    alert_email = db.Column(db.String(200), default='')