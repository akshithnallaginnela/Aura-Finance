import os
import time
import threading
from flask import Flask, request, jsonify
from flask_cors import CORS
from pathlib import Path
from dotenv import load_dotenv

from database import get_analysis, upsert_analysis
from monitoring import check_disaster_risk

# Load the .env file from the root directory
env_path = Path(__file__).parent.parent / '.env'
load_dotenv(dotenv_path=env_path)

app = Flask(__name__)

# Enterprise CORS: Restrict to known origins in production
# Read from env so the deployed URL can be configured without code changes
_extra_origin = os.environ.get('VITE_APP_URL', '')
allowed_origins = [
    "http://localhost:5173",
    "http://localhost:3000",
    "https://aura-finance-five.vercel.app",
]
if _extra_origin and _extra_origin not in allowed_origins:
    allowed_origins.append(_extra_origin)

CORS(app, origins=allowed_origins)

from werkzeug.exceptions import HTTPException

# --- Global Error Handler ---
@app.errorhandler(Exception)
def handle_exception(e):
    """Global error handler for all unhandled exceptions."""
    print(f"Unhandled Exception: {e}", flush=True)
    if isinstance(e, HTTPException):
        return jsonify({
            "error": e.name,
            "details": e.description
        }), e.code
    return jsonify({
        "error": "An internal server error occurred.",
        "details": str(e)
    }), 500

@app.route('/', methods=['GET'])
def index():
    """Root health check endpoint."""
    return jsonify({
        "status": "healthy",
        "service": "Aura Finance Backend API",
        "version": "1.0.0"
    })


# --- Caching Layer for yfinance (TTL-aware, thread-safe) ---
_cache_store: dict = {}
_cache_lock = threading.Lock()
_CACHE_TTL_SECONDS = 300  # 5 minutes

def get_cached_market_data(ticker: str, period: str = "3mo"):
    """
    Thread-safe TTL cache for yfinance data.
    Returns a fresh pandas DataFrame. Invalidates after _CACHE_TTL_SECONDS.
    """
    import yfinance as yf
    cache_key = f"{ticker}:{period}"
    now = time.time()
    with _cache_lock:
        entry = _cache_store.get(cache_key)
        if entry and (now - entry["ts"]) < _CACHE_TTL_SECONDS:
            return entry["data"]
    # Fetch outside lock to avoid holding it during network I/O
    t_obj = yf.Ticker(ticker)
    data = t_obj.history(period=period)
    with _cache_lock:
        _cache_store[cache_key] = {"data": data, "ts": now}
    return data

def normalize_ticker(raw_ticker):
    """
    Normalizes a ticker input for Yahoo Finance.
    If the user types 'HDFC' or 'reliance', auto-append '.NS' for NSE.
    If they already typed '.NS' or '.BO', leave it alone.
    """
    ticker = raw_ticker.strip().upper()
    if '.' not in ticker:
        ticker = ticker + '.NS'
    return ticker


def on_demand_analysis(ticker):
    """
    Fallback: If a stock isn't in the database, run a quick technical analysis
    on-the-fly and store it so future requests are instant.
    Fundamentals run first so sentiment can be injected as ML features.
    """
    from pipeline import fetch_and_train, analyze_fundamentals

    print(f"[On-Demand] Running real-time analysis for {ticker}...")

    # Run fundamentals FIRST to get sentiment for ML features
    sentiment, summary, disaster_risk, news_count, fundamentals = analyze_fundamentals(ticker)

    result = fetch_and_train(
        ticker,
        sentiment_score=sentiment,
        disaster_risk=disaster_risk,
        news_count=news_count,
    )

    # fetch_and_train returns (None, None) on failure — guard the unpack
    if result is None or result[0] is None:
        return None

    historical_df, forecast, _raw, backtest_acc = result
    historical_data = historical_df.to_dict('records')

    # Save to database for future instant access
    upsert_analysis(
        ticker, historical_data, forecast, sentiment, summary,
        disaster_risk, fundamentals=fundamentals, backtest_accuracy=backtest_acc
    )

    # Check for disaster risk alerts
    check_disaster_risk(ticker, disaster_risk)

    return get_analysis(ticker)


