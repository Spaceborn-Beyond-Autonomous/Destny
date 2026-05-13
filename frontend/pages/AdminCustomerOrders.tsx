import { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
import { format } from "date-fns";
import { Link, useParams } from "react-router-dom";
import {
  ArrowLeft,
  CheckCircle2,
  Clock3,
  Ban,
  FileBox,
  FileText,
  Loader2,
  MessageSquareText,
  MoreHorizontal,
  Package,
  PackageCheck,
  ShieldCheck,
  Trash2,
  Truck,
  Users,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import OrderChat from "@/components/OrderChat";
import QuoteChat from "@/components/QuoteChat";

import productOne from "@/assets/3d-print-product1.jpg";
import productTwo from "@/assets/3d-print-product2.jpg";
import productThree from "@/assets/3d-print-product3.jpg";
import productFour from "@/assets/3d-print-product4.jpg";

const productImages = [productOne, productTwo, productThree, productFour];

type Order = {
  _id: string;
  material: string;
  quality: string;
  dimensions: { x: number; y: number; z: number };
  quantity: number;
  estimatedTotal: number;
  estimatedWeight: number;
  customerName: string;
  fileName: string;
  gdriveLink: string;
  paid: boolean;
  paymentStatus: string;
  orderStatus: string;
  rejectionReason?: string;
  createdAt: string;
};

type CustomerSummary = {
  id: string;
  mode: string;
  name: string;
  email?: string;
  totalOrders: number;
  totalQuotes: number;
  activeOrders: number;
  paidOrders: number;
  totalSpend: number;
};

type Quote = {
  _id: string;
  name: string;
  email: string;
  projectDescription: string;
  budget: string;
  technicalSpecifications?: string;
  status: string;
  source: string;
  createdAt: string;
};

type CustomerOrdersResponse = {
  customer: CustomerSummary;
  orders: Order[];
  quotes: Quote[];
};

const formatRupees = (value: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value || 0);

const statusTone = (status: string) => {
  const lower = status.toLowerCase();
  if (lower.includes("delivering")) return "border-blue-500/30 bg-blue-500/10 text-blue-400";
  if (lower.includes("pending") || lower.includes("new") || lower.includes("review")) return "border-secondary/30 bg-secondary/10 text-secondary";
  if (lower.includes("failed") || lower.includes("rejected")) return "border-destructive/30 bg-destructive/10 text-destructive";
  if (lower.includes("completed")) return "border-emerald-500/30 bg-emerald-500/10 text-emerald-400";
  if (lower.includes("approved") || lower.includes("paid")) return "border-primary/30 bg-primary/10 text-primary";
  return "border-border bg-muted/30 text-muted-foreground";
};

const progressFor = (status: string, paid: boolean) => {
  if (status === "completed") return 100;
  if (status === "delivering") return 85;
  if (status === "approved") return paid ? 55 : 30;
  if (status === "rejected") return 0;
  return 12;
};

const AdminCustomerOrders = () => {
  const { mode = "name", customerKey = "" } = useParams();
  const backendUrl = import.meta.env.VITE_BACKEND_URL;
  const [data, setData] = useState<CustomerOrdersResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [chatOrder, setChatOrder] = useState<Order | null>(null);
  const [chatQuote, setChatQuote] = useState<Quote | null>(null);
  const [activeView, setActiveView] = useState<"orders" | "quotes">("orders");
  const [rejectTarget, setRejectTarget] = useState<Order | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<Order | null>(null);

  const fetchCustomerOrders = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${backendUrl}/api/v1/orders/customer-orders/${mode}/${encodeURIComponent(customerKey)}`, {
        withCredentials: true,
      });
      setData(res.data?.data || null);
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.message || "Could not load this customer's orders.");
    } finally {
      setLoading(false);
    }
  }, [backendUrl, customerKey, mode]);

  useEffect(() => {
    fetchCustomerOrders();
  }, [fetchCustomerOrders]);

  const metrics = useMemo(() => {
    const customer = data?.customer;
    return [
      { label: "Total orders", value: String(customer?.totalOrders || 0), icon: Package, tone: "text-primary" },
      { label: "Quote requests", value: String(customer?.totalQuotes || 0), icon: FileText, tone: "text-purple-300" },
      { label: "Active orders", value: String(customer?.activeOrders || 0), icon: Clock3, tone: "text-cyan-300" },
      { label: "Paid orders", value: String(customer?.paidOrders || 0), icon: ShieldCheck, tone: "text-emerald-300" },
      { label: "Total spend", value: formatRupees(customer?.totalSpend || 0), icon: PackageCheck, tone: "text-secondary" },
    ];
  }, [data]);

  const handleStatusAction = useCallback(async (orderId: string, action: "approve" | "delivering" | "complete") => {
    try {
      await axios.patch(`${backendUrl}/api/v1/orders/${orderId}/${action}`, {}, { withCredentials: true });
      await fetchCustomerOrders();
    } catch (err: any) {
      setError(err.response?.data?.message || `Failed to ${action} order.`);
    }
  }, [backendUrl, fetchCustomerOrders]);

  const handleMarkPaid = useCallback(async (orderId: string) => {
    try {
      await axios.patch(`${backendUrl}/api/v1/orders/${orderId}/paid`, {}, { withCredentials: true });
      await fetchCustomerOrders();
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to mark order as paid.");
    }
  }, [backendUrl, fetchCustomerOrders]);

  const handleRejectOrder = useCallback(async () => {
    if (!rejectTarget) return;
    try {
      await axios.patch(
        `${backendUrl}/api/v1/orders/${rejectTarget._id}/reject`,
        { rejectionReason: rejectReason },
        { withCredentials: true }
      );
      await fetchCustomerOrders();
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to reject order.");
    } finally {
      setRejectTarget(null);
      setRejectReason("");
    }
  }, [backendUrl, fetchCustomerOrders, rejectReason, rejectTarget]);

  const handleDeleteOrder = useCallback(async () => {
    if (!deleteTarget) return;
    try {
      await axios.delete(`${backendUrl}/api/v1/orders/${deleteTarget._id}`, { withCredentials: true });
      await fetchCustomerOrders();
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to delete order.");
    } finally {
      setDeleteTarget(null);
    }
  }, [backendUrl, deleteTarget, fetchCustomerOrders]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <main className="relative overflow-hidden">
        <div className="fixed inset-0 gradient-mesh pointer-events-none" />

        <section className="relative z-10 border-b border-border/60">
          <div className="container mx-auto px-6 py-8 lg:py-10">
            <Button asChild variant="outline" size="sm" className="mb-6 gap-2">
              <Link to="/dashboard">
                <ArrowLeft className="h-4 w-4" /> Back to Dashboard
              </Link>
            </Button>

            <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_420px] lg:items-end">
              <div>
                <Badge variant="outline" className="border-primary/30 bg-primary/10 text-primary">
                  Admin customer orders
                </Badge>
                <h1 className="mt-5 max-w-3xl font-display text-4xl font-bold tracking-normal sm:text-5xl">
                  {data?.customer.name || "Customer Orders"}
                </h1>
                <p className="mt-4 max-w-2xl text-base leading-7 text-muted-foreground">
                  Review orders and quote requests linked to {data?.customer.email || "this customer's email"}.
                </p>
                <div className="mt-7 flex flex-wrap gap-3">
                  <Button
                    variant={activeView === "orders" ? "default" : "outline"}
                    onClick={() => setActiveView("orders")}
                    className="gap-2"
                  >
                    <Package className="h-4 w-4" /> Orders
                  </Button>
                  <Button
                    variant={activeView === "quotes" ? "default" : "outline"}
                    onClick={() => setActiveView("quotes")}
                    className="gap-2"
                  >
                    <FileText className="h-4 w-4" /> Quotes
                  </Button>
                </div>
              </div>

              <div className="rounded-2xl border border-border/50 bg-card/40 p-5 backdrop-blur-xl">
                <div className="grid grid-cols-2 gap-3">
                  {metrics.map(({ label, value, icon: Icon, tone }) => (
                    <div key={label} className="rounded-lg border border-border/50 bg-muted/30 p-4">
                      <Icon className={`h-5 w-5 ${tone}`} />
                      <p className="mt-3 font-display text-xl font-bold">{value}</p>
                      <p className="text-xs text-muted-foreground">{label}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="relative z-10">
          <div className="container mx-auto px-6 py-10">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-24 gap-4">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
                <p className="text-muted-foreground">Loading customer orders...</p>
              </div>
            ) : error ? (
              <div className="rounded-2xl border border-destructive/20 bg-destructive/10 p-12 text-center">
                <p className="text-destructive mb-4 font-medium">{error}</p>
                <Button variant="outline" onClick={fetchCustomerOrders}>Try Again</Button>
              </div>
            ) : !data ? (
              <div className="rounded-2xl border border-border/50 bg-card/30 p-16 text-center backdrop-blur-sm">
                <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4 opacity-40" />
                <h3 className="text-xl font-display font-semibold mb-2">No customer data found</h3>
                <p className="text-muted-foreground">Orders and quotes linked to this email will appear here.</p>
              </div>
            ) : activeView === "orders" ? (
              data.orders.length === 0 ? (
                <div className="rounded-2xl border border-border/50 bg-card/30 p-16 text-center backdrop-blur-sm">
                  <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4 opacity-40" />
                  <h3 className="text-xl font-display font-semibold mb-2">No orders for this customer</h3>
                  <p className="text-muted-foreground">Once this customer places an order, it will appear here.</p>
                </div>
              ) : (
              <div className="grid gap-5">
                {data.orders.map((order, index) => (
                  <Card key={order._id} className="glass overflow-hidden rounded-2xl border-border/40 transition-all duration-300 hover:border-primary/30">
                    <CardContent className="p-0">
                      <div className="grid gap-0 lg:grid-cols-[220px_minmax(0,1fr)]">
                        <div className="relative h-56 w-full overflow-hidden lg:h-full">
                          <img src={productImages[index % productImages.length]} alt="3D print order" className="h-full w-full object-cover opacity-70 grayscale transition-all duration-700 hover:opacity-100 hover:grayscale-0" />
                          <div className="absolute left-4 top-4 rounded-full border border-border/50 bg-background/80 px-3 py-1 font-mono text-[10px] uppercase tracking-widest backdrop-blur">
                            #{order._id.slice(-8)}
                          </div>
                        </div>

                        <div className="p-5 sm:p-8">
                          <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
                            <div className="space-y-2">
                              <div className="flex flex-wrap items-center gap-3">
                                <Badge variant="outline" className={`${statusTone(order.orderStatus)} px-3`}>
                                  {order.orderStatus === "new" ? "Under Review" : order.orderStatus}
                                </Badge>
                                <Badge variant="outline" className={order.paid ? "border-emerald-500/30 bg-emerald-400/10 text-emerald-400" : "border-amber-500/30 bg-amber-500/10 text-amber-400"}>
                                  {order.paid ? "Paid" : "Payment Pending"}
                                </Badge>
                              </div>
                              <h2 className="font-display text-2xl font-bold tracking-normal">{order.fileName || "Custom Print Project"}</h2>
                              <p className="text-sm text-muted-foreground">
                                {order.material.toUpperCase()} - {order.quality} quality - {format(new Date(order.createdAt), "MMM d, yyyy")}
                              </p>
                            </div>
                            <div className="text-left sm:text-right">
                              <p className="font-display text-2xl font-bold text-primary">{formatRupees(order.estimatedTotal)}</p>
                              <p className="text-xs text-muted-foreground mt-1">Estimated total</p>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="outline" size="sm" className="mt-4 gap-2">
                                    <MoreHorizontal className="h-4 w-4" /> Actions
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="min-w-[210px] border-border/60 bg-card">
                                  <DropdownMenuItem className="cursor-pointer gap-2" onClick={() => setChatOrder(order)}>
                                    <MessageSquareText className="h-4 w-4 text-primary" /> Chat with User
                                  </DropdownMenuItem>
                                  {order.orderStatus === "new" && (
                                    <DropdownMenuItem className="cursor-pointer gap-2" onClick={() => handleStatusAction(order._id, "approve")}>
                                      <CheckCircle2 className="h-4 w-4 text-emerald-400" /> Approve
                                    </DropdownMenuItem>
                                  )}
                                  {(order.orderStatus === "new" || order.orderStatus === "approved") && (
                                    <DropdownMenuItem className="cursor-pointer gap-2" onClick={() => setRejectTarget(order)}>
                                      <Ban className="h-4 w-4 text-destructive" /> Reject
                                    </DropdownMenuItem>
                                  )}
                                  {!order.paid && order.orderStatus === "approved" && (
                                    <DropdownMenuItem className="cursor-pointer gap-2" onClick={() => handleMarkPaid(order._id)}>
                                      <ShieldCheck className="h-4 w-4 text-emerald-400" /> Mark Paid
                                    </DropdownMenuItem>
                                  )}
                                  {order.paid && order.orderStatus !== "delivering" && order.orderStatus !== "completed" && (
                                    <DropdownMenuItem className="cursor-pointer gap-2" onClick={() => handleStatusAction(order._id, "delivering")}>
                                      <Truck className="h-4 w-4 text-blue-400" /> Mark Delivering
                                    </DropdownMenuItem>
                                  )}
                                  {order.paid && order.orderStatus !== "completed" && (
                                    <DropdownMenuItem className="cursor-pointer gap-2" onClick={() => handleStatusAction(order._id, "complete")}>
                                      <CheckCircle2 className="h-4 w-4 text-emerald-400" /> Mark Completed
                                    </DropdownMenuItem>
                                  )}
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem className="cursor-pointer gap-2 text-destructive focus:bg-destructive/10 focus:text-destructive" onClick={() => setDeleteTarget(order)}>
                                    <Trash2 className="h-4 w-4" /> Delete Order
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </div>

                          <div className="mt-8">
                            <div className="mb-3 flex items-center justify-between text-sm">
                              <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Order progress</span>
                              <span className="font-bold text-primary">{progressFor(order.orderStatus, order.paid)}%</span>
                            </div>
                            <Progress value={progressFor(order.orderStatus, order.paid)} className="h-1.5 bg-muted" />
                          </div>

                          <Separator className="my-8 bg-border/40" />

                          <div className="grid gap-4 sm:grid-cols-4">
                            <div>
                              <p className="text-xs uppercase tracking-wider text-muted-foreground">Quantity</p>
                              <p className="mt-1 font-medium">{order.quantity}</p>
                            </div>
                            <div>
                              <p className="text-xs uppercase tracking-wider text-muted-foreground">Dimensions</p>
                              <p className="mt-1 font-medium">{order.dimensions?.x} x {order.dimensions?.y} x {order.dimensions?.z} mm</p>
                            </div>
                            <div>
                              <p className="text-xs uppercase tracking-wider text-muted-foreground">Weight</p>
                              <p className="mt-1 font-medium">{order.estimatedWeight}g</p>
                            </div>
                            <div className="flex items-end gap-2">
                              {order.gdriveLink && (
                                <Button asChild variant="outline" size="sm" className="gap-2">
                                  <a href={order.gdriveLink} target="_blank" rel="noopener noreferrer">
                                    <FileBox className="h-3.5 w-3.5" /> File
                                  </a>
                                </Button>
                              )}
                              <Button variant="outline" size="sm" className="gap-2" onClick={() => setChatOrder(order)}>
                                <MessageSquareText className="h-3.5 w-3.5" /> Chat
                              </Button>
                            </div>
                          </div>

                          {order.orderStatus === "delivering" && (
                            <div className="mt-5 flex items-center gap-2 rounded-xl border border-blue-500/20 bg-blue-500/10 px-4 py-3 text-sm text-blue-300">
                              <Truck className="h-4 w-4" /> This order is currently marked as delivering.
                            </div>
                          )}
                          {order.orderStatus === "completed" && (
                            <div className="mt-5 flex items-center gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">
                              <CheckCircle2 className="h-4 w-4" /> This order has been completed.
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
              )
            ) : data.quotes.length === 0 ? (
              <div className="rounded-2xl border border-border/50 bg-card/30 p-16 text-center backdrop-blur-sm">
                <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4 opacity-40" />
                <h3 className="text-xl font-display font-semibold mb-2">No quotes for this customer</h3>
                <p className="text-muted-foreground">Quote requests sent from this email will appear here.</p>
              </div>
            ) : (
              <div className="grid gap-5">
                {data.quotes.map((quote) => (
                  <Card key={quote._id} className="glass rounded-2xl border-border/40 transition-all duration-300 hover:border-primary/30">
                    <CardContent className="p-5 sm:p-8">
                      <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
                        <div className="min-w-0 space-y-3">
                          <div className="flex flex-wrap items-center gap-3">
                            <Badge variant="outline" className={statusTone(quote.status)}>{quote.status.toUpperCase()}</Badge>
                            <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">QUOTE-{quote._id.slice(-6).toUpperCase()}</span>
                          </div>
                          <h2 className="font-display text-2xl font-bold tracking-normal">Quote Request</h2>
                          <p className="line-clamp-2 text-sm text-muted-foreground">{quote.projectDescription}</p>
                          {quote.technicalSpecifications && (
                            <p className="rounded-xl border border-border/50 bg-muted/30 p-3 text-sm text-muted-foreground">{quote.technicalSpecifications}</p>
                          )}
                        </div>
                        <div className="text-left sm:text-right">
                          <p className="font-display text-xl font-bold text-primary">{quote.budget}</p>
                          <p className="mt-1 text-xs text-muted-foreground">{format(new Date(quote.createdAt), "MMM d, yyyy")}</p>
                        </div>
                      </div>
                      <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-border/40 pt-5">
                        <div className="text-xs text-muted-foreground">Source: <span className="text-primary">{quote.source}</span></div>
                        <Button variant="outline" size="sm" className="gap-2" onClick={() => setChatQuote(quote)}>
                          <MessageSquareText className="h-3.5 w-3.5" /> Chat
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </section>
      </main>

      <Dialog open={!!chatOrder} onOpenChange={(open) => !open && setChatOrder(null)}>
        <DialogContent className="max-w-2xl border-border/60 bg-card p-0">
          <DialogHeader className="sr-only">
            <DialogTitle>Order customer chat</DialogTitle>
          </DialogHeader>
          {chatOrder && (
            <OrderChat
              orderId={chatOrder._id}
              orderLabel={`#${chatOrder._id.slice(-8).toUpperCase()} ${chatOrder.fileName || ""}`}
              isAdmin
            />
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={!!chatQuote} onOpenChange={(open) => !open && setChatQuote(null)}>
        <DialogContent className="max-w-2xl border-border/60 bg-card p-0">
          <DialogHeader className="sr-only">
            <DialogTitle>Quote customer chat</DialogTitle>
          </DialogHeader>
          {chatQuote && (
            <QuoteChat
              quoteId={chatQuote._id}
              quoteLabel={`QUOTE-${chatQuote._id.slice(-6).toUpperCase()}`}
              isAdmin
            />
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!rejectTarget} onOpenChange={(open) => { if (!open) { setRejectTarget(null); setRejectReason(""); } }}>
        <AlertDialogContent className="border-border/60 bg-card">
          <AlertDialogHeader>
            <AlertDialogTitle>Reject Order</AlertDialogTitle>
            <AlertDialogDescription>
              You are rejecting order #{rejectTarget?._id.slice(-8).toUpperCase()}. Add a clear reason for the customer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <Textarea
            placeholder="E.g., Model is non-manifold, dimensions are too small, etc."
            value={rejectReason}
            onChange={(event) => setRejectReason(event.target.value)}
            className="min-h-[100px] bg-card/70"
          />
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleRejectOrder} disabled={!rejectReason.trim()} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Reject Order
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent className="border-border/60 bg-card">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Order</AlertDialogTitle>
            <AlertDialogDescription>
              Delete order #{deleteTarget?._id.slice(-8).toUpperCase()}? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteOrder} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete Order
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AdminCustomerOrders;
