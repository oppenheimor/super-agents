import 'dotenv/config';
import { LanguageModel, ModelMessage } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import { createMockModel } from './mock-model.js';
import { createInterface } from 'node:readline';
import { allTools } from './tools.js';
import { agentLoop } from './agent-loop.js';
import { ToolDefinition, ToolRegistry } from './tool-registry.js';
import { execSync } from 'node:child_process';
import { MCPClient } from './mcp-client.js';
import { simulatedTools } from './mock-tools.js';

const openai = createOpenAI({
  baseURL: process.env.MODEL_BASE_URL,
  apiKey: process.env.MODEL_API_KEY,
});

const model = process.env.MODEL_NAME ? openai.chat(process.env.MODEL_NAME!) : createMockModel();

const rl = createInterface({
  input: process.stdin,
  output: process.stdout,
});

const messages: ModelMessage[] = [];

async function connectMCP() {
  const githubToken = process.env.GITHUB_PERSONAL_ACCESS_TOKEN;

  let canSpawn = true;

  try {
    execSync('echo test', { stdio: 'inherit' });
  } catch {
    canSpawn = false;
  }

  if (githubToken && canSpawn) {
    console.log('\n连接 GitHub MCP Server...');

    try {
      const client = new MCPClient('npx', ['-y', '@modelcontextprotocol/server-github'], {
        GITHUB_PERSONAL_ACCESS_TOKEN: githubToken,
      });
      const tools = await registry.registerMCPServer('github', client);
      console.log(`  已注册 ${tools.length} 个 GitHub 工具`);
      return;
    } catch (err) {
      console.log(`  MCP 连接失败: ${err instanceof Error ? err.message : err}`);
    }
  }

  if (!githubToken) {
    console.log('\n未配置 GITHUB_PERSONAL_ACCESS_TOKEN，使用 Mock MCP');
  }
}

const registry = new ToolRegistry();
registry.register(...allTools, ...simulatedTools);

console.log(`  已注册 ${simulatedTools.length} 个模拟 MCP 工具（Notion/Browser/Supabase）`);

// 注册元工具 ToolSearch
export const toolSearch: ToolDefinition = {
  name: 'tool_search',
  description:
    '获取延迟工具的完整定义。传入工具名（从系统提示的延迟工具列表中选取），返回该工具的完整参数 Schema',
  parameters: {
    type: 'object',
    properties: {
      query: {
        type: 'string',
        description: '工具名，如 "mcp__github__list_issues。支持逗号分隔多个工具名',
      },
    },
    required: ['query'],
    additionalProperties: false,
  },
  isConcurrencySafe: true,
  isReadOnly: true,
  execute: async ({ query }: { query: string }) => {
    const results = registry.searchTools(query);
    if (results.length === 0) {
      return `没有找到匹配 "${query}" 的工具`;
    }
    return results.map((t) => ({
      name: t.name,
      describetion: t.description,
      parameters: t.parameters,
    }));
  },
};

registry.register(toolSearch);

await connectMCP();

console.log(`已注册 ${registry.getAll().length} 个工具`);
for (const tool of registry.getAll()) {
  const flags = [
    tool.isConcurrencySafe ? '可并发' : '串行',
    tool.isReadOnly ? '只读' : '读写',
  ].join(', ');
  console.log(` - ${tool.name}(${flags})`);
}

const SYSTEM = `你是 Super Agent，一个有工具调用能力的 AI 助手。
需要查询信息时，主动使用工具，不要编造数据。
回答要简洁直接。

${registry.getDeferredToolSummary()}
`;

console.log(`\n=== 系统提示 ===`);
console.log(SYSTEM);
console.log(`================`);

// 估算 token
const allCount = registry.getAll().length;
const activeTools = registry.getActiveTools();
const estimate = registry.countTokenEstimate();

console.log(`\n=== 工具统计 ===`);
console.log(`  全部工具: ${allCount} 个`);
console.log(`  活跃工具: ${activeTools.length} 个`);
console.log(`  延迟工具: ${allCount - activeTools.length} 个`);
console.log(`  Token 估算: ~${estimate.active} (活跃) + ~${estimate.deferred} (延迟，不占 prompt)`);

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

    await agentLoop(model as LanguageModel, messages, registry, SYSTEM);

    ask();
  });
}

console.log('Super Agent v0.4.1 — Fuses (type "exit" to quit)\n');
ask();
