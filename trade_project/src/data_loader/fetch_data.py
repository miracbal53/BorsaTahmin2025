import requests
import yfinance as yf
from binance.client import Client as BinanceClient
from datetime import datetime
from trade_project.src.config import API_CONFIG
import pandas as pd

BINANCE_API_KEY = API_CONFIG['BINANCE_API_KEY']
BINANCE_API_SECRET = API_CONFIG['BINANCE_API_SECRET']

def fetch_yahoo_finance_data(tickers):
    all_data = []
    for ticker in tickers:
        data = yf.download(ticker, start='2023-01-01')
        data.reset_index(inplace=True)
        data['asset_type'] = 'BIST'
        data['asset_name'] = ticker
        data.rename(columns={'Date': 'timestamp'}, inplace=True)
        data.columns = ['timestamp', 'open', 'high', 'low', 'close', 'volume', 'asset_type', 'asset_name']
        all_data.append(data)
    return pd.concat(all_data)

def fetch_binance_data(symbols):
    client = BinanceClient(BINANCE_API_KEY, BINANCE_API_SECRET)
    data = []
    start_date = datetime(2023, 1, 1)
    end_date = datetime.now()
    for symbol in symbols:
        klines = client.get_historical_klines(symbol, client.KLINE_INTERVAL_1DAY, start_date.strftime("%d %b, %Y"), end_date.strftime("%d %b, %Y"))
        df = pd.DataFrame(klines, columns=['timestamp', 'open', 'high', 'low', 'close', 'volume', 'close_time', 'quote_asset_volume', 'number_of_trades', 'taker_buy_base_asset_volume', 'taker_buy_quote_asset_volume', 'ignore'])
        df['timestamp'] = pd.to_datetime(df['timestamp'], unit='ms')
        df['asset_type'] = 'Kripto'
        base_currency = symbol[:-4]
        quote_currency = symbol[-4:]
        df['asset_name'] = f"{base_currency}/{quote_currency}"
        data.append(df[['timestamp', 'open', 'high', 'low', 'close', 'volume', 'asset_type', 'asset_name']])
    return pd.concat(data)

def get_bist30_tickers():
    url = "https://www.borsaistanbul.com/en/sayfa/108/bist-30"
    response = requests.get(url)
    # Placeholder for parsing logic to get tickers
    tickers = ['AKBNK.IS', 'GARAN.IS', 'THYAO.IS']
    return tickers

def get_top_binance_symbols():
    client = BinanceClient(BINANCE_API_KEY, BINANCE_API_SECRET)
    tickers = client.get_ticker()
    usdt_tickers = [ticker for ticker in tickers if ticker['symbol'].endswith('USDT')]
    sorted_tickers = sorted(usdt_tickers, key=lambda x: float(x['quoteVolume']), reverse=True)
    top_symbols = [ticker['symbol'] for ticker in sorted_tickers[:5]]
    return top_symbols