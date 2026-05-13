import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import { io, Socket } from "socket.io-client";
import { format } from "date-fns";
import { Loader2, Send, Wifi, WifiOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

type ChatMessage = {
  _id: string;
  orderId: string;
  senderId: string;
  senderName: string;
  senderRole: "admin" | "user";
  message: string;
  createdAt: string;
};

type OrderChatProps = {
  orderId: string;
  orderLabel: string;
  isAdmin?: boolean;
  onRead?: () => void;
};

const OrderChat = ({ orderId, orderLabel, isAdmin = false, onRead }: OrderChatProps) => {
  const backendUrl = import.meta.env.VITE_BACKEND_URL;
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [connected, setConnected] = useState(false);
  const viewportRef = useRef<HTMLDivElement | null>(null);

  const endpoint = useMemo(() => `${backendUrl}/api/v1/orders/${orderId}/chat`, [backendUrl, orderId]);
  const readEndpoint = useMemo(() => `${endpoint}/read`, [endpoint]);

  const markRead = useCallback(async () => {
    try {
      await axios.post(readEndpoint, {}, { withCredentials: true });
      onRead?.();
    } catch {
      // Reading state is helpful but should never block the chat surface.
    }
  }, [onRead, readEndpoint]);

  useEffect(() => {
    let mounted = true;

    const loadMessages = async () => {
      setLoading(true);
      try {
        const res = await axios.get(endpoint, { withCredentials: true });
        if (mounted) {
          setMessages(res.data?.data || []);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    loadMessages();
    return () => {
      mounted = false;
    };
  }, [endpoint]);

  useEffect(() => {
    const socket: Socket = io(backendUrl, {
      transports: ["websocket", "polling"],
      withCredentials: true,
    });

    socket.on("connect", () => setConnected(true));
    socket.on("disconnect", () => setConnected(false));
    socket.on("connect_error", () => setConnected(false));
    socket.on("chat:message", (payload: { orderId?: string; message?: ChatMessage }) => {
      if (payload?.orderId !== orderId || !payload.message) return;
      setMessages((current) => {
        if (current.some((message) => message._id === payload.message?._id)) {
          return current;
        }
        return [...current, payload.message as ChatMessage];
      });
      if (payload.message.senderRole !== (isAdmin ? "admin" : "user")) {
        markRead();
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [backendUrl, isAdmin, markRead, orderId]);

  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;
    viewport.scrollTop = viewport.scrollHeight;
  }, [messages.length, loading]);

  useEffect(() => {
    if (!loading && messages.length > 0) {
      markRead();
    }
  }, [loading, markRead, messages.length]);

  const handleSend = async (event: FormEvent) => {
    event.preventDefault();
    const text = draft.trim();
    if (!text || sending) return;

    setSending(true);
    try {
      const res = await axios.post(endpoint, { message: text }, { withCredentials: true });
      const sent = res.data?.data as ChatMessage | undefined;
      if (sent) {
        setMessages((current) => current.some((message) => message._id === sent._id) ? current : [...current, sent]);
      }
      setDraft("");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="flex h-[520px] flex-col overflow-hidden rounded-xl border border-border/50 bg-card/40">
      <div className="flex items-center justify-between border-b border-border/50 px-4 py-3">
        <div>
          <p className="text-sm font-semibold">Order Chat</p>
          <p className="text-xs text-muted-foreground">{orderLabel}</p>
        </div>
        <div className={`flex items-center gap-1.5 text-xs ${connected ? "text-emerald-400" : "text-muted-foreground"}`}>
          {connected ? <Wifi className="h-3.5 w-3.5" /> : <WifiOff className="h-3.5 w-3.5" />}
          {connected ? "Live" : "Connecting"}
        </div>
      </div>

      <div ref={viewportRef} className="min-h-0 flex-1 space-y-3 overflow-y-auto p-4">
        {loading ? (
          <div className="flex h-56 items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex h-56 items-center justify-center text-center text-sm text-muted-foreground">
            Start a support conversation for this order.
          </div>
        ) : (
          messages.map((message) => {
            const mine = isAdmin ? message.senderRole === "admin" : message.senderRole === "user";
            return (
              <div key={message._id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[82%] rounded-2xl px-3 py-2 text-sm ${mine ? "bg-primary text-primary-foreground" : "bg-muted/70 text-foreground"}`}>
                  <div className="mb-1 flex items-center gap-2 text-[10px] opacity-75">
                    <span className="font-medium">{message.senderRole === "admin" ? "Support" : message.senderName}</span>
                    <span>{format(new Date(message.createdAt), "MMM d, h:mm a")}</span>
                  </div>
                  <p className="whitespace-pre-wrap break-words leading-5">{message.message}</p>
                </div>
              </div>
            );
          })
        )}
      </div>

      <form onSubmit={handleSend} className="border-t border-border/50 p-3">
        <div className="flex gap-2">
          <Textarea
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            placeholder={isAdmin ? "Reply to the customer..." : "Message support..."}
            className="max-h-32 min-h-[44px] resize-none bg-background/70"
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                event.currentTarget.form?.requestSubmit();
              }
            }}
          />
          <Button type="submit" size="icon" className="h-11 w-11 shrink-0" disabled={!draft.trim() || sending}>
            {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default OrderChat;
