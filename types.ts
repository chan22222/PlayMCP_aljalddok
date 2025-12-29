export enum UserType {
  ME = 'ME',
  OTHER = 'OTHER',
  AI = 'AI'
}

export interface ToolCall {
  id: string;
  name: string;
  args: any;
  status: 'success' | 'failure' | 'pending';
  result?: any;
}

export interface Message {
  id: string;
  sender: string;
  text: string;
  timestamp: string;
  type: UserType;
  avatar?: string;
  toolCalls?: ToolCall[]; // Optional array of tool calls made during this turn
}

export interface ChatRoom {
  id: string;
  name: string;
  type: 'group' | 'direct';
  participants: number;
  messages: Message[];
  unreadCount: number;
  lastMessageTime: string;
}

export interface ScheduleItem {
  title: string;
  date: string;
  location?: string;
  confidence: number;
}

export interface ToDoItem {
  task: string;
  assignee?: string;
  deadline?: string;
}

export interface LinkItem {
  url: string;
  description: string;
}

export interface MCPAnalysisResult {
  summary: string;
  schedules: ScheduleItem[];
  todos: ToDoItem[];
  links: LinkItem[];
  intent: 'general' | 'scheduling' | 'question' | 'task_assignment';
}