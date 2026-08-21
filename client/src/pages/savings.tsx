import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
import { useToast } from "@/hooks/use-toast";
import { insertPlanContributionSchema, type InsertPlanContribution, type Member, type SavingsPlan } from "@shared/schema";
import { apiRequest, invalidateAllQueries } from "@/lib/queryClient";
import { getPlanMaxContributions } from "@/lib/savingsPlan";
import { DollarSign, CalendarIcon, Info } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { useState } from "react";
import { z } from "zod";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface PaginatedMembers {
  data: Member[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export default function Savings() {
  const { toast } = useToast();
  const [selectedMemberId, setSelectedMemberId] = useState<string>("");
  const [selectedPlanId, setSelectedPlanId] = useState<string>("");

  const { data: membersResponse } = useQuery<PaginatedMembers>({
    queryKey: ["/api/members", 1],
    queryFn: async () => {
      const res = await fetch("/api/members?page=1&limit=1000");
      return res.json();
    },
  });

  const { data: memberPlans } = useQuery<SavingsPlan[]>({
    queryKey: ["/api/members", selectedMemberId, "plans"],
    enabled: !!selectedMemberId,
  });

  const contributionSchema = z.object({
    amount: z.string().min(1, "Amount is required").refine((val) => !isNaN(Number(val)) && Number(val) > 0, {
      message: "Amount must be a positive number",
    }),
    paymentMethod: z.string().optional(),
    notes: z.string().optional(),
    date: z.string().optional(),
  });

  type ContributionFormData = z.infer<typeof contributionSchema>;

  const form = useForm<ContributionFormData>({
    resolver: zodResolver(contributionSchema),
    defaultValues: {
      amount: "",
      paymentMethod: "",
      notes: "",
      date: new Date().toISOString(),
    },
  });

  const allMembers = membersResponse?.data || [];
  const activeMembers = allMembers.filter(m => m.status === "active");
  const selectedDate = form.watch("date") ? new Date(form.watch("date")) : new Date();
  const activePlans = memberPlans?.filter(p => p.status === "active") || [];

  const selectedPlan = activePlans.find(p => p.id === selectedPlanId);
  const dailyContribution = selectedPlan ? parseFloat(selectedPlan.contributionAmount) : 0;

  const mutation = useMutation({
    mutationFn: async (data: ContributionFormData) => {
      if (!selectedPlanId) throw new Error("Plan not selected");
      return apiRequest("POST", `/api/plans/${selectedPlanId}/contribute`, {
        memberId: selectedMemberId,
        amount: data.amount,
        paymentMethod: data.paymentMethod,
        notes: data.notes,
        date: data.date || new Date().toISOString(),
      });
    },
    onSuccess: (response: any) => {
      const count = response?.count || 1;
      invalidateAllQueries();
      toast({
        title: "Savings recorded",
        description: `${count} daily contributions have been recorded (${count} timeline slots updated).`,
      });
      form.reset({
        amount: "",
        paymentMethod: "",
        notes: "",
        date: new Date().toISOString(),
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to record savings. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: ContributionFormData) => {
    if (!selectedPlanId) {
      toast({
        title: "Error",
        description: "Please select a savings plan.",
        variant: "destructive",
      });
      return;
    }
    mutation.mutate(data);
  };

  return (
    <TooltipProvider>
      <div className="space-y-6 max-w-2xl">
        <div>
          <h1 className="text-2xl font-semibold" data-testid="text-page-title">Record Daily Savings</h1>
          <p className="text-sm text-muted-foreground">Log member contributions for the day</p>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-md bg-primary/10">
                <DollarSign className="w-5 h-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-lg">Savings Entry</CardTitle>
                <CardDescription>Enter the daily savings details below</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="memberId"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex items-center gap-2">
                      <FormLabel>Select Member *</FormLabel>
                      <Tooltip>
                        <TooltipTrigger>
                          <Info className="h-4 w-4 text-muted-foreground" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Choose the member making this savings contribution</p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                    <Select
                      onValueChange={(value) => {
                        field.onChange(value);
                        setSelectedMemberId(value);
                        setSelectedPlanId("");
                      }}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger data-testid="select-member">
                          <SelectValue placeholder="Choose a member" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {activeMembers.map((member) => (
                          <SelectItem key={member.id} value={member.id}>
                            {member.name} - ₦{parseFloat(member.balance).toFixed(2)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {selectedMemberId && activePlans.length > 0 && (
                <FormItem>
                  <div className="flex items-center gap-2">
                    <FormLabel>Select Savings Plan *</FormLabel>
                    <Tooltip>
                      <TooltipTrigger>
                        <Info className="h-4 w-4 text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Select the savings plan for this contribution</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <Select onValueChange={setSelectedPlanId} value={selectedPlanId}>
                    <FormControl>
                      <SelectTrigger data-testid="select-plan">
                        <SelectValue placeholder="Choose a savings plan" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {activePlans.map((plan) => (
                        <SelectItem key={plan.id} value={plan.id}>
                          {plan.planName} - ₦{parseFloat(plan.contributionAmount).toFixed(2)} per contribution ({plan.contributionsCount}/{getPlanMaxContributions(plan)})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormItem>
              )}

              {selectedPlanId && (
                <div className="p-3 border rounded-lg bg-primary/5">
                  <p className="text-sm">
                    <span className="font-medium">Plan Target:</span> ₦{selectedPlan?.targetAmount && parseFloat(selectedPlan.targetAmount).toFixed(2)}
                  </p>
                  <p className="text-sm mt-1">
                    <span className="font-medium">Total Saved:</span> ₦{selectedPlan?.totalSaved && parseFloat(selectedPlan.totalSaved).toFixed(2)}
                  </p>
                  <p className="text-sm mt-1">
                    <span className="font-medium">Progress:</span> {selectedPlan?.contributionsCount || 0}/{selectedPlan ? getPlanMaxContributions(selectedPlan) : 31} days
                  </p>
                </div>
              )}

              {selectedPlanId && form.watch("amount") && (
                <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800">
                  <p className="text-sm text-blue-900 dark:text-blue-200">
                    <span className="font-medium">📊 Timeline Impact:</span> ₦{form.watch("amount")} ÷ ₦{dailyContribution.toFixed(2)} per day = <span className="font-bold">{Math.floor(parseFloat(form.watch("amount") || 0) / dailyContribution)} days</span> of contributions will be recorded
                  </p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
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
                            <p>Enter the amount being saved today</p>
                          </TooltipContent>
                        </Tooltip>
                      </div>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="0.00"
                          {...field}
                          className="text-lg tabular-nums"
                          data-testid="input-amount"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="date"
                  render={({ field }) => (
                    <FormItem>
                      <div className="flex items-center gap-2">
                        <FormLabel>Date *</FormLabel>
                        <Tooltip>
                          <TooltipTrigger>
                            <Info className="h-4 w-4 text-muted-foreground" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Date when this savings was made</p>
                          </TooltipContent>
                        </Tooltip>
                      </div>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              className="w-full justify-start text-left font-normal"
                              data-testid="button-select-date"
                            >
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {field.value ? format(new Date(field.value), "MMM dd, yyyy") : "Pick a date"}
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={selectedDate}
                            onSelect={(date) => field.onChange(date?.toISOString() || new Date().toISOString())}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
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
                          <p>How the payment was made</p>
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
                    <div className="flex items-center gap-2">
                      <FormLabel>Notes (Optional)</FormLabel>
                      <Tooltip>
                        <TooltipTrigger>
                          <Info className="h-4 w-4 text-muted-foreground" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Any additional notes about this transaction</p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                    <FormControl>
                      <Textarea
                        placeholder="Add any additional notes..."
                        rows={3}
                        {...field}
                        data-testid="input-notes"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => form.reset()}
                  disabled={mutation.isPending}
                  className="flex-1"
                  data-testid="button-reset"
                >
                  Reset
                </Button>
                <Button
                  type="submit"
                  disabled={mutation.isPending}
                  className="flex-1"
                  data-testid="button-submit-savings"
                >
                  {mutation.isPending ? "Recording..." : "Record Savings"}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
      </div>
    </TooltipProvider>
  );
}
