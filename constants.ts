import { ChatRoom, UserType } from './types';

export const INITIAL_CHATS: ChatRoom[] = [
  {
    id: '1',
    name: '주말 등산 모임 (강남)',
    type: 'group',
    participants: 4,
    unreadCount: 12,
    lastMessageTime: '오후 2:30',
    messages: [
      { id: 'm1', sender: '김철수', text: '이번 주 토요일 날씨 좋대!', timestamp: '오후 1:00', type: UserType.OTHER },
      { id: 'm2', sender: '이영희', text: '오 그럼 관악산 갈까?', timestamp: '오후 1:05', type: UserType.OTHER },
      { id: 'm3', sender: '박지민', text: '좋아. 몇 시에 모일까?', timestamp: '오후 1:10', type: UserType.OTHER },
      { id: 'm4', sender: '김철수', text: '토요일 2시에 강남역 11번 출구 어때? 끝나고 고기 먹자.', timestamp: '오후 1:15', type: UserType.OTHER },
      { id: 'm5', sender: '나', text: '콜! 그때 봐.', timestamp: '오후 1:20', type: UserType.ME },
      { id: 'm6', sender: '이영희', text: 'http://kko.to/map123 여기 고기집 예약할게.', timestamp: '오후 1:25', type: UserType.OTHER },
    ]
  },
  {
    id: '2',
    name: '프로젝트 알파 기획팀',
    type: 'group',
    participants: 15,
    unreadCount: 156,
    lastMessageTime: '오전 11:45',
    messages: [
      { id: 'w1', sender: '팀장님', text: '어제 회의록 공유합니다. 다들 확인 부탁드려요.', timestamp: '오전 9:00', type: UserType.OTHER },
      { id: 'w2', sender: '팀장님', text: 'https://docs.google.com/presentation/d/xyz', timestamp: '오전 9:01', type: UserType.OTHER },
      { id: 'w3', sender: '김대리', text: '확인했습니다. UI 시안은 제가 금요일까지 마무리할게요.', timestamp: '오전 9:10', type: UserType.OTHER },
      { id: 'w4', sender: '박사원', text: '저번주에 공유주신 API 명세서 링크 다시 주실 수 있나요?', timestamp: '오전 10:30', type: UserType.OTHER },
      { id: 'w5', sender: '최개발', text: '여기요. https://swagger.io/docs/specification/about/', timestamp: '오전 10:35', type: UserType.OTHER },
      { id: 'w6', sender: '팀장님', text: '그리고 다음 주 월요일 오전 10시에 전체 주간회의 잡겠습니다. 303호 회의실입니다.', timestamp: '오전 11:45', type: UserType.OTHER },
    ]
  },
  {
    id: '3',
    name: '알잘똑 AI',
    type: 'direct',
    participants: 1,
    unreadCount: 0,
    lastMessageTime: '방금',
    messages: [
      { id: 'ai1', sender: '알잘똑', text: '안녕하세요! AI비서 알잘똑이에요. 일정 관리, 맛집 검색, 채팅 요약 등 뭐든 물어보세요!', timestamp: '오전 8:00', type: UserType.AI, avatar: '/logo.png' },
    ]
  }
];