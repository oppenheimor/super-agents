import 'dotenv/config';
import { LanguageModel, ModelMessage } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import { createMockModel } from './mock-model.js';
import { createInterface } from 'node:readline';
import { allTools } from './tools/index.js';
import { agentLoop } from './agent/loop.js';
import { ToolRegistry } from './tools/registry.js';
import { registerSimulatedTools } from './mock-mcp-tools.js';
import { getToolSearchTool } from './tools/tool-search-tool.js';
import { connectMCP } from './tools/connect-mcp.js';
import { SessionStore } from './session/store.js';
import {
  CoreRules,
  deferredTools,
  PromptBuilder,
  PromptContext,
  sessionContext,
  toolGuide,
} from './context/prompt-builder.js';

const openai = createOpenAI({
  baseURL: process.env.MODEL_BASE_URL,
  apiKey: process.env.MODEL_API_KEY,
});

const model = process.env.MODEL_NAME ? openai.chat(process.env.MODEL_NAME!) : createMockModel();

async function main() {
  // 注册工具
  const registry = new ToolRegistry();
  registry.register(...allTools);

  console.log(`已注册 ${registry.getAll().length} 个工具`);
  for (const tool of registry.getAll()) {
    const flags = [
      tool.isConcurrencySafe ? '可并发' : '串行',
      tool.isReadOnly ? '只读' : '读写',
    ].join(', ');
    console.log(` - ${tool.name}(${flags})`);
  }

  // 注册元工具 ToolSearch
  const toolSearch = getToolSearchTool(registry);
  registry.register(toolSearch);

  // 连接 MCP
  await connectMCP(registry);
  const simCount = registerSimulatedTools(registry);
  console.log(`  已注册 ${simCount} 个模拟 MCP 工具`);

  // Session 持久化
  const isContinue = process.argv.includes('--continue');
  const sessionId = 'default';
  const store = new SessionStore(sessionId);

  let messages: ModelMessage[] = [];
  if (isContinue && store.exists()) {
    messages = store.load();
    console.log(`\n[Session] 恢复会话 "${sessionId}"，${messages.length} 条历史消息`);
  } else {
    console.log(`\n[Session] 新会话 "${sessionId}"`);
  }

  //   const SYSTEM = `你是 Super Agent，一个有工具调用能力的 AI 助手。
  // 需要查询信息时，主动使用工具，不要编造数据。
  // 回答要简洁直接。

  // ${registry.getDeferredToolSummary()}
  // `;
  // Prompt pipe 组装 System Prompt
  const builder = new PromptBuilder()
    .pipe('coreRules', CoreRules())
    .pipe('toolGuide', toolGuide())
    .pipe('deferredTools', deferredTools())
    .pipe('sessionContext', sessionContext());

  const promptCtx: PromptContext = {
    toolCount: registry.getActiveTools().length,
    deferredToolSummary: registry.getDeferredToolSummary(),
    sessionMessageCount: messages.length,
    sessionId,
  };

  const SYSTEM = builder.build(promptCtx);

  console.log(`\n=== System Prompt ===`);
  console.log(SYSTEM);

  // Debug: 显示 Prompt Pipe 各模块状态
  builder.debug(promptCtx);

  // 估算 token
  const allCount = registry.getAll().length;
  const activeTools = registry.getActiveTools();
  const estimate = registry.countTokenEstimate();

  console.log(`\n=== 工具统计 ===`);
  console.log(`  全部工具: ${allCount} 个`);
  console.log(`  活跃工具: ${activeTools.length} 个`);
  console.log(`  延迟工具: ${allCount - activeTools.length} 个`);
  console.log(
    `  Token 估算: ~${estimate.active} (活跃) + ~${estimate.deferred} (延迟，不占 prompt)`,
  );

  const rl = createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  function ask() {
    rl.question('\n You: ', async (input) => {
      const trimmed = input.trim();
      if (!trimmed || trimmed === 'exit') {
        console.log('Bye!');
        await registry.closeAllMCP();
        rl.close();
        return;
      }

      const userMsg: ModelMessage = {
        role: 'user',
        content: trimmed,
      };
      messages.push(userMsg);
      store.append(userMsg);

      const beforeLen = messages.length;
      await agentLoop(model as LanguageModel, messages, registry, SYSTEM);

      // 持久化本轮新增的消息（agent loop 会往 messages 里 push assistant/tool 消息）
      const newMessages = messages.slice(beforeLen);
      store.appendAll(newMessages);

      ask();
    });
  }

  console.log('Super Agent v0.7 — Session + Prompt Pipe (type "exit" to quit)');
  ask();
}
main().catch(console.error);
