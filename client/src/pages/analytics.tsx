import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { TrendingUp, Users, Target, DollarSign } from "lucide-react";
import { format, parseISO } from "date-fns";

interface AnalyticsData {
  dailySavings: Array<{ date: string; amount: number; count: number }>;
  memberStats: { activeCount: number; inactiveCount: number; totalWalletBalance: string };
  planStats: { activePlans: number; completedPlans: number; totalAmountLocked: string };
  payoutStats: { completed: string; pending: string; rejected: string };
}

export default function Analytics() {
  const { data: analytics, isLoading } = useQuery<AnalyticsData>({
    queryKey: ["/api/analytics"],
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton className="h-80" />
          <Skeleton className="h-80" />
        </div>
      </div>
    );
  }

  if (!analytics) {
    return <div>No analytics data available</div>;
  }

  const chartData = analytics.dailySavings.map(item => ({
    ...item,
    displayDate: format(parseISO(item.date), "MMM dd"),
  }));

  const memberStatsData = [
    { name: "Active", value: analytics.memberStats.activeCount, fill: "#3b82f6" },
    { name: "Inactive", value: analytics.memberStats.inactiveCount, fill: "#e5e7eb" },
  ];

  const payoutStatsData = [
    { name: "Completed", value: parseFloat(analytics.payoutStats.completed), fill: "#10b981" },
    { name: "Pending", value: parseFloat(analytics.payoutStats.pending), fill: "#f59e0b" },
    { name: "Rejected", value: parseFloat(analytics.payoutStats.rejected), fill: "#ef4444" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold" data-testid="text-page-title">
          Financial Reports & Analytics
        </h1>
        <p className="text-sm text-muted-foreground">
          Comprehensive insights into your ApexL Investment business
        </p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Wallet Balance</CardTitle>
            <DollarSign className="w-4 h-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tabular-nums" data-testid="text-wallet-balance">
              ₦{parseFloat(analytics.memberStats.totalWalletBalance).toLocaleString('en-NG', { minimumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Across all members</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Members</CardTitle>
            <Users className="w-4 h-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-active-members">
              {analytics.memberStats.activeCount}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {analytics.memberStats.inactiveCount} inactive
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Savings Plans</CardTitle>
            <Target className="w-4 h-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-active-plans">
              {analytics.planStats.activePlans}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {analytics.planStats.completedPlans} completed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Amount in Plans</CardTitle>
            <TrendingUp className="w-4 h-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tabular-nums" data-testid="text-locked-amount">
              ₦{parseFloat(analytics.planStats.totalAmountLocked).toLocaleString('en-NG', { minimumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-muted-foreground mt-1">In active plans</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily Savings Trend */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Daily Savings Trend (30 Days)</CardTitle>
          </CardHeader>
          <CardContent>
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="displayDate"
                    stroke="var(--muted-foreground)"
                    style={{ fontSize: "0.75rem" }}
                  />
                  <YAxis stroke="var(--muted-foreground)" style={{ fontSize: "0.75rem" }} />
                  <Tooltip
                    formatter={(value) => `₦${Number(value).toFixed(2)}`}
                    contentStyle={{
                      backgroundColor: "var(--background)",
                      border: "1px solid var(--border)",
                      borderRadius: "0.375rem",
                    }}
                  />
                  <Legend wrapperStyle={{ paddingTop: "1rem" }} />
                  <Line
                    type="monotone"
                    dataKey="amount"
                    stroke="var(--primary)"
                    dot={false}
                    name="Amount (₦)"
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-80 flex items-center justify-center text-muted-foreground">
                No savings data available
              </div>
            )}
          </CardContent>
        </Card>

        {/* Transaction Count by Day */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Transaction Count by Day</CardTitle>
          </CardHeader>
          <CardContent>
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="displayDate"
                    stroke="var(--muted-foreground)"
                    style={{ fontSize: "0.75rem" }}
                  />
                  <YAxis stroke="var(--muted-foreground)" style={{ fontSize: "0.75rem" }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "var(--background)",
                      border: "1px solid var(--border)",
                      borderRadius: "0.375rem",
                    }}
                  />
                  <Legend wrapperStyle={{ paddingTop: "1rem" }} />
                  <Bar dataKey="count" fill="var(--primary)" name="Transactions" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-80 flex items-center justify-center text-muted-foreground">
                No transaction data available
              </div>
            )}
          </CardContent>
        </Card>

        {/* Member Status Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Member Status Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={memberStatsData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {memberStatsData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Payout Status Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Payout Status Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart
                data={payoutStatsData}
                layout="vertical"
                margin={{ top: 5, right: 30, left: 100, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  type="number"
                  stroke="var(--muted-foreground)"
                  style={{ fontSize: "0.75rem" }}
                  tickFormatter={(value) => `₦${value.toFixed(0)}`}
                />
                <YAxis
                  dataKey="name"
                  type="category"
                  stroke="var(--muted-foreground)"
                  style={{ fontSize: "0.75rem" }}
                />
                <Tooltip
                  formatter={(value) => `₦${Number(value).toFixed(2)}`}
                  contentStyle={{
                    backgroundColor: "var(--background)",
                    border: "1px solid var(--border)",
                    borderRadius: "0.375rem",
                  }}
                />
                <Bar dataKey="value" fill="var(--primary)" radius={4}>
                  {payoutStatsData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Completed Payouts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tabular-nums text-green-600" data-testid="text-completed-payouts">
              ₦{parseFloat(analytics.payoutStats.completed).toLocaleString('en-NG', { minimumFractionDigits: 2 })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Pending Payouts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tabular-nums text-amber-600" data-testid="text-pending-payouts">
              ₦{parseFloat(analytics.payoutStats.pending).toLocaleString('en-NG', { minimumFractionDigits: 2 })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Rejected Payouts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tabular-nums text-red-600" data-testid="text-rejected-payouts">
              ₦{parseFloat(analytics.payoutStats.rejected).toLocaleString('en-NG', { minimumFractionDigits: 2 })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
