import os
import json
import psycopg2
from psycopg2.extras import RealDictCursor
from pathlib import Path
from dotenv import load_dotenv

# Load the .env file from the root directory
env_path = Path(__file__).parent.parent / '.env'
load_dotenv(dotenv_path=env_path)

DATABASE_URL = os.environ.get("DATABASE_URL")
if not DATABASE_URL:
    raise ValueError("DATABASE_URL is not set in the root .env file.")

def get_connection():
    """Returns a psycopg2 connection to Supabase PostgreSQL."""
    return psycopg2.connect(DATABASE_URL)

def init_db():
    """Initializes the PostgreSQL database and creates the necessary tables."""
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS stock_analysis (
            ticker TEXT PRIMARY KEY,
            historical_data JSONB,
            forecast_data JSONB,
            sentiment_score REAL,
            fundamental_summary TEXT,
            last_updated TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        )
    """)
    conn.commit()
    cursor.close()
    conn.close()

def upsert_analysis(ticker, historical_data, forecast_data, sentiment_score, fundamental_summary):
    """Inserts or updates the pre-computed analysis for a stock in Supabase."""
    conn = get_connection()
    cursor = conn.cursor()
    
    historical_json = json.dumps(historical_data)
    forecast_json = json.dumps(forecast_data)
    
    cursor.execute("""
        INSERT INTO stock_analysis (ticker, historical_data, forecast_data, sentiment_score, fundamental_summary, last_updated)
        VALUES (%s, %s, %s, %s, %s, CURRENT_TIMESTAMP)
        ON CONFLICT (ticker) DO UPDATE SET
            historical_data = EXCLUDED.historical_data,
            forecast_data = EXCLUDED.forecast_data,
            sentiment_score = EXCLUDED.sentiment_score,
            fundamental_summary = EXCLUDED.fundamental_summary,
            last_updated = CURRENT_TIMESTAMP
    """, (ticker, historical_json, forecast_json, sentiment_score, fundamental_summary))
    
    conn.commit()
    cursor.close()
    conn.close()

def get_analysis(ticker):
    """Retrieves the pre-computed analysis for a stock from Supabase."""
    conn = get_connection()
    cursor = conn.cursor(cursor_factory=RealDictCursor)
    
    cursor.execute("SELECT * FROM stock_analysis WHERE ticker = %s", (ticker,))
    row = cursor.fetchone()
    
    cursor.close()
    conn.close()
    
    if row:
        return {
            "ticker": row["ticker"],
            # psycopg2 automatically parses JSONB columns into Python dicts/lists
            "historical": row["historical_data"],
            "forecast": row["forecast_data"],
            "sentiment_score": row["sentiment_score"],
            "fundamental_summary": row["fundamental_summary"],
            "last_updated": row["last_updated"].isoformat() if row["last_updated"] else None
        }
    return None

if __name__ == "__main__":
    init_db()
    print("PostgreSQL/Supabase database initialized successfully.")
