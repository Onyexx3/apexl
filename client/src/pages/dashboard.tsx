import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, DollarSign, TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight, History } from "lucide-react";
import type { Member, TransactionWithMember } from "@shared/schema";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

interface DashboardStats {
  totalSavings: string;
  activeMembers: number;
  todayCollections: string;
  pendingPayouts: string;
}

export default function Dashboard() {
  const { data: stats, isLoading: statsLoading } = useQuery<DashboardStats>({
    queryKey: ["/api/dashboard/stats"],
  });

  const { data: recentTransactions, isLoading: transactionsLoading } = useQuery<TransactionWithMember[]>({
    queryKey: ["/api/transactions/recent"],
  });

  const statCards = [
    {
      title: "Total Savings Pool",
      value: stats?.totalSavings || "0.00",
      icon: DollarSign,
      trend: "+12.5%",
      trendUp: true,
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
    {
      title: "Active Members",
      value: stats?.activeMembers || 0,
      icon: Users,
      trend: "+3 new",
      trendUp: true,
      color: "text-blue-600",
      bgColor: "bg-blue-100",
    },
    {
      title: "Today's Collections",
      value: stats?.todayCollections || "0.00",
      icon: TrendingUp,
      trend: "Today",
      trendUp: true,
      color: "text-green-600",
      bgColor: "bg-green-100",
    },
    {
      title: "Pending Payouts",
      value: stats?.pendingPayouts || "0.00",
      icon: TrendingDown,
      trend: "Review",
      trendUp: false,
      color: "text-orange-600",
      bgColor: "bg-orange-100",
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold" data-testid="text-page-title">Dashboard</h1>
        <p className="text-sm text-muted-foreground">Overview of your ApexL Investment management</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, index) => (
          <Card key={stat.title} data-testid={`card-stat-${index}`}>
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <div className={`p-2 rounded-md ${stat.bgColor}`}>
                <stat.icon className={`w-4 h-4 ${stat.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <Skeleton className="h-8 w-24" />
              ) : (
                <>
                  <div className="text-2xl font-semibold tabular-nums" data-testid={`text-stat-value-${index}`}>
                    {typeof stat.value === "number" ? stat.value : `₦${stat.value}`}
                  </div>
                  <div className="flex items-center gap-1 mt-1">
                    {stat.trendUp ? (
                      <ArrowUpRight className="w-3 h-3 text-green-600" />
                    ) : (
                      <ArrowDownRight className="w-3 h-3 text-orange-600" />
                    )}
                    <span className="text-xs text-muted-foreground">{stat.trend}</span>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Recent Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          {transactionsLoading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : !recentTransactions || recentTransactions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="p-3 rounded-full bg-muted mb-4">
                <History className="w-6 h-6 text-muted-foreground" />
              </div>
              <p className="text-sm font-medium">No transactions yet</p>
              <p className="text-xs text-muted-foreground mt-1">
                Start recording daily savings to see transactions here
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Member</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead>Payment Method</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentTransactions.slice(0, 10).map((transaction) => (
                    <TableRow key={transaction.id} data-testid={`row-transaction-${transaction.id}`}>
                      <TableCell className="text-sm">
                        {format(new Date(transaction.date), "MMM dd, yyyy")}
                      </TableCell>
                      <TableCell className="font-medium">{transaction.member?.name || "Unknown"}</TableCell>
                      <TableCell>
                        <Badge variant={transaction.type === "savings" ? "default" : "secondary"}>
                          {transaction.type}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right tabular-nums font-medium">
                        ₦{parseFloat(transaction.amount).toFixed(2)}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {transaction.paymentMethod || "N/A"}
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
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
