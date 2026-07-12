import { LanguageModel, ModelMessage, streamText } from 'ai';
import { detect, recordCall, recordResult, resetHistory } from './loop-detection';
import { calculateDelay, isRetryable, sleep } from './retry';
import { ToolRegistry } from '../tools/registry';

const MAX_STEPS = 15;
const MAX_RETRIES = 3;
const TOKEN_BUDGET = 50000;

export async function agentLoop(
  model: LanguageModel,
  messages: ModelMessage[],
  registry: ToolRegistry,
  system: string,
) {
  let step = 0;
  let totalTokens = 0;
  resetHistory();

  while (step < MAX_STEPS) {
    step++;
    console.log(`\n--- Step ${step} ---`);

    let hasToolCall = false;
    let fullText = '';
    let shouldBreak = false;
    let lastToolCall: { name: string; input: unknown } | null = null;
    let stepResponse: any;
    let stepUsage: any;

    // 步骤级重试：包裹整个 stream 消费过程
    for (let attempt = 1; ; attempt++) {
      try {
        const { fullStream, response, usage } = await streamText({
          model,
          system,
          messages,
          tools: registry.toAISDKFormat(),
          // 禁用 AI SDK 默认的自动重试
          maxRetries: 0,
          onError: () => {},
          providerOptions: { openai: { parallelToolCalls: true } },
          // 不设 stopWhen，每次只跑一步
        });

        for await (const part of fullStream) {
          switch (part.type) {
            case 'text-delta':
              process.stdout.write(part.text);
              fullText += part.text;
              break;
            case 'tool-call': {
              hasToolCall = true;
              lastToolCall = { name: part.toolName, input: part.input };
              console.log(`\n 【调用工具: ${part.toolName}(${JSON.stringify(part.input)})】`);

              const detection = detect(part.toolName, part.input);
              if (detection.stuck) {
                console.log(` ${detection.message}`);
                if (detection.level === 'critical') {
                  shouldBreak = true;
                } else {
                  messages.push({
                    role: 'user' as const,
                    content: `[系统提醒] ${detection.message}。请换一个思路解决问题，不要重复同样的操作。`,
                  });
                }
              }
              recordCall(part.toolName, part.input);
              break;
            }
            case 'tool-result': {
              const output =
                typeof part.output === 'string' ? part.output : JSON.stringify(part.output);
              const preview = output.length > 120 ? output.slice(0, 120) + '...' : output;
              console.log(`\n 【结果: ${part.toolName}】${preview}`);
              if (lastToolCall) {
                recordResult(lastToolCall.name, lastToolCall.input, part.output);
              }
              break;
            }
          }
        }

        stepResponse = await response;
        stepUsage = await usage;
        break;
      } catch (error) {
        if (attempt > MAX_RETRIES || !isRetryable(error as Error)) throw Error;
        const delay = calculateDelay(attempt);
        console.log(`【重试】 第 ${attempt}/${MAX_RETRIES} 次失败，${delay}ms 后重试...`);
        await sleep(delay);
        hasToolCall = false;
        fullText = '';
        shouldBreak = false;
        lastToolCall = null;
      }
    }

    if (shouldBreak) {
      console.log('\n【循环检测触发，Agent 已停止】');
      break;
    }

    // 拿到这一步的完整结果，追加到消息历史
    messages.push(...stepResponse.messages);

    // Token 预算追踪：budget 由调用方持有，跨轮持续累计
    const inp = stepUsage?.inputTokens?.total ?? stepUsage?.inputTokens ?? 0;
    const out = stepUsage?.outputTokens?.total ?? stepUsage?.outputTokens ?? 0;
    totalTokens += inp + out;
    if (totalTokens > TOKEN_BUDGET * 0.9) {
      console.log(
        `[Token] ${totalTokens}/${TOKEN_BUDGET}(${Math.round((totalTokens / TOKEN_BUDGET) * 100)}%)`,
      );
    }
    if (totalTokens > TOKEN_BUDGET) {
      console.log(`\n[Token 预算耗尽]`);
      break;
    }

    // 退出条件：假如模型没有调用任何工具，说明它认为可以直接回复了
    if (!hasToolCall) {
      if (fullText) {
        console.log();
      }
      break;
    }

    // 还有工具调用 -> 继续循环，让模型看到工具结果后继续思考
    console.log('  \u2192 模型还在工作，继续下一步...');

    if (step >= MAX_STEPS) {
      console.log(`\n【达到最大步数，Agent 已停止】`);
    }
  }
}