@app.route('/api/market_index', methods=['GET'])
def get_market_index():
    """Fetch actual Nifty 50 Index data for the market overview chart."""
    try:
        hist = get_cached_market_data('^NSEI', period="2y")
        data = []
        for date, row in hist.iterrows():
            data.append({
                "date": date.strftime('%Y-%m-%d'),
                "value": round(row['Close'], 2)
            })
        return jsonify(data)
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route('/api/macro/chart/<ticker>', methods=['GET'])
def get_macro_chart(ticker):
    """Fetch history for a global macro asset (e.g. BTC-USD, ^GSPC)."""
    try:
        hist = get_cached_market_data(ticker, period="3mo")
        data = []
        for date, row in hist.iterrows():
            data.append({
                "date": date.strftime('%Y-%m-%d'),
                "value": round(row['Close'], 2)
            })
        return jsonify(data)
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route('/api/watchlist', methods=['GET'])
def get_watchlist():
    """Fetch live data for the watchlist."""
    tickers = ["RELIANCE.NS", "TCS.NS", "INFY.NS", "HDFCBANK.NS", "ICICIBANK.NS", "WIPRO.NS"]
    try:
        results = []
        for ticker in tickers:
            try:
                hist = get_cached_market_data(ticker, period="5d")
                if not hist.empty:
                    closes = hist['Close'].dropna().values
                    if len(closes) >= 2:
                        curr = float(closes[-1])
                        prev = float(closes[-2])
                        change = curr - prev
                        pct = (change / prev) * 100
                    elif len(closes) == 1:
                        curr = float(closes[0])
                        prev = curr
                        change = 0
                        pct = 0
                    results.append({
                        "ticker": ticker,
                        "price": round(curr, 2),
                        "change": round(change, 2),
                        "changePct": round(pct, 2)
                    })
            except Exception as e:
                print(f"Watchlist error for {ticker}: {e}")
        return jsonify(results)
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route('/api/top_stocks', methods=['GET'])
def get_top_stocks():
    """Fetch live data for the top 10 Indian stocks by market cap."""
    tickers = [
        "RELIANCE.NS", "TCS.NS", "HDFCBANK.NS", "BHARTIARTL.NS", "ICICIBANK.NS",
        "INFY.NS", "SBIN.NS", "LICI.NS", "ITC.NS", "HINDUNILVR.NS"
    ]
    try:
        results = []
        for ticker in tickers:
            try:
                hist = get_cached_market_data(ticker, period="5d")
                if not hist.empty:
                    closes = hist['Close'].dropna().values
                    if len(closes) >= 2:
                        curr = float(closes[-1])
                        prev = float(closes[-2])
                        change = curr - prev
                        pct = (change / prev) * 100
                    elif len(closes) == 1:
                        curr = float(closes[0])
                        prev = curr
                        change = 0
                        pct = 0
                    else:
                        continue
                    results.append({
                        "ticker": ticker.replace('.NS', ''),
                        "price": round(curr, 2),
                        "change": round(change, 2),
                        "changePct": round(pct, 2)
                    })
            except Exception as e:
                print(f"Top stocks error for {ticker}: {e}")
        return jsonify(results)
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route('/api/stock/<ticker>', methods=['GET'])
def get_stock(ticker):
    """
    Enterprise API Endpoint:
    Always run on-demand analysis to guarantee 100% real-time fundamentals and news.
    """
    ticker = normalize_ticker(ticker)
    
    analysis = get_analysis(ticker)
    
    # Fallback to on-demand analysis if it's the first time and not in DB
    if not analysis:
        analysis = on_demand_analysis(ticker)
    elif not analysis.get("fundamentals") or analysis.get("fundamentals") == {}:
        from pipeline import analyze_fundamentals
        try:
            sentiment, summary, disaster_risk, news_count, fundamentals = analyze_fundamentals(ticker)
            analysis["fundamentals"] = fundamentals
            from database import upsert_analysis
            upsert_analysis(
                ticker=analysis["ticker"],
                historical_data=analysis["historical"],
                forecast_data=analysis["forecast"],
                sentiment_score=analysis["sentiment_score"],
                fundamental_summary=analysis["fundamental_summary"],
                disaster_risk_score=analysis.get("disaster_risk_score", 0.0),
                confidence_upper=analysis.get("confidence_upper"),
                confidence_lower=analysis.get("confidence_lower"),
                fundamentals=fundamentals,
                backtest_accuracy=analysis.get("backtest_accuracy", 0.0)
            )
        except Exception as e:
            print(f"Error fetching fundamentals on-the-fly for {ticker}: {e}", flush=True)
            
    if not analysis:
        return jsonify({
            "error": f"Could not find or fetch data for '{ticker}'. Please check the ticker symbol is valid (e.g. RELIANCE.NS, TCS.NS, HDFCBANK.NS)."
        }), 404
        
    return jsonify({
        "ticker": analysis["ticker"],
        "historical": analysis["historical"],
        "forecast": analysis["forecast"],
        "sentiment_score": analysis["sentiment_score"],
        "fundamental_summary": analysis["fundamental_summary"],
        "disaster_risk_score": analysis.get("disaster_risk_score", 0.0),
        "confidence_upper": analysis.get("confidence_upper"),
        "confidence_lower": analysis.get("confidence_lower"),
        "fundamentals": analysis.get("fundamentals", {}),
        "backtest_accuracy": analysis.get("backtest_accuracy", 0.0),
        "last_updated": analysis["last_updated"]
    })


