import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useRoute, Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
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
import { ArrowLeft, Mail, Phone, MapPin, Calendar, TrendingUp, TrendingDown, Wallet, Target, Plus, Zap, Banknote, CalendarDays, Clock, Info } from "lucide-react";
import type { MemberWithTransactions, SavingsPlan, InsertSavingsPlan, MemberInvestmentWithDetails, YearlySavingsPlan, InsertYearlySavingsPlan } from "@shared/schema";
import { format } from "date-fns";
import { insertSavingsPlanSchema, insertYearlySavingsPlanSchema } from "@shared/schema";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export default function MemberDetail() {
  const [, params] = useRoute("/members/:id");
  const memberId = params?.id;
  const { toast } = useToast();
  const [createPlanOpen, setCreatePlanOpen] = useState(false);
  const [recordSavingsOpen, setRecordSavingsOpen] = useState(false);
  const [createYearlyPlanOpen, setCreateYearlyPlanOpen] = useState(false);
  const [recordYearlySavingsOpen, setRecordYearlySavingsOpen] = useState(false);
  const [monthlyProfitOpen, setMonthlyProfitOpen] = useState(false);
  const [selectedPlanId, setSelectedPlanId] = useState<string>("");
  const [selectedYearlyPlanId, setSelectedYearlyPlanId] = useState<string>("");

  const { data: member, isLoading } = useQuery<MemberWithTransactions>({
    queryKey: ["/api/members", memberId],
    enabled: !!memberId,
  });

  const { data: plans, isLoading: plansLoading } = useQuery<SavingsPlan[]>({
    queryKey: ["/api/members", memberId, "plans"],
    enabled: !!memberId,
  });

  const { data: yearlyPlans, isLoading: yearlyPlansLoading } = useQuery<YearlySavingsPlan[]>({
    queryKey: ["/api/members", memberId, "yearly-plans"],
    enabled: !!memberId,
  });

  const { data: yearlyPlanProfit, refetch: refetchYearlyProfit } = useQuery(
    {
      queryKey: ["/api/yearly-savings-plans", selectedYearlyPlanId, "profit-calculation"],
      queryFn: async () => {
        if (!selectedYearlyPlanId) return null;
        const res = await fetch(`/api/yearly-savings-plans/${selectedYearlyPlanId}/profit-calculation`);
        return res.json();
      },
      enabled: !!selectedYearlyPlanId,
    }
  );

  const { data: investmentsData, isLoading: investmentsLoading } = useQuery<{ data: MemberInvestmentWithDetails[] }>({
    queryKey: ["/api/investments", "member", memberId],
    queryFn: async () => {
      const res = await fetch(`/api/investments?memberId=${memberId}&limit=50`);
      if (!res.ok) throw new Error("Failed to fetch investments");
      return res.json();
    },
    enabled: !!memberId,
  });

  const form = useForm<InsertSavingsPlan>({
    resolver: zodResolver(insertSavingsPlanSchema),
    defaultValues: {
      memberId: memberId || "",
      planName: "",
      targetAmount: "",
      contributionAmount: "",
      maxContributions: 62,
    },
  });

  const yearlyForm = useForm<InsertYearlySavingsPlan>({
    resolver: zodResolver(insertYearlySavingsPlanSchema),
    defaultValues: {
      memberId: memberId || "",
      planName: "",
      targetAmount: "",
      contributionAmount: "",
      maxContributions: 372,
      maxDays: 372,
      profitRate: "5.00",
      maturityDate: new Date(Date.now() + 372 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    },
  });

  const savingsForm = useForm({
    defaultValues: {
      amount: "",
      paymentMethod: "",
      notes: "",
    },
  });

  const yearlySavingsForm = useForm({
    defaultValues: {
      amount: "",
      paymentMethod: "",
      notes: "",
    },
  });

  const createPlanMutation = useMutation({
    mutationFn: async (data: InsertSavingsPlan) => {
      return apiRequest("POST", "/api/savings-plans", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/members", memberId, "plans"] });
      toast({ title: "Savings plan created", description: "New savings plan has been created successfully." });
      setCreatePlanOpen(false);
      form.reset();
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const recordSavingsMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest("POST", `/api/plans/${selectedPlanId}/contribute`, {
        memberId,
        amount: data.amount,
        paymentMethod: data.paymentMethod,
        notes: data.notes,
      });
    },
    onSuccess: (response: any) => {
      const count = response?.count || 1;
      queryClient.invalidateQueries({ queryKey: ["/api/members", memberId, "plans"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      toast({
        title: "Savings recorded",
        description: `${count} daily contributions have been recorded.`,
      });
      setRecordSavingsOpen(false);
      savingsForm.reset();
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const createYearlyPlanMutation = useMutation({
    mutationFn: async (data: InsertYearlySavingsPlan) => {
      return apiRequest("POST", "/api/yearly-savings-plans", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/members", memberId, "yearly-plans"] });
      toast({ title: "Yearly savings plan created", description: "New yearly savings plan has been created successfully." });
      setCreateYearlyPlanOpen(false);
      yearlyForm.reset();
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const recordYearlySavingsMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest("POST", `/api/yearly-plans/${selectedYearlyPlanId}/contribute`, {
        memberId,
        amount: data.amount,
        paymentMethod: data.paymentMethod,
        notes: data.notes,
      });
    },
    onSuccess: (response: any) => {
      const count = response?.count || 1;
      queryClient.invalidateQueries({ queryKey: ["/api/members", memberId, "yearly-plans"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      toast({
        title: "Yearly savings recorded",
        description: `${count} yearly contributions have been recorded.`,
      });
      setRecordYearlySavingsOpen(false);
      yearlySavingsForm.reset();
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  if (isLoading) {
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

  // Calculate total contributions from all savings plans (including closed plans)
  const savingsTotal = plans
    ?.reduce((sum, plan) => sum + parseFloat(plan.totalSaved), 0) || 0;

  // Calculate total contributions from all yearly savings plans
  const yearlySavingsTotal = yearlyPlans
    ?.reduce((sum, plan) => sum + parseFloat(plan.totalSaved), 0) || 0;

  // Calculate total withdrawals from approved/successful wallet payouts only
  const payoutsTotal = member.transactions
    ?.filter((t) => 
      (t.type === "payout" || t.type === "wallet_withdrawal") && 
      (t.status === "completed" || t.status === "approved")
    )
    .reduce((sum, t) => sum + parseFloat(t.amount), 0) || 0;

  const activePlans = plans?.filter(p => p.status === "active") || [];
  const activeYearlyPlans = yearlyPlans?.filter(p => p.status === "active") || [];
  const maturedYearlyPlans = yearlyPlans?.filter(p => p.status === "matured") || [];

  return (
    <TooltipProvider>
      <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild data-testid="button-back">
          <Link href="/members">
            <ArrowLeft className="w-4 h-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-semibold" data-testid="text-member-name">{member.name}</h1>
          <p className="text-sm text-muted-foreground">Member Details & Savings Management</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Member Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-center">
              <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-3xl font-semibold text-primary">
                  {member.name.charAt(0).toUpperCase()}
                </span>
              </div>
            </div>

            <div className="text-center">
              <h3 className="font-semibold text-lg">{member.name}</h3>
              <Badge variant={member.status === "active" ? "default" : "secondary"} className="mt-2">
                {member.status}
              </Badge>
            </div>

            <div className="space-y-3">
              {member.email && (
                <div className="flex items-start gap-3">
                  <Mail className="w-4 h-4 text-muted-foreground mt-0.5" />
                  <div className="text-sm">
                    <p className="text-muted-foreground text-xs">Email</p>
                    <p className="break-all">{member.email}</p>
                  </div>
                </div>
              )}
              {member.phone && (
                <div className="flex items-start gap-3">
                  <Phone className="w-4 h-4 text-muted-foreground mt-0.5" />
                  <div className="text-sm">
                    <p className="text-muted-foreground text-xs">Phone</p>
                    <p>{member.phone}</p>
                  </div>
                </div>
              )}
              {member.address && (
                <div className="flex items-start gap-3">
                  <MapPin className="w-4 h-4 text-muted-foreground mt-0.5" />
                  <div className="text-sm">
                    <p className="text-muted-foreground text-xs">Address</p>
                    <p>{member.address}</p>
                  </div>
                </div>
              )}
              <div className="flex items-start gap-3">
                <Calendar className="w-4 h-4 text-muted-foreground mt-0.5" />
                <div className="text-sm">
                  <p className="text-muted-foreground text-xs">Join Date</p>
                  <p>{format(new Date(member.joinDate), "MMMM dd, yyyy")}</p>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Total Savings</span>
                <span className="font-semibold tabular-nums text-primary">
                  ₦{parseFloat(member.totalSavings).toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Total Payouts</span>
                <span className="font-semibold tabular-nums text-destructive">
                  ₦{parseFloat(member.totalPayouts).toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between items-center pt-2 border-t">
                <span className="text-sm font-medium">Current Balance</span>
                <span className="text-xl font-bold tabular-nums" data-testid="text-balance">
                  ₦{parseFloat(member.balance).toFixed(2)}
                </span>
              </div>
            </div>

            <div className="pt-4 border-t space-y-3">
              <div className="flex items-start gap-3">
                <Wallet className="w-4 h-4 text-muted-foreground mt-0.5" />
                <div className="text-sm flex-1">
                  <p className="text-muted-foreground text-xs">Wallet Number</p>
                  <p className="font-mono font-semibold" data-testid="text-wallet-number">{member.walletNumber}</p>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Wallet Balance</span>
                <span className="font-semibold tabular-nums text-primary">
                  ₦{parseFloat(member.walletBalance).toFixed(2)}
                </span>
              </div>
              <Button asChild className="w-full mt-3" variant="outline" data-testid="button-manage-wallet">
                <Link href={`/members/${memberId}/wallet`}>
                  <Wallet className="w-4 h-4 mr-2" />
                  Manage Wallet
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="lg:col-span-2 space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Contributions</CardTitle>
                <TrendingUp className="w-4 h-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold tabular-nums text-primary">
                  ₦{savingsTotal.toFixed(2)}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  From {plans?.length || 0} savings plan(s)
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Withdrawals</CardTitle>
                <TrendingDown className="w-4 h-4 text-destructive" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold tabular-nums text-destructive">
                  ₦{payoutsTotal.toFixed(2)}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {member.transactions?.filter((t) => (t.type === "payout" || t.type === "wallet_withdrawal") && (t.status === "completed" || t.status === "approved")).length || 0} approved transactions
                </p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-2">
              <CardTitle className="text-lg">Active Savings Plans</CardTitle>
              <div className="flex gap-2">
                <Button size="sm" asChild variant="outline" data-testid="button-see-all-plans">
                  <Link href={`/members/${memberId}/plans`}>
                    See All Plans
                  </Link>
                </Button>
                <Button size="sm" onClick={() => setCreatePlanOpen(true)} data-testid="button-create-plan">
                  <Plus className="w-4 h-4 mr-2" />
                  New Plan
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {plansLoading ? (
                <div className="space-y-2">
                  <Skeleton className="h-12" />
                  <Skeleton className="h-12" />
                </div>
              ) : !activePlans || activePlans.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <Target className="w-6 h-6 text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">No active savings plans</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {activePlans.map((plan) => (
                    <div key={plan.id} className="p-3 border rounded-lg bg-muted/50 cursor-pointer hover-elevate">
                      <Link href={`/members/${memberId}/plans/${plan.id}`}>
                        <div className="flex justify-between items-start gap-2 mb-2">
                          <div className="flex-1">
                            <h4 className="font-semibold text-sm">{plan.planName}</h4>
                            <p className="text-xs text-muted-foreground">
                              ₦{parseFloat(plan.contributionAmount).toFixed(2)}/day × 62 days = ₦{parseFloat(plan.targetAmount).toFixed(2)}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold text-sm">{plan.contributionsCount}/62</p>
                            <div className="w-16 h-2 bg-muted rounded-full mt-1 overflow-hidden">
                              <div 
                                className="h-full bg-primary rounded-full" 
                                style={{ width: `${(plan.contributionsCount / 62) * 100}%` }} 
                              />
                            </div>
                          </div>
                        </div>
                      </Link>
                      <div className="flex gap-2 pt-2">
                        <Button 
                          size="sm" 
                          variant="default"
                          onClick={() => {
                            setSelectedPlanId(plan.id);
                            setRecordSavingsOpen(true);
                          }}
                          data-testid={`button-record-savings-${plan.id}`}
                        >
                          <Zap className="w-3 h-3 mr-1" />
                          Record Savings
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <CalendarDays className="w-5 h-5" />
                Yearly Savings Plans
              </CardTitle>
              <div className="flex gap-2">
                <Button size="sm" onClick={() => setCreateYearlyPlanOpen(true)} data-testid="button-create-yearly-plan">
                  <Plus className="w-4 h-4 mr-2" />
                  New Yearly Plan
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {yearlyPlansLoading ? (
                <div className="space-y-2">
                  <Skeleton className="h-12" />
                  <Skeleton className="h-12" />
                </div>
              ) : !activeYearlyPlans || activeYearlyPlans.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <CalendarDays className="w-6 h-6 text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">No active yearly savings plans</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {activeYearlyPlans.map((plan) => {
                    const progressPercent = (plan.contributionsCount / plan.maxContributions) * 100;
                    const completedMonths = Math.floor(plan.contributionsCount / 31);
                    const remainingDays = plan.maxContributions - plan.contributionsCount;
                    
                    return (
                      <div key={plan.id} className="p-3 border rounded-lg bg-muted/50 cursor-pointer hover-elevate">
                        <div className="flex justify-between items-start gap-2 mb-2">
                          <div className="flex-1">
                            <h4 className="font-semibold text-sm">{plan.planName}</h4>
                            <p className="text-xs text-muted-foreground">
                              ₦{parseFloat(plan.contributionAmount).toFixed(2)}/day × 372 days = ₦{parseFloat(plan.targetAmount).toFixed(2)}
                            </p>
                            <p className="text-xs text-green-600 font-medium">
                              {plan.profitRate}% profit rate | {completedMonths} months completed
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold text-sm">{plan.contributionsCount}/372</p>
                            <div className="w-16 h-2 bg-muted rounded-full mt-1 overflow-hidden">
                              <div 
                                className="h-full bg-green-500 rounded-full" 
                                style={{ width: `${progressPercent}%` }} 
                              />
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
                          <span>Maturity: {format(new Date(plan.maturityDate), "MMM dd, yyyy")}</span>
                          <span>{remainingDays} days remaining</span>
                        </div>
                        <div className="flex gap-2 pt-2">
                          <Button 
                            size="sm" 
                            variant="default"
                            onClick={() => {
                              setSelectedYearlyPlanId(plan.id);
                              setRecordYearlySavingsOpen(true);
                            }}
                            data-testid={`button-record-yearly-savings-${plan.id}`}
                          >
                            <Zap className="w-3 h-3 mr-1" />
                            Record Yearly Savings
                          </Button>
                          {completedMonths > 0 && (
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => {
                                setSelectedYearlyPlanId(plan.id);
                                setMonthlyProfitOpen(true);
                              }}
                              data-testid={`button-view-monthly-profit-${plan.id}`}
                            >
                              <CalendarDays className="w-3 h-3 mr-1" />
                              View Monthly Profit
                            </Button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {maturedYearlyPlans.length > 0 && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between gap-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Clock className="w-5 h-5 text-green-500" />
                  Matured Yearly Plans
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {maturedYearlyPlans.map((plan) => (
                    <div key={plan.id} className="p-3 border rounded-lg bg-green-50/50 border-green-200">
                      <div className="flex justify-between items-start gap-2 mb-2">
                        <div className="flex-1">
                          <h4 className="font-semibold text-sm">{plan.planName}</h4>
                          <p className="text-xs text-muted-foreground">
                            Completed: {plan.completedDate && format(new Date(plan.completedDate), "MMM dd, yyyy")}
                          </p>
                        </div>
                        <Badge variant="outline" className="bg-green-100 text-green-700 border-green-300">
                          Matured
                        </Badge>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <span className="text-muted-foreground">Total Saved:</span>
                          <span className="font-semibold text-primary ml-1">₦{parseFloat(plan.totalSaved).toFixed(2)}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Profit Earned:</span>
                          <span className="font-semibold text-green-600 ml-1">₦{parseFloat(plan.profitEarned || "0").toFixed(2)}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Total with Profit:</span>
                          <span className="font-semibold text-green-600 ml-1">
                            ₦{(parseFloat(plan.totalSaved) + parseFloat(plan.profitEarned || "0")).toFixed(2)}
                          </span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Payout Status:</span>
                          <span className="font-semibold ml-1">{plan.payoutStatus}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-2">
              <CardTitle className="text-lg">Recent Transactions</CardTitle>
              <Button size="sm" asChild variant="outline" data-testid="button-see-all-transactions">
                <Link href={`/members/${memberId}/transactions`}>
                  View All
                </Link>
              </Button>
            </CardHeader>
            <CardContent>
              {!member.transactions || member.transactions.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">No transactions yet</p>
              ) : (
                <div className="space-y-2">
                  {member.transactions.slice(0, 5).map((transaction) => (
                    <div key={transaction.id} className="flex items-center justify-between py-2 border-b last:border-b-0">
                      <div className="flex-1">
                        <p className="text-sm font-medium">{format(new Date(transaction.date), "MMM dd, yyyy")}</p>
                        <p className="text-xs text-muted-foreground">{transaction.type}</p>
                      </div>
                      <p
                        className={`text-sm font-semibold tabular-nums ${
                          transaction.type === "payout" ? "text-destructive" : "text-primary"
                        }`}
                      >
                        {transaction.type === "payout" ? "-" : "+"}₦{parseFloat(transaction.amount).toFixed(2)}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <Banknote className="w-5 h-5" />
                Investments
              </CardTitle>
              <Button size="sm" asChild variant="outline">
                <Link href={`/members/${memberId}/investments`}>
                  View All
                </Link>
              </Button>
            </CardHeader>
            <CardContent>
              {investmentsLoading ? (
                <div className="space-y-2">
                  <Skeleton className="h-12" />
                  <Skeleton className="h-12" />
                </div>
              ) : !investmentsData?.data || investmentsData.data.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <Banknote className="w-6 h-6 text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">No investments yet</p>
                  <Button size="sm" asChild className="mt-3">
                    <Link href={`/members/${memberId}/investments`}>
                      <Plus className="w-4 h-4 mr-2" />
                      Create Investment
                    </Link>
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {investmentsData.data.slice(0, 3).map((investment) => (
                    <Link key={investment.id} href={`/investments/${investment.id}`}>
                      <div className="p-3 border rounded-lg bg-muted/50 cursor-pointer hover:bg-muted transition-colors">
                        <div className="flex justify-between items-start gap-2">
                          <div className="flex-1">
                            <h4 className="font-semibold text-sm">{investment.investmentType?.name}</h4>
                            <p className="text-xs text-muted-foreground">
                              {investment.investmentType?.category} - {investment.interestRate}% p.a.
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold text-sm text-primary">₦{parseFloat(investment.amount).toLocaleString()}</p>
                            <Badge 
                              variant={investment.status === "active" ? "default" : investment.status === "matured" ? "secondary" : "outline"} 
                              className="text-xs"
                            >
                              {investment.status}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))}
                  {investmentsData.data.length > 3 && (
                    <p className="text-xs text-muted-foreground text-center">
                      +{investmentsData.data.length - 3} more investments
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <Dialog open={createPlanOpen} onOpenChange={setCreatePlanOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Create Savings Plan</DialogTitle>
            <DialogDescription>Create a new savings plan for {member?.name}</DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit((data) => createPlanMutation.mutate(data))} className="space-y-4">
              <FormField
                control={form.control}
                name="planName"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex items-center gap-2">
                      <FormLabel>Plan Name *</FormLabel>
                      <Tooltip>
                        <TooltipTrigger>
                          <Info className="h-4 w-4 text-muted-foreground" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>A descriptive name for this savings plan (e.g., Emergency Fund, Vacation Savings)</p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                    <FormControl>
                      <Input placeholder="e.g., Emergency Fund" {...field} data-testid="input-plan-name" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="contributionAmount"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex items-center gap-2">
                      <FormLabel>Daily Amount (₦) *</FormLabel>
                      <Tooltip>
                        <TooltipTrigger>
                          <Info className="h-4 w-4 text-muted-foreground" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>The amount to be saved daily for this plan</p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                    <FormControl>
                      <Input type="number" step="0.01" placeholder="100" {...field} data-testid="input-daily-amount" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="targetAmount"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex items-center gap-2">
                      <FormLabel>Target Amount (₦) *</FormLabel>
                      <Tooltip>
                        <TooltipTrigger>
                          <Info className="h-4 w-4 text-muted-foreground" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>The total savings goal amount for this plan</p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                    <FormControl>
                      <Input type="number" step="0.01" placeholder="6200" {...field} data-testid="input-target-amount" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="flex justify-end gap-3 pt-4">
                <Button type="button" variant="outline" onClick={() => setCreatePlanOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createPlanMutation.isPending}>
                  {createPlanMutation.isPending ? "Creating..." : "Create Plan"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <Dialog open={recordSavingsOpen} onOpenChange={setRecordSavingsOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Record Savings</DialogTitle>
            <DialogDescription>Record a new savings contribution for this plan</DialogDescription>
          </DialogHeader>
          <Form {...savingsForm}>
            <form 
              onSubmit={savingsForm.handleSubmit((data) => {
                if (!selectedPlanId) return;
                recordSavingsMutation.mutate(data);
              })} 
              className="space-y-4"
            >
              <FormField
                control={savingsForm.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex items-center gap-2">
                      <FormLabel>Amount (₦) *</FormLabel>
                      <Tooltip>
                        <TooltipTrigger>
                          <Info className="h-4 w-4 text-muted-foreground" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>The amount being contributed to this savings plan</p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                    <FormControl>
                      <Input type="number" step="0.01" placeholder="0.00" {...field} data-testid="input-savings-amount" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={savingsForm.control}
                name="paymentMethod"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex items-center gap-2">
                      <FormLabel>Payment Method</FormLabel>
                      <Tooltip>
                        <TooltipTrigger>
                          <Info className="h-4 w-4 text-muted-foreground" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>How the payment was made (cash, bank transfer, or mobile money)</p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-payment-method">
                          <SelectValue placeholder="Select payment method" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="cash">Cash</SelectItem>
                        <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                        <SelectItem value="mobile_money">Mobile Money</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />
              <FormField
                control={savingsForm.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex items-center gap-2">
                      <FormLabel>Notes</FormLabel>
                      <Tooltip>
                        <TooltipTrigger>
                          <Info className="h-4 w-4 text-muted-foreground" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Optional notes about this contribution (e.g., payment reference)</p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                    <FormControl>
                      <Input placeholder="Optional notes" {...field} data-testid="input-savings-notes" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="flex justify-end gap-3 pt-4">
                <Button type="button" variant="outline" onClick={() => setRecordSavingsOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={recordSavingsMutation.isPending}>
                  {recordSavingsMutation.isPending ? "Recording..." : "Record Savings"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <Dialog open={createYearlyPlanOpen} onOpenChange={setCreateYearlyPlanOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Create Yearly Savings Plan</DialogTitle>
            <DialogDescription>Create a new yearly savings plan for {member?.name} (372 days with profit)</DialogDescription>
          </DialogHeader>
          <Form {...yearlyForm}>
            <form onSubmit={yearlyForm.handleSubmit((data) => createYearlyPlanMutation.mutate(data))} className="space-y-4">
              <FormField
                control={yearlyForm.control}
                name="planName"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex items-center gap-2">
                      <FormLabel>Plan Name *</FormLabel>
                      <Tooltip>
                        <TooltipTrigger>
                          <Info className="h-4 w-4 text-muted-foreground" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>A descriptive name for this yearly savings plan (e.g., Premium Yearly Investment)</p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                    <FormControl>
                      <Input placeholder="e.g., Premium Yearly Investment" {...field} data-testid="input-yearly-plan-name" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={yearlyForm.control}
                name="contributionAmount"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex items-center gap-2">
                      <FormLabel>Daily Amount (₦) *</FormLabel>
                      <Tooltip>
                        <TooltipTrigger>
                          <Info className="h-4 w-4 text-muted-foreground" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>The daily contribution amount for this 372-day yearly plan</p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                    <FormControl>
                      <Input type="number" step="0.01" placeholder="1000" {...field} data-testid="input-yearly-contribution-amount" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={yearlyForm.control}
                name="targetAmount"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex items-center gap-2">
                      <FormLabel>Target Amount (₦) *</FormLabel>
                      <Tooltip>
                        <TooltipTrigger>
                          <Info className="h-4 w-4 text-muted-foreground" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>The total savings goal for this yearly plan</p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                    <FormControl>
                      <Input type="number" step="0.01" placeholder="372000" {...field} data-testid="input-yearly-target-amount" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={yearlyForm.control}
                name="profitRate"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex items-center gap-2">
                      <FormLabel>Profit Rate (%) *</FormLabel>
                      <Tooltip>
                        <TooltipTrigger>
                          <Info className="h-4 w-4 text-muted-foreground" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>The annual profit rate for this yearly investment plan</p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                    <FormControl>
                      <Input type="number" step="0.01" placeholder="5.00" {...field} data-testid="input-yearly-profit-rate" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={yearlyForm.control}
                name="maturityDate"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex items-center gap-2">
                      <FormLabel>Maturity Date *</FormLabel>
                      <Tooltip>
                        <TooltipTrigger>
                          <Info className="h-4 w-4 text-muted-foreground" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>The date when this yearly plan will mature (372 days from start)</p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                    <FormControl>
                      <Input type="date" {...field} data-testid="input-yearly-maturity-date" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="flex justify-end gap-3 pt-4">
                <Button type="button" variant="outline" onClick={() => setCreateYearlyPlanOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createYearlyPlanMutation.isPending}>
                  {createYearlyPlanMutation.isPending ? "Creating..." : "Create Yearly Plan"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <Dialog open={recordYearlySavingsOpen} onOpenChange={setRecordYearlySavingsOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Record Yearly Savings</DialogTitle>
            <DialogDescription>Record a new yearly savings contribution for this plan</DialogDescription>
          </DialogHeader>
          <Form {...yearlySavingsForm}>
            <form 
              onSubmit={yearlySavingsForm.handleSubmit((data) => {
                if (!selectedYearlyPlanId) return;
                recordYearlySavingsMutation.mutate(data);
              })} 
              className="space-y-4"
            >
              <FormField
                control={yearlySavingsForm.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex items-center gap-2">
                      <FormLabel>Amount (₦) *</FormLabel>
                      <Tooltip>
                        <TooltipTrigger>
                          <Info className="h-4 w-4 text-muted-foreground" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>The amount being contributed to this yearly savings plan</p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                    <FormControl>
                      <Input type="number" step="0.01" placeholder="0.00" {...field} data-testid="input-yearly-savings-amount" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={yearlySavingsForm.control}
                name="paymentMethod"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex items-center gap-2">
                      <FormLabel>Payment Method</FormLabel>
                      <Tooltip>
                        <TooltipTrigger>
                          <Info className="h-4 w-4 text-muted-foreground" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>How the payment was made (cash, bank transfer, or mobile money)</p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-yearly-payment-method">
                          <SelectValue placeholder="Select payment method" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="cash">Cash</SelectItem>
                        <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                        <SelectItem value="mobile_money">Mobile Money</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />
              <FormField
                control={yearlySavingsForm.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex items-center gap-2">
                      <FormLabel>Notes</FormLabel>
                      <Tooltip>
                        <TooltipTrigger>
                          <Info className="h-4 w-4 text-muted-foreground" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Optional notes about this yearly savings contribution (e.g., payment reference)</p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                    <FormControl>
                      <Input placeholder="Optional notes" {...field} data-testid="input-yearly-savings-notes" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="flex justify-end gap-3 pt-4">
                <Button type="button" variant="outline" onClick={() => setRecordYearlySavingsOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={recordYearlySavingsMutation.isPending}>
                  {recordYearlySavingsMutation.isPending ? "Recording..." : "Record Yearly Savings"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <Dialog open={monthlyProfitOpen} onOpenChange={setMonthlyProfitOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Monthly Profit Calculation</DialogTitle>
            <DialogDescription>View monthly profit details for this yearly savings plan</DialogDescription>
          </DialogHeader>
          {yearlyPlanProfit && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 border rounded-lg bg-blue-50">
                  <p className="text-xs text-muted-foreground">Monthly Profit Earned</p>
                  <p className="text-lg font-semibold text-blue-600">
                    ₦{parseFloat(yearlyPlanProfit.monthlyProfitEarned).toFixed(2)}
                  </p>
                </div>
                <div className="p-3 border rounded-lg bg-green-50">
                  <p className="text-xs text-muted-foreground">Full Profit at Maturity</p>
                  <p className="text-lg font-semibold text-green-600">
                    ₦{parseFloat(yearlyPlanProfit.fullProfitEarned).toFixed(2)}
                  </p>
                </div>
              </div>
              <div className="p-3 border rounded-lg bg-muted">
                <p className="text-xs text-muted-foreground">Total with Monthly Profit</p>
                <p className="text-lg font-semibold text-primary">
                  ₦{parseFloat(yearlyPlanProfit.totalWithProfit).toFixed(2)}
                </p>
              </div>
              <div className="text-xs text-muted-foreground space-y-1">
                <p>• Monthly profit: 50% of monthly rate for each completed month</p>
                <p>• Full profit: 100% of annual rate (paid at maturity)</p>
                <p>• Plans can be broken after completing any full month (31 days)</p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
      </div>
    </TooltipProvider>
  );
}
