import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertCircle,
  CheckCircle,
  Clock,
  CreditCard,
  IndianRupee,
  Loader2,
  Shield,
  TrendingUp,
  Wallet,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { paymentService } from "@/services/payment.service";
import { contractService } from "@/services/contract.service";

interface PaymentDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (paymentData: any) => void;
  orderId: string;
  amount: number;
  title: string;
  freelancerName?: string;
  freelancerId?: string;
  freelancerUpiId?: string;
  clientName?: string;
  paymentMode?: "order" | "freelance";
  paymentPurpose?: "milestone" | "final";
  milestoneId?: string;
}

const PaymentDialog: React.FC<PaymentDialogProps> = ({
  isOpen,
  onClose,
  onSuccess,
  orderId,
  amount,
  title,
  freelancerName = "Freelancer",
  freelancerId,
  freelancerUpiId = "",
  clientName = "Client",
  paymentMode = "order",
  paymentPurpose = "milestone",
  milestoneId,
}) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<"details" | "processing" | "success">("details");
  const [paymentId, setPaymentId] = useState("");
  const [paymentStatus, setPaymentStatus] = useState<"pending" | "completed" | "failed">("pending");
  const [orderData, setOrderData] = useState<any>(null);

  const feeBreakdown = paymentService.calculateFees(amount);
  const platformFee = feeBreakdown.platformFee;
  const freelancerAmount = feeBreakdown.freelancerAmount;
  const platformFeePercentage = feeBreakdown.platformFeePercentage;
  const platformUpiId = import.meta.env.VITE_PLATFORM_UPI_ID || "";

  useEffect(() => {
    if (!isOpen) return;
    setStep("details");
    setPaymentStatus("pending");
    setPaymentId("");
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && orderId && paymentMode === "order") {
      paymentService.getOrder(orderId).then(setOrderData).catch((error) => {
        console.error("Failed to load order details:", error);
      });
    }
  }, [isOpen, orderId, paymentMode]);

  const getErrorMessage = (error: any) =>
    error?.response?.data?.message ||
    error?.response?.data?.error ||
    error?.message ||
    "Something went wrong. Please try again.";

  const handlePayment = async () => {
    setLoading(true);
    setStep("processing");

    try {
      const order = paymentMode === "freelance"
        ? await contractService.createContractPaymentOrder(orderId, {
            amount,
            milestoneId,
            purpose: paymentPurpose,
          })
        : await paymentService.createPaymentOrder(orderId, amount * 100);

      if (!window.Razorpay) {
        const script = document.createElement("script");
        script.src = "https://checkout.razorpay.com/v1/checkout.js";
        script.async = true;
        document.body.appendChild(script);
        await new Promise((resolve) => {
          script.onload = resolve;
        });
      }

      const RazorpayCheckout = window.Razorpay;
      if (!RazorpayCheckout) {
        throw new Error("Razorpay checkout could not be loaded.");
      }

      const options = {
        key: order.keyId || import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount: order.amount,
        currency: order.currency,
        name: "Destny",
        description: `Payment for: ${title}`,
        order_id: order.razorpayOrderId,
        prefill: {
          name: clientName,
          email: "client@example.com",
          contact: "9999999999",
        },
        notes: {
          orderId,
          contractId: paymentMode === "freelance" ? orderId : "",
          milestoneId: milestoneId || "",
          purpose: paymentPurpose,
          platformFee,
          freelancerAmount,
          freelancerId: freelancerId || "",
          platformUpiId,
          freelancerUpiId,
          platformFeePercentage: String(platformFeePercentage),
        },
        theme: { color: "#7C3AED" },
        modal: {
          ondismiss: () => {
            setStep("details");
            setLoading(false);
            toast({
              title: "Payment cancelled",
              description: "You cancelled the payment.",
              variant: "destructive",
            });
          },
        },
        handler: async (response: any) => {
          setPaymentId(response.razorpay_payment_id);

          try {
            const verification = paymentMode === "freelance"
              ? await contractService.verifyContractPayment(orderId, {
                  amount,
                  milestoneId,
                  purpose: paymentPurpose,
                  razorpayPaymentId: response.razorpay_payment_id,
                  razorpayOrderId: response.razorpay_order_id,
                  razorpaySignature: response.razorpay_signature,
                })
              : await paymentService.verifyPayment(orderId, {
                  razorpayPaymentId: response.razorpay_payment_id,
                  razorpayOrderId: response.razorpay_order_id,
                  razorpaySignature: response.razorpay_signature,
                });

            setPaymentStatus("completed");
            setStep("success");

            toast({
              title: "Payment successful",
              description: `INR ${amount.toLocaleString()} has been paid successfully.`,
            });

            onSuccess({
              orderId: response.razorpay_order_id || orderId,
              paymentId: response.razorpay_payment_id,
              razorpayOrderId: response.razorpay_order_id,
              razorpaySignature: response.razorpay_signature,
              amount,
              platformFee,
              freelancerAmount,
              paymentMethod: "razorpay",
              verification,
            });
          } catch (error) {
            toast({
              title: "Verification failed",
              description: "Payment was successful but verification failed. Please contact support.",
              variant: "destructive",
            });
            setPaymentStatus("failed");
          }

          setLoading(false);
        },
      };

      const razorpay = new RazorpayCheckout(options);
      razorpay.on("payment.failed", async (response: any) => {
        try {
          if (paymentMode === "freelance") {
            await contractService.markContractPaymentFailed(orderId, {
              razorpayOrderId: order.razorpayOrderId,
              failureReason: response?.error?.description || "payment_failed",
            });
          } else {
            await paymentService.markPaymentFailed(orderId);
          }
        } catch (e) {
          console.error("Failed to mark payment as failed:", e);
        }

        setPaymentStatus("failed");
        setStep("details");
        setLoading(false);
        toast({
          title: "Payment failed",
          description: response?.error?.description || "Something went wrong. Please try again.",
          variant: "destructive",
        });
      });
      razorpay.open();
    } catch (error: any) {
      console.error("Payment error:", error);
      const errorMessage = getErrorMessage(error);

      try {
        if (paymentMode === "freelance") {
          await contractService.markContractPaymentFailed(orderId, {
            failureReason: errorMessage,
          });
        } else {
          await paymentService.markPaymentFailed(orderId);
        }
      } catch (e) {
        console.error("Failed to mark payment as failed:", e);
      }

      toast({
        title: "Payment failed",
        description: errorMessage,
        variant: "destructive",
      });
      setStep("details");
      setLoading(false);
      setPaymentStatus("failed");
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
            onClick={loading ? undefined : onClose}
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
          >
            <div className="pointer-events-auto w-full max-w-lg max-h-[90vh] overflow-y-auto glass-strong rounded-2xl border border-border shadow-2xl">
              <div className="sticky top-0 glass-strong border-b border-border px-6 py-4 flex items-center justify-between z-10">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <CreditCard className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-foreground">Make Payment</h2>
                    <p className="text-xs text-muted-foreground">
                      Secure payment via Razorpay
                    </p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 rounded-lg hover:bg-muted/20 transition-colors"
                  disabled={loading}
                >
                  <X className="h-5 w-5 text-muted-foreground" />
                </button>
              </div>

              <div className="p-6">
                {step === "details" && (
                  <div className="space-y-4">
                    {orderData && (
                      <div className="bg-muted/20 rounded-xl p-3 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Order ID</span>
                          <span className="font-mono text-foreground">#{orderData._id?.slice(-6) || orderId.slice(-6)}</span>
                        </div>
                        <div className="flex justify-between mt-1">
                          <span className="text-muted-foreground">Status</span>
                          <span className="font-medium text-foreground">{orderData.status || "Pending"}</span>
                        </div>
                      </div>
                    )}

                    <div className="bg-muted/20 rounded-xl p-4 space-y-3">
                      <h4 className="font-semibold text-foreground">Payment Summary</h4>
                      <div className="flex justify-between gap-4 text-sm">
                        <span className="text-muted-foreground">Project</span>
                        <span className="font-medium text-foreground text-right">{title}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Freelancer</span>
                        <span className="font-medium text-foreground">{freelancerName}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Total Amount</span>
                        <span className="font-bold text-primary">INR {amount.toLocaleString()}</span>
                      </div>

                      <div className="border-t border-border pt-3 mt-2 space-y-2">
                        <div className="flex justify-between text-sm bg-primary/5 rounded-lg p-2">
                          <div className="flex items-center gap-2">
                            <TrendingUp className="h-4 w-4 text-primary" />
                            <div>
                              <span className="text-primary font-medium">Platform Fee ({platformFeePercentage}%)</span>
                              {paymentMode === "freelance" && (
                                <p className="text-[11px] text-muted-foreground break-all">{platformUpiId || "Platform UPI not set"}</p>
                              )}
                            </div>
                          </div>
                          <span className="font-semibold text-primary">INR {platformFee.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-sm bg-green-500/5 rounded-lg p-2">
                          <div className="flex items-center gap-2">
                            <Wallet className="h-4 w-4 text-green-500" />
                            <div>
                              <span className="text-green-500 font-medium">Freelancer Receives</span>
                              {paymentMode === "freelance" && (
                                <p className="text-[11px] text-muted-foreground break-all">{freelancerUpiId || "Freelancer UPI not set"}</p>
                              )}
                            </div>
                          </div>
                          <span className="font-semibold text-green-500">INR {freelancerAmount.toLocaleString()}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 text-xs text-muted-foreground bg-blue-500/5 border border-blue-500/20 rounded-lg p-3">
                      <Shield className="h-4 w-4 text-blue-500 flex-shrink-0" />
                      <span>
                        {paymentMode === "freelance"
                          ? "Freelance payments are recorded only after Razorpay verifies the transaction."
                          : "Your payment is secured through Razorpay."}
                      </span>
                    </div>

                    <Button className="w-full glow-primary gap-2" onClick={handlePayment} disabled={loading}>
                      <IndianRupee className="h-4 w-4" />
                      {paymentMode === "freelance"
                        ? `Pay with Razorpay - INR ${amount.toLocaleString()}`
                        : `Pay INR ${amount.toLocaleString()} Securely`}
                    </Button>
                  </div>
                )}

                {step === "processing" && (
                  <div className="text-center py-8">
                    <div className="flex justify-center mb-4">
                      <Loader2 className="h-16 w-16 animate-spin text-primary" />
                    </div>
                    <h3 className="text-xl font-semibold text-foreground mb-2">Processing Payment</h3>
                    <p className="text-muted-foreground text-sm">Please wait while we process your payment...</p>
                  </div>
                )}

                {step === "success" && (
                  <div className="text-center py-8">
                    <div className="flex justify-center mb-4">
                      {paymentStatus === "completed" ? (
                        <CheckCircle className="h-16 w-16 text-green-500" />
                      ) : paymentStatus === "failed" ? (
                        <AlertCircle className="h-16 w-16 text-red-500" />
                      ) : (
                        <Clock className="h-16 w-16 text-yellow-500" />
                      )}
                    </div>
                    <h3 className="text-xl font-semibold text-foreground mb-2">
                      {paymentStatus === "completed" ? "Payment Recorded" : paymentStatus === "failed" ? "Payment Failed" : "Payment Pending"}
                    </h3>
                    <p className="text-muted-foreground text-sm">
                      {paymentStatus === "completed"
                        ? `INR ${amount.toLocaleString()} has been recorded successfully.`
                        : paymentStatus === "failed"
                          ? "Something went wrong. Please try again."
                          : "Your payment is being processed."}
                    </p>
                    {paymentStatus === "completed" && (
                      <div className="mt-4 p-4 bg-primary/5 rounded-xl border border-primary/20">
                        <p className="text-sm font-medium text-foreground">Fee Breakdown</p>
                        <div className="flex justify-between text-sm mt-2">
                          <span className="text-muted-foreground">Platform Fee ({platformFeePercentage}%)</span>
                          <span className="text-primary">INR {platformFee.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Freelancer Receives</span>
                          <span className="text-green-500 font-semibold">INR {freelancerAmount.toLocaleString()}</span>
                        </div>
                      </div>
                    )}
                    {paymentId && paymentStatus === "completed" && (
                      <p className="text-xs text-muted-foreground mt-2">Transaction ID: {paymentId}</p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default PaymentDialog;
