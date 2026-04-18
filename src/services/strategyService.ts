import { env } from '../config/env';
import logger from '../utils/logger';
import { StrategyInstance } from './strategyInstance';

export class StrategyService {
  private instances: StrategyInstance[] = [];

  async init() {
    logger.info(`Initializing Strategy Manager with intervals: ${env.INTERVALS.join(', ')}`);
    
    for (const interval of env.INTERVALS) {
      const instance = new StrategyInstance(env.DEFAULT_SYMBOL, interval);
      this.instances.push(instance);
    }

    // Initialize all instances
    await Promise.all(this.instances.map(inst => inst.init()));
    
    logger.info('✅ All strategy instances initialized.');
  }

  public getStatus() {
    return {
      symbol: env.DEFAULT_SYMBOL,
      activeIntervals: env.INTERVALS,
      instances: this.instances.map(inst => inst.getStatus()),
    };
  }

  public getInstance(interval: string): StrategyInstance | undefined {
    return this.instances.find(inst => inst.interval === interval);
  }
  
  public getAllInstances(): StrategyInstance[] {
    return this.instances;
  }
}

export const strategyService = new StrategyService();
