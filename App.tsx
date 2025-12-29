import React, { useState, useCallback, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import ChatWindow from './components/ChatWindow';
import MCPPanel from './components/MCPPanel';
import { INITIAL_CHATS } from './constants';
import { ChatRoom, Message, UserType, MCPAnalysisResult, ToolCall } from './types';
import { analyzeChatContext } from './services/geminiService';

const App: React.FC = () => {
  const [chats, setChats] = useState<ChatRoom[]>(INITIAL_CHATS);
  const [activeChatId, setActiveChatId] = useState<string>(INITIAL_CHATS[0].id);
  
  // Stores MCP analysis results per chat
  const [mcpData, setMcpData] = useState<Record<string, MCPAnalysisResult>>({});
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const activeChat = chats.find((c) => c.id === activeChatId)!;

  const handleSendMessage = async (text: string) => {
    const newMessage: Message = {
      id: Date.now().toString(),
      sender: '나',
      text,
      timestamp: new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }),
      type: UserType.ME,
    };

    setChats((prev) =>
      prev.map((c) => {
        if (c.id === activeChatId) {
            return {
                ...c,
                messages: [...c.messages, newMessage],
                lastMessageTime: '방금'
            };
        }
        return c;
      })
    );
  };

  const handleAIResponse = (response: { text: string, toolCalls?: ToolCall[] }) => {
        const aiMessage: Message = {
            id: (Date.now() + 1).toString(),
            sender: 'AI 비서',
            text: response.text,
            timestamp: new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }),
            type: UserType.AI,
            avatar: 'https://picsum.photos/40/40',
            toolCalls: response.toolCalls
        };

        setChats((prev) => 
            prev.map(c => c.id === activeChatId 
                ? { ...c, messages: [...c.messages, aiMessage], lastMessageTime: '방금' } 
                : c
            )
        );
  };

  const handleAnalyze = useCallback(async () => {
    if (!activeChat) return;
    setIsAnalyzing(true);
    
    // Simulate network delay for better UX
    setTimeout(async () => {
        const result = await analyzeChatContext(activeChat.messages);
        setMcpData(prev => ({
            ...prev,
            [activeChatId]: result
        }));
        setIsAnalyzing(false);
    }, 800);
  }, [activeChat, activeChatId]);

  return (
    <div className="flex h-screen w-full overflow-hidden bg-white">
      {/* Left Sidebar */}
      <div className={`${activeChatId ? 'hidden md:block' : 'block'} h-full`}>
        <Sidebar 
            chats={chats} 
            activeChatId={activeChatId} 
            onSelectChat={setActiveChatId} 
        />
      </div>

      {/* Main Chat Area */}
      <main className={`flex-1 flex h-full relative ${!activeChatId ? 'hidden' : 'block'}`}>
        <ChatWindow 
            chat={activeChat} 
            onSendMessage={handleSendMessage}
            onAnalyze={handleAnalyze}
            isAnalyzing={isAnalyzing}
            onAIResponse={handleAIResponse}
        />
        
        {/* Right MCP Panel - Visible on Large Screens for non-direct chats */}
        {activeChat.type !== 'direct' && (
            <MCPPanel 
                data={mcpData[activeChatId] || null} 
                isLoading={isAnalyzing}
                onRefresh={handleAnalyze}
            />
        )}
      </main>
    </div>
  );
};

export default App;