from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from trade_project.src.database.db_web import db, Prediction, User
import yfinance as yf
from trade_project.src.data_loader.fetch_data import fetch_last_30_days_data, fetch_last_30_days_bist_data
import pandas as pd
import joblib
from tensorflow.keras.models import load_model
from tensorflow.keras.losses import MeanSquaredError
from datetime import datetime, timedelta
import numpy as np
from trade_project.src.database.db_web import Subscription
import pytz
# admin_required import etmek için gerekli
from trade_project.src.endpoints.admin import admin_required


predictions_bp = Blueprint('predictions', __name__)

# Model ve scaler önbelleği
model_cache = {}
scaler_cache = {}
# Türkiye saat dilimini ayarla
turkey_tz = pytz.timezone('Europe/Istanbul')

def load_model_and_scaler(symbol):
    """Model ve scaler'ı önbellekten yükle veya yüklenmemişse yükle"""
    if symbol not in model_cache:
        safe_name = symbol.replace('/', '_').replace('.', '_')
        model_path = f"C:/models/{safe_name}_model.h5"
        scaler_path = f"C:/models/{safe_name}_scaler.pkl"

        try:
            model_cache[symbol] = load_model(model_path, custom_objects={'mse': MeanSquaredError()})
            scaler_cache[symbol] = joblib.load(scaler_path)
        except FileNotFoundError:
            raise FileNotFoundError(f"{symbol} için model veya scaler dosyası bulunamadı")
    return model_cache[symbol], scaler_cache[symbol]

# Kullanıcının abone olduğu borsaların tahminlerini getir

@predictions_bp.route('/', methods=['GET'])
@jwt_required()
def get_predictions():
    """Kullanıcının abone olduğu borsaların tahminlerini getirir"""
    user_id = get_jwt_identity()

    # Kullanıcının abone olduğu borsaları al
    subscriptions = Subscription.query.filter_by(user_id=user_id, status='aktif').all()
    subscribed_types = [sub.type for sub in subscriptions]

    # Mapping: Subscription type -> Prediction type
    subscription_to_prediction = {
        "Borsa Istanbul": "BIST",
        "Kripto": "Kripto",
        "Forex": "Forex"
    }
    # Mapping: Subscription type -> frontend tab
    subscription_to_tab = {
        "Borsa Istanbul": "bist",
        "Kripto": "crypto",
        "Forex": "forex"
    }

    # Prediction sorgusu için ilgili tipleri topla
    prediction_types = [subscription_to_prediction.get(sub_type, sub_type) for sub_type in subscribed_types]
    subscribed_tabs = [subscription_to_tab.get(sub_type, sub_type).lower() for sub_type in subscribed_types]

    # Sembol normalize fonksiyonu
    def normalize_symbol(symbol, pred_type):
        # BIST için .IS uzantısını kaldır
        if pred_type == "BIST" and symbol.endswith(".IS"):
            return symbol.replace(".IS", "")
        # Kripto için /USDT uzantısını kaldır
        if pred_type == "Kripto" and symbol.endswith("/USDT"):
            return symbol.replace("/USDT", "")
        # Diğerleri için olduğu gibi bırak
        return symbol

    # Tahminleri getir
    predictions = Prediction.query.filter(Prediction.type.in_(prediction_types)).all()

    result = {
        "subscribed_tabs": subscribed_tabs,
        "predictions": [{
            "id": pred.id,
            "symbol": normalize_symbol(pred.symbol, pred.type),  # Normalize edilmiş sembol
            "type": pred.type,
            "ai_prediction": pred.ai_prediction,
            "admin_prediction": pred.admin_prediction,
            "created_at": pred.created_at.strftime('%Y-%m-%d %H:%M:%S'),
            "updated_at": pred.updated_at.strftime('%Y-%m-%d %H:%M:%S') if pred.updated_at else None,
            "ai_updated_at": pred.ai_updated_at.strftime('%Y-%m-%d %H:%M:%S') if pred.ai_updated_at else None,
            "admin_updated_at": pred.admin_updated_at.strftime('%Y-%m-%d %H:%M:%S') if pred.admin_updated_at else None
        } for pred in predictions]
    }

    return jsonify(result), 200

# Admin tahmini oluştur veya güncelle
@predictions_bp.route('/admin', methods=['POST'])
@jwt_required()
@admin_required
def handle_admin_prediction():
    """Admin tahmini oluştur veya güncelle"""
    data = request.json

    symbol = data.get('symbol')
    prediction_type = data.get('type')
    admin_prediction = data.get('admin_prediction')

    if not symbol or not prediction_type or admin_prediction is None:
        return jsonify({"error": "Eksik bilgi"}), 400

    # Türkiye saat dilimini ayarla
    turkey_tz = pytz.timezone('Europe/Istanbul')

    # Veritabanında belirtilen sembol için tahmin olup olmadığını kontrol et
    prediction = Prediction.query.filter_by(symbol=symbol).first()

    if prediction:
        # Mevcut tahmini güncelle
        prediction.admin_prediction = admin_prediction
        prediction.admin_updated_at = datetime.utcnow().replace(tzinfo=pytz.utc).astimezone(turkey_tz)
        db.session.commit()

        return jsonify({
            "message": "Admin tahmini başarıyla güncellendi!",
            "admin_updated_at": prediction.admin_updated_at.strftime('%Y-%m-%d %H:%M:%S')
        }), 200
    else:
        # Yeni tahmin oluştur
        new_prediction = Prediction(
            symbol=symbol,
            type=prediction_type,
            admin_prediction=admin_prediction,
            admin_updated_at=datetime.utcnow().replace(tzinfo=pytz.utc).astimezone(turkey_tz),
            created_at=datetime.utcnow()
        )
        db.session.add(new_prediction)
        db.session.commit()

        return jsonify({
            "message": "Admin tahmini başarıyla oluşturuldu!",
            "created_at": new_prediction.created_at.strftime('%Y-%m-%d %H:%M:%S')
        }), 201

