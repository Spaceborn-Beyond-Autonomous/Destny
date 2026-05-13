import { CreditCard, ReceiptText } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const PaymentSection = ({ userId }: { userId: string }) => (
  <Card className="glass border-border/40">
    <CardHeader>
      <CardTitle>Payments</CardTitle>
      <CardDescription>Review quote totals, invoices, and production payment status.</CardDescription>
    </CardHeader>
    <CardContent className="grid md:grid-cols-2 gap-4">
      <div className="rounded-xl border border-border/50 p-5">
        <CreditCard className="h-5 w-5 text-primary mb-3" />
        <h3 className="font-display font-semibold">Payment status</h3>
        <p className="text-sm text-muted-foreground mt-2">No open payment items for {userId || "this workspace"}.</p>
      </div>
      <div className="rounded-xl border border-border/50 p-5">
        <ReceiptText className="h-5 w-5 text-primary mb-3" />
        <h3 className="font-display font-semibold">Quote invoices</h3>
        <p className="text-sm text-muted-foreground mt-2">Approved quotes and receipts will appear here for each Destny order.</p>
      </div>
    </CardContent>
  </Card>
);

export default PaymentSection;
