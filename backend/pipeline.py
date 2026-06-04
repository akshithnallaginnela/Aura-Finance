import os
import time
import json
import numpy as np
import pandas as pd
import yfinance as yf
from datetime import datetime, timedelta
import google.generativeai as genai
from pathlib import Path
from dotenv import load_dotenv
import torch
from chronos import ChronosPipeline
from transformers import pipeline as hf_pipeline

from database import init_db, upsert_analysis

# Load the .env file from the root directory
env_path = Path(__file__).parent.parent / '.env'
load_dotenv(dotenv_path=env_path)

# Configure Gemini
api_keys_str = os.environ.get('VITE_GEMINI_API_KEYS') or os.environ.get('VITE_GEMINI_API_KEY')
if not api_keys_str:
    raise ValueError("VITE_GEMINI_API_KEYS or VITE_GEMINI_API_KEY is not set in the root .env file.")
api_keys = [k.strip() for k in api_keys_str.split(',') if k.strip()]
import random

# Define target universe — Full Nifty 50 (as of 2025-2026)
NIFTY_50 = [
    "RELIANCE.NS", "TCS.NS", "HDFCBANK.NS", "INFY.NS", "ICICIBANK.NS",
    "HINDUNILVR.NS", "SBIN.NS", "BAJFINANCE.NS", "BHARTIARTL.NS", "ITC.NS",
    "KOTAKBANK.NS", "LT.NS", "AXISBANK.NS", "ASIANPAINT.NS", "MARUTI.NS",
    "SUNPHARMA.NS", "TITAN.NS", "ULTRACEMCO.NS", "NESTLEIND.NS", "WIPRO.NS",
    "BAJAJFINSV.NS", "POWERGRID.NS", "NTPC.NS", "JSWSTEEL.NS", "TATASTEEL.NS",
    "M&M.NS", "HCLTECH.NS", "ADANIENT.NS", "ADANIPORTS.NS", "TECHM.NS",
    "INDUSINDBK.NS", "ONGC.NS", "COALINDIA.NS", "BPCL.NS", "GRASIM.NS",
    "DIVISLAB.NS", "DRREDDY.NS", "CIPLA.NS", "EICHERMOT.NS", "APOLLOHOSP.NS",
    "HEROMOTOCO.NS", "TATACONSUM.NS", "BRITANNIA.NS", "HINDALCO.NS", "SBILIFE.NS",
    "HDFCLIFE.NS", "SHRIRAMFIN.NS", "BAJAJ-AUTO.NS", "MRF.NS", "TRENT.NS"
]

print("Initializing Hugging Face Models...")
try:
    chronos = ChronosPipeline.from_pretrained(
        "amazon/chronos-t5-mini",
        device_map="cpu",
        torch_dtype=torch.float32,
    )
except Exception as e:
    print(f"Failed to load Chronos: {e}")
    chronos = None

try:
    finbert = hf_pipeline("sentiment-analysis", model="ProsusAI/finbert")
except Exception as e:
    print(f"Failed to load FinBERT: {e}")
    finbert = None


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
    """Fetches 1y historical data, enhances features, and predicts 30 days using Chronos Hugging Face model."""
    ticker = yf.Ticker(ticker_symbol)
    df = ticker.history(period="1y")
    
    if df.empty:
        print(f"[{ticker_symbol}] No data found.")
        return None, None
    
    df = df.reset_index()
    # Handle timezone aware datetimes by making them naive or converting to string
    df['Date'] = pd.to_datetime(df['Date']).dt.strftime('%Y-%m-%d')
    df = df[['Date', 'Open', 'High', 'Low', 'Close', 'Volume']]
    df[['Open', 'High', 'Low', 'Close']] = df[['Open', 'High', 'Low', 'Close']].round(2)
    
    df = add_technical_indicators(df)
    
    if chronos is None:
        return df, []

    # Use Chronos for Time Series prediction
    # Prepare historical context (closing prices)
    context = torch.tensor(df['Close'].values, dtype=torch.float32)
    prediction_length = 30
    
    try:
        # Generate forecast with chronos
        forecast = chronos.predict(context.unsqueeze(0), prediction_length=prediction_length)
        # forecast has shape (1, num_samples, prediction_length), take median
        median_forecast = np.median(forecast[0].numpy(), axis=0)
    except Exception as e:
        print(f"Chronos prediction failed for {ticker_symbol}: {e}")
        median_forecast = [df['Close'].iloc[-1]] * prediction_length
    
    predictions = []
    current_date = datetime.strptime(df['Date'].iloc[-1], '%Y-%m-%d')
    
    for val in median_forecast:
        # Shift forward one day, skipping weekends
        current_date += timedelta(days=1)
        while current_date.weekday() >= 5: # Skip weekends
            current_date += timedelta(days=1)
            
        predictions.append({
            "Date": current_date.strftime('%Y-%m-%d'),
            "PredictedClose": round(float(val), 2)
        })
        
    return df, predictions
