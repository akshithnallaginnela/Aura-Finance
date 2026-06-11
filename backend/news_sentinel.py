"""
Aura Finance — 24/7 News Sentinel Agent
=========================================
Runs continuously in the background. Every 5 minutes, it scans all Nifty 50 
stocks for NEW news articles. When ANY new article is found, it immediately:
  1. Runs sentiment analysis on the new headlines
  2. Checks for disaster keywords
  3. Triggers a full ensemble re-prediction for that ticker
  4. Updates the database with the new forecast

This ensures predictions are always fresh and react to real-world events.
"""

import os
import sys
import time
import hashlib
import json
import random
import numpy as np
import yfinance as yf
from datetime import datetime
from pathlib import Path
from dotenv import load_dotenv

# Load env
env_path = Path(__file__).parent.parent / '.env'
load_dotenv(dotenv_path=env_path)

# These imports will also initialize the sentiment analysis (from pipeline.py)
from pipeline import (
    NIFTY_50, DISASTER_KEYWORDS, finbert, chronos,
    repredict_ticker, analyze_fundamentals
)
from database import init_db, is_headline_seen, mark_headline_seen, get_analysis

import google.generativeai as genai

api_keys_str = os.environ.get('VITE_GEMINI_API_KEYS') or os.environ.get('VITE_GEMINI_API_KEY')
api_keys = [k.strip() for k in (api_keys_str or '').split(',') if k.strip()]

# ─── Configuration ────────────────────────────────────────────────────────────

POLL_INTERVAL_SECONDS = 300  # 5 minutes between full scans
BATCH_DELAY_SECONDS = 2      # Delay between processing each ticker (rate limits)

# ─── Helpers ──────────────────────────────────────────────────────────────────

def hash_headline(text):
    """Create a stable hash of a headline for deduplication."""
    return hashlib.md5(text.encode('utf-8')).hexdigest()


def extract_headlines(ticker_symbol):
    """Fetch news from yfinance and return list of headline strings."""
    try:
        ticker = yf.Ticker(ticker_symbol)
        news = ticker.news
        if not news:
            return []
        
        headlines = []
        for item in news[:15]:  # Check up to 15 articles
            content = item.get('content', item)
            title = content.get('title', '')
            if title and len(title) > 10:
                headlines.append(title.strip())
        return headlines
    except Exception as e:
        print(f"  [ERROR] Failed to fetch news for {ticker_symbol}: {e}")
        return []


def score_headlines_finbert(headlines):
    """Run sentiment analysis on a list of headlines. Returns average sentiment score."""
    if not finbert or not headlines:
        return 0.0
    
    try:
        results = finbert(headlines)
        total = 0
        for res in results:
            if res['label'] == 'positive':
                total += res['score']
            elif res['label'] == 'negative':
                total -= res['score']
        return float(total / len(results))
    except Exception as e:
        print(f"  [ERROR] Sentiment scoring failed: {e}")
        return 0.0


def detect_disaster_risk(headlines):
    """Check headlines for disaster keywords. Returns risk score 0-1."""
    all_text = " ".join(headlines).lower()
    hits = sum(1 for kw in DISASTER_KEYWORDS if kw in all_text)
    return min(hits * 0.15, 1.0)


def generate_quick_summary(ticker_symbol, headlines, sentiment, disaster_risk):
    """Use Advisory Engine to generate a quick summary of new headlines."""
    if not api_keys:
        return f"New articles detected. Sentiment: {sentiment:.2f}"
    
    news_text = "\n".join([f"- {h}" for h in headlines[:5]])
    prompt = f"""
    You are a financial news analyst. Briefly summarize (2 sentences max) 
    the impact of these new headlines on {ticker_symbol}:
    {news_text}
    Sentiment: {sentiment:.2f}, Disaster risk: {disaster_risk:.2f}
    Return ONLY the summary text, no JSON.
    """
    
    try:
        genai.configure(api_key=random.choice(api_keys))
        model = genai.GenerativeModel('gemini-1.5-flash')
        response = model.generate_content(prompt)
        return response.text.strip()[:500]
    except Exception as e:
        return f"New articles detected. Sentiment: {sentiment:.2f}"


