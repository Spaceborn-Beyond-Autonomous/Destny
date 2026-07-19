import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  MessageCircle, 
  Users, 
  Clock, 
  ChevronRight,
  CheckCheck
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useChat } from "@/context/ChatContext";
import { formatDistanceToNow } from "date-fns";

interface ChatListProps {
  onChatSelect: (orderId: string, orderTitle: string, participantName: string) => void;
  currentUserId: string;
  userRole: 'client' | 'freelancer' | 'admin';
}

const ChatList: React.FC<ChatListProps> = ({ onChatSelect, currentUserId, userRole }) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const { chatSummaries: chats, unreadCount, refreshChats } = useChat();

  useEffect(() => {
    loadChats();
  }, [refreshChats]);

  const loadChats = async () => {
    setLoading(true);
    try {
      await refreshChats();
    } catch (error) {
      console.error('Failed to load chats:', error);
      toast({
        title: "Error",
        description: "Failed to load chat list.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (date: string) => {
    return formatDistanceToNow(new Date(date), { addSuffix: true });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <MessageCircle className="h-5 w-5 text-primary" />
          <h3 className="font-semibold text-foreground">Messages</h3>
        </div>
        {unreadCount > 0 && (
          <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-primary text-primary-foreground">
            {unreadCount} unread
          </span>
        )}
      </div>

      {chats.length === 0 ? (
        <div className="text-center py-8">
          <div className="text-4xl mb-2">💬</div>
          <p className="text-muted-foreground text-sm">No conversations yet</p>
          <p className="text-xs text-muted-foreground/70">
            Start working on a project to chat
          </p>
        </div>
      ) : (
        chats.map((chat) => (
          <motion.div
            key={chat.orderId}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`glass rounded-xl p-4 border border-border hover:border-primary/30 transition-all duration-300 cursor-pointer group ${
              chat.unreadCount > 0 ? 'border-primary/20 bg-primary/5' : ''
            }`}
            onClick={() => onChatSelect(chat.orderId, chat.orderTitle, chat.participantName)}
          >
            <div className="flex items-center gap-3">
              {/* Avatar */}
              <div className="relative flex-shrink-0">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
                  {chat.participantName?.charAt(0) || 'U'}
                </div>
                {chat.unreadCount > 0 && (
                  <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 text-white text-xs font-bold flex items-center justify-center">
                    {chat.unreadCount}
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-foreground truncate">
                    {chat.participantName}
                  </p>
                  <span className="text-[10px] text-muted-foreground whitespace-nowrap ml-2">
                    {formatTime(chat.lastMessageTime)}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground truncate">
                  {chat.orderTitle}
                </p>
                <p className={`text-xs truncate ${
                  chat.unreadCount > 0 ? 'text-foreground font-medium' : 'text-muted-foreground'
                }`}>
                  {chat.lastMessage}
                </p>
              </div>

              <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors flex-shrink-0" />
            </div>
          </motion.div>
        ))
      )}
    </div>
  );
};

export default ChatList;
