# 🌌 Aura Finance — Enterprise AI Wealth Copilot

<p align="center">
  <img src="public/logo.png" alt="Aura Logo" width="120"/>
</p>

<h3 align="center">Aura Finance</h3>
<p align="center"><strong>Next-Generation Hybrid Quantitative Forecaster & Portfolio Optimizer</strong></p>

<p align="center">
  <a href="https://vite.dev/"><img src="https://img.shields.io/badge/Vite-8.0-06b6d4?style=for-the-badge&logo=vite&logoColor=fff" alt="Vite"/></a>
  <a href="https://react.dev/"><img src="https://img.shields.io/badge/React-19.0-10b981?style=for-the-badge&logo=react&logoColor=fff" alt="React"/></a>
  <a href="https://www.python.org/"><img src="https://img.shields.io/badge/Python-3.11-3776ab?style=for-the-badge&logo=python&logoColor=fff" alt="Python"/></a>
  <a href="https://www.postgresql.org/"><img src="https://img.shields.io/badge/PostgreSQL-16-336791?style=for-the-badge&logo=postgresql&logoColor=fff" alt="PostgreSQL"/></a>
  <a href="https://deepmind.google/technologies/gemini/"><img src="https://img.shields.io/badge/Gemini--AI-2.5--Flash-f43f5e?style=for-the-badge&logo=google-gemini&logoColor=fff" alt="Gemini"/></a>
</p>

---

Aura Finance is an enterprise-grade quantitative wealth management platform. It integrates a **5-model Machine Learning Ensemble**, **FinBERT Natural Language Processing**, and a **Real-Time News Sentinel** to deliver high-fidelity market forecasts, live sentiment scores, and portfolio optimization matching Modern Portfolio Theory (MPT).

