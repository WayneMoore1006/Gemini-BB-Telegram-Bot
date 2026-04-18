import { BollingerBands } from 'technicalindicators';
import { Candle, BBValues } from '../models/candle';
import { SignalDirection } from '../models/signal';

export class BBStrategy {
  private length: number;
  private stdDev: number;

  constructor(length: number, stdDev: number) {
    this.length = length;
    this.stdDev = stdDev;
  }

  calculate(candles: Candle[]): BBValues | null {
    if (candles.length < this.length) return null;

    const prices = candles.map(c => c.close);
    const bb = BollingerBands.calculate({
      period: this.length,
      values: prices,
      stdDev: this.stdDev,
    });

    if (bb.length === 0) return null;

    const lastBB = bb[bb.length - 1];
    return {
      upper: lastBB.upper,
      middle: lastBB.middle,
      lower: lastBB.lower,
      timestamp: candles[candles.length - 1].timestamp,
    };
  }

  checkSignal(candle: Candle, bb: BBValues): SignalDirection {
    // 突破上軌 -> 做多
    if (candle.close > bb.upper) {
      return SignalDirection.LONG;
    }
    // 跌破下軌 -> 做空
    if (candle.close < bb.lower) {
      return SignalDirection.SHORT;
    }
    return SignalDirection.NONE;
  }
}
