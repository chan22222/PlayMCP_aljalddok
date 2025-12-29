import type { VercelRequest, VercelResponse } from '@vercel/node';

// MCP Protocol Version
const PROTOCOL_VERSION = "2024-11-05";

// MCP Tool Definitions
const TOOLS = [
  {
    name: "SearchPlaceByKeyword",
    description: "키워드로 맛집, 카페, 장소를 검색합니다. (예: '강남역 맛집', '홍대 카페')",
    inputSchema: {
      type: "object",
      properties: {
        keyword: {
          type: "string",
          description: "검색 키워드 (예: '강남역 맛집')"
        },
        region: {
          type: "string",
          description: "검색 지역 (선택사항)"
        }
      },
      required: ["keyword"]
    }
  },
  {
    name: "AddSchedule",
    description: "일정을 캘린더에 추가합니다.",
    inputSchema: {
      type: "object",
      properties: {
        title: {
          type: "string",
          description: "일정 제목"
        },
        datetime: {
          type: "string",
          description: "일정 날짜/시간 (예: '2025-01-15 14:00')"
        },
        location: {
          type: "string",
          description: "장소 (선택사항)"
        }
      },
      required: ["title", "datetime"]
    }
  },
  {
    name: "SummarizeChat",
    description: "채팅 내용을 요약하고 일정, 할 일, 링크를 추출합니다.",
    inputSchema: {
      type: "object",
      properties: {
        chatContent: {
          type: "string",
          description: "요약할 채팅 내용"
        }
      },
      required: ["chatContent"]
    }
  }
];

// Handle tool execution
async function executeTool(name: string, args: Record<string, unknown>): Promise<unknown> {
  switch (name) {
    case "SearchPlaceByKeyword": {
      const keyword = args.keyword as string;
      // Mock response - in production, call actual API
      return {
        content: [
          {
            type: "text",
            text: `"${keyword}" 검색 결과:\n\n` +
              `1. 스타벅스 강남R점 - 카페\n` +
              `   주소: 서울 강남구 강남대로 390\n` +
              `   평점: 4.2\n\n` +
              `2. 갓덴스시 강남점 - 초밥\n` +
              `   주소: 서울 강남구 테헤란로 123\n` +
              `   평점: 4.5\n\n` +
              `3. 땀땀 - 베트남음식\n` +
              `   주소: 서울 강남구 역삼로 45\n` +
              `   평점: 4.3`
          }
        ]
      };
    }

    case "AddSchedule": {
      const { title, datetime, location } = args as { title: string; datetime: string; location?: string };
      return {
        content: [
          {
            type: "text",
            text: `일정이 등록되었습니다!\n\n` +
              `- 제목: ${title}\n` +
              `- 일시: ${datetime}\n` +
              `- 장소: ${location || '미정'}`
          }
        ]
      };
    }

    case "SummarizeChat": {
      const chatContent = args.chatContent as string;
      return {
        content: [
          {
            type: "text",
            text: `채팅 요약:\n\n` +
              `📝 요약: ${chatContent.slice(0, 100)}...\n\n` +
              `📅 감지된 일정: 없음\n` +
              `✅ 할 일: 없음\n` +
              `🔗 공유된 링크: 없음`
          }
        ]
      };
    }

    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}

// Process JSON-RPC request
async function processRequest(request: { jsonrpc: string; id?: string | number; method: string; params?: unknown }): Promise<unknown> {
  const { method, params, id } = request;

  switch (method) {
    case "initialize":
      return {
        jsonrpc: "2.0",
        id,
        result: {
          protocolVersion: PROTOCOL_VERSION,
          capabilities: {
            tools: {}
          },
          serverInfo: {
            name: "aljalddok",
            version: "1.0.0"
          }
        }
      };

    case "tools/list":
      return {
        jsonrpc: "2.0",
        id,
        result: { tools: TOOLS }
      };

    case "tools/call": {
      const { name, arguments: args } = params as { name: string; arguments: Record<string, unknown> };
      const result = await executeTool(name, args || {});
      return {
        jsonrpc: "2.0",
        id,
        result
      };
    }

    case "notifications/initialized":
      // Notification - no response needed
      return null;

    case "ping":
      return {
        jsonrpc: "2.0",
        id,
        result: {}
      };

    default:
      return {
        jsonrpc: "2.0",
        id,
        error: {
          code: -32601,
          message: `Method not found: ${method}`
        }
      };
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, Accept, Mcp-Session-Id');
  res.setHeader('Access-Control-Expose-Headers', 'Mcp-Session-Id');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // GET request - return server info (for health check / discovery)
  if (req.method === 'GET') {
    res.setHeader('Content-Type', 'application/json');
    return res.status(200).json({
      name: "aljalddok",
      version: "1.0.0",
      protocolVersion: PROTOCOL_VERSION,
      description: "AI비서 알잘똑 - 알아서 잘 딱 깔끔하게 도와주는 MCP 서버",
      capabilities: {
        tools: {}
      },
      tools: TOOLS.map(t => ({ name: t.name, description: t.description }))
    });
  }

  // DELETE request - session termination
  if (req.method === 'DELETE') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Set content type for JSON-RPC response
    res.setHeader('Content-Type', 'application/json');

    const request = req.body;

    // Handle batch requests
    if (Array.isArray(request)) {
      const results = await Promise.all(request.map(r => processRequest(r)));
      // Filter out null responses (notifications)
      const filteredResults = results.filter(r => r !== null);
      if (filteredResults.length === 0) {
        return res.status(202).end();
      }
      return res.status(200).json(filteredResults);
    }

    // Handle single request
    const result = await processRequest(request);

    // Notifications don't get responses
    if (result === null) {
      return res.status(202).end();
    }

    return res.status(200).json(result);

  } catch (error) {
    console.error('MCP Error:', error);
    return res.status(500).json({
      jsonrpc: "2.0",
      error: {
        code: -32603,
        message: error instanceof Error ? error.message : 'Internal error'
      }
    });
  }
}
