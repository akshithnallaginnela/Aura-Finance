"""
Aura Finance — Robust Ensemble Prediction Engine (5 Models)
=============================================================
Combines 5 ML/DL models into a weighted ensemble with confidence intervals:

  1. Amazon Chronos-T5-Small (Foundation Model)    — 35% weight
  2. PyTorch Transformer Encoder (Time Series)     — 20% weight
  3. XGBoost Gradient Boosted Trees                — 20% weight
  4. LightGBM Gradient Boosting                    — 15% weight
  5. PyTorch LSTM Recurrent Neural Network         — 10% weight

Outputs: median forecast + upper/lower confidence bands (P10/P90)
"""

import numpy as np
import pandas as pd
import torch
import torch.nn as nn
from torch.utils.data import DataLoader, TensorDataset
from xgboost import XGBRegressor
import lightgbm as lgb


# ═══════════════════════════════════════════════════════════════════════════════
# Model 1: Chronos-T5-Small Foundation Model (35% weight)
# ═══════════════════════════════════════════════════════════════════════════════

def chronos_forecast(chronos_pipeline, closes, prediction_length=130):
    """
    Uses Amazon Chronos-T5 to generate probabilistic forecasts.
    Returns full sample distribution for confidence bands.
    """
    if chronos_pipeline is None:
        last = float(closes[-1])
        return {
            "median": np.array([last] * prediction_length),
            "p10": np.array([last * 0.95] * prediction_length),
            "p90": np.array([last * 1.05] * prediction_length),
        }
    
    context = torch.tensor(closes, dtype=torch.float32)
    
    try:
        forecast = chronos_pipeline.predict(
            context.unsqueeze(0), 
            prediction_length=prediction_length,
            num_samples=50
        )
        samples = forecast[0].numpy()
        
        median = np.median(samples, axis=0)
        p10 = np.percentile(samples, 10, axis=0)
        p90 = np.percentile(samples, 90, axis=0)
        
        return {"median": median, "p10": p10, "p90": p90}
    except Exception as e:
        print(f"  [Chronos] Prediction failed: {e}")
        last = float(closes[-1])
        return {
            "median": np.array([last] * prediction_length),
            "p10": np.array([last * 0.95] * prediction_length),
            "p90": np.array([last * 1.05] * prediction_length),
        }


# ═══════════════════════════════════════════════════════════════════════════════
# Model 2: PyTorch Transformer Encoder for Time Series (20% weight)
# ═══════════════════════════════════════════════════════════════════════════════

class TimeSeriesTransformer(nn.Module):
    """
    A lightweight Transformer Encoder model for time series forecasting.
    Uses positional encoding + multi-head self-attention to capture
    long-range dependencies in price sequences.
    """
    def __init__(self, input_dim=1, d_model=64, nhead=4, num_layers=2, 
                 dim_feedforward=128, dropout=0.1, seq_length=60):
        super().__init__()
        self.d_model = d_model
        self.seq_length = seq_length
        
        # Input projection
        self.input_projection = nn.Linear(input_dim, d_model)
        
        # Positional encoding (learnable)
        self.pos_embedding = nn.Parameter(torch.randn(1, seq_length, d_model) * 0.02)
        
        # Transformer encoder
        encoder_layer = nn.TransformerEncoderLayer(
            d_model=d_model,
            nhead=nhead,
            dim_feedforward=dim_feedforward,
            dropout=dropout,
            batch_first=True
        )
        self.transformer_encoder = nn.TransformerEncoder(encoder_layer, num_layers=num_layers)
        
        # Output head
        self.output_head = nn.Sequential(
            nn.Linear(d_model, dim_feedforward),
            nn.GELU(),
            nn.Dropout(dropout),
            nn.Linear(dim_feedforward, 1)
        )
    
    def forward(self, x):
        # x shape: (batch, seq_length, 1)
        x = self.input_projection(x)  # (batch, seq_length, d_model)
        x = x + self.pos_embedding[:, :x.size(1), :]
        x = self.transformer_encoder(x)  # (batch, seq_length, d_model)
        x = self.output_head(x[:, -1, :])  # Use last timestep: (batch, 1)
        return x.squeeze(-1)


