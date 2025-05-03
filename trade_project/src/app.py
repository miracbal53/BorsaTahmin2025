import sys
import os

# Proje kök dizinini sys.path'e ekle
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../..')))

from flask import Flask, send_from_directory
from trade_project.src.database.db_web import db
from trade_project.src.endpoints.users import users_bp
from trade_project.src.endpoints.predictions import predictions_bp
from trade_project.src.endpoints.subscriptions import subscriptions_bp
from trade_project.src.endpoints.messages import messages_bp
from trade_project.src.endpoints.admin import admin_bp
from trade_project.src.endpoints.notifications import notifications_bp
from flask_jwt_extended import JWTManager
from flask_migrate import Migrate
from flask_cors import CORS
import logging
from trade_project.src.logger import logger
from trade_project.src.endpoints.admin import admin_bp


app = Flask(__name__)
app.url_map.strict_slashes = False
CORS(app, origins=["http://localhost:3000"], supports_credentials=True)

# Statik dosyalar için route
@app.route('/uploads/<path:filename>')
def serve_uploads(filename):
    uploads_dir = os.path.join(os.getcwd(), 'uploads')
    return send_from_directory(uploads_dir, filename)


migrate = Migrate(app, db)

# Veritabanı yapılandırması
app.config['SQLALCHEMY_DATABASE_URI'] = 'postgresql://postgres:1234@localhost/web_data?client_encoding=utf8'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
# JWT yapılandırması
app.config['JWT_SECRET_KEY'] = 'ADSHasksadkdjASDAHSD1203039ASNDJASDshdadasdnm21321302193nasdASDOAJSDSDA!ASDHGHlsaDSAHAHSDFKJDFS+%82!Yu**?'  
jwt = JWTManager(app)

# SQLAlchemy'yi Flask uygulamasına bağla
db.init_app(app)

# Blueprint'leri kaydet
app.register_blueprint(users_bp, url_prefix='/users')
app.register_blueprint(subscriptions_bp, url_prefix='/subscriptions')
app.register_blueprint(predictions_bp, url_prefix='/predictions')
app.register_blueprint(messages_bp, url_prefix='/api/messages')
app.register_blueprint(admin_bp, url_prefix='/admin')
app.register_blueprint(notifications_bp, url_prefix='/api/notifications')

if __name__ == "__main__":
    app.run(debug=True, port=5000)
