import { useCallback, useEffect, useState } from "react";
import axios from "axios";
import { format } from "date-fns";
import { Link } from "react-router-dom";
import { ArrowRight, FileText, Loader2, MessageSquareText, RotateCcw } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import QuoteChat from "@/components/QuoteChat";

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

const statusTone = (status: string) => {
  const lower = status.toLowerCase();
  if (lower.includes("rejected")) return "border-destructive/30 bg-destructive/10 text-destructive";
  if (lower.includes("completed") || lower.includes("accepted")) return "border-emerald-500/30 bg-emerald-500/10 text-emerald-400";
  if (lower.includes("production")) return "border-blue-500/30 bg-blue-500/10 text-blue-400";
  return "border-secondary/30 bg-secondary/10 text-secondary";
};

const YourQuotes = () => {
  const backendUrl = import.meta.env.VITE_BACKEND_URL;
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [chatQuote, setChatQuote] = useState<Quote | null>(null);

  const fetchQuotes = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${backendUrl}/api/v1/quotes/my-quotes`, { withCredentials: true });
      setQuotes(res.data?.data || []);
      setError(null);
    } catch {
      setError("Failed to load your quote requests.");
    } finally {
      setLoading(false);
    }
  }, [backendUrl]);

  useEffect(() => {
    fetchQuotes();
  }, [fetchQuotes]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <main className="relative overflow-hidden pt-24">
        <div className="fixed inset-0 gradient-mesh pointer-events-none" />
        <section className="relative z-10 border-b border-border/60">
          <div className="container mx-auto px-6 py-10 lg:py-14">
            <Badge variant="outline" className="border-primary/30 bg-primary/10 text-primary">Customer workspace</Badge>
            <h1 className="mt-5 font-display text-4xl font-bold sm:text-5xl">Your Quotes</h1>
            <p className="mt-4 max-w-2xl text-muted-foreground">
              Review quote requests, track their status, and chat with Destny about scope, pricing, and next steps.
            </p>
            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <Button asChild size="lg" className="glow-primary">
                <Link to="/#contact">Request New Quote <ArrowRight className="h-4 w-4" /></Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link to="/orders">Your Orders</Link>
              </Button>
            </div>
          </div>
        </section>

        <section className="relative z-10">
          <div className="container mx-auto px-6 py-10">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 gap-4">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
                <p className="text-muted-foreground">Loading your quote requests...</p>
              </div>
            ) : error ? (
              <div className="rounded-2xl border border-destructive/20 bg-destructive/10 p-12 text-center">
                <p className="mb-4 text-destructive">{error}</p>
                <Button variant="outline" onClick={fetchQuotes}>Try Again</Button>
              </div>
            ) : quotes.length === 0 ? (
              <div className="rounded-2xl border border-border/50 bg-card/30 p-16 text-center backdrop-blur-sm">
                <FileText className="mx-auto mb-4 h-12 w-12 text-muted-foreground opacity-40" />
                <h3 className="mb-2 font-display text-xl font-semibold">No quote requests yet</h3>
                <p className="mx-auto mb-8 max-w-sm text-muted-foreground">Your project quote requests will appear here.</p>
                <Button asChild className="glow-primary"><Link to="/#contact">Request a Quote</Link></Button>
              </div>
            ) : (
              <div className="grid gap-5">
                {quotes.map((quote) => (
                  <Card key={quote._id} className="glass rounded-2xl border-border/40">
                    <CardContent className="p-5 sm:p-8">
                      <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
                        <div className="min-w-0 space-y-3">
                          <div className="flex flex-wrap items-center gap-3">
                            <Badge variant="outline" className={statusTone(quote.status)}>{quote.status.toUpperCase()}</Badge>
                            <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">QUOTE-{quote._id.slice(-6).toUpperCase()}</span>
                          </div>
                          <h2 className="font-display text-2xl font-bold">Quote Request</h2>
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
                        <Button variant="outline" size="sm" className="gap-2" onClick={() => setChatQuote(quote)}>
                          <MessageSquareText className="h-3.5 w-3.5" /> Chat
                        </Button>
                        <Button asChild variant="ghost" size="sm" className="gap-2">
                          <Link to="/#contact"><RotateCcw className="h-3.5 w-3.5" /> New Quote</Link>
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
      <Footer />

      <Dialog open={!!chatQuote} onOpenChange={(open) => !open && setChatQuote(null)}>
        <DialogContent className="max-w-2xl border-border/60 bg-card p-0">
          <DialogHeader className="sr-only">
            <DialogTitle>Quote chat</DialogTitle>
          </DialogHeader>
          {chatQuote && (
            <QuoteChat quoteId={chatQuote._id} quoteLabel={`QUOTE-${chatQuote._id.slice(-6).toUpperCase()}`} />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default YourQuotes;
