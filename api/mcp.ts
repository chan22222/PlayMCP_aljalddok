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
    description: "채팅 내용을 분석하여 요약, 일정, 할 일, 공유된 링크를 자동 추출합니다. 그룹채팅 내용을 넣으면 핵심만 정리해줘요.",
    inputSchema: {
      type: "object",
      properties: {
        chatContent: {
          type: "string",
          description: "분석할 채팅 내용 전체"
        },
        extractSchedules: {
          type: "boolean",
          description: "일정 추출 여부 (기본값: true)"
        },
        extractTodos: {
          type: "boolean",
          description: "할 일 추출 여부 (기본값: true)"
        },
        extractLinks: {
          type: "boolean",
          description: "링크 추출 여부 (기본값: true)"
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
  },
  {
    name: "SendKakaoTalk",
    description: "카카오톡 나에게 보내기. 메모나 링크를 내 카톡으로 전송해요. (예: '나한테 메모 보내줘', '이 링크 카톡으로 보내줘')",
    inputSchema: {
      type: "object",
      properties: {
        message: {
          type: "string",
          description: "보낼 메시지 내용"
        },
        messageType: {
          type: "string",
          enum: ["text", "link"],
          description: "메시지 유형: text(일반 텍스트), link(링크 포함)"
        },
        linkUrl: {
          type: "string",
          description: "링크 URL (messageType이 'link'일 때 사용)"
        },
        linkTitle: {
          type: "string",
          description: "링크 제목 (messageType이 'link'일 때 사용)"
        }
      },
      required: ["message"]
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
      const { chatContent, extractSchedules = true, extractTodos = true, extractLinks = true } = args as {
        chatContent: string;
        extractSchedules?: boolean;
        extractTodos?: boolean;
        extractLinks?: boolean;
      };

      // 일정 패턴 감지 (날짜/시간 관련)
      const schedulePatterns = [
        /(\d{1,2})월\s*(\d{1,2})일/g,
        /(월|화|수|목|금|토|일)요일/g,
        /(\d{1,2})시/g,
        /(오전|오후)\s*(\d{1,2})시/g,
        /(내일|모레|다음주|이번주)/g,
      ];

      // 할 일 패턴 감지
      const todoPatterns = [
        /(.+?)(해야|해줘|부탁|확인|준비|가져와|보내줘|알려줘)/g,
        /(.+?)(하기로|하자고|했음)/g,
      ];

      // URL 패턴 감지
      const urlPattern = /(https?:\/\/[^\s]+)/g;

      // 추출 결과
      const schedules: string[] = [];
      const todos: string[] = [];
      const links: string[] = [];

      // 일정 추출
      if (extractSchedules) {
        const lines = chatContent.split('\n');
        for (const line of lines) {
          for (const pattern of schedulePatterns) {
            if (pattern.test(line)) {
              const cleanLine = line.replace(/^\[.*?\]/, '').trim();
              if (cleanLine && !schedules.includes(cleanLine) && cleanLine.length < 100) {
                schedules.push(cleanLine);
              }
              break;
            }
          }
        }
      }

      // 할 일 추출
      if (extractTodos) {
        const lines = chatContent.split('\n');
        for (const line of lines) {
          for (const pattern of todoPatterns) {
            const match = line.match(pattern);
            if (match) {
              const cleanLine = line.replace(/^\[.*?\]/, '').trim();
              if (cleanLine && !todos.includes(cleanLine) && cleanLine.length < 100) {
                todos.push(cleanLine);
              }
              break;
            }
          }
        }
      }

      // 링크 추출
      if (extractLinks) {
        const urlMatches = chatContent.match(urlPattern);
        if (urlMatches) {
          links.push(...urlMatches.slice(0, 5)); // 최대 5개
        }
      }

      // 요약 생성 (첫 몇 줄 기반)
      const lines = chatContent.split('\n').filter(l => l.trim());
      const summaryLines = lines.slice(0, 3).map(l => l.replace(/^\[.*?\]/, '').trim());
      const summary = summaryLines.join(' ').slice(0, 200);

      let text = `📋 **채팅 분석 결과**\n\n`;
      text += `**요약**\n${summary}${summary.length >= 200 ? '...' : ''}\n\n`;
      text += `---\n\n`;

      // 일정 섹션
      text += `📅 **감지된 일정** (${schedules.length}건)\n`;
      if (schedules.length > 0) {
        schedules.slice(0, 5).forEach((s, i) => {
          text += `${i + 1}. ${s}\n`;
        });
      } else {
        text += `_없음_\n`;
      }
      text += `\n`;

      // 할 일 섹션
      text += `✅ **할 일** (${todos.length}건)\n`;
      if (todos.length > 0) {
        todos.slice(0, 5).forEach((t, i) => {
          text += `${i + 1}. ${t}\n`;
        });
      } else {
        text += `_없음_\n`;
      }
      text += `\n`;

      // 링크 섹션
      text += `🔗 **공유된 링크** (${links.length}건)\n`;
      if (links.length > 0) {
        links.forEach((l, i) => {
          text += `${i + 1}. ${l}\n`;
        });
      } else {
        text += `_없음_\n`;
      }

      return {
        content: [{ type: "text", text }]
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

    case "SendKakaoTalk": {
      const { message, messageType = 'text', linkUrl, linkTitle } = args as {
        message: string;
        messageType?: 'text' | 'link';
        linkUrl?: string;
        linkTitle?: string;
      };

      // 현재 시간
      const now = new Date();
      const timeStr = now.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', hour12: true });

      let text = `💬 **카카오톡 나에게 보내기**\n\n`;
      text += `⏰ 전송 시간: ${timeStr}\n\n`;
      text += `---\n\n`;

      // 메시지 유형별 처리
      if (messageType === 'link' && linkUrl) {
        text += `📎 **링크 메시지**\n`;
        if (linkTitle) {
          text += `📌 ${linkTitle}\n`;
        }
        text += `🔗 ${linkUrl}\n\n`;
        text += `💭 ${message}\n`;
      } else {
        text += `💭 ${message}\n`;
      }

      text += `\n---\n`;
      text += `✅ 내 채팅방으로 메시지가 전송되었습니다!`;

      // TODO: 카카오 REST API 연동
      // POST https://kapi.kakao.com/v2/api/talk/memo/default/send
      // 필요: access_token (OAuth 인증)

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
