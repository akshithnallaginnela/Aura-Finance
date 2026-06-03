import sqlite3
import json
from pathlib import Path

DB_PATH = Path(__file__).parent / "aura_market.db"

def init_db():
    """Initializes the SQLite database and creates the necessary tables."""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.execute("""
        CREATE TABLE IF NOT EXISTS stock_analysis (
            ticker TEXT PRIMARY KEY,
            historical_data TEXT,
            forecast_data TEXT,
            sentiment_score REAL,
            fundamental_summary TEXT,
            last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)
    conn.commit()
    conn.close()

def upsert_analysis(ticker, historical_data, forecast_data, sentiment_score, fundamental_summary):
    """Inserts or updates the pre-computed analysis for a stock."""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    historical_json = json.dumps(historical_data)
    forecast_json = json.dumps(forecast_data)
    
    cursor.execute("""
        INSERT INTO stock_analysis (ticker, historical_data, forecast_data, sentiment_score, fundamental_summary, last_updated)
        VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
        ON CONFLICT(ticker) DO UPDATE SET
            historical_data=excluded.historical_data,
            forecast_data=excluded.forecast_data,
            sentiment_score=excluded.sentiment_score,
            fundamental_summary=excluded.fundamental_summary,
            last_updated=CURRENT_TIMESTAMP
    """, (ticker, historical_json, forecast_json, sentiment_score, fundamental_summary))
    
    conn.commit()
    conn.close()

def get_analysis(ticker):
    """Retrieves the pre-computed analysis for a stock."""
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    
    cursor.execute("SELECT * FROM stock_analysis WHERE ticker = ?", (ticker,))
    row = cursor.fetchone()
    conn.close()
    
    if row:
        return {
            "ticker": row["ticker"],
            "historical": json.loads(row["historical_data"]),
            "forecast": json.loads(row["forecast_data"]),
            "sentiment_score": row["sentiment_score"],
            "fundamental_summary": row["fundamental_summary"],
            "last_updated": row["last_updated"]
        }
    return None

if __name__ == "__main__":
    init_db()
    print(f"Database initialized at {DB_PATH}")
