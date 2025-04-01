import sys
import os
import pandas as pd

# Proje kök dizinini Python yoluna ekleyin
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from src.database.db import load_data

def export_to_csv(file_path):
    # Veritabanından veriyi yükle
    df = load_data()
    
    # Veriyi CSV dosyasına kaydet
    df.to_csv(file_path, index=False)
    print(f"Veri başarıyla {file_path} dosyasına kaydedildi.")

if __name__ == "__main__":
    # CSV dosyasının kaydedileceği yol
    file_path = 'C:/Users/Miraç/BorsaTahmin2025/trade_project/data/market_data.csv'
    
    # CSV dosyasına kaydet
    export_to_csv(file_path)