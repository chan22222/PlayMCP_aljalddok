import { GoogleGenAI, Type, Schema, FunctionDeclaration } from "@google/genai";
import { Message, MCPAnalysisResult, ToolCall } from "../types";

// Initialize Gemini Client
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// --- MCP Analysis Schema (Existing) ---
const ANALYSIS_SCHEMA: Schema = {
  type: Type.OBJECT,
  properties: {
    summary: { type: Type.STRING },
    schedules: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          date: { type: Type.STRING },
          location: { type: Type.STRING },
          confidence: { type: Type.NUMBER }
        }
      }
    },
    todos: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          task: { type: Type.STRING },
          assignee: { type: Type.STRING },
          deadline: { type: Type.STRING }
        }
      }
    },
    links: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          url: { type: Type.STRING },
          description: { type: Type.STRING }
        }
      }
    },
    intent: {
      type: Type.STRING,
      enum: ['general', 'scheduling', 'question', 'task_assignment']
    }
  },
  required: ["summary", "schedules", "todos", "links", "intent"]
};

// --- Tool Definitions for AI Chat ---
const searchPlaceTool: FunctionDeclaration = {
  name: "SearchPlaceByKeywordOpen",
  description: "Search for places like restaurants, cafes, or locations using a keyword.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      keyword: { type: Type.STRING, description: "The search keyword (e.g. 'Gangnam Station restaurants')" },
      highlightedRegion: { type: Type.STRING, description: "The region to focus on" }
    },
    required: ["keyword"]
  }
};

const addScheduleTool: FunctionDeclaration = {
  name: "AddSchedule",
  description: "Extract and add a schedule/appointment to the calendar.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      title: { type: Type.STRING },
      datetime: { type: Type.STRING },
      location: { type: Type.STRING }
    },
    required: ["title", "datetime"]
  }
};

export const analyzeChatContext = async (messages: Message[]): Promise<MCPAnalysisResult> => {
  try {
    const chatText = messages.map(m => `[${m.sender} (${m.timestamp})]: ${m.text}`).join('\n');
    
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `You are an AI assistant integrated into a chat application (MCP). 
      Analyze the following chat history.
      Chat History:
      ${chatText}`,
      config: {
        responseMimeType: "application/json",
        responseSchema: ANALYSIS_SCHEMA,
        systemInstruction: "You are a helpful assistant. Output must be valid JSON matching the schema."
      }
    });

    if (response.text) {
      return JSON.parse(response.text) as MCPAnalysisResult;
    }
    throw new Error("No response text from Gemini");

  } catch (error) {
    console.error("MCP Analysis Failed:", error);
    return {
      summary: "분석에 실패했습니다.",
      schedules: [],
      todos: [],
      links: [],
      intent: 'general'
    };
  }
};

export const chatWithAI = async (query: string, context: Message[]): Promise<{ text: string, toolCalls?: ToolCall[] }> => {
    try {
        // Construct history for context
        // We only take the last few turns to save tokens and keep context relevant
        const recentMessages = context.slice(-10).map(m => ({
             role: m.sender === '나' ? 'user' : 'model',
             parts: [{ text: m.text }]
        }));

        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: [
                ...recentMessages,
                { role: 'user', parts: [{ text: query }] }
            ],
            config: {
                tools: [{ functionDeclarations: [searchPlaceTool, addScheduleTool] }],
                systemInstruction: `You are a KakaoTalk AI Assistant (MCP). 
                If the user asks for information (places, weather, etc.), USE THE TOOLS.
                If the user mentions an appointment or schedule, USE THE TOOLS to save it.
                Keep responses concise and friendly in Korean.
                If you use a tool, you don't need to describe what you are doing in text, just call the tool.
                After the tool call, provide a helpful summary or list of results based on the "mock" data you assume exists.`
            }
        });

        const toolCalls: ToolCall[] = [];
        let finalText = response.text || "";

        // Process Function Calls
        // Note: In a real app, we would execute these against a backend and send the result back to Gemini.
        // For this frontend demo, we extract them to display the "Request" UI, 
        // and we append "Mock Results" to the text so the UI looks complete.
        
        const candidates = response.candidates;
        if (candidates && candidates[0]?.content?.parts) {
            for (const part of candidates[0].content.parts) {
                if (part.functionCall) {
                    const fc = part.functionCall;
                    toolCalls.push({
                        id: Math.random().toString(36).substr(2, 9),
                        name: fc.name,
                        args: fc.args,
                        status: 'success' // Simulating immediate success
                    });

                    // Append simulated text content based on tool for the demo
                    if (fc.name === 'SearchPlaceByKeywordOpen') {
                         finalText += `\n\n${fc.args['keyword']} 검색 결과입니다:\n` +
                         `1. <a href="#" class="text-blue-500 hover:underline">스타벅스 강남R점</a> (카페)\n` +
                         `2. <a href="#" class="text-blue-500 hover:underline">갓덴스시 강남점</a> (초밥)\n` +
                         `3. <a href="#" class="text-blue-500 hover:underline">땀땀</a> (베트남음식)\n` +
                         `즐거운 시간 보내세요!`;
                    } else if (fc.name === 'AddSchedule') {
                        finalText += `\n\n일정을 등록했습니다:\n` +
                        `- 제목: ${fc.args['title']}\n` +
                        `- 일시: ${fc.args['datetime']}\n` +
                        `- 장소: ${fc.args['location'] || '미정'}`;
                    }
                }
            }
        }

        return {
            text: finalText.trim(),
            toolCalls: toolCalls.length > 0 ? toolCalls : undefined
        };

    } catch (e) {
        console.error("AI Chat Error", e);
        return { text: "죄송합니다. 오류가 발생했습니다." };
    }
}
