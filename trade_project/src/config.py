API_CONFIG = {
    'BINANCE_API_KEY': 'your_binance_api_key',
    'BINANCE_API_SECRET': 'your_binance_api_secret',
}

DATABASES = {
    'TRADE_DATA': {
        'DB_HOST': 'localhost',
        'DB_NAME': 'trade_data',
        'DB_USER': 'postgres',
        'DB_PASSWORD': '1234'
    },
    'WEB_DATA': {
        'DB_HOST': 'localhost',
        'DB_NAME': 'web_data',
        'DB_USER': 'postgres',
        'DB_PASSWORD': '1234'
    }
}

TRADE_DB_CONFIG = DATABASES['TRADE_DATA']
WEB_DB_CONFIG = DATABASES['WEB_DATA']