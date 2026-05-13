import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { io, Socket } from "socket.io-client";
import {
  Package,
  FileBox,
  Loader2,
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Download,
  FileText,
  HelpCircle,
  MessageSquareText,
  PackageCheck,
  PackageSearch,
  Printer,
  RotateCcw,
  Search,
  ShieldCheck,
  Truck,
} from "lucide-react";
import { Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import OrderChat from "@/components/OrderChat";

import productOne from "@/assets/3d-print-product1.jpg";
import productTwo from "@/assets/3d-print-product2.jpg";
import productThree from "@/assets/3d-print-product3.jpg";
import productFour from "@/assets/3d-print-product4.jpg";

const productImages = [productOne, productTwo, productThree, productFour];

const getStatusProgress = (status: string, paid: boolean) => {
  const lower = status.toLowerCase();
  if (lower === "completed") return 100;
  if (lower === "delivering") return 85;
  if (lower === "approved") return paid ? 50 : 25;
  if (lower === "new") return 10;
  return 5;
};

const getStatusLabel = (status: string) => {
  const lower = status.toLowerCase();
  if (lower === "completed") return "Project Delivered";
  if (lower === "delivering") return "In Transit";
  if (lower === "approved") return "In Production";
  if (lower === "new") return "Technical Review";
  return "Status Pending";
};

type Order = {
  _id: string;
  material: string;
  quality: string;
  dimensions: { x: number; y: number; z: number };
  quantity: number;
  estimatedTotal: number;
  fileName: string;
  paid: boolean;
  orderStatus: string;
  rejectionReason?: string;
  createdAt: string;
};

type PaymentCreateResponse = {
  amount: number;
  currency: string;
  razorpayOrderId: string;
  keyId: string;
};

type ChatSummary = {
  orderId: string;
  orderLabel: string;
  customerName: string;
  fileName: string;
  orderStatus: string;
  latestMessage: {
    senderRole: "admin" | "user";
    message: string;
    createdAt: string;
  };
  unreadCount: number;
  totalMessages: number;
};

const loadRazorpayScript = () =>
  new Promise<boolean>((resolve) => {
    if ((window as any).Razorpay) {
      resolve(true);
      return;
    }

    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });

const statusTone = (status: string) => {
  const lower = status.toLowerCase();
  if (lower.includes("delivering")) return "border-blue-500/30 bg-blue-500/10 text-blue-400";
  if (lower.includes("awaiting") || lower.includes("pending") || lower.includes("new") || lower.includes("low") || lower.includes("review")) return "border-secondary/30 bg-secondary/10 text-secondary";
  if (lower.includes("failed") || lower.includes("rejected")) return "border-destructive/30 bg-destructive/10 text-destructive";
  if (lower.includes("completed")) return "border-emerald-500/30 bg-emerald-500/10 text-emerald-400";
  if (lower.includes("approved") || lower.includes("paid")) return "border-primary/30 bg-primary/10 text-primary";
  return "border-border bg-muted/30 text-muted-foreground";
};

const formatRupees = (value: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);

const Orders = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [payingOrderId, setPayingOrderId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [chatOrder, setChatOrder] = useState<Order | null>(null);
  const [chatSummaries, setChatSummaries] = useState<ChatSummary[]>([]);
  const { toast } = useToast();
  const backendUrl = import.meta.env.VITE_BACKEND_URL;

  const fetchOrders = useCallback(async () => {
    try {
      const res = await axios.get(`${backendUrl}/api/v1/orders/my-orders`, {
        withCredentials: true,
      });
      setOrders(res.data?.data || []);
      setError(null);
    } catch (err) {
      setError("Failed to load your orders. Please try again later.");
    } finally {
      setLoading(false);
    }
  }, [backendUrl]);

  const fetchChatSummaries = useCallback(async () => {
    try {
      const res = await axios.get(`${backendUrl}/api/v1/orders/chat-summaries`, {
        withCredentials: true,
      });
      setChatSummaries(res.data?.data || []);
    } catch {
      // Chat badges will retry on the next realtime event or page refresh.
    }
  }, [backendUrl]);

  useEffect(() => {
    fetchOrders();
    fetchChatSummaries();
  }, [fetchChatSummaries, fetchOrders]);

  useEffect(() => {
    const socket: Socket = io(backendUrl, {
      transports: ["websocket", "polling"],
      withCredentials: true,
    });

    socket.on("chat:message", fetchChatSummaries);
    socket.on("chat:read", fetchChatSummaries);

    return () => {
      socket.disconnect();
    };
  }, [backendUrl, fetchChatSummaries]);

  const getUnreadCount = useCallback((orderId: string) => {
    return chatSummaries.find((chat) => chat.orderId === orderId)?.unreadCount || 0;
  }, [chatSummaries]);

  const handlePayNow = async (orderId: string) => {
    setPayingOrderId(orderId);
    try {
      const sdkLoaded = await loadRazorpayScript();
      if (!sdkLoaded || !(window as any).Razorpay) {
        toast({
          title: "Payment unavailable",
          description: "Could not load Razorpay checkout. Please try again.",
          variant: "destructive",
        });
        return;
      }

      const res = await axios.post(
        `${backendUrl}/api/v1/orders/${orderId}/payment/create-order`,
        {},
        { withCredentials: true }
      );

      const data = res.data?.data as PaymentCreateResponse;

      const razorpay = new (window as any).Razorpay({
        key: data.keyId,
        amount: data.amount,
        currency: data.currency,
        order_id: data.razorpayOrderId,
        name: "Destny 3D Printing",
        description: `Order ${orderId.slice(-8).toUpperCase()}`,
        method: {
          upi: true,
          card: true,
          netbanking: false,
          wallet: false,
          emi: false,
          paylater: false,
        },
        config: {
          display: {
            preferences: {
              default_method: "upi",
            },
          },
        },
        handler: async (response: any) => {
          try {
            await axios.post(
              `${backendUrl}/api/v1/orders/${orderId}/payment/verify`,
              {
                razorpayPaymentId: response.razorpay_payment_id,
                razorpayOrderId: response.razorpay_order_id,
                razorpaySignature: response.razorpay_signature,
              },
              { withCredentials: true }
            );

            toast({
              title: "Payment successful",
              description: "Your order has been marked as paid.",
            });
            fetchOrders();
          } catch (err) {
            toast({
              title: "Verification failed",
              description: "Payment was made but verification failed. Please contact support.",
              variant: "destructive",
            });
          }
        },
        modal: {
          ondismiss: async () => {
            try {
              await axios.post(
                `${backendUrl}/api/v1/orders/${orderId}/payment/fail`,
                {
                  razorpayOrderId: data.razorpayOrderId,
                  failureReason: "Checkout dismissed by user",
                },
                { withCredentials: true }
              );
              fetchOrders();
            } catch {
              // Ignore
            }
          },
        },
        theme: {
          color: "#ea580c", // Primary orange
        },
      });

      razorpay.on("payment.failed", async (response: any) => {
        await axios.post(
          `${backendUrl}/api/v1/orders/${orderId}/payment/fail`,
          {
            razorpayOrderId: data.razorpayOrderId,
            failureReason: response?.error?.description || "Payment failed",
          },
          { withCredentials: true }
        );

        toast({
          title: "Payment failed",
          description: response?.error?.description || "Transaction failed.",
          variant: "destructive",
        });
        fetchOrders();
      });

      razorpay.open();
    } catch (err) {
      console.error(err);
      toast({
        title: "Payment initialization failed",
        description: "Could not start payment. Please try again.",
        variant: "destructive"
      });
    } finally {
      setPayingOrderId(null);
    }
  };

  const filteredOrders = orders.filter(o => 
    o._id.toLowerCase().includes(searchQuery.toLowerCase()) ||
    o.fileName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    o.material?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const activeOrders = filteredOrders.filter(o => o.orderStatus !== 'completed' && o.orderStatus !== 'rejected');
  const pastOrdersList = filteredOrders.filter(o => o.orderStatus === 'completed' || o.orderStatus === 'rejected');

  const summaryCards = [
    { label: "Active orders", value: String(activeOrders.length), icon: PackageSearch, tone: "text-primary" },
    { label: "Awaiting review", value: String(orders.filter(o => o.orderStatus === 'new').length), icon: Clock3, tone: "text-cyan-300" },
    { label: "Total orders", value: String(orders.length), icon: PackageCheck, tone: "text-emerald-300" },
    { label: "Paid orders", value: String(orders.filter(o => o.paid).length), icon: ShieldCheck, tone: "text-secondary" },
  ];

  const updates = [
    ["Today, 11:20 AM", "Print batch 2/3 started on Printer 01."],
    ["Yesterday, 6:45 PM", "Design review notes were resolved by the Destny team."],
    ["May 10, 2026", "Material allocation confirmed for carbon-black PLA."],
  ];
  return (
    <div className="min-h-screen bg-background text-foreground">
    <Navbar />
    <main className="relative overflow-hidden pt-24">
      <div className="fixed inset-0 gradient-mesh pointer-events-none" />

      <section className="relative z-10 border-b border-border/60">
        <div className="container mx-auto px-6 py-10 lg:py-14">
          <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-end">
            <div>
              <Badge variant="outline" className="border-primary/30 bg-primary/10 text-primary">
                Customer workspace
              </Badge>
              <h1 className="mt-5 max-w-3xl font-display text-4xl font-bold tracking-normal sm:text-5xl">
                Your Orders
              </h1>
              <p className="mt-4 max-w-2xl text-base leading-7 text-muted-foreground">
                Track every print, prototype, build, and creative request with clear milestones, documents, invoices, and support in one place.
              </p>
              <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                <Button asChild size="lg" className="glow-primary">
                  <Link to="/3d-printing#quote">
                    Start New Order <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
                <Button asChild variant="outline" size="lg">
                  <Link to="/quotes">
                    <FileText className="h-4 w-4" /> Your Quotes
                  </Link>
                </Button>
              </div>
            </div>

            <div className="rounded-2xl border border-border/50 bg-card/40 p-5 backdrop-blur-xl">
              <div className="grid grid-cols-2 gap-3">
                {loading ? (
                  <div className="col-span-2 flex justify-center py-4">
                    <Loader2 className="h-5 w-5 animate-spin text-primary" />
                  </div>
                ) : (
                  summaryCards.map(({ label, value, icon: Icon, tone }) => (
                    <div key={label} className="rounded-lg border border-border/50 bg-muted/30 p-4">
                      <Icon className={`h-5 w-5 ${tone}`} />
                      <p className="mt-3 font-display text-2xl font-bold">{value}</p>
                      <p className="text-xs text-muted-foreground">{label}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="relative z-10">
        <div className="container mx-auto grid gap-6 px-6 py-10 xl:grid-cols-[minmax(0,1fr)_360px]">
          <div className="space-y-6">
            <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="font-display text-2xl font-semibold">Active Orders</h2>
                <p className="mt-1 text-sm text-muted-foreground">Live production status and next checkpoints.</p>
              </div>
              
              <div className="relative w-full sm:max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/70 z-10" />
                <Input 
                  placeholder="Search order ID, file, or material..." 
                  className="bg-card/40 backdrop-blur-md pl-10 border-border/50 focus:border-primary/50 transition-all relative z-0"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 gap-4">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
                <p className="text-muted-foreground animate-pulse">Synchronizing your workspace...</p>
              </div>
            ) : error ? (
              <div className="rounded-2xl border border-destructive/20 bg-destructive/10 p-12 text-center">
                <p className="text-destructive mb-4 font-medium">{error}</p>
                <Button variant="outline" onClick={fetchOrders} className="gap-2">
                  <RotateCcw className="h-4 w-4" /> Try Again
                </Button>
              </div>
            ) : activeOrders.length === 0 ? (
              <div className="rounded-2xl border border-border/50 bg-card/30 p-16 text-center backdrop-blur-sm">
                <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4 opacity-40" />
                <h3 className="text-xl font-display font-semibold mb-2">No active projects</h3>
                <p className="text-muted-foreground mb-8 max-w-sm mx-auto">Your active 3D printing and design projects will appear here once you place an order.</p>
                <Button asChild className="glow-primary px-8">
                  <Link to="/3d-printing">Start New Order</Link>
                </Button>
              </div>
            ) : (
              activeOrders.map((order, idx) => (
                <Card key={order._id} className="glass border-border/40 rounded-2xl overflow-hidden hover:border-primary/30 transition-all duration-300">
                  <CardContent className="p-0">
                    <div className="grid gap-0 lg:grid-cols-[220px_minmax(0,1fr)]">
                      <div className="relative h-56 w-full lg:h-full overflow-hidden">
                        <img 
                          src={productImages[idx % productImages.length]} 
                          alt="3D Print" 
                          className={`h-full w-full object-cover transition-all duration-700 ${
                            order.orderStatus === 'completed' 
                              ? 'opacity-100 grayscale-0' 
                              : 'opacity-60 grayscale hover:grayscale-0 hover:opacity-100'
                          }`} 
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent lg:hidden" />
                      </div>
                      <div className="p-5 sm:p-8">
                        <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
                          <div className="space-y-2">
                            <div className="flex flex-wrap items-center gap-3">
                              <Badge variant="outline" className={`${statusTone(order.orderStatus)} px-3`}>
                                {order.orderStatus === "new" ? "Under Review" : order.orderStatus.charAt(0).toUpperCase() + order.orderStatus.slice(1)}
                              </Badge>
                              <Badge variant="outline" className={order.paid ? "border-emerald-500/30 bg-emerald-400/10 text-emerald-400" : "border-amber-500/30 bg-amber-500/10 text-amber-400"}>
                                {order.paid ? "Paid" : "Payment Pending"}
                              </Badge>
                              <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">#{order._id.slice(-8)}</span>
                            </div>
                            <h3 className="font-display text-2xl font-bold tracking-tight">{order.fileName || "Custom Print Project"}</h3>
                            <p className="text-sm text-muted-foreground flex items-center gap-2">
                              <span className="capitalize">{order.material}</span> • {order.quality} Quality • {format(new Date(order.createdAt), "MMM d, yyyy")}
                            </p>
                          </div>
                          <div className="text-left sm:text-right">
                            <p className="font-display text-2xl font-bold text-primary">{formatRupees(order.estimatedTotal)}</p>
                            <p className="text-xs text-muted-foreground mt-1">Total Estimated Amount</p>
                          </div>
                        </div>

                        <div className="mt-8">
                          <div className="mb-3 flex items-center justify-between text-sm">
                            <span className="text-muted-foreground font-medium uppercase tracking-wider text-[10px]">Production Status: {getStatusLabel(order.orderStatus)}</span>
                            <span className="font-bold text-primary">{getStatusProgress(order.orderStatus, order.paid)}%</span>
                          </div>
                          <Progress value={getStatusProgress(order.orderStatus, order.paid)} className="h-1.5 bg-muted" />
                        </div>


                        <Separator className="my-8 bg-border/40" />

                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                          <div className="flex flex-wrap gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              className="gap-2 rounded-xl"
                              onClick={() => setChatOrder(order)}
                            >
                              <MessageSquareText className="h-3.5 w-3.5" /> Support
                              {getUnreadCount(order._id) > 0 && (
                                <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-destructive px-1.5 text-[10px] font-bold text-destructive-foreground">
                                  {getUnreadCount(order._id)}
                                </span>
                              )}
                            </Button>
                            <Button variant="outline" size="sm" className="gap-2 rounded-xl">
                              <FileBox className="h-3.5 w-3.5" /> Brief
                            </Button>
                          </div>
                          
                          {!order.paid && order.orderStatus === 'approved' && (
                            <Button 
                              className="glow-primary px-8 rounded-xl gap-2 h-10"
                              onClick={() => handlePayNow(order._id)}
                              disabled={payingOrderId === order._id}
                            >
                              {payingOrderId === order._id ? (
                                <><Loader2 className="h-4 w-4 animate-spin" /> Starting Secure Payment...</>
                              ) : (
                                <>Pay Now <ArrowRight className="h-4 w-4" /></>
                              )}
                            </Button>
                          )}

                          {order.orderStatus === 'rejected' && order.rejectionReason && (
                            <div className="text-xs p-3 rounded-xl bg-destructive/10 text-destructive border border-destructive/20 max-w-md">
                              <span className="font-bold uppercase text-[9px] block mb-1">Rejection Note</span>
                              {order.rejectionReason}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}

            {!loading && pastOrdersList.length > 0 && (
              <div className="pt-8">
                <h2 className="font-display text-2xl font-semibold mb-6">Archive & Past Projects</h2>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {pastOrdersList.map((order, idx) => (
                    <Card key={order._id} className="glass border-border/40 rounded-2xl overflow-hidden hover:border-primary/20 transition-colors group">
                      <CardContent className="p-5">
                        <div className="aspect-[16/10] w-full rounded-xl bg-muted/20 flex items-center justify-center mb-5 overflow-hidden">
                          <img 
                            src={productImages[(idx + 2) % productImages.length]} 
                            alt="3D Print" 
                            className={`h-full w-full object-cover transition-all duration-500 ${
                              order.orderStatus === 'completed' 
                                ? 'opacity-100 grayscale-0' 
                                : 'opacity-40 grayscale group-hover:grayscale-0 group-hover:opacity-100'
                            }`} 
                          />
                        </div>
                        <div className="space-y-4">
                          <div>
                            <Badge variant="outline" className={order.orderStatus === 'completed' ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-300" : "border-destructive/30 bg-destructive/10 text-destructive"}>
                              {order.orderStatus.charAt(0).toUpperCase() + order.orderStatus.slice(1)}
                            </Badge>
                            <h3 className="mt-3 font-display font-semibold text-lg line-clamp-1">{order.fileName || "Custom Project"}</h3>
                            <p className="text-xs text-muted-foreground mt-1">#{order._id.slice(-8).toUpperCase()} • {format(new Date(order.createdAt), "MMM d, yyyy")}</p>
                          </div>
                          <div className="flex items-center justify-between pt-4 border-t border-border/30">
                            <span className="font-bold text-primary">{formatRupees(order.estimatedTotal)}</span>
                            <div className="flex items-center gap-2">
                              <Button variant="ghost" size="sm" className="relative h-8 gap-2 text-xs" onClick={() => setChatOrder(order)}>
                                <MessageSquareText className="h-3 w-3" /> Chat
                                {getUnreadCount(order._id) > 0 && (
                                  <span className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full bg-destructive ring-2 ring-card" />
                                )}
                              </Button>
                              <Button variant="ghost" size="sm" className="h-8 gap-2 text-xs" asChild>
                                <Link to="/3d-printing">
                                  <RotateCcw className="h-3 w-3" /> Reorder
                                </Link>
                              </Button>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </div>

          <aside className="space-y-6">
            {activeOrders.some(o => o.orderStatus === 'delivering') && (
              <Card className="glass border-border/40 rounded-2xl">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Truck className="h-5 w-5 text-primary" /> Next Delivery
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="rounded-lg border border-border/50 bg-muted/30 p-4">
                    <p className="font-medium text-primary">In Transit</p>
                    <p className="mt-1 text-sm text-muted-foreground">Your package for order #{activeOrders.find(o => o.orderStatus === 'delivering')?._id.slice(-8)} is out for delivery.</p>
                  </div>
                  <Button className="w-full">Track Shipment</Button>
                </CardContent>
              </Card>
            )}

            <Card className="glass border-border/40 rounded-2xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <CalendarDays className="h-5 w-5 text-cyan-300" /> Recent Updates
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {updates.map(([time, update]) => (
                  <div key={time} className="border-l border-primary/40 pl-4">
                    <p className="text-xs text-primary">{time}</p>
                    <p className="mt-1 text-sm text-muted-foreground">{update}</p>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="glass border-border/40 rounded-2xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <HelpCircle className="h-5 w-5 text-secondary" /> Need Help?
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button variant="outline" className="w-full justify-start">
                  <MessageSquareText className="h-4 w-4" /> Contact Support
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Printer className="h-4 w-4" /> Print Consultation
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <FileText className="h-4 w-4" /> Billing Help
                </Button>
              </CardContent>
            </Card>
          </aside>
        </div>
      </section>
    </main>
    <Footer />
    <Dialog open={!!chatOrder} onOpenChange={(open) => !open && setChatOrder(null)}>
      <DialogContent className="max-w-2xl border-border/60 bg-card p-0">
        <DialogHeader className="sr-only">
          <DialogTitle>Order support chat</DialogTitle>
        </DialogHeader>
        {chatOrder && (
          <OrderChat
            orderId={chatOrder._id}
            orderLabel={`#${chatOrder._id.slice(-8).toUpperCase()} ${chatOrder.fileName || ""}`}
            onRead={fetchChatSummaries}
          />
        )}
      </DialogContent>
    </Dialog>
  </div>
);
};

export default Orders;
