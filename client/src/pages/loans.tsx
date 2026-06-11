import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Banknote, Check, X, DollarSign, Info } from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { Pagination } from "@/components/pagination";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import type { Loan, Member, SavingsPlan } from "@shared/schema";

interface LoanWithDetails extends Loan {
  member: Member;
  plan: SavingsPlan;
}

interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export default function Loans() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [page, setPage] = useState(1);
  const [repayDialog, setRepayDialog] = useState<{ open: boolean; loan: LoanWithDetails | null }>({
    open: false,
    loan: null,
  });
  const [repayAmount, setRepayAmount] = useState("");

  const { data: loansData, isLoading } = useQuery<PaginatedResponse<LoanWithDetails>>({
    queryKey: ["/api/loans", { page, limit: 10 }],
  });

  const approveMutation = useMutation({
    mutationFn: async (loanId: string) => {
      return apiRequest("PATCH", `/api/loans/${loanId}/approve`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/loans"] });
      toast({
        title: "Loan approved",
        description: "The loan has been approved and credited to the member's wallet.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to approve loan.",
        variant: "destructive",
      });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: async (loanId: string) => {
      return apiRequest("PATCH", `/api/loans/${loanId}/reject`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/loans"] });
      toast({
        title: "Loan rejected",
        description: "The loan request has been rejected.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to reject loan.",
        variant: "destructive",
      });
    },
  });

  const repayMutation = useMutation({
    mutationFn: async ({ loanId, amount }: { loanId: string; amount: string }) => {
      return apiRequest("POST", `/api/loans/${loanId}/repay`, { amount });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/loans"] });
      setRepayDialog({ open: false, loan: null });
      setRepayAmount("");
      toast({
        title: "Repayment successful",
        description: "The loan repayment has been processed.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to process repayment.",
        variant: "destructive",
      });
    },
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="outline">Pending</Badge>;
      case "active":
        return <Badge variant="default">Active</Badge>;
      case "paid":
        return <Badge variant="secondary">Paid</Badge>;
      case "rejected":
        return <Badge variant="destructive">Rejected</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const canManageLoans = user?.role === "admin" || user?.role === "manager";

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-[400px]" />
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Loans</h1>
          <p className="text-sm text-muted-foreground">
            Manage member loan requests and repayments
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Card className="px-4 py-2">
            <div className="flex items-center gap-2">
              <Banknote className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium">
                {loansData?.total || 0} Total Loans
              </span>
            </div>
          </Card>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Loans</CardTitle>
        </CardHeader>
        <CardContent>
          {!loansData?.data || loansData.data.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Banknote className="w-8 h-8 text-muted-foreground mb-3" />
              <p className="text-sm font-medium">No loan requests yet</p>
              <p className="text-xs text-muted-foreground mt-1">
                Members can request loans from their savings plans
              </p>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Member</TableHead>
                    <TableHead>Savings Plan</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Interest</TableHead>
                    <TableHead>Total Repayment</TableHead>
                    <TableHead>Amount Paid</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Requested</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loansData.data.map((loan) => {
                    const remaining = parseFloat(loan.totalRepayment) - parseFloat(loan.amountPaid);
                    return (
                      <TableRow key={loan.id}>
                        <TableCell className="font-medium">{loan.member?.name || "Unknown"}</TableCell>
                        <TableCell>{loan.plan?.planName || "Unknown"}</TableCell>
                        <TableCell>₦{parseFloat(loan.amount).toFixed(2)}</TableCell>
                        <TableCell>{parseFloat(loan.interestRate).toFixed(1)}%</TableCell>
                        <TableCell>₦{parseFloat(loan.totalRepayment).toFixed(2)}</TableCell>
                        <TableCell>₦{parseFloat(loan.amountPaid).toFixed(2)}</TableCell>
                        <TableCell>{getStatusBadge(loan.status)}</TableCell>
                        <TableCell>{format(new Date(loan.requestedAt), "MMM dd, yyyy")}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {loan.status === "pending" && canManageLoans && (
                              <>
                                <Button
                                  size="sm"
                                  variant="default"
                                  onClick={() => approveMutation.mutate(loan.id)}
                                  disabled={approveMutation.isPending}
                                >
                                  <Check className="w-3 h-3 mr-1" />
                                  Approve
                                </Button>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => rejectMutation.mutate(loan.id)}
                                  disabled={rejectMutation.isPending}
                                >
                                  <X className="w-3 h-3 mr-1" />
                                  Reject
                                </Button>
                              </>
                            )}
                            {loan.status === "active" && remaining > 0 && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setRepayDialog({ open: true, loan });
                                  setRepayAmount(remaining.toFixed(2));
                                }}
                              >
                                <DollarSign className="w-3 h-3 mr-1" />
                                Repay
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
              {loansData.totalPages > 1 && (
                <div className="mt-4">
                  <Pagination
                    currentPage={page}
                    totalPages={loansData.totalPages}
                    onPageChange={setPage}
                  />
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      <Dialog open={repayDialog.open} onOpenChange={(open) => setRepayDialog({ open, loan: repayDialog.loan })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Repay Loan</DialogTitle>
            <DialogDescription>
              {repayDialog.loan && (
                <>
                  Remaining balance: ₦{(parseFloat(repayDialog.loan.totalRepayment) - parseFloat(repayDialog.loan.amountPaid)).toFixed(2)}
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Label htmlFor="repayAmount">Repayment Amount (₦)</Label>
                <Tooltip>
                  <TooltipTrigger>
                    <Info className="h-4 w-4 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Enter the amount to repay towards this loan</p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <Input
                id="repayAmount"
                type="number"
                step="0.01"
                min="0"
                value={repayAmount}
                onChange={(e) => setRepayAmount(e.target.value)}
                placeholder="Enter amount"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRepayDialog({ open: false, loan: null })}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (repayDialog.loan) {
                  repayMutation.mutate({ loanId: repayDialog.loan.id, amount: repayAmount });
                }
              }}
              disabled={repayMutation.isPending || !repayAmount || parseFloat(repayAmount) <= 0}
            >
              {repayMutation.isPending ? "Processing..." : "Confirm Repayment"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
    </TooltipProvider>
  );
}
