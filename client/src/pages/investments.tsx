import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { invalidateAllQueries } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Plus, TrendingUp, AlertTriangle, Banknote, Info, Calculator, Calendar, Download } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import type { InvestmentType, MemberInvestmentWithDetails, Member } from "@shared/schema";
import { Pagination } from "@/components/pagination";
import { format } from "date-fns";

interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export default function Investments() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [page, setPage] = useState(1);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    memberId: "",
    investmentTypeId: "",
    amount: "",
    notes: "",
    startDate: format(new Date(), "yyyy-MM-dd"),
  });

  const { data, isLoading } = useQuery<PaginatedResponse<MemberInvestmentWithDetails>>({
    queryKey: ["/api/investments", page],
    queryFn: async () => {
      const res = await fetch(`/api/investments?page=${page}&limit=10`);
      if (!res.ok) throw new Error("Failed to fetch investments");
      return res.json();
    },
  });

  const { data: investmentTypes } = useQuery<InvestmentType[]>({
    queryKey: ["/api/investment-types/active"],
    queryFn: async () => {
      const res = await fetch("/api/investment-types/active");
      if (!res.ok) throw new Error("Failed to fetch investment types");
      return res.json();
    },
  });

  const { data: membersData } = useQuery<PaginatedResponse<Member>>({
    queryKey: ["/api/members"],
    queryFn: async () => {
      const res = await fetch("/api/members?limit=100");
      if (!res.ok) throw new Error("Failed to fetch members");
      return res.json();
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
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

  const breakMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/investments/${id}/break`, { method: "PATCH" });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message);
      }
      return res.json();
    },
    onSuccess: () => {
      invalidateAllQueries();
      toast({ title: "Investment broken successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const matureMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/investments/${id}/mature`, { method: "PATCH" });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message);
      }
      return res.json();
    },
    onSuccess: () => {
      invalidateAllQueries();
      toast({ title: "Investment matured successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const resetForm = () => {
    setFormData({
      memberId: "",
      investmentTypeId: "",
      amount: "",
      notes: "",
      startDate: format(new Date(), "yyyy-MM-dd"),
    });
  };

  const selectedType = investmentTypes?.find((t) => t.id === formData.investmentTypeId);

  // Calculate investment summary
  const calculateInvestmentSummary = () => {
    if (!selectedType || !formData.amount) return null;
    
    const amount = parseFloat(formData.amount);
    const interestRate = parseFloat(selectedType.interestRate);
    const durationDays = selectedType.durationDays;
    
    // Simple interest calculation
    const interestEarned = (amount * interestRate / 100) * (durationDays / 365);
    const expectedReturn = amount + interestEarned;
    
    const maturityDate = new Date(formData.startDate);
    maturityDate.setDate(maturityDate.getDate() + durationDays);
    
    return {
      principal: amount,
      interestEarned,
      expectedReturn,
      maturityDate,
      durationDays,
      interestRate,
      breakFeeAmount: selectedType.isBreakable ? (amount * parseFloat(selectedType.breakFee) / 100) : 0
    };
  };

  const investmentSummary = calculateInvestmentSummary();

  const downloadInvestmentSummary = () => {
    if (!investmentSummary || !selectedType) return;
    
    // Create a simple text summary for now (can be enhanced with proper PDF library)
    const summaryText = `
INVESTMENT SUMMARY
==================

Investment Details:
- Type: ${selectedType.name}
- Category: ${selectedType.category}
- Member: ${membersData?.data.find(m => m.id === formData.memberId)?.name || 'N/A'}
- Amount: ₦${investmentSummary.principal.toLocaleString()}
- Interest Rate: ${investmentSummary.interestRate}% p.a.
- Duration: ${investmentSummary.durationDays} days
- Start Date: ${format(new Date(formData.startDate), "MMMM dd, yyyy")}
- Maturity Date: ${format(investmentSummary.maturityDate, "MMMM dd, yyyy")}

Financial Projections:
- Principal Amount: ₦${investmentSummary.principal.toLocaleString()}
- Interest Earned: ₦${investmentSummary.interestEarned.toLocaleString()}
- Expected Return: ₦${investmentSummary.expectedReturn.toLocaleString()}
- Break Fee (if applicable): ₦${investmentSummary.breakFeeAmount.toLocaleString()}

Plan Details:
- Payment Plan: ${selectedType.paymentPlan}
- Minimum Deposit: ₦{parseFloat(selectedType.minimumDeposit).toLocaleString()}
- Breakable: ${selectedType.isBreakable ? `Yes (${selectedType.breakFee}% fee)` : 'No'}

Generated on: ${format(new Date(), "MMMM dd, yyyy 'at' h:mm a")}
    `.trim();
    
    // Create and download a text file (can be enhanced to PDF later)
    const blob = new Blob([summaryText], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `investment-summary-${format(new Date(), 'yyyy-MM-dd')}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    
    toast({
      title: "Summary Downloaded",
      description: "Investment summary has been downloaded successfully.",
    });
  };

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

  return (
    <TooltipProvider>
      <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Member Investments</h1>
          <p className="text-muted-foreground">Manage investments for members</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) resetForm(); }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Create Investment
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Create Member Investment</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Label htmlFor="member">Member</Label>
                  <Tooltip>
                    <TooltipTrigger>
                      <Info className="h-4 w-4 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Select the member who is making this investment</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                <Select value={formData.memberId} onValueChange={(v) => setFormData({ ...formData, memberId: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select member" />
                  </SelectTrigger>
                  <SelectContent>
                    {membersData?.data.map((member) => (
                      <SelectItem key={member.id} value={member.id}>
                        {member.name} {member.walletNumber ? `(${member.walletNumber})` : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Label htmlFor="investmentType">Investment Type</Label>
                  <Tooltip>
                    <TooltipTrigger>
                      <Info className="h-4 w-4 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Choose the type of investment plan for this member</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
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
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Label htmlFor="startDate">Start Date</Label>
                  <Tooltip>
                    <TooltipTrigger>
                      <Info className="h-4 w-4 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>The date when this investment will start</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                <Input
                  id="startDate"
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                />
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
                <div className="flex items-center gap-2">
                  <Label htmlFor="amount">Investment Amount (₦)</Label>
                  <Tooltip>
                    <TooltipTrigger>
                      <Info className="h-4 w-4 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>The amount the member wants to invest</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                <Input
                  id="amount"
                  type="number"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  placeholder={selectedType ? `Min: ${parseFloat(selectedType.minimumDeposit).toLocaleString()}` : "Enter amount"}
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Label htmlFor="notes">Notes (Optional)</Label>
                  <Tooltip>
                    <TooltipTrigger>
                      <Info className="h-4 w-4 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Any additional notes or comments about this investment</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
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
              <Button onClick={() => createMutation.mutate(formData)} disabled={createMutation.isPending}>
                {createMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create Investment
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Investment Summary Card */}
      {investmentSummary && (
        <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-blue-800">
                <Calculator className="h-5 w-5" />
                Investment Summary
              </CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={downloadInvestmentSummary}
                className="text-blue-600 border-blue-200 hover:bg-blue-50"
              >
                <Download className="h-4 w-4 mr-2" />
                Download Summary
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white p-4 rounded-lg shadow-sm">
                <p className="text-sm text-gray-600 mb-1">Principal Amount</p>
                <p className="text-xl font-bold text-gray-900">₦{investmentSummary.principal.toLocaleString()}</p>
              </div>
              <div className="bg-white p-4 rounded-lg shadow-sm">
                <p className="text-sm text-gray-600 mb-1">Interest Earned</p>
                <p className="text-xl font-bold text-green-600">₦{investmentSummary.interestEarned.toLocaleString()}</p>
              </div>
              <div className="bg-white p-4 rounded-lg shadow-sm">
                <p className="text-sm text-gray-600 mb-1">Expected Return</p>
                <p className="text-xl font-bold text-blue-600">₦{investmentSummary.expectedReturn.toLocaleString()}</p>
              </div>
              <div className="bg-white p-4 rounded-lg shadow-sm">
                <p className="text-sm text-gray-600 mb-1">Maturity Date</p>
                <p className="text-xl font-bold text-purple-600">
                  {format(investmentSummary.maturityDate, "MMM d, yyyy")}
                </p>
              </div>
            </div>
            <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white p-3 rounded-lg shadow-sm">
                <div className="flex items-center gap-2 mb-1">
                  <TrendingUp className="h-4 w-4 text-blue-500" />
                  <p className="text-sm text-gray-600">Interest Rate</p>
                </div>
                <p className="font-semibold">{investmentSummary.interestRate}% p.a.</p>
              </div>
              <div className="bg-white p-3 rounded-lg shadow-sm">
                <div className="flex items-center gap-2 mb-1">
                  <Calendar className="h-4 w-4 text-green-500" />
                  <p className="text-sm text-gray-600">Duration</p>
                </div>
                <p className="font-semibold">{investmentSummary.durationDays} days</p>
              </div>
              {investmentSummary.breakFeeAmount > 0 && (
                <div className="bg-white p-3 rounded-lg shadow-sm">
                  <div className="flex items-center gap-2 mb-1">
                    <AlertTriangle className="h-4 w-4 text-orange-500" />
                    <p className="text-sm text-gray-600">Break Fee</p>
                  </div>
                  <p className="font-semibold text-orange-600">₦{investmentSummary.breakFeeAmount.toLocaleString()}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Banknote className="h-5 w-5" />
            All Investments
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center p-8">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Member</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Expected Return</TableHead>
                    <TableHead>Start Date</TableHead>
                    <TableHead>Maturity Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data?.data.map((investment) => (
                    <TableRow key={investment.id}>
                      <TableCell className="font-medium">{investment.member?.name}</TableCell>
                      <TableCell>
                        <div>
                          <p>{investment.investmentType?.name}</p>
                          <p className="text-xs text-muted-foreground">{investment.investmentType?.category}</p>
                        </div>
                      </TableCell>
                      <TableCell>₦{parseFloat(investment.amount).toLocaleString()}</TableCell>
                      <TableCell>₦{parseFloat(investment.expectedReturn).toLocaleString()}</TableCell>
                      <TableCell>{format(new Date(investment.startDate), "MMM d, yyyy")}</TableCell>
                      <TableCell>{format(new Date(investment.maturityDate), "MMM d, yyyy")}</TableCell>
                      <TableCell>{getStatusBadge(investment.status)}</TableCell>
                      <TableCell className="text-right">
                        {investment.status === "active" && (
                          <div className="flex justify-end gap-2">
                            {investment.investmentType?.isBreakable && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  if (confirm(`Break this investment? A ${investment.investmentType?.breakFee}% fee will be applied.`)) {
                                    breakMutation.mutate(investment.id);
                                  }
                                }}
                              >
                                <AlertTriangle className="mr-1 h-3 w-3" />
                                Break
                              </Button>
                            )}
                            {(user?.role === "admin" || user?.role === "manager") && new Date(investment.maturityDate) <= new Date() && (
                              <Button
                                variant="default"
                                size="sm"
                                onClick={() => matureMutation.mutate(investment.id)}
                              >
                                <TrendingUp className="mr-1 h-3 w-3" />
                                Mature
                              </Button>
                            )}
                          </div>
                        )}
                        {investment.status === "broken" && investment.actualReturn && (
                          <span className="text-sm text-muted-foreground">
                            Returned: ₦{parseFloat(investment.actualReturn).toLocaleString()}
                          </span>
                        )}
                        {investment.status === "matured" && investment.actualReturn && (
                          <span className="text-sm text-green-600">
                            Credited: ₦{parseFloat(investment.actualReturn).toLocaleString()}
                          </span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                  {data?.data.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                        No investments found. Create the first one!
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
              {data && data.totalPages > 1 && (
                <div className="mt-4">
                  <Pagination
                    currentPage={page}
                    totalPages={data.totalPages}
                    onPageChange={setPage}
                  />
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
      </div>
    </TooltipProvider>
  );
}
