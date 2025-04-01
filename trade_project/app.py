import sys
import os
from flask import Flask, request, jsonify, render_template

# Proje kök dizinini Python yoluna ekleyin
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from trade_project.src.predict import predict

app = Flask(__name__)

@app.route('/')
def home():
    return render_template('index.html')

@app.route('/predict', methods=['POST'])
def predict_route():
    data = request.get_json()
    asset_name = data['asset']
    prediction = predict(asset_name)
    return jsonify({'prediction': prediction})

if __name__ == '__main__':
    app.run(debug=True)