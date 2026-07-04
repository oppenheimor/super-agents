import { LanguageModel, ModelMessage, streamText, Tool } from 'ai';

const MAX_STEPS = 15;

export interface BudgetState {
  used: number;
  limit: number;
}

export async function agentLoop(
  model: LanguageModel,
  messages: ModelMessage[],
  tools: Record<string, Tool>,
  system: string,
  budget: BudgetState,
) {
  let step = 0;

  while (step < MAX_STEPS) {
    step++;
    console.log(`\n--- Step ${step} ---`);

    const { fullStream, response } = await streamText({
      model,
      system,
      messages,
      tools,
      // 不设 stopWhen，每次只跑一步
    });

    let hasToolCall = false;
    let fullText = '';

    for await (const part of fullStream) {
      switch (part.type) {
        case 'text-delta':
          process.stdout.write(part.text);
          fullText += part.text;
          break;
        case 'tool-call':
          hasToolCall = true;
          console.log(`\n 【调用工具: ${part.toolName}(${JSON.stringify(part.input)})】`);
          break;
        case 'tool-result':
          console.log(`\n 【工具返回: ${JSON.stringify(part.output)}】`);
          break;
      }
    }

    // 拿到这一步的完整结果，追加到消息历史
    const stepMessages = await response;
    messages.push(...stepMessages.messages);

    // 退出条件：假如模型没有调用任何工具，说明它认为可以直接回复了
    if (!hasToolCall) {
      if (fullText) {
        console.log();
      }
      break;
    }

    // 还有工具调用 -> 继续循环，让模型看到工具结果后继续思考
    console.log('  → 模型还在工作，继续下一步...');
  }
}
