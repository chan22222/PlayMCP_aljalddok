import React, { useState, useRef, useEffect } from 'react';
import { ChatRoom, Message, UserType, ToolCall } from '../types';
import { Send, Menu, Search, Bot, ChevronDown, ChevronUp, Copy, CheckCircle } from 'lucide-react';
import { chatWithAI } from '../services/geminiService';

interface ChatWindowProps {
  chat: ChatRoom;
  onSendMessage: (text: string) => void;
  onAnalyze: () => void;
  isAnalyzing: boolean;
  onAIResponse?: (response: { text: string, toolCalls?: ToolCall[] }) => void;
}

const ToolCodeBlock: React.FC<{ tool: ToolCall }> = ({ tool }) => {
    const [isOpen, setIsOpen] = useState(true);

    return (
        <div className="border border-gray-200 rounded-lg overflow-hidden mb-4 bg-white shadow-sm">
            <div className="bg-gray-50 px-3 py-2 flex justify-between items-center border-b border-gray-100">
                <div className="flex items-center gap-2">
                    <strong className="text-xs font-bold text-gray-700">{tool.name}</strong>
                    <span className="text-[10px] bg-yellow-100 text-yellow-700 px-1.5 py-0.5 rounded">카카오맵</span>
                    <span className="flex items-center gap-1 text-[10px] text-green-600 font-medium">
                        <CheckCircle size={10} /> 성공
                    </span>
                </div>
                <button 
                    onClick={() => setIsOpen(!isOpen)} 
                    className="text-gray-400 hover:text-gray-600 p-1"
                >
                    {isOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                </button>
            </div>
            
            {isOpen && (
                <div className="p-0">
                    <div className="flex border-b border-gray-100">
                        <button className="px-3 py-1.5 text-xs font-medium text-gray-900 border-b-2 border-gray-900">Request</button>
                        <button className="px-3 py-1.5 text-xs font-medium text-gray-400 hover:text-gray-600">Response</button>
                    </div>
                    <div className="p-3 bg-slate-50 relative group">
                        <pre className="text-xs font-mono text-gray-600 whitespace-pre-wrap break-all">
                            {JSON.stringify({
                                method: "tools/call",
                                params: {
                                    name: tool.name,
                                    arguments: tool.args
                                }
                            }, null, 2)}
                        </pre>
                        <button className="absolute top-2 right-2 text-gray-400 opacity-0 group-hover:opacity-100 hover:text-gray-600">
                            <Copy size={12} />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

const FeedMessage: React.FC<{ message: Message }> = ({ message }) => {
    // Only AI messages have the "Answer" style with tools
    if (message.type === UserType.AI) {
        return (
            <div className="mb-8">
                <div className="bg-white rounded-lg overflow-hidden">
                   {/* Tool Calls Section */}
                   {message.toolCalls && message.toolCalls.length > 0 && (
                        <div className="mb-2">
                             <div className="flex items-center justify-between mb-2">
                                <strong className="text-xs font-bold text-indigo-600 uppercase tracking-wider">TOOL 호출</strong>
                             </div>
                             {message.toolCalls.map((tool) => (
                                 <ToolCodeBlock key={tool.id} tool={tool} />
                             ))}
                        </div>
                   )}
                   
                   {/* Text Content */}
                   {message.text && (
                        <div 
                            className="text-sm text-gray-800 leading-relaxed space-y-2"
                            dangerouslySetInnerHTML={{ __html: message.text.replace(/\n/g, '<br/>') }}
                        />
                   )}
                </div>
            </div>
        );
    }

    // User Messages in Feed Style
    return (
        <div className="mb-6">
            <div className="flex items-center gap-2 mb-2">
                 <strong className="text-sm font-bold text-gray-900">내 질문</strong>
                 <span className="text-xs text-gray-400">{message.timestamp}</span>
            </div>
            <div className="text-lg font-medium text-gray-800">
                {message.text}
            </div>
        </div>
    );
};

const StandardMessage: React.FC<{ message: Message }> = ({ message }) => (
    <div className={`flex items-end gap-2 ${message.type === UserType.ME ? 'flex-row-reverse' : 'flex-row'}`}>
        {message.type !== UserType.ME && (
            message.avatar ? (
                <img src={message.avatar} alt={message.sender} className="w-10 h-10 rounded-xl bg-gray-300 object-cover" />
            ) : (
                <div className="w-10 h-10 rounded-xl bg-gray-300 flex items-center justify-center text-gray-500 font-bold text-xs">
                    {message.sender[0]}
                </div>
            )
        )}
        
        <div className={`flex flex-col max-w-[70%] ${message.type === UserType.ME ? 'items-end' : 'items-start'}`}>
            {message.type !== UserType.ME && (
            <span className="text-xs text-gray-600 mb-1 ml-1">{message.sender}</span>
            )}
            <div
            className={`px-4 py-2 rounded-2xl shadow-sm text-sm whitespace-pre-wrap leading-relaxed ${
                message.type === UserType.ME
                ? 'bg-[#FEE500] text-gray-900 rounded-tr-none' // Kakao Yellow
                : 'bg-white text-gray-900 rounded-tl-none'
            }`}
            >
            {message.text}
            </div>
        </div>
        <span className="text-[10px] text-gray-500 mb-1">
            {message.timestamp.split(' ')[1]}
        </span>
    </div>
);

const ChatWindow: React.FC<ChatWindowProps> = ({ chat, onSendMessage, onAnalyze, isAnalyzing, onAIResponse }) => {
  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [isTyping, setIsTyping] = useState(false);
  const isFeedMode = chat.type === 'direct'; // AI Chat uses Feed Mode

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chat.messages, isTyping]);

  const handleSend = async () => {
    if (!inputValue.trim()) return;
    
    const text = inputValue;
    setInputValue('');
    onSendMessage(text);

    // AI Logic for Direct Chat
    if (chat.type === 'direct' && onAIResponse) {
        setIsTyping(true);
        try {
            const response = await chatWithAI(text, chat.messages);
            onAIResponse(response);
        } catch (e) {
            console.error(e);
        } finally {
            setIsTyping(false);
        }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className={`flex-1 flex flex-col h-full ${isFeedMode ? 'bg-white' : 'bg-[#abc1d1]'}`}> 
      {/* Header */}
      <div className="h-16 bg-white/90 backdrop-blur-md border-b border-gray-200 flex items-center justify-between px-4 shadow-sm z-10 sticky top-0">
        <div className="flex items-center gap-3">
          <h2 className="font-bold text-gray-800 text-lg">{chat.name}</h2>
          <span className="text-gray-500 text-sm flex items-center gap-1">
             {!isFeedMode && <span className="w-2 h-2 rounded-full bg-green-500"></span>}
             {chat.type === 'group' && chat.participants}
          </span>
        </div>
        <div className="flex items-center gap-3">
            {isFeedMode ? (
                // Feed Mode Header Actions
                 <span className="px-2 py-1 bg-gray-100 text-xs text-gray-500 rounded font-mono">MCP ACTIVATED</span>
            ) : (
                // Standard Chat Header Actions
                <>
                <button className="p-2 text-gray-600 hover:bg-gray-100 rounded-full">
                    <Search size={20} />
                </button>
                <button 
                    onClick={onAnalyze}
                    disabled={isAnalyzing}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-all shadow-sm ${
                        isAnalyzing 
                        ? 'bg-gray-100 text-gray-400' 
                        : 'bg-indigo-600 text-white hover:bg-indigo-700'
                    }`}
                >
                    <Bot size={16} />
                    {isAnalyzing ? '분석 중...' : 'MCP 분석'}
                </button>
                </>
            )}
            <button className="p-2 text-gray-600 hover:bg-gray-100 rounded-full md:hidden">
                <Menu size={20} />
            </button>
        </div>
      </div>

      {/* Messages */}
      <div className={`flex-1 overflow-y-auto p-4 ${isFeedMode ? 'bg-white' : 'space-y-4'}`}>
        {isFeedMode ? (
            // Feed Layout Container
            <div className="max-w-2xl mx-auto py-6">
                {chat.messages.map((msg) => (
                    <FeedMessage key={msg.id} message={msg} />
                ))}
                {isTyping && (
                    <div className="flex space-x-1 pl-1">
                        <div className="w-2 h-2 bg-gray-300 rounded-full animate-bounce delay-0"></div>
                        <div className="w-2 h-2 bg-gray-300 rounded-full animate-bounce delay-150"></div>
                        <div className="w-2 h-2 bg-gray-300 rounded-full animate-bounce delay-300"></div>
                    </div>
                )}
            </div>
        ) : (
            // Standard Chat Layout
            chat.messages.map((msg) => (
                <StandardMessage key={msg.id} message={msg} />
            ))
        )}
        {!isFeedMode && isTyping && (
             <div className="flex items-end gap-2">
                <div className="w-10 h-10 rounded-xl bg-gray-300 flex items-center justify-center">
                    <Bot size={20} className="text-gray-500"/>
                </div>
                <div className="bg-white px-4 py-3 rounded-2xl rounded-tl-none shadow-sm">
                    <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-0"></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-150"></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-300"></div>
                    </div>
                </div>
             </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className={`bg-white p-3 border-t border-gray-200 ${isFeedMode ? 'max-w-2xl mx-auto w-full' : ''}`}>
        <div className="flex items-end gap-2 bg-gray-50 p-2 rounded-2xl border border-gray-200 focus-within:border-gray-400 focus-within:ring-1 focus-within:ring-gray-300 transition-all">
          <textarea
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={isFeedMode ? "AI 비서에게 요청하세요 (예: 강남역 맛집 찾아줘)" : "메시지를 입력하세요"}
            className="flex-1 bg-transparent border-none resize-none focus:ring-0 text-sm max-h-32 min-h-[24px] py-2 px-2"
            rows={1}
            style={{ height: 'auto', minHeight: '40px' }} 
          />
          <button
            onClick={handleSend}
            disabled={!inputValue.trim()}
            className={`p-2 rounded-full mb-1 transition-colors ${
              inputValue.trim()
                ? 'bg-[#FEE500] text-black hover:bg-[#ebd500]'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }`}
          >
            <Send size={18} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatWindow;