import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { invalidateAllQueries } from "@/lib/queryClient";
import { useRoute, Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Plus, TrendingUp, Banknote, Loader2 } from "lucide-react";
import type { Member, InvestmentType, MemberInvestmentWithDetails } from "@shared/schema";
import { format } from "date-fns";

interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export default function MemberInvestments() {
  const [, params] = useRoute("/members/:memberId/investments");
  const memberId = params?.memberId;
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    investmentTypeId: "",
    amount: "",
    notes: "",
  });

  const { data: member, isLoading: memberLoading } = useQuery<Member>({
    queryKey: ["/api/members", memberId],
    queryFn: async () => {
      const res = await fetch(`/api/members/${memberId}`);
      if (!res.ok) throw new Error("Failed to fetch member");
      return res.json();
    },
    enabled: !!memberId,
  });

  const { data: investmentsData, isLoading: investmentsLoading } = useQuery<PaginatedResponse<MemberInvestmentWithDetails>>({
    queryKey: ["/api/investments", "member", memberId],
    queryFn: async () => {
      const res = await fetch(`/api/investments?memberId=${memberId}&limit=50`);
      if (!res.ok) throw new Error("Failed to fetch investments");
      return res.json();
    },
    enabled: !!memberId,
  });

  const { data: investmentTypes } = useQuery<InvestmentType[]>({
    queryKey: ["/api/investment-types/active"],
    queryFn: async () => {
      const res = await fetch("/api/investment-types/active");
      if (!res.ok) throw new Error("Failed to fetch investment types");
      return res.json();
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData & { memberId: string }) => {
      const res = await fetch("/api/investments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message);
      }
      return res.json();
    },
    onSuccess: () => {
      invalidateAllQueries();
      toast({ title: "Investment created successfully" });
      resetForm();
      setIsDialogOpen(false);
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const resetForm = () => {
    setFormData({
      investmentTypeId: "",
      amount: "",
      notes: "",
    });
  };

  const selectedType = investmentTypes?.find((t) => t.id === formData.investmentTypeId);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge variant="default">Active</Badge>;
      case "matured":
        return <Badge className="bg-green-500">Matured</Badge>;
      case "broken":
        return <Badge variant="destructive">Broken</Badge>;
      case "completed":
        return <Badge variant="secondary">Completed</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  if (memberLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
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

  const activeInvestments = investmentsData?.data.filter(i => i.status === "active") || [];
  const totalInvested = investmentsData?.data.reduce((sum, i) => sum + parseFloat(i.amount), 0) || 0;
  const totalExpectedReturns = activeInvestments.reduce((sum, i) => sum + parseFloat(i.expectedReturn), 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/members/${memberId}`}>
            <ArrowLeft className="w-4 h-4" />
          </Link>
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-semibold">{member.name}'s Investments</h1>
          <p className="text-sm text-muted-foreground">Manage investments for this member</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) resetForm(); }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              New Investment
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Create Investment for {member.name}</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="investmentType">Investment Type</Label>
                <Select value={formData.investmentTypeId} onValueChange={(v) => setFormData({ ...formData, investmentTypeId: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select investment type" />
                  </SelectTrigger>
                  <SelectContent>
                    {investmentTypes?.map((type) => (
                      <SelectItem key={type.id} value={type.id}>
                        {type.name} - {type.category} ({type.interestRate}%)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {selectedType && (
                <div className="p-3 rounded-lg bg-muted text-sm space-y-1">
                  <p><strong>Min. Deposit:</strong> ₦{parseFloat(selectedType.minimumDeposit).toLocaleString()}</p>
                  <p><strong>Interest Rate:</strong> {selectedType.interestRate}% p.a.</p>
                  <p><strong>Duration:</strong> {selectedType.durationDays} days</p>
                  <p><strong>Payment:</strong> {selectedType.paymentPlan}</p>
                  <p><strong>Breakable:</strong> {selectedType.isBreakable ? `Yes (${selectedType.breakFee}% fee)` : "No"}</p>
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="amount">Investment Amount (₦)</Label>
                <Input
                  id="amount"
                  type="number"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  placeholder={selectedType ? `Min: ${parseFloat(selectedType.minimumDeposit).toLocaleString()}` : "Enter amount"}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="notes">Notes (Optional)</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Any additional notes..."
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => { setIsDialogOpen(false); resetForm(); }}>
                Cancel
              </Button>
              <Button 
                onClick={() => createMutation.mutate({ ...formData, memberId: memberId! })} 
                disabled={createMutation.isPending}
              >
                {createMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create Investment
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Invested</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tabular-nums text-primary">
              ₦{totalInvested.toLocaleString()}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Active Investments</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tabular-nums">
              {activeInvestments.length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Expected Returns</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tabular-nums text-green-600">
              ₦{totalExpectedReturns.toLocaleString()}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Banknote className="h-5 w-5" />
            All Investments
          </CardTitle>
        </CardHeader>
        <CardContent>
          {investmentsLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-12" />
              <Skeleton className="h-12" />
            </div>
          ) : !investmentsData?.data || investmentsData.data.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <TrendingUp className="w-8 h-8 text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">No investments yet</p>
              <p className="text-xs text-muted-foreground mt-1">Create an investment to get started</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Investment Type</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Expected Return</TableHead>
                  <TableHead>Start Date</TableHead>
                  <TableHead>Maturity Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {investmentsData.data.map((investment) => (
                  <TableRow key={investment.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{investment.investmentType?.name}</p>
                        <p className="text-xs text-muted-foreground">{investment.investmentType?.category}</p>
                      </div>
                    </TableCell>
                    <TableCell>₦{parseFloat(investment.amount).toLocaleString()}</TableCell>
                    <TableCell>₦{parseFloat(investment.expectedReturn).toLocaleString()}</TableCell>
                    <TableCell>{format(new Date(investment.startDate), "MMM d, yyyy")}</TableCell>
                    <TableCell>{format(new Date(investment.maturityDate), "MMM d, yyyy")}</TableCell>
                    <TableCell>{getStatusBadge(investment.status)}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/investments/${investment.id}`}>View</Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
