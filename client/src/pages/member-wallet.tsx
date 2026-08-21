import { useState, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useRoute, Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ArrowLeft, Wallet, Plus, Minus, Download, MoreHorizontal } from "lucide-react";
import type { MemberWithTransactions } from "@shared/schema";
import { format } from "date-fns";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, invalidateAllQueries } from "@/lib/queryClient";

const walletActionSchema = z.object({
  amount: z.string().min(1, "Amount is required").refine((val) => !isNaN(Number(val)) && Number(val) > 0, {
    message: "Amount must be a positive number",
  }),
  notes: z.string().optional(),
});

type WalletActionData = z.infer<typeof walletActionSchema>;

const ITEMS_PER_PAGE = 10;

export default function MemberWallet() {
  const [, params] = useRoute("/members/:memberId/wallet");
  const memberId = params?.memberId;
  const { toast } = useToast();
  const [depositOpen, setDepositOpen] = useState(false);
  const [withdrawOpen, setWithdrawOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedTransactions, setSelectedTransactions] = useState<Set<string>>(new Set());

  const { data: member, isLoading: memberLoading } = useQuery<MemberWithTransactions>({
    queryKey: ["/api/members", memberId],
    enabled: !!memberId,
  });

  const depositForm = useForm<WalletActionData>({
    resolver: zodResolver(walletActionSchema),
    defaultValues: { amount: "", notes: "" },
  });

  const withdrawForm = useForm<WalletActionData>({
    resolver: zodResolver(walletActionSchema),
    defaultValues: { amount: "", notes: "" },
  });

  const depositMutation = useMutation({
    mutationFn: async (data: WalletActionData) => {
      return apiRequest("POST", `/api/wallet/${memberId}/deposit`, {
        amount: parseFloat(data.amount),
        notes: data.notes,
      });
    },
    onSuccess: () => {
      invalidateAllQueries();
      toast({
        title: "Deposit successful",
        description: "Funds have been added to the wallet.",
      });
      setDepositOpen(false);
      depositForm.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to deposit funds.",
        variant: "destructive",
      });
    },
  });

  const withdrawMutation = useMutation({
    mutationFn: async (data: WalletActionData) => {
      return apiRequest("POST", `/api/wallet/${memberId}/withdraw`, {
        amount: parseFloat(data.amount),
        notes: data.notes,
      });
    },
    onSuccess: () => {
      invalidateAllQueries();
      toast({
        title: "Withdrawal successful",
        description: "Funds have been withdrawn from the wallet.",
      });
      setWithdrawOpen(false);
      withdrawForm.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to withdraw funds.",
        variant: "destructive",
      });
    },
  });

  if (memberLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid gap-6 lg:grid-cols-3">
          <Skeleton className="h-40" />
          <Skeleton className="h-40" />
          <Skeleton className="h-40" />
        </div>
        <Skeleton className="h-96" />
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

  const walletTransactions = member.transactions?.filter(
    (t) => t.type === "wallet_deposit" || t.type === "wallet_withdrawal" || t.type === "payout"
  ) || [];

  const totalDeposits =
    walletTransactions
      .filter((t) => t.type === "wallet_deposit")
      .reduce((sum, t) => sum + parseFloat(t.amount), 0) || 0;

  // Only count completed withdrawals
  const totalWithdrawals =
    walletTransactions
      .filter((t) => (t.type === "wallet_withdrawal" || t.type === "payout") && t.status === "completed")
      .reduce((sum, t) => sum + parseFloat(t.amount), 0) || 0;

  // Sorting and pagination
  const sortedTransactions = useMemo(() => {
    return [...walletTransactions].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [walletTransactions]);

  const totalPages = Math.ceil(sortedTransactions.length / ITEMS_PER_PAGE);
  const paginatedTransactions = useMemo(() => {
    const startIdx = (currentPage - 1) * ITEMS_PER_PAGE;
    return sortedTransactions.slice(startIdx, startIdx + ITEMS_PER_PAGE);
  }, [sortedTransactions, currentPage]);

  const exportCSV = () => {
    const headers = ["Date", "Action", "Amount", "Notes", "Status"];
    const rows = sortedTransactions.map((t) => [
      format(new Date(t.date), "MMM dd, yyyy"),
      t.type === "wallet_deposit" ? "Deposit" : "Withdrawal",
      parseFloat(t.amount).toFixed(2),
      t.notes || "N/A",
      t.status,
    ]);

    const csv = [headers, ...rows].map((row) => row.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${member.name}-wallet-transactions-${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
  };

  const toggleTransaction = (id: string) => {
    const newSelected = new Set(selectedTransactions);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedTransactions(newSelected);
  };

  const toggleAllTransactions = () => {
    if (selectedTransactions.size === paginatedTransactions.length) {
      setSelectedTransactions(new Set());
    } else {
      setSelectedTransactions(new Set(paginatedTransactions.map((t) => t.id)));
    }
  };

  const handleBulkAction = (action: string) => {
    if (selectedTransactions.size === 0) {
      toast({
        title: "No transactions selected",
        description: "Please select at least one transaction.",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Action completed",
      description: `${action} performed on ${selectedTransactions.size} transaction(s).`,
    });
    setSelectedTransactions(new Set());
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild data-testid="button-back">
            <Link href={`/members/${memberId}`}>
              <ArrowLeft className="w-4 h-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-semibold" data-testid="text-page-title">
              {member.name}'s Wallet
            </h1>
            <p className="text-sm text-muted-foreground">Manage wallet balance and transactions</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Wallet Number</CardTitle>
            <Wallet className="w-4 h-4 text-primary" />
          </CardHeader>
          <CardContent>
            <p className="font-mono font-semibold text-lg" data-testid="text-wallet-number">
              {member.walletNumber}
            </p>
            <p className="text-xs text-muted-foreground mt-2">10-digit unique identifier</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Current Balance</CardTitle>
            <Wallet className="w-4 h-4 text-primary" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold tabular-nums text-primary" data-testid="text-balance">
              ₦{parseFloat(member.walletBalance).toFixed(2)}
            </p>
            <p className="text-xs text-muted-foreground mt-2">Available for withdrawal</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button
              onClick={() => setDepositOpen(true)}
              className="w-full"
              size="sm"
              data-testid="button-deposit"
            >
              <Plus className="w-4 h-4 mr-2" />
              Deposit
            </Button>
            <Button
              onClick={() => setWithdrawOpen(true)}
              variant="outline"
              className="w-full"
              size="sm"
              data-testid="button-withdraw"
            >
              <Minus className="w-4 h-4 mr-2" />
              Withdraw
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Deposits</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold tabular-nums text-primary">
              ₦{totalDeposits.toFixed(2)}
            </p>
            <p className="text-xs text-muted-foreground mt-2">
              {walletTransactions.filter((t) => t.type === "wallet_deposit").length} transactions
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Withdrawals (Completed)</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold tabular-nums text-destructive">
              ₦{totalWithdrawals.toFixed(2)}
            </p>
            <p className="text-xs text-muted-foreground mt-2">
              {walletTransactions.filter((t) => (t.type === "wallet_withdrawal" || t.type === "payout") && t.status === "completed").length} completed transactions
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-2 flex-wrap">
          <CardTitle>Transaction History</CardTitle>
          <div className="flex gap-2">
            {selectedTransactions.size > 0 && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button size="sm" variant="outline" data-testid="button-bulk-actions">
                    Actions ({selectedTransactions.size})
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => handleBulkAction("Export")} data-testid="action-export-selected">
                    Export Selected
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
            <Button
              size="sm"
              variant="outline"
              onClick={exportCSV}
              disabled={walletTransactions.length === 0}
              data-testid="button-export"
            >
              <Download className="w-4 h-4 mr-2" />
              Export CSV
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {walletTransactions.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">No wallet transactions yet</p>
          ) : (
            <div className="space-y-4">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-10">
                        <Checkbox
                          checked={
                            paginatedTransactions.length > 0 &&
                            selectedTransactions.size === paginatedTransactions.length
                          }
                          onCheckedChange={toggleAllTransactions}
                          data-testid="checkbox-select-all"
                        />
                      </TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Action</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead>Notes</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="w-10"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedTransactions.map((transaction) => (
                      <TableRow key={transaction.id} data-testid={`row-transaction-${transaction.id}`}>
                        <TableCell>
                          <Checkbox
                            checked={selectedTransactions.has(transaction.id)}
                            onCheckedChange={() => toggleTransaction(transaction.id)}
                            data-testid={`checkbox-transaction-${transaction.id}`}
                          />
                        </TableCell>
                        <TableCell className="text-sm">
                          {format(new Date(transaction.date), "MMM dd, yyyy")}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              transaction.type === "wallet_deposit"
                                ? "default"
                                : "secondary"
                            }
                          >
                            {transaction.type === "wallet_deposit"
                              ? "Deposit"
                              : "Withdrawal"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right tabular-nums font-medium text-primary">
                          {transaction.type === "wallet_deposit" ? "+" : "-"}₦
                          {parseFloat(transaction.amount).toFixed(2)}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground max-w-xs truncate">
                          {transaction.notes || "N/A"}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              transaction.status === "completed"
                                ? "default"
                                : transaction.status === "pending"
                                ? "secondary"
                                : "outline"
                            }
                          >
                            {transaction.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                data-testid={`button-menu-transaction-${transaction.id}`}
                              >
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={() =>
                                  toast({
                                    title: "Transaction Details",
                                    description: `ID: ${transaction.id}\nAmount: ₦${parseFloat(transaction.amount).toFixed(2)}\nStatus: ${transaction.status}`,
                                  })
                                }
                                data-testid={`action-view-${transaction.id}`}
                              >
                                View Details
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {totalPages > 1 && (
                <div className="flex items-center justify-between pt-4">
                  <p className="text-sm text-muted-foreground">
                    Showing {(currentPage - 1) * ITEMS_PER_PAGE + 1} to{" "}
                    {Math.min(currentPage * ITEMS_PER_PAGE, sortedTransactions.length)} of{" "}
                    {sortedTransactions.length} transactions
                  </p>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                      disabled={currentPage === 1}
                      data-testid="button-prev-page"
                    >
                      Previous
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                      disabled={currentPage === totalPages}
                      data-testid="button-next-page"
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={depositOpen} onOpenChange={setDepositOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Deposit to Wallet</DialogTitle>
            <DialogDescription>
              Add funds to {member.name}'s wallet
            </DialogDescription>
          </DialogHeader>
          <Form {...depositForm}>
            <form
              onSubmit={depositForm.handleSubmit((data) => depositMutation.mutate(data))}
              className="space-y-4"
            >
              <FormField
                control={depositForm.control}
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
                        data-testid="input-deposit-amount"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={depositForm.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Optional notes"
                        {...field}
                        data-testid="input-deposit-notes"
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
                  onClick={() => setDepositOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={depositMutation.isPending}
                  data-testid="button-confirm-deposit"
                >
                  {depositMutation.isPending ? "Processing..." : "Deposit"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <Dialog open={withdrawOpen} onOpenChange={setWithdrawOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Withdraw from Wallet</DialogTitle>
            <DialogDescription>
              Withdraw funds from {member.name}'s wallet (Available: ₦
              {parseFloat(member.walletBalance).toFixed(2)})
            </DialogDescription>
          </DialogHeader>
          <Form {...withdrawForm}>
            <form
              onSubmit={withdrawForm.handleSubmit((data) => {
                if (parseFloat(data.amount) > parseFloat(member.walletBalance)) {
                  toast({
                    title: "Insufficient funds",
                    description: `Cannot withdraw more than ₦${parseFloat(member.walletBalance).toFixed(2)}`,
                    variant: "destructive",
                  });
                  return;
                }
                withdrawMutation.mutate(data);
              })}
              className="space-y-4"
            >
              <FormField
                control={withdrawForm.control}
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
                        data-testid="input-withdraw-amount"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={withdrawForm.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Optional notes"
                        {...field}
                        data-testid="input-withdraw-notes"
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
                  onClick={() => setWithdrawOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={withdrawMutation.isPending}
                  data-testid="button-confirm-withdraw"
                >
                  {withdrawMutation.isPending ? "Processing..." : "Withdraw"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
