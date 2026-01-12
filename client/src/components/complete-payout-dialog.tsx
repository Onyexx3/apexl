import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";

interface CompletePayoutDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  transactionId: string;
  memberName: string;
  amount: number;
  onSuccess?: () => void;
}

const BANKS = [
  "Access Bank",
  "Citibank",
  "Ecobank",
  "Fidelity Bank",
  "First Bank of Nigeria",
  "First City Monument Bank (FCMB)",
  "Guaranty Trust Bank (GTBank)",
  "Heritage Bank",
  "Keystone Bank",
  "Polaris Bank",
  "Providus Bank",
  "Stanbic IBTC Bank",
  "Standard Chartered Bank",
  "Sterling Bank",
  "SunTrust Bank",
  "Union Bank of Nigeria",
  "United Bank for Africa (UBA)",
  "Unity Bank",
  "Wema Bank",
  "Zenith Bank",
  "Opay",
  "Palmpay",
  "Kuda Bank",
  "Moniepoint",
];

const PAYOUT_DESTINATIONS = [
  "Bank Transfer",
  "Cash",
  "Mobile Money",
  "Check",
];

export function CompletePayoutDialog({
  open,
  onOpenChange,
  transactionId,
  memberName,
  amount,
  onSuccess,
}: CompletePayoutDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [payoutDestination, setPayoutDestination] = useState("");
  const [payoutBankName, setPayoutBankName] = useState("");
  const [payoutAccountNumber, setPayoutAccountNumber] = useState("");
  const [payoutAccountName, setPayoutAccountName] = useState("");

  const completePayoutMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("PATCH", `/api/transactions/${transactionId}/complete-payout`, {
        payoutDestination,
        payoutBankName,
        payoutAccountNumber,
        payoutAccountName,
      });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/transactions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/transactions/payouts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      
      toast({
        title: "Payout Completed",
        description: `Payout of ₦${amount.toFixed(2)} to ${memberName} has been processed.`,
      });
      
      resetForm();
      onOpenChange(false);
      onSuccess?.();
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to complete payout",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setPayoutDestination("");
    setPayoutBankName("");
    setPayoutAccountNumber("");
    setPayoutAccountName("");
  };

  const isValid = payoutDestination && payoutBankName && payoutAccountNumber && payoutAccountName;

  return (
    <Dialog open={open} onOpenChange={(open) => {
      if (!open) resetForm();
      onOpenChange(open);
    }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Complete Payout</DialogTitle>
          <DialogDescription>
            Enter the payment details for {memberName}'s payout of ₦{amount.toFixed(2)}.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="payoutDestination">Payment Method</Label>
            <Select value={payoutDestination} onValueChange={setPayoutDestination}>
              <SelectTrigger>
                <SelectValue placeholder="Select payment method" />
              </SelectTrigger>
              <SelectContent>
                {PAYOUT_DESTINATIONS.map((dest) => (
                  <SelectItem key={dest} value={dest}>
                    {dest}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="payoutBankName">Bank Name</Label>
            <Select value={payoutBankName} onValueChange={setPayoutBankName}>
              <SelectTrigger>
                <SelectValue placeholder="Select bank" />
              </SelectTrigger>
              <SelectContent>
                {BANKS.map((bank) => (
                  <SelectItem key={bank} value={bank}>
                    {bank}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="payoutAccountNumber">Account Number</Label>
            <Input
              id="payoutAccountNumber"
              value={payoutAccountNumber}
              onChange={(e) => setPayoutAccountNumber(e.target.value)}
              placeholder="Enter account number"
              maxLength={11}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="payoutAccountName">Account Name</Label>
            <Input
              id="payoutAccountName"
              value={payoutAccountName}
              onChange={(e) => setPayoutAccountName(e.target.value)}
              placeholder="Enter account holder name"
            />
          </div>
        </div>
        <DialogFooter className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={completePayoutMutation.isPending}
          >
            Cancel
          </Button>
          <Button
            onClick={() => completePayoutMutation.mutate()}
            disabled={!isValid || completePayoutMutation.isPending}
          >
            {completePayoutMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              "Complete Payout"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
