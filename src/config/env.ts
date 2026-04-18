import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  TELEGRAM_BOT_TOKEN: z.string().min(1, "TELEGRAM_BOT_TOKEN is required"),
  TELEGRAM_CHAT_ID: z.string().optional(),
  
  BINANCE_API_KEY: z.string().optional(),
  BINANCE_API_SECRET: z.string().optional(),
  USE_TESTNET: z.string().default('true').transform(v => v === 'true'),
  BINANCE_BASE_URL: z.string().optional(),
  BINANCE_WS_URL: z.string().optional(),
  
  DEFAULT_SYMBOL: z.string().default('BTCUSDT'),
  INTERVALS: z.string().default('15m,1h,4h,1d,1w,1M').transform(v => v.split(',').map(s => s.trim())),
  BB_LENGTH: z.string().default('20').transform(Number),
  BB_STD_MULTIPLIER: z.string().default('2').transform(Number),
  
  ENABLE_LIVE_TRADING: z.string().default('false').transform(v => v === 'true'),
  PAPER_TRADING: z.string().default('true').transform(v => v === 'true'),
  
  // Price Level Settings
  PRICE_LEVEL_STEP: z.string().default('1000').transform(Number),
  ENABLE_PRICE_LEVEL_ALERTS: z.string().default('true').transform(v => v === 'true'),

  AI_PROVIDER: z.enum(['mock', 'gemini']).default('mock'),
  GEMINI_API_KEY: z.string().optional(),
  
  LOG_LEVEL: z.string().default('info'),
}).transform((data) => {
  // 動態根據 USE_TESTNET 設定網址，除非使用者有手動指定
  if (!data.BINANCE_BASE_URL) {
    data.BINANCE_BASE_URL = data.USE_TESTNET 
      ? 'https://testnet.binance.vision' 
      : 'https://api.binance.com';
  }
  if (!data.BINANCE_WS_URL) {
    data.BINANCE_WS_URL = data.USE_TESTNET 
      ? 'wss://testnet.binance.vision/ws' 
      : 'wss://stream.binance.com:9443/ws';
  }
  return data;
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("❌ Invalid environment variables:", JSON.stringify(parsed.error.format(), null, 2));
  process.exit(1);
}

export const env = parsed.data;
export type Env = z.infer<typeof envSchema>;
