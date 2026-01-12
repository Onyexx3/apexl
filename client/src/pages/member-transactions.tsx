import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRoute, Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ArrowLeft, Download } from "lucide-react";
import type { MemberWithTransactions, Transaction } from "@shared/schema";
import { format } from "date-fns";

export default function MemberTransactions() {
  const [, params] = useRoute("/members/:memberId/transactions");
  const memberId = params?.memberId;

  const { data: member, isLoading: memberLoading } = useQuery<MemberWithTransactions>({
    queryKey: ["/api/members", memberId],
    enabled: !!memberId,
  });

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

  const transactions = member.transactions || [];
  const exportCSV = () => {
    const headers = ["Date", "Type", "Amount", "Payment Method", "Status"];
    const rows = transactions.map(t => [
      format(new Date(t.date), "MMM dd, yyyy"),
      t.type,
      parseFloat(t.amount).toFixed(2),
      t.paymentMethod || "N/A",
      t.status,
    ]);

    const csv = [headers, ...rows].map(row => row.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${member.name}-transactions-${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild data-testid="button-back">
            <Link href={`/members/${memberId}`}>
              <ArrowLeft className="w-4 h-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-semibold" data-testid="text-page-title">
              {member.name}'s Transactions
            </h1>
            <p className="text-sm text-muted-foreground">All transaction history</p>
          </div>
        </div>
        <Button onClick={exportCSV} variant="outline" data-testid="button-export">
          <Download className="w-4 h-4 mr-2" />
          Export CSV
        </Button>
      </div>

      <Card>
        <CardContent className="pt-6">
          {transactions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <p className="text-sm text-muted-foreground">No transactions yet</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead>Payment Method</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions
                    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                    .map((transaction) => (
                      <TableRow key={transaction.id} data-testid={`row-transaction-${transaction.id}`}>
                        <TableCell className="text-sm">
                          {format(new Date(transaction.date), "MMM dd, yyyy")}
                        </TableCell>
                        <TableCell>
                          <Badge variant={transaction.type === "savings" ? "default" : "secondary"}>
                            {transaction.type}
                          </Badge>
                        </TableCell>
                        <TableCell
                          className={`text-right tabular-nums font-medium ${
                            transaction.type === "payout" ? "text-destructive" : "text-primary"
                          }`}
                        >
                          {transaction.type === "payout" ? "-" : "+"}₦
                          {parseFloat(transaction.amount).toFixed(2)}
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
