import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Pagination } from "@/components/pagination";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
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
import { Plus, Search, TrendingUp, Clock, Calendar } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertYearlySavingsPlanSchema, type InsertYearlySavingsPlan, type YearlySavingsPlan, type Member } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, invalidateAllQueries } from "@/lib/queryClient";
import { Link } from "wouter";
import { format, addDays } from "date-fns";

interface PaginatedPlans {
  data: YearlySavingsPlan[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

interface PaginatedMembers {
  data: Member[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export default function YearlySavingsPlans() {
  const [searchQuery, setSearchQuery] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [page, setPage] = useState(1);
  const { toast } = useToast();

  const { data: response, isLoading: plansLoading } = useQuery<PaginatedPlans>({
    queryKey: ["/api/yearly-savings-plans", page, searchQuery],
    queryFn: async () => {
      const res = await fetch(`/api/yearly-savings-plans?page=${page}&limit=10&search=${encodeURIComponent(searchQuery)}`);
      return res.json();
    },
  });

  const plans = response?.data || [];

  const { data: membersResponse } = useQuery<PaginatedMembers>({
    queryKey: ["/api/members"],
    queryFn: async () => {
      const res = await fetch(`/api/members?page=1&limit=1000`);
      return res.json();
    },
  });

  const members = Array.isArray(membersResponse?.data) ? membersResponse.data : [];

  const form = useForm<InsertYearlySavingsPlan>({
    resolver: zodResolver(insertYearlySavingsPlanSchema),
    defaultValues: {
      memberId: "",
      planName: "",
      targetAmount: "",
      contributionAmount: "",
      maxContributions: 372,
      maxDays: 372,
      profitRate: "5.00",
      startDate: format(new Date(), "yyyy-MM-dd"),
    },
  });

  const watchedStartDate = form.watch("startDate");
  const watchedMaxDays = form.watch("maxDays");
  const computedMaturityDate = watchedStartDate
    ? format(addDays(new Date(watchedStartDate), watchedMaxDays || 372), "MMM dd, yyyy")
    : "";

  const createMutation = useMutation({
    mutationFn: async (data: InsertYearlySavingsPlan) => {
      return apiRequest("POST", "/api/yearly-savings-plans", data);
    },
    onSuccess: () => {
      invalidateAllQueries();
      toast({
        title: "Yearly savings plan created",
        description: "New yearly savings plan has been created successfully.",
      });
      setDialogOpen(false);
      form.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create yearly savings plan.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: InsertYearlySavingsPlan) => {
    createMutation.mutate(data);
  };

  // Search (by plan name or member name) is applied server-side, scoped to this user's role.
  const filteredPlans = Array.isArray(plans) ? plans : [];

  const maturedPlans = Array.isArray(plans) ? plans.filter((plan) => plan.status === "matured") : [];

  const activeMembers = Array.isArray(members) ? members.filter((m) => m.status === "active") : [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold" data-testid="text-page-title">
            Yearly Savings Plans
          </h1>
          <p className="text-sm text-muted-foreground">
            Manage member yearly savings plans with 372-day term and profit
          </p>
        </div>
        <Button onClick={() => setDialogOpen(true)} data-testid="button-create-plan">
          <Plus className="w-4 h-4 mr-2" />
          Create Yearly Plan
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <CardTitle className="text-lg">All Plans</CardTitle>
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search by plan or member..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setPage(1);
                }}
                className="pl-9"
                data-testid="input-search-plans"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {plansLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-64" />
              ))}
            </div>
          ) : !filteredPlans || filteredPlans.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="p-3 rounded-full bg-muted mb-4">
                <TrendingUp className="w-6 h-6 text-muted-foreground" />
              </div>
              <p className="text-sm font-medium">No yearly savings plans</p>
              <p className="text-xs text-muted-foreground mt-1">
                Create a new yearly plan to get started
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredPlans.map((plan) => {
                const member = members?.find((m) => m.id === plan.memberId);
                const progressPercent = (plan.contributionsCount / plan.maxContributions) * 100;
                const isMatured = plan.status === "matured";
                
                return (
                  <Card key={plan.id} className={`flex flex-col ${isMatured ? 'border-green-200 bg-green-50/50' : ''}`} data-testid={`card-plan-${plan.id}`}>
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-sm line-clamp-2">{plan.planName}</CardTitle>
                          <p className="text-xs text-muted-foreground mt-1">
                            {member?.name}
                          </p>
                        </div>
                        <Badge
                          variant={isMatured ? "default" : plan.status === "active" ? "secondary" : "outline"}
                          className={`ml-2 flex-shrink-0 ${isMatured ? 'bg-green-100 text-green-700 border-green-300' : ''}`}
                        >
                          {isMatured ? "Matured" : plan.status}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="flex-1 space-y-4">
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-medium">Progress</span>
                          <span className="text-xs text-muted-foreground">
                            {plan.contributionsCount}/{plan.maxContributions}
                          </span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-2">
                          <div
                            className={`h-2 rounded-full transition-all ${isMatured ? 'bg-green-500' : 'bg-primary'}`}
                            style={{ width: `${progressPercent}%` }}
                          />
                        </div>
                      </div>

                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Target</span>
                          <span className="font-medium tabular-nums">
                            ₦{parseFloat(plan.targetAmount).toFixed(2)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Saved</span>
                          <span className="font-medium tabular-nums text-primary">
                            ₦{parseFloat(plan.totalSaved).toFixed(2)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Per Contribution</span>
                          <span className="font-medium tabular-nums">
                            ₦{parseFloat(plan.contributionAmount).toFixed(2)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Profit Rate</span>
                          <span className="font-medium tabular-nums text-green-600">
                            {plan.profitRate}%
                          </span>
                        </div>
                        {isMatured && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Profit Earned</span>
                            <span className="font-medium tabular-nums text-green-600">
                              ₦{parseFloat(plan.profitEarned || "0").toFixed(2)}
                            </span>
                          </div>
                        )}
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Maturity</span>
                          <span className="font-medium tabular-nums">
                            {format(new Date(plan.maturityDate), "MMM dd, yyyy")}
                          </span>
                        </div>
                      </div>

                      <Button
                        variant="outline"
                        className="w-full mt-4"
                        asChild
                        data-testid={`button-view-plan-${plan.id}`}
                      >
                        <Link href={`/yearly-plans/${plan.id}`}>View Details</Link>
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
          {response && response.totalPages > 1 && (
            <Pagination
              currentPage={page}
              totalPages={response.totalPages}
              onPageChange={setPage}
            />
          )}
        </CardContent>
      </Card>

      {maturedPlans.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-green-500" />
              <CardTitle className="text-lg">Matured Plans</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {maturedPlans.map((plan) => {
                const member = members?.find((m) => m.id === plan.memberId);
                return (
                  <Card key={plan.id} className="flex flex-col border-green-200 bg-green-50/50" data-testid={`card-matured-plan-${plan.id}`}>
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-sm line-clamp-2">{plan.planName}</CardTitle>
                          <p className="text-xs text-muted-foreground mt-1">
                            {member?.name}
                          </p>
                        </div>
                        <Badge variant="outline" className="ml-2 flex-shrink-0 bg-green-100 text-green-700 border-green-300">
                          Matured
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="flex-1 space-y-4">
                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Total Saved</span>
                          <span className="font-medium tabular-nums text-primary">
                            ₦{parseFloat(plan.totalSaved).toFixed(2)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Profit Earned</span>
                          <span className="font-medium tabular-nums text-green-600">
                            ₦{parseFloat(plan.profitEarned || "0").toFixed(2)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Total with Profit</span>
                          <span className="font-medium tabular-nums text-green-600">
                            ₦{(parseFloat(plan.totalSaved) + parseFloat(plan.profitEarned || "0")).toFixed(2)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Matured Date</span>
                          <span className="font-medium tabular-nums">
                            {plan.completedDate && format(new Date(plan.completedDate), "MMM dd, yyyy")}
                          </span>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        className="w-full mt-4"
                        asChild
                        data-testid={`button-view-matured-plan-${plan.id}`}
                      >
                        <Link href={`/yearly-plans/${plan.id}`}>View Details</Link>
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Create Yearly Savings Plan</DialogTitle>
            <DialogDescription>
              Set up a new 372-day yearly savings plan for a member with profit earning.
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
                        <SelectTrigger data-testid="select-plan-member">
                          <SelectValue placeholder="Choose a member" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {activeMembers.map((member) => (
                          <SelectItem key={member.id} value={member.id}>
                            {member.name}
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
                name="planName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Plan Name *</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g., Yearly Investment Plan"
                        {...field}
                        data-testid="input-plan-name"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="targetAmount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Target Amount (₦) *</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="0.00"
                          {...field}
                          data-testid="input-target-amount"
                        />
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
                      <FormLabel>Per Contribution (₦) *</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="0.00"
                          {...field}
                          data-testid="input-contribution-amount"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="profitRate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Profit Rate (%) *</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="5.00"
                          {...field}
                          data-testid="input-profit-rate"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="startDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Start Date *</FormLabel>
                      <FormControl>
                        <Input
                          type="date"
                          {...field}
                          data-testid="input-start-date"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="space-y-2">
                <FormLabel>Maturity Date</FormLabel>
                <div className="flex items-center gap-2 p-2 border rounded-md bg-muted/50">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm" data-testid="text-maturity-date">
                    {computedMaturityDate || "Select a start date"} ({watchedMaxDays || 372} days from start)
                  </span>
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setDialogOpen(false)}
                  disabled={createMutation.isPending}
                  data-testid="button-cancel-plan"
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={createMutation.isPending} data-testid="button-submit-plan">
                  {createMutation.isPending ? "Creating..." : "Create Yearly Plan"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
