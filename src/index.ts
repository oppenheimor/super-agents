import 'dotenv/config';
import { LanguageModel, ModelMessage } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import { createMockModel } from './mock-model.js';
import { createInterface } from 'node:readline';
import { calculatorTool, weatherTool } from './tools.js';
import { agentLoop, BudgetState } from './agent-loop.js';

const deepseek = createOpenAI({
  baseURL: process.env.MODEL_BASE_URL,
  apiKey: process.env.MODEL_API_KEY,
});

const model = process.env.MODEL_NAME ? deepseek.chat(process.env.MODEL_NAME!) : createMockModel();

const SYSTEM = `你是 Super Agent，一个有工具调用能力的 AI 助手。
需要查询信息时，主动使用工具，不要编造数据。
回答要简洁直接。`;

const rl = createInterface({
  input: process.stdin,
  output: process.stdout,
});

const messages: ModelMessage[] = [];

const tools = {
  get_weather: weatherTool,
  calculator: calculatorTool,
};

const budget: BudgetState = {
  used: 0,
  limit: 15000,
};

function ask() {
  rl.question('\n You: ', async (input) => {
    const trimmed = input.trim();
    if (!trimmed || trimmed === 'exit') {
      console.log('Bye!');
      rl.close();
      return;
    }

    messages.push({
      role: 'user',
      content: trimmed,
    });

    await agentLoop(model as LanguageModel, messages, tools, SYSTEM, budget);

    ask();
  });
}

console.log('Super Agent v0.3 — Fuses (type "exit" to quit)\n');
console.log('试试输入："测试死循环"、"测试重试"、"测试预算" 看三层防护效果\n');
ask();
