# -*- coding: utf-8 -*-
import sys
import io
from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from trade_project.src.database.db_utils import connect_db
from trade_project.src.config import WEB_DB_CONFIG
from functools import wraps
from trade_project.src.database.db_web import db, User, Prediction
from datetime import datetime, timedelta

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8')

admin_bp = Blueprint('admin', __name__)

def admin_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        try:
            # Kullanıcının ID'sini JWT'den alıyoruz
            user_id = get_jwt_identity()
            
            # Kullanıcıyı veritabanından sorguluyoruz
            user = User.query.filter_by(id=user_id).first()
            
            # Eğer kullanıcı yoksa veya kullanıcı admin değilse hata döndürüyoruz
            if not user or user.role != 'admin':
                return jsonify({"error": "Bu işlem için yetkiniz yok"}), 403

        except Exception as e:
            return jsonify({"error": f"Yetkilendirme sırasında bir hata oluştu: {str(e)}"}), 500

        # Admin kontrolü başarılı ise orijinal view fonksiyonunu çağırıyoruz
        return f(*args, **kwargs)

    return decorated_function

@admin_bp.route('/stats/users', methods=['GET'])
@jwt_required()
@admin_required
def get_total_users():
    """User rolüne sahip kullanıcı sayısını döndürür"""
    try:
        conn = connect_db(WEB_DB_CONFIG)
        cursor = conn.cursor()
        cursor.execute('SELECT COUNT(*) FROM "user" WHERE role = %s', ('user',))
        total_users = cursor.fetchone()[0]
        cursor.close()
        conn.close()
    
        return jsonify({"total_users": total_users}), 200
    except Exception as e:
        print(f"Veritabanı bağlantısı veya sorgusu sırasında bir hata oluştu: {str(e)}")
        return jsonify({"error": f"Bir hata oluştu: {str(e)}"}), 500


@admin_bp.route('/stats/subscriptions', methods=['GET'])
@jwt_required()
@admin_required
def get_pending_subscriptions():
    """Bekleyen abonelik talepleri sayısını döndürür"""
    try:
        conn = connect_db(WEB_DB_CONFIG)
        cursor = conn.cursor()
        cursor.execute("SELECT COUNT(*) FROM subscription_requests WHERE status = 'beklemede'")
        pending_subscriptions = cursor.fetchone()[0]
        cursor.close()
        conn.close()

        # Eğer bekleyen abonelik yoksa 0 döndür
        return jsonify({"pending_subscriptions": pending_subscriptions or 0}), 200
    except Exception as e:
        print(f"Hata: {str(e)}")
        return jsonify({"error": str(e)}), 500

@admin_bp.route('/stats/active_subscriptions', methods=['GET'])
@jwt_required()
@admin_required
def get_active_subscriptions():
    """Onaylanmış (aktif) aboneliklerin sayısını döndürür"""
    try:
        conn = connect_db(WEB_DB_CONFIG)
        cursor = conn.cursor()
        cursor.execute("""
            SELECT COUNT(*)
            FROM subscription
            WHERE status = 'aktif'
        """)
        result = cursor.fetchone()
        cursor.close()
        conn.close()

        return jsonify({"approved_subscriptions": result[0]}), 200
    except Exception as e:
        print(f"Hata: {str(e)}")
        return jsonify({"error": str(e)}), 500

@admin_bp.route('/stats/favorite_subscriptions', methods=['GET'])
@jwt_required()
@admin_required
def get_favorite_subscriptions():
    """En popüler abonelik türünü döndürür"""
    try:
        conn = connect_db(WEB_DB_CONFIG)
        cursor = conn.cursor()
        cursor.execute("""
            SELECT market_type, COUNT(*) AS subscription_count
            FROM subscription
            GROUP BY market_type
            ORDER BY subscription_count DESC
            LIMIT 1
        """)
        result = cursor.fetchone()
        cursor.close()
        conn.close()

        if result:
            market_type = result[0]
            subscription_count = result[1]
            return jsonify({"favorite_subscriptions": f"{market_type}-{subscription_count}"}), 200
        else:
            return jsonify({"favorite_subscriptions": "Veri bulunamadı"}), 200
    except Exception as e:
        print(f"Hata: {str(e)}")
        return jsonify({"error": str(e)}), 500

