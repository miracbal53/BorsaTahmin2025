from flask import Blueprint, request, jsonify
from werkzeug.security import generate_password_hash, check_password_hash
from flask_jwt_extended import JWTManager, create_access_token, jwt_required, get_jwt_identity, get_jwt
from trade_project.src.database.db_web import db, User
from trade_project.src.database.db_utils import connect_db
from trade_project.src.config import WEB_DB_CONFIG
import os
from werkzeug.utils import secure_filename
from trade_project.src.logger import logger
from functools import wraps

users_bp = Blueprint('users', __name__)

def role_required(forbidden_role):
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            claims = get_jwt()
            if claims.get("role") == forbidden_role:
                return {"error": "Bu sayfaya erişim yetkiniz bulunmamaktadır."}, 403
            return func(*args, **kwargs)
        return wrapper
    return decorator


# Kullanıcı kaydı
@users_bp.route('/register', methods=['POST'])
def register_user():
    """Yeni bir kullanıcı oluşturur"""
    data = request.json
    first_name = data.get('first_name')
    last_name = data.get('last_name')
    email = data.get('email')
    phone_number = data.get('phone_number')
    password = data.get('password')
    occupation = data.get('occupation', None)

    # Eksik bilgi kontrolü
    if not first_name or not last_name or not email or not phone_number or not password:
        return jsonify({"error": "Eksik bilgi"}), 400

    # Şifreyi hashle
    hashed_password = generate_password_hash(password, method='pbkdf2:sha256')

    # Kullanıcıyı oluştur
    new_user = User(
        first_name=first_name,
        last_name=last_name,
        email=email,
        phone_number=phone_number,
        password=hashed_password,
        occupation=occupation,
        role='user'  
    )
    db.session.add(new_user)
    db.session.commit()

    return jsonify({"message": "Kullanıcı başarıyla oluşturuldu!"}), 201

# Kullanıcı girişi
@users_bp.route('/login', methods=['POST'])
def login_user():
    """Kullanıcı girişi yapar"""
    data = request.json
    email = data.get('email')
    password = data.get('password')

    if not email or not password:
        return jsonify({"error": "Eksik bilgi"}), 400

    # Kullanıcıyı veritabanında ara
    user = User.query.filter_by(email=email).first()
    if not user or not check_password_hash(user.password, password):
        return jsonify({"error": "Geçersiz e-posta veya şifre"}), 401

    # Kullanıcı kimliğini kontrol et
    if not user.id:
        return jsonify({"error": "Kullanıcı kimliği geçersiz"}), 400

    # JWT token oluştur
    access_token = create_access_token(identity=str(user.id), additional_claims={"role": user.role})
    return jsonify({"access_token": access_token}), 200

# Kullanıcı bilgilerini alma (JWT ile korunan endpoint)
@users_bp.route('/profile', methods=['GET'])
@jwt_required()
@role_required('admin')
def get_profile():
    user_id = get_jwt_identity()  # JWT'den kullanıcı kimliğini al
    user = User.query.get(user_id)

    if not user:
        return jsonify({"error": "Kullanıcı bulunamadı"}), 404
    if not user or not user.id or not user.role:
        return jsonify({"error": "Kullanıcı bilgileri eksik"}), 400

    return jsonify({
        "firstName": user.first_name,
        "lastName": user.last_name,
        "email": user.email,
        "phoneNumber": user.phone_number,
        "occupation": user.occupation,
        "profilePicture": user.profile_picture  
    }), 200

@users_bp.route('/profile', methods=['PUT'])
@jwt_required()
@role_required('admin')  # Admin kullanıcıların erişimini engelle
def update_profile():
    """Kullanıcı profil bilgilerini günceller"""
    user_id = get_jwt_identity()  # JWT'den kullanıcı kimliğini al
    user = User.query.get(user_id)  # Kullanıcıyı veritabanından al

    if not user:
        return jsonify({"error": "Kullanıcı bulunamadı"}), 404

    # İstekten gelen verileri al
    data = request.get_json()
    user.first_name = data.get('firstName', user.first_name)
    user.last_name = data.get('lastName', user.last_name)
    user.phone_number = data.get('phoneNumber', user.phone_number)
    user.occupation = data.get('occupation', user.occupation)

    # Veritabanını güncelle
    db.session.commit()

    return jsonify({"success": True, "message": "Profil başarıyla güncellendi!"}), 200

UPLOAD_FOLDER = os.path.join(os.getcwd(), 'uploads', 'profile_pictures')
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

@users_bp.route('/upload-profile-picture', methods=['POST'])
@jwt_required()
def upload_profile_picture():
    user_id = get_jwt_identity()

    if 'file' not in request.files:
        return jsonify({"error": "Dosya bulunamadı"}), 400

    file = request.files['file']
    if file.filename == '':
        return jsonify({"error": "Dosya adı boş"}), 400

    filename = secure_filename(file.filename)
    file_path = os.path.join(UPLOAD_FOLDER, filename)
    file.save(file_path)

    profile_picture_url = f"/uploads/profile_pictures/{filename}"
    update_profile_picture_in_db(user_id, profile_picture_url)

    return jsonify({"success": True, "profile_picture_url": profile_picture_url}), 200

def update_profile_picture_in_db(user_id, profile_picture_url):
    """Veritabanında profil resmi URL'sini günceller"""
    conn = connect_db(WEB_DB_CONFIG)  # WEB_DB_CONFIG kullanılıyor
    cursor = conn.cursor()
    cursor.execute("""
        UPDATE "user" SET profile_picture = %s WHERE id = %s
    """, (profile_picture_url, user_id))  # "user" çift tırnak içinde
    conn.commit()
    cursor.close()
    conn.close()

@users_bp.route('/remove-profile-picture', methods=['DELETE'])
@jwt_required()
def remove_profile_picture():
    user_id = get_jwt_identity()
    user = User.query.get(user_id)

    if not user:
        return jsonify({"error": "Kullanıcı bulunamadı"}), 404

    user.profile_picture = None
    db.session.commit()

    return jsonify({"success": True, "message": "Profil resmi kaldırıldı!"}), 200