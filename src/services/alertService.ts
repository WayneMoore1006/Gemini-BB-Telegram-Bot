import { Telegraf } from 'telegraf';
import { TradingSignal } from '../models/signal';
import { PositionState } from '../models/position';
import logger from '../utils/logger';
import { env } from '../config/env';

export class AlertService {
  private bot: Telegraf | null = null;

  setBot(bot: Telegraf) {
    this.bot = bot;
  }

  async sendSignalAlert(signal: TradingSignal, position: PositionState) {
    const chatId = env.TELEGRAM_CHAT_ID;
    if (!chatId || !this.bot) {
      logger.warn('Telegram Chat ID or Bot not set. Alert skipped.', { signal });
      return;
    }

    const directionIcon = signal.direction === 'LONG' ? '🟢 做多 (LONG)' : '🔴 做空 (SHORT)';
    const positionIcon = position.side === 'LONG' ? '🟢 做多' : position.side === 'SHORT' ? '🔴 做空' : '⚪ 空倉';

    const message = `
🚨 *BB 布林通道突破訊號* 🚨
-------------------------
🔸 *交易對:* ${signal.symbol}
🔸 *週期:* ${signal.interval}
🔸 *方向:* ${directionIcon}
🔸 *觸發價格:* ${signal.price}
🔸 *布林上軌:* ${signal.bbValues.upper.toFixed(2)}
🔸 *布林下軌:* ${signal.bbValues.lower.toFixed(2)}
-------------------------
💼 *目前倉位:* ${positionIcon}
⏰ *觸發時間:* ${new Date(signal.timestamp).toLocaleString()}
    `;

    try {
      await this.bot.telegram.sendMessage(chatId, message, { parse_mode: 'Markdown' });
      logger.info(`Alert sent to Telegram for ${signal.symbol}`);
    } catch (error) {
      logger.error('Error sending Telegram alert:', error);
    }
  }

  async sendPriceLevelAlert(symbol: string, price: number, level: number, direction: 'UP' | 'DOWN') {
    const chatId = env.TELEGRAM_CHAT_ID;
    if (!chatId || !this.bot || !env.ENABLE_PRICE_LEVEL_ALERTS) return;

    const icon = direction === 'UP' ? '📈 突破' : '📉 跌破';
    const message = `
🔔 *${symbol} 整數關口警報* 🔔
-------------------------
🔸 *目標關口:* **${level}**
🔸 *目前狀態:* ${icon}
🔸 *觸發價格:* ${price}
⏰ *觸發時間:* ${new Date().toLocaleString()}
-------------------------
    `;

    try {
      await this.bot.telegram.sendMessage(chatId, message, { parse_mode: 'Markdown' });
      logger.info(`Price level alert sent: ${symbol} ${icon} ${level}`);
    } catch (error) {
      logger.error('Error sending price level alert:', error);
    }
  }

  async sendTestAlert() {
    const chatId = env.TELEGRAM_CHAT_ID;
    if (!chatId || !this.bot) return;
    await this.bot.telegram.sendMessage(chatId, "✅ Test Alert: Bot is connected and working!");
  }
}

export const alertService = new AlertService();
