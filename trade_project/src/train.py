import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
from sklearn.preprocessing import MinMaxScaler
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import LSTM, Dense, Bidirectional, Dropout, Input
from tensorflow.keras.callbacks import ModelCheckpoint, EarlyStopping
import os
import joblib

# Klasör oluştur
os.makedirs("models_simple", exist_ok=True)

# Veri yükle
df = pd.read_csv("/content/drive/MyDrive/Colab Notebooks/FinancialForecast/market_data.csv", parse_dates=['timestamp'])
df = df.dropna()
df = df.sort_values(by=['symbol', 'timestamp'])

# Parametreler
features = ['close_price']
sequence_length = 30
epochs = 50
batch_size = 32

def get_simple_model(input_shape):
    model = Sequential([
        Input(shape=input_shape),
        Bidirectional(LSTM(64, return_sequences=False)),
        Dense(32, activation='relu'),
        Dropout(0.1),
        Dense(1)
    ])
    model.compile(optimizer='adam', loss='mse')
    return model

def train_and_save_model(symbol_df, symbol_name):
    scaler = MinMaxScaler()
    scaled_data = scaler.fit_transform(symbol_df[features])

    X, y = [], []
    for i in range(sequence_length, len(scaled_data)):
        X.append(scaled_data[i-sequence_length:i])
        y.append(scaled_data[i][0])  # close_price tahmini

    X, y = np.array(X), np.array(y)

    if len(X) == 0:
        print(f"{symbol_name}: Yetersiz veri, atlanıyor.")
        return None

    model = get_simple_model((X.shape[1], X.shape[2]))

    safe_name = symbol_name.replace('/', '_').replace('.', '_')
    model_path = f"models_simple/{safe_name}_model.keras"
    scaler_path = f"models_simple/{safe_name}_scaler.pkl"
    result_path = f"models_simple/{safe_name}_prediction.txt"
    plot_path = f"models_simple/{safe_name}_loss_plot.png"

    checkpoint = ModelCheckpoint(model_path, monitor='val_loss', save_best_only=True, verbose=0)
    early_stop = EarlyStopping(monitor='val_loss', patience=10, restore_best_weights=True, verbose=0)

    history = model.fit(X, y, epochs=epochs, batch_size=batch_size,
                        validation_split=0.1, callbacks=[checkpoint, early_stop],
                        verbose=0)

    joblib.dump(scaler, scaler_path)

    last_sequence = scaled_data[-sequence_length:]
    last_sequence = last_sequence.reshape((1, sequence_length, len(features)))
    predicted_scaled = model.predict(last_sequence, verbose=0)[0][0]

    dummy = np.zeros((1, len(features)))
    dummy[0][0] = predicted_scaled
    predicted_price = scaler.inverse_transform(dummy)[0][0]

    val_size = int(len(X) * 0.1)
    X_val, y_val = X[-val_size:], y[-val_size:]
    y_pred_scaled = model.predict(X_val, verbose=0)

    y_val_original = scaler.inverse_transform(np.concatenate([y_val.reshape(-1, 1)] * len(features), axis=1))[:, 0]
    y_pred_original = scaler.inverse_transform(np.concatenate([y_pred_scaled.reshape(-1, 1)] * len(features), axis=1))[:, 0]

    mae = mean_absolute_error(y_val_original, y_pred_original)
    rmse = np.sqrt(mean_squared_error(y_val_original, y_pred_original))
    r2 = r2_score(y_val_original, y_pred_original)

    with open(result_path, 'w') as f:
        f.write(f"Tahmin edilen sonraki kapanış fiyatı: {predicted_price:.4f}\n")
        f.write(f"MAE: {mae:.4f}\n")
        f.write(f"RMSE: {rmse:.4f}\n")
        f.write(f"R²: {r2:.4f}\n")

    print(f"{symbol_name}: Tahmin -> {predicted_price:.4f} | MAE: {mae:.4f} | RMSE: {rmse:.4f} | R²: {r2:.4f}")

    plt.figure(figsize=(8, 4))
    plt.plot(history.history['loss'], label='Loss')
    plt.plot(history.history['val_loss'], label='Validation Loss')
    plt.title(f'{symbol_name} - Loss Grafiği')
    plt.xlabel('Epoch')
    plt.ylabel('Loss')
    plt.legend()
    plt.grid(True)
    plt.tight_layout()
    plt.savefig(plot_path)
    plt.close()

    return history.history

symbols = df['symbol'].unique()

for symbol in symbols:
    symbol_df = df[df['symbol'] == symbol].reset_index(drop=True)

    if len(symbol_df) < (sequence_length + 10):
        print(f"{symbol}: Veri yetersiz, atlandı.")
        continue

    train_and_save_model(symbol_df, symbol)
