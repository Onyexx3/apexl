import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { CalendarIcon, Calculator, Download } from "lucide-react";
import { format, addDays } from "date-fns";
import { 
  insertDynamicSavingsPlanSchema, 
  insertMemberInvestmentSchema,
  type InsertDynamicSavingsPlan,
  type InsertMemberInvestment,
  type SavingsPlanType,
  type InvestmentType
} from "@shared/schema";
import { z } from "zod";

interface PlanFormData {
  createPlan: boolean;
  planType: "savings" | "investment";
}

interface PlanFormProps {
  memberId?: string;
  onPlanCreated?: (planData: any) => void;
}

const planFormSchema = z.object({
  createPlan: z.boolean().default(false),
  planType: z.enum(["savings", "investment"]).default("savings"),
});

const dynamicSavingsPlanFormSchema = insertDynamicSavingsPlanSchema.extend({
  startDate: z.string().min(1, "Start date is required"),
});

const memberInvestmentFormSchema = insertMemberInvestmentSchema.extend({
  startDate: z.string().min(1, "Start date is required"),
});

export function PlanForm({ memberId, onPlanCreated }: PlanFormProps) {
  const [activeTab, setActiveTab] = useState("savings");
  const [calculatedMaturityDate, setCalculatedMaturityDate] = useState<string>("");
  const [selectedPlanType, setSelectedPlanType] = useState<SavingsPlanType | null>(null);
  const [selectedInvestmentType, setSelectedInvestmentType] = useState<InvestmentType | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: savingsPlanTypes } = useQuery<SavingsPlanType[]>({
    queryKey: ["/api/savings-plan-types"],
    queryFn: async () => {
      const response = await fetch("/api/savings-plan-types");
      if (!response.ok) throw new Error("Failed to fetch savings plan types");
      return response.json();
    },
  });

  const { data: investmentTypes } = useQuery<InvestmentType[]>({
    queryKey: ["/api/investment-types"],
    queryFn: async () => {
      const response = await fetch("/api/investment-types");
      if (!response.ok) throw new Error("Failed to fetch investment types");
      return response.json();
    },
  });

  const savingsForm = useForm<InsertDynamicSavingsPlan>({
    resolver: zodResolver(dynamicSavingsPlanFormSchema),
    defaultValues: {
      planTypeId: 0,
      memberId: memberId || "",
      planName: "",
      targetAmount: "",
      contributionAmount: "",
      maxContributions: 31,
      interestRate: "",
      breakFee: "",
      earlyWithdrawalPenalty: "",
      maturityDate: "",
      canBreakAfterDays: 31,
      profitCalculationType: "monthly",
      startDate: format(new Date(), "yyyy-MM-dd"),
    },
  });

  const investmentForm = useForm<InsertMemberInvestment>({
    resolver: zodResolver(memberInvestmentFormSchema),
    defaultValues: {
      memberId: memberId || "",
      investmentTypeId: "",
      amount: "",
      status: "active",
      notes: "",
      startDate: format(new Date(), "yyyy-MM-dd"),
    },
  });

  // Calculate maturity date when plan type or start date changes
  useEffect(() => {
    if (selectedPlanType && savingsForm.watch("startDate")) {
      const startDate = new Date(savingsForm.watch("startDate"));
      const maturityDate = addDays(startDate, selectedPlanType.defaultDuration);
      setCalculatedMaturityDate(format(maturityDate, "yyyy-MM-dd"));
      savingsForm.setValue("maturityDate", format(maturityDate, "yyyy-MM-dd"));
    }
  }, [selectedPlanType, savingsForm.watch("startDate")]);

  // Calculate maturity date for investment
  useEffect(() => {
    if (selectedInvestmentType && investmentForm.watch("startDate")) {
      const startDate = new Date(investmentForm.watch("startDate"));
      const maturityDate = addDays(startDate, selectedInvestmentType.durationDays);
      setCalculatedMaturityDate(format(maturityDate, "yyyy-MM-dd"));
    }
  }, [selectedInvestmentType, investmentForm.watch("startDate")]);

  const [autoCalcMode, setAutoCalcMode] = useState<"target" | "contribution" | null>(null);

  const handleTargetAmountChange = (value: string) => {
    savingsForm.setValue("targetAmount", value);
    if (value && selectedPlanType && autoCalcMode !== "target") {
      setAutoCalcMode("contribution");
      const target = parseFloat(value);
      const maxContributions = selectedPlanType.defaultMaxContributions;
      if (!isNaN(target) && maxContributions > 0) {
        const contribution = (target / maxContributions).toFixed(2);
        savingsForm.setValue("contributionAmount", contribution);
      }
    }
  };

  const handleContributionAmountChange = (value: string) => {
    savingsForm.setValue("contributionAmount", value);
    if (value && selectedPlanType && autoCalcMode !== "contribution") {
      setAutoCalcMode("target");
      const contribution = parseFloat(value);
      const maxContributions = selectedPlanType.defaultMaxContributions;
      if (!isNaN(contribution) && maxContributions > 0) {
        const target = (contribution * maxContributions).toFixed(2);
        savingsForm.setValue("targetAmount", target);
      }
    }
  };

  const handlePlanTypeChange = (planTypeId: string) => {
    const planType = savingsPlanTypes?.find(pt => pt.id === parseInt(planTypeId));
    if (planType) {
      setSelectedPlanType(planType);
      savingsForm.setValue("planTypeId", planType.id);
      savingsForm.setValue("interestRate", planType.defaultInterestRate);
      savingsForm.setValue("breakFee", planType.defaultBreakFee);
      savingsForm.setValue("earlyWithdrawalPenalty", planType.defaultEarlyWithdrawalPenalty);
      savingsForm.setValue("maxContributions", planType.defaultMaxContributions);
      savingsForm.setValue("canBreakAfterDays", planType.canBreakAfterDays);
      savingsForm.setValue("profitCalculationType", planType.profitCalculationType);
    }
  };

  const handleInvestmentTypeChange = (investmentTypeId: string) => {
    const investmentType = investmentTypes?.find(it => it.id === investmentTypeId);
    if (investmentType) {
      setSelectedInvestmentType(investmentType);
      investmentForm.setValue("investmentTypeId", investmentTypeId);
    }
  };

  const generatePlanSummaryPDF = async (planData: any, planType: "savings" | "investment") => {
    try {
      const response = await fetch("/api/generate-plan-summary", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          planData,
          planType,
          memberId,
        }),
      });

      if (!response.ok) throw new Error("Failed to generate PDF");

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `plan-summary-${format(new Date(), "yyyy-MM-dd-HHmmss")}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error("Error generating PDF:", error);
    }
  };

  const onSavingsSubmit = async (data: InsertDynamicSavingsPlan) => {
    setIsSubmitting(true);
    try {
      const response = await fetch("/api/dynamic-savings-plans", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error("Failed to create savings plan");
      }

      const plan = await response.json();
      
      if (onPlanCreated) {
        onPlanCreated({
          type: "savings",
          data: {
            ...data,
            planType: selectedPlanType,
            ...plan,
          },
        });
      }
      
      await generatePlanSummaryPDF(data, "savings");
    } catch (error) {
      console.error("Error creating savings plan:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const onInvestmentSubmit = async (data: InsertMemberInvestment) => {
    setIsSubmitting(true);
    try {
      const response = await fetch("/api/investments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error("Failed to create investment plan");
      }

      const investment = await response.json();
      
      if (onPlanCreated) {
        onPlanCreated({
          type: "investment",
          data: {
            ...data,
            investmentType: selectedInvestmentType,
            ...investment,
          },
        });
      }
      
      await generatePlanSummaryPDF(data, "investment");
    } catch (error) {
      console.error("Error creating investment plan:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calculator className="w-5 h-5" />
          Create Savings/Investment Plan
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="savings">Savings Plan</TabsTrigger>
            <TabsTrigger value="investment">Investment Plan</TabsTrigger>
          </TabsList>

          <TabsContent value="savings" className="space-y-4">
            <Form {...savingsForm}>
              <form onSubmit={savingsForm.handleSubmit(onSavingsSubmit)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={savingsForm.control}
                    name="planName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Plan Name</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., Emergency Fund" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={savingsForm.control}
                    name="planTypeId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Plan Type</FormLabel>
                        <Select onValueChange={handlePlanTypeChange} value={field.value.toString()}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select plan type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {savingsPlanTypes?.filter(pt => pt.isActive).map((planType) => (
                              <SelectItem key={planType.id} value={planType.id.toString()}>
                                <div className="flex flex-col">
                                  <span>{planType.name}</span>
                                  <span className="text-xs text-muted-foreground">
                                    {planType.category} • {planType.defaultDuration} days
                                  </span>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {selectedPlanType && (
                  <div className="p-3 bg-muted rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="secondary">{selectedPlanType.category}</Badge>
                      <span className="text-sm text-muted-foreground">
                        Default: {selectedPlanType.defaultDuration} days
                      </span>
                    </div>
                    <p className="text-sm">{selectedPlanType.description}</p>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={savingsForm.control}
                    name="targetAmount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Target Amount (₦)</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            placeholder="100000" 
                            {...field}
                            onChange={(e) => handleTargetAmountChange(e.target.value)}
                          />
                        </FormControl>
                        <p className="text-xs text-muted-foreground">
                          {selectedPlanType && "Enter target to auto-calculate contribution"}
                        </p>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={savingsForm.control}
                    name="contributionAmount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Contribution Amount (₦)</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            placeholder="3000" 
                            {...field}
                            onChange={(e) => handleContributionAmountChange(e.target.value)}
                          />
                        </FormControl>
                        <p className="text-xs text-muted-foreground">
                          {selectedPlanType && "Enter contribution to auto-calculate target"}
                        </p>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {selectedPlanType && (
                  <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <p className="text-sm text-yellow-800">
                      <strong>Note:</strong> The first contribution is a non-refundable registration fee and will not be included in loan calculations or returned upon plan closure.
                    </p>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={savingsForm.control}
                    name="startDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Start Date</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="space-y-2">
                    <Label>Maturity Date</Label>
                    <div className="flex items-center gap-2 p-2 border rounded-md bg-muted/50">
                      <CalendarIcon className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm">
                        {calculatedMaturityDate || "Select plan type and start date"}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <FormField
                    control={savingsForm.control}
                    name="interestRate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Interest Rate (%)</FormLabel>
                        <FormControl>
                          <Input placeholder="5.0" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={savingsForm.control}
                    name="breakFee"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Break Fee (%)</FormLabel>
                        <FormControl>
                          <Input placeholder="2.0" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={savingsForm.control}
                    name="maxContributions"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Max Contributions</FormLabel>
                        <FormControl>
                          <Input type="number" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <Button type="submit" disabled={isSubmitting} className="w-full">
                  {isSubmitting ? "Creating..." : "Create Savings Plan & Download Summary"}
                </Button>
              </form>
            </Form>
          </TabsContent>

          <TabsContent value="investment" className="space-y-4">
            <Form {...investmentForm}>
              <form onSubmit={investmentForm.handleSubmit(onInvestmentSubmit)} className="space-y-4">
                <FormField
                  control={investmentForm.control}
                  name="investmentTypeId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Investment Type</FormLabel>
                      <Select onValueChange={handleInvestmentTypeChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select investment type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {investmentTypes?.filter(it => it.status === "active").map((investmentType) => (
                            <SelectItem key={investmentType.id} value={investmentType.id}>
                              <div className="flex flex-col">
                                <span>{investmentType.name}</span>
                                <span className="text-xs text-muted-foreground">
                                  {investmentType.category} • {investmentType.interestRate}% • {investmentType.durationDays} days
                                </span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {selectedInvestmentType && (
                  <div className="p-3 bg-muted rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="secondary">{selectedInvestmentType.category}</Badge>
                      <span className="text-sm text-muted-foreground">
                        Min: ₦{parseFloat(selectedInvestmentType.minimumDeposit).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-sm">{selectedInvestmentType.description}</p>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={investmentForm.control}
                    name="amount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Investment Amount (₦)</FormLabel>
                        <FormControl>
                          <Input type="number" placeholder="100000" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="space-y-2">
                    <Label>Interest Rate (%)</Label>
                    <div className="flex items-center p-2 border rounded-md bg-muted/50">
                      <span className="text-sm">
                        {selectedInvestmentType ? `${selectedInvestmentType.interestRate}% (set by investment type)` : "Select investment type"}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={investmentForm.control}
                    name="startDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Start Date</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="space-y-2">
                    <Label>Maturity Date</Label>
                    <div className="flex items-center gap-2 p-2 border rounded-md bg-muted/50">
                      <CalendarIcon className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm">
                        {calculatedMaturityDate || "Select investment type and start date"}
                      </span>
                    </div>
                  </div>
                </div>

                <FormField
                  control={investmentForm.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Notes</FormLabel>
                      <FormControl>
                        <Input placeholder="Additional notes..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button type="submit" disabled={isSubmitting} className="w-full">
                  {isSubmitting ? "Creating..." : "Create Investment Plan & Download Summary"}
                </Button>
              </form>
            </Form>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
