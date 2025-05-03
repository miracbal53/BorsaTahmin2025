from flask import Blueprint, request, jsonify
from trade_project.src.database.db_web import db, Message
from flask_jwt_extended import jwt_required
from trade_project.src.endpoints.admin import admin_required  
from datetime import datetime


messages_bp = Blueprint('messages', __name__)

@messages_bp.route('/', methods=['GET'])
@jwt_required()
@admin_required
def get_messages():
    """Tüm mesajları getirir"""
    messages = Message.query.order_by(Message.created_at.desc()).all()
    result = [
        {
            "id": msg.id,
            "name": msg.name,
            "email": msg.email,
            "subject": msg.subject,
            "message": msg.message,
            "created_at": msg.created_at.isoformat() if msg.created_at else None,
            "is_read": msg.is_read if hasattr(msg, "is_read") else False,
            "is_deleted": msg.is_deleted if hasattr(msg, "is_deleted") else False
        }
        for msg in messages
    ]
    return jsonify(result), 200

@messages_bp.route('/', methods=['POST'])
def create_message():
    """Yeni bir mesaj oluşturur"""
    data = request.json
    new_message = Message(
        name=data.get('name'),
        email=data.get('email'),
        subject=data.get('subject'),
        message=data.get('message'),
        is_read=False
    )
    db.session.add(new_message)
    db.session.commit()
    return jsonify({"message": "Mesaj başarıyla oluşturuldu!"}), 201


@messages_bp.route('/<int:message_id>/read', methods=['PUT'])
@jwt_required()
@admin_required
def mark_message_as_read(message_id):
    """Mesajı okundu olarak işaretle"""
    msg = Message.query.get_or_404(message_id)
    msg.is_read = True
    db.session.commit()
    return jsonify({"message": "Mesaj okundu olarak işaretlendi."}), 200

@messages_bp.route('/<int:message_id>', methods=['DELETE'])
@jwt_required()
@admin_required
def delete_message(message_id):
    """Mesajı sil"""
    msg = Message.query.get_or_404(message_id)
    db.session.delete(msg)
    db.session.commit()
    return jsonify({"message": "Mesaj silindi."}), 200

@messages_bp.route('/<int:message_id>/delete', methods=['PUT'])
@jwt_required()
@admin_required
def soft_delete_message(message_id):
    msg = Message.query.get_or_404(message_id)
    msg.is_deleted = True
    db.session.commit()
    return jsonify({"message": "Mesaj silindi."}), 200

@messages_bp.route('/<int:message_id>/restore', methods=['PUT'])
@jwt_required()
@admin_required
def restore_message(message_id):
    msg = Message.query.get_or_404(message_id)
    msg.is_deleted = False
    db.session.commit()
    return jsonify({"message": "Mesaj geri yüklendi."}), 200

@messages_bp.route('/stats', methods=['GET'])
@jwt_required()
@admin_required
def message_stats():
    total = Message.query.count()
    unread = Message.query.filter_by(is_read=False).count()
    return jsonify({
        "total_messages": total,
        "unread_messages": unread
    }), 200