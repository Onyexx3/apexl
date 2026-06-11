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
import { Loader2, AlertTriangle } from "lucide-react";

interface OverflowContributionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  overflowAmount: number;
  memberId: string;
  memberName: string;
  contributionAmount: number;
  onSuccess?: () => void;
}

export function OverflowContributionDialog({
  open,
  onOpenChange,
  overflowAmount,
  memberId,
  memberName,
  contributionAmount,
  onSuccess,
}: OverflowContributionDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [planName, setPlanName] = useState(`${memberName}'s New Savings Plan`);

  const createPlanMutation = useMutation({
    mutationFn: async () => {
      const targetAmount = contributionAmount * 31;
      const res = await apiRequest("POST", "/api/savings-plans", {
        memberId,
        planName,
        targetAmount: targetAmount.toString(),
        contributionAmount: contributionAmount.toString(),
        maxContributions: 31,
        maxDays: 62,
      });
      return await res.json();
    },
    onSuccess: async (newPlan) => {
      if (overflowAmount >= contributionAmount) {
        await apiRequest("POST", `/api/plans/${newPlan.id}/contribute`, {
          memberId,
          amount: overflowAmount.toString(),
        });
      }
      
      queryClient.invalidateQueries({ queryKey: ["/api/savings-plans"] });
      queryClient.invalidateQueries({ queryKey: ["/api/members", memberId, "plans"] });
      
      toast({
        title: "New Plan Created",
        description: `A new savings plan has been created with ₦${overflowAmount.toFixed(2)} initial contribution.`,
      });
      
      onOpenChange(false);
      onSuccess?.();
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to create plan",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            Contribution Overflow
          </DialogTitle>
          <DialogDescription>
            The amount paid exceeds the remaining timeline slots. Would you like to create a new savings plan with the remaining ₦{overflowAmount.toFixed(2)}?
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="rounded-lg bg-amber-50 p-4 text-sm text-amber-800">
            <p className="font-medium">Overflow Amount: ₦{overflowAmount.toFixed(2)}</p>
            <p className="mt-1 text-amber-600">
              This amount will be used as the first contribution(s) to the new plan.
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="planName">New Plan Name</Label>
            <Input
              id="planName"
              value={planName}
              onChange={(e) => setPlanName(e.target.value)}
              placeholder="Enter plan name"
            />
          </div>
        </div>
        <DialogFooter className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={createPlanMutation.isPending}
          >
            Skip
          </Button>
          <Button
            onClick={() => createPlanMutation.mutate()}
            disabled={createPlanMutation.isPending}
          >
            {createPlanMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : (
              "Create New Plan"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
