import os
import time
import json
import numpy as np
import pandas as pd
import yfinance as yf
from sklearn.ensemble import RandomForestRegressor
from datetime import datetime, timedelta
import google.generativeai as genai
from pathlib import Path
from dotenv import load_dotenv

from database import init_db, upsert_analysis

# Load the .env file from the root directory
env_path = Path(__file__).parent.parent / '.env'
load_dotenv(dotenv_path=env_path)

# Configure Gemini
api_key = os.environ.get('VITE_GEMINI_API_KEY')
if not api_key:
    raise ValueError("VITE_GEMINI_API_KEY is not set in the root .env file.")
genai.configure(api_key=api_key)
model = genai.GenerativeModel('gemini-2.5-flash')

# Define target universe (Nifty 50 Subset)
NIFTY_50 = [
    "RELIANCE.NS", "TCS.NS", "HDFCBANK.NS", "INFY.NS", "ICICIBANK.NS",
    "HINDUNILVR.NS", "SBIN.NS", "BAJFINANCE.NS", "BHARTIARTL.NS", "ITC.NS",
    "TATAMOTORS.NS", "MRF.NS"
]

def add_technical_indicators(df):
    """Adds advanced technical indicators like RSI and MACD to the dataframe."""
    # EMA 20 and 50
    df['EMA_20'] = df['Close'].ewm(span=20, adjust=False).mean()
    df['EMA_50'] = df['Close'].ewm(span=50, adjust=False).mean()

    # MACD
    ema_12 = df['Close'].ewm(span=12, adjust=False).mean()
    ema_26 = df['Close'].ewm(span=26, adjust=False).mean()
    df['MACD'] = ema_12 - ema_26
    df['MACD_Signal'] = df['MACD'].ewm(span=9, adjust=False).mean()

    # RSI (14-day)
    delta = df['Close'].diff()
    gain = (delta.where(delta > 0, 0)).rolling(window=14).mean()
    loss = (-delta.where(delta < 0, 0)).rolling(window=14).mean()
    rs = gain / loss
    df['RSI'] = 100 - (100 / (1 + rs))

    df = df.fillna(0)
    return df

def fetch_and_train(ticker_symbol):
    """Fetches 1y historical data, enhances features, trains RF, and predicts 30 days."""
    ticker = yf.Ticker(ticker_symbol)
    df = ticker.history(period="1y")
    
    if df.empty:
        print(f"[{ticker_symbol}] No data found.")
        return None, None
    
    df = df.reset_index()
    # Handle timezone aware datetimes by making them naive or converting to string
    df['Date'] = pd.to_datetime(df['Date']).dt.strftime('%Y-%m-%d')
    df = df[['Date', 'Open', 'High', 'Low', 'Close', 'Volume']]
    
    df = add_technical_indicators(df)
    
    # We will use the past 14 days of OHLCV + Indicators to predict the next day
    lookback = 14
    closes = df['Close'].values
    emas = df['EMA_20'].values
    rsis = df['RSI'].values
    
    X, y = [], []
    for i in range(lookback, len(df) - 1):
        window_features = []
        window_features.extend(closes[i-lookback:i])
        window_features.extend(emas[i-lookback:i])
        window_features.extend(rsis[i-lookback:i])
        X.append(window_features)
        y.append(closes[i])
        
    X = np.array(X)
    y = np.array(y)
    
    if len(X) == 0:
        return df, []

    rf = RandomForestRegressor(n_estimators=100, random_state=42)
    rf.fit(X, y)
    
    # Predict next 30 days
    last_window_closes = list(closes[-lookback:])
    last_window_emas = list(emas[-lookback:])
    last_window_rsis = list(rsis[-lookback:])
    
    predictions = []
    current_date = datetime.strptime(df['Date'].iloc[-1], '%Y-%m-%d')
    
    for _ in range(30):
        # Shift forward one day, skipping weekends ideally, but for simplicity +1 day
        current_date += timedelta(days=1)
        if current_date.weekday() >= 5: # Skip weekends
            continue
            
        x_input = []
        x_input.extend(last_window_closes[-lookback:])
        x_input.extend(last_window_emas[-lookback:])
        x_input.extend(last_window_rsis[-lookback:])
        
        pred_close = rf.predict([x_input])[0]
        
        predictions.append({
            "Date": current_date.strftime('%Y-%m-%d'),
            "PredictedClose": round(pred_close, 2)
        })
        
        last_window_closes.append(pred_close)
        last_window_emas.append(pred_close) # Simple mock for future EMAs
        last_window_rsis.append(50.0) # Simple mock for future RSIs
        
    return df, predictions

def analyze_fundamentals(ticker_symbol):
    """Fetches recent news and sends to Gemini for Sentiment Scoring."""
    ticker = yf.Ticker(ticker_symbol)
    news = ticker.news
    
    if not news:
        return 0.0, "No recent news found for fundamental analysis."
        
    headlines = []
    for item in news[:10]: # Top 10 articles
        title = item.get('title', '')
        publisher = item.get('publisher', '')
        headlines.append(f"- {title} (Source: {publisher})")
        
    news_text = "\n".join(headlines)
    
    prompt = f"""
    You are an elite quantitative financial analyst specializing in the Indian Stock Market.
    Analyze the following recent news headlines for the stock {ticker_symbol}.
    
    News Headlines:
    {news_text}
    
    Your task:
    1. Score the fundamental sentiment of these headlines from -1.0 (Extremely Bearish) to 1.0 (Extremely Bullish).
    2. Provide a 2-3 sentence fundamental summary of why the stock might move.
    
    You MUST return the output in this EXACT JSON format, nothing else:
    {{
        "sentiment_score": 0.5,
        "summary": "Your short summary here."
    }}
    """
    
    try:
        response = model.generate_content(prompt)
        # Parse JSON from response
        raw_text = response.text.replace('```json', '').replace('```', '').strip()
        result = json.loads(raw_text)
        return float(result.get("sentiment_score", 0.0)), str(result.get("summary", "Analysis completed."))
    except Exception as e:
        print(f"[{ticker_symbol}] Gemini Error: {e}")
        return 0.0, "Fundamental analysis is currently unavailable."

def run_pipeline():
    print(f"Starting Enterprise ML Pipeline at {datetime.now()}...")
    init_db()
    
    for symbol in NIFTY_50:
        print(f"\n--- Analyzing {symbol} ---")
        
        # 1. Technical Analysis (Machine Learning)
        print("Training Technical Random Forest Model (RSI/MACD)...")
        historical_df, forecast = fetch_and_train(symbol)
        
        if historical_df is None:
            print(f"Skipping {symbol} due to missing data.")
            continue
            
        historical_data = historical_df.to_dict('records')
        
        # 2. Fundamental Analysis (LLM Sentiment)
        print("Fetching News & Running Gemini Sentiment Analysis...")
        sentiment, summary = analyze_fundamentals(symbol)
        print(f"Sentiment Score: {sentiment}")
        print(f"Summary: {summary}")
        
        # 3. Store in Database
        print("Saving to Enterprise SQLite Database...")
        upsert_analysis(symbol, historical_data, forecast, sentiment, summary)
        
        # Sleep to avoid rate limits
        time.sleep(2)
        
    print("\nPipeline Execution Completed Successfully!")

if __name__ == "__main__":
    run_pipeline()
