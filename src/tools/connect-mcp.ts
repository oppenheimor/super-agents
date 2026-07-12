import { execSync } from 'node:child_process';
import { MCPClient } from './mcp-client';
import { ToolRegistry } from './registry';

export async function connectMCP(registry: ToolRegistry) {
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
