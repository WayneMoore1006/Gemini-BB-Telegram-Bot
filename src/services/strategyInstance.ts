import { BBStrategy } from '../strategies/bbStrategy';
import { binanceService } from './binanceService';
import { env } from '../config/env';
import logger from '../utils/logger';
import { Candle, BBValues } from '../models/candle';
import { TradingSignal, SignalDirection } from '../models/signal';
import { PositionSide, PositionState } from '../models/position';
import { alertService } from './alertService';
import { priceLevelService } from './priceLevelService';

export class StrategyInstance {
  private strategy: BBStrategy;
  private candles: Candle[] = [];
  private currentBB: BBValues | null = null;
  private lastProcessedTimestamp: number = 0;
  private lastSignalSide: SignalDirection = SignalDirection.NONE;

  public paperPosition: PositionState;
  public symbol: string;
  public interval: string;

  constructor(symbol: string, interval: string) {
    this.symbol = symbol;
    this.interval = interval;
    this.strategy = new BBStrategy(env.BB_LENGTH, env.BB_STD_MULTIPLIER);
    this.paperPosition = {
      side: PositionSide.FLAT,
      entryPrice: 0,
      quantity: 0,
      symbol: this.symbol,
      timestamp: 0,
    };
  }

  async init() {
    logger.info(`Initializing Instance: ${this.symbol} ${this.interval}`);
    this.candles = await binanceService.fetchKlines(this.symbol, this.interval as any, 100);
    
    if (this.candles.length < env.BB_LENGTH) {
      logger.warn(`⚠️ [${this.interval}] 數據不足 (${this.candles.length}/${env.BB_LENGTH})，無法計算布林通道。這通常是因為測試網 (Testnet) 缺乏長週期歷史數據。`);
    } else {
      logger.info(`✅ [${this.interval}] 成功抓取 ${this.candles.length} 根 K 線。`);
    }

    this.updateBB();
    
    binanceService.subscribeKlines(this.symbol, this.interval as any, (candle) => {
      this.onCandleUpdate(candle);
    });
  }

  private onCandleUpdate(candle: Candle) {
    const existingIndex = this.candles.findIndex(c => c.timestamp === candle.timestamp);
    if (existingIndex !== -1) {
      this.candles[existingIndex] = candle;
    } else {
      this.candles.push(candle);
      if (this.candles.length > 200) this.candles.shift();
    }

    this.updateBB();

    // Check for integer price levels (only from the first interval to avoid duplicates)
    if (this.interval === env.INTERVALS[0]) {
      priceLevelService.checkPrice(this.symbol, candle.close);
    }

    // Signal check on closed candle
    if (candle.isClosed && candle.timestamp > this.lastProcessedTimestamp) {
      this.processSignal(candle);
    }
  }

  private updateBB() {
    this.currentBB = this.strategy.calculate(this.candles);
  }

  private processSignal(candle: Candle) {
    if (!this.currentBB) return;

    const direction = this.strategy.checkSignal(candle, this.currentBB);
    
    if (direction !== SignalDirection.NONE && direction !== this.lastSignalSide) {
      this.lastProcessedTimestamp = candle.timestamp;
      this.lastSignalSide = direction;

      const signal: TradingSignal = {
        symbol: this.symbol,
        interval: this.interval,
        direction,
        price: candle.close,
        timestamp: candle.timestamp,
        bbValues: { ...this.currentBB },
      };

      this.handleSignal(signal);
    }
  }

  private handleSignal(signal: TradingSignal) {
    logger.info(`📢 NEW SIGNAL [${this.interval}]: ${signal.direction} at ${signal.price}`);
    this.updatePaperPosition(signal);
    alertService.sendSignalAlert(signal, this.paperPosition);
  }

  private updatePaperPosition(signal: TradingSignal) {
    const side = signal.direction === SignalDirection.LONG ? PositionSide.LONG : PositionSide.SHORT;
    this.paperPosition = {
      side,
      entryPrice: signal.price,
      quantity: 1,
      symbol: this.symbol,
      timestamp: signal.timestamp,
    };
  }

  public forceSignal(direction: SignalDirection, price: number) {
    this.lastProcessedTimestamp = Date.now();
    this.lastSignalSide = direction;

    const signal: TradingSignal = {
      symbol: this.symbol,
      interval: this.interval,
      direction,
      price: price,
      timestamp: Date.now(),
      bbValues: this.currentBB || { upper: 0, lower: 0, middle: 0 },
    };

    this.handleSignal(signal);
  }

  public getStatus() {
    return {
      symbol: this.symbol,
      interval: this.interval,
      bbValues: this.currentBB,
      lastSignal: this.lastSignalSide,
      position: this.paperPosition,
    };
  }
}
