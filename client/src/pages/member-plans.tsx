import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useRoute, Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { ArrowLeft, Target, Banknote } from "lucide-react";
import type { MemberWithTransactions, SavingsPlan } from "@shared/schema";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest, invalidateAllQueries } from "@/lib/queryClient";
import { getPlanMaxContributions } from "@/lib/savingsPlan";

export default function MemberPlans() {
  const [, params] = useRoute("/members/:memberId/plans");
  const memberId = params?.memberId;

  const { data: member, isLoading: memberLoading } = useQuery<MemberWithTransactions>({
    queryKey: ["/api/members", memberId],
    enabled: !!memberId,
  });

  const { data: plans, isLoading: plansLoading } = useQuery<SavingsPlan[]>({
    queryKey: ["/api/members", memberId, "plans"],
    enabled: !!memberId,
  });

  if (memberLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid gap-6">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-40" />
          ))}
        </div>
      </div>
    );
  }

  if (!member) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <p className="text-sm font-medium">Member not found</p>
        <Button asChild className="mt-4">
          <Link href="/members">Back to Members</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild data-testid="button-back">
          <Link href={`/members/${memberId}`}>
            <ArrowLeft className="w-4 h-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-semibold" data-testid="text-page-title">
            {member.name}'s Savings Plans
          </h1>
          <p className="text-sm text-muted-foreground">Manage all savings plans for this member</p>
        </div>
      </div>

      {plansLoading ? (
        <div className="grid gap-6">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-40" />
          ))}
        </div>
      ) : !plans || plans.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Target className="w-8 h-8 text-muted-foreground mb-3" />
            <p className="text-sm font-medium">No savings plans yet</p>
            <p className="text-xs text-muted-foreground mt-1">Create a plan from the member's profile</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {plans.filter(p => p.status === "active").length > 0 && (
            <div>
              <h2 className="text-lg font-semibold mb-4">Active Plans</h2>
              <div className="grid gap-6">
                {plans.filter(p => p.status === "active").map((plan) => (
                  <PlanCard key={plan.id} plan={plan} memberId={memberId} />
                ))}
              </div>
            </div>
          )}
          {plans.filter(p => p.status !== "active").length > 0 && (
            <div>
              <h2 className="text-lg font-semibold mb-4">Completed Plans</h2>
              <div className="grid gap-6">
                {plans.filter(p => p.status !== "active").map((plan) => (
                  <PlanCard key={plan.id} plan={plan} memberId={memberId} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function PlanCard({ plan, memberId }: { plan: SavingsPlan; memberId?: string }) {
  const { toast } = useToast();
  const { user } = useAuth();
  const [borrowDialog, setBorrowDialog] = useState(false);
  const [borrowAmount, setBorrowAmount] = useState("");

  const statusColor = plan.status === "active" ? "default" : plan.status === "completed" ? "secondary" : "outline";
  const maxContributions = getPlanMaxContributions(plan);
  const progress = (plan.contributionsCount / maxContributions) * 100;
  const maxBorrowable = parseFloat(plan.totalSaved) * 0.5;

  const closePlanMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("PATCH", `/api/plans/${plan.id}/close`, {});
    },
    onSuccess: () => {
      invalidateAllQueries();
      toast({
        title: "Plan closed",
        description: "Savings plan has been closed and funds transferred to wallet.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to close plan.",
        variant: "destructive",
      });
    },
  });

  const deletePlanMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("DELETE", `/api/plans/${plan.id}`, undefined);
    },
    onSuccess: () => {
      invalidateAllQueries();
      toast({
        title: "Plan deleted",
        description: "Cancelled savings plan has been permanently deleted.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete plan.",
        variant: "destructive",
      });
    },
  });

  const borrowMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", `/api/loans`, {
        memberId,
        planId: plan.id,
        amount: borrowAmount,
      });
    },
    onSuccess: () => {
      invalidateAllQueries();
      setBorrowDialog(false);
      setBorrowAmount("");
      toast({
        title: "Loan request submitted",
        description: "Your loan request has been submitted for approval.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to request loan.",
        variant: "destructive",
      });
    },
  });

  return (
    <>
      <Card data-testid={`card-plan-${plan.id}`}>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <CardTitle className="text-lg">{plan.planName}</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Created {format(new Date(plan.startDate), "MMM dd, yyyy")}
              </p>
            </div>
            <Badge variant={statusColor}>{plan.status}</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-3 gap-4">
            <div>
              <p className="text-xs text-muted-foreground">Daily Target</p>
              <p className="text-lg font-semibold">₦{parseFloat(plan.contributionAmount).toFixed(2)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Target Amount</p>
              <p className="text-lg font-semibold">₦{parseFloat(plan.targetAmount).toFixed(2)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Total Saved</p>
              <p className="text-lg font-semibold text-primary">₦{parseFloat(plan.totalSaved).toFixed(2)}</p>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <p className="text-sm font-medium">Progress</p>
              <p className="text-sm text-muted-foreground">{plan.contributionsCount}/{maxContributions} days</p>
            </div>
            <div className="w-full bg-muted rounded-full h-3 overflow-hidden">
              <div
                className="bg-primary h-full rounded-full transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {plan.status === "active" && maxBorrowable > 0 && (
            <div className="p-3 rounded-lg bg-blue-50 border border-blue-200">
              <p className="text-sm text-blue-700">
                <Banknote className="w-4 h-4 inline mr-1" />
                You can borrow up to ₦{maxBorrowable.toFixed(2)} (50% of savings)
              </p>
            </div>
          )}

          {plan.status === "completed" && plan.completedDate && (
            <div className="p-3 rounded-lg bg-secondary/10 border border-secondary/20">
              <p className="text-sm text-secondary-foreground">
                Completed on {format(new Date(plan.completedDate), "MMM dd, yyyy")}
              </p>
            </div>
          )}

          <div className="flex gap-2 flex-wrap">
            <Button asChild className="flex-1" variant="outline">
              <Link href={`/members/${memberId}/plans/${plan.id}`}>
                View Details
              </Link>
            </Button>
            {plan.status === "active" && maxBorrowable > 0 && (
              <Button 
                className="flex-1"
                variant="secondary"
                onClick={() => setBorrowDialog(true)}
              >
                <Banknote className="w-4 h-4 mr-1" />
                Request Loan
              </Button>
            )}
            {plan.status === "active" && (
              <Button
                className="flex-1"
                variant="destructive"
                onClick={() => {
                  if (confirm("Close this savings plan? Remaining balance (minus a one-contribution fee) will be transferred to wallet.")) {
                    closePlanMutation.mutate();
                  }
                }}
                disabled={closePlanMutation.isPending}
              >
                {closePlanMutation.isPending ? "Closing..." : "Close Plan"}
              </Button>
            )}
            {plan.status === "cancelled" && user?.role === "admin" && (
              <Button
                className="flex-1"
                variant="destructive"
                onClick={() => {
                  if (confirm("Permanently delete this cancelled plan? This cannot be undone.")) {
                    deletePlanMutation.mutate();
                  }
                }}
                disabled={deletePlanMutation.isPending}
              >
                {deletePlanMutation.isPending ? "Deleting..." : "Delete Plan"}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <Dialog open={borrowDialog} onOpenChange={setBorrowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Request Loan from Savings</DialogTitle>
            <DialogDescription>
              Borrow up to 50% of your savings (₦{maxBorrowable.toFixed(2)}) with 5% interest.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="borrowAmount">Loan Amount (₦)</Label>
              <Input
                id="borrowAmount"
                type="number"
                step="0.01"
                min="0"
                max={maxBorrowable}
                value={borrowAmount}
                onChange={(e) => setBorrowAmount(e.target.value)}
                placeholder={`Max: ₦${maxBorrowable.toFixed(2)}`}
              />
            </div>
            {borrowAmount && parseFloat(borrowAmount) > 0 && (
              <div className="p-3 rounded-lg bg-muted">
                <div className="flex justify-between text-sm">
                  <span>Loan Amount:</span>
                  <span>₦{parseFloat(borrowAmount).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Interest (5%):</span>
                  <span>₦{(parseFloat(borrowAmount) * 0.05).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm font-semibold mt-1 pt-1 border-t">
                  <span>Total Repayment:</span>
                  <span>₦{(parseFloat(borrowAmount) * 1.05).toFixed(2)}</span>
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBorrowDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => borrowMutation.mutate()}
              disabled={borrowMutation.isPending || !borrowAmount || parseFloat(borrowAmount) <= 0 || parseFloat(borrowAmount) > maxBorrowable}
            >
              {borrowMutation.isPending ? "Submitting..." : "Submit Request"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
