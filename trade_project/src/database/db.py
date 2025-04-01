import psycopg2
from psycopg2 import sql
from src.config import API_CONFIG
from datetime import datetime
import pandas as pd

DB_HOST = API_CONFIG['DB_HOST']
DB_NAME = API_CONFIG['DB_NAME']
DB_USER = API_CONFIG['DB_USER']
DB_PASSWORD = API_CONFIG['DB_PASSWORD']

def connect_db():
    """Veritabanına bağlanma"""
    conn = psycopg2.connect(
        host=DB_HOST,
        database=DB_NAME,
        user=DB_USER,
        password=DB_PASSWORD
    )
    return conn

def create_table_if_not_exists():
    """Veri tablosunu oluşturur (Eğer yoksa)"""
    conn = connect_db()
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
    conn = connect_db()
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
    conn = connect_db()
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
    conn = connect_db()
    query = "SELECT * FROM market_data ORDER BY timestamp"
    df = pd.read_sql(query, conn)
    conn.close()
    return df