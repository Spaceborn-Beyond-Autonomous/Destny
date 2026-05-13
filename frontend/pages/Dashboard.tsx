import { useCallback, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import {
  AlertTriangle,
  Ban,
  BarChart3,
  Bell,
  CheckCheck,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  ClipboardList,
  Download,
  Edit,
  ExternalLink,
  FileBox,
  History,
  Home,
  LogOut,
  MessageSquareText,
  MoreHorizontal,
  Package,
  Plus,
  Printer,
  Save,
  Search,
  Settings,
  Trash2,
  Truck,
  Users,
  Upload,
  X,
} from "lucide-react";
import { Link } from "react-router-dom";
import axios from "axios";
import { io, Socket } from "socket.io-client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import OrderChat from "@/components/OrderChat";
import QuoteChat from "@/components/QuoteChat";
import destnyLogo from "@/assets/destny-logo.png";

type SectionId =
  | "overview"
  | "quotes"
  | "orders"
  | "chats"
  | "jobs"
  | "files"
  | "customers"
  | "printers"
  | "analytics"
  | "notifications"
  | "settings";

type Metric = { label: string; value: string; action: string; detail: string };

type OrderRaw = {
  _id: string;
  material: string;
  quality: string;
  dimensions: { x: number; y: number; z: number };
  quantity: number;
  estimatedWeight: number;
  estimatedTotal: number;
  customerName: string;
  fileName: string;
  gdriveFileId: string;
  gdriveLink: string;
  paid: boolean;
  paymentStatus: string;
  orderStatus: string;
  rejectionReason: string;
  createdAt: string;
};

type QuoteRaw = {
  _id: string;
  name: string;
  email: string;
  projectDescription: string;
  budget: string;
  technicalSpecifications: string;
  status: string;
  source: string;
  createdAt: string;
};

type CustomerRaw = {
  _id: string;
  name: string;
  email?: string;
  isUser?: boolean;
  totalQuotes?: number;
  totalOrders: number;
  totalSpend: number;
  latestOrder: string;
  profile?: any;
};

type ChatSummary = {
  orderId: string;
  orderLabel: string;
  customerName: string;
  fileName: string;
  orderStatus: string;
  latestMessage: {
    senderName: string;
    senderRole: "admin" | "user";
    message: string;
    createdAt: string;
  };
  unreadCount: number;
  totalMessages: number;
};

type DashboardPayload = {
  metrics: Metric[];
  quotes: string[][];
  orders: string[][];
  ordersRaw: OrderRaw[];
  jobs: string[][];
  files: string[][];
  customers: string[][];
  printers: string[][];
  notifications: [string, string, string][];
  recentActivity: string[];
  analyticsCards: [string, string, string][];
  materialUsage: [string, string][];
  revenueTrend: number[];
  filesRaw: OrderRaw[];
  quotesRaw: QuoteRaw[];
  customersRaw: CustomerRaw[];
};

type DashboardResponse = {
  data?: DashboardPayload;
};

const navItems: { id: SectionId; label: string; icon: typeof Home }[] = [
  { id: "overview", label: "Overview", icon: Home },
  { id: "quotes", label: "Quote Requests", icon: ClipboardList },
  { id: "orders", label: "Orders", icon: Package },
  { id: "chats", label: "Chats", icon: MessageSquareText },
  { id: "jobs", label: "Print Jobs", icon: Printer },
  { id: "files", label: "Files", icon: FileBox },
  { id: "customers", label: "Customers", icon: Users },
  { id: "printers", label: "Printers", icon: Printer },
  { id: "analytics", label: "Analytics", icon: BarChart3 },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "settings", label: "Settings", icon: Settings },
];

const defaultPayload: DashboardPayload = {
  metrics: [],
  quotes: [],
  orders: [],
  ordersRaw: [],
  jobs: [],
  files: [],
  customers: [],
  printers: [],
  notifications: [],
  recentActivity: [],
  analyticsCards: [],
  materialUsage: [],
  revenueTrend: [],
  filesRaw: [],
  quotesRaw: [],
  customersRaw: [],
};

const statusTone = (status: string) => {
  const lower = status.toLowerCase();
  if (lower.includes("delivering")) return "bg-blue-500/15 text-blue-400 border-blue-500/30";
  if (lower.includes("awaiting") || lower.includes("pending") || lower.includes("new") || lower.includes("low") || lower.includes("review") || lower.includes("queued") || lower.includes("busy") || lower.includes("partial")) return "bg-secondary/15 text-secondary border-secondary/30";
  if (lower.includes("failed") || lower.includes("rejected") || lower.includes("offline") || lower.includes("danger")) return "bg-destructive/15 text-destructive border-destructive/30";
  if (lower.includes("completed")) return "bg-emerald-500/15 text-emerald-400 border-emerald-500/30";
  if (lower.includes("approved") || lower.includes("paid") || lower.includes("available") || lower.includes("in stock") || lower.includes("success") || lower.includes("info")) return "bg-primary/15 text-primary border-primary/30";
  return "bg-muted text-muted-foreground border-border";
};

const EmptyState = ({ text }: { text: string }) => (
  <div className="rounded-2xl border border-dashed border-border/50 bg-card/20 p-6 text-sm text-muted-foreground">{text}</div>
);

const formatDate = (value: string | Date) =>
  new Date(value).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

const formatCurrency = (value: number | string) =>
  new Intl.NumberFormat("en-IN", {
    maximumFractionDigits: 0,
  }).format(Math.round(Number(value) || 0));

const toOrderId = (order: OrderRaw) => {
  const created = new Date(order.createdAt);
  const year = created.getFullYear();
  return `ORD-${year}-${String(order._id).slice(-6).toUpperCase()}`;
};

const toCustomerOrdersPath = (customer: CustomerRaw | undefined, row: string[]) => {
  const id = String(customer?.email || row[3] || customer?._id || row[1] || "").trim();
  const mode = id.includes("@") ? "email" : customer?.isUser ? "user" : "name";
  return `/dashboard/customers/${mode}/${encodeURIComponent(id)}/orders`;
};

