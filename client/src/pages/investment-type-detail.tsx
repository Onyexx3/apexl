import { useQuery } from "@tanstack/react-query";
import { useRoute, Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowLeft, TrendingUp, Calendar, Percent, Banknote, Clock, AlertTriangle } from "lucide-react";
import type { InvestmentType, MemberInvestmentWithDetails } from "@shared/schema";
import { format } from "date-fns";

interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export default function InvestmentTypeDetail() {
  const [, params] = useRoute("/investment-types/:id");
  const investmentTypeId = params?.id;

  const { data: investmentType, isLoading } = useQuery<InvestmentType>({
    queryKey: ["/api/investment-types", investmentTypeId],
    queryFn: async () => {
      const res = await fetch(`/api/investment-types/${investmentTypeId}`);
      if (!res.ok) throw new Error("Failed to fetch investment type");
      return res.json();
    },
    enabled: !!investmentTypeId,
  });

  const { data: investmentsData, isLoading: investmentsLoading } = useQuery<PaginatedResponse<MemberInvestmentWithDetails>>({
    queryKey: ["/api/investments", "type", investmentTypeId],
    queryFn: async () => {
      const res = await fetch(`/api/investments?investmentTypeId=${investmentTypeId}&limit=50`);
      if (!res.ok) throw new Error("Failed to fetch investments");
      return res.json();
    },
    enabled: !!investmentTypeId,
  });

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

  if (!investmentType) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <p className="text-sm font-medium">Investment type not found</p>
        <Button asChild className="mt-4">
          <Link href="/investment-types">Back to Investment Types</Link>
        </Button>
      </div>
    );
  }

  const activeInvestments = investmentsData?.data.filter(i => i.status === "active") || [];
  const totalInvested = investmentsData?.data.reduce((sum, i) => sum + parseFloat(i.amount), 0) || 0;
  const totalExpectedReturns = investmentsData?.data.reduce((sum, i) => sum + parseFloat(i.expectedReturn), 0) || 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/investment-types">
            <ArrowLeft className="w-4 h-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-semibold">{investmentType.name}</h1>
          <p className="text-sm text-muted-foreground">Investment Product Details</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Product Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Status</span>
              <Badge variant={investmentType.status === "active" ? "default" : "secondary"}>
                {investmentType.status}
              </Badge>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Category</span>
              <Badge variant="outline">{investmentType.category}</Badge>
            </div>

            <div className="pt-4 border-t space-y-3">
              <div className="flex items-start gap-3">
                <Banknote className="w-4 h-4 text-muted-foreground mt-0.5" />
                <div className="text-sm flex-1">
                  <p className="text-muted-foreground text-xs">Minimum Deposit</p>
                  <p className="font-semibold">₦{parseFloat(investmentType.minimumDeposit).toLocaleString()}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Percent className="w-4 h-4 text-muted-foreground mt-0.5" />
                <div className="text-sm flex-1">
                  <p className="text-muted-foreground text-xs">Interest Rate</p>
                  <p className="font-semibold">{investmentType.interestRate}% per annum</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Clock className="w-4 h-4 text-muted-foreground mt-0.5" />
                <div className="text-sm flex-1">
                  <p className="text-muted-foreground text-xs">Duration</p>
                  <p className="font-semibold">{investmentType.durationDays} days</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Calendar className="w-4 h-4 text-muted-foreground mt-0.5" />
                <div className="text-sm flex-1">
                  <p className="text-muted-foreground text-xs">Payment Plan</p>
                  <p className="font-semibold capitalize">{investmentType.paymentPlan}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <AlertTriangle className="w-4 h-4 text-muted-foreground mt-0.5" />
                <div className="text-sm flex-1">
                  <p className="text-muted-foreground text-xs">Early Termination</p>
                  <p className="font-semibold">
                    {investmentType.isBreakable ? `Allowed (${investmentType.breakFee}% fee)` : "Not Allowed"}
                  </p>
                </div>
              </div>
            </div>

            {investmentType.description && (
              <div className="pt-4 border-t">
                <p className="text-sm text-muted-foreground mb-1">Description</p>
                <p className="text-sm">{investmentType.description}</p>
              </div>
            )}

            <div className="pt-4 border-t text-xs text-muted-foreground">
              Created on {format(new Date(investmentType.createdAt), "MMMM dd, yyyy")}
            </div>
          </CardContent>
        </Card>

        <div className="lg:col-span-2 space-y-6">
          <div className="grid grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Total Invested</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold tabular-nums text-primary">
                  ₦{totalInvested.toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Across {investmentsData?.total || 0} investments
                </p>
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
                <p className="text-xs text-muted-foreground mt-1">
                  Currently running
                </p>
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
                <p className="text-xs text-muted-foreground mt-1">
                  Total projected
                </p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Member Investments</CardTitle>
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
                  <p className="text-sm text-muted-foreground">No investments in this product yet</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Member</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Expected Return</TableHead>
                      <TableHead>Start Date</TableHead>
                      <TableHead>Maturity Date</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {investmentsData.data.map((investment) => (
                      <TableRow key={investment.id} className="cursor-pointer hover:bg-muted/50">
                        <TableCell>
                          <Link href={`/members/${investment.memberId}`} className="font-medium hover:underline">
                            {investment.member?.name}
                          </Link>
                        </TableCell>
                        <TableCell>₦{parseFloat(investment.amount).toLocaleString()}</TableCell>
                        <TableCell>₦{parseFloat(investment.expectedReturn).toLocaleString()}</TableCell>
                        <TableCell>{format(new Date(investment.startDate), "MMM d, yyyy")}</TableCell>
                        <TableCell>{format(new Date(investment.maturityDate), "MMM d, yyyy")}</TableCell>
                        <TableCell>{getStatusBadge(investment.status)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
