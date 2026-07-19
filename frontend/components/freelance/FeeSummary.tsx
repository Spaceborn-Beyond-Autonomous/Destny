import React from 'react';
import { TrendingUp, Wallet, Users, IndianRupee } from 'lucide-react';

interface FeeSummaryProps {
  totalAmount: number;
  platformFee: number;
  freelancerAmount: number;
  platformFeePercentage?: number;
}

const FeeSummary: React.FC<FeeSummaryProps> = ({
  totalAmount,
  platformFee,
  freelancerAmount,
  platformFeePercentage = 15
}) => {
  return (
    <div className="glass rounded-2xl p-6 border border-border">
      <h4 className="font-semibold text-foreground mb-4">Fee Breakdown</h4>
      
      <div className="space-y-3">
        {/* Total Amount */}
        <div className="flex justify-between items-center p-3 bg-muted/20 rounded-xl">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <IndianRupee className="h-4 w-4 text-primary" />
            </div>
            <span className="text-sm text-muted-foreground">Total Amount</span>
          </div>
          <span className="font-bold text-foreground">₹{totalAmount.toLocaleString()}</span>
        </div>

        {/* Platform Fee */}
        <div className="flex justify-between items-center p-3 bg-primary/5 rounded-xl border border-primary/20">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <TrendingUp className="h-4 w-4 text-primary" />
            </div>
            <div>
              <span className="text-sm font-medium text-primary">Platform Fee ({platformFeePercentage}%)</span>
              <p className="text-xs text-muted-foreground">Goes to Destny for platform services</p>
            </div>
          </div>
          <span className="font-semibold text-primary">₹{platformFee.toLocaleString()}</span>
        </div>

        {/* Freelancer Receives */}
        <div className="flex justify-between items-center p-3 bg-green-500/5 rounded-xl border border-green-500/20">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-green-500/10">
              <Wallet className="h-4 w-4 text-green-500" />
            </div>
            <div>
              <span className="text-sm font-medium text-green-500">Freelancer Receives</span>
              <p className="text-xs text-muted-foreground">Net amount after platform fees</p>
            </div>
          </div>
          <span className="font-semibold text-green-500">₹{freelancerAmount.toLocaleString()}</span>
        </div>
      </div>

      {/* Note */}
      <div className="mt-4 p-3 bg-blue-500/5 rounded-xl border border-blue-500/20">
        <p className="text-xs text-muted-foreground flex items-center gap-2">
          <Users className="h-3 w-3 text-blue-500" />
          The platform fee helps us maintain a secure, reliable marketplace and provides support services.
        </p>
      </div>
    </div>
  );
};

export default FeeSummary;
