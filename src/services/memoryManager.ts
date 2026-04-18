import logger from '../utils/logger';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export class MemoryManager {
  private memory: Map<string, ChatMessage[]> = new Map();
  private readonly MAX_HISTORY = 15;

  public addMessage(chatId: string, role: 'user' | 'assistant', content: string) {
    if (!this.memory.has(chatId)) {
      this.memory.set(chatId, []);
    }

    const history = this.memory.get(chatId)!;
    history.push({ role, content });

    if (history.length > this.MAX_HISTORY) {
      history.shift();
    }
  }

  public getFormattedHistory(chatId: string): string {
    const history = this.memory.get(chatId) || [];
    if (history.length === 0) return '';

    return history
      .map(msg => `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}`)
      .join('\n');
  }

  public clearHistory(chatId: string) {
    this.memory.delete(chatId);
    logger.info(`Memory cleared for chat: ${chatId}`);
  }
}

export const memoryManager = new MemoryManager();
