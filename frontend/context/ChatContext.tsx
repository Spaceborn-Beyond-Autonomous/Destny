import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { chatService, ChatSummary } from '@/services/chat.service';
import { authService } from '@/services/auth.service';
import { API_BASE_URL } from '@/lib/api-client';

interface ChatContextType {
  unreadCount: number;
  chatSummaries: ChatSummary[];
  refreshChats: () => Promise<void>;
  markAsRead: (orderId: string) => Promise<void>;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

const getSocketUrl = () => {
  return API_BASE_URL;
};

export const ChatProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [unreadCount, setUnreadCount] = useState(0);
  const [chatSummaries, setChatSummaries] = useState<ChatSummary[]>([]);
  const [isAuthenticated, setIsAuthenticated] = useState(() => authService.isAuthenticated());

  const refreshChats = useCallback(async () => {
    try {
      if (!authService.isAuthenticated()) {
        setChatSummaries([]);
        setUnreadCount(0);
        return;
      }

      const summaries = await chatService.getChatSummaries();
      setChatSummaries(summaries);
      const total = summaries.reduce((acc, s) => acc + (s.unreadCount || 0), 0);
      setUnreadCount(total);
    } catch (error) {
      console.error('Failed to refresh chats:', error);
    }
  }, []);

  const markAsRead = useCallback(async (orderId: string) => {
    try {
      await chatService.markAsRead(orderId);
      await refreshChats();
    } catch (error) {
      console.error('Failed to mark as read:', error);
    }
  }, [refreshChats]);

  useEffect(() => {
    const syncAuthState = () => {
      setIsAuthenticated(authService.isAuthenticated());
    };

    syncAuthState();
    window.addEventListener('auth:changed', syncAuthState);
    window.addEventListener('storage', syncAuthState);

    return () => {
      window.removeEventListener('auth:changed', syncAuthState);
      window.removeEventListener('storage', syncAuthState);
    };
  }, []);

  useEffect(() => {
    refreshChats();

    const interval = setInterval(refreshChats, 30000);
    return () => clearInterval(interval);
  }, [refreshChats]);

  useEffect(() => {
    if (!isAuthenticated) {
      setChatSummaries([]);
      setUnreadCount(0);
      return;
    }

    let refreshTimer: ReturnType<typeof setTimeout> | undefined;
    const refreshSoon = () => {
      if (refreshTimer) {
        clearTimeout(refreshTimer);
      }
      refreshTimer = setTimeout(() => {
        refreshChats();
      }, 150);
    };

    const socket: Socket = io(getSocketUrl(), {
      transports: ['websocket', 'polling'],
      withCredentials: true,
    });

    socket.on('freelance-chat:message', refreshSoon);
    socket.on('freelance-chat:read', refreshSoon);
    socket.on('connect', refreshChats);

    return () => {
      if (refreshTimer) {
        clearTimeout(refreshTimer);
      }
      socket.disconnect();
    };
  }, [isAuthenticated, refreshChats]);

  return (
    <ChatContext.Provider value={{ unreadCount, chatSummaries, refreshChats, markAsRead }}>
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
};