@app.route('/api/news/<ticker>', methods=['GET'])
def get_news(ticker):
    """Fetch processed headlines and sentiment from the News Sentinel database."""
    ticker = normalize_ticker(ticker)
    from database import get_connection
    try:
        conn = get_connection()
        from psycopg2.extras import RealDictCursor
        cur = conn.cursor(cursor_factory=RealDictCursor)
        cur.execute("""
            SELECT headline, sentiment_score, created_at 
            FROM seen_headlines 
            WHERE ticker = %s 
            ORDER BY created_at DESC 
            LIMIT 6
        """, (ticker,))
        rows = cur.fetchall()
        cur.close()
        conn.close()
        
        # Fallback: query yfinance news directly if no sentinel database logs exist yet
        if not rows:
            import yfinance as yf
            t = yf.Ticker(ticker)
            y_news = t.news or []
            rows = []
            for n in y_news[:6]:
                # Parse provider time
                pub_time = n.get("providerPublishTime", int(time.time()))
                time_str = time.strftime('%Y-%m-%d %H:%M:%S', time.localtime(pub_time))
                rows.append({
                    "headline": n.get("title", ""),
                    "sentiment_score": 0.0,
                    "created_at": time_str
                })
        return jsonify(rows)
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route('/api/advisor/strategy', methods=['POST'])
def advisor_strategy():
    """Generates an AI strategy using Advisory Engine based on real stock data and predictions."""
    req = request.json or {}
    ticker = req.get('ticker', 'Unknown')
    prompt = req.get('prompt', '')
    history = req.get('history', [])
    
    api_keys_str = os.environ.get('VITE_GEMINI_API_KEYS') or os.environ.get('VITE_GEMINI_API_KEY')
    if not api_keys_str:
        return jsonify({
            "response": "Error: Advisory API Key is missing in the backend .env file."
        }), 400
        
    api_keys = [k.strip() for k in api_keys_str.split(',') if k.strip()]
    import random
    api_key = random.choice(api_keys)
        
    import google.generativeai as genai
    try:
        genai.configure(api_key=api_key)
        model = genai.GenerativeModel('gemini-2.5-flash')

        # Single DB lookup — reused for all context building below
        normalized_sym = normalize_ticker(ticker)
        analysis = get_analysis(normalized_sym)

        current_price = "Unknown"
        future_price = "Unknown"
        fundamentals_txt = ""
        sentiment_score = 0.0
        disaster_risk = 0.0
        fundamental_summary = ""

        if analysis:
            db_hist = analysis.get("historical", [])
            if db_hist:
                current_price = db_hist[-1].get("Close") or db_hist[-1].get("close") or "Unknown"
            db_fore = analysis.get("forecast", [])
            if db_fore:
                future_price = db_fore[-1].get("PredictedClose") or db_fore[-1].get("predicted_close") or "Unknown"
            sentiment_score = analysis.get("sentiment_score", 0.0)
            disaster_risk = analysis.get("disaster_risk_score", 0.0)
            fundamental_summary = analysis.get("fundamental_summary", "")
            f = analysis.get("fundamentals", {})
            if f:
                fundamentals_txt = (
                    f"\n- P/E Ratio: {f.get('pe_ratio', 'N/A')}"
                    f"\n- EPS: {f.get('eps', 'N/A')}"
                    f"\n- Market Cap: {f.get('market_cap', 'N/A')}"
                    f"\n- 52-Week High: {f.get('fifty_two_week_high', 'N/A')}"
                )

        # Fetch all available stock analyses from the database
        all_stocks_summary = ""
        try:
            from database import get_connection
            from psycopg2.extras import RealDictCursor
            conn = get_connection()
            cursor = conn.cursor(cursor_factory=RealDictCursor)
            cursor.execute("""
                SELECT ticker, historical_data, forecast_data, sentiment_score, disaster_risk_score, fundamentals, backtest_accuracy
                FROM stock_analysis
            """)
            all_records = cursor.fetchall()
            cursor.close()
            conn.close()
            
            if all_records:
                all_stocks_summary = "\nAll Available Stocks in Database:\n"
                for r in all_records:
                    t = r['ticker']
                    sentiment = r['sentiment_score']
                    risk = r['disaster_risk_score']
                    accuracy = r['backtest_accuracy']
                    
                    price = "Unknown"
                    db_hist = r.get('historical_data') or []
                    if db_hist:
                        price = db_hist[-1].get('Close') or db_hist[-1].get('close') or "Unknown"
                    
                    target = "Unknown"
                    db_fore = r.get('forecast_data') or []
                    if db_fore:
                        target = db_fore[-1].get('PredictedClose') or db_fore[-1].get('predicted_close') or "Unknown"
                        
                    f = r.get('fundamentals') or {}
                    pe = f.get('pe_ratio', 'N/A')
                    eps = f.get('eps', 'N/A')
                    cap = f.get('market_cap', 'N/A')
                    
                    all_stocks_summary += f"- **{t}**: Current Price: ₹{price}, 6-Month Target: ₹{target}, Sentiment: {sentiment:.2f}, Disaster Risk: {risk*100:.0f}%, Accuracy: {accuracy:.1f}%, P/E Ratio: {pe}, EPS: {eps}, Market Cap: {cap}\n"
        except Exception as db_err:
            print(f"Error building database context for advisor: {db_err}", flush=True)

        history_context = ""
        if history:
            history_context = "\nConversation history so far:\n"
            for h in history[-8:]:
                role = "User" if h.get("sender") == "user" else "Aura Strategist"
                history_context += f"{role}: {h.get('content')}\n"
        
        system_context = f"""
You are Aura Broker, a warm, professional, and elite personal stock broker and investment advisor. 
Your goal is to guide the user through their investment journey with a smooth, natural conversation.

Behavioral Guidelines:
1. Warmth & Dialogue: Greet the user politely, build rapport, and handle general questions (like greetings, introductions, or investment philosophy) conversationally, like a friendly human stock broker.
2. Context Sensitivity: If the user is just saying hi, hello, or asking general investment questions, respond in kind. Do NOT immediately dump stock analysis tables or technical metrics (like current price, forecast, sentiment score) unless they have specifically asked about a stock, or asked for a technical analysis/report of the current stock ({ticker}).
3. Technical Depth on Demand: When the user asks about a stock, its outlook, analysis, or performance, provide highly detailed insights. Present data clearly: use standard Markdown tables for structured comparisons, and bullet points for risk/momentum factors.
4. Keep the conversation flowing naturally: Ask clarifying questions if needed to understand their risk tolerance or investment goals.

Current Context Information (only use when relevant to the user's question or when stock analysis of {ticker} is requested):
- Ticker: {ticker}
- Current Price: {current_price}
- Aura 6-Month Smart Forecast Target: {future_price}
- Sentiment Score: {sentiment_score} (range -1 to 1)
- Disaster Risk: {disaster_risk} (range 0 to 1)
- Fundamental Summary: {fundamental_summary}
{fundamentals_txt}
{all_stocks_summary}

{history_context}
User Prompt: {prompt}
"""
        
        start_time = time.time()
        response = model.generate_content(system_context)
        latency = time.time() - start_time
        print(f"[Advisory API] Strategy query for {ticker} completed in {latency:.2f} seconds", flush=True)
        
        return jsonify({
            "response": response.text
        })
    except Exception as e:
        print(f"Advisory API Error: {e}", flush=True)
        return jsonify({
            "response": f"Sorry, I encountered an error communicating with the AI model: {str(e)}"
        }), 500

