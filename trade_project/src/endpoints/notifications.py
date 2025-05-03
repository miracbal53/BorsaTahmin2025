# trade_project/src/endpoints/notifications.py
from flask import Blueprint, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from trade_project.src.database.db_web import Notification, db

notifications_bp = Blueprint('notifications', __name__)

@notifications_bp.route('/', methods=['GET'])
@jwt_required()
def get_notifications():
    user_id = get_jwt_identity()
    notifications = Notification.query.filter_by(user_id=user_id, is_read=False).all()
    return jsonify([
        {
            "id": n.id,
            "message": n.message,
            "created_at": n.created_at.strftime('%Y-%m-%d %H:%M:%S')
        }
        for n in notifications
    ])

@notifications_bp.route('/read_all', methods=['POST'])
@jwt_required()
def read_all_notifications():
    user_id = get_jwt_identity()
    Notification.query.filter_by(user_id=user_id, is_read=False).update({"is_read": True})
    db.session.commit()
    return jsonify({"message": "Tüm bildirimler okundu olarak işaretlendi."}), 200

@notifications_bp.route('/read/<int:notification_id>', methods=['POST'])
@jwt_required()
def read_notification(notification_id):
    user_id = get_jwt_identity()
    notif = Notification.query.filter_by(id=notification_id, user_id=user_id).first()
    if notif:
        notif.is_read = True
        db.session.commit()
        return jsonify({"message": "Bildirim okundu olarak işaretlendi."}), 200
    return jsonify({"error": "Bildirim bulunamadı."}), 404