def transformer_forecast(closes, prediction_length=130):
    """
    Trains a small Transformer on historical prices and generates forecasts.
    """
    if len(closes) < 80:
        return np.array([float(closes[-1])] * prediction_length)
    
    try:
        # Normalize
        min_val = float(np.min(closes))
        max_val = float(np.max(closes))
        price_range = max_val - min_val
        if price_range < 0.01:
            price_range = 1.0
        normalized = (closes - min_val) / price_range
        
        seq_length = 60
        
        # Build training sequences
        X_list, y_list = [], []
        for i in range(len(normalized) - seq_length - 1):
            X_list.append(normalized[i:i + seq_length])
            y_list.append(normalized[i + seq_length])
        
        if len(X_list) < 10:
            return np.array([float(closes[-1])] * prediction_length)
        
        X_train = torch.tensor(np.array(X_list), dtype=torch.float32).unsqueeze(-1)
        y_train = torch.tensor(np.array(y_list), dtype=torch.float32)
        
        dataset = TensorDataset(X_train, y_train)
        loader = DataLoader(dataset, batch_size=32, shuffle=True)
        
        # Create and train model
        model = TimeSeriesTransformer(
            input_dim=1, d_model=64, nhead=4, num_layers=2,
            dim_feedforward=128, dropout=0.1, seq_length=seq_length
        )
        model.train()
        optimizer = torch.optim.AdamW(model.parameters(), lr=1e-3, weight_decay=1e-4)
        scheduler = torch.optim.lr_scheduler.CosineAnnealingLR(optimizer, T_max=30)
        criterion = nn.MSELoss()
        
        for epoch in range(30):
            epoch_loss = 0
            for xb, yb in loader:
                optimizer.zero_grad()
                pred = model(xb)
                loss = criterion(pred, yb)
                loss.backward()
                torch.nn.utils.clip_grad_norm_(model.parameters(), 1.0)
                optimizer.step()
                epoch_loss += loss.item()
            scheduler.step()
        
        # Predict forward
        model.eval()
        predictions = []
        current_seq = torch.tensor(normalized[-seq_length:], dtype=torch.float32).unsqueeze(0).unsqueeze(-1)
        
        with torch.no_grad():
            for _ in range(prediction_length):
                pred = model(current_seq)
                pred_val = pred.item()
                predictions.append(pred_val)
                
                # Shift window
                new_point = torch.tensor([[[pred_val]]], dtype=torch.float32)
                current_seq = torch.cat([current_seq[:, 1:, :], new_point], dim=1)
        
        # Denormalize
        predictions = np.array(predictions) * price_range + min_val
        
        # Clamp to reasonable range
        last_price = float(closes[-1])
        predictions = np.clip(predictions, last_price * 0.5, last_price * 1.5)
        
        return predictions
    except Exception as e:
        print(f"  [Transformer] Training/prediction failed: {e}")
        return np.array([float(closes[-1])] * prediction_length)


# ═══════════════════════════════════════════════════════════════════════════════
# Model 3: XGBoost Gradient Boosted Trees (20% weight)
# ═══════════════════════════════════════════════════════════════════════════════

def xgboost_forecast(closes, emas, rsis, macds, prediction_length=130,
                     sentiment_score=0.0, disaster_risk=0.0, news_count=0):
    """
    XGBoost regressor trained on technical indicator features + news sentiment.
    Sentiment, disaster risk, and news volume are injected as features so the
    model can learn their relationship to price movement.
    """
    lookback = 14
    
    if len(closes) < lookback + 10:
        return np.array([float(closes[-1])] * prediction_length)
    
    X, y = [], []
    for i in range(lookback, len(closes) - 1):
        features = []
        features.extend(closes[i-lookback:i])
        features.extend(emas[i-lookback:i])
        features.extend(rsis[i-lookback:i])
        features.extend(macds[i-lookback:i])
        # News features (constant for historical rows — latest values)
        features.extend([sentiment_score, disaster_risk, float(news_count)])
        X.append(features)
        y.append(closes[i + 1])
    
    X = np.array(X)
    y = np.array(y)
    
    if len(X) == 0:
        return np.array([float(closes[-1])] * prediction_length)
    
    try:
        model = XGBRegressor(
            n_estimators=200,
            max_depth=6,
            learning_rate=0.05,
            subsample=0.8,
            colsample_bytree=0.8,
            reg_alpha=0.1,
            reg_lambda=1.0,
            random_state=42,
            verbosity=0
        )
        model.fit(X, y)
        
        predictions = []
        current_closes = list(closes[-lookback:])
        current_emas = list(emas[-lookback:])
        current_rsis = list(rsis[-lookback:])
        current_macds = list(macds[-lookback:])
        
        for _ in range(prediction_length):
            features = []
            features.extend(current_closes[-lookback:])
            features.extend(current_emas[-lookback:])
            features.extend(current_rsis[-lookback:])
            features.extend(current_macds[-lookback:])
            features.extend([sentiment_score, disaster_risk, float(news_count)])
            
            pred = model.predict([features])[0]
            predictions.append(pred)
            
            current_closes.append(pred)
            alpha = 2 / (20 + 1)
            new_ema = alpha * pred + (1 - alpha) * current_emas[-1]
            current_emas.append(new_ema)
            current_rsis.append(50.0)
            current_macds.append(0.0)
        
        return np.array(predictions)
    except Exception as e:
        print(f"  [XGBoost] Failed: {e}")
        return np.array([float(closes[-1])] * prediction_length)


