import { ToolDefinition, ToolRegistry } from './tools/registry';

// 模拟 MCP 工具
export function registerSimulatedTools(registry: ToolRegistry) {
  const simulatedTools: ToolDefinition[] = [
    {
      name: 'mcp__notion__search_pages',
      description: '[MCP:notion] 搜索 Notion 页面',
      parameters: {
        type: 'object',
        properties: { query: { type: 'string' } },
        required: ['query'],
      },
      shouldDefer: true,
      searchHint: 'notion search pages documents',
      isConcurrencySafe: true,
      isReadOnly: true,
      execute: async ({ query }: any) =>
        JSON.stringify([{ title: `Mock: ${query}`, id: 'page-001' }]),
    },
    {
      name: 'mcp__notion__create_page',
      description: '[MCP:notion] 创建 Notion 页面',
      parameters: {
        type: 'object',
        properties: { title: { type: 'string' }, content: { type: 'string' } },
        required: ['title'],
      },
      shouldDefer: true,
      searchHint: 'notion create page document write',
      isConcurrencySafe: false,
      isReadOnly: false,
      execute: async ({ title }: any) => `已创建页面: ${title}`,
    },
    {
      name: 'mcp__browser__navigate',
      description: '[MCP:browser] 导航到指定 URL',
      parameters: { type: 'object', properties: { url: { type: 'string' } }, required: ['url'] },
      shouldDefer: true,
      searchHint: 'browser navigate open url webpage',
      isConcurrencySafe: false,
      isReadOnly: false,
      execute: async ({ url }: any) => `已导航到 ${url}`,
    },
    {
      name: 'mcp__browser__screenshot',
      description: '[MCP:browser] 对当前页面截图',
      parameters: { type: 'object', properties: {} },
      shouldDefer: true,
      searchHint: 'browser screenshot capture page',
      isConcurrencySafe: true,
      isReadOnly: true,
      execute: async () => '[screenshot data]',
    },
    {
      name: 'mcp__supabase__query',
      description: '[MCP:supabase] 执行 SQL 查询',
      parameters: { type: 'object', properties: { sql: { type: 'string' } }, required: ['sql'] },
      shouldDefer: true,
      searchHint: 'supabase database sql query select',
      isConcurrencySafe: true,
      isReadOnly: true,
      execute: async ({ sql }: any) => JSON.stringify([{ id: 1, name: 'mock_row', sql }]),
    },
    {
      name: 'mcp__supabase__list_tables',
      description: '[MCP:supabase] 列出数据库所有表',
      parameters: { type: 'object', properties: {} },
      shouldDefer: true,
      searchHint: 'supabase database list tables schema',
      isConcurrencySafe: true,
      isReadOnly: true,
      execute: async () => JSON.stringify(['users', 'orders', 'products']),
    },
  ];
  registry.register(...simulatedTools);
  return simulatedTools.length;
}