### 🔗 Live Demo
Experience Aura Finance live: **[aura-finance-five.vercel.app](https://aura-finance-five.vercel.app)**

---

## 📷 Screenshots

Here is a visual walkthrough of the Aura Finance setup and dashboard:

### 🔐 Authentication & Onboarding Flow

| **1. Landing Page** | **2. Sign In** |
| :---: | :---: |
| ![Aura Landing Page](public/screenshots/landing.png) | ![Sign In Screen](public/screenshots/signin.png) |

| **3. Welcome Guide** | **4. Configure Watchlist** |
| :---: | :---: |
| ![Onboarding Welcome Guide](public/screenshots/onboarding_welcome.png) | ![Watchlist Config](public/screenshots/onboarding_select.png) |

| **5. Workspace Ready** | |
| :---: | :---: |
| ![Workspace Setup Complete](public/screenshots/onboarding_complete.png) | |

### 📊 Analytics & Market Overview

| **6. Predictive Stock Chart** | **7. NIFTY 50 Index Overview** |
| :---: | :---: |
| ![Overview Dashboard](public/screenshots/dashboard.png) | ![NIFTY 50 Index Chart](public/screenshots/dashboard_index.png) |

| **8. Global Macro Tracker** | |
| :---: | :---: |
| ![Global Macro View](public/screenshots/macro.png) | |

### 🛠 Portfolio Optimization & AI Strategy

| **9. MPT Portfolio Optimizer** | **10. Holdings & Watchlist** |
| :---: | :---: |
| ![MPT Optimizer](public/screenshots/optimizer.png) | ![My Holdings](public/screenshots/watchlist_holdings.png) |

| **11. Aura AI Strategist Chat** | **12. Multi-Factor Screener** |
| :---: | :---: |
| ![AI Strategy Chat](public/screenshots/advisor.png) | ![Market Screener](public/screenshots/screener.png) |

## 📖 Table of Contents
* [🚀 Key Enterprise Modules](#-key-enterprise-modules)
* [📁 Project Directory Structure](#-project-directory-structure)
* [🧠 Hybrid Ensemble ML Engine](#-hybrid-ensemble-ml-engine)
* [📰 24/7 News Sentinel Agent](#-247-news-sentinel-agent)
* [🛠 Tech Stack & Libraries](#-tech-stack--libraries)
* [🏗 System Architecture Diagram](#-system-architecture-diagram)
* [💻 Getting Started](#-getting-started)
* [🛡 Security, Latency, & Reliability](#-security-latency--reliability)

---

## 🚀 Key Enterprise Modules

### 📈 Real-Time Indian Equities Scroller
* Features the **Top 10 Indian Equities by Market Cap** (Reliance, TCS, HDFC Bank, Bharti Airtel, ICICI Bank, Infosys, SBI, LIC, ITC, Hindustan Unilever) in an infinite marquee tape.
* Clicking any stock immediately loads its predictive chart and key valuation statistics in the main workspace.

### 📊 Modern Portfolio Theory (MPT) Optimizer
* **Monte Carlo Optimizer**: Simulates over 5,000 randomized portfolios to determine the **Maximum Sharpe Ratio** capital weightings.
* **Cash Allocation Simulator**: Slide a range slider from ₹10,000 to ₹10,00,000 to instantly view recommended rupee allocations across optimized blue-chip assets.
* **Quick Presets**: Jump directly into standard configurations like "Blue Chip Giants", "IT Leaders", or "Banking Heavyweights".

### 🔎 Multi-Factor Market Screener
* Interactive split-pane dashboard showcasing a table of Nifty 50 stocks with model metrics (Model Accuracy, Sentiment Score, Disaster Risk Rating, P/E Ratio, Market Cap).
* Select any item to render a 3-month performance trend, detailed gauges, and watchlist management.

### 🌐 Global Macro Tracker
* Real-time monitoring of key international benchmarks (S&P 500, Nasdaq, FTSE 100, Nikkei 225, USD/INR forex rate, and Bitcoin).
* Renders historical indicators and provides a significance report analyzing foreign institutional flows (FII).

### 💬 Consultative Aura AI Broker
* A warm, professional personal stock broker chat agent.
* Powered by Gemini 2.5 Flash, it engages in friendly greetings and conversation, only serving technical analysis tables and reports when requested.
* Latency-optimized by omitting large price arrays from the client request; details are fetched directly from PostgreSQL.

---

## 📁 Project Directory Structure

The project has been cleaned and organized to keep root files to an absolute minimum:

```
├── .github/                       # GitHub workflow, PR, and community health files
│   ├── ISSUE_TEMPLATE/            # Bug reports, enhancement, and query forms (.yml)
│   ├── DISCUSSION_TEMPLATE/       # Announcement and community idea files
│   ├── PULL_REQUEST_TEMPLATE/     # Pull request template form (.md)
│   └── workflows/                 # CI/CD deployment pipelines (HF space triggers)
├── backend/                       # Python Flask backend
│   ├── app.py                     # API routing & server entry point
│   ├── database.py                # Supabase/PostgreSQL connection & caching tables
│   ├── pipeline.py                # yfinance fetcher & Ensemble ML trainer
│   └── monitoring.py              # Performance, disaster alert, and drift logging
├── docker/                        # DevOps build packaging
│   └── Dockerfile                 # Multistage production frontend container
├── docs/                          # Architectural plans and mockup files
│   ├── ENTERPRISE_ARCHITECTURE_PLAN.md
│   ├── Hugging_face.md
│   └── aurafinance-dashboard.html
├── public/                        # Static UI assets (logo.png, favicon.png)
├── scripts/                       # System automation utilities
│   └── run.bat                    # One-click Windows local runner
├── src/                           # React frontend source
│   ├── components/                # Modular UI widgets (Watchlist, Screener, Optimizer, Advisor)
│   ├── context/                   # Global state providers (Finance, Theme)
│   └── utils/                     # Indian market hours clock & holiday check calendars
```

---

## 🧠 Hybrid Ensemble ML Engine

Our proprietary forecasting pipeline merges multiple statistical, neural, and tree-based architectures for maximum robustness:

| Model | Weight | Type | Purpose |
| :--- | :--- | :--- | :--- |
| **Amazon Chronos-T5-Small** | **35%** | Zero-Shot Time Series Transformer | Generalizes long-term cyclical patterns |
| **PyTorch Transformer Encoder** | **20%** | Self-Attention Neural Network | Extracts key cross-attention dependencies |
| **XGBoost Regressor** | **20%** | Gradient Boosted Trees | Evaluates technical indicators (RSI, MACD, EMA) |
| **LightGBM** | **15%** | Leaf-wise Gradient Boosting | Computes non-linear local price splits |
| **PyTorch LSTM** | **10%** | 2-Layer Recurrent RNN | Captures sequential momentum memory |

---

## 📰 24/7 News Sentinel Agent

Aura Finance continuously monitors live financial channels to maintain up-to-the-minute valuation targets:
1. **ProsusAI FinBERT Sentiment**: Parses recent headlines and scores them between `-1.0` (Highly Bearish) and `+1.0` (Highly Bullish).
2. **Disaster Risk Scans**: Cross-checks headlines against 23 disruption categories (e.g. regulatory fines, geopolitical actions, default warnings).
3. **Auto-Reprediction**: Whenever a new headline is indexed, the backend automatically triggers a pipeline refresh, updates PostgreSQL, and logs details in the dashboard sentinel feed.

---

## 🛠 Tech Stack & Libraries

### Frontend
* **Core**: React 19, TypeScript, Vite 8
* **Charts**: `@pipsend/charts` (High-performance Canvas-based Area and Forecast charts), Recharts (Asset allocation pie charts)
* **Icons**: `lucide-react`
* **Theme**: CSS Variables (Dynamic Light/Dark modes)

### Backend & Database
* **Server**: Flask (Python 3.11) with CORS controls
* **Database & Auth (Supabase)**: 
  * **PostgreSQL Database**: Real-time JSONB storage hosting pre-computed stock data, technical indicators, and ensemble predictions.
  * **User Authentication**: Secure user session signup, sign-in, and persistence via Supabase Auth.
* **Data Sources**: `yfinance`, `newsapi`

---

## 🏗 System Architecture Diagram

```mermaid
graph TD
    A[Yahoo Finance / News APIs] --> B[News Sentinel Agent]
    B --> C{New Article?}
    C -- Yes --> D[FinBERT Sentiment + Disaster Scorer]
    D --> E[Ensemble ML Pipeline]
    E --> F[(PostgreSQL / Supabase)]
    F --> G[Flask Enterprise API]
    G --> H[React Glassmorphic Dashboard]
    H --> I[Aura AI Advisor]
```

---

## 💻 Getting Started

### Windows One-Click Start
Double-click [scripts/run.bat](file:///c:/Users/Akshith/antigravity/Aura-Finance/scripts/run.bat) to launch the backend Flask server and the frontend Vite server in parallelcmd windows automatically.

### Manual Setup

#### Prerequisites
* Node.js v20+
* Python v3.11+
* Supabase/PostgreSQL database

#### 1. Backend API Server
```bash
cd backend
python -m venv .venv
# On Windows
.venv\Scripts\activate
# On Linux/macOS
source .venv/bin/activate

pip install -r requirements.txt
python app.py
```

#### 2. Frontend Development Server
Configure your local environment variables in a `.env` file in the root directory:
```env
# ─── API & CO-PILOT CONFIGURATION ─────────────────────────────────────────────
VITE_BACKEND_URL="http://localhost:5000"
VITE_GEMINI_API_KEYS="your_key_1,your_key_2"

# ─── SUPABASE AUTH CONFIGURATION ──────────────────────────────────────────────
VITE_SUPABASE_URL="https://your-project.supabase.co"
VITE_SUPABASE_ANON_KEY="your-anon-key-here"

# ─── DATABASE CONFIGURATION (POSTGRES CONNECT) ────────────────────────────────
DATABASE_URL="postgresql://postgres.your-project:password@aws-pooler.supabase.com:6543/postgres"
```
Instantly compile and start:
```bash
npm install
npm run dev
```
Open [http://localhost:5173/](http://localhost:5173/) in your browser.

---

## 🛡 Security, Latency, & Reliability
* **CORS Access Protection**: Whitelisted origin access rules prevent unauthorized cross-origin API executions.
* **Low-Latency Architecture**: By caching price histories in Supabase and fetching them locally on the backend, the payload size for chatAdvisor queries is reduced by **99%**, lowering Gemini model prompt latency.
* **Error Resilience**: A global Flask error handler intercepts exceptions, mapping HTTP codes to clean JSON objects to safeguard system stability.

---

<div align="center">
  Built with ❤️ for the next generation of quantitative investors.
</div>