const DataTable = ({ headers, rows }: { headers: string[]; rows: string[][] }) => (
  <div className="overflow-x-auto rounded-2xl border border-border/50 bg-card/30">
    <table className="w-full min-w-[820px] text-sm">
      <thead className="bg-surface-elevated/70 text-muted-foreground">
        <tr>
          {headers.map((header) => (
            <th key={header} className="px-4 py-3 text-left font-medium whitespace-nowrap">{header}</th>
          ))}
          <th className="px-4 py-3 text-right font-medium">Actions</th>
        </tr>
      </thead>
      <tbody>
        {rows.length === 0 && (
          <tr className="border-t border-border/50">
            <td className="px-4 py-6 text-muted-foreground" colSpan={headers.length + 1}>
              No records yet. New data will appear here automatically.
            </td>
          </tr>
        )}
        {rows.map((row) => (
          <tr key={row[0]} className="border-t border-border/50 hover:bg-muted/30 transition-colors">
            {row.map((cell, index) => (
              <td key={`${row[0]}-${index}`} className="px-4 py-4 align-top">
                {index === row.length - 1 ? (
                  <Badge variant="outline" className={`${statusTone(cell)} whitespace-nowrap`}>{cell}</Badge>
                ) : (
                  <span className={index === 0 ? "font-medium text-foreground" : "text-muted-foreground"}>{cell}</span>
                )}
              </td>
            ))}
            <td className="px-4 py-4 text-right">
              <Button variant="ghost" size="icon" aria-label={`Actions for ${row[0]}`}>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

const Toolbar = ({ search, filters, primary, secondary, onPrimaryClick }: { search: string; filters: string[]; primary: string; secondary?: string; onPrimaryClick?: () => void }) => (
  <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[minmax(260px,1fr)_repeat(3,150px)]">
      <div className="relative">
        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
        <Input placeholder={search} className="pl-10 bg-card/70" />
      </div>
      {filters.map((filter) => (
        <Button key={filter} variant="outline" className="justify-start text-muted-foreground">{filter}</Button>
      ))}
    </div>
    <div className="flex flex-wrap gap-3">
      <Button variant="outline" className="gap-2">
        <Download className="h-4 w-4" /> Export
      </Button>
      {secondary && (
        <Button variant="outline" className="gap-2">
          <History className="h-4 w-4" /> {secondary}
        </Button>
      )}
      <Button className="gap-2 glow-primary" onClick={onPrimaryClick}>
        <Plus className="h-4 w-4" /> {primary}
      </Button>
    </div>
  </div>
);

const Panel = ({ title, description, children }: { title: string; description: string; children: ReactNode }) => (
  <Card className="glass border-border/40 rounded-2xl shadow-2xl shadow-black/20">
    <CardHeader>
      <CardTitle>{title}</CardTitle>
      <CardDescription>{description}</CardDescription>
    </CardHeader>
    <CardContent className="space-y-5">{children}</CardContent>
  </Card>
);

const LinkFileModal = ({ orderId, open, onClose, onSuccess, backendUrl, ordersRaw }: any) => {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(orderId);

  useEffect(() => {
    setSelectedOrderId(orderId);
  }, [orderId]);

  const handleUpload = async () => {
    if (!file || !selectedOrderId) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const uploadRes = await axios.post(`${backendUrl}/api/v1/upload`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
        withCredentials: true,
      });

      const { fileName, fileId, webViewLink } = uploadRes.data.data;

      await axios.post(`${backendUrl}/api/v1/orders/${selectedOrderId}/file`, {
        fileName,
        gdriveFileId: fileId,
        gdriveLink: webViewLink
      }, { withCredentials: true });

      onSuccess();
    } catch (err) {
      console.error(err);
    } finally {
      setUploading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(val) => !val && onClose()}>
      <DialogContent className="bg-card border-border/60">
        <DialogHeader>
          <DialogTitle>{orderId ? "Attach File to Order" : "Upload and Link File"}</DialogTitle>
          <DialogDescription>
            Choose a file to upload and link it to an existing order.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Select Order</label>
            <Select value={selectedOrderId || ""} onValueChange={setSelectedOrderId} disabled={!!orderId}>
              <SelectTrigger className="bg-card/70 border-border/40">
                <SelectValue placeholder="Select an order..." />
              </SelectTrigger>
              <SelectContent className="bg-card border-border/60 max-h-[200px]">
                {ordersRaw.map((order: any) => {
                  const id = `ORD-${new Date(order.createdAt).getFullYear()}-${String(order._id).slice(-6).toUpperCase()}`;
                  return (
                    <SelectItem key={order._id} value={order._id}>
                      {id} - {order.customerName} ({order.fileName || "No File"})
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">File</label>
            <div className={`relative flex flex-col items-center justify-center rounded-xl border-2 border-dashed transition-all ${file ? "border-primary/50 bg-primary/5" : "border-border/50 hover:border-primary/30"}`}>
              <Input
                type="file"
                className="absolute inset-0 z-10 h-full w-full cursor-pointer opacity-0"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
              />
              <div className="flex flex-col items-center gap-2 p-6">
                <Upload className={`h-8 w-8 ${file ? "text-primary" : "text-muted-foreground"}`} />
                {file ? (
                  <div className="text-center">
                    <p className="text-sm font-medium text-foreground">{file.name}</p>
                    <p className="text-xs text-muted-foreground">{(file.size / 1024).toFixed(1)} KB</p>
                  </div>
                ) : (
                  <div className="text-center">
                    <p className="text-sm font-medium text-muted-foreground">Click or drag to upload</p>
                    <p className="text-xs text-muted-foreground">STL, OBJ, STEP, or PDF</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={uploading}>Cancel</Button>
          <Button className="glow-primary" onClick={handleUpload} disabled={!file || !selectedOrderId || uploading}>
            {uploading ? "Uploading..." : "Upload & Link"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

const Dashboard = () => {
  const [active, setActive] = useState<SectionId>("overview");
  const [dashboard, setDashboard] = useState<DashboardPayload>(defaultPayload);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<OrderRaw>>({});
  const [saving, setSaving] = useState(false);

  // Dialog state
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; label: string } | null>(null);
  const [rejectTarget, setRejectTarget] = useState<{ id: string; label: string } | null>(null);
  const [deleteFileTarget, setDeleteFileTarget] = useState<{ id: string; fileName: string } | null>(null);
  const [linkFileOrderId, setLinkFileOrderId] = useState<string | null>(null);
  const [chatTarget, setChatTarget] = useState<{ id: string; label: string } | null>(null);
  const [chatSummaries, setChatSummaries] = useState<ChatSummary[]>([]);
  const [rejectReason, setRejectReason] = useState("");
  const [paid, setPaid] = useState(false);

  // Quote states
  const [expandedQuoteId, setExpandedQuoteId] = useState<string | null>(null);
  const [showCreateQuote, setShowCreateQuote] = useState(false);
  const [deleteQuoteTarget, setDeleteQuoteTarget] = useState<{ id: string; label: string } | null>(null);
  const [quoteChatTarget, setQuoteChatTarget] = useState<{ id: string; label: string } | null>(null);
  const [createQuoteForm, setCreateQuoteForm] = useState<Partial<QuoteRaw>>({
    name: "",
    email: "",
    projectDescription: "",
    budget: "",
    technicalSpecifications: "",
  });

  const [showCreateOrder, setShowCreateOrder] = useState(false);
  const [expandedFileId, setExpandedFileId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [createForm, setCreateForm] = useState<Partial<OrderRaw>>({
    material: "pla",
    quality: "standard",
    quantity: 1,
    dimensions: { x: 50, y: 50, z: 50 } as any,
    estimatedWeight: 10,
    estimatedTotal: 250,
    customerName: "",
    gdriveLink: "",
  });

  const [showCreateCustomer, setShowCreateCustomer] = useState(false);
  const [createCustomerForm, setCreateCustomerForm] = useState({
    name: "",
    email: "",
    company: "Individual",
    phone: "",
    type: "Individual",
  });

  // Filter state
  const [orderSearch, setOrderSearch] = useState("");
  const [orderStatusFilter, setOrderStatusFilter] = useState("all");
  const [paymentStatusFilter, setPaymentStatusFilter] = useState("all");
  const [quoteSearch, setQuoteSearch] = useState("");
  const [quoteStatusFilter, setQuoteStatusFilter] = useState("all");

  const backendUrl = import.meta.env.VITE_BACKEND_URL;
  const activeLabel = useMemo(() => navItems.find((item) => item.id === active)?.label ?? "Overview", [active]);

  const fetchDashboard = async () => {
    try {
      const response = await axios.get<DashboardResponse>(`${backendUrl}/api/v1/orders/dashboard`, { withCredentials: true });
      setDashboard(response.data?.data ?? defaultPayload);
      setError(null);
    } catch (_err: any) {
      const detailedError = _err.response?.data?.error || _err.response?.data?.message || "Could not load live dashboard data.";
      setError(detailedError);
    } finally {
      setLoading(false);
    }
  };

  const fetchChatSummaries = useCallback(async () => {
    try {
      const response = await axios.get(`${backendUrl}/api/v1/orders/chat-summaries`, { withCredentials: true });
      setChatSummaries(response.data?.data || []);
    } catch {
      // Chat summaries update opportunistically and should not block dashboard operations.
    }
  }, [backendUrl]);

  const getUnreadCount = useCallback((orderId: string) => {
    return chatSummaries.find((chat) => chat.orderId === orderId)?.unreadCount || 0;
  }, [chatSummaries]);

  const handleMarkAllChatsRead = useCallback(async () => {
    const unreadChats = chatSummaries.filter((chat) => chat.unreadCount > 0);
    if (unreadChats.length === 0) return;

    await Promise.all(
      unreadChats.map((chat) =>
        axios.post(`${backendUrl}/api/v1/orders/${chat.orderId}/chat/read`, {}, { withCredentials: true })
      )
    );
    await fetchChatSummaries();
  }, [backendUrl, chatSummaries, fetchChatSummaries]);

  const filteredOrderIndices = useMemo(() => {
    const indices: number[] = [];
    dashboard.orders.forEach((row, i) => {
      const raw = dashboard.ordersRaw?.[i];
      if (!raw) return;
      // Search filter
      if (orderSearch) {
        const q = orderSearch.toLowerCase();
        const match = row.some((cell) => cell.toLowerCase().includes(q));
        if (!match) return;
      }
      // Order status filter
      if (orderStatusFilter !== "all") {
        const actualStatus = raw.orderStatus || "new";
        if (actualStatus !== orderStatusFilter) return;
      }
      // Payment status filter
      if (paymentStatusFilter !== "all") {
        if (paymentStatusFilter === "paid" && !raw.paid) return;
        if (paymentStatusFilter === "pending" && raw.paid) return;
        if (paymentStatusFilter === "failed" && raw.paymentStatus !== "failed") return;
      }
      indices.push(i);
    });
    return indices;
  }, [dashboard.orders, dashboard.ordersRaw, orderSearch, orderStatusFilter, paymentStatusFilter]);

  const filteredQuotes = useMemo(() => {
    return (dashboard.quotesRaw || []).filter((quote) => {
      if (quoteStatusFilter !== "all" && quote.status !== quoteStatusFilter) return false;
      if (!quoteSearch.trim()) return true;
      const query = quoteSearch.toLowerCase();
      return [
        quote._id,
        quote.name,
        quote.email,
        quote.budget,
        quote.projectDescription,
        quote.technicalSpecifications,
        quote.source,
      ].some((value) => String(value || "").toLowerCase().includes(query));
    });
  }, [dashboard.quotesRaw, quoteSearch, quoteStatusFilter]);

  const handleExpandOrder = useCallback((order: OrderRaw) => {
    if (expandedOrderId === order._id) {
      setExpandedOrderId(null);
      setEditForm({});
      return;
    }
    setExpandedOrderId(order._id);
    setEditForm({
      material: order.material,
      quality: order.quality,
      quantity: order.quantity,
      customerName: order.customerName,
      estimatedTotal: order.estimatedTotal,
    });
  }, [expandedOrderId]);

  const handleUpdateOrder = useCallback(async (orderId: string) => {
    setSaving(true);
    try {
      await axios.put(`${backendUrl}/api/v1/orders/${orderId}`, editForm, { withCredentials: true });
      await fetchDashboard();
      setExpandedOrderId(null);
      setEditForm({});
    } catch (_err) {
      setError("Failed to update order.");
    } finally {
      setSaving(false);
    }
  }, [editForm, backendUrl]);

  const handlePaidToggle = useCallback(async (orderId: string) => {
    try {
      await axios.patch(`${backendUrl}/api/v1/orders/${orderId}/paid`, {}, { withCredentials: true });
      await fetchDashboard();
    } catch (_err) {
      setError("Failed to mark order as paid.");
    } finally {
      setPaid(false);
    }
  }, [paid, backendUrl]);

  const handleDeleteOrder = useCallback(async () => {
    if (!deleteTarget) return;
    try {
      await axios.delete(`${backendUrl}/api/v1/orders/${deleteTarget.id}`, { withCredentials: true });
      await fetchDashboard();
      if (expandedOrderId === deleteTarget.id) {
        setExpandedOrderId(null);
        setEditForm({});
      }
    } catch (_err) {
      setError("Failed to delete order.");
    } finally {
      setDeleteTarget(null);
    }
  }, [backendUrl, expandedOrderId, deleteTarget]);

  const handleDeleteFile = useCallback(async () => {
    if (!deleteFileTarget) return;
    try {
      await axios.delete(`${backendUrl}/api/v1/orders/${deleteFileTarget.id}/file`, { withCredentials: true });
      await fetchDashboard();
      if (expandedFileId === deleteFileTarget.id) {
        setExpandedFileId(null);
      }
    } catch (_err) {
      setError("Failed to delete file.");
    } finally {
      setDeleteFileTarget(null);
    }
  }, [backendUrl, expandedFileId, deleteFileTarget]);

  const handleStatusAction = useCallback(async (orderId: string, action: "approve" | "delivering" | "complete") => {
    try {
      await axios.patch(`${backendUrl}/api/v1/orders/${orderId}/${action}`, {}, { withCredentials: true });
      await fetchDashboard();
    } catch (err: any) {
      setError(err.response?.data?.message || `Failed to ${action} order.`);
    }
  }, [backendUrl]);

  const handleRejectOrder = useCallback(async () => {
    if (!rejectTarget) return;
    try {
      await axios.patch(`${backendUrl}/api/v1/orders/${rejectTarget.id}/reject`, { rejectionReason: rejectReason }, { withCredentials: true });
      await fetchDashboard();
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to reject order.");
    } finally {
      setRejectTarget(null);
      setRejectReason("");
    }
  }, [backendUrl, rejectTarget, rejectReason]);

  const handleCreateOrder = useCallback(async () => {
    setCreating(true);
    try {
      await axios.post(`${backendUrl}/api/v1/orders`, createForm, {
        withCredentials: true,
      });
      await fetchDashboard();
      setShowCreateOrder(false);
      setCreateForm({
        material: "pla",
        quality: "standard",
        quantity: 1,
        dimensions: { x: 50, y: 50, z: 50 } as any,
        estimatedWeight: 10,
        estimatedTotal: 250,
        customerName: "",
        gdriveLink: "",
      });
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to create order.");
    } finally {
      setCreating(false);
    }
  }, [createForm, backendUrl]);

  const handleCreateQuote = useCallback(async () => {
    setCreating(true);
    try {
      await axios.post(`${backendUrl}/api/v1/quotes`, createQuoteForm, { withCredentials: true });
      await fetchDashboard();
      setShowCreateQuote(false);
      setCreateQuoteForm({
        name: "",
        email: "",
        projectDescription: "",
        budget: "",
        technicalSpecifications: "",
      });
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to create quote.");
    } finally {
      setCreating(false);
    }
  }, [createQuoteForm, backendUrl]);

  const handleUpdateQuoteStatus = useCallback(async (quoteId: string, status: string) => {
    try {
      await axios.patch(`${backendUrl}/api/v1/quotes/${quoteId}/status`, { status }, { withCredentials: true });
      await fetchDashboard();
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to update quote status.");
    }
  }, [backendUrl]);

  const handleDeleteQuote = useCallback(async () => {
    if (!deleteQuoteTarget) return;
    try {
      await axios.delete(`${backendUrl}/api/v1/quotes/${deleteQuoteTarget.id}`, { withCredentials: true });
      await fetchDashboard();
      if (expandedQuoteId === deleteQuoteTarget.id) {
        setExpandedQuoteId(null);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to delete quote.");
    } finally {
      setDeleteQuoteTarget(null);
    }
  }, [backendUrl, deleteQuoteTarget, expandedQuoteId]);

  const handleCreateCustomer = useCallback(async () => {
    setCreating(true);
    try {
      await axios.post(`${backendUrl}/api/v1/customers`, createCustomerForm, { withCredentials: true });
      await fetchDashboard();
      setShowCreateCustomer(false);
      setCreateCustomerForm({
        name: "",
        email: "",
        company: "Individual",
        phone: "",
        type: "Individual",
      });
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to create customer.");
    } finally {
      setCreating(false);
    }
  }, [createCustomerForm, backendUrl]);

  useEffect(() => {
    fetchDashboard();
    fetchChatSummaries();
    const socket: Socket = io(backendUrl, {
      transports: ["websocket", "polling"],
      withCredentials: true,
    });

    const handleDashboardEvent = (payload: { dashboard?: DashboardPayload }) => {
      if (payload?.dashboard) {
        setDashboard(payload.dashboard);
        return;
      }
      fetchDashboard();
    };

    socket.on("order:created", handleDashboardEvent);
    socket.on("order:paid", handleDashboardEvent);
    socket.on("order:payment_failed", handleDashboardEvent);
    socket.on("order:updated", handleDashboardEvent);
    socket.on("order:deleted", handleDashboardEvent);
    socket.on("chat:message", fetchChatSummaries);
    socket.on("chat:read", fetchChatSummaries);

    socket.on("connect_error", () => {
      setError((prev) => prev ?? "Realtime channel unavailable. Showing latest fetched data.");
    });

    return () => {
      socket.disconnect();
    };
  }, [backendUrl, fetchChatSummaries]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="fixed inset-0 gradient-mesh pointer-events-none" />
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-72 border-r border-border/60 bg-surface-glass/85 backdrop-blur-2xl lg:block">
        <div className="flex h-full flex-col">
          <Link to="/#home" className="px-6 py-6 flex items-center" aria-label="Destny home">
            <img src={destnyLogo} alt="Destny" className="h-9 w-auto object-contain" width={941} height={277} />
          </Link>
          <nav className="flex-1 space-y-1 px-3">
            {navItems.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActive(id)}
                className={`flex w-full items-center gap-3 rounded-xl border px-3 py-2.5 text-sm transition-all ${active === id
                    ? "border-primary/40 bg-primary/15 text-primary shadow-lg shadow-primary/10"
                    : "border-transparent text-muted-foreground hover:border-border/50 hover:bg-muted/50 hover:text-foreground"
                  }`}
              >
                <Icon className="h-4 w-4" />
                {label}
              </button>
            ))}
          </nav>
          <div className="p-4">
            <Link to="/">
              <Button variant="outline" className="w-full gap-2">
                <LogOut className="h-4 w-4" /> Back to Site
              </Button>
            </Link>
          </div>
        </div>
      </aside>

      <main className="relative z-10 lg:pl-72">
        <header className="sticky top-0 z-30 border-b border-border/60 bg-surface-glass/80 backdrop-blur-2xl">
          <div className="flex flex-col gap-4 px-5 py-4 lg:flex-row lg:items-center lg:justify-between lg:px-8">
            <div className="flex items-center justify-between gap-4">
              <div className="lg:hidden">
                <img src={destnyLogo} alt="Destny" className="h-7 w-auto" width={941} height={277} />
              </div>
              <div>
                <p className="text-sm font-medium text-primary tracking-widest uppercase">Operations</p>
                <h1 className="font-display text-2xl sm:text-3xl font-bold">{activeLabel}</h1>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="relative min-w-0 flex-1 lg:w-80">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search orders, customers..." className="pl-10 bg-card/70" />
              </div>
              <Button variant="outline" size="icon" aria-label="Open notifications" onClick={() => setActive("notifications")}>
                <Bell className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <div className="flex gap-2 overflow-x-auto px-5 pb-4 lg:hidden">
            {navItems.map(({ id, label }) => (
              <Button key={id} onClick={() => setActive(id)} variant={active === id ? "default" : "outline"} size="sm" className="shrink-0">
                {label}
              </Button>
            ))}
          </div>
        </header>

        <div className="space-y-6 px-5 py-6 lg:px-8">
          {loading && <EmptyState text="Loading dashboard data..." />}
          {error && <EmptyState text={error} />}

          {active === "overview" && !loading && (
            <>
              <section>
                <p className="text-muted-foreground">Your business at a glance. Track orders and revenue with live updates.</p>
                <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  {dashboard.metrics.map((metric) => (
                    <Card key={metric.label} className="glass border-border/40 rounded-2xl hover:border-primary/30 transition-colors">
                      <CardHeader className="pb-3">
                        <CardDescription>{metric.label}</CardDescription>
                        <CardTitle className="text-3xl">{metric.value}</CardTitle>
                      </CardHeader>
                      <CardContent className="flex items-end justify-between gap-4">
                        <p className="text-sm text-muted-foreground">{metric.detail}</p>
                        <Badge className="shrink-0">{metric.action}</Badge>
                      </CardContent>
                    </Card>
                  ))}
                </div>
                {dashboard.metrics.length === 0 && <EmptyState text="No metrics yet. Place an order to populate live dashboard stats." />}
              </section>

              <section className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
                <Panel title="Printer Status" description="Printers with active queue from live jobs feed.">
                  {dashboard.printers.length > 0 ? (
                    <div className="grid gap-3 sm:grid-cols-2">
                      {dashboard.printers.map((printer) => (
                        <div key={printer[0]} className="rounded-2xl border border-border/50 bg-card/30 p-4">
                          <div className="flex items-center justify-between gap-3">
                            <div>
                              <p className="font-medium">{printer[1]}</p>
                              <p className="text-xs text-muted-foreground">{printer[2]}</p>
                            </div>
                            <Badge variant="outline" className={statusTone(printer[5])}>{printer[5]}</Badge>
                          </div>
                          <p className="mt-3 text-sm text-muted-foreground">Queue: {printer[6]}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <EmptyState text="No printer telemetry connected yet." />
                  )}
                </Panel>

                <Panel title="Operational Alerts" description="Realtime alerts from order and payment events.">
                  {dashboard.notifications.length > 0 ? (
                    <div className="space-y-3">
                      {dashboard.notifications.slice(0, 4).map(([title, body, tone]) => (
                        <div key={`${title}-${body}`} className="flex flex-col gap-2 rounded-2xl border border-border/50 bg-card/30 p-4">
                          <div className="flex items-center gap-2">
                            <AlertTriangle className={`h-4 w-4 ${tone === "danger" ? "text-destructive" : tone === "warning" ? "text-secondary" : "text-primary"}`} />
                            <span className="font-medium">{title}</span>
                          </div>
                          <p className="text-sm text-muted-foreground">{body}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <EmptyState text="No alerts at the moment." />
                  )}
                </Panel>
              </section>

              <Panel title="Recent Activity" description="Latest order and workflow events.">
                <div className="space-y-3">
                  {dashboard.recentActivity.map((activity) => (
                    <div key={activity} className="flex items-center gap-3 rounded-2xl bg-muted/40 px-4 py-3 text-sm">
                      <CheckCircle2 className="h-4 w-4 text-primary" />
                      {activity}
                    </div>
                  ))}
                  {dashboard.recentActivity.length === 0 && <EmptyState text="No activity yet." />}
                </div>
              </Panel>
            </>
          )}

          {active === "quotes" && (
            <Panel title="Quote Requests" description="Manage and review incoming customer quotation requests.">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[minmax(260px,1fr)_160px_160px]">
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search customer or quote ID..."
                      className="pl-10 bg-card/70"
                      value={quoteSearch}
                      onChange={(e) => setQuoteSearch(e.target.value)}
                    />
                  </div>
                  <Select value={quoteStatusFilter} onValueChange={setQuoteStatusFilter}>
                    <SelectTrigger className="bg-card/70"><SelectValue placeholder="Status" /></SelectTrigger>
                    <SelectContent className="bg-card border-border/60">
                      <SelectItem value="all">All Statuses</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="under review">Under Review</SelectItem>
                      <SelectItem value="accepted">Accepted</SelectItem>
                      <SelectItem value="in production">In Production</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="rejected">Rejected</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex flex-wrap gap-3">
                  <Button variant="outline" className="gap-2"><Download className="h-4 w-4" /> Export</Button>
                  <Button className="gap-2 glow-primary" onClick={() => setShowCreateQuote(true)}><Plus className="h-4 w-4" /> Create Quote</Button>
                </div>
              </div>

              <div className="overflow-x-auto rounded-2xl border border-border/50 bg-card/30">
                <table className="w-full min-w-[820px] text-sm">
                  <thead className="bg-surface-elevated/70 text-muted-foreground">
                    <tr>
                      <th className="px-4 py-3 text-left font-medium">Quote ID</th>
                      <th className="px-4 py-3 text-left font-medium">Customer</th>
                      <th className="px-4 py-3 text-left font-medium">Budget</th>
                      <th className="px-4 py-3 text-left font-medium">Date</th>
                      <th className="px-4 py-3 text-left font-medium">Status</th>
                      <th className="px-4 py-3 text-right font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredQuotes.length === 0 && (
                      <tr className="border-t border-border/50">
                        <td className="px-4 py-6 text-muted-foreground text-center" colSpan={6}>
                          {dashboard.quotesRaw?.length === 0 ? "No quote requests found." : "No quote requests match the current filters."}
                        </td>
                      </tr>
                    )}
                    {filteredQuotes.map((quote) => {
                      const isExpanded = expandedQuoteId === quote._id;
                      const quoteLabel = `QUOTE-${String(quote._id).slice(-4).toUpperCase()}`;
                      
                      return (
                        <>
                          <tr 
                            key={quote._id} 
                            className={`border-t border-border/50 transition-colors cursor-pointer ${isExpanded ? "bg-primary/5" : "hover:bg-muted/30"}`}
                            onClick={() => setExpandedQuoteId(isExpanded ? null : quote._id)}
                          >
                            <td className="px-4 py-4 font-medium text-foreground">{quoteLabel}</td>
                            <td className="px-4 py-4 text-muted-foreground">
                              <div>{quote.name}</div>
                              <div className="text-xs">{quote.email}</div>
                            </td>
                            <td className="px-4 py-4 text-muted-foreground">{quote.budget}</td>
                            <td className="px-4 py-4 text-muted-foreground">{formatDate(quote.createdAt)}</td>
                            <td className="px-4 py-4">
                              <Badge variant="outline" className={statusTone(quote.status)}>{quote.status.toUpperCase()}</Badge>
                            </td>
                            <td className="px-4 py-4 text-right">
                              <div className="flex items-center justify-end gap-2">
                                {isExpanded ? <ChevronUp className="h-4 w-4 text-primary" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon" onClick={(e) => e.stopPropagation()}>
                                      <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end" className="bg-card border-border/60 min-w-[160px]">
                                    <DropdownMenuItem className="gap-2 cursor-pointer" onClick={(e) => { e.stopPropagation(); setQuoteChatTarget({ id: quote._id, label: quoteLabel }); }}>
                                      <MessageSquareText className="h-4 w-4 text-primary" /> Chat
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    {quote.status === "pending" && (
                                      <DropdownMenuItem className="gap-2 cursor-pointer" onClick={(e) => { e.stopPropagation(); handleUpdateQuoteStatus(quote._id, "under review"); }}>
                                        <CheckCircle2 className="h-4 w-4" /> Mark Under Review
                                      </DropdownMenuItem>
                                    )}
                                    {quote.status === "under review" && (
                                      <DropdownMenuItem className="gap-2 cursor-pointer" onClick={(e) => { e.stopPropagation(); handleUpdateQuoteStatus(quote._id, "accepted"); }}>
                                        <CheckCircle2 className="h-4 w-4" /> Mark Accepted
                                      </DropdownMenuItem>
                                    )}
                                    {quote.status === "under review" && (
                                      <DropdownMenuItem className="gap-2 cursor-pointer" onClick={(e) => { e.stopPropagation(); handleUpdateQuoteStatus(quote._id, "rejected"); }}>
                                        <CheckCircle2 className="h-4 w-4" /> Mark Rejected
                                      </DropdownMenuItem>
                                    )}
                                    {quote.status === "accepted" && (
                                      <DropdownMenuItem className="gap-2 cursor-pointer" onClick={(e) => { e.stopPropagation(); handleUpdateQuoteStatus(quote._id, "in production"); }}>
                                        <CheckCircle2 className="h-4 w-4" /> Mark In Production
                                      </DropdownMenuItem>
                                    )}
                                    {/* <DropdownMenuSeparator /> */}
                                    {quote.status === "in production" && (
                                      <DropdownMenuItem className="gap-2 cursor-pointer" onClick={(e) => { e.stopPropagation(); handleUpdateQuoteStatus(quote._id, "completed"); }}>
                                        <CheckCircle2 className="h-4 w-4" /> Mark Completed
                                      </DropdownMenuItem>
                                    )}
                                    <DropdownMenuItem className="gap-2 cursor-pointer text-destructive focus:text-destructive focus:bg-destructive/10" onClick={(e) => { e.stopPropagation(); setDeleteQuoteTarget({ id: quote._id, label: quoteLabel }); }}>
                                      <Trash2 className="h-4 w-4" /> Delete Quote
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </div>
                            </td>
                          </tr>
                          {isExpanded && (
                            <tr className="bg-primary/5 border-b border-border/50">
                              <td colSpan={6} className="px-4 pb-6 pt-2">
                                <div className="grid gap-6 rounded-2xl bg-card/40 p-4 border border-border/30 sm:grid-cols-2">
                                  <div className="space-y-3">
                                    <div className="space-y-1">
                                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Project Description</p>
                                      <p className="text-sm leading-relaxed">{quote.projectDescription}</p>
                                    </div>
                                    {quote.technicalSpecifications && (
                                      <div className="space-y-1">
                                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Technical Specs</p>
                                        <p className="text-sm italic">{quote.technicalSpecifications}</p>
                                      </div>
                                    )}
                                  </div>
                                  <div className="space-y-3">
                                    <div className="space-y-1">
                                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Submission Details</p>
                                      <p className="text-sm">Source: <span className="text-primary">{quote.source}</span></p>
                                      <p className="text-sm">Budget: {quote.budget}</p>
                                    </div>
                                    <div className="flex gap-2">
                                      <Button size="sm" variant="outline" className="gap-2" onClick={() => setQuoteChatTarget({ id: quote._id, label: quoteLabel })}>
                                        <MessageSquareText className="h-4 w-4" /> Chat
                                      </Button>
                                      <Button size="sm" variant="outline" className="gap-2" onClick={() => window.open(`mailto:${quote.email}`)}>
                                        Reply via Email
                                      </Button>
                                    </div>
                                  </div>
                                </div>
                              </td>
                            </tr>
                          )}
                        </>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </Panel>
          )}

          {active === "orders" && (
            <Panel title="Order Management" description="Track and manage customer orders throughout their lifecycle.">
              {/* Filters toolbar */}
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[minmax(260px,1fr)_160px_160px]">
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input placeholder="Search customer or order ID..." className="pl-10 bg-card/70" value={orderSearch} onChange={(e) => setOrderSearch(e.target.value)} />
                  </div>
                  <Select value={orderStatusFilter} onValueChange={setOrderStatusFilter}>
                    <SelectTrigger className="bg-card/70"><SelectValue placeholder="Order Status" /></SelectTrigger>
                    <SelectContent className="bg-card border-border/60">
                      <SelectItem value="all">All Statuses</SelectItem>
                      <SelectItem value="new">Under Review</SelectItem>
                      <SelectItem value="approved">Approved</SelectItem>
                      <SelectItem value="rejected">Rejected</SelectItem>
                      <SelectItem value="delivering">Delivering</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={paymentStatusFilter} onValueChange={setPaymentStatusFilter}>
                    <SelectTrigger className="bg-card/70"><SelectValue placeholder="Payment Status" /></SelectTrigger>
                    <SelectContent className="bg-card border-border/60">
                      <SelectItem value="all">All Payments</SelectItem>
                      <SelectItem value="paid">Paid</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="failed">Failed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex flex-wrap gap-3">
                  <Button variant="outline" className="gap-2"><Download className="h-4 w-4" /> Export</Button>
                  <Button className="gap-2 glow-primary" onClick={() => setShowCreateOrder(true)}><Plus className="h-4 w-4" /> Create Order</Button>
                </div>
              </div>
              {/* Orders Table */}
              <div className="overflow-x-auto rounded-2xl border border-border/50 bg-card/30">
                <table className="w-full min-w-[820px] text-sm">
                  <thead className="bg-surface-elevated/70 text-muted-foreground">
                    <tr>
                      {["Order ID", "Customer", "Material", "Qty", "Deadline", "Total", "Payment", "Status"].map((header) => (
                        <th key={header} className="px-4 py-3 text-left font-medium whitespace-nowrap">{header}</th>
                      ))}
                      <th className="px-4 py-3 text-right font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredOrderIndices.length === 0 && (
                      <tr className="border-t border-border/50">
                        <td className="px-4 py-6 text-muted-foreground" colSpan={9}>
                          {dashboard.orders.length === 0 ? "No records yet. New data will appear here automatically." : "No orders match the current filters."}
                        </td>
                      </tr>
                    )}
                    {filteredOrderIndices.map((rowIndex) => {
                      const row = dashboard.orders[rowIndex];
                      const rawOrder = dashboard.ordersRaw?.[rowIndex];
                      const isExpanded = rawOrder && expandedOrderId === rawOrder._id;
                      const orderLabel = row[0];
                      const os = rawOrder?.orderStatus || "new";
                      return (
                        <>
                          <tr
                            key={orderLabel}
                            className={`border-t border-border/50 transition-colors cursor-pointer ${isExpanded ? "bg-primary/5 border-l-2 border-l-primary" : "hover:bg-muted/30"
                              }`}
                            onClick={() => rawOrder && handleExpandOrder(rawOrder)}
                          >
                            {row.map((cell, index) => (
                              <td key={`${orderLabel}-${index}`} className="px-4 py-4 align-top">
                                {index === row.length - 1 ? (
                                  <Badge variant="outline" className={`${statusTone(cell)} whitespace-nowrap`}>{cell}</Badge>
                                ) : index === 0 && rawOrder ? (
                                  <span className="flex items-center gap-2 font-medium text-foreground">
                                    {cell}
                                    {getUnreadCount(rawOrder._id) > 0 && (
                                      <span className="inline-flex items-center gap-1 rounded-full border border-destructive/30 bg-destructive/10 px-2 py-0.5 text-[10px] font-bold text-destructive">
                                        <MessageSquareText className="h-3 w-3" />
                                        {getUnreadCount(rawOrder._id)}
                                      </span>
                                    )}
                                  </span>
                                ) : (
                                  <span className={index === 0 ? "font-medium text-foreground" : "text-muted-foreground"}>{cell}</span>
                                )}
                              </td>
                            ))}
                            <td className="px-4 py-4 text-right">
                              <div className="flex items-center justify-end gap-2">
                                {isExpanded ? <ChevronUp className="h-4 w-4 text-primary" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon" aria-label={`Actions for ${orderLabel}`} onClick={(e) => e.stopPropagation()}>
                                      <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end" className="bg-card border-border/60 min-w-[180px]">
                                    <DropdownMenuItem className="cursor-pointer gap-2" onClick={(e) => { e.stopPropagation(); if (rawOrder) setChatTarget({ id: rawOrder._id, label: orderLabel }); }}>
                                      <MessageSquareText className="h-4 w-4 text-primary" /> Chat with User
                                    </DropdownMenuItem>
                                    {os === "new" && (
                                      <DropdownMenuItem className="cursor-pointer gap-2" onClick={(e) => { e.stopPropagation(); if (rawOrder) handleStatusAction(rawOrder._id, "approve"); }}>
                                        <CheckCircle2 className="h-4 w-4 text-emerald-400" /> Approve
                                      </DropdownMenuItem>
                                    )}
                                    {(os === "new" || os === "approved") && (
                                      <DropdownMenuItem className="cursor-pointer gap-2" onClick={(e) => { e.stopPropagation(); if (rawOrder) setRejectTarget({ id: rawOrder._id, label: orderLabel }); }}>
                                        <Ban className="h-4 w-4 text-destructive" /> Reject
                                      </DropdownMenuItem>
                                    )}
                                    {rawOrder?.paid && os !== "delivering" && os !== "completed" && (
                                      <DropdownMenuItem className="cursor-pointer gap-2" onClick={(e) => { e.stopPropagation(); if (rawOrder) handleStatusAction(rawOrder._id, "delivering"); }}>
                                        <Truck className="h-4 w-4 text-blue-400" /> Mark Delivering
                                      </DropdownMenuItem>
                                    )}
                                    {rawOrder?.paid && os !== "completed" && (
                                      <DropdownMenuItem className="cursor-pointer gap-2" onClick={(e) => { e.stopPropagation(); if (rawOrder) handleStatusAction(rawOrder._id, "complete"); }}>
                                        <CheckCheck className="h-4 w-4 text-emerald-400" /> Mark Completed
                                      </DropdownMenuItem>
                                    )}
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem
                                      className="text-destructive focus:text-destructive focus:bg-destructive/10 cursor-pointer gap-2"
                                      onClick={(e) => { e.stopPropagation(); if (rawOrder) setDeleteTarget({ id: rawOrder._id, label: orderLabel }); }}
                                    >
                                      <Trash2 className="h-4 w-4" /> Delete Order
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </div>
                            </td>
                          </tr>
                          {isExpanded && rawOrder && (
                            <tr key={`${orderLabel}-edit`} className="border-t border-primary/20">
                              <td colSpan={9} className="p-0">
                                <div className="bg-primary/[0.03] border-l-2 border-l-primary px-6 py-5 animate-in slide-in-from-top-2 duration-200">
                                  <div className="flex items-center justify-between mb-4">
                                    <h3 className="font-display font-semibold text-foreground flex items-center gap-2">
                                      Edit Order — <span className="text-primary">{orderLabel}</span>
                                      <span className="text-xs font-normal text-muted-foreground ml-2 border border-border/50 bg-card/50 px-2 py-0.5 rounded-md hidden sm:inline-block">
                                        {rawOrder.createdAt ? new Date(rawOrder.createdAt).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' }) : ""}
                                      </span>
                                    </h3>
                                    <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); setExpandedOrderId(null); setEditForm({}); }} aria-label="Close edit panel">
                                      <X className="h-4 w-4" />
                                    </Button>
                                  </div>
                                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                                    <div className="space-y-1.5">
                                      <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Customer Name</label>
                                      <Input value={editForm.customerName ?? ""} onChange={(e) => setEditForm((prev) => ({ ...prev, customerName: e.target.value }))} className="bg-card/70" onClick={(e) => e.stopPropagation()} />
                                    </div>
                                    <div className="space-y-1.5">
                                      <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Material</label>
                                      <Select value={editForm.material ?? ""} onValueChange={(val) => setEditForm((prev) => ({ ...prev, material: val }))}>
                                        <SelectTrigger className="bg-card/70" onClick={(e) => e.stopPropagation()}><SelectValue /></SelectTrigger>
                                        <SelectContent className="bg-card border-border/60">
                                          <SelectItem value="pla">PLA</SelectItem>
                                          <SelectItem value="abs">ABS</SelectItem>
                                          <SelectItem value="petg">PETG</SelectItem>
                                        </SelectContent>
                                      </Select>
                                    </div>
                                    <div className="space-y-1.5">
                                      <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Quality</label>
                                      <Select value={editForm.quality ?? ""} onValueChange={(val) => setEditForm((prev) => ({ ...prev, quality: val }))}>
                                        <SelectTrigger className="bg-card/70" onClick={(e) => e.stopPropagation()}><SelectValue /></SelectTrigger>
                                        <SelectContent className="bg-card border-border/60">
                                          <SelectItem value="draft">Draft</SelectItem>
                                          <SelectItem value="standard">Standard</SelectItem>
                                          <SelectItem value="high">High</SelectItem>
                                          <SelectItem value="rush">Rush</SelectItem>
                                        </SelectContent>
                                      </Select>
                                    </div>
                                    <div className="space-y-1.5">
                                      <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Quantity</label>
                                      <Input type="number" min={1} value={editForm.quantity ?? 1} onChange={(e) => setEditForm((prev) => ({ ...prev, quantity: Number(e.target.value) }))} className="bg-card/70" onClick={(e) => e.stopPropagation()} />
                                    </div>
                                    <div className="space-y-1.5">
                                      <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Estimated Total (₹)</label>
                                      <Input type="number" min={0} value={editForm.estimatedTotal ?? 0} onChange={(e) => setEditForm((prev) => ({ ...prev, estimatedTotal: Number(e.target.value) }))} className="bg-card/70" onClick={(e) => e.stopPropagation()} />
                                    </div>
                                    <div className="space-y-1.5">
                                      <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">File</label>
                                      <div className="flex items-center gap-2 h-10 px-3 rounded-md border border-input bg-card/40 text-sm text-muted-foreground">
                                        <FileBox className="h-4 w-4 shrink-0" />
                                        {rawOrder.gdriveLink ? (
                                          <a href={rawOrder.gdriveLink} target="_blank" rel="noopener noreferrer" className="truncate text-primary hover:underline" onClick={(e) => e.stopPropagation()}>
                                            {rawOrder.fileName || "View File"}
                                          </a>
                                        ) : (
                                          <span className="truncate">{rawOrder.fileName || "No file linked"}</span>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                  {/* Status info + rejection reason */}
                                  <div className="flex flex-wrap items-center gap-3 mt-4 text-xs text-muted-foreground">
                                    <span>Payment: <Badge variant="outline" className={statusTone(rawOrder.paid ? "Paid" : "Pending")}>{rawOrder.paid ? "Paid" : "Pending"}</Badge></span>
                                    <span>Status: <Badge variant="outline" className={statusTone(row[row.length - 1])}>{row[row.length - 1]}</Badge></span>
                                    {rawOrder.rejectionReason && <span className="text-destructive">Reason: {rawOrder.rejectionReason}</span>}
                                  </div>
                                  {/* Action buttons */}
                                  <div className="flex flex-wrap items-center gap-2 mt-4 pt-4 border-t border-border/30">
                                    <div className="flex flex-wrap gap-2 flex-1">
                                      <Button size="sm" variant="outline" className="gap-1.5" onClick={(e) => { e.stopPropagation(); setChatTarget({ id: rawOrder._id, label: orderLabel }); }}>
                                        <MessageSquareText className="h-3.5 w-3.5" /> Chat with User
                                      </Button>
                                      {os === "new" && (
                                        <Button size="sm" variant="outline" className="gap-1.5 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10" onClick={(e) => { e.stopPropagation(); handleStatusAction(rawOrder._id, "approve"); }}>
                                          <CheckCircle2 className="h-3.5 w-3.5" /> Approve
                                        </Button>
                                      )}
                                      {(os === "new" || os === "approved") && (
                                        <Button size="sm" variant="outline" className="gap-1.5 border-destructive/30 text-destructive hover:bg-destructive/10" onClick={(e) => { e.stopPropagation(); setRejectTarget({ id: rawOrder._id, label: orderLabel }); }}>
                                          <Ban className="h-3.5 w-3.5" /> Reject
                                        </Button>
                                      )}
                                      {!rawOrder.paid && os === "approved" && (
                                        <Button size="sm" variant="outline" className="gap-1.5 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10" onClick={(e) => { e.stopPropagation(); handlePaidToggle(rawOrder._id); }}>
                                          <CheckCheck className="h-3.5 w-3.5" /> Mark Paid
                                        </Button>
                                      )}
                                      {rawOrder.paid && os !== "delivering" && os !== "completed" && (
                                        <Button size="sm" variant="outline" className="gap-1.5 border-blue-500/30 text-blue-400 hover:bg-blue-500/10" onClick={(e) => { e.stopPropagation(); handleStatusAction(rawOrder._id, "delivering"); }}>
                                          <Truck className="h-3.5 w-3.5" /> Mark Delivering
                                        </Button>
                                      )}
                                      {rawOrder.paid && os !== "completed" && (
                                        <Button size="sm" variant="outline" className="gap-1.5 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10" onClick={(e) => { e.stopPropagation(); handleStatusAction(rawOrder._id, "complete"); }}>
                                          <CheckCheck className="h-3.5 w-3.5" /> Mark Completed
                                        </Button>
                                      )}
                                    </div>
                                    <div className="flex gap-2">
                                      <Button variant="outline" size="sm" className="gap-1.5" onClick={(e) => { e.stopPropagation(); setExpandedOrderId(null); setEditForm({}); }}>
                                        <X className="h-3.5 w-3.5" /> Cancel
                                      </Button>
                                      <Button size="sm" className="gap-1.5 glow-primary" disabled={saving} onClick={(e) => { e.stopPropagation(); handleUpdateOrder(rawOrder._id); }}>
                                        <Save className="h-3.5 w-3.5" /> {saving ? "Saving..." : "Save Changes"}
                                      </Button>
                                    </div>
                                  </div>
                                </div>
                              </td>
                            </tr>
                          )}
                        </>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </Panel>
          )}

          {active === "chats" && (
            <Panel title="Chat Inbox" description="All order conversations sorted by the latest message.">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">
                    {chatSummaries.length} active conversation{chatSummaries.length === 1 ? "" : "s"}.
                  </p>
                </div>
                <Button variant="outline" onClick={handleMarkAllChatsRead} disabled={!chatSummaries.some((chat) => chat.unreadCount > 0)}>
                  Mark All as Read
                </Button>
              </div>

              <div className="overflow-hidden rounded-2xl border border-border/50 bg-card/30">
                {chatSummaries.length === 0 ? (
                  <div className="p-6">
                    <EmptyState text="No order chats yet. Conversations will appear here after a customer or admin sends a message." />
                  </div>
                ) : (
                  <div className="divide-y divide-border/50">
                    {chatSummaries.map((chat) => (
                      <button
                        key={chat.orderId}
                        className="flex w-full flex-col gap-3 p-4 text-left transition-colors hover:bg-muted/30 lg:flex-row lg:items-center lg:justify-between"
                        onClick={() => setChatTarget({ id: chat.orderId, label: chat.orderLabel })}
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-display font-semibold text-foreground">{chat.customerName}</span>
                            <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">{chat.orderLabel}</span>
                            <Badge variant="outline" className={statusTone(chat.orderStatus)}>{chat.orderStatus}</Badge>
                            {chat.unreadCount > 0 && (
                              <Badge variant="outline" className="border-destructive/30 bg-destructive/10 text-destructive">
                                {chat.unreadCount} unread
                              </Badge>
                            )}
                          </div>
                          <p className="mt-1 truncate text-sm text-muted-foreground">{chat.fileName}</p>
                          <p className="mt-2 line-clamp-1 text-sm">
                            <span className="text-primary">{chat.latestMessage.senderRole === "admin" ? "Support" : chat.latestMessage.senderName}:</span>{" "}
                            <span className="text-muted-foreground">{chat.latestMessage.message}</span>
                          </p>
                        </div>
                        <div className="flex shrink-0 items-center gap-3 text-xs text-muted-foreground">
                          <span>{new Date(chat.latestMessage.createdAt).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })}</span>
                          <MessageSquareText className={chat.unreadCount > 0 ? "h-4 w-4 text-destructive" : "h-4 w-4 text-primary"} />
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </Panel>
          )}

          {active === "jobs" && (
            <Panel title="Print Job Management" description="Track and manage print jobs across all printers.">
              <Toolbar search="Search job or order ID..." filters={["Job Status", "Printer", "Material"]} primary="Create Print Job" secondary="History" />
              <DataTable headers={["Job ID", "Order ID", "Printer", "Material", "Settings", "Duration", "Status"]} rows={dashboard.jobs} />
            </Panel>
          )}

          {active === "files" && (
            <Panel title="File Management" description="Manage and organize customer design files.">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div className="relative max-w-sm flex-1">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input placeholder="Search files..." className="pl-10 bg-card/70" />
                </div>
                <div className="flex flex-wrap gap-3">
                  <Button variant="outline" className="gap-2"><Download className="h-4 w-4" /> Export</Button>
                  <Button className="gap-2 glow-primary" onClick={() => setLinkFileOrderId("new")}><Plus className="h-4 w-4" /> Upload Files</Button>
                </div>
              </div>

              <div className="overflow-x-auto rounded-2xl border border-border/50 bg-card/30">
                <table className="w-full min-w-[820px] text-sm">
                  <thead className="bg-surface-elevated/70 text-muted-foreground">
                    <tr>
                      <th className="px-4 py-3 text-left font-medium">File ID</th>
                      <th className="px-4 py-3 text-left font-medium">File Name</th>
                      <th className="px-4 py-3 text-left font-medium">Type</th>
                      <th className="px-4 py-3 text-left font-medium">Linked To</th>
                      <th className="px-4 py-3 text-left font-medium">Uploaded By</th>
                      <th className="px-4 py-3 text-left font-medium">Upload Date</th>
                      <th className="px-4 py-3 text-right font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dashboard.filesRaw?.length === 0 && (
                      <tr className="border-t border-border/50">
                        <td className="px-4 py-6 text-muted-foreground" colSpan={7}>
                          No files found.
                        </td>
                      </tr>
                    )}
                    {dashboard.filesRaw?.map((order) => {
                      const isExpanded = expandedFileId === order._id;
                      const fileId = `FILE-${String(order._id).slice(-6).toUpperCase()}`;
                      const orderId = toOrderId(order as any);
                      const hasFile = !!(order.fileName || order.gdriveLink);
                      const displayFileName = order.fileName || (order.gdriveLink ? "Linked Drive File" : "No File");
                      const ext = order.fileName?.split(".").pop()?.toUpperCase() || (order.gdriveLink ? "LINK" : "N/A");

                      return (
                        <>
                          <tr key={order._id} className={`border-t border-border/50 transition-colors cursor-pointer ${isExpanded ? "bg-primary/5" : "hover:bg-muted/30"}`} onClick={() => setExpandedFileId(isExpanded ? null : order._id)}>
                            <td className="px-4 py-4 font-medium text-foreground">{fileId}</td>
                            <td className="px-4 py-4 text-muted-foreground">
                              {hasFile ? (
                                <div className="flex items-center gap-2">
                                  <FileBox className="h-4 w-4 text-primary" />
                                  <span className="truncate max-w-[200px]">{displayFileName}</span>
                                </div>
                              ) : (
                                <span className="text-destructive/60 italic">No File</span>
                              )}
                            </td>
                            <td className="px-4 py-4 text-muted-foreground">{ext}</td>
                            <td className="px-4 py-4 text-muted-foreground font-mono text-xs">{orderId}</td>
                            <td className="px-4 py-4 text-muted-foreground">{order.customerName}</td>
                            <td className="px-4 py-4 text-muted-foreground">{formatDate(order.createdAt)}</td>
                            <td className="px-4 py-4 text-right">
                              <div className="flex items-center justify-end gap-2">
                                {isExpanded ? <ChevronUp className="h-4 w-4 text-primary" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon" onClick={(e) => e.stopPropagation()}>
                                      <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end" className="bg-card border-border/60 min-w-[160px]">
                                    <DropdownMenuItem className="gap-2 cursor-pointer" onClick={(e) => { e.stopPropagation(); setLinkFileOrderId(order._id); }}>
                                      <Upload className="h-4 w-4" /> Replace/Add File
                                    </DropdownMenuItem>
                                    {order.gdriveLink && (
                                      <DropdownMenuItem className="gap-2 cursor-pointer" onClick={(e) => { e.stopPropagation(); window.open(order.gdriveLink, "_blank"); }}>
                                        <ExternalLink className="h-4 w-4" /> View in Drive
                                      </DropdownMenuItem>
                                    )}
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem
                                      className="text-destructive focus:text-destructive focus:bg-destructive/10 gap-2 cursor-pointer"
                                      disabled={!order.fileName}
                                      onClick={(e) => { e.stopPropagation(); setDeleteFileTarget({ id: order._id, fileName: order.fileName }); }}
                                    >
                                      <Trash2 className="h-4 w-4" /> Delete File
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </div>
                            </td>
                          </tr>
                          {isExpanded && (
                            <tr key={`${order._id}-details`} className="border-t border-primary/20 bg-primary/[0.02]">
                              <td colSpan={7} className="px-6 py-4">
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-6 animate-in slide-in-from-top-2">
                                  <div className="space-y-1">
                                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Specifications</p>
                                    <p className="text-sm font-medium">{order.material.toUpperCase()} • {order.quality.charAt(0).toUpperCase() + order.quality.slice(1)}</p>
                                    <p className="text-xs text-muted-foreground">Qty: {order.quantity}</p>
                                  </div>
                                  <div className="space-y-1">
                                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Dimensions</p>
                                    <p className="text-sm font-medium">{order.dimensions?.x} x {order.dimensions?.y} x {order.dimensions?.z} mm</p>
                                  </div>
                                  <div className="space-y-1">
                                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Weight & Cost</p>
                                    <p className="text-sm font-medium">Est. {order.estimatedWeight}g</p>
                                    <p className="text-xs text-primary font-semibold">₹{formatCurrency(order.estimatedTotal)}</p>
                                  </div>
                                  <div className="space-y-1">
                                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">File Action</p>
                                    {hasFile ? (
                                      <Button 
                                        size="sm" 
                                        variant="outline" 
                                        className="gap-2 border-primary/30 text-primary hover:bg-primary/10"
                                        onClick={(e) => { e.stopPropagation(); order.gdriveLink && window.open(order.gdriveLink, "_blank"); }}
                                      >
                                        <ExternalLink className="h-3.5 w-3.5" /> View File
                                      </Button>
                                    ) : (
                                      <Button 
                                        size="sm" 
                                        variant="outline" 
                                        className="gap-2 border-primary/30 text-primary hover:bg-primary/10" 
                                        onClick={(e) => { e.stopPropagation(); setLinkFileOrderId(order._id); }}
                                      >
                                        <Plus className="h-3.5 w-3.5" /> Attach File
                                      </Button>
                                    )}
                                  </div>
                                </div>
                              </td>
                            </tr>
                          )}
                        </>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </Panel>
          )}

          {active === "customers" && (
            <Panel title="Customer Management" description="Manage customer records and interaction history.">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div className="relative max-w-sm flex-1">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input placeholder="Search customer..." className="pl-10 bg-card/70" />
                </div>
                <Button className="gap-2 glow-primary" onClick={() => setShowCreateCustomer(true)}>
                  <Plus className="h-4 w-4" /> Create Customer
                </Button>
              </div>
              <div className="overflow-x-auto rounded-2xl border border-border/50 bg-card/30">
                <table className="w-full min-w-[900px] text-sm">
                  <thead className="bg-surface-elevated/70 text-muted-foreground">
                    <tr>
                      {["Customer", "Company", "Contact", "Orders", "Total Spend", "Tags"].map((header) => (
                        <th key={header} className="px-4 py-3 text-left font-medium whitespace-nowrap">{header}</th>
                      ))}
                      <th className="px-4 py-3 text-right font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dashboard.customers.length === 0 && (
                      <tr className="border-t border-border/50">
                        <td className="px-4 py-6 text-muted-foreground" colSpan={7}>
                          No customers yet. Customer records appear after orders are placed.
                        </td>
                      </tr>
                    )}
                    {dashboard.customers.map((row, index) => {
                      const customer = dashboard.customersRaw?.[index];
                      const ordersPath = toCustomerOrdersPath(customer, row);
                      return (
                        <tr key={`${row[0]}-${row[1]}`} className="border-t border-border/50 transition-colors hover:bg-muted/30">
                          <td className="px-4 py-4">
                            <Link to={ordersPath} className="group flex items-center gap-3">
                              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-primary/30 bg-primary/10 text-sm font-bold text-primary">
                                {String(row[1] || "C").slice(0, 1).toUpperCase()}
                              </div>
                              <div>
                                <p className="font-medium text-foreground group-hover:text-primary">{row[1]}</p>
                                <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">{row[0]}</p>
                              </div>
                            </Link>
                          </td>
                          <td className="px-4 py-4 text-muted-foreground">{row[2]}</td>
                          <td className="px-4 py-4 text-muted-foreground">{row[3]}</td>
                          <td className="px-4 py-4">
                            <Badge variant="outline" className="border-primary/30 bg-primary/10 text-primary">{row[4]} orders</Badge>
                          </td>
                          <td className="px-4 py-4 font-medium text-foreground">{row[5]}</td>
                          <td className="px-4 py-4 text-muted-foreground">{row[6]}</td>
                          <td className="px-4 py-4 text-right">
                            <Button asChild size="sm" variant="outline" className="gap-2">
                              <Link to={ordersPath}>
                                <Package className="h-3.5 w-3.5" /> View Orders
                              </Link>
                            </Button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </Panel>
          )}

          {active === "printers" && (
            <Panel title="Printer Management" description="Monitor printer status, workload, and maintenance.">
              <Toolbar search="Search printers..." filters={["Status", "Material Support", "Sort By"]} primary="Add Printer" secondary="Logs" />
              <DataTable headers={["Printer ID", "Name", "Model", "Build Volume", "Supported Materials", "Status", "Current Queue", "Last Maintenance"]} rows={dashboard.printers} />
            </Panel>
          )}

          {active === "analytics" && (
            <Panel title="Analytics & Reporting" description="Business insights and operational metrics.">
              <div className="grid gap-4 md:grid-cols-4">
                {dashboard.analyticsCards.map(([label, value, change]) => (
                  <div key={label} className="rounded-2xl border border-border/50 bg-card/30 p-4">
                    <p className="text-sm text-muted-foreground">{label}</p>
                    <p className="mt-2 font-display text-3xl font-bold">{value}</p>
                    <p className="mt-1 text-xs text-primary">{change}</p>
                  </div>
                ))}
              </div>
              {dashboard.analyticsCards.length === 0 && <EmptyState text="Analytics will appear when order data is available." />}
              <div className="grid gap-4 xl:grid-cols-2">
                <div className="rounded-2xl border border-border/50 bg-card/30 p-5">
                  <h3 className="font-display font-semibold">Revenue Trend</h3>
                  <div className="mt-5 flex h-64 items-end gap-3">
                    {dashboard.revenueTrend.map((value, index) => (
                      <div key={index} className="flex flex-1 flex-col items-center gap-2">
                        <div className="w-full rounded-t-lg bg-primary/80" style={{ height: `${Math.min(100, Math.max(8, Number(value) / 1000))}%` }} />
                        <span className="text-xs text-muted-foreground">P{index + 1}</span>
                      </div>
                    ))}
                    {dashboard.revenueTrend.length === 0 && <EmptyState text="No revenue trend points yet." />}
                  </div>
                </div>
                <div className="rounded-2xl border border-border/50 bg-card/30 p-5">
                  <h3 className="font-display font-semibold">Material Usage</h3>
                  <div className="mt-5 space-y-4">
                    {dashboard.materialUsage.map(([label, value]) => {
                      const numeric = Number(value) || 0;
                      const width = Math.min(100, Math.max(8, numeric * 12));
                      return (
                        <div key={label}>
                          <div className="mb-2 flex justify-between text-sm"><span>{label}</span><span>{value}</span></div>
                          <div className="h-3 rounded-full bg-muted"><div className="h-full rounded-full bg-primary" style={{ width: `${width}%` }} /></div>
                        </div>
                      );
                    })}
                    {dashboard.materialUsage.length === 0 && <EmptyState text="No material usage data yet." />}
                  </div>
                </div>
              </div>
            </Panel>
          )}

          {active === "notifications" && (
            <Panel title="Notifications" description="Stay updated with important events and alerts.">
              <div className="flex gap-3">
                <Button>All</Button>
                <Button variant="outline" onClick={handleMarkAllChatsRead} disabled={!chatSummaries.some((chat) => chat.unreadCount > 0)}>
                  Mark Chat as Read
                </Button>
              </div>
              <div className="space-y-3">
                {chatSummaries.map((chat) => (
                  <div key={`chat-${chat.orderId}`} className={`flex flex-col gap-3 rounded-2xl border p-4 sm:flex-row sm:items-center sm:justify-between ${chat.unreadCount > 0 ? "border-destructive/30 bg-destructive/10" : "border-border/50 bg-card/30"}`}>
                    <div className="flex gap-3">
                      <MessageSquareText className={`mt-1 h-5 w-5 ${chat.unreadCount > 0 ? "text-destructive" : "text-primary"}`} />
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="font-display font-semibold">Chat: {chat.customerName}</h3>
                          {chat.unreadCount > 0 && (
                            <Badge variant="outline" className="border-destructive/30 bg-destructive/10 text-destructive">
                              {chat.unreadCount} unread
                            </Badge>
                          )}
                        </div>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {chat.orderLabel} - {chat.latestMessage.senderRole === "admin" ? "Support" : chat.latestMessage.senderName}: {chat.latestMessage.message}
                        </p>
                      </div>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => setChatTarget({ id: chat.orderId, label: chat.orderLabel })}>
                      Open Chat
                    </Button>
                  </div>
                ))}
                {dashboard.notifications.map(([title, body, tone]) => (
                  <div key={`${title}-${body}`} className="flex flex-col gap-3 rounded-2xl border border-border/50 bg-card/30 p-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex gap-3">
                      <AlertTriangle className={`mt-1 h-5 w-5 ${tone === "danger" ? "text-destructive" : tone === "warning" ? "text-secondary" : "text-primary"}`} />
                      <div>
                        <h3 className="font-display font-semibold">{title}</h3>
                        <p className="text-sm text-muted-foreground">{body}</p>
                      </div>
                    </div>
                    <Button variant="outline" size="sm">Mark as Read</Button>
                  </div>
                ))}
                {dashboard.notifications.length === 0 && chatSummaries.length === 0 && <EmptyState text="No notifications yet." />}
              </div>
            </Panel>
          )}

          {active === "settings" && (
            <Panel title="Settings & Configuration" description="Manage system settings and preferences.">
              <Tabs defaultValue="general" className="w-full">
                <TabsList className="glass grid h-auto w-full grid-cols-2 gap-1 border border-border/40 p-1 sm:inline-grid sm:w-auto sm:grid-cols-4">
                  <TabsTrigger value="general" className="min-w-0 whitespace-normal px-2 py-2 text-center">General</TabsTrigger>
                  <TabsTrigger value="roles" className="min-w-0 whitespace-normal px-2 py-2 text-center">User Roles</TabsTrigger>
                  <TabsTrigger value="notifications" className="min-w-0 whitespace-normal px-2 py-2 text-center">Notifications</TabsTrigger>
                  <TabsTrigger value="pricing" className="min-w-0 whitespace-normal px-2 py-2 text-center">Pricing</TabsTrigger>
                </TabsList>
                <TabsContent value="general" className="mt-5 grid gap-4 md:grid-cols-2">
                  {["Company Name", "Contact Email", "Phone Number", "Address"].map((label) => (
                    <Input key={label} placeholder={label} />
                  ))}
                  {["Auto-approve quotes under ₹50,000", "Require payment before production", "Send delivery notifications"].map((setting) => (
                    <label key={setting} className="flex items-center justify-between gap-4 rounded-2xl border border-border/50 bg-card/30 p-4 md:col-span-2">
                      <span className="min-w-0 text-sm sm:text-base">{setting}</span>
                      <input type="checkbox" className="h-4 w-4 accent-primary" defaultChecked />
                    </label>
                  ))}
                  <Button className="md:col-span-2">Save Changes</Button>
                </TabsContent>
                <TabsContent value="roles" className="mt-5 space-y-3">
                  {["John Admin - Admin", "Sarah Manager - Manager", "Mike Operator - Operator"].map((role) => (
                    <div key={role} className="flex items-center justify-between gap-4 rounded-2xl border border-border/50 bg-card/30 p-4">
                      <span className="min-w-0 text-sm sm:text-base">{role}</span>
                      <Button variant="outline" size="sm">Edit</Button>
                    </div>
                  ))}
                  <Button className="gap-2"><Plus className="h-4 w-4" /> Add User</Button>
                </TabsContent>
                <TabsContent value="notifications" className="mt-5 space-y-3">
                  {["Print job status changes", "Low stock alerts", "Overdue job alerts", "Payment confirmations"].map((setting) => (
                    <label key={setting} className="flex items-center justify-between gap-4 rounded-2xl border border-border/50 bg-card/30 p-4">
                      <span className="min-w-0 text-sm sm:text-base">{setting}</span>
                      <input type="checkbox" className="h-4 w-4 accent-primary" defaultChecked />
                    </label>
                  ))}
                  <Button>Save Preferences</Button>
                </TabsContent>
                <TabsContent value="pricing" className="mt-5 grid gap-4 md:grid-cols-2">
                  {["Material Cost Multiplier", "Machine Cost per Hour", "Post-processing Fee", "Standard Delivery Fee", "PLA ₹ per kg", "ABS ₹ per kg", "PETG ₹ per kg", "Resin ₹ per kg"].map((label) => (
                    <Input key={label} placeholder={label} />
                  ))}
                  <Button className="md:col-span-2">Save Pricing</Button>
                </TabsContent>
              </Tabs>
            </Panel>
          )}
        </div>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
          <AlertDialogContent className="bg-card border-border/60">
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Order</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete order <span className="font-semibold text-foreground">{deleteTarget?.label}</span>?
                This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDeleteOrder} className="bg-destructive hover:bg-destructive/90 text-destructive-foreground">
                Delete Order
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Reject Order Dialog */}
        <AlertDialog open={!!rejectTarget} onOpenChange={(open) => { if (!open) { setRejectTarget(null); setRejectReason(""); } }}>
          <AlertDialogContent className="bg-card border-border/60">
            <AlertDialogHeader>
              <AlertDialogTitle>Reject Order</AlertDialogTitle>
              <AlertDialogDescription>
                You are rejecting order <span className="font-semibold text-foreground">{rejectTarget?.label}</span>.
                Please provide a reason for the customer.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="py-4">
              <Textarea
                placeholder="E.g., Model is non-manifold, dimensions are too small, etc."
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                className="min-h-[100px] bg-card/70"
              />
            </div>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleRejectOrder} className="bg-destructive hover:bg-destructive/90 text-destructive-foreground" disabled={!rejectReason.trim()}>
                Reject Order
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Create Order Dialog */}
        <Dialog open={showCreateOrder} onOpenChange={setShowCreateOrder}>
          <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto bg-card border-border/60">
            <DialogHeader>
              <DialogTitle>Create Order Manually</DialogTitle>
              <DialogDescription>
                Fill in the order details. This will create an order under the provided customer name.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Customer Name</label>
                  <Input
                    placeholder="e.g. John Doe"
                    value={createForm.customerName || ""}
                    onChange={(e) => setCreateForm(prev => ({ ...prev, customerName: e.target.value }))}
                    className="bg-card/70 border-border/40"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">File Name (Optional)</label>
                  <Input
                    placeholder="e.g. bracket_v2.stl"
                    value={createForm.fileName || ""}
                    onChange={(e) => setCreateForm(prev => ({ ...prev, fileName: e.target.value }))}
                    className="bg-card/70 border-border/40"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Drive Link (Optional)</label>
                <Input
                  placeholder="https://drive.google.com/..."
                  value={createForm.gdriveLink || ""}
                  onChange={(e) => setCreateForm(prev => ({ ...prev, gdriveLink: e.target.value }))}
                  className="bg-card/70 border-border/40"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Material</label>
                  <Select value={createForm.material} onValueChange={(val) => setCreateForm(prev => ({ ...prev, material: val }))}>
                    <SelectTrigger className="bg-card/70 border-border/40"><SelectValue /></SelectTrigger>
                    <SelectContent className="bg-card border-border/60">
                      <SelectItem value="pla">PLA</SelectItem>
                      <SelectItem value="petg">PETG</SelectItem>
                      <SelectItem value="abs">ABS</SelectItem>
                      <SelectItem value="tpu">TPU</SelectItem>
                      <SelectItem value="nylon">Nylon</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Quality</label>
                  <Select value={createForm.quality} onValueChange={(val) => setCreateForm(prev => ({ ...prev, quality: val }))}>
                    <SelectTrigger className="bg-card/70 border-border/40"><SelectValue /></SelectTrigger>
                    <SelectContent className="bg-card border-border/60">
                      <SelectItem value="draft">Draft (0.3mm)</SelectItem>
                      <SelectItem value="standard">Standard (0.2mm)</SelectItem>
                      <SelectItem value="high">High (0.1mm)</SelectItem>
                      <SelectItem value="ultra">Ultra (0.05mm)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Dimensions (X, Y, Z in mm)</label>
                <div className="grid grid-cols-3 gap-2">
                  <Input type="number" placeholder="X" value={createForm.dimensions?.x || ""} onChange={(e) => setCreateForm(prev => ({ ...prev, dimensions: { ...prev.dimensions!, x: Number(e.target.value) } }))} className="bg-card/70 border-border/40" />
                  <Input type="number" placeholder="Y" value={createForm.dimensions?.y || ""} onChange={(e) => setCreateForm(prev => ({ ...prev, dimensions: { ...prev.dimensions!, y: Number(e.target.value) } }))} className="bg-card/70 border-border/40" />
                  <Input type="number" placeholder="Z" value={createForm.dimensions?.z || ""} onChange={(e) => setCreateForm(prev => ({ ...prev, dimensions: { ...prev.dimensions!, z: Number(e.target.value) } }))} className="bg-card/70 border-border/40" />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Quantity</label>
                  <Input type="number" min={1} value={createForm.quantity || 1} onChange={(e) => setCreateForm(prev => ({ ...prev, quantity: Number(e.target.value) }))} className="bg-card/70 border-border/40" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Est. Weight (g)</label>
                  <Input type="number" value={createForm.estimatedWeight || ""} onChange={(e) => setCreateForm(prev => ({ ...prev, estimatedWeight: Number(e.target.value) }))} className="bg-card/70 border-border/40" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Est. Total (₹)</label>
                  <Input type="number" value={createForm.estimatedTotal || ""} onChange={(e) => setCreateForm(prev => ({ ...prev, estimatedTotal: Number(e.target.value) }))} className="bg-card/70 border-border/40" />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowCreateOrder(false)}>Cancel</Button>
              <Button className="glow-primary" onClick={handleCreateOrder} disabled={creating}>
                {creating ? "Creating..." : "Create Order"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete File Confirmation */}
        <AlertDialog open={!!deleteFileTarget} onOpenChange={(open) => !open && setDeleteFileTarget(null)}>
          <AlertDialogContent className="bg-card border-border/60">
            <AlertDialogHeader>
              <AlertDialogTitle>Delete File</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete the file <span className="font-semibold text-foreground">{deleteFileTarget?.fileName}</span>?
                It will be removed from Google Drive and unlinked from the order. The order itself will not be deleted.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDeleteFile} className="bg-destructive hover:bg-destructive/90 text-destructive-foreground">
                Delete File
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Create Quote Dialog */}
        <Dialog open={showCreateQuote} onOpenChange={setShowCreateQuote}>
          <DialogContent className="max-w-2xl bg-card border-border/60">
            <DialogHeader>
              <DialogTitle>Create Manual Quote</DialogTitle>
              <DialogDescription>Enter the customer project details to create a formal quotation request.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-6 py-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">Customer Name</label>
                  <Input 
                    placeholder="Full Name" 
                    value={createQuoteForm.name} 
                    onChange={(e) => setCreateQuoteForm(prev => ({ ...prev, name: e.target.value }))}
                    className="bg-card/70 border-border/40"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">Email Address</label>
                  <Input 
                    placeholder="email@example.com" 
                    value={createQuoteForm.email} 
                    onChange={(e) => setCreateQuoteForm(prev => ({ ...prev, email: e.target.value }))}
                    className="bg-card/70 border-border/40"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">Project Description</label>
                <Textarea 
                  placeholder="Describe the project requirements..." 
                  value={createQuoteForm.projectDescription} 
                  onChange={(e) => setCreateQuoteForm(prev => ({ ...prev, projectDescription: e.target.value }))}
                  className="bg-card/70 border-border/40 min-h-[100px]"
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">Budget Range / Estimate</label>
                  <Input 
                    placeholder="e.g. ₹5,000 - ₹10,000" 
                    value={createQuoteForm.budget} 
                    onChange={(e) => setCreateQuoteForm(prev => ({ ...prev, budget: e.target.value }))}
                    className="bg-card/70 border-border/40"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">Technical Specifications</label>
                  <Input 
                    placeholder="Material, Infill, Color..." 
                    value={createQuoteForm.technicalSpecifications} 
                    onChange={(e) => setCreateQuoteForm(prev => ({ ...prev, technicalSpecifications: e.target.value }))}
                    className="bg-card/70 border-border/40"
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowCreateQuote(false)}>Cancel</Button>
              <Button className="glow-primary" onClick={handleCreateQuote} disabled={creating}>
                {creating ? "Creating..." : "Create Quote"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Quote Confirmation */}
        <AlertDialog open={!!deleteQuoteTarget} onOpenChange={(open) => !open && setDeleteQuoteTarget(null)}>
          <AlertDialogContent className="bg-card border-border/60">
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Quote Request</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete <span className="font-semibold text-foreground">{deleteQuoteTarget?.label}</span>?
                This action is permanent and cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDeleteQuote} className="bg-destructive hover:bg-destructive/90 text-destructive-foreground">
                Delete Quote
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Create Customer Dialog */}
        <Dialog open={showCreateCustomer} onOpenChange={setShowCreateCustomer}>
          <DialogContent className="max-w-md bg-card border-border/60">
            <DialogHeader>
              <DialogTitle>Add New Customer</DialogTitle>
              <DialogDescription>Create a new customer profile to track their orders and history.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">Full Name</label>
                <Input 
                  placeholder="Customer Name" 
                  value={createCustomerForm.name} 
                  onChange={(e) => setCreateCustomerForm(prev => ({ ...prev, name: e.target.value }))}
                  className="bg-card/70 border-border/40"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">Email Address</label>
                <Input 
                  type="email"
                  placeholder="email@example.com" 
                  value={createCustomerForm.email} 
                  onChange={(e) => setCreateCustomerForm(prev => ({ ...prev, email: e.target.value }))}
                  className="bg-card/70 border-border/40"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">Company (Optional)</label>
                <Input 
                  placeholder="Company Name" 
                  value={createCustomerForm.company} 
                  onChange={(e) => setCreateCustomerForm(prev => ({ ...prev, company: e.target.value }))}
                  className="bg-card/70 border-border/40"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">Phone Number</label>
                <Input 
                  placeholder="+91..." 
                  value={createCustomerForm.phone} 
                  onChange={(e) => setCreateCustomerForm(prev => ({ ...prev, phone: e.target.value }))}
                  className="bg-card/70 border-border/40"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">Customer Type</label>
                <Select value={createCustomerForm.type} onValueChange={(val) => setCreateCustomerForm(prev => ({ ...prev, type: val }))}>
                  <SelectTrigger className="bg-card/70 border-border/40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border/60">
                    <SelectItem value="Individual">Individual</SelectItem>
                    <SelectItem value="Business">Business</SelectItem>
                    <SelectItem value="Partner">Partner</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowCreateCustomer(false)}>Cancel</Button>
              <Button className="glow-primary" onClick={handleCreateCustomer} disabled={creating}>
                {creating ? "Creating..." : "Create Customer"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={!!quoteChatTarget} onOpenChange={(open) => !open && setQuoteChatTarget(null)}>
          <DialogContent className="max-w-2xl border-border/60 bg-card p-0">
            <DialogHeader className="sr-only">
              <DialogTitle>Quote chat</DialogTitle>
            </DialogHeader>
            {quoteChatTarget && (
              <QuoteChat
                quoteId={quoteChatTarget.id}
                quoteLabel={quoteChatTarget.label}
                isAdmin
              />
            )}
          </DialogContent>
        </Dialog>

        <Dialog open={!!chatTarget} onOpenChange={(open) => !open && setChatTarget(null)}>
          <DialogContent className="max-w-2xl border-border/60 bg-card p-0">
            <DialogHeader className="sr-only">
              <DialogTitle>Order customer chat</DialogTitle>
            </DialogHeader>
            {chatTarget && (
              <OrderChat
                orderId={chatTarget.id}
                orderLabel={chatTarget.label}
                isAdmin
                onRead={fetchChatSummaries}
              />
            )}
          </DialogContent>
        </Dialog>

        {/* Link/Upload File Modal */}
        <LinkFileModal
          orderId={linkFileOrderId === "new" ? null : linkFileOrderId}
          open={!!linkFileOrderId}
          onClose={() => setLinkFileOrderId(null)}
          onSuccess={() => { fetchDashboard(); setLinkFileOrderId(null); }}
          backendUrl={backendUrl}
          ordersRaw={dashboard.ordersRaw || []}
        />
      </main>
    </div>
  );
};

export default Dashboard;
