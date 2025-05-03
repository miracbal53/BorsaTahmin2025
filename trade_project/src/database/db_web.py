from flask_sqlalchemy import SQLAlchemy
from datetime import datetime, timedelta
import pytz

db = SQLAlchemy()

# Kullanıcı tablosu
from trade_project.src.database.db_web import db

def turkish_now():
    return datetime.now(pytz.timezone("Europe/Istanbul"))

class User(db.Model):
    __tablename__ = 'user'

    id = db.Column(db.Integer, primary_key=True)
    first_name = db.Column(db.String(50), nullable=False)
    last_name = db.Column(db.String(50), nullable=False)
    email = db.Column(db.String(100), unique=True, nullable=False)
    phone_number = db.Column(db.String(20), nullable=False)
    password = db.Column(db.String(255), nullable=False)
    occupation = db.Column(db.String(100), nullable=True)
    role = db.Column(db.String(20), default='user', nullable=False)
    profile_picture = db.Column(db.String(255), nullable=True)  

    def __repr__(self):
        return f"<User {self.email}>"

class Subscription(db.Model):
    __tablename__ = 'subscription'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    type = db.Column(db.String(50), nullable=False)
    market_type = db.Column(db.String(50), nullable=False)
    start_date = db.Column(db.DateTime, default=turkish_now)
    end_date = db.Column(db.DateTime, nullable=False)
    duration = db.Column(db.Integer, nullable=False)
    status = db.Column(db.String(20), default='aktif')

    def __init__(self, user_id, type, market_type, duration):
        self.user_id = user_id
        self.type = type
        self.market_type = market_type
        self.duration = duration
        self.start_date = turkish_now()  # Fonksiyonu çağır!
        self.end_date = self.start_date + timedelta(days=duration)

class Prediction(db.Model):
    __tablename__ = 'prediction'

    id = db.Column(db.Integer, primary_key=True)
    symbol = db.Column(db.String(50), nullable=False, unique=True)
    type = db.Column(db.String(10), nullable=False)
    ai_prediction = db.Column(db.Float, nullable=True)
    admin_prediction = db.Column(db.Float, nullable=True)
    ai_updated_at = db.Column(db.DateTime, nullable=True)
    admin_updated_at = db.Column(db.DateTime, nullable=True)
    created_at = db.Column(db.DateTime, default=turkish_now)
    updated_at = db.Column(db.DateTime, onupdate=turkish_now)

    def __repr__(self):
        return f"<Prediction {self.symbol} - {self.type}>"

class Message(db.Model):
    __tablename__ = 'message'

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100))
    email = db.Column(db.String(100))
    subject = db.Column(db.String(200))
    message = db.Column(db.Text)
    #Türkiye saati ile 
    created_at = db.Column(db.DateTime, default=turkish_now) 
    is_read = db.Column(db.Boolean, default=False)

    def __repr__(self):
        return f"<Message {self.id}>"

    def __repr__(self):
        return f"<Message {self.id}>"

class SubscriptionRequest(db.Model):
    __tablename__ = 'subscription_requests'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    type = db.Column(db.String(50), nullable=False)
    market_type = db.Column(db.String(50), nullable=False)
    duration = db.Column(db.Integer, nullable=False)
    status = db.Column(db.String(20), default='beklemede')
    created_at = db.Column(db.DateTime, default=turkish_now)

    def __repr__(self):
        return f"<SubscriptionRequest {self.id} - {self.type}>"
    
class Notification(db.Model):
    __tablename__ = 'notification'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'))
    message = db.Column(db.String(255))
    is_read = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=turkish_now)  
    
    def __repr__(self):
        return f"<Notification {self.id} - {self.message}>"
    
    