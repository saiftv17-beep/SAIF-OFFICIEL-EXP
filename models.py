from datetime import datetime, timedelta
from database import db


class License(db.Model):
    __tablename__ = "licenses"

    id = db.Column(db.Integer, primary_key=True)

    license_key = db.Column(db.String(64), unique=True, nullable=False)

    active = db.Column(db.Boolean, default=True)

    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    expires_at = db.Column(db.DateTime, nullable=False)

    daily_limit = db.Column(db.Integer, default=10)

    daily_used = db.Column(db.Integer, default=0)

    last_reset = db.Column(db.DateTime, default=datetime.utcnow)

name = db.Column(db.String(100), default="")

notes = db.Column(db.Text, default="")

created_by = db.Column(db.String(50), default="admin")


class UID(db.Model):
    __tablename__ = "uids"

    id = db.Column(db.Integer, primary_key=True)

    license_id = db.Column(
        db.Integer,
        db.ForeignKey("licenses.id"),
        nullable=False
    )

    uid = db.Column(db.String(32), nullable=False)

    nickname = db.Column(db.String(100))

    region = db.Column(db.String(20))

    level = db.Column(db.Integer)

    status = db.Column(db.String(20), default="stopped")

    started_at = db.Column(db.DateTime)

    stop_at = db.Column(db.DateTime)

    created_at = db.Column(
        db.DateTime,
        default=datetime.utcnow
    )


class Admin(db.Model):
    __tablename__ = "admins"

    id = db.Column(db.Integer, primary_key=True)

    username = db.Column(
        db.String(50),
        unique=True
    )

    password = db.Column(
        db.String(255)
    )


class Log(db.Model):
    __tablename__ = "logs"

    id = db.Column(db.Integer, primary_key=True)

    license_key = db.Column(db.String(64))

    uid = db.Column(db.String(32))

    action = db.Column(db.String(30))

    message = db.Column(db.Text)

    created_at = db.Column(
        db.DateTime,
        default=datetime.utcnow
    )