import { Telegraf } from 'telegraf';
import { registerCommands } from './commands';
import logger from '../utils/logger';
import { alertService } from '../services/alertService';

export function createTelegramBot(token: string) {
  const bot = new Telegraf(token);

  // Set shared bot instance for alert service
  alertService.setBot(bot);

  // Register all commands
  registerCommands(bot);

  // Error Handling
  bot.catch((err: any, ctx) => {
    logger.error(`Telegram Bot Error for ${ctx.updateType}:`, err);
  });

  logger.info('Telegram Bot layer initialized.');
  
  return bot;
}
