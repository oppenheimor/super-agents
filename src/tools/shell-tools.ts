import { execSync } from 'node:child_process';
import { ToolDefinition } from './registry';

export const bashTool: ToolDefinition = {
  name: 'bash',
  description: '执行 shell 命令并返回输出。适合运行脚本、检查环境、执行构建等操作',
  parameters: {
    type: 'object',
    properties: {
      command: { type: 'string', description: '要执行的 shell 命令' },
    },
    required: ['command'],
    additionalProperties: false,
  },
  isConcurrencySafe: false,
  isReadOnly: false,
  maxResultChars: 3000,
  execute: async ({ command }: { command: string }) => {
    try {
      execSync('echo test', { stdio: 'ignore' });
    } catch {
      return `[bash 在当前环境不可用]`;
    }

    try {
      const output = execSync(command, {
        encoding: 'utf8',
        timeout: 10000,
        maxBuffer: 1024 * 1024,
        stdio: ['pipe', 'pipe', 'pipe'],
      });
      return output || '(命令执行成功， 无输出)';
    } catch (error: any) {
      const stderr = error.stderr || '';
      const stdout = error.stdout || '';
      return `命令执行失败(exit ${error.status || 1}):\n${stderr || stdout || error.message}`;
    }
  },
};
