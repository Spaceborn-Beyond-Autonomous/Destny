import { useState, useEffect, useRef } from "react";
import { io, Socket } from "socket.io-client";
import { motion, AnimatePresence } from "framer-motion";
import { 
  X, 
  Send, 
  User, 
  Clock, 
  CheckCheck, 
  Check,

  MessageCircle,
  ChevronDown,
  ChevronUp,
  Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { chatService, ChatMessage } from "@/services/chat.service";
import { formatDistanceToNow } from "date-fns";
import { useChat } from "@/context/ChatContext";

interface ChatWindowProps {
  isOpen: boolean;
  onClose: () => void;
  orderId: string;
  orderTitle: string;
  freelancerName?: string;
  clientName?: string;
  currentUserId: string;
  currentUserRole: 'client' | 'freelancer' | 'admin';
}

const ChatWindow: React.FC<ChatWindowProps> = ({
  isOpen,
  onClose,
  orderId,
  orderTitle,
  freelancerName,
  clientName,
  currentUserId,
  currentUserRole
}) => {
  const { toast } = useToast();
  const { refreshChats } = useChat();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const backendUrl = String(import.meta.env.VITE_BACKEND_URL || 'https://destny.onrender.com')
    .replace(/\/+$/, '')
    .replace(/\/api(?:\/v1)?$/, '');

  // Load messages
  useEffect(() => {
    if (isOpen && orderId) {
      loadMessages();
    }
  }, [isOpen, orderId]);

  useEffect(() => {
    if (!isOpen || !orderId) return;

    const socket: Socket = io(backendUrl, {
      transports: ["websocket", "polling"],
      withCredentials: true,
    });

    socket.on("connect", () => {
      socket.emit("join:freelance-contract", orderId);
    });

    socket.on("freelance-chat:message", (payload: { conversationId?: string; message?: ChatMessage }) => {
      if (payload?.conversationId !== orderId || !payload.message) return;
      setMessages((current) => {
        if (current.some((message) => message._id === payload.message?._id)) {
          return current;
        }
        return [...current, payload.message as ChatMessage];
      });
      refreshChats();
    });

    socket.on("freelance-chat:read", (payload: { conversationId?: string }) => {
      if (payload?.conversationId === orderId) {
        loadMessages();
        refreshChats();
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [backendUrl, isOpen, orderId, refreshChats]);

  // Mark messages as read
  useEffect(() => {
    if (isOpen && orderId && messages.length > 0) {
      markMessagesAsRead();
    }
  }, [isOpen, orderId, messages.length]);

  // Scroll to bottom on new messages
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadMessages = async () => {
    setLoading(true);
    try {
      const data = await chatService.getOrderChat(orderId);
      setMessages(data);
      await refreshChats();
    } catch (error) {
      console.error('Failed to load chat messages:', error);
      toast({
        title: "Error",
        description: "Failed to load chat messages. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const markMessagesAsRead = async () => {
    try {
      await chatService.markAsRead(orderId);
      await refreshChats();
    } catch (error) {
      console.error('Failed to mark messages as read:', error);
    }
  };

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || sending) return;

    setSending(true);
    const messageContent = newMessage.trim();
    setNewMessage("");

    try {
      const sentMessage = await chatService.sendMessage(orderId, messageContent);
      setMessages(prev => prev.some((message) => message._id === sentMessage._id) ? prev : [...prev, sentMessage]);
      
      // Auto-mark as read
      await chatService.markAsRead(orderId);
      await refreshChats();
    } catch (error) {
      console.error('Failed to send message:', error);
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive"
      });
      setNewMessage(messageContent);
    } finally {
      setSending(false);
    }
  };

  const formatTime = (date: string) => {
    try {
      return formatDistanceToNow(new Date(date), { addSuffix: true });
    } catch {
      return 'Just now';
    }
  };

  const getOtherParticipant = () => {
    if (currentUserRole === 'client' && freelancerName) {
      return freelancerName;
    } else if (currentUserRole === 'freelancer' && clientName) {
      return clientName;
    }
    return 'User';
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 50, scale: 0.95 }}
          className="fixed bottom-4 right-4 z-50 w-full sm:w-96"
        >
          <div className={`glass-strong rounded-2xl border border-border shadow-2xl overflow-hidden transition-all duration-300 ${
            isMinimized ? 'h-14' : 'h-[500px] max-h-[80vh]'
          }`}>
            {/* Header */}
            <div 
              className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/20 cursor-pointer"
              onClick={() => setIsMinimized(!isMinimized)}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary">
                  <MessageCircle className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground truncate">
                    {orderTitle}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    Chat with {getOtherParticipant()}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsMinimized(!isMinimized);
                  }}
                  className="p-1 hover:bg-muted/20 rounded-lg transition-colors"
                >
                  {isMinimized ? (
                    <ChevronUp className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  )}
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onClose();
                  }}
                  className="p-1 hover:bg-muted/20 rounded-lg transition-colors"
                >
                  <X className="h-4 w-4 text-muted-foreground" />
                </button>
              </div>
            </div>

            {/* Messages */}
            {!isMinimized && (
              <>
                <div className="flex-1 overflow-y-auto p-4 space-y-3 h-[calc(100%-110px)]">
                  {loading ? (
                    <div className="flex items-center justify-center h-full">
                      <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center">
                      <MessageCircle className="h-12 w-12 text-muted-foreground/30 mb-3" />
                      <p className="text-sm text-muted-foreground">No messages yet</p>
                      <p className="text-xs text-muted-foreground/70">Start the conversation!</p>
                    </div>
                  ) : (
                    messages.map((msg, index) => {
                      const isOwnMessage = msg.senderId?._id === currentUserId || 
                        (msg.senderId?._id === 'current_user');
                      const showAvatar = !isOwnMessage && 
                        (index === 0 || messages[index - 1]?.senderId?._id !== msg.senderId?._id);
                      
                      return (
                        <div
                          key={msg._id || index}
                          className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
                        >
                          <div className={`flex items-end gap-2 max-w-[85%] ${isOwnMessage ? 'flex-row-reverse' : ''}`}>
                            {!isOwnMessage && showAvatar && (
                              <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-bold flex-shrink-0">
                                {msg.senderId?.name?.charAt(0) || 'U'}
                              </div>
                            )}
                            {!isOwnMessage && !showAvatar && (
                              <div className="w-7 flex-shrink-0" />
                            )}
                            <div
                              className={`px-3 py-2 rounded-2xl ${
                                isOwnMessage
                                  ? 'bg-primary text-primary-foreground'
                                  : 'bg-muted/30 text-foreground'
                              }`}
                            >
                              {!isOwnMessage && showAvatar && (
                                <p className="text-xs font-medium text-muted-foreground mb-1">
                                  {msg.senderId?.name || 'Unknown'}
                                </p>
                              )}
                              <p className="text-sm break-words">{msg.message}</p>
                              <div className={`flex items-center gap-1 mt-1 ${
                                isOwnMessage ? 'justify-end' : 'justify-start'
                              }`}>
                                <span className="text-[10px] opacity-70">
                                  {formatTime(msg.createdAt)}
                                </span>
                                {isOwnMessage && (
                                  msg.read ? (
                                    <CheckCheck className="h-3 w-3 text-green-400" />
                                  ) : (
                                    <Check className="h-3 w-3" />
                                  )
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Input */}
                <form onSubmit={handleSendMessage} className="border-t border-border p-3">
                  <div className="flex gap-2">
                    <input
                      ref={inputRef}
                      type="text"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder="Type a message..."
                      className="flex-1 px-3 py-2 bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all text-sm"
                      disabled={sending}
                    />
                    <Button
                      type="submit"
                      size="sm"
                      className="glow-primary gap-1"
                      disabled={!newMessage.trim() || sending}
                    >
                      {sending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Send className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </form>
              </>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ChatWindow;
