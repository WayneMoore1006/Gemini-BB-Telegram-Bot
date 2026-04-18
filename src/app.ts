import { createTelegramBot } from './bot/telegramBot';
import { env } from './config/env';
import logger from './utils/logger';
import { strategyService } from './services/strategyService';

async function bootstrap() {
  try {
    logger.info('🚀 Starting BB Breakout Telegram Trading Bot...');

    // 1. Initialize Strategy Service (Connects to Binance)
    await strategyService.init();
    logger.info('✅ Strategy service initialized.');

    // 2. Initialize Telegram Bot
    const bot = createTelegramBot(env.TELEGRAM_BOT_TOKEN);
    
    // 3. Launch Bot
    bot.launch();
    logger.info('✅ Telegram Bot launched and listening.');

    // Enable graceful stop
    process.once('SIGINT', () => bot.stop('SIGINT'));
    process.once('SIGTERM', () => bot.stop('SIGTERM'));

    logger.info(`✨ Bot is now monitoring ${env.DEFAULT_SYMBOL} on ${env.INTERVALS.join(', ')} interval.`);

  } catch (error) {
    logger.error('❌ Failed to start the bot:', error);
    process.exit(1);
  }
}

bootstrap();
