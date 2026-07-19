import { apiClient } from '@/lib/api-client';

export interface ChatMessage {
  _id: string;
  orderId: string;
  conversationId?: string;
  conversationType?: string;
  senderId: {
    _id: string;
    name: string;
    avatar?: string;
  };
  receiverId?: {
    _id: string;
    name: string;
    avatar?: string;
  };
  senderRole?: 'client' | 'freelancer' | 'admin' | 'user';
  message: string;
  read: boolean;
  readBy?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface ChatSummary {
  orderId: string;
  orderTitle: string;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
  participantId: string;
  participantName: string;
  participantAvatar?: string;
}

// Mock data for when backend is not available
const MOCK_MESSAGES: Record<string, ChatMessage[]> = {
  '1': [
    {
      _id: 'm1',
      orderId: '1',
      senderId: {
        _id: 'f1',
        name: 'Arjun Sharma',
        avatar: 'AS'
      },
      receiverId: {
        _id: 'c1',
        name: 'Rohit Singhania',
        avatar: 'RS'
      },
      message: "Hi Rohit, I've reviewed your project brief and I'm very interested. I have experience with similar projects.",
      read: true,
      createdAt: '2026-07-05T10:30:00Z',
      updatedAt: '2026-07-05T10:30:00Z'
    },
    {
      _id: 'm2',
      orderId: '1',
      senderId: {
        _id: 'c1',
        name: 'Rohit Singhania',
        avatar: 'RS'
      },
      receiverId: {
        _id: 'f1',
        name: 'Arjun Sharma',
        avatar: 'AS'
      },
      message: "Hi Arjun, that's great to hear. Can you share some examples of similar work you've done?",
      read: true,
      createdAt: '2026-07-05T10:45:00Z',
      updatedAt: '2026-07-05T10:45:00Z'
    },
    {
      _id: 'm3',
      orderId: '1',
      senderId: {
        _id: 'f1',
        name: 'Arjun Sharma',
        avatar: 'AS'
      },
      receiverId: {
        _id: 'c1',
        name: 'Rohit Singhania',
        avatar: 'RS'
      },
      message: "Yes, I've worked on several EdTech projects. Here's a link to my portfolio: https://arjun.dev/edtech",
      read: false,
      createdAt: '2026-07-05T11:00:00Z',
      updatedAt: '2026-07-05T11:00:00Z'
    }
  ],
  '2': [
    {
      _id: 'm4',
      orderId: '2',
      senderId: {
        _id: 'f2',
        name: 'Priya Nair',
        avatar: 'PN'
      },
      receiverId: {
        _id: 'c1',
        name: 'Rohit Singhania',
        avatar: 'RS'
      },
      message: "Hi Rohit, I specialize in AI automation and I'm confident I can deliver your invoice processing project.",
      read: true,
      createdAt: '2026-07-04T14:20:00Z',
      updatedAt: '2026-07-04T14:20:00Z'
    },
    {
      _id: 'm5',
      orderId: '2',
      senderId: {
        _id: 'c1',
        name: 'Rohit Singhania',
        avatar: 'RS'
      },
      receiverId: {
        _id: 'f2',
        name: 'Priya Nair',
        avatar: 'PN'
      },
      message: "Thanks Priya! Can you share your approach for handling handwritten invoices?",
      read: false,
      createdAt: '2026-07-05T09:00:00Z',
      updatedAt: '2026-07-05T09:00:00Z'
    }
  ]
};

const MOCK_SUMMARIES: ChatSummary[] = [
  {
    orderId: '1',
    orderTitle: 'EdTech MVP — Student Progress Dashboard',
    lastMessage: "Yes, I've worked on several EdTech projects. Here's a link to my portfolio.",
    lastMessageTime: '2026-07-05T11:00:00Z',
    unreadCount: 1,
    participantId: 'f1',
    participantName: 'Arjun Sharma',
    participantAvatar: 'AS'
  },
  {
    orderId: '2',
    orderTitle: 'AI-Powered Invoice Processing Automation',
    lastMessage: "Thanks Priya! Can you share your approach for handling handwritten invoices?",
    lastMessageTime: '2026-07-05T09:00:00Z',
    unreadCount: 1,
    participantId: 'f2',
    participantName: 'Priya Nair',
    participantAvatar: 'PN'
  }
];

class ChatService {
  private normalizeMessage(raw: any, orderId: string): ChatMessage {
    const senderId = typeof raw?.senderId === 'object'
      ? raw.senderId
      : {
          _id: String(raw?.senderId || ''),
          name: raw?.senderName || raw?.senderRole || 'User',
        };

    return {
      _id: String(raw?._id || `msg_${Date.now()}`),
      orderId: String(raw?.orderId || raw?.conversationId || orderId),
      conversationId: raw?.conversationId ? String(raw.conversationId) : undefined,
      conversationType: raw?.conversationType,
      senderId: {
        _id: String(senderId?._id || ''),
        name: senderId?.name || raw?.senderName || 'User',
        avatar: senderId?.avatar,
      },
      receiverId: raw?.receiverId,
      senderRole: raw?.senderRole,
      message: String(raw?.message || ''),
      read: Boolean(raw?.read),
      readBy: raw?.readBy,
      createdAt: raw?.createdAt || new Date().toISOString(),
      updatedAt: raw?.updatedAt || raw?.createdAt || new Date().toISOString(),
    };
  }

