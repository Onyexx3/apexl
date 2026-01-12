import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Pagination } from "@/components/pagination";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Search, Check, X, Banknote } from "lucide-react";
import type { TransactionWithMember, Member, InsertTransaction } from "@shared/schema";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertTransactionSchema } from "@shared/schema";
import { CompletePayoutDialog } from "@/components/complete-payout-dialog";
import { useAuth } from "@/hooks/use-auth";

interface PaginatedPayouts {
  data: TransactionWithMember[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export default function Payouts() {
  const [searchQuery, setSearchQuery] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [completeDialogOpen, setCompleteDialogOpen] = useState(false);
  const [selectedPayout, setSelectedPayout] = useState<TransactionWithMember | null>(null);
  const [page, setPage] = useState(1);
  const { toast } = useToast();
  const { user } = useAuth();

  const canManagePayouts = user?.role === "admin" || user?.role === "manager";

  const { data: response, isLoading } = useQuery<PaginatedPayouts>({
    queryKey: ["/api/transactions/payouts", page],
    queryFn: async () => {
      const res = await fetch(`/api/transactions/payouts?page=${page}&limit=10`);
      return res.json();
    },
  });

  const payouts = response?.data || [];

  const { data: membersResponse } = useQuery<PaginatedPayouts>({
    queryKey: ["/api/members", 1],
    queryFn: async () => {
      const res = await fetch("/api/members?page=1&limit=1000");
      return res.json();
    },
  });

  const form = useForm<InsertTransaction>({
    resolver: zodResolver(insertTransactionSchema),
    defaultValues: {
      memberId: "",
      type: "payout",
      amount: "",
      paymentMethod: "",
      notes: "",
      status: "pending",
      date: new Date().toISOString(),
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: InsertTransaction) => {
      return apiRequest("POST", "/api/transactions", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/transactions/payouts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/members"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      toast({
        title: "Payout requested",
        description: "Payout request has been created successfully.",
      });
      setDialogOpen(false);
      form.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create payout request.",
        variant: "destructive",
      });
    },
  });

  const approveMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("PATCH", `/api/transactions/${id}/approve`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/transactions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/members"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      toast({
        title: "Payout approved",
        description: "Payout has been approved. You can now complete it with payment details.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to approve payout.",
        variant: "destructive",
      });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("PATCH", `/api/transactions/${id}/reject`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/transactions"] });
      toast({
        title: "Payout rejected",
        description: "Payout request has been rejected.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to reject payout.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: InsertTransaction) => {
    createMutation.mutate(data);
  };

  const handleCompletePayout = (payout: TransactionWithMember) => {
    setSelectedPayout(payout);
    setCompleteDialogOpen(true);
  };

  const filteredPayouts = payouts?.filter((payout) =>
    payout.member?.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const allMembers = (membersResponse as any)?.data || [];
  const activeMembers = allMembers.filter((m: Member) => m.status === "active");

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "completed":
        return "default";
      case "approved":
        return "secondary";
      case "pending":
        return "outline";
      case "rejected":
        return "destructive";
      default:
        return "secondary";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold" data-testid="text-page-title">Payouts</h1>
          <p className="text-sm text-muted-foreground">Manage member withdrawal requests</p>
        </div>
        <Button onClick={() => setDialogOpen(true)} data-testid="button-add-payout">
          <Plus className="w-4 h-4 mr-2" />
          New Payout
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <CardTitle className="text-lg">Payout Requests</CardTitle>
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search by member..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
                data-testid="input-search-payouts"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : !filteredPayouts || filteredPayouts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="p-3 rounded-full bg-muted mb-4">
                <Search className="w-6 h-6 text-muted-foreground" />
              </div>
              <p className="text-sm font-medium">
                {searchQuery ? "No payouts found" : "No payout requests"}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {searchQuery
                  ? "Try adjusting your search query"
                  : "Payout requests will appear here"}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Member</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead>Destination</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Notes</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPayouts.map((payout) => (
                    <TableRow key={payout.id} data-testid={`row-payout-${payout.id}`}>
                      <TableCell className="text-sm">
                        {format(new Date(payout.date), "MMM dd, yyyy")}
                      </TableCell>
                      <TableCell className="font-medium">
                        {payout.member?.name || "Unknown"}
                      </TableCell>
                      <TableCell className="text-right tabular-nums font-medium text-destructive">
                        -₦{parseFloat(payout.amount).toFixed(2)}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {payout.payoutBankName && payout.payoutAccountNumber ? (
                          <div>
                            <p>{payout.payoutBankName}</p>
                            <p className="text-xs">{payout.payoutAccountNumber}</p>
                          </div>
                        ) : (
                          "Pending"
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant={getStatusBadgeVariant(payout.status)}>
                          {payout.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm max-w-xs truncate">
                        {payout.notes || "-"}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          {payout.status === "pending" && canManagePayouts && (
                            <>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => approveMutation.mutate(payout.id)}
                                disabled={approveMutation.isPending}
                                title="Approve"
                                data-testid={`button-approve-${payout.id}`}
                              >
                                <Check className="w-4 h-4 text-green-600" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => rejectMutation.mutate(payout.id)}
                                disabled={rejectMutation.isPending}
                                title="Reject"
                                data-testid={`button-reject-${payout.id}`}
                              >
                                <X className="w-4 h-4 text-destructive" />
                              </Button>
                            </>
                          )}
                          {(payout.status === "pending" || payout.status === "approved") && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleCompletePayout(payout)}
                              title="Complete Payout"
                              data-testid={`button-complete-${payout.id}`}
                            >
                              <Banknote className="w-4 h-4 text-primary" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
          
          {response && response.totalPages > 1 && (
            <div className="mt-4">
              <Pagination
                page={page}
                totalPages={response.totalPages}
                onPageChange={setPage}
              />
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Create Payout Request</DialogTitle>
            <DialogDescription>
              Request a withdrawal for a member. Payouts will be pending until approved.
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="memberId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Select Member *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-payout-member">
                          <SelectValue placeholder="Choose a member" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {activeMembers.map((member: Member) => (
                          <SelectItem key={member.id} value={member.id}>
                            {member.name} - Wallet: ₦{parseFloat(member.walletBalance).toFixed(2)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
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
                        className="text-lg tabular-nums"
                        data-testid="input-payout-amount"
                      />
                    </FormControl>
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
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-payout-payment-method">
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
                    <FormLabel>Reason / Notes *</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Reason for payout request..."
                        rows={3}
                        {...field}
                        data-testid="input-payout-notes"
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
                  disabled={createMutation.isPending}
                  data-testid="button-cancel-payout"
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={createMutation.isPending} data-testid="button-submit-payout">
                  {createMutation.isPending ? "Creating..." : "Create Request"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {selectedPayout && (
        <CompletePayoutDialog
          open={completeDialogOpen}
          onOpenChange={setCompleteDialogOpen}
          transactionId={selectedPayout.id}
          memberName={selectedPayout.member?.name || ""}
          amount={parseFloat(selectedPayout.amount)}
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ["/api/transactions/payouts"] });
          }}
        />
      )}
    </div>
  );
}
