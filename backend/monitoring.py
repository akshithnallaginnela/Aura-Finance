import time
import logging
from functools import wraps

# Setup basic logging for APM
logging.basicConfig(
    filename='app_performance.log',
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)

def monitor_latency(func):
    """Decorator to track API response times and latency."""
    @wraps(func)
    def wrapper(*args, **kwargs):
        start_time = time.time()
        try:
            result = func(*args, **kwargs)
            duration = time.time() - start_time
            logging.info(f"[LATENCY] {func.__name__} completed in {duration:.4f} seconds.")
            return result
        except Exception as e:
            duration = time.time() - start_time
            logging.error(f"[ERROR] {func.__name__} failed after {duration:.4f} seconds. Error: {str(e)}")
            raise
    return wrapper

def log_prediction_drift(ticker, predicted_price, actual_price):
    """Log difference between predicted and actual price to monitor model drift."""
    diff = abs(predicted_price - actual_price)
    perc_error = (diff / actual_price) * 100 if actual_price > 0 else 0
    logging.info(f"[DRIFT] {ticker} - Predicted: {predicted_price}, Actual: {actual_price}, Error: {perc_error:.2f}%")
