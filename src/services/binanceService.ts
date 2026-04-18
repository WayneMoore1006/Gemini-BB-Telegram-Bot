import { MainClient, WebsocketClient } from 'binance';
import { env } from '../config/env';
import logger from '../utils/logger';
import { Candle } from '../models/candle';

export class BinanceService {
  private client: MainClient;
  private wsClient: WebsocketClient;

  private klineCallbacks: Map<string, (candle: Candle) => void> = new Map();

  constructor() {
    this.client = new MainClient({
      api_key: env.BINANCE_API_KEY,
      api_secret: env.BINANCE_API_SECRET,
      beautifyResponses: true,
      baseUrl: env.BINANCE_BASE_URL,
    });

    this.wsClient = new WebsocketClient({
      api_key: env.BINANCE_API_KEY,
      api_secret: env.BINANCE_API_SECRET,
      beautifyResponses: true,
      // Use the WS URL from env (especially important for Testnet)
      baseUrl: env.BINANCE_WS_URL,
      // Thorough workaround for library bug: ensure all reconnect properties are safe
      reconnectOptions: {
        keepAlive: true,
        customReconnectCodes: [],
      }
    } as any);

    // CRITICAL FIX: Override the buggy library function that causes the "includes" crash
    (this.wsClient as any).isCustomReconnectionNeeded = function () {
      return false;
    };

    this.setupWsHandlers();
  }

  private setupWsHandlers() {
    this.wsClient.on('formattedMessage', (data: any) => {
      if (data.eventType === 'kline') {
        const key = `${data.symbol}_${data.kline.interval}`;
        const callback = this.klineCallbacks.get(key);

        if (callback) {
          const k = data.kline;
          const candle: Candle = {
            timestamp: k.startTime,
            open: parseFloat(k.open),
            high: parseFloat(k.high),
            low: parseFloat(k.low),
            close: parseFloat(k.close),
            volume: parseFloat(k.volume),
            isClosed: k.closed,
          };
          callback(candle);
        }
      }
    });

    // Use a more generic listener or cast to bypass type issues with the 'error' event
    (this.wsClient as any).on('error', (err: any) => {
      logger.error('Binance WS Error:', err);
    });
  }

  async getTickerPrice(symbol: string): Promise<number | null> {
    try {
      const ticker: any = await this.client.getSymbolPriceTicker({ symbol });
      const result = Array.isArray(ticker) ? ticker[0] : ticker;
      if (!result || !result.price) return null;
      return typeof result.price === 'number' ? result.price : parseFloat(result.price);
    } catch (error) {
      logger.error(`Error fetching ticker price for ${symbol}:`, error);
      return null;
    }
  }

  async fetchKlines(symbol: string, interval: any, limit = 100): Promise<Candle[]> {
    try {
      const klines: any = await this.client.getKlines({ symbol, interval, limit });
      return klines.map((k: any) => ({
        timestamp: k[0],
        open: parseFloat(k[1]),
        high: parseFloat(k[2]),
        low: parseFloat(k[3]),
        close: parseFloat(k[4]),
        volume: parseFloat(k[5]),
        isClosed: true,
      }));
    } catch (error: any) {
      logger.error(`❌ [${interval}] 抓取數據失敗: ${error.message || error}`, {
        symbol,
        interval,
        code: error.code,
        baseUrl: env.BINANCE_BASE_URL
      });
      return [];
    }
  }

  subscribeKlines(symbol: string, interval: any, callback: (candle: Candle) => void) {
    const key = `${symbol}_${interval}`;
    this.klineCallbacks.set(key, callback);
    // Explicitly casting to any if signature mismatch persists in some environments
    (this.wsClient as any).subscribeKlines(symbol, interval);
    logger.info(`Subscribed to Klines: ${symbol} ${interval}`);
  }
}

export const binanceService = new BinanceService();
