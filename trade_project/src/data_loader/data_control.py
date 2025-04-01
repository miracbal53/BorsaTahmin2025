import pandas as pd
import psycopg2

def load_data():
    conn = psycopg2.connect(
        dbname="trade_data",
        user="postgres",
        password="1234",
        host="localhost"
    )
    query = "SELECT * FROM market_data ORDER BY timestamp"
    df = pd.read_sql(query, conn)
    conn.close()
    return df

df = load_data()
print(df.info())  # Veri türlerini ve eksik değerleri görmek için
print(df.describe())  # Temel istatistikler

# Eksik değerleri tespit etme
print(df.isnull().sum())
