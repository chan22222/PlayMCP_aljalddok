import React from 'react';
import { ChatRoom } from '../types';
import { User, Users, MessageCircle } from 'lucide-react';

interface SidebarProps {
  chats: ChatRoom[];
  activeChatId: string;
  onSelectChat: (id: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ chats, activeChatId, onSelectChat }) => {
  return (
    <div className="w-full md:w-80 h-full bg-white border-r border-gray-200 flex flex-col">
      <div className="p-4 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
        <h1 className="font-bold text-xl text-gray-800 flex items-center gap-2">
          <MessageCircle className="w-6 h-6 text-yellow-500 fill-current" />
          알잘똑
        </h1>
      </div>
      
      <div className="flex-1 overflow-y-auto">
        {chats.map((chat) => (
          <div
            key={chat.id}
            onClick={() => onSelectChat(chat.id)}
            className={`p-4 flex items-center gap-3 cursor-pointer hover:bg-gray-50 transition-colors ${
              activeChatId === chat.id ? 'bg-yellow-50 border-l-4 border-yellow-400' : ''
            }`}
          >
            <div className="relative">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${chat.type === 'direct' ? 'bg-blue-100 text-blue-600' : 'bg-orange-100 text-orange-600'}`}>
                {chat.type === 'direct' ? <User size={24} /> : <Users size={24} />}
              </div>
              {chat.unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold px-1.5 py-0.5 rounded-full min-w-[20px] text-center">
                  {chat.unreadCount}
                </span>
              )}
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex justify-between items-baseline mb-1">
                <h3 className="font-semibold text-gray-900 truncate">{chat.name}</h3>
                <span className="text-xs text-gray-400 ml-2 whitespace-nowrap">{chat.lastMessageTime}</span>
              </div>
              <p className="text-sm text-gray-500 truncate">
                {chat.messages[chat.messages.length - 1]?.text || 'No messages'}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Sidebar;