# ─── Main Sentinel Loop ──────────────────────────────────────────────────────

def run_sentinel():
    """
    The main 24/7 loop. Scans all tickers for new news every POLL_INTERVAL_SECONDS.
    Any new headline → immediate re-prediction.
    """
    print(f"\n{'='*60}")
    print(f"  [SENTINEL] AURA NEWS SENTINEL — ONLINE")
    print(f"  Monitoring: {len(NIFTY_50)} stocks")
    print(f"  Poll Interval: {POLL_INTERVAL_SECONDS}s ({POLL_INTERVAL_SECONDS//60} min)")
    print(f"  Mode: RE-PREDICT on ANY new news article")
    print(f"  Time: {datetime.now()}")
    print(f"{'='*60}\n")
    
    init_db()
    cycle = 0
    
    while True:
        cycle += 1
        scan_start = datetime.now()
        print(f"\n[Cycle {cycle}] Starting full scan at {scan_start.strftime('%Y-%m-%d %H:%M:%S')}")
        
        tickers_updated = 0
        total_new_headlines = 0
        
        for ticker_symbol in NIFTY_50:
            try:
                headlines = extract_headlines(ticker_symbol)
                if not headlines:
                    continue
                
                # Find NEW headlines (ones we haven't seen before)
                new_headlines = []
                for headline in headlines:
                    h_hash = hash_headline(headline)
                    if not is_headline_seen(ticker_symbol, h_hash):
                        new_headlines.append(headline)
                
                if not new_headlines:
                    continue
                
                # NEW NEWS FOUND — process it!
                total_new_headlines += len(new_headlines)
                print(f"\n  [NEWS] {ticker_symbol}: {len(new_headlines)} NEW headline(s) detected!")
                for h in new_headlines[:3]:
                    print(f"     → {h[:80]}...")
                
                # Score with sentiment classifier
                sentiment = score_headlines_finbert(new_headlines)
                disaster_risk = detect_disaster_risk(new_headlines)
                
                print(f"     Sentiment: {sentiment:+.2f} | Disaster Risk: {disaster_risk:.2f}")
                
                # Mark all new headlines as seen
                for headline in new_headlines:
                    h_hash = hash_headline(headline)
                    mark_headline_seen(ticker_symbol, h_hash, headline, sentiment)
                
                # Generate a quick summary
                summary = generate_quick_summary(
                    ticker_symbol, new_headlines, sentiment, disaster_risk
                )
                
                # TRIGGER RE-PREDICTION
                print(f"     [*] Triggering ensemble re-prediction...")
                success = repredict_ticker(
                    ticker_symbol,
                    new_sentiment=sentiment,
                    new_disaster_risk=disaster_risk,
                    new_summary=summary,
                    new_news_count=len(new_headlines)
                )
                
                if success:
                    tickers_updated += 1
                    print(f"     [OK] {ticker_symbol} forecast UPDATED!")
                else:
                    print(f"     [FAIL] {ticker_symbol} re-prediction failed.")
                
                # Rate limit protection
                time.sleep(BATCH_DELAY_SECONDS)
                
            except Exception as e:
                print(f"  [ERROR] {ticker_symbol}: {e}")
                continue
        
        scan_duration = (datetime.now() - scan_start).total_seconds()
        print(f"\n[Cycle {cycle}] Scan complete in {scan_duration:.1f}s")
        print(f"  New headlines found: {total_new_headlines}")
        print(f"  Tickers re-predicted: {tickers_updated}")
        print(f"  Next scan in {POLL_INTERVAL_SECONDS}s ({POLL_INTERVAL_SECONDS//60} min)...")
        
        # Wait for next cycle
        time.sleep(POLL_INTERVAL_SECONDS)


if __name__ == "__main__":
    try:
        run_sentinel()
    except KeyboardInterrupt:
        print("\n\n[STOP] News Sentinel stopped by user.")
        sys.exit(0)
