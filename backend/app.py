import os
from pathlib import Path
from dotenv import load_dotenv

# Load the .env file from the root directory
env_path = Path(__file__).parent.parent / '.env'
load_dotenv(dotenv_path=env_path)

import math
import numpy as np
import pandas as pd
from flask import Flask, request, jsonify
from flask_cors import CORS
import yfinance as yf
from sklearn.ensemble import RandomForestRegressor
from datetime import datetime, timedelta

app = Flask(__name__)
# Enable CORS for frontend running on other ports (e.g., 5173)
CORS(app)

def fetch_stock_data(ticker_symbol, period="1y"):
    """Fetch real stock data using yfinance."""
    try:
        ticker = yf.Ticker(ticker_symbol)
        df = ticker.history(period=period)
        if df.empty:
            return None
        
        # Reset index to make Date a column, format it to string
        df = df.reset_index()
        # Handle different pandas versions tz-aware datetimes
        df['Date'] = pd.to_datetime(df['Date']).dt.strftime('%Y-%m-%d')
        
        # Keep only required columns
        df = df[['Date', 'Open', 'High', 'Low', 'Close', 'Volume']]
        return df
    except Exception as e:
        print(f"Error fetching data for {ticker_symbol}: {e}")
        return None

def train_and_predict(df, forecast_days=30):
    """Train a Random Forest model on historical closing prices to predict the future."""
    # We will use the past 14 days to predict the next day
    lookback = 14
    
    closes = df['Close'].values
    if len(closes) <= lookback:
        return []
        
    X = []
    y = []
    for i in range(len(closes) - lookback):
        X.append(closes[i:i+lookback])
        y.append(closes[i+lookback])
        
    X = np.array(X)
    y = np.array(y)
    
    # Train Random Forest
    rf = RandomForestRegressor(n_estimators=100, random_state=42)
    rf.fit(X, y)
    
    # Predict the next 'forecast_days'
    predictions = []
    current_window = closes[-lookback:].tolist()
    
    last_date_str = df['Date'].iloc[-1]
    last_date = datetime.strptime(last_date_str, '%Y-%m-%d')
    
    for i in range(forecast_days):
        # Predict next day
        pred_X = np.array([current_window[-lookback:]])
        next_close = rf.predict(pred_X)[0]
        
        # Add to window for next prediction
        current_window.append(next_close)
        
        # Calculate next trading date (rough approx skipping weekends)
        next_date = last_date + timedelta(days=i+1)
        if next_date.weekday() == 5: # Saturday
            next_date += timedelta(days=2)
        elif next_date.weekday() == 6: # Sunday
            next_date += timedelta(days=1)
            
        predictions.append({
            "Date": next_date.strftime('%Y-%m-%d'),
            "PredictedClose": float(round(next_close, 2))
        })
        
    return predictions

@app.route('/health', methods=['GET'])
def health():
    return jsonify({"status": "healthy", "engine": "Python Real-Data ML Service 2.0"})

@app.route('/api/stock/<ticker>', methods=['GET'])
def get_stock_data(ticker):
    period = request.args.get('period', '1y')
    
    # 1. Fetch real historical data
    df = fetch_stock_data(ticker, period)
    
    if df is None or df.empty:
        return jsonify({"error": f"Could not fetch data for ticker: {ticker}"}), 404
        
    # 2. Train ML model and generate predictions
    predictions = train_and_predict(df, forecast_days=30)
    
    # 3. Format response
    historical_data = df.to_dict('records')
    
    return jsonify({
        "ticker": ticker.upper(),
        "historical": historical_data,
        "forecast": predictions
    })

# We keep this generic endpoint to avoid 404s if the frontend still calls it while we are transitioning
@app.route('/api/forecast', methods=['POST'])
def legacy_forecast():
    return jsonify({
        "error": "The /api/forecast endpoint is deprecated. Please use /api/stock/<ticker> for real ML forecasts."
    }), 400

@app.route('/api/advisor/strategy', methods=['POST'])
def advisor_strategy():
    """Generates an AI strategy using Gemini based on real stock data and ML predictions."""
    req = request.json or {}
    ticker = req.get('ticker', 'Unknown')
    prompt = req.get('prompt', '')
    historical = req.get('historical', [])
    forecast = req.get('forecast', [])
    
    api_key = os.environ.get('VITE_GEMINI_API_KEY')
    if not api_key:
        # Fallback if no API key is set in backend .env
        return jsonify({
            "response": f"I see you are asking about {ticker}. I need a Gemini API key configured in the backend to provide real analysis. The Random Forest model predicts the price will reach {forecast[-1]['PredictedClose'] if forecast else 'N/A'} in 30 days."
        })
        
    import google.generativeai as genai
    try:
        genai.configure(api_key=api_key)
        model = genai.GenerativeModel('gemini-2.5-flash')
        
        # Construct context from real data
        current_price = historical[-1]['Close'] if historical else 'Unknown'
        future_price = forecast[-1]['PredictedClose'] if forecast else 'Unknown'
        
        system_context = f"""
You are Aura, an elite quantitative financial analyst AI.
The user is asking about the stock ticker: {ticker}.
Current Price: ${current_price}
Our internal Random Forest ML model predicts the price will be ${future_price} in 30 days.

Analyze this data and answer the user's prompt. Keep it professional, concise, and focused on market dynamics.
User Prompt: {prompt}
"""
        
        response = model.generate_content(system_context)
        return jsonify({
            "response": response.text
        })
    except Exception as e:
        print(f"Gemini API Error: {e}")
        return jsonify({
            "response": f"Sorry, I encountered an error communicating with the AI model: {str(e)}"
        }), 500

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=True)
