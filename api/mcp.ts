import type { VercelRequest, VercelResponse } from '@vercel/node';

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

// MCP Server Info
const SERVER_INFO = {
  name: "aljalddok",
  version: "1.0.0",
  protocolVersion: "2024-11-05",
  capabilities: {
    tools: {}
  }
};

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
function processRequest(request: { jsonrpc: string; id?: string | number; method: string; params?: unknown }) {
  const { method, params, id } = request;

  switch (method) {
    case "initialize":
      return {
        jsonrpc: "2.0",
        id,
        result: SERVER_INFO
      };

    case "tools/list":
      return {
        jsonrpc: "2.0",
        id,
        result: { tools: TOOLS }
      };

    case "tools/call": {
      const { name, arguments: args } = params as { name: string; arguments: Record<string, unknown> };
      return executeTool(name, args || {}).then(result => ({
        jsonrpc: "2.0",
        id,
        result
      }));
    }

    case "notifications/initialized":
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
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'GET') {
    // Return server info for health check
    return res.status(200).json({
      name: SERVER_INFO.name,
      version: SERVER_INFO.version,
      description: "AI비서 알잘똑 - 알아서 잘 딱 깔끔하게 도와주는 MCP 서버",
      tools: TOOLS.map(t => ({ name: t.name, description: t.description }))
    });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const request = req.body;

    // Handle batch requests
    if (Array.isArray(request)) {
      const results = await Promise.all(request.map(r => processRequest(r)));
      return res.status(200).json(results);
    }

    // Handle single request
    const result = await processRequest(request);
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
