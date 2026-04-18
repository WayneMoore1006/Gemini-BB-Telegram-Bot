import logger from '../utils/logger';
import { env } from '../config/env';

export class TradeService {
  async executeOrder(symbol: string, direction: 'LONG' | 'SHORT', price: number) {
    if (!env.ENABLE_LIVE_TRADING) {
      logger.info(`[PAPER TRADE] Preteding to execute ${direction} order for ${symbol} at ${price}`);
      return;
    }

    // SECURITY WARNING: LIVE TRADING LOGIC GOES HERE
    // REQUIRED: 
    // 1. IP White-listing
    // 2. Separate API Keys for trading/query
    // 3. Test on Testnet first
    logger.warn(`⚠️ REAL TRADE EXECUTION ATTEMPTED: ${direction} ${symbol} at ${price}. (Implementation Pending Safety Checks)`);
  }
}

export const tradeService = new TradeService();
