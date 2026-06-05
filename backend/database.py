"""
Aura Finance — Database Layer
==============================
PostgreSQL/Supabase database with support for ensemble forecasts,
confidence bands, and disaster risk scoring.
"""

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
    """Initializes the PostgreSQL database and creates/updates the necessary tables."""
    conn = get_connection()
    cursor = conn.cursor()
    
    # Create table if it doesn't exist
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS stock_analysis (
            ticker TEXT PRIMARY KEY,
            historical_data JSONB,
            forecast_data JSONB,
            sentiment_score REAL,
            fundamental_summary TEXT,
            disaster_risk_score REAL DEFAULT 0.0,
            confidence_upper JSONB,
            confidence_lower JSONB,
            last_updated TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        )
    """)
    
    # Add new columns if they don't exist (for existing databases)
    for col, col_type, default in [
        ("disaster_risk_score", "REAL", "0.0"),
        ("confidence_upper", "JSONB", "NULL"),
        ("confidence_lower", "JSONB", "NULL"),
    ]:
        try:
            cursor.execute(f"""
                ALTER TABLE stock_analysis ADD COLUMN IF NOT EXISTS {col} {col_type} DEFAULT {default}
            """)
        except Exception:
            pass  # Column already exists
    
    # Create table for news sentinel tracking
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS seen_headlines (
            id SERIAL PRIMARY KEY,
            ticker TEXT NOT NULL,
            headline_hash TEXT NOT NULL,
            headline TEXT,
            sentiment_score REAL,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(ticker, headline_hash)
        )
    """)
    
    conn.commit()
    cursor.close()
    conn.close()

def upsert_analysis(ticker, historical_data, forecast_data, sentiment_score, 
                     fundamental_summary, disaster_risk_score=0.0,
                     confidence_upper=None, confidence_lower=None):
    """Inserts or updates the pre-computed analysis for a stock."""
    conn = get_connection()
    cursor = conn.cursor()
    
    historical_json = json.dumps(historical_data)
    forecast_json = json.dumps(forecast_data)
    upper_json = json.dumps(confidence_upper) if confidence_upper else None
    lower_json = json.dumps(confidence_lower) if confidence_lower else None
    
    cursor.execute("""
        INSERT INTO stock_analysis (
            ticker, historical_data, forecast_data, sentiment_score, 
            fundamental_summary, disaster_risk_score, 
            confidence_upper, confidence_lower, last_updated
        )
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, CURRENT_TIMESTAMP)
        ON CONFLICT (ticker) DO UPDATE SET
            historical_data = EXCLUDED.historical_data,
            forecast_data = EXCLUDED.forecast_data,
            sentiment_score = EXCLUDED.sentiment_score,
            fundamental_summary = EXCLUDED.fundamental_summary,
            disaster_risk_score = EXCLUDED.disaster_risk_score,
            confidence_upper = EXCLUDED.confidence_upper,
            confidence_lower = EXCLUDED.confidence_lower,
            last_updated = CURRENT_TIMESTAMP
    """, (ticker, historical_json, forecast_json, sentiment_score, 
          fundamental_summary, disaster_risk_score, upper_json, lower_json))
    
    conn.commit()
    cursor.close()
    conn.close()

def get_analysis(ticker):
    """Retrieves the pre-computed analysis for a stock."""
    conn = get_connection()
    cursor = conn.cursor(cursor_factory=RealDictCursor)
    
    cursor.execute("SELECT * FROM stock_analysis WHERE ticker = %s", (ticker,))
    row = cursor.fetchone()
    
    cursor.close()
    conn.close()
    
    if row:
        return {
            "ticker": row["ticker"],
            "historical": row["historical_data"],
            "forecast": row["forecast_data"],
            "sentiment_score": row["sentiment_score"],
            "fundamental_summary": row["fundamental_summary"],
            "disaster_risk_score": row.get("disaster_risk_score", 0.0),
            "confidence_upper": row.get("confidence_upper"),
            "confidence_lower": row.get("confidence_lower"),
            "last_updated": row["last_updated"].isoformat() if row["last_updated"] else None
        }
    return None


# ─── News Sentinel helpers ────────────────────────────────────────────────────

def is_headline_seen(ticker, headline_hash):
    """Check if a headline has already been processed."""
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute(
        "SELECT 1 FROM seen_headlines WHERE ticker = %s AND headline_hash = %s",
        (ticker, headline_hash)
    )
    exists = cursor.fetchone() is not None
    cursor.close()
    conn.close()
    return exists

def mark_headline_seen(ticker, headline_hash, headline_text, sentiment_score):
    """Mark a headline as processed."""
    conn = get_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("""
            INSERT INTO seen_headlines (ticker, headline_hash, headline, sentiment_score)
            VALUES (%s, %s, %s, %s)
            ON CONFLICT (ticker, headline_hash) DO NOTHING
        """, (ticker, headline_hash, headline_text[:500], sentiment_score))
        conn.commit()
    except Exception:
        conn.rollback()
    finally:
        cursor.close()
        conn.close()


if __name__ == "__main__":
    init_db()
    print("PostgreSQL/Supabase database initialized successfully with ensemble schema.")