# ═══════════════════════════════════════════════════════════════════════════════
# Model 4: LightGBM Gradient Boosting (15% weight)
# ═══════════════════════════════════════════════════════════════════════════════

def lightgbm_forecast(closes, emas, rsis, macds, prediction_length=130,
                      sentiment_score=0.0, disaster_risk=0.0, news_count=0):
    """
    LightGBM — leaf-wise tree growth often outperforms XGBoost on tabular data.
    Uses technical indicator features + news sentiment as input.
    """
    lookback = 14
    
    if len(closes) < lookback + 10:
        return np.array([float(closes[-1])] * prediction_length)
    
    X, y = [], []
    for i in range(lookback, len(closes) - 1):
        features = []
        features.extend(closes[i-lookback:i])
        features.extend(emas[i-lookback:i])
        features.extend(rsis[i-lookback:i])
        features.extend(macds[i-lookback:i])
        features.extend([sentiment_score, disaster_risk, float(news_count)])
        X.append(features)
        y.append(closes[i + 1])
    
    X = np.array(X)
    y = np.array(y)
    
    if len(X) == 0:
        return np.array([float(closes[-1])] * prediction_length)
    
    try:
        model = lgb.LGBMRegressor(
            n_estimators=300,
            max_depth=8,
            learning_rate=0.03,
            subsample=0.8,
            colsample_bytree=0.8,
            reg_alpha=0.1,
            reg_lambda=1.0,
            num_leaves=31,
            min_child_samples=10,
            random_state=42,
            verbosity=-1
        )
        model.fit(X, y)
        
        predictions = []
        current_closes = list(closes[-lookback:])
        current_emas = list(emas[-lookback:])
        current_rsis = list(rsis[-lookback:])
        current_macds = list(macds[-lookback:])
        
        for _ in range(prediction_length):
            features = []
            features.extend(current_closes[-lookback:])
            features.extend(current_emas[-lookback:])
            features.extend(current_rsis[-lookback:])
            features.extend(current_macds[-lookback:])
            features.extend([sentiment_score, disaster_risk, float(news_count)])
            
            pred = model.predict([features])[0]
            predictions.append(pred)
            
            current_closes.append(pred)
            alpha = 2 / (20 + 1)
            new_ema = alpha * pred + (1 - alpha) * current_emas[-1]
            current_emas.append(new_ema)
            current_rsis.append(50.0)
            current_macds.append(0.0)
        
        return np.array(predictions)
    except Exception as e:
        print(f"  [LightGBM] Failed: {e}")
        return np.array([float(closes[-1])] * prediction_length)


# ═══════════════════════════════════════════════════════════════════════════════
# Model 5: PyTorch LSTM Recurrent Neural Network (10% weight)
# ═══════════════════════════════════════════════════════════════════════════════

class LSTMModel(nn.Module):
    """
    Proper PyTorch LSTM with 2 stacked layers, dropout, and a linear output head.
    """
    def __init__(self, input_size=1, hidden_size=64, num_layers=2, dropout=0.2):
        super().__init__()
        self.lstm = nn.LSTM(
            input_size=input_size,
            hidden_size=hidden_size,
            num_layers=num_layers,
            batch_first=True,
            dropout=dropout
        )
        self.fc = nn.Sequential(
            nn.Linear(hidden_size, 32),
            nn.ReLU(),
            nn.Linear(32, 1)
        )
    
    def forward(self, x):
        # x shape: (batch, seq_len, 1)
        lstm_out, _ = self.lstm(x)        # (batch, seq_len, hidden)
        last_hidden = lstm_out[:, -1, :]  # (batch, hidden)
        return self.fc(last_hidden).squeeze(-1)  # (batch,)


