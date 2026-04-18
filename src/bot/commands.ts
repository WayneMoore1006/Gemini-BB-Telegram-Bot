import { Telegraf } from 'telegraf';
import { binanceService } from '../services/binanceService';
import { strategyService } from '../services/strategyService';
import { aiService } from '../services/aiService';
import { SignalDirection } from '../models/signal';
import { alertService } from '../services/alertService';
import { priceLevelService } from '../services/priceLevelService';
import { env } from '../config/env';

export function registerCommands(bot: Telegraf) {
  
  bot.command('start', async (ctx) => {
    await ctx.reply(`👋 歡迎使用 BB Breakout 多週期交易機器人!\n目前監控 ${env.DEFAULT_SYMBOL} 的以下週期：${env.INTERVALS.join(', ')}\n輸入 /help 查看可用指令。`);
  });

  bot.command('help', async (ctx) => {
    await ctx.reply(`
📌 *BB Breakout 交易機器人 - 功能手冊*
━━━━━━━━━━━━━━━━━━━━
📊 *行情與狀態監控*
/price    - 💰 即時價格查詢
/status   - 📉 完整監控狀態 (各週期 BB 軌道)
/signal   - 📍 各週期最後一次觸發訊號
/position - 💼 虛擬倉位與進場價查詢

🧠 *AI 智能助手 (Gemini)*
/ai  [問題] - 💡 諮詢 AI 交易建議與行情分析

📖 *策略與說明*
/strategy - 📚 深度解析 BB Breakout 策略邏輯
/help     - ❓ 顯示此功能清單
━━━━━━━━━━━━━━━━━━━━
💡 *提示*：您可以直接輸入 /ai 後面接問題，例如：\`/ai 請幫我分析現在的走勢\`
    `, { parse_mode: 'Markdown' });
  });

  bot.command('price', async (ctx) => {
    const price = await binanceService.getTickerPrice(env.DEFAULT_SYMBOL);
    await ctx.reply(`💰 ${env.DEFAULT_SYMBOL} 目前價格: ${price || '查詢失敗'}`);
  });

  bot.command('status', async (ctx) => {
    const status = strategyService.getStatus();
    let message = `📊 *系統狀態 (${status.symbol})*：\n`;
    
    status.instances.forEach(inst => {
      message += `------------------\n`;
      message += `⏰ *週期: ${inst.interval}*\n`;
      message += `📈 上軌: ${inst.bbValues?.upper.toFixed(2) || 'N/A'}\n`;
      message += `📉 下軌: ${inst.bbValues?.lower.toFixed(2) || 'N/A'}\n`;
      message += `📍 最後訊號: ${inst.lastSignal}\n`;
    });

    message += `\n🔔 *價格關口警報:* ${env.ENABLE_PRICE_LEVEL_ALERTS ? '✅ 開啟' : '❌ 關閉'} (每 $${env.PRICE_LEVEL_STEP})`;

    await ctx.reply(message, { parse_mode: 'Markdown' });
  });

  bot.command('test_price', async (ctx) => {
    const args = ctx.message.text.split(' ');
    if (args.length < 2) return ctx.reply('用法: /test_price <價格> (例如: /test_price 75001)');
    const price = parseFloat(args[1] || '0');
    // Ensure we can trigger crossing even if it was just initialized
    priceLevelService.checkPrice(env.DEFAULT_SYMBOL, price);
    await ctx.reply(`📊 模擬價格已更新為: ${price}\n(如果跨越了 $${env.PRICE_LEVEL_STEP} 的整數倍，您稍後應會收到警報)`);
  });

  bot.command('signal', async (ctx) => {
    const status = strategyService.getStatus();
    let message = `📍 *各週期最近訊號*：\n`;
    status.instances.forEach(inst => {
      message += `🔸 ${inst.interval}: ${inst.lastSignal}\n`;
    });
    await ctx.reply(message, { parse_mode: 'Markdown' });
  });

  bot.command('position', async (ctx) => {
    const status = strategyService.getStatus();
    let message = `💼 *目前各週期虛擬倉位*：\n`;
    
    status.instances.forEach(inst => {
      const pos = inst.position;
      message += `------------------\n`;
      message += `⏰ *週期: ${inst.interval}*\n`;
      message += `方向: ${pos.side}\n`;
      message += `進場價: ${pos.entryPrice}\n`;
      message += `時間: ${pos.timestamp === 0 ? 'N/A' : new Date(pos.timestamp).toLocaleString()}\n`;
    });

    await ctx.reply(message, { parse_mode: 'Markdown' });
  });

  bot.command('strategy', async (ctx) => {
    await ctx.reply(`
📖 *BB Breakout 多週期策略說明*：
1. 系統同時監控多個時間尺度 (${env.INTERVALS.join(', ')})。
2. 每個週期獨立計算布林通道 (${env.BB_LENGTH}, ${env.BB_STD_MULTIPLIER})。
3. *訊號*: 價格突破各週期上/下軌時分別發送警報。
4. *優勢*: 可協助判斷長短週期的趨勢共振。
    `, { parse_mode: 'Markdown' });
  });

  bot.command('test_alert', async (ctx) => {
    await alertService.sendTestAlert();
    await ctx.reply('發送測試警報中...');
  });

  bot.command('test_signal', async (ctx) => {
    const args = ctx.message.text.split(' ');
    if (args.length < 3) return ctx.reply('用法: /test_signal <週期> <方向: LONG|SHORT|NONE>');
    
    const interval = args[1];
    const direction = args[2].toUpperCase() as SignalDirection;
    
    if (!Object.values(SignalDirection).includes(direction)) {
      return ctx.reply('錯誤的方向！請使用: LONG, SHORT, 或 NONE');
    }

    const instance = strategyService.getInstance(interval);
    if (!instance) {
      return ctx.reply(`找不到週期: ${interval}。目前的有效週期為: ${env.INTERVALS.join(', ')}`);
    }

    const price = await binanceService.getTickerPrice(env.DEFAULT_SYMBOL) || 75000;
    instance.forceSignal(direction, price);
    await ctx.reply(`✅ 已強制觸發 ${interval} 的 ${direction} 訊號 (價格: ${price})`);
  });

  bot.command('ai', async (ctx) => {
    try {
      const question = ctx.payload;
      const status = strategyService.getStatus();
      const response = await aiService.ask(question || '', status, ctx.chat.id.toString());
      if (!response) {
        return ctx.reply('⚠️ AI 回傳了空訊息，請檢查 API 狀態。');
      }
      await ctx.reply(response);
    } catch (err: any) {
      console.error('AI Command Error:', err);
      await ctx.reply(`❌ 指令崩潰了！原因：${err.message || err}\n請將此訊息截圖給我。`);
    }
  });

  bot.command('debug_ai', async (ctx) => {
    await ctx.reply('🔍 正在診斷 Gemini AI 連線狀態，請稍候...');
    try {
      const gKey = env.GEMINI_API_KEY || '';
      const testUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemma-3-1b-it:generateContent?key=${gKey}`;
      
      const start = Date.now();
      const res = await fetch(testUrl, { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: 'Hi' }] }] })
      });
      const duration = Date.now() - start;
      const data = await res.json();
      
      const status = res.ok ? '✅ 運作正常' : '❌ 連線異常';
      const report = `
📊 AI 連線診斷報告
━━━━━━━━━━━━━━━━━━━━
📡 狀態：${status} (HTTP ${res.status})
⏱️ 耗時：${duration}ms
🤖 模型：gemma-3-1b-it
━━━━━━━━━━━━━━━━━━━━
      `.trim();
      await ctx.reply(report);
    } catch (err: any) {
      await ctx.reply(`❌ 診斷失敗：${err.message}`);
    }
  });

  bot.on('text', async (ctx, next) => {
    const text = ctx.message.text;
    if (text?.startsWith('/ai')) {
      const question = text.replace('/ai', '').trim();
      const status = strategyService.getStatus();
      const response = await aiService.ask(question, status, ctx.chat.id.toString());
      await ctx.reply(response);
    } else {
      return next();
    }
  });
}
