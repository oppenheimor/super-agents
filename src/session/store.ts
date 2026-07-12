import { ModelMessage } from 'ai';
import { appendFileSync, existsSync, mkdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const SESSION_DIR = '.sessions';

export interface SessionEntry {
  type: 'message';
  timestamp: string;
  message: ModelMessage;
}

export class SessionStore {
  private dir: string;
  private sessionId: string;

  constructor(sessionId: string = 'default') {
    this.sessionId = sessionId;
    this.dir = SESSION_DIR;
    if (!existsSync(this.dir)) {
      mkdirSync(this.dir, {
        recursive: true,
      });
    }
  }

  private get filePath(): string {
    return join(this.dir, `${this.sessionId}.jsonl`);
  }

  // 追加一条消息
  append(message: ModelMessage): void {
    const entry: SessionEntry = {
      message,
      timestamp: new Date().toISOString(),
      type: 'message',
    };
    appendFileSync(this.filePath, JSON.stringify(entry) + '\n', 'utf-8');
  }

  // 追加多条消息
  appendAll(messages: ModelMessage[]): void {
    for (const message of messages) {
      this.append(message);
    }
  }

  load(): ModelMessage[] {
    if (!existsSync(this.filePath)) {
      return [];
    }
    const content = readFileSync(this.filePath, 'utf-8').trim();
    if (!content) {
      return [];
    }

    const messages: ModelMessage[] = [];
    for (const line of content.split('\n')) {
      if (!line.trim()) {
        continue;
      }
      try {
        const entry: SessionEntry = JSON.parse(line);
        if (entry.type === 'message') {
          messages.push(entry.message);
        }
      } catch {
        /* skip malformed lines */
      }
    }

    return messages;
  }

  exists(): boolean {
    return existsSync(this.filePath);
  }
}
