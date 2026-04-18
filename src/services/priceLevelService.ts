import { env } from '../config/env';
import logger from '../utils/logger';
import { alertService } from './alertService';

export class PriceLevelService {
  private lastPrice: number = 0;
  private step: number;

  constructor(step: number) {
    this.step = step;
  }

  public checkPrice(symbol: string, currentPrice: number) {
    if (this.lastPrice === 0) {
      this.lastPrice = currentPrice;
      logger.info(`Price monitor initialized for ${symbol} at ${currentPrice}`);
      return;
    }

    const lastLevel = Math.floor(this.lastPrice / this.step) * this.step;
    const currentLevel = Math.floor(currentPrice / this.step) * this.step;

    if (currentLevel > lastLevel) {
      // Crossed Up
      alertService.sendPriceLevelAlert(symbol, currentPrice, currentLevel, 'UP');
    } else if (currentLevel < lastLevel) {
      // Crossed Down
      // Note: If falling, the level crossed is actually the lastLevel
      alertService.sendPriceLevelAlert(symbol, currentPrice, lastLevel, 'DOWN');
    }

    this.lastPrice = currentPrice;
  }
}

export const priceLevelService = new PriceLevelService(env.PRICE_LEVEL_STEP);
