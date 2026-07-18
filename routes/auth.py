from flask import Blueprint, render_template, request, redirect, session, flash
from datetime import datetime

from models import License
from database import db

auth = Blueprint("auth", __name__)


@auth.route("/", methods=["GET", "POST"])
def login():

    if request.method == "POST":

        license_key = request.form.get("license")

        if not license_key:

            flash("يرجى إدخال كود الاشتراك.")

            return redirect("/")


        license_data = License.query.filter_by(
            license_key=license_key
        ).first()


        if not license_data:

            flash("كود الاشتراك غير صحيح.")

            return redirect("/")


        if not license_data.active:

            flash("تم إيقاف هذا الاشتراك.")

            return redirect("/")


        if datetime.utcnow() > license_data.expires_at:

            flash("انتهت صلاحية الاشتراك.")

            return redirect("/")


        session["license_id"] = license_data.id

        session["license_key"] = license_data.license_key

        return redirect("/dashboard")


    return render_template("login.html")