# Yapay zeka tahmini yap
@predictions_bp.route('/ai', methods=['POST'])
@jwt_required()
@admin_required
def handle_ai_prediction():
    """Yapay zekanın tahminini test et ve admin tahminini getir"""
    import pytz  # Türkiye saat dilimi için
    turkey_tz = pytz.timezone('Europe/Istanbul')

    data = request.json
    symbol = data.get('symbol')

    if not symbol:
        return jsonify({"error": "Sembol bilgisi eksik"}), 400

    # Bugünün tarihini al
    today = datetime.utcnow().date()

    # Veritabanında bugünkü tahmini kontrol et
    prediction = Prediction.query.filter_by(symbol=symbol).first()
    if prediction and prediction.ai_updated_at and prediction.ai_updated_at.date() == today:
        # Eğer bugünkü tahmin zaten yapılmışsa, veritabanından çek ve döndür
        return jsonify({
            "symbol": symbol,
            "ai_prediction": prediction.ai_prediction,
            "ai_updated_at": prediction.ai_updated_at.strftime('%Y-%m-%d %H:%M:%S')
        }), 200

    # API'den son 30 günlük veriyi çek
    try:
        if "USDT" in symbol:  # Kripto para için Binance API
            binance_symbol = symbol.replace("/", "")  # BTC/USDT -> BTCUSDT
            symbol_df = fetch_last_30_days_data(binance_symbol)
        else:  # Hisse senedi için Yahoo Finance API
            symbol_df = fetch_last_30_days_bist_data(symbol)

        if symbol_df.empty:
            return jsonify({"error": f"{symbol} için veri bulunamadı. Lütfen geçerli bir sembol girin."}), 404
    except Exception as e:
        return jsonify({"error": f"{symbol} için veri çekilemedi: {str(e)}"}), 500

    # Model ve scaler'ı yükle
    try:
        model, scaler = load_model_and_scaler(symbol)
    except FileNotFoundError as e:
        return jsonify({"error": str(e)}), 404

    # Tahmin için son veriyi hazırlama
    try:
        sequence_length = 30
        available_length = len(symbol_df)

        if available_length < sequence_length:
            # Eğer veri sayısı 30'dan azsa, mevcut veri kadar sequence kullan
            print(f"{symbol} için yeterli veri yok. Mevcut veri sayısı: {available_length}. Mevcut veri ile tahmin yapılacak.")
            last_sequence = symbol_df['close_price'].iloc[-available_length:].values.reshape(-1, 1)
            last_sequence_scaled = scaler.transform(last_sequence)
            last_sequence_scaled = last_sequence_scaled.reshape((1, available_length, 1))
        else:
            # Eğer veri sayısı yeterliyse, son 30 günü kullan
            last_sequence = symbol_df['close_price'].iloc[-sequence_length:].values.reshape(-1, 1)
            last_sequence_scaled = scaler.transform(last_sequence)
            last_sequence_scaled = last_sequence_scaled.reshape((1, sequence_length, 1))
    except Exception as e:
        return jsonify({"error": f"Tahmin için veri hazırlama sırasında bir hata oluştu: {str(e)}"}), 500

    # Yapay zeka tahmini yap
    try:
        predicted_scaled = model.predict(last_sequence_scaled, verbose=0)[0][0]
        predicted_price = scaler.inverse_transform([[predicted_scaled]])[0][0]
    except Exception as e:
        return jsonify({"error": f"Tahmin sırasında bir hata oluştu: {str(e)}"}), 500

    # Tahmini veritabanına kaydet veya güncelle
    try:
        if prediction:
            # Mevcut tahmini güncelle
            prediction.ai_prediction = predicted_price
            prediction.ai_updated_at = datetime.utcnow().replace(tzinfo=pytz.utc).astimezone(turkey_tz)
        else:
            # Yeni tahmin oluştur
            new_prediction = Prediction(
                symbol=symbol,
                type="BIST" if "IS" in symbol else "Kripto",
                ai_prediction=predicted_price,
                ai_updated_at=datetime.utcnow().replace(tzinfo=pytz.utc).astimezone(turkey_tz),
                created_at=datetime.utcnow()
            )
            db.session.add(new_prediction)
        db.session.commit()
    except Exception as e:
        return jsonify({"error": f"Veritabanına kaydetme sırasında bir hata oluştu: {str(e)}"}), 500

    return jsonify({
        "symbol": symbol,
        "ai_prediction": predicted_price,
        "ai_updated_at": datetime.utcnow().replace(tzinfo=pytz.utc).astimezone(turkey_tz).strftime('%Y-%m-%d %H:%M:%S')
    }), 200