import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Pagination } from "@/components/pagination";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, Filter, Download, FileText } from "lucide-react";
import type { TransactionWithMember } from "@shared/schema";
import { format } from "date-fns";

interface PaginatedTransactions {
  data: TransactionWithMember[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export default function Transactions() {
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [page, setPage] = useState(1);

  const { data: response, isLoading } = useQuery<PaginatedTransactions>({
    queryKey: ["/api/transactions", page, searchQuery],
    queryFn: async () => {
      const res = await fetch(`/api/transactions?page=${page}&limit=10&search=${encodeURIComponent(searchQuery)}`);
      return res.json();
    },
  });

  const transactions = response?.data || [];

  // Member-name search is applied server-side (scoped to this user's role); type/status
  // remain client-side filters on the loaded page.
  const filteredTransactions = transactions?.filter((transaction) => {
    const matchesType = typeFilter === "all" || transaction.type === typeFilter;
    const matchesStatus = statusFilter === "all" || transaction.status === statusFilter;
    return matchesType && matchesStatus;
  });

  const clearFilters = () => {
    setSearchQuery("");
    setTypeFilter("all");
    setStatusFilter("all");
    setPage(1);
  };

  const downloadReceipt = (transactionId: string) => {
    window.open(`/api/transactions/${transactionId}/receipt`, "_blank");
  };

  const exportToExcel = () => {
    window.location.href = "/api/transactions/export/excel";
  };

  const toggleSelectTransaction = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredTransactions?.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredTransactions?.map(t => t.id) || []));
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold" data-testid="text-page-title">Transaction History</h1>
        <p className="text-sm text-muted-foreground">View all savings and payout transactions</p>
      </div>

      <Card>
        <CardHeader>
          <div className="space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-muted-foreground" />
                <CardTitle className="text-lg">Filters</CardTitle>
              </div>
              <div className="flex items-center gap-2">
                {selectedIds.size > 0 && (
                  <span className="text-sm text-muted-foreground" data-testid="text-selected-count">
                    {selectedIds.size} selected
                  </span>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={exportToExcel}
                  data-testid="button-export-excel"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Export to Excel
                </Button>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search by member..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setPage(1);
                  }}
                  className="pl-9"
                  data-testid="input-search-transactions"
                />
              </div>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger data-testid="select-type-filter">
                  <SelectValue placeholder="Transaction Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="savings">Savings</SelectItem>
                  <SelectItem value="payout">Payout</SelectItem>
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger data-testid="select-status-filter">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {(searchQuery || typeFilter !== "all" || statusFilter !== "all") && (
              <Button
                variant="outline"
                size="sm"
                onClick={clearFilters}
                data-testid="button-clear-filters"
              >
                Clear Filters
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[...Array(8)].map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : !filteredTransactions || filteredTransactions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="p-3 rounded-full bg-muted mb-4">
                <Search className="w-6 h-6 text-muted-foreground" />
              </div>
              <p className="text-sm font-medium">No transactions found</p>
              <p className="text-xs text-muted-foreground mt-1">
                {searchQuery || typeFilter !== "all" || statusFilter !== "all"
                  ? "Try adjusting your filters"
                  : "Transactions will appear here once recorded"}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <Checkbox
                        checked={selectedIds.size === filteredTransactions?.length && filteredTransactions?.length > 0}
                        onCheckedChange={toggleSelectAll}
                        data-testid="checkbox-select-all"
                      />
                    </TableHead>
                    <TableHead>Date & Time</TableHead>
                    <TableHead>Member</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead>Payment Method</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Notes</TableHead>
                    <TableHead>Receipt</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTransactions.map((transaction) => (
                    <TableRow key={transaction.id} data-testid={`row-transaction-${transaction.id}`}>
                      <TableCell className="w-12">
                        <Checkbox
                          checked={selectedIds.has(transaction.id)}
                          onCheckedChange={() => toggleSelectTransaction(transaction.id)}
                          data-testid={`checkbox-select-${transaction.id}`}
                        />
                      </TableCell>
                      <TableCell className="text-sm">
                        <div>{format(new Date(transaction.date), "MMM dd, yyyy")}</div>
                        <div className="text-xs text-muted-foreground">
                          {format(new Date(transaction.createdAt), "h:mm a")}
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">
                        {transaction.member?.name || "Unknown"}
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
                      <TableCell className="text-sm max-w-xs truncate">
                        {transaction.notes || "-"}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => downloadReceipt(transaction.id)}
                          data-testid={`button-download-receipt-${transaction.id}`}
                        >
                          <FileText className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
          {!isLoading && filteredTransactions.length > 0 && response && (
            <Pagination
              currentPage={response.page}
              totalPages={response.totalPages}
              onPageChange={setPage}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