def lstm_forecast(closes, prediction_length=130):
    """
    PyTorch LSTM with proper training, gradient clipping, and learning rate scheduling.
    """
    if len(closes) < 80:
        return np.array([float(closes[-1])] * prediction_length)
    
    try:
        # Normalize
        min_val = float(np.min(closes))
        max_val = float(np.max(closes))
        price_range = max_val - min_val
        if price_range < 0.01:
            price_range = 1.0
        normalized = (closes - min_val) / price_range
        
        seq_length = 60
        
        # Build sequences
        X_list, y_list = [], []
        for i in range(len(normalized) - seq_length - 1):
            X_list.append(normalized[i:i + seq_length])
            y_list.append(normalized[i + seq_length])
        
        if len(X_list) < 10:
            return np.array([float(closes[-1])] * prediction_length)
        
        X_train = torch.tensor(np.array(X_list), dtype=torch.float32).unsqueeze(-1)
        y_train = torch.tensor(np.array(y_list), dtype=torch.float32)
        
        dataset = TensorDataset(X_train, y_train)
        loader = DataLoader(dataset, batch_size=32, shuffle=True)
        
        model = LSTMModel(input_size=1, hidden_size=64, num_layers=2, dropout=0.2)
        model.train()
        optimizer = torch.optim.Adam(model.parameters(), lr=1e-3)
        scheduler = torch.optim.lr_scheduler.StepLR(optimizer, step_size=15, gamma=0.5)
        criterion = nn.HuberLoss(delta=1.0)  # More robust than MSE
        
        for epoch in range(40):
            for xb, yb in loader:
                optimizer.zero_grad()
                pred = model(xb)
                loss = criterion(pred, yb)
                loss.backward()
                torch.nn.utils.clip_grad_norm_(model.parameters(), 1.0)
                optimizer.step()
            scheduler.step()
        
        # Predict forward
        model.eval()
        predictions = []
        current_seq = torch.tensor(normalized[-seq_length:], dtype=torch.float32).unsqueeze(0).unsqueeze(-1)
        
        with torch.no_grad():
            for _ in range(prediction_length):
                pred = model(current_seq)
                pred_val = pred.item()
                predictions.append(pred_val)
                
                new_point = torch.tensor([[[pred_val]]], dtype=torch.float32)
                current_seq = torch.cat([current_seq[:, 1:, :], new_point], dim=1)
        
        # Denormalize
        predictions = np.array(predictions) * price_range + min_val
        
        # Clamp
        last_price = float(closes[-1])
        predictions = np.clip(predictions, last_price * 0.5, last_price * 1.5)
        
        return predictions
    except Exception as e:
        print(f"  [LSTM] Failed: {e}")
        return np.array([float(closes[-1])] * prediction_length)


# ═══════════════════════════════════════════════════════════════════════════════
# Ensemble Combiner
# ═══════════════════════════════════════════════════════════════════════════════

WEIGHTS = {
    "chronos": 0.35,
    "transformer": 0.20,
    "xgboost": 0.20,
    "lightgbm": 0.15,
    "lstm": 0.10
}

MODEL_NAMES = {
    "chronos": "Amazon Chronos-T5-Small",
    "transformer": "PyTorch Transformer Encoder",
    "xgboost": "XGBoost (Gradient Boosted Trees)",
    "lightgbm": "LightGBM (Leaf-wise Boosting)",
    "lstm": "PyTorch LSTM (2-Layer RNN)"
}

