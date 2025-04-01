import pandas as pd

def clean_data(df):
    # Check if 'timestamp' column exists
    if 'timestamp' not in df.columns:
        print("Error: 'timestamp' column not found in the dataframe.")
        print("Columns in the dataframe:", df.columns)
        return df

    # Remove rows with missing timestamps
    df = df.dropna(subset=['timestamp'])

    # Convert columns to numeric, forcing errors to NaN
    df[['open', 'high', 'low', 'close', 'volume']] = df[['open', 'high', 'low', 'close', 'volume']].apply(pd.to_numeric, errors='coerce')

    # Forward fill missing values for open, high, low, close
    df[['open', 'high', 'low', 'close']] = df[['open', 'high', 'low', 'close']].ffill()

    # Remove rows with negative prices
    df = df[(df['open'] >= 0) & (df['high'] >= 0) & (df['low'] >= 0) & (df['close'] >= 0)]

    # Remove rows with negative volume
    df = df[df['volume'].isnull() | (df['volume'] >= 0)]

    # Remove rows where high is less than low
    df = df[df['high'] >= df['low']]

    # Ensure all timestamps are in the same format
    df['timestamp'] = pd.to_datetime(df['timestamp']).dt.strftime('%Y-%m-%d')

    # Ensure correct data types
    df['timestamp'] = pd.to_datetime(df['timestamp'])
    df['open'] = df['open'].astype(float)
    df['high'] = df['high'].astype(float)
    df['low'] = df['low'].astype(float)
    df['close'] = df['close'].astype(float)
    df['volume'] = df['volume'].astype(float)
    df['asset_name'] = df['asset_name'].astype(str)
    df['asset_type'] = df['asset_type'].astype(str)

    return df
