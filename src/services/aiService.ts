import { env } from '../config/env';
import logger from '../utils/logger';
import { memoryManager } from './memoryManager';

export interface AIResponse {
  text: string;
}

export abstract class AIProvider {
  abstract generateResponse(prompt: string, context: string, chatId: string): Promise<AIResponse>;
}

export class MockAIProvider extends AIProvider {
  async generateResponse(prompt: string, context: string, chatId: string): Promise<AIResponse> {
    logger.info('Using Mock AI Provider');
    return {
      text: "🤖 AI 助手功能目前正在串接開發中，敬請期待！"
    };
  }
}

export class GeminiProvider extends AIProvider {
  private readonly modelId = 'gemma-3-1b-it';
  // 使用 Google AI Studio 的 REST API 端點 (2.0 系列建議使用 v1beta)
  private get endpoint() {
    return `https://generativelanguage.googleapis.com/v1beta/models/${this.modelId}:generateContent?key=${env.GEMINI_API_KEY}`;
  }

  async generateResponse(prompt: string, context: string, chatId: string): Promise<AIResponse> {
    const apiKey = env.GEMINI_API_KEY;
    if (!apiKey || apiKey.includes('your_')) {
      return { text: "❌ 請先在 .env 中設定正確的 GEMINI_API_KEY 才能使用 AI 功能。" };
    }

    const history = memoryManager.getFormattedHistory(chatId);
    
    // 構建符合 Gemini 格式的請求體
    const requestBody = {
      contents: [
        {
          role: 'user',
          parts: [{ text: `你是一個專業的 BB Breakout 交易機器人助手。請使用繁體中文回覆。
目前市場行情與狀態資訊：
${context}

歷史對話紀錄：
${history || '無'}

使用者目前的問題：
${prompt}` }]
        }
      ],
      generationConfig: {
        maxOutputTokens: 512,
        temperature: 0.7,
      }
    };

    try {
      const response = await fetch(this.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(`Gemini API Error ${response.status}: ${errorBody.substring(0, 100)}`);
      }

      const data = await response.json();
      
      // 解析 Gemini 傳回的路徑: data.candidates[0].content.parts[0].text
      const answer = data.candidates?.[0]?.content?.parts?.[0]?.text || 'AI 沒有回傳任何內容。';

      return { text: answer.trim() };
    } catch (error: any) {
      logger.error('Gemini Provider Error:', error);
      throw error;
    }
  }
}

export class AIService {
  private provider: AIProvider;

  constructor() {
    // 根據配置動態切換供應商
    if (env.AI_PROVIDER === 'gemini') {
      this.provider = new GeminiProvider();
    } else {
      this.provider = new MockAIProvider();
    }
  }

  async ask(question: string, systemState: any, chatId: string): Promise<string> {
    // 彙整各週期的狀態資訊
    const instancesInfo = systemState.instances.map((inst: any) => 
      `[${inst.interval}] 價格:${inst.lastPrice || '未知'}, 上軌:${inst.bbValues?.upper.toFixed(2) || 'N/A'}, 下軌:${inst.bbValues?.lower.toFixed(2) || 'N/A'}, 持倉:${inst.position.side}`
    ).join('\n');

    const context = `交易對: ${systemState.symbol}\n各週期狀態:\n${instancesInfo}`;

    try {
      const response = await this.provider.generateResponse(question, context, chatId);
      const answer = response.text;

      // 只有成功時才儲存記憶
      if (!answer.startsWith('❌')) {
        memoryManager.addMessage(chatId, 'user', question);
        memoryManager.addMessage(chatId, 'assistant', answer);
      }

      return answer;
    } catch (error: any) {
      logger.error('AI Service Error:', error);
      return `❌ AI 連線失敗：${error.message || '未知錯誤'}\n(請檢查金鑰或稍後再試)`;
    }
  }
}

export const aiService = new AIService();
