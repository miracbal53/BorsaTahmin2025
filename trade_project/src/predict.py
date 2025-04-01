import pandas as pd
import numpy as np
from tensorflow.keras.models import load_model
from sklearn.preprocessing import MinMaxScaler, OneHotEncoder
from trade_project.src.database.db import load_data

# Modeli yükleyin
model = load_model('trade_project/models/best_model.h5')

def preprocess_data(df):
    # Drop unnecessary columns
    df = df.drop(columns=["id", "symbol", "timestamp"])

    # One-Hot Encoding for categorical features
    def one_hot_encode(df, columns):
        encoder = OneHotEncoder(sparse=False)
        for column in columns:
            encoded = encoder.fit_transform(df[[column]])
            df = pd.concat([df, pd.DataFrame(encoded, columns=encoder.get_feature_names_out([column]))], axis=1)
            df = df.drop(columns=[column])
        return df

    df = one_hot_encode(df, ['asset_name', 'asset_type'])

    # Preprocess data
    scaler = MinMaxScaler(feature_range=(0, 1))
    df[['close_price', 'open_price', 'high_price', 'low_price', 'volume']] = scaler.fit_transform(df[['close_price', 'open_price', 'high_price', 'low_price', 'volume']])

    return df, scaler

def create_sequences(data, seq_length):
    sequences = []
    for i in range(len(data) - seq_length):
        sequences.append(data[i:i + seq_length])
    return np.array(sequences)

def predict(asset_name):
    # Veritabanından veriyi yükle
    df = load_data()

    # Veriyi ön işleme tabi tut
    df, scaler = preprocess_data(df)

    # Belirli varlık için veriyi filtrele
    df = df[df['asset_name'] == asset_name]

    # Create sequences
    seq_length = 60
    data = create_sequences(df.values, seq_length)
    X = data[:, :-1]

    # Reshape data for LSTM
    X = X.reshape((X.shape[0], X.shape[1], X.shape[2]))

    # Tahmin yap
    y_pred = model.predict(X)

    # Tahmin edilen kapanış fiyatlarını ölçekten çıkar
    scaler_close = MinMaxScaler(feature_range=(0, 1))
    scaler_close.fit(df[['close_price']])
    y_pred_unscaled = scaler_close.inverse_transform(y_pred)

    return y_pred_unscaled[-1][0]  # Son tahmini döndür

if __name__ == "__main__":
    asset_name = 'BTC/USDT'
    prediction = predict(asset_name)
    print(f"{asset_name} için tahmin edilen kapanış fiyatı: {prediction}")