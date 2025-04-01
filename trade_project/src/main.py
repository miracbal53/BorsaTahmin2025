from trade_project.src.data_loader.fetch_data import fetch_yahoo_finance_data, fetch_binance_data, get_bist30_tickers, get_top_binance_symbols
from trade_project.src.database.db import create_table_if_not_exists, insert_data, check_existing_data
from clean_data import clean_data
from datetime import datetime

def main():
    print("Starting the Python project...")

    # Fetch data from Yahoo Finance
    bist30_tickers = get_bist30_tickers()
    yahoo_data = fetch_yahoo_finance_data(bist30_tickers)
    yahoo_data = clean_data(yahoo_data)
    
    # Fetch data from Binance
    crypto_symbols = get_top_binance_symbols()
    binance_data = fetch_binance_data(crypto_symbols)
    binance_data = clean_data(binance_data)
    
    # Insert data into database
    for _, row in yahoo_data.iterrows():
        if not check_existing_data(row['asset_name'], row['timestamp']):
            insert_data(row['asset_name'], row['asset_name'], row['asset_type'], row['close'], row['open'], row['high'], row['low'], row['volume'], row['timestamp'])
            print(f"{row['timestamp'].strftime('%d.%m.%Y')} tarihli {row['asset_name']} verisi başarıyla eklendi")

    for _, row in binance_data.iterrows():
        if not check_existing_data(row['asset_name'], row['timestamp']):
            insert_data(row['asset_name'], row['asset_name'], row['asset_type'], row['close'], row['open'], row['high'], row['low'], row['volume'], row['timestamp'])
            print(f"{row['timestamp'].strftime('%d.%m.%Y')} tarihli {row['asset_name']} verisi başarıyla eklendi")

if __name__ == "__main__":
    create_table_if_not_exists()
    main()