def analyze_fundamentals(ticker_symbol):
    """Fetches recent news, uses FinBERT for Sentiment Scoring, and Gemini for Summary."""
    ticker = yf.Ticker(ticker_symbol)
    news = ticker.news
    
    if not news:
        return 0.0, "No recent news found for fundamental analysis."
        
    headlines = []
    for item in news[:10]: # Top 10 articles
        content = item.get('content', item) # Handle both old and new format
        title = content.get('title', '')
        provider = content.get('provider', {})
        publisher = provider.get('displayName', content.get('publisher', 'Unknown'))
        if title:
            headlines.append(f"{title} (Source: {publisher})")
            
    if not headlines:
        return 0.0, "No parseable news headlines were found for this asset today."
        
    # Calculate FinBERT sentiment score
    finbert_score = 0.0
    if finbert:
        try:
            results = finbert(headlines)
            total_score = 0
            for res in results:
                if res['label'] == 'positive':
                    total_score += res['score']
                elif res['label'] == 'negative':
                    total_score -= res['score']
            finbert_score = float(total_score / len(results))
        except Exception as e:
            print(f"FinBERT error for {ticker_symbol}: {e}")

    # Use Gemini to generate a summary
    news_text = "\n".join([f"- {h}" for h in headlines])
    prompt = f"""
    You are an elite quantitative financial analyst specializing in the Indian Stock Market.
    Analyze the following recent news headlines for the stock {ticker_symbol}.
    The calculated AI sentiment score (using FinBERT) is {finbert_score:.2f} (from -1.0 to 1.0).
    
    News Headlines:
    {news_text}
    
    Your task:
    Provide a 2-3 sentence fundamental summary of why the stock might move, taking the sentiment score into context.
    You MUST return the output in this EXACT JSON format, nothing else:
    {{
        "sentiment_score": {finbert_score:.2f},
        "summary": "Your short summary here."
    }}
    """
    
    # Add retry logic for Gemini rate limits (429)
    max_retries = 3
    retry_delay = 15 # Wait 15 seconds before retrying (free tier is 15 requests/min)
    
    for attempt in range(max_retries):
        try:
            import google.generativeai as genai
            genai.configure(api_key=random.choice(api_keys))
            model = genai.GenerativeModel('gemini-2.5-flash')
            response = model.generate_content(prompt)
            raw_text = response.text.replace('```json', '').replace('```', '').strip()
            
            try:
                result = json.loads(raw_text)
                return float(result.get("sentiment_score", finbert_score)), str(result.get("summary", "Analysis completed."))
            except json.JSONDecodeError:
                return finbert_score, raw_text.replace('{', '').replace('}', '').strip()
                
        except Exception as e:
            if "429" in str(e) or "Quota exceeded" in str(e):
                if attempt < max_retries - 1:
                    print(f"[{ticker_symbol}] Gemini Rate Limit hit. Waiting {retry_delay} seconds...", flush=True)
                    time.sleep(retry_delay)
                    continue
            print(f"[{ticker_symbol}] Gemini Error: {e}", flush=True)
            return finbert_score, "Fundamental analysis summary unavailable due to API limits or errors."
            
    return finbert_score, "Fundamental analysis summary unavailable due to API limits."

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