@admin_bp.route('/users', methods=['GET'])
@jwt_required()
@admin_required
def get_all_users():
    """Tüm kullanıcıları döndürür"""
    try:
        users = User.query.all()
        user_list = [
            {
                "id": user.id,
                "first_name": user.first_name,
                "last_name": user.last_name,
                "email": user.email,
                "role": user.role,
                "phone_number": user.phone_number,
            }
            for user in users
        ]
        return jsonify(user_list), 200
    except Exception as e:
        print(f"Hata: {str(e)}")  # Hata mesajını logla
        return jsonify({"error": str(e)}), 500
    
@admin_bp.route('/users/<int:user_id>', methods=['DELETE'])
@jwt_required()
@admin_required
def delete_user(user_id):
    """Kullanıcıyı siler"""
    try:
        user = User.query.get(user_id)
        if not user:
            return jsonify({"error": "Kullanıcı bulunamadı"}), 404
        
        db.session.delete(user)
        db.session.commit()
        
        return jsonify({"message": "Kullanıcı başarıyla silindi"}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500

@admin_bp.route('/users/<int:user_id>/role', methods=['PUT'])
@jwt_required()
@admin_required
def update_user_role(user_id):
    """Kullanıcının rolünü günceller"""
    try:
        data = request.get_json()
        new_role = data.get('role')
        
        if new_role not in ['admin', 'user']:
            return jsonify({"error": "Geçersiz rol"}), 400
        
        user = User.query.get(user_id)
        if not user:
            return jsonify({"error": "Kullanıcı bulunamadı"}), 404
        
        user.role = new_role
        db.session.commit()
        
        return jsonify({"message": "Kullanıcı rolü başarıyla güncellendi"}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500

from trade_project.src.database.db_web import Notification, db, User

@admin_bp.route('/subscriptions/<int:subscription_id>', methods=['PUT'])
@jwt_required()
@admin_required
def update_subscription(subscription_id):
    try:
        data = request.get_json()
        status = data.get('status')
        if status not in ['onaylandı', 'reddedildi']:
            return jsonify({"error": "Geçersiz durum"}), 400

        conn = connect_db(WEB_DB_CONFIG)
        cursor = conn.cursor()

        cursor.execute("SELECT user_id, type FROM subscription_requests WHERE id = %s", (subscription_id,))
        result = cursor.fetchone()
        if not result:
            cursor.close()
            conn.close()
            return jsonify({"error": "Talep bulunamadı"}), 404
        user_id, sub_type = result

        cursor.execute("UPDATE subscription_requests SET status = %s WHERE id = %s", (status, subscription_id))
        conn.commit()

        if status == 'onaylandı':
            cursor.execute("""
                INSERT INTO subscription (user_id, type, market_type, start_date, end_date, duration, status)
                SELECT user_id, type, market_type, NOW(), NOW() + (duration || ' days')::interval, duration, 'aktif'
                FROM subscription_requests
                WHERE id = %s
            """, (subscription_id,))
            conn.commit()
            notif_msg = f"{sub_type} abonelik talebiniz onaylandı."
        else:
            notif_msg = f"{sub_type} abonelik talebiniz reddedildi."

        cursor.close()
        conn.close()

        notification = Notification(
            user_id=user_id,
            message=notif_msg,
            is_read=False
        )
        db.session.add(notification)
        db.session.commit()

        return jsonify({"message": f"Abonelik durumu '{status}' olarak güncellendi"}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500

@admin_bp.route('/users/<int:user_id>', methods=['PUT'])
@jwt_required()
@admin_required
def update_user(user_id):
    """Kullanıcı bilgilerini günceller"""
    try:
        data = request.get_json()
        user = User.query.get(user_id)
        if not user:
            return jsonify({"error": "Kullanıcı bulunamadı"}), 404

        # Kullanıcı bilgilerini güncelle
        user.first_name = data.get('first_name', user.first_name)
        user.last_name = data.get('last_name', user.last_name)
        user.role = data.get('role', user.role)
        user.phone_number = data.get('phone_number', user.phone_number)

        db.session.commit()
        return jsonify({
            "id": user.id,
            "first_name": user.first_name,
            "last_name": user.last_name,
            "email": user.email,
            "role": user.role,
            "phone_number": user.phone_number
        }), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    
@admin_bp.route('/subscriptions', methods=['GET'])
@jwt_required()
@admin_required
def get_all_subscriptions():
    """Tüm abonelikleri döndürür"""
    try:
        conn = connect_db(WEB_DB_CONFIG)
        cursor = conn.cursor()
        cursor.execute("""
            SELECT s.id, u.first_name, u.last_name, u.email, s.market_type, s.start_date, s.end_date, s.status
            FROM subscription s
            JOIN "user" u ON s.user_id = u.id
        """)
        subscriptions = cursor.fetchall()
        cursor.close()
        conn.close()

        subscription_list = []
        for sub in subscriptions:
            start_date = sub[5]
            end_date = sub[6]
            remaining_days = (end_date - datetime.now()).days if end_date else None

            subscription_list.append({
                "id": sub[0],
                "first_name": sub[1],
                "last_name": sub[2],
                "email": sub[3],
                "market_type": sub[4],
                "start_date": start_date.isoformat() if isinstance(start_date, datetime) else start_date,
                "end_date": end_date.isoformat() if isinstance(end_date, datetime) else end_date,
                "status": sub[7],
                "remaining_days": remaining_days
            })

        # Eğer liste boşsa boş bir liste döndür
        if not subscription_list:
            print("Abonelik listesi boş")
            return jsonify([]), 200

        return jsonify(subscription_list), 200
    except Exception as e:
        print(f"Hata: {str(e)}")
        return jsonify({"error": str(e)}), 500

# @admin_bp.route('/subscriptions/<int:subscription_id>', methods=['PUT'])
# @jwt_required()
# @admin_required
# def update_subscription_status(subscription_id):
#     """Abonelik durumunu günceller (onayla veya reddet)"""
#     try:
#         data = request.get_json()
#         status = data.get('status')  # 'aktif' veya 'reddedildi'

#         if status not in ['aktif', 'reddedildi']:
#             return jsonify({"error": "Geçersiz durum"}), 400

#         conn = connect_db(WEB_DB_CONFIG)
#         cursor = conn.cursor()

#         # Abonelik durumunu güncelle
#         cursor.execute("UPDATE subscription SET status = %s WHERE id = %s", (status, subscription_id))
#         conn.commit()

#         cursor.close()
#         conn.close()

#         return jsonify({"message": f"Abonelik durumu '{status}' olarak güncellendi"}), 200
#     except Exception as e:
#         return jsonify({"error": str(e)}), 500

"""Bekleyen abonelik taleplerini döndürür"""
@admin_bp.route('/subscriptions/requests', methods=['GET'])
@jwt_required()
@admin_required
def get_subscription_requests():
    """Bekleyen abonelik taleplerini döndürür"""
    try:
        conn = connect_db(WEB_DB_CONFIG)
        cursor = conn.cursor()
        cursor.execute("""
            SELECT sr.id, u."first_name", u."last_name", sr.type, sr.market_type, sr.duration, sr.status, sr.created_at
            FROM subscription_requests sr
            JOIN "user" u ON sr.user_id = u.id
            WHERE sr.status = 'beklemede'
        """)
        requests = cursor.fetchall()
        cursor.close()
        conn.close()

        request_list = []
        for req in requests:
            if len(req) != 8:  # Beklenen sütun sayısı tam değilse
                print(f"Eksik veya hatalı veri: {req}")
                continue  # Eksik veriyi atla

            request_list.append({
                "id": req[0],
                "first_name": req[1],
                "last_name": req[2],
                "type": req[3],
                "market_type": req[4],
                "duration": req[5],
                "status": req[6],
                "created_at": req[7].isoformat() if isinstance(req[7], datetime) else req[7]
            })

        # Eğer liste boşsa boş bir liste döndür
        if not request_list:
            print("Bekleyen abonelik talebi bulunamadı.")
            return jsonify([]), 200

        return jsonify(request_list), 200
    except Exception as e:
        print(f"Hata: {str(e)}")
        return jsonify({"error": str(e)}), 500
    
@admin_bp.route('/predictions', methods=['GET'])
@jwt_required()
@admin_required
def get_all_predictions():
    """Tüm tahminleri döndürür"""
    try:
        predictions = Prediction.query.all()
        prediction_list = []
        for pred in predictions:
            prediction_list.append({
                "id": pred.id,
                "symbol": pred.symbol,
                "type": pred.type,
                "ai_prediction": pred.ai_prediction,
                "admin_prediction": pred.admin_prediction,
                "ai_updated_at": pred.ai_updated_at.isoformat() if pred.ai_updated_at else None,
                "admin_updated_at": pred.admin_updated_at.isoformat() if pred.admin_updated_at else None,
                "created_at": pred.created_at.isoformat() if pred.created_at else None,
                "updated_at": pred.updated_at.isoformat() if pred.updated_at else None
            })
        return jsonify(prediction_list), 200
    except Exception as e:
        print(f"Hata: {str(e)}")
        return jsonify({"error": str(e)}), 500