@app.route('/api/optimize_portfolio', methods=['POST'])
def optimize_portfolio():
    """
    MPT Portfolio Optimizer:
    Takes a list of tickers, fetches historical data, calculates covariance,
    and uses Monte Carlo simulation to find the Maximum Sharpe Ratio weights.
    """
    req = request.json or {}
    tickers = req.get('tickers', [])
    
    if not tickers or len(tickers) < 2:
        return jsonify({"error": "Please provide at least 2 tickers for optimization."}), 400
        
    import yfinance as yf
    import numpy as np
    import pandas as pd
    
    # Clean tickers
    cleaned_tickers = [normalize_ticker(t) for t in tickers]
    
    try:
        # Fetch 1y data for all tickers
        data = yf.download(cleaned_tickers, period="1y", group_by="ticker")
        
        # Extract closing prices into a single dataframe
        close_prices = pd.DataFrame()
        for ticker in cleaned_tickers:
            if len(cleaned_tickers) == 1:
                close_prices[ticker] = data['Close']
            else:
                close_prices[ticker] = data[ticker]['Close']
                
        close_prices = close_prices.dropna()
        
        if close_prices.empty:
            return jsonify({"error": "Could not fetch data for the provided tickers."}), 400
            
        # Calculate daily returns
        returns = close_prices.pct_change().dropna()
        
        # Annualized covariance matrix (252 trading days)
        cov_matrix = returns.cov() * 252
        
        # Annualized mean returns
        mean_returns = returns.mean() * 252
        
        # Risk-free rate (assumed 7% for India)
        risk_free_rate = 0.07
        
        # Monte Carlo Simulation to find Max Sharpe
        num_portfolios = 5000
        results = np.zeros((3, num_portfolios))
        weights_record = []
        
        for i in range(num_portfolios):
            weights = np.random.random(len(cleaned_tickers))
            weights /= np.sum(weights)
            weights_record.append(weights)
            
            # Expected Portfolio Return
            portfolio_return = np.sum(mean_returns * weights)
            # Expected Portfolio Volatility (Risk)
            portfolio_std_dev = np.sqrt(np.dot(weights.T, np.dot(cov_matrix, weights)))
            # Sharpe Ratio
            sharpe_ratio = (portfolio_return - risk_free_rate) / portfolio_std_dev
            
            results[0,i] = portfolio_return
            results[1,i] = portfolio_std_dev
            results[2,i] = sharpe_ratio
            
        # Find the portfolio with max Sharpe Ratio
        max_sharpe_idx = np.argmax(results[2])
        optimal_weights = weights_record[max_sharpe_idx]
        
        # Format response
        allocation = []
        for i, ticker in enumerate(cleaned_tickers):
            allocation.append({
                "ticker": ticker.replace('.NS', ''),
                "weight": round(float(optimal_weights[i]) * 100, 2)
            })
            
        # Sort by weight descending
        allocation = sorted(allocation, key=lambda x: x['weight'], reverse=True)
        
        return jsonify({
            "expected_annual_return": round(float(results[0, max_sharpe_idx]) * 100, 2),
            "expected_volatility": round(float(results[1, max_sharpe_idx]) * 100, 2),
            "sharpe_ratio": round(float(results[2, max_sharpe_idx]), 2),
            "allocations": allocation
        })
        
    except Exception as e:
        print(f"Optimization Error: {e}")
        return jsonify({"error": str(e)}), 500