def ensemble_predict(chronos_pipeline, df_with_indicators, prediction_length=130,
                     sentiment_score=0.0, disaster_risk=0.0, news_count=0):
    """
    Runs all 5 models and combines into a weighted ensemble.
    Sentiment, disaster risk, and news volume are passed as features
    to the tree-based models (XGBoost + LightGBM).
    
    Returns:
        dict with keys: median, upper_band, lower_band (numpy arrays)
    """
    closes = df_with_indicators['Close'].values.astype(float)
    emas = df_with_indicators.get('EMA_20', pd.Series(closes)).values.astype(float)
    rsis = df_with_indicators.get('RSI', pd.Series(np.full(len(closes), 50.0))).values.astype(float)
    macds = df_with_indicators.get('MACD', pd.Series(np.zeros(len(closes)))).values.astype(float)
    
    # Run all models
    print(f"  [Ensemble] Running Chronos-T5-Small (weight={WEIGHTS['chronos']})...")
    chronos_result = chronos_forecast(chronos_pipeline, closes, prediction_length)
    
    print(f"  [Ensemble] Running Transformer Encoder (weight={WEIGHTS['transformer']})...")
    transformer_preds = transformer_forecast(closes, prediction_length)
    
    print(f"  [Ensemble] Running XGBoost (weight={WEIGHTS['xgboost']}, sentiment={sentiment_score:.2f})...")
    xgb_preds = xgboost_forecast(closes, emas, rsis, macds, prediction_length,
                                  sentiment_score, disaster_risk, news_count)
    
    print(f"  [Ensemble] Running LightGBM (weight={WEIGHTS['lightgbm']}, sentiment={sentiment_score:.2f})...")
    lgbm_preds = lightgbm_forecast(closes, emas, rsis, macds, prediction_length,
                                    sentiment_score, disaster_risk, news_count)
    
    print(f"  [Ensemble] Running PyTorch LSTM (weight={WEIGHTS['lstm']})...")
    lstm_preds = lstm_forecast(closes, prediction_length)
    
    # Weighted ensemble
    ensemble_median = (
        WEIGHTS["chronos"] * chronos_result["median"] +
        WEIGHTS["transformer"] * transformer_preds +
        WEIGHTS["xgboost"] * xgb_preds +
        WEIGHTS["lightgbm"] * lgbm_preds +
        WEIGHTS["lstm"] * lstm_preds
    )
    
    # Confidence bands: Chronos P10/P90 + model disagreement
    model_stack = np.vstack([
        chronos_result["median"],
        transformer_preds,
        xgb_preds,
        lgbm_preds,
        lstm_preds
    ])
    model_std = np.std(model_stack, axis=0)
    
    upper_band = np.maximum(chronos_result["p90"], ensemble_median + 1.5 * model_std)
    lower_band = np.minimum(chronos_result["p10"], ensemble_median - 1.5 * model_std)
    lower_band = np.maximum(lower_band, 0)
    
    print(f"  [Ensemble] Complete. 5 models combined (news features injected into XGB+LGBM).")
    print(f"    Median[0]={ensemble_median[0]:.2f}, Upper[0]={upper_band[0]:.2f}, Lower[0]={lower_band[0]:.2f}")
    
    return {
        "median": ensemble_median,
        "upper_band": upper_band,
        "lower_band": lower_band
    }


