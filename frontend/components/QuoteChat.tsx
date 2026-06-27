import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import { io, Socket } from "socket.io-client";
import { format } from "date-fns";
import { Loader2, Send, Wifi, WifiOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

type QuoteChatMessage = {
  _id: string;
  quoteId: string;
  senderName: string;
  senderRole: "admin" | "user";
  message: string;
  createdAt: string;
};

type QuoteChatProps = {
  quoteId: string;
  quoteLabel: string;
  isAdmin?: boolean;
};

const QuoteChat = ({ quoteId, quoteLabel, isAdmin = false }: QuoteChatProps) => {
  const backendUrl = import.meta.env.VITE_BACKEND_URL;
  const [messages, setMessages] = useState<QuoteChatMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [connected, setConnected] = useState(false);
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const endpoint = useMemo(() => `${backendUrl}/api/v1/quotes/${quoteId}/chat`, [backendUrl, quoteId]);

  useEffect(() => {
    let mounted = true;
    const loadMessages = async () => {
      setLoading(true);
      try {
        const res = await axios.get(endpoint, { withCredentials: true });
        if (mounted) setMessages(res.data?.data || []);
      } finally {
        if (mounted) setLoading(false);
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

    socket.on("connect", () => {
      setConnected(true);
      if (!isAdmin) {
        socket.emit("join:quote", quoteId);
      }
    });
    
    socket.on("disconnect", () => setConnected(false));
    socket.on("connect_error", () => setConnected(false));
    socket.on("quote:chat:message", (payload: { quoteId?: string; message?: QuoteChatMessage }) => {
      if (payload.quoteId !== quoteId || !payload.message) return;
      setMessages((current) => current.some((message) => message._id === payload.message?._id) ? current : [...current, payload.message as QuoteChatMessage]);
    });

    return () => {
      socket.disconnect();
    };
  }, [backendUrl, quoteId]);

  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;
    viewport.scrollTop = viewport.scrollHeight;
  }, [loading, messages.length]);

  const handleSend = async (event: FormEvent) => {
    event.preventDefault();
    const text = draft.trim();
    if (!text || sending) return;
    setSending(true);
    try {
      const res = await axios.post(endpoint, { message: text }, { withCredentials: true });
      const sent = res.data?.data as QuoteChatMessage | undefined;
      if (sent) setMessages((current) => current.some((message) => message._id === sent._id) ? current : [...current, sent]);
      setDraft("");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="flex h-[520px] flex-col overflow-hidden rounded-xl border border-border/50 bg-card/40">
      <div className="flex items-center justify-between border-b border-border/50 px-4 py-3">
        <div>
          <p className="text-sm font-semibold">Quote Chat</p>
          <p className="text-xs text-muted-foreground">{quoteLabel}</p>
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
            Start a conversation about this quote.
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
            placeholder={isAdmin ? "Reply to the customer..." : "Message the quote team..."}
            className="max-h-32 min-h-[44px] resize-none bg-background/70"
          />
          <Button type="submit" size="icon" className="h-11 w-11 shrink-0" disabled={!draft.trim() || sending}>
            {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default QuoteChat;
