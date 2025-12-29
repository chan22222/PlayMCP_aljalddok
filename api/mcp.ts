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
  },
  {
    name: "SplitBill",
    description: "더치페이 계산기. 참여자들과 총 금액을 입력하면 1/N 계산해줍니다. '나'는 항상 포함됩니다. (예: '철수, 영희랑 5만원' -> 나 포함 3명)",
    inputSchema: {
      type: "object",
      properties: {
        participants: {
          type: "array",
          items: { type: "string" },
          description: "나를 제외한 참여자 이름 목록. 나는 자동 포함됨 (예: ['철수', '영희'])"
        },
        totalAmount: {
          type: "number",
          description: "총 금액 (원)"
        },
        place: {
          type: "string",
          description: "장소/가게 이름 (선택사항)"
        }
      },
      required: ["participants", "totalAmount"]
    }
  },
  {
    name: "GetWeather",
    description: "현재 날씨 정보를 조회합니다. (예: '서울 날씨', '오늘 날씨 어때?')",
    inputSchema: {
      type: "object",
      properties: {
        location: {
          type: "string",
          description: "지역명 (예: '서울', '강남', '부산')"
        }
      },
      required: ["location"]
    }
  },
  {
    name: "SaveLink",
    description: "링크를 저장합니다. 대화에서 공유된 URL을 메모와 함께 저장해요. (예: '이 링크 저장해줘', 'URL 북마크해줘')",
    inputSchema: {
      type: "object",
      properties: {
        url: {
          type: "string",
          description: "저장할 URL"
        },
        title: {
          type: "string",
          description: "링크 제목 (선택사항)"
        },
        memo: {
          type: "string",
          description: "메모 (선택사항)"
        },
        category: {
          type: "string",
          description: "카테고리 (예: '맛집', '쇼핑', '뉴스', '업무')"
        }
      },
      required: ["url"]
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
            text: `🔍 **"${keyword}" 검색 결과**\n\n` +
              `**1. 스타벅스 강남R점** ☕\n` +
              `   📍 서울 강남구 강남대로 390\n` +
              `   ⭐ 4.2\n\n` +
              `**2. 갓덴스시 강남점** 🍣\n` +
              `   📍 서울 강남구 테헤란로 123\n` +
              `   ⭐ 4.5\n\n` +
              `**3. 땀땀** 🍜\n` +
              `   📍 서울 강남구 역삼로 45\n` +
              `   ⭐ 4.3`
          }
        ]
      };
    }

    case "AddSchedule": {
      const { title, datetime, location } = args as { title: string; datetime: string; location?: string };
      // datetime 파싱해서 보기좋게 포맷
      const dateObj = new Date(datetime.replace(' ', 'T'));
      const dateStr = dateObj.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'short' });
      const timeStr = dateObj.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', hour12: true });

      return {
        content: [
          {
            type: "text",
            text: `📅 **${title}**\n\n` +
              `🗓 ${dateStr}\n` +
              `⏰ ${timeStr}\n` +
              (location ? `📍 ${location}` : '')
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
            text: `📋 **채팅 요약**\n\n` +
              `${chatContent.slice(0, 150)}${chatContent.length > 150 ? '...' : ''}\n\n` +
              `---\n` +
              `📅 감지된 일정: 없음\n` +
              `✅ 할 일: 없음\n` +
              `🔗 공유된 링크: 없음`
          }
        ]
      };
    }

    case "SplitBill": {
      const { participants, totalAmount, place } = args as {
        participants: string[];
        totalAmount: number;
        place?: string
      };

      // 나를 포함한 전체 참여자
      const allParticipants = ['나', ...participants];
      const count = allParticipants.length;
      const perPerson = Math.ceil(totalAmount / count);
      const remainder = (perPerson * count) - totalAmount;

      // 금액 포맷팅
      const formatMoney = (n: number) => n.toLocaleString('ko-KR');

      let text = `💸 **더치페이 계산**\n\n`;
      if (place) {
        text += `🏪 ${place}\n`;
      }
      text += `💰 총 금액: **${formatMoney(totalAmount)}원**\n`;
      text += `👥 ${count}명 (나 포함)\n\n`;
      text += `---\n\n`;
      text += `**1인당 ${formatMoney(perPerson)}원**\n\n`;

      allParticipants.forEach((name) => {
        text += `• ${name}: ${formatMoney(perPerson)}원\n`;
      });

      if (remainder > 0) {
        text += `\n💡 ${formatMoney(remainder)}원은 누군가 덜 내면 딱 맞아요!`;
      }

      return {
        content: [{ type: "text", text }]
      };
    }

    case "GetWeather": {
      const { location } = args as { location: string };

      // Mock 날씨 데이터 (실제로는 API 연동 필요)
      const weatherData = [
        { condition: '맑음', icon: '☀️', temp: 3, feel: -2 },
        { condition: '흐림', icon: '☁️', temp: 1, feel: -4 },
        { condition: '눈', icon: '🌨️', temp: -3, feel: -8 },
        { condition: '비', icon: '🌧️', temp: 5, feel: 1 },
      ];
      const weather = weatherData[Math.floor(Math.random() * weatherData.length)];

      return {
        content: [{
          type: "text",
          text: `${weather.icon} **${location} 날씨**\n\n` +
            `🌡️ 현재 기온: ${weather.temp}°C\n` +
            `🤒 체감 온도: ${weather.feel}°C\n` +
            `📝 ${weather.condition}\n\n` +
            `---\n` +
            `오늘 하루도 좋은 하루 되세요!`
        }]
      };
    }

    case "SaveLink": {
      const { url, title, memo, category } = args as {
        url: string;
        title?: string;
        memo?: string;
        category?: string;
      };

      // URL에서 도메인 추출
      let domain = '';
      try {
        domain = new URL(url).hostname.replace('www.', '');
      } catch {
        domain = url;
      }

      // 카테고리별 아이콘
      const categoryIcons: Record<string, string> = {
        '맛집': '🍽️',
        '쇼핑': '🛒',
        '뉴스': '📰',
        '업무': '💼',
        '여행': '✈️',
        '영상': '🎬',
      };
      const icon = category ? (categoryIcons[category] || '🔖') : '🔖';

      let text = `${icon} **링크 저장 완료!**\n\n`;
      if (title) {
        text += `📌 ${title}\n`;
      }
      text += `🔗 ${url}\n`;
      text += `🌐 ${domain}\n`;
      if (category) {
        text += `📁 ${category}\n`;
      }
      if (memo) {
        text += `\n💬 "${memo}"`;
      }

      return {
        content: [{ type: "text", text }]
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