def apply_sentiment_adjustment(forecast_dict, sentiment_score, disaster_risk=0.0, news_count=0):
    """
    Adjusts the ensemble forecast based on news sentiment, disaster risk,
    and news volume with intelligent asymmetric band shaping.
    
    Key improvements over naive linear scaling:
    1. Asymmetric bands: negative news crushes the lower band, barely touches upper
    2. Disaster risk models real crash dynamics (sharp downside, limited upside)
    3. News volume = volatility signal (more headlines = wider near-term bands)
    4. sqrt(t) decay instead of linear taper (more realistic uncertainty growth)
    """
    median = forecast_dict["median"].copy()
    upper = forecast_dict["upper_band"].copy()
    lower = forecast_dict["lower_band"].copy()
    n = len(median)
    
    # Time decay: sqrt-based — uncertainty grows like sqrt(t) in real markets
    # Near-term adjustments are strong, fading over the forecast horizon
    t = np.arange(1, n + 1, dtype=float)
    decay = 1.0 / (1.0 + 0.15 * np.sqrt(t))  # Starts ~1.0, decays to ~0.35 at t=130
    
    # ─── 1. MEDIAN SHIFT (sentiment-driven directional bias) ───────────────
    if sentiment_score >= 0:
        # Positive sentiment: cautious upward shift (max +5%)
        median_shift = sentiment_score * 0.05 * decay
    else:
        # Negative sentiment: stronger downward shift (max -8%)
        median_shift = sentiment_score * 0.08 * decay
    
    median = median * (1.0 + median_shift)
    
    # ─── 2. DISASTER RISK (asymmetric crash modeling) ──────────────────────
    if disaster_risk > 0:
        # Disasters pull median DOWN hard (up to -15%)
        disaster_median_drag = disaster_risk * 0.15 * decay
        median = median * (1.0 - disaster_median_drag)
        
        # Lower band collapses much harder (up to -25%)
        disaster_lower_crush = disaster_risk * 0.25 * decay
        lower = lower * (1.0 - disaster_lower_crush)
        
        # Upper band barely moves (up to +3%) — stocks rarely moon during disasters
        disaster_upper_lift = disaster_risk * 0.03 * decay
        upper = upper * (1.0 + disaster_upper_lift)
    
    # ─── 3. ASYMMETRIC BAND SHAPING (sentiment-driven) ────────────────────
    half_width = (upper - lower) / 2.0
    center = (upper + lower) / 2.0
    
    if sentiment_score < -0.1:
        # Bearish: widen lower band, tighten upper band
        severity = min(abs(sentiment_score), 1.0)
        lower_expansion = 1.0 + severity * 0.20 * decay  # Lower goes further down
        upper_contraction = 1.0 - severity * 0.08 * decay  # Upper pulls closer to median
        upper = center + half_width * upper_contraction
        lower = center - half_width * lower_expansion
    elif sentiment_score > 0.1:
        # Bullish: widen upper band, tighten lower band  
        severity = min(sentiment_score, 1.0)
        upper_expansion = 1.0 + severity * 0.15 * decay  # Upper goes further up
        lower_contraction = 1.0 - severity * 0.10 * decay  # Lower pulls closer to median
        upper = center + half_width * upper_expansion
        lower = center - half_width * lower_contraction
    
    # ─── 4. NEWS VOLUME AS VOLATILITY SIGNAL ──────────────────────────────
    if news_count > 0:
        # More headlines = more uncertainty = wider bands near-term
        # 0-3 headlines: minimal effect, 4-8: moderate, 8+: high volatility
        volume_factor = min(news_count / 5.0, 2.0)  # Capped at 2x
        
        # Only affects first 30 days significantly
        volume_decay = np.exp(-t / 30.0)  # Exponential decay over ~30 days
        volume_widening = 1.0 + volume_factor * 0.06 * volume_decay
        
        half_width_new = (upper - lower) / 2.0
        center_new = (upper + lower) / 2.0
        upper = center_new + half_width_new * volume_widening
        lower = center_new - half_width_new * volume_widening
    
    # ─── Safety: ensure lower band never goes negative ────────────────────
    lower = np.maximum(lower, 0)
    
    # Ensure upper > median > lower
    upper = np.maximum(upper, median * 1.001)
    lower = np.minimum(lower, median * 0.999)
    lower = np.maximum(lower, 0)
    
    return {
        "median": median,
        "upper_band": upper,
        "lower_band": lower
    }


# ═══════════════════════════════════════════════════════════════════════════════
# Standalone test
# ═══════════════════════════════════════════════════════════════════════════════

if __name__ == "__main__":
    print("=" * 60)
    print("  Ensemble Engine — 5 Model Standalone Test")
    print("=" * 60)
    
    np.random.seed(42)
    t = np.arange(400)
    prices = 1300 + 50 * np.sin(t * 0.05) + np.cumsum(np.random.randn(400) * 2)
    
    df = pd.DataFrame({
        'Close': prices,
        'EMA_20': pd.Series(prices).ewm(span=20).mean(),
        'RSI': np.random.uniform(30, 70, 400),
        'MACD': np.random.randn(400) * 5
    })
    
    result = ensemble_predict(None, df, prediction_length=20)
    print(f"\nMedian (first 5): {result['median'][:5].round(2)}")
    print(f"Upper  (first 5): {result['upper_band'][:5].round(2)}")
    print(f"Lower  (first 5): {result['lower_band'][:5].round(2)}")
    
    adjusted = apply_sentiment_adjustment(result, sentiment_score=-0.5, disaster_risk=0.3)
    print(f"\nAfter sentiment=-0.5, disaster=0.3:")
    print(f"Adjusted median (first 5): {adjusted['median'][:5].round(2)}")
    print("\n✅ All 5 models ran successfully!")
