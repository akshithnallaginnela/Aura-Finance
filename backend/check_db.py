import os
import psycopg2
from pathlib import Path
from dotenv import load_dotenv
import yfinance as yf

env_path = Path(__file__).parent.parent / '.env'
load_dotenv(dotenv_path=env_path)

DATABASE_URL = os.environ.get("DATABASE_URL")
print("DATABASE_URL exists:", bool(DATABASE_URL))

try:
    conn = psycopg2.connect(DATABASE_URL)
    cursor = conn.cursor()
    cursor.execute("SELECT COUNT(*) FROM stock_analysis")
    count = cursor.fetchone()[0]
    print("Number of records in stock_analysis:", count)
    
    cursor.execute("SELECT ticker, last_updated FROM stock_analysis LIMIT 5")
    rows = cursor.fetchall()
    print("Sample records:")
    for r in rows:
        print("  -", r)
        
    cursor.close()
    conn.close()
except Exception as e:
    print("Database Error:", e)

try:
    print("Testing yfinance for ^NSEI...")
    ticker = yf.Ticker("^NSEI")
    hist = ticker.history(period="2y")
    print("  ^NSEI history shape:", hist.shape)
    if hist.empty:
        print("  ^NSEI history is EMPTY!")
except Exception as e:
    print("yfinance ^NSEI error:", e)

try:
    print("Testing yfinance for RELIANCE.NS...")
    ticker = yf.Ticker("RELIANCE.NS")
    hist = ticker.history(period="2y")
    print("  RELIANCE.NS history shape:", hist.shape)
    if hist.empty:
        print("  RELIANCE.NS history is EMPTY!")
    print("Testing yfinance info for RELIANCE.NS...")
    info = ticker.info
    print("  RELIANCE.NS info trailingPE:", info.get("trailingPE"))
except Exception as e:
    print("yfinance RELIANCE.NS error:", e)
