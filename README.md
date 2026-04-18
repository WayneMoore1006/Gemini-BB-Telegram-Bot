# 🌌 Gemini-BB-Telegram-Bot

---

## 🇹🇼 繁體中文版本 (Traditional Chinese Version)

<img src="./bb%20bot%20source/bb1.gif" width="400" alt="行情監控展示" />

### 📖 專案簡介
**Gemini-BB-Telegram-Bot** 是由 `bb-breakout-trading-bot-strategy` 深度進化而來的專業級 Telegram 交易監控機器人。本專案透過 **TypeScript** 重構了多週期引擎，並深度整合了 **Google Gemini AI**，將傳統的靜態監控腳本提升為具備對話能力與智能分析的交易助手。

### 🌟 核心功能
1.  **實時多週期監控**：同步監控 15m, 1h, 4h, 1d 等多個時間週期，每個週期獨立計算布林通道軌道。
2.  **整數價格關口警報**：當市場價格跨越心理整數關口（如 $70000）時，自動發送推播通知。
3.  **Google Gemini AI 助手**：整合最新一代 Gemini 2.x，可透過 `/ai` 進行實時行情對話與策略諮詢。
4.  **虛擬倉位管理**：具備獨立的進場價與持倉狀態管理，支援多週期趨勢共振分析。

---

### 🤖 AI 智能助手 (Powered by Gemini)
<img src="./bb%20bot%20source/bb2.gif" width="400" alt="AI 助手對話展示" />
您可以輸入 `/ai` 後接任何問題，例如：
- 「根據 15m 和 1h 的指標，目前的波動率如何？」
- 「請分析目前的突破真實性，適合進場嗎？」

---

### 🛠 指令手冊
<img src="./bb%20bot%20source/bb3.gif" width="400" alt="指令操作演示" />
- `/price` : 💰 即時價格查詢
- `/status` : 📉 各週期 BB 軌道狀態監控
- `/signal` : 📍 查看各週期最後一次觸發訊號
- `/position` : 💼 查詢目前虛擬持倉資訊
- `/ai [問題]` : 💡 諮詢 AI 助手建議
- `/help` : ❓ 顯示功能清單

### 🚀 快速開始
1. **配置環境變數**：在 `.env` 中填入 `TELEGRAM_BOT_TOKEN`, `BINANCE_API_KEY` 與 `GEMINI_API_KEY`。
2. **測試功能 (開發者)**：系統內建隱藏測試指令（`/debug_ai`, `/test_alert`, `/test_price`, `/test_signal`）。

### ⚠️ 安全與免責聲明
- 本工具僅供研究使用，不構成任何投資建議。
- 請務必關閉 API 的「提款權限」。
- 已採現 MIT 授權協議發布。

---

# 🌌 Gemini-BB-Telegram-Bot

---

## 🇺🇸 English Version

<img src="./bb%20bot%20source/bb1.gif" width="400" alt="Market Monitoring" />

### 📖 Introduction
**Gemini-BB-Telegram-Bot** (formerly `bb-breakout-trading-bot-new`) is a professional-grade Telegram trading bot and the evolution of the original **`bb-breakout-trading-bot-strategy`**. 
Rebuilt with **TypeScript**, it features a multi-interval engine and deep **Google Gemini AI** integration, transforming traditional monitoring scripts into an intelligent trading assistant with conversational capabilities.

### 🌟 Key Features
1.  **Real-time Multi-Interval Monitoring**: Synchronized monitoring of 15m, 1h, 4h, and 1d timeframes with independent BB calculation.
2.  **Psychological Price Level Alerts**: Automatic notifications when the market crosses integer levels (e.g., $70,000).
3.  **Google Gemini AI Assistant**: Powered by Gemini 2.x, enabling real-time market dialogue and strategy consultation via `/ai`.
4.  **Virtual Position Management**: Independent tracking of entry prices and holdings to support multi-timeframe trend resonance analysis.

---

### 🤖 AI Assistant (Powered by Gemini)
<img src="./bb%20bot%20source/bb2.gif" width="400" alt="AI Assistant Demo" />
You can call `/ai` followed by any question, such as:
- "Based on the 15m and 1h indicators, what is the current volatility?"
- "Analyze the authenticity of the current breakout; is it a good time to enter?"

---

### 🛠 Command Manual
<img src="./bb%20bot%20source/bb3.gif" width="400" alt="Command Operation Demo" />
- `/price` : 💰 Real-time price check
- `/status` : 📉 Market monitor status (BB Bands)
- `/signal` : 📍 Check the last triggered signal per interval
- `/position` : 💼 Check current virtual holdings
- `/ai [Question]` : 💡 Consult the AI assistant
- `/help` : ❓ Show available commands

### 🚀 Quick Start
1. **Environment Config**: Fill in `TELEGRAM_BOT_TOKEN`, `BINANCE_API_KEY`, and `GEMINI_API_KEY` in your `.env` file.
2. **Testing (Developer Only)**: Built-in hidden commands for validation (`/debug_ai`, `/test_alert`, `/test_price`, `/test_signal`).

### ⚠️ Security & Disclaimer
- This tool is for research purposes only and does not constitute investment advice.
- Always ensure your Binance API has "Withdrawals Disabled".
- Published under the MIT License.