  // Get chat messages for a freelance contract.
  async getOrderChat(orderId: string): Promise<ChatMessage[]> {
    try {
      const response = await apiClient.get<ChatMessage[]>(
        `/api/v1/freelance-chat/contracts/${orderId}/messages`
      );
      return response.map((message) => this.normalizeMessage(message, orderId));
    } catch (error) {
      console.log('Using mock freelance chat data for contract:', orderId);
      return MOCK_MESSAGES[orderId] || [
        {
          _id: 'mock_' + Date.now(),
          orderId: orderId,
          senderId: {
            _id: 'system',
            name: 'System',
            avatar: 'S'
          },
          receiverId: {
            _id: 'user',
            name: 'User',
            avatar: 'U'
          },
          message: 'No messages yet. Start the conversation! 💬',
          read: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      ];
    }
  }

  // Send a freelance chat message.
  async sendMessage(orderId: string, message: string): Promise<ChatMessage> {
    try {
      const response = await apiClient.post<ChatMessage>(
        `/api/v1/freelance-chat/contracts/${orderId}/messages`,
        { message }
      );
      return this.normalizeMessage(response, orderId);
    } catch (error) {
      console.log('Sending mock freelance message for contract:', orderId);
      const mockMessage: ChatMessage = {
        _id: 'mock_' + Date.now(),
        orderId: orderId,
        senderId: {
          _id: 'current_user',
          name: 'You',
          avatar: 'U'
        },
        receiverId: {
          _id: 'other_user',
          name: 'Other',
          avatar: 'O'
        },
        message: message,
        read: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      // Add to mock messages
      if (!MOCK_MESSAGES[orderId]) {
        MOCK_MESSAGES[orderId] = [];
      }
      MOCK_MESSAGES[orderId].push(mockMessage);
      
      return mockMessage;
    }
  }

  // Mark chat messages as read
  async markAsRead(orderId: string): Promise<void> {
    try {
      await apiClient.post(`/api/v1/freelance-chat/contracts/${orderId}/read`);
    } catch (error) {
      console.log('Marking messages as read in mock freelance data for contract:', orderId);
      if (MOCK_MESSAGES[orderId]) {
        MOCK_MESSAGES[orderId] = MOCK_MESSAGES[orderId].map(msg => ({
          ...msg,
          read: true
        }));
      }
    }
  }

  // Get chat summaries for all orders
  async getChatSummaries(): Promise<ChatSummary[]> {
    try {
      const response = await apiClient.get<ChatSummary[]>('/api/v1/freelance-chat/summaries');
      return response;
    } catch (error) {
      console.log('Using mock freelance chat summaries');
      return MOCK_SUMMARIES;
    }
  }

  // Get unread count for all orders
  async getUnreadCount(): Promise<{ total: number; orders: { orderId: string; count: number }[] }> {
    try {
      const summaries = await this.getChatSummaries();
      const total = summaries.reduce((acc, s) => acc + (s.unreadCount || 0), 0);
      const orders = summaries.map(s => ({
        orderId: s.orderId,
        count: s.unreadCount || 0
      }));
      return { total, orders };
    } catch (error) {
      console.log('Using mock unread count');
      return {
        total: 2,
        orders: [
          { orderId: '1', count: 1 },
          { orderId: '2', count: 1 }
        ]
      };
    }
  }
}

export const chatService = new ChatService();
