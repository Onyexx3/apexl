import { useState } from "react";
import { useRoute, Link } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ArrowLeft, Plus, Target, CheckCircle, Clock, Banknote } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertPlanContributionSchema, type InsertPlanContribution, type SavingsPlan, type PlanContribution, type Member } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { format, differenceInDays } from "date-fns";
import { OverflowContributionDialog } from "@/components/overflow-contribution-dialog";

interface ContributionResult {
  contributions: PlanContribution[];
  overflowAmount: number;
  remainingSlots: number;
}

export default function PlanDetail() {
  const [, params] = useRoute("/members/:memberId/plans/:planId");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [overflowDialogOpen, setOverflowDialogOpen] = useState(false);
  const [overflowAmount, setOverflowAmount] = useState(0);
  const planId = params?.planId;
  const memberId = params?.memberId;
  const { toast } = useToast();

  const { data: plan, isLoading: planLoading } = useQuery<SavingsPlan & { contributions?: PlanContribution[] }>({
    queryKey: ["/api/savings-plans", planId],
    enabled: !!planId,
  });

  const { data: member } = useQuery<Member>({
    queryKey: ["/api/members", memberId],
    enabled: !!memberId,
  });

  const form = useForm<InsertPlanContribution>({
    resolver: zodResolver(insertPlanContributionSchema),
    defaultValues: {
      planId: planId || "",
      memberId: memberId || "",
      amount: "",
      paymentMethod: "",
      notes: "",
    },
  });

  const contributeMutation = useMutation({
    mutationFn: async (data: InsertPlanContribution) => {
      const res = await apiRequest("POST", `/api/plans/${planId}/contribute`, data);
      return await res.json() as ContributionResult;
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["/api/savings-plans", planId] });
      queryClient.invalidateQueries({ queryKey: ["/api/members", memberId, "plans"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      
      if (result.overflowAmount > 0 && result.remainingSlots === 0) {
        setOverflowAmount(result.overflowAmount);
        setOverflowDialogOpen(true);
        toast({
          title: "Contribution added",
          description: `${result.contributions.length} contribution(s) recorded. There's an overflow of ₦${result.overflowAmount.toFixed(2)}.`,
        });
      } else {
        toast({
          title: "Contribution added",
          description: `${result.contributions.length} contribution(s) recorded successfully.`,
        });
      }
      
      setDialogOpen(false);
      form.reset({ planId: planId || "", memberId: memberId || "", amount: "", paymentMethod: "", notes: "" });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to add contribution.",
        variant: "destructive",
      });
    },
  });

  const requestPayoutMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", `/api/plans/${planId}/request-payout`, {});
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/savings-plans", planId] });
      queryClient.invalidateQueries({ queryKey: ["/api/transactions/payouts"] });
      toast({
        title: "Payout Requested",
        description: "Payout request has been submitted. Staff will process it shortly.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to request payout.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: InsertPlanContribution) => {
    contributeMutation.mutate(data);
  };

  if (planLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Skeleton className="h-96" />
          <div className="lg:col-span-2">
            <Skeleton className="h-96" />
          </div>
        </div>
      </div>
    );
  }

  if (!plan) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <p className="text-sm font-medium">Plan not found</p>
        <Button asChild className="mt-4">
          <Link href="/plans">Back to Plans</Link>
        </Button>
      </div>
    );
  }

  const progressPercent = (plan.contributionsCount / plan.maxContributions) * 100;
  const remainingSlots = plan.maxContributions - plan.contributionsCount;
  const daysSinceStart = differenceInDays(new Date(), new Date(plan.startDate));
  const slotsRemaining = Math.max(0, 31 - plan.contributionsCount);
  const isCompleted = plan.status === "completed" || plan.status === "closed";
  const canRequestPayout = isCompleted && plan.payoutStatus !== "completed" && plan.payoutStatus !== "requested";

  const timelineSlots = Array.from({ length: plan.maxContributions }, (_, i) => {
    const contribution = plan.contributions?.find(c => c.contributionNumber === i + 1);
    return {
      number: i + 1,
      filled: !!contribution,
      contribution,
    };
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild data-testid="button-back">
          <Link href={`/members/${memberId}/plans`}>
            <ArrowLeft className="w-4 h-4" />
          </Link>
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-semibold" data-testid="text-plan-name">{plan.planName}</h1>
          <p className="text-sm text-muted-foreground">Member: {member?.name}</p>
        </div>
        {canRequestPayout && (
          <Button 
            onClick={() => requestPayoutMutation.mutate()}
            disabled={requestPayoutMutation.isPending}
          >
            <Banknote className="w-4 h-4 mr-2" />
            Request Payout
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Plan Overview</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Status</span>
                <Badge variant={plan.status === "active" ? "default" : plan.status === "completed" ? "secondary" : "outline"}>
                  {plan.status}
                </Badge>
              </div>
              {plan.payoutStatus && plan.payoutStatus !== "none" && (
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Payout Status</span>
                  <Badge variant={plan.payoutStatus === "completed" ? "default" : "secondary"}>
                    {plan.payoutStatus}
                  </Badge>
                </div>
              )}
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Target Amount</span>
                <span className="font-semibold tabular-nums">₦{parseFloat(plan.targetAmount).toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Per Contribution</span>
                <span className="font-semibold tabular-nums">₦{parseFloat(plan.contributionAmount).toFixed(2)}</span>
              </div>
            </div>

            <div className="pt-4 border-t space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Timeline Progress</span>
                <span className="text-sm text-muted-foreground">{plan.contributionsCount}/{plan.maxContributions} slots</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div
                  className="bg-primary h-2 rounded-full transition-all"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{remainingSlots} slots remaining</span>
                <span>{slotsRemaining} of 31 days</span>
              </div>
            </div>

            <div className="pt-4 border-t space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Total Saved</span>
                <span className="text-lg font-bold tabular-nums text-primary">
                  ₦{parseFloat(plan.totalSaved).toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between items-center text-xs text-muted-foreground">
                <span>Started: {format(new Date(plan.startDate), "MMM dd, yyyy")}</span>
              </div>
              {plan.completedDate && (
                <div className="flex justify-between items-center text-xs text-muted-foreground">
                  <span>Completed: {format(new Date(plan.completedDate), "MMM dd, yyyy")}</span>
                </div>
              )}
            </div>

            {plan.status === "active" && (
              <Button onClick={() => setDialogOpen(true)} className="w-full mt-4" data-testid="button-add-contribution">
                <Plus className="w-4 h-4 mr-2" />
                Add Contribution
              </Button>
            )}
          </CardContent>
        </Card>

        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">31-Day Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-7 sm:grid-cols-10 md:grid-cols-11 gap-2">
                {timelineSlots.map((slot) => (
                  <div
                    key={slot.number}
                    className={`
                      aspect-square flex items-center justify-center rounded-md text-xs font-medium
                      ${slot.filled 
                        ? "bg-primary text-primary-foreground" 
                        : "bg-muted text-muted-foreground border border-dashed"
                      }
                    `}
                    title={slot.filled && slot.contribution 
                      ? `Day ${slot.number}: ₦${parseFloat(slot.contribution.amount).toFixed(2)} - ${format(new Date(slot.contribution.date), "MMM dd")}`
                      : `Day ${slot.number}: Empty`
                    }
                  >
                    {slot.filled ? <CheckCircle className="w-4 h-4" /> : slot.number}
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-4 mt-4 text-xs text-muted-foreground">
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded bg-primary" />
                  <span>Completed</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded bg-muted border border-dashed" />
                  <span>Pending</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Contribution History</CardTitle>
            </CardHeader>
            <CardContent>
              {!plan.contributions || plan.contributions.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Target className="w-6 h-6 text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">No contributions yet</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Day</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                        <TableHead>Payment Method</TableHead>
                        <TableHead>Notes</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {plan.contributions
                        .sort((a, b) => b.contributionNumber - a.contributionNumber)
                        .map((contribution) => (
                          <TableRow key={contribution.id} data-testid={`row-contribution-${contribution.id}`}>
                            <TableCell className="font-medium">
                              Day {contribution.contributionNumber}
                            </TableCell>
                            <TableCell className="text-sm">
                              {format(new Date(contribution.date), "MMM dd, yyyy")}
                            </TableCell>
                            <TableCell className="text-right tabular-nums font-medium">
                              ₦{parseFloat(contribution.amount).toFixed(2)}
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {contribution.paymentMethod || "N/A"}
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {contribution.notes || "-"}
                            </TableCell>
                          </TableRow>
                        ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Add Contribution</DialogTitle>
            <DialogDescription>
              Record a contribution for this savings plan. Remaining slots: {remainingSlots}
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Amount (₦) *</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        {...field}
                        data-testid="input-contribution-amount"
                      />
                    </FormControl>
                    <p className="text-xs text-muted-foreground">
                      Daily contribution: ₦{parseFloat(plan.contributionAmount).toFixed(2)}. 
                      If you enter more, multiple slots will be filled.
                    </p>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="paymentMethod"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Payment Method</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value || ""}>
                      <FormControl>
                        <SelectTrigger data-testid="select-payment-method">
                          <SelectValue placeholder="Select payment method" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="cash">Cash</SelectItem>
                        <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                        <SelectItem value="mobile_money">Mobile Money</SelectItem>
                        <SelectItem value="card">Card Payment</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes (Optional)</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Add notes..."
                        {...field}
                        data-testid="input-notes"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="flex justify-end gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setDialogOpen(false)}
                  disabled={contributeMutation.isPending}
                  data-testid="button-cancel"
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={contributeMutation.isPending} data-testid="button-submit">
                  {contributeMutation.isPending ? "Adding..." : "Add Contribution"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <OverflowContributionDialog
        open={overflowDialogOpen}
        onOpenChange={setOverflowDialogOpen}
        overflowAmount={overflowAmount}
        memberId={memberId || ""}
        memberName={member?.name || ""}
        contributionAmount={parseFloat(plan.contributionAmount)}
      />
    </div>
  );
}
