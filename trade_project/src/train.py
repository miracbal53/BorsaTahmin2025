# BU KOD GOOGLE COLAB'TA ÇALIŞIYOR

import pandas as pd
import numpy as np
import os
import matplotlib.pyplot as plt
from sklearn.preprocessing import MinMaxScaler, OneHotEncoder
import tensorflow as tf
from tensorflow.keras.models import Sequential, Model
from tensorflow.keras.layers import LSTM, Bidirectional, Dense, Dropout, BatchNormalization, Attention, Input
from tensorflow.keras.callbacks import ModelCheckpoint, CSVLogger, EarlyStopping

# CSV dosyasını yükleyin
file_path = '/content/drive/MyDrive/Colab Notebooks/FinancialForecast/market_data.csv'
df = pd.read_csv(file_path)

# Drop unnecessary columns
df = df.drop(columns=["id", "symbol", "timestamp"])

# Function to apply One-Hot Encoding
def one_hot_encode(df, columns):
    encoder = OneHotEncoder(sparse_output=False)
    for column in columns:
        encoded = encoder.fit_transform(df[[column]])
        df = pd.concat([df, pd.DataFrame(encoded, columns=encoder.get_feature_names_out([column]))], axis=1)
        df = df.drop(columns=[column])
    return df

# Apply One-Hot Encoding to categorical features
df = one_hot_encode(df, ['asset_name', 'asset_type'])

# Preprocess data
scaler = MinMaxScaler(feature_range=(0, 1))
df[['close_price', 'open_price', 'high_price', 'low_price', 'volume']] = scaler.fit_transform(df[['close_price', 'open_price', 'high_price', 'low_price', 'volume']])

# Create sequences
def create_sequences(data, seq_length):
    sequences = []
    for i in range(len(data) - seq_length):
        sequences.append(data[i:i + seq_length])
    return np.array(sequences)

seq_length = 60
data = create_sequences(df.values, seq_length)
X = data[:, :-1]
y = data[:, -1, df.columns.get_loc('close_price')]

# Split data into training and testing sets
split = int(0.8 * len(X))
X_train, X_test = X[:split], X[split:]
y_train, y_test = y[:split], y[split:]

# Reshape data for LSTM
X_train = X_train.reshape((X_train.shape[0], X_train.shape[1], X_train.shape[2]))
X_test = X_test.reshape((X_test.shape[0], X_test.shape[1], X_test.shape[2]))

# Yeni LSTM modeli
def build_advanced_lstm(input_shape):
    inputs = Input(shape=input_shape)

    # Çift yönlü (Bidirectional) LSTM ile daha iyi öğrenme
    x = Bidirectional(LSTM(128, return_sequences=True))(inputs)
    x = Dropout(0.2)(x)
    x = BatchNormalization()(x)

    # Attention mekanizması ekleyelim
    attention = Attention()([x, x])
    x = tf.keras.layers.Concatenate()([x, attention])

    # Daha fazla katman ekleyelim
    x = Bidirectional(LSTM(64, return_sequences=False))(x)
    x = Dropout(0.2)(x)
    x = BatchNormalization()(x)

    # Çıkış katmanı
    output = Dense(1)(x)

    model = Model(inputs, output)
    model.compile(optimizer="adam", loss="mean_squared_error")

    return model

model = build_advanced_lstm((seq_length - 1, X_train.shape[2]))

# Gerekli dizinleri oluşturun
os.makedirs('/content/drive/MyDrive/Colab Notebooks/FinancialForecast/models', exist_ok=True)

# Callbacks
checkpoint = ModelCheckpoint('/content/drive/MyDrive/Colab Notebooks/FinancialForecast/models/best_model.keras', monitor='val_loss', save_best_only=True, mode='min')
csv_logger = CSVLogger('/content/drive/MyDrive/Colab Notebooks/FinancialForecast/models/training_log.csv', append=True)
early_stopping = EarlyStopping(monitor='val_loss', patience=10, restore_best_weights=True)

# Train the model
history = model.fit(X_train, y_train, epochs=100, batch_size=32, validation_data=(X_test, y_test), callbacks=[checkpoint, csv_logger, early_stopping])

# Save the final model
model.save('/content/drive/MyDrive/Colab Notebooks/FinancialForecast/models/final_model.keras')

# Evaluate the model
loss = model.evaluate(X_test, y_test)
print(f'Test Loss: {loss}')

# Model tahminlerini yap
y_pred = model.predict(X_test)

# Gerçek ve tahmin edilen kapanış fiyatlarını ölçekten çıkar
scaler_close = MinMaxScaler(feature_range=(0, 1))
scaler_close.fit(df[['close_price']])
y_test_unscaled = scaler_close.inverse_transform(y_test.reshape(-1, 1))
y_pred_unscaled = scaler_close.inverse_transform(y_pred)

# Sonuçları yazdır
for i in range(10):
    print(f"Gerçek: {y_test_unscaled[i][0]}, Tahmin: {y_pred_unscaled[i][0]}")

# Gerçek ve tahmin edilen kapanış fiyatlarını karşılaştıran grafik çiz
plt.figure(figsize=(14, 7))
plt.plot(y_test_unscaled, color='blue', label='Gerçek Kapanış Fiyatı')
plt.plot(y_pred_unscaled, color='red', label='Tahmin Edilen Kapanış Fiyatı')
plt.title('Gerçek ve Tahmin Edilen Kapanış Fiyatları')
plt.xlabel('Zaman')
plt.ylabel('Kapanış Fiyatı')
plt.legend()
plt.show()