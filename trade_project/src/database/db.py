import psycopg2
from psycopg2 import sql
from datetime import datetime
import pandas as pd
from trade_project.src.config import DATABASES
from trade_project.src.database.db_utils import connect_db

TRADE_DB_CONFIG = DATABASES['TRADE_DATA']


def create_table_if_not_exists():
    """Veri tablosunu oluşturur (Eğer yoksa)"""
    conn = connect_db(TRADE_DB_CONFIG)
    cursor = conn.cursor()
    
    # Tablo var mı kontrol et
    cursor.execute("""
    SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'market_data'
    );
    """)
    
    table_exists = cursor.fetchone()[0]
    
    if not table_exists:
        cursor.execute("""
        CREATE TABLE market_data (
            id SERIAL PRIMARY KEY,
            symbol VARCHAR(10),
            asset_name VARCHAR(100),
            asset_type VARCHAR(20),
            close_price FLOAT,
            open_price FLOAT,
            high_price FLOAT,
            low_price FLOAT,
            volume FLOAT,
            timestamp TIMESTAMP,
            UNIQUE (asset_name, timestamp)
        )
        """)
        conn.commit()
        print("✅ Tablo oluşturuldu!")
    else:
        print("✅ Tablo zaten mevcut!")
    
    cursor.close()
    conn.close()

def insert_data(symbol, asset_name, asset_type, close_price, open_price, high_price, low_price, volume, timestamp):
    """Yeni veriyi veritabanına ekler"""
    conn = connect_db(TRADE_DB_CONFIG)
    cursor = conn.cursor()
    
    try:
        cursor.execute("""
        INSERT INTO market_data (symbol, asset_name, asset_type, close_price, open_price, high_price, low_price, volume, timestamp)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
        """, (symbol, asset_name, asset_type, close_price, open_price, high_price, low_price, volume, timestamp))
        
        conn.commit()
        print(f"✅ {timestamp.strftime('%d.%m.%Y')} tarihindeki {symbol} için veriler kaydedildi.")
    except psycopg2.errors.UniqueViolation:
        print(f"⚠️ {timestamp.strftime('%d.%m.%Y')} tarihindeki {symbol} verisi zaten mevcut.")
        conn.rollback()
    
    cursor.close()
    conn.close()

def check_existing_data(asset_name, timestamp):
    """Veritabanında mevcut veriyi kontrol eder"""
    conn = connect_db(TRADE_DB_CONFIG)
    cursor = conn.cursor()
    
    cursor.execute("""
    SELECT 1 FROM market_data WHERE asset_name = %s AND timestamp = %s
    """, (asset_name, timestamp))
    
    result = cursor.fetchone()
    cursor.close()
    conn.close()
    
    return result is not None

def load_data():
    """Veritabanından verileri yükler"""
    conn = connect_db(TRADE_DB_CONFIG)
    query = "SELECT asset_name, close_price, open_price, high_price, low_price, volume, timestamp FROM market_data ORDER BY timestamp"
    df = pd.read_sql(query, conn)
    conn.close()
    return df

