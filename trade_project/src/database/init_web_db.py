from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from datetime import datetime
from trade_project.src.database.db_web import db
from trade_project.src.database.db_web import User, Subscription, Prediction, Message
import sys
import os

# Proje kök dizinini sys.path'e ekle
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../../..')))

app = Flask(__name__)

# Veritabanı yapılandırması
app.config['SQLALCHEMY_DATABASE_URI'] = 'postgresql://postgres:1234@localhost/web_data'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

# SQLAlchemy'yi Flask uygulamasına bağla
db.init_app(app)

if __name__ == "__main__":
    with app.app_context():
        db.create_all()
        print("✅ Tablolar başarıyla oluşturuldu!")