from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from trade_project.src.database.db_web import db, Subscription, User,SubscriptionRequest
from trade_project.src.logger import logger
import logging
from trade_project.src.database.db_web import Notification
from trade_project.src.endpoints.admin import admin_required


subscriptions_bp = Blueprint('subscriptions', __name__)
# Logger'ı yapılandır
logger = logging.getLogger(__name__)
logger.setLevel(logging.DEBUG)

# Konsola loglama için bir handler ekle
console_handler = logging.StreamHandler()
console_handler.setLevel(logging.DEBUG)

# Log formatını ayarla
formatter = logging.Formatter('%(asctime)s - %(levelname)s - %(message)s')
console_handler.setFormatter(formatter)

# Logger'a handler ekle
logger.addHandler(console_handler)


@subscriptions_bp.route('/requests', methods=['POST'])
@jwt_required()
def create_subscription_request():
    """Yeni bir abonelik talebi oluşturur"""
    try:
        user_id = get_jwt_identity()
        data = request.json

        subscription_type = data.get('type')
        market_type = data.get('market_type')
        duration = data.get('duration')

        if not subscription_type or not market_type or not duration:
            return jsonify({"error": "Abonelik türü, piyasa türü ve süre belirtilmelidir"}), 400

        # Aynı kullanıcı için aynı türde bekleyen bir abonelik isteği var mı kontrol et
        existing_request = SubscriptionRequest.query.filter_by(
            user_id=user_id,
            type=subscription_type,
            market_type=market_type,
            status='beklemede'
        ).first()

        if existing_request:
            return jsonify({"error": "Bu abonelik türü için zaten bekleyen bir isteğiniz var."}), 400

        # Kullanıcının zaten bu türde aktif bir aboneliği var mı kontrol et
        active_subscription = Subscription.query.filter_by(
            user_id=user_id,
            type=subscription_type,
            market_type=market_type,
            status='aktif'
        ).first()

        if active_subscription:
            return jsonify({"error": "Bu abonelik türüne zaten sahipsiniz."}), 400

        # Yeni abonelik talebi oluştur
        new_request = SubscriptionRequest(
            user_id=user_id,
            type=subscription_type,
            market_type=market_type,
            duration=duration
        )
        db.session.add(new_request)
        db.session.commit()

        return jsonify({"message": "Abonelik talebi başarıyla oluşturuldu!"}), 201
    except Exception as e:
        logger.exception("Abonelik talebi oluşturulurken bir hata oluştu.")
        return jsonify({"error": "Bir hata oluştu, lütfen tekrar deneyin."}), 500

@subscriptions_bp.route('/requests', methods=['GET'])
@jwt_required()
def get_pending_requests():
    """Bekleyen abonelik taleplerini getirir"""
    requests = SubscriptionRequest.query.filter_by(status='beklemede').all()

    result = [
        {
            "id": req.id,
            "user_id": req.user_id,
            "type": req.type,
            "market_type": req.market_type,
            "duration": req.duration,
            "status": req.status,
            "created_at": req.created_at.strftime('%Y-%m-%d %H:%M:%S')
        }
        for req in requests
    ]
    return jsonify(result), 200

@subscriptions_bp.route('/requests/approve/<int:request_id>', methods=['POST'])
@admin_required
@jwt_required()
def approve_request(request_id):
    """Bir abonelik talebini onaylar"""
    request = SubscriptionRequest.query.get(request_id)

    if not request or request.status != 'beklemede':
        return jsonify({"error": "Talep bulunamadı veya zaten işlenmiş"}), 404

    # Talebi onayla ve abonelik oluştur
    new_subscription = Subscription(
        user_id=request.user_id,
        type=request.type,
        market_type=request.market_type,
        duration=request.duration
    )
    db.session.add(new_subscription)

    # Talep durumunu güncelle
    request.status = 'onaylandı'

    # Bildirim oluştur
    notification = Notification(
        user_id=request.user_id,
        message=f"{request.type} abonelik talebiniz onaylandı.",
        is_read=False
    )
    db.session.add(notification)
    print("Bildirim ekleniyor:", notification)
    db.session.commit()

    return jsonify({"message": "Abonelik talebi onaylandı ve abonelik oluşturuldu!"}), 200

