from flask import Flask
from config import Config
from database import db
from routes.auth import auth
from routes.admin import admin

app = Flask(__name__)

app.config.from_object(Config)

db.init_app(app)

app.register_blueprint(auth)

app.register_blueprint(admin)

with app.app_context():

    from models import License, UID, Admin, Log

    db.create_all()




import os

if __name__ == "__main__":
    app.run(
        host="0.0.0.0",
        port=int(os.environ.get("PORT", 8080)),
        debug=False
    )