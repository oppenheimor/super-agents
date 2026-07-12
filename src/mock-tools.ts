import { ToolDefinition, ToolRegistry } from './tool-registry';

export const simulatedTools: ToolDefinition[] = [
  {
    name: 'mcp__notion__search_pages',
    description: '[MCP:notion] 搜索 Notion 页面',
    parameters: {
      type: 'object',
      properties: {
        query: { type: 'string', description: '搜索关键词' },
      },
      required: ['query'],
      additionalProperties: false,
    },
    shouldDefer: true,
    searchHint: 'notion search pages documents',
    isConcurrencySafe: true,
    isReadOnly: true,
    execute: async ({ query }: { query: string }) =>
      JSON.stringify([
        {
          title: `Mock: ${query}`,
          id: 'page-001',
          url: 'https://notion.so/mock-page-001',
          lastEditedTime: '2026-07-12T09:00:00.000Z',
        },
      ]),
  },
  {
    name: 'mcp__notion__create_page',
    description: '[MCP:notion] 创建 Notion 页面',
    parameters: {
      type: 'object',
      properties: {
        parent_id: { type: 'string', description: '父页面或数据库 ID' },
        title: { type: 'string', description: '页面标题' },
        content: { type: 'string', description: '页面正文' },
      },
      required: ['parent_id', 'title'],
      additionalProperties: false,
    },
    shouldDefer: true,
    searchHint: 'notion create page document',
    isConcurrencySafe: false,
    isReadOnly: false,
    execute: async ({
      parent_id,
      title,
      content = '',
    }: {
      parent_id: string;
      title: string;
      content?: string;
    }) =>
      JSON.stringify({
        id: 'page-created-001',
        parentId: parent_id,
        title,
        contentPreview: content.slice(0, 120),
        url: 'https://notion.so/page-created-001',
        status: 'created',
      }),
  },
  {
    name: 'mcp__notion__list_databases',
    description: '[MCP:notion] 列出 Notion 数据库',
    parameters: {
      type: 'object',
      properties: {
        query: { type: 'string', description: '可选的数据库名称过滤关键词' },
      },
      required: [],
      additionalProperties: false,
    },
    shouldDefer: true,
    searchHint: 'notion list databases schema',
    isConcurrencySafe: true,
    isReadOnly: true,
    execute: async ({ query = '' }: { query?: string }) => {
      const databases = [
        { id: 'db-tasks', title: 'Tasks', properties: ['Name', 'Status', 'Owner', 'Due'] },
        { id: 'db-notes', title: 'Notes', properties: ['Title', 'Tags', 'Created'] },
        { id: 'db-crm', title: 'CRM', properties: ['Company', 'Stage', 'Contact'] },
      ];
      const normalized = query.toLowerCase();
      const results = normalized
        ? databases.filter((database) => database.title.toLowerCase().includes(normalized))
        : databases;

      return JSON.stringify(results);
    },
  },
  {
    name: 'mcp__browser__navigate',
    description: '[MCP:browser] 导航到指定 URL',
    parameters: {
      type: 'object',
      properties: {
        url: { type: 'string', description: '要打开的 URL' },
      },
      required: ['url'],
      additionalProperties: false,
    },
    shouldDefer: true,
    searchHint: 'browser navigate open url',
    isConcurrencySafe: false,
    isReadOnly: false,
    execute: async ({ url }: { url: string }) =>
      JSON.stringify({
        url,
        title: `Mock page for ${url}`,
        status: 'loaded',
      }),
  },
  {
    name: 'mcp__browser__screenshot',
    description: '[MCP:browser] 获取当前页面截图',
    parameters: {
      type: 'object',
      properties: {
        full_page: { type: 'boolean', description: '是否截取完整页面' },
      },
      required: [],
      additionalProperties: false,
    },
    shouldDefer: true,
    searchHint: 'browser screenshot page image',
    isConcurrencySafe: true,
    isReadOnly: true,
    execute: async ({ full_page = false }: { full_page?: boolean }) =>
      JSON.stringify({
        imagePath: '/tmp/mock-browser-screenshot.png',
        fullPage: full_page,
        width: 1440,
        height: full_page ? 2400 : 900,
      }),
  },
  {
    name: 'mcp__browser__click',
    description: '[MCP:browser] 点击页面元素',
    parameters: {
      type: 'object',
      properties: {
        selector: { type: 'string', description: 'CSS 选择器或可访问名称' },
      },
      required: ['selector'],
      additionalProperties: false,
    },
    shouldDefer: true,
    searchHint: 'browser click element selector',
    isConcurrencySafe: false,
    isReadOnly: false,
    execute: async ({ selector }: { selector: string }) =>
      JSON.stringify({
        selector,
        clicked: true,
      }),
  },
  {
    name: 'mcp__browser__fill',
    description: '[MCP:browser] 填写页面输入框',
    parameters: {
      type: 'object',
      properties: {
        selector: { type: 'string', description: '输入框选择器或可访问名称' },
        value: { type: 'string', description: '要填写的文本' },
      },
      required: ['selector', 'value'],
      additionalProperties: false,
    },
    shouldDefer: true,
    searchHint: 'browser fill form input text',
    isConcurrencySafe: false,
    isReadOnly: false,
    execute: async ({ selector, value }: { selector: string; value: string }) =>
      JSON.stringify({
        selector,
        filled: true,
        valueLength: value.length,
      }),
  },
  {
    name: 'mcp__browser__get_text',
    description: '[MCP:browser] 读取页面文本',
    parameters: {
      type: 'object',
      properties: {
        selector: { type: 'string', description: '可选的页面元素选择器' },
      },
      required: [],
      additionalProperties: false,
    },
    shouldDefer: true,
    searchHint: 'browser get text content page',
    isConcurrencySafe: true,
    isReadOnly: true,
    execute: async ({ selector = 'body' }: { selector?: string }) =>
      JSON.stringify({
        selector,
        text: `Mock text content from ${selector}`,
      }),
  },
  {
    name: 'mcp__supabase__query',
    description: '[MCP:supabase] 执行 Supabase SQL 查询',
    parameters: {
      type: 'object',
      properties: {
        sql: { type: 'string', description: '只读 SQL 查询语句' },
      },
      required: ['sql'],
      additionalProperties: false,
    },
    shouldDefer: true,
    searchHint: 'supabase query sql database',
    isConcurrencySafe: true,
    isReadOnly: true,
    execute: async ({ sql }: { sql: string }) =>
      JSON.stringify({
        sql,
        rows: [
          { id: 1, name: 'Mock row 1', status: 'active' },
          { id: 2, name: 'Mock row 2', status: 'archived' },
        ],
        rowCount: 2,
      }),
  },
  {
    name: 'mcp__supabase__list_tables',
    description: '[MCP:supabase] 列出 Supabase 数据表',
    parameters: {
      type: 'object',
      properties: {
        schema: { type: 'string', description: '数据库 schema，默认 public' },
      },
      required: [],
      additionalProperties: false,
    },
    shouldDefer: true,
    searchHint: 'supabase list tables schema database',
    isConcurrencySafe: true,
    isReadOnly: true,
    execute: async ({ schema = 'public' }: { schema?: string }) =>
      JSON.stringify([
        { schema, name: 'users', columns: 5 },
        { schema, name: 'projects', columns: 7 },
        { schema, name: 'tasks', columns: 8 },
      ]),
  },
  {
    name: 'mcp__supabase__describe_table',
    description: '[MCP:supabase] 查看 Supabase 数据表结构',
    parameters: {
      type: 'object',
      properties: {
        table: { type: 'string', description: '表名' },
        schema: { type: 'string', description: '数据库 schema，默认 public' },
      },
      required: ['table'],
      additionalProperties: false,
    },
    shouldDefer: true,
    searchHint: 'supabase describe table columns schema',
    isConcurrencySafe: true,
    isReadOnly: true,
    execute: async ({ table, schema = 'public' }: { table: string; schema?: string }) =>
      JSON.stringify({
        schema,
        table,
        columns: [
          { name: 'id', type: 'uuid', nullable: false, primaryKey: true },
          { name: 'name', type: 'text', nullable: false },
          { name: 'created_at', type: 'timestamptz', nullable: false },
          { name: 'updated_at', type: 'timestamptz', nullable: true },
        ],
      }),
  },
];

export function registerSimulatedTools(registry?: ToolRegistry): ToolDefinition[] {
  if (registry) {
    registry.register(...simulatedTools);
  }

  return simulatedTools;
}
