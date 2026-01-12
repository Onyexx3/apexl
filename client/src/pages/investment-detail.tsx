import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRoute, Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { ArrowLeft, TrendingUp, Calendar, Percent, Banknote, Clock, AlertTriangle, User, CheckCircle2 } from "lucide-react";
import type { MemberInvestmentWithDetails } from "@shared/schema";
import { format } from "date-fns";

export default function InvestmentDetail() {
  const [, params] = useRoute("/investments/:id");
  const investmentId = params?.id;
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: investment, isLoading } = useQuery<MemberInvestmentWithDetails>({
    queryKey: ["/api/investments", investmentId],
    queryFn: async () => {
      const res = await fetch(`/api/investments/${investmentId}`);
      if (!res.ok) throw new Error("Failed to fetch investment");
      return res.json();
    },
    enabled: !!investmentId,
  });

  const breakMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/investments/${investmentId}/break`, { method: "PATCH" });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message);
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/investments"] });
      toast({ title: "Investment broken successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const matureMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/investments/${investmentId}/mature`, { method: "PATCH" });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message);
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/investments"] });
      toast({ title: "Investment matured successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge variant="default" className="text-base px-3 py-1">Active</Badge>;
      case "matured":
        return <Badge className="bg-green-500 text-base px-3 py-1">Matured</Badge>;
      case "broken":
        return <Badge variant="destructive" className="text-base px-3 py-1">Broken</Badge>;
      case "completed":
        return <Badge variant="secondary" className="text-base px-3 py-1">Completed</Badge>;
      default:
        return <Badge variant="secondary" className="text-base px-3 py-1">{status}</Badge>;
    }
  };

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

  if (!investment) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <p className="text-sm font-medium">Investment not found</p>
        <Button asChild className="mt-4">
          <Link href="/investments">Back to Investments</Link>
        </Button>
      </div>
    );
  }

  const isMatured = new Date(investment.maturityDate) <= new Date();
  const daysRemaining = Math.max(0, Math.ceil((new Date(investment.maturityDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)));
  const totalDuration = investment.investmentType?.durationDays || 0;
  const daysElapsed = totalDuration - daysRemaining;
  const progressPercent = totalDuration > 0 ? Math.min(100, (daysElapsed / totalDuration) * 100) : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/investments">
            <ArrowLeft className="w-4 h-4" />
          </Link>
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-semibold">Investment Details</h1>
          <p className="text-sm text-muted-foreground">
            {investment.investmentType?.name} - {investment.member?.name}
          </p>
        </div>
        {getStatusBadge(investment.status)}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <User className="w-5 h-5" />
              Member Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-center">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-2xl font-semibold text-primary">
                  {investment.member?.name.charAt(0).toUpperCase()}
                </span>
              </div>
            </div>

            <div className="text-center">
              <Link href={`/members/${investment.memberId}`} className="font-semibold text-lg hover:underline">
                {investment.member?.name}
              </Link>
              {investment.member?.walletNumber && (
                <p className="text-sm text-muted-foreground font-mono">{investment.member.walletNumber}</p>
              )}
            </div>

            {investment.member?.phone && (
              <div className="text-center text-sm text-muted-foreground">
                {investment.member.phone}
              </div>
            )}

            <Button asChild variant="outline" className="w-full">
              <Link href={`/members/${investment.memberId}`}>
                View Member Profile
              </Link>
            </Button>
          </CardContent>
        </Card>

        <div className="lg:col-span-2 space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Investment Amount</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold tabular-nums text-primary">
                  ₦{parseFloat(investment.amount).toLocaleString()}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Expected Return</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold tabular-nums text-green-600">
                  ₦{parseFloat(investment.expectedReturn).toLocaleString()}
                </div>
              </CardContent>
            </Card>
          </div>

          {investment.status === "active" && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Progress</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>{daysElapsed} days elapsed</span>
                    <span>{daysRemaining} days remaining</span>
                  </div>
                  <div className="w-full h-3 bg-muted rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-primary rounded-full transition-all" 
                      style={{ width: `${progressPercent}%` }} 
                    />
                  </div>
                  <p className="text-xs text-muted-foreground text-center">
                    {progressPercent.toFixed(0)}% complete
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Investment Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-start gap-3">
                  <Banknote className="w-4 h-4 text-muted-foreground mt-0.5" />
                  <div className="text-sm">
                    <p className="text-muted-foreground text-xs">Investment Type</p>
                    <Link href={`/investment-types/${investment.investmentTypeId}`} className="font-semibold hover:underline">
                      {investment.investmentType?.name}
                    </Link>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Percent className="w-4 h-4 text-muted-foreground mt-0.5" />
                  <div className="text-sm">
                    <p className="text-muted-foreground text-xs">Interest Rate</p>
                    <p className="font-semibold">{investment.interestRate}% p.a.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Calendar className="w-4 h-4 text-muted-foreground mt-0.5" />
                  <div className="text-sm">
                    <p className="text-muted-foreground text-xs">Start Date</p>
                    <p className="font-semibold">{format(new Date(investment.startDate), "MMMM dd, yyyy")}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Clock className="w-4 h-4 text-muted-foreground mt-0.5" />
                  <div className="text-sm">
                    <p className="text-muted-foreground text-xs">Maturity Date</p>
                    <p className="font-semibold">{format(new Date(investment.maturityDate), "MMMM dd, yyyy")}</p>
                  </div>
                </div>
              </div>

              {investment.notes && (
                <div className="pt-4 border-t">
                  <p className="text-sm text-muted-foreground mb-1">Notes</p>
                  <p className="text-sm">{investment.notes}</p>
                </div>
              )}

              {(investment.status === "broken" || investment.status === "matured") && investment.actualReturn && (
                <div className="pt-4 border-t">
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5" />
                    <div className="text-sm">
                      <p className="text-muted-foreground text-xs">Actual Return</p>
                      <p className="font-semibold text-green-600">₦{parseFloat(investment.actualReturn).toLocaleString()}</p>
                      {investment.breakFeeApplied && (
                        <p className="text-xs text-destructive">
                          Break fee applied: ₦{parseFloat(investment.breakFeeApplied).toLocaleString()}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {investment.completedDate && (
                <div className="pt-4 border-t text-xs text-muted-foreground">
                  Completed on {format(new Date(investment.completedDate), "MMMM dd, yyyy")}
                </div>
              )}
            </CardContent>
          </Card>

          {investment.status === "active" && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Actions</CardTitle>
              </CardHeader>
              <CardContent className="flex gap-4">
                {investment.investmentType?.isBreakable && (
                  <Button
                    variant="outline"
                    onClick={() => {
                      if (confirm(`Break this investment? A ${investment.investmentType?.breakFee}% fee will be applied.`)) {
                        breakMutation.mutate();
                      }
                    }}
                    disabled={breakMutation.isPending}
                  >
                    <AlertTriangle className="mr-2 h-4 w-4" />
                    Break Investment
                  </Button>
                )}
                {(user?.role === "admin" || user?.role === "manager") && isMatured && (
                  <Button
                    onClick={() => matureMutation.mutate()}
                    disabled={matureMutation.isPending}
                  >
                    <TrendingUp className="mr-2 h-4 w-4" />
                    Mark as Matured
                  </Button>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