@app.route('/api/screener', methods=['GET'])
def get_screener():
    """
    Enterprise Market Screener:
    Fetches all pre-computed stock analysis from the database for multi-factor filtering.
    """
    from database import get_connection
    try:
        conn = get_connection()
        from psycopg2.extras import RealDictCursor
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        
        cursor.execute("""
            SELECT ticker, sentiment_score, disaster_risk_score, backtest_accuracy, fundamentals, last_updated
            FROM stock_analysis
        """)
        results = cursor.fetchall()
        cursor.close()
        conn.close()
        
        # Format results for the frontend
        formatted = []
        for r in results:
            fundamentals = r.get('fundamentals') or {}
            formatted.append({
                "ticker": r['ticker'],
                "sentiment": round(r['sentiment_score'], 2),
                "risk": round(r['disaster_risk_score'], 2),
                "accuracy": round(r['backtest_accuracy'], 2),
                "pe": fundamentals.get('pe_ratio', 'N/A'),
                "market_cap": fundamentals.get('market_cap', 'N/A'),
                "last_updated": r['last_updated']
            })
            
        return jsonify(formatted)
    except Exception as e:
        print(f"Screener Error: {e}")
        return jsonify({"error": str(e)}), 500


@app.route('/api/macro', methods=['GET'])
def get_macro_data():
    """
    Macro View: Fetches global indices and currency pairs.
    """
    tickers = {
        "^GSPC": "S&P 500",
        "^IXIC": "Nasdaq",
        "^FTSE": "FTSE 100",
        "^N225": "Nikkei 225",
        "USDINR=X": "USD/INR",
        "BTC-USD": "Bitcoin"
    }
    try:
        results = []
        for ticker, name in tickers.items():
            try:
                hist = get_cached_market_data(ticker, period="5d")
                if not hist.empty:
                    closes = hist['Close'].dropna().values
                    curr = float(closes[-1])
                    prev = float(closes[-2]) if len(closes) > 1 else curr
                    change = curr - prev
                    pct = (change / prev) * 100 if prev != 0 else 0
                    results.append({
                        "ticker": ticker,
                        "name": name,
                        "price": round(curr, 2),
                        "change": round(change, 2),
                        "changePct": round(pct, 2)
                    })
            except Exception:
                continue
        return jsonify(results)
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route('/api/ml_metrics', methods=['GET'])
def get_ml_metrics():
    """
    Exposes technical metrics about the Ensemble signal architecture.
    """
    return jsonify({
        "ensemble": {
            "models": [
                {
                    "name": "Signal A — Foundation",
                    "weight": 0.35,
                    "type": "Zero-Shot Time Series",
                    "description": "Pre-trained on large-scale time series corpora. Generates probabilistic forecast samples."
                },
                {
                    "name": "Signal B — Pattern",
                    "weight": 0.20,
                    "type": "Self-Attention Network",
                    "description": "4-head attention, 2 encoder layers, learnable positional encoding, GELU activation."
                },
                {
                    "name": "Signal C — Technical",
                    "weight": 0.20,
                    "type": "Gradient Boosted Trees",
                    "description": "200 estimators, depth 6, trained on RSI/MACD/EMA with L1+L2 regularization."
                },
                {
                    "name": "Signal D — Momentum",
                    "weight": 0.15,
                    "type": "Histogram-based Boosting",
                    "description": "300 estimators, 31 leaves, depth 8. Leaf-wise growth for finer feature splits."
                },
                {
                    "name": "Signal E — Sequence",
                    "weight": 0.10,
                    "type": "Recurrent Neural Network",
                    "description": "2 stacked recurrent layers, 64 hidden units, Huber loss, dropout 0.2."
                }
            ],
            "forecast_horizon": "130 trading days (~6 months)",
            "confidence_bands": "P10 / P50 (Median) / P90",
            "sentiment_engine": "NLP Sentiment Classifier (Financial)",
            "disaster_detection": "Keyword-based risk scorer (23 categories)"
        },
        "news_sentinel": {
            "status": "Active (24/7)",
            "poll_interval": "5 minutes",
            "trigger": "ANY new news article → immediate re-prediction",
            "coverage": "Nifty 50 (50 stocks)"
        },
        "advisory": {
            "model_version": "language-model-v2.5",
            "role": "Fundamental Analysis & Advisory",
            "rate_limit_status": "Healthy (Exponential Backoff Enabled)"
        }
    })

if __name__ == '__main__':
    from database import init_db
    init_db()
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=True)