@subscriptions_bp.route('/requests/reject/<int:request_id>', methods=['POST'])
@admin_required
@jwt_required()
def reject_request(request_id):
    """Bir abonelik talebini reddeder"""
    request = SubscriptionRequest.query.get(request_id)

    if not request or request.status != 'beklemede':
        return jsonify({"error": "Talep bulunamadı veya zaten işlenmiş"}), 404

    # Talep durumunu reddedildi olarak güncelle
    request.status = 'reddedildi'

    # Bildirim oluştur
    notification = Notification(
        user_id=request.user_id,
        message=f"{request.type} abonelik talebiniz reddedildi.",
        is_read=False
    )
    db.session.add(notification)
    print("Bildirim ekleniyor:", notification)
    db.session.commit()

    return jsonify({"message": "Abonelik talebi reddedildi!"}), 200

@subscriptions_bp.route('/current', methods=['GET'])
@jwt_required()
def get_current_subscriptions():
    """Kullanıcının mevcut aboneliklerini döndürür"""
    user_id = get_jwt_identity()
    subscriptions = Subscription.query.filter_by(user_id=user_id).all()
    return jsonify([
        {
            "type": sub.type,
            "start_date": sub.start_date.strftime('%Y-%m-%d'),
            "end_date": sub.end_date.strftime('%Y-%m-%d'),
        }
        for sub in subscriptions
    ]), 200
    

@subscriptions_bp.route('/requests/user', methods=['GET'])
@jwt_required()
def get_user_subscription_requests():
    """Kullanıcının bekleyen abonelik taleplerini döndürür"""
    user_id = get_jwt_identity()
    requests = SubscriptionRequest.query.filter_by(user_id=user_id, status='beklemede').all()  # Sadece bekleyen istekleri getir
    return jsonify([
        {
            "id": req.id,
            "type": req.type,
            "market_type": req.market_type,
            "duration": req.duration,
            "status": req.status,
            "created_at": req.created_at.strftime('%Y-%m-%d %H:%M:%S')
        }
        for req in requests
    ]), 200
    
@subscriptions_bp.route('/requests/cancel/<int:request_id>', methods=['DELETE'])
@jwt_required()
def cancel_subscription_request(request_id):
    """Bir abonelik isteğini iptal eder"""
    try:
        user_id = get_jwt_identity()
        subscription_request = SubscriptionRequest.query.filter_by(id=request_id, user_id=user_id, status='beklemede').first()

        if not subscription_request:
            return jsonify({"error": "Abonelik isteği bulunamadı veya zaten işlenmiş."}), 404

        # Talebi iptal et
        subscription_request.status = 'iptal edildi'
        db.session.commit()

        return jsonify({"message": "Abonelik isteği başarıyla iptal edildi!"}), 200
    except Exception as e:
        logger.exception("Abonelik isteği iptal edilirken bir hata oluştu.")
        return jsonify({"error": "Bir hata oluştu, lütfen tekrar deneyin."}), 500
    
@subscriptions_bp.route('/cancel/<int:subscription_id>', methods=['POST'])
@jwt_required()
def cancel_subscription(subscription_id):
    """Bir aktif aboneliği iptal eder"""
    try:
        user_id = get_jwt_identity()
        subscription = Subscription.query.filter_by(id=subscription_id, user_id=user_id, status='aktif').first()

        if not subscription:
            return jsonify({"error": "Abonelik bulunamadı veya zaten iptal edilmiş."}), 404

        # Aboneliği iptal et
        subscription.status = 'iptal ediliyor'
        db.session.commit()

        return jsonify({"message": "Abonelik iptali başarıyla planlandı!"}), 200
    except Exception as e:
        logger.exception("Abonelik iptali sırasında bir hata oluştu.")
        return jsonify({"error": "Bir hata oluştu, lütfen tekrar deneyin."}), 500