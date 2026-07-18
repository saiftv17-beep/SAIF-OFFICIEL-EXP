import os
from dotenv import load_dotenv

load_dotenv()


class Config:

    SECRET_KEY = os.getenv(
        "SECRET_KEY",
        "CHANGE_THIS_TO_LONG_RANDOM_SECRET"
    )

    SQLALCHEMY_DATABASE_URI = os.getenv(
        "DATABASE_URL",
        "sqlite:///licensepanel.db"
    )

    SQLALCHEMY_TRACK_MODIFICATIONS = False

    SESSION_COOKIE_HTTPONLY = True

    SESSION_COOKIE_SECURE = True

    SESSION_COOKIE_SAMESITE = "Lax"

    PERMANENT_SESSION_LIFETIME = 86400

    API_BASE = os.getenv(
        "API_BASE",
        "https://saif-production-ff40.up.railway.app"
    )

    PLAYER_INFO_API = os.getenv(
        "PLAYER_INFO_API",
        "https://accinfo.vercel.app/player-info"
    )

    # بيانات المدير
    ADMIN_USERNAME = os.getenv("ADMIN_USERNAME")
    ADMIN_PASSWORD = os.getenv("ADMIN_PASSWORD")