import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { invalidateAllQueries } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Plus, Pencil, Trash2, TrendingUp, Info } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import type { InvestmentType } from "@shared/schema";
import { Pagination } from "@/components/pagination";

interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

const CATEGORIES = [
  "Bonds",
  "Gold",
  "Real Estate",
  "Agriculture",
  "Food",
  "Technology",
  "Energy",
  "Fixed Deposit",
  "Other",
];

const PAYMENT_PLANS = [
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
  { value: "quarterly", label: "Quarterly" },
  { value: "yearly", label: "Yearly" },
  { value: "maturity", label: "At Maturity" },
];

export default function InvestmentTypes() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [page, setPage] = useState(1);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingType, setEditingType] = useState<InvestmentType | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    category: "",
    description: "",
    minimumDeposit: "",
    interestRate: "",
    paymentPlan: "monthly" as string,
    durationDays: 30,
    breakFee: "0",
    isBreakable: true,
    status: "active" as "active" | "inactive",
  });

  const { data, isLoading } = useQuery<PaginatedResponse<InvestmentType>>({
    queryKey: ["/api/investment-types", page],
    queryFn: async () => {
      const res = await fetch(`/api/investment-types?page=${page}&limit=10`);
      if (!res.ok) throw new Error("Failed to fetch investment types");
      return res.json();
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const res = await fetch("/api/investment-types", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message);
      }
      return res.json();
    },
    onSuccess: () => {
      invalidateAllQueries();
      toast({ title: "Investment type created successfully" });
      resetForm();
      setIsDialogOpen(false);
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: typeof formData }) => {
      const res = await fetch(`/api/investment-types/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message);
      }
      return res.json();
    },
    onSuccess: () => {
      invalidateAllQueries();
      toast({ title: "Investment type updated successfully" });
      resetForm();
      setIsDialogOpen(false);
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/investment-types/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message);
      }
    },
    onSuccess: () => {
      invalidateAllQueries();
      toast({ title: "Investment type deleted successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const resetForm = () => {
    setFormData({
      name: "",
      category: "",
      description: "",
      minimumDeposit: "",
      interestRate: "",
      paymentPlan: "monthly",
      durationDays: 30,
      breakFee: "0",
      isBreakable: true,
      status: "active",
    });
    setEditingType(null);
  };

  const openEditDialog = (type: InvestmentType) => {
    setEditingType(type);
    setFormData({
      name: type.name,
      category: type.category,
      description: type.description || "",
      minimumDeposit: type.minimumDeposit,
      interestRate: type.interestRate,
      paymentPlan: type.paymentPlan,
      durationDays: type.durationDays,
      breakFee: type.breakFee,
      isBreakable: type.isBreakable,
      status: type.status as "active" | "inactive",
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = () => {
    if (editingType) {
      updateMutation.mutate({ id: editingType.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  if (user?.role !== "admin") {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <h1 className="text-2xl font-bold mb-2">Access Denied</h1>
        <p className="text-muted-foreground">Only administrators can manage investment types.</p>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Investment Types</h1>
          <p className="text-muted-foreground">Create and manage investment products for members</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) resetForm(); }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Investment Type
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingType ? "Edit Investment Type" : "Create Investment Type"}</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Label htmlFor="name">Name</Label>
                    <Tooltip>
                      <TooltipTrigger>
                        <Info className="h-4 w-4 text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>The name of this investment product</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., Gold Investment"
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Label htmlFor="category">Category</Label>
                    <Tooltip>
                      <TooltipTrigger>
                        <Info className="h-4 w-4 text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>The category this investment belongs to</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <Select value={formData.category} onValueChange={(v) => setFormData({ ...formData, category: v })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map((cat) => (
                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Label htmlFor="description">Description</Label>
                  <Tooltip>
                    <TooltipTrigger>
                      <Info className="h-4 w-4 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Detailed description of this investment type</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Describe this investment type..."
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Label htmlFor="minimumDeposit">Minimum Deposit (₦)</Label>
                    <Tooltip>
                      <TooltipTrigger>
                        <Info className="h-4 w-4 text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Minimum amount required to invest</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <Input
                    id="minimumDeposit"
                    type="number"
                    value={formData.minimumDeposit}
                    onChange={(e) => setFormData({ ...formData, minimumDeposit: e.target.value })}
                    placeholder="10000"
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Label htmlFor="interestRate">Interest Rate (%)</Label>
                    <Tooltip>
                      <TooltipTrigger>
                        <Info className="h-4 w-4 text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Annual interest rate for this investment</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <Input
                    id="interestRate"
                    type="number"
                    step="0.01"
                    value={formData.interestRate}
                    onChange={(e) => setFormData({ ...formData, interestRate: e.target.value })}
                    placeholder="15"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Label htmlFor="paymentPlan">Payment Plan</Label>
                    <Tooltip>
                      <TooltipTrigger>
                        <Info className="h-4 w-4 text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>When interest payments are made</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <Select value={formData.paymentPlan} onValueChange={(v) => setFormData({ ...formData, paymentPlan: v })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PAYMENT_PLANS.map((plan) => (
                        <SelectItem key={plan.value} value={plan.value}>{plan.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Label htmlFor="durationDays">Duration (Days)</Label>
                    <Tooltip>
                      <TooltipTrigger>
                        <Info className="h-4 w-4 text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>How long the investment runs</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <Input
                    id="durationDays"
                    type="number"
                    value={formData.durationDays}
                    onChange={(e) => setFormData({ ...formData, durationDays: parseInt(e.target.value) || 30 })}
                    placeholder="90"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Label htmlFor="breakFee">Break Fee (%)</Label>
                    <Tooltip>
                      <TooltipTrigger>
                        <Info className="h-4 w-4 text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Fee charged if investment is broken early</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <Input
                    id="breakFee"
                    type="number"
                    step="0.01"
                    value={formData.breakFee}
                    onChange={(e) => setFormData({ ...formData, breakFee: e.target.value })}
                    placeholder="5"
                  />
                </div>
                <div className="flex items-center space-x-2 pt-6">
                  <Switch
                    id="isBreakable"
                    checked={formData.isBreakable}
                    onCheckedChange={(v) => setFormData({ ...formData, isBreakable: v })}
                  />
                  <div className="flex items-center gap-2">
                    <Label htmlFor="isBreakable">Can be broken early</Label>
                    <Tooltip>
                      <TooltipTrigger>
                        <Info className="h-4 w-4 text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Allow members to break this investment early</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="status"
                  checked={formData.status === "active"}
                  onCheckedChange={(v) => setFormData({ ...formData, status: v ? "active" : "inactive" })}
                />
                <div className="flex items-center gap-2">
                  <Label htmlFor="status">Active</Label>
                  <Tooltip>
                    <TooltipTrigger>
                      <Info className="h-4 w-4 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Whether this investment type is available</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => { setIsDialogOpen(false); resetForm(); }}>
                Cancel
              </Button>
              <Button onClick={handleSubmit} disabled={createMutation.isPending || updateMutation.isPending}>
                {(createMutation.isPending || updateMutation.isPending) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {editingType ? "Update" : "Create"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Investment Products
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center p-8">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Min. Deposit</TableHead>
                    <TableHead>Interest</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead>Payment</TableHead>
                    <TableHead>Breakable</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data?.data.map((type) => (
                    <TableRow key={type.id}>
                      <TableCell className="font-medium">{type.name}</TableCell>
                      <TableCell>{type.category}</TableCell>
                      <TableCell>₦{parseFloat(type.minimumDeposit).toLocaleString()}</TableCell>
                      <TableCell>{type.interestRate}%</TableCell>
                      <TableCell>{type.durationDays} days</TableCell>
                      <TableCell className="capitalize">{type.paymentPlan}</TableCell>
                      <TableCell>
                        {type.isBreakable ? (
                          <Badge variant="secondary">{type.breakFee}% fee</Badge>
                        ) : (
                          <Badge variant="destructive">No</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant={type.status === "active" ? "default" : "secondary"}>
                          {type.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" onClick={() => openEditDialog(type)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            if (confirm("Are you sure you want to delete this investment type?")) {
                              deleteMutation.mutate(type.id);
                            }
                          }}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {data?.data.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                        No investment types found. Create your first one!
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
              {data && data.totalPages > 1 && (
                <div className="mt-4">
                  <Pagination
                    currentPage={page}
                    totalPages={data.totalPages}
                    onPageChange={setPage}
                  />
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
      </div>
    </TooltipProvider>
  );
}
