import React from 'react';
import { MCPAnalysisResult } from '../types';
import { Calendar, CheckSquare, Link as LinkIcon, Sparkles, BrainCircuit } from 'lucide-react';

interface MCPPanelProps {
  data: MCPAnalysisResult | null;
  isLoading: boolean;
  onRefresh: () => void;
}

const MCPPanel: React.FC<MCPPanelProps> = ({ data, isLoading, onRefresh }) => {
  return (
    <div className="w-80 h-full bg-slate-50 border-l border-gray-200 flex flex-col shadow-xl z-10 hidden lg:flex">
      <div className="p-4 bg-white border-b border-gray-200 flex items-center justify-between">
        <div className="flex items-center gap-2 text-slate-700">
          <BrainCircuit className="w-5 h-5 text-indigo-600" />
          <h2 className="font-bold text-sm uppercase tracking-wide">알잘똑 인사이트</h2>
        </div>
        <button 
            onClick={onRefresh}
            disabled={isLoading}
            className={`p-2 rounded-full hover:bg-slate-100 transition-all ${isLoading ? 'animate-spin text-indigo-400' : 'text-slate-400'}`}
        >
            <Sparkles size={18} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {!data && !isLoading && (
            <div className="text-center text-gray-400 mt-10">
                <p>대화 내용을 분석하려면<br/>상단의 버튼을 눌러주세요.</p>
            </div>
        )}

        {isLoading && (
             <div className="space-y-4 animate-pulse">
                <div className="h-4 bg-slate-200 rounded w-3/4"></div>
                <div className="h-20 bg-slate-200 rounded"></div>
                <div className="h-4 bg-slate-200 rounded w-1/2"></div>
                <div className="h-10 bg-slate-200 rounded"></div>
             </div>
        )}

        {data && !isLoading && (
          <>
            {/* Summary Section */}
            <section>
              <h3 className="text-xs font-bold text-gray-500 uppercase mb-3 flex items-center gap-1">
                <Sparkles size={14} /> 요약
              </h3>
              <div className="bg-white p-3 rounded-xl border border-gray-200 shadow-sm text-sm text-gray-700 leading-relaxed">
                {data.summary}
              </div>
            </section>

            {/* Schedule Section */}
            <section>
              <h3 className="text-xs font-bold text-gray-500 uppercase mb-3 flex items-center gap-1">
                <Calendar size={14} /> 감지된 일정
              </h3>
              {data.schedules.length > 0 ? (
                <div className="space-y-2">
                  {data.schedules.map((item, idx) => (
                    <div key={idx} className="bg-white p-3 rounded-xl border border-indigo-100 shadow-sm hover:shadow-md transition-shadow cursor-pointer relative overflow-hidden group">
                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-indigo-500"></div>
                        <h4 className="font-semibold text-gray-800 text-sm">{item.title}</h4>
                        <div className="text-xs text-indigo-600 mt-1 font-medium">{item.date}</div>
                        {item.location && <div className="text-xs text-gray-500 mt-0.5">{item.location}</div>}
                        <button className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 text-xs bg-indigo-100 text-indigo-700 px-2 py-1 rounded">
                            등록
                        </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-gray-400 italic">감지된 일정이 없습니다.</p>
              )}
            </section>

            {/* Todos Section */}
            <section>
              <h3 className="text-xs font-bold text-gray-500 uppercase mb-3 flex items-center gap-1">
                <CheckSquare size={14} /> 할 일 (Action Items)
              </h3>
              {data.todos.length > 0 ? (
                <div className="space-y-2">
                  {data.todos.map((todo, idx) => (
                    <div key={idx} className="flex items-start gap-2 bg-white p-2 rounded-lg border border-gray-100">
                      <input type="checkbox" className="mt-1 rounded text-indigo-600 focus:ring-indigo-500" />
                      <div className="flex-1">
                          <p className="text-sm text-gray-700">{todo.task}</p>
                          {todo.assignee && <p className="text-xs text-gray-400 mt-0.5">담당: {todo.assignee}</p>}
                          {todo.deadline && <p className="text-xs text-red-400 mt-0.5">기한: {todo.deadline}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-gray-400 italic">감지된 할 일이 없습니다.</p>
              )}
            </section>

            {/* Links Section */}
            <section>
              <h3 className="text-xs font-bold text-gray-500 uppercase mb-3 flex items-center gap-1">
                <LinkIcon size={14} /> 공유된 링크
              </h3>
              {data.links.length > 0 ? (
                <div className="space-y-2">
                  {data.links.map((link, idx) => (
                    <a key={idx} href={link.url} target="_blank" rel="noreferrer" className="block bg-gray-50 p-2 rounded border border-gray-200 hover:bg-gray-100 transition-colors">
                      <p className="text-xs text-blue-600 truncate">{link.url}</p>
                      {link.description && <p className="text-xs text-gray-500 mt-1 truncate">{link.description}</p>}
                    </a>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-gray-400 italic">공유된 링크가 없습니다.</p>
              )}
            </section>
          </>
        )}
      </div>
    </div>
  );
};

export default MCPPanel;