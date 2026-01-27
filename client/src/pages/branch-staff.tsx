import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRoute, Link } from "wouter";
import { Plus, Pencil, Trash2, ArrowLeft, Users, UserCheck, Camera, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import type { Branch, Staff, BranchWithStaff } from "@shared/schema";

export default function BranchStaff() {
  const [, params] = useRoute("/branches/:branchId/staff");
  const branchId = params?.branchId;

  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState<Staff | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    username: "",
    password: "",
    profilePhoto: "",
    role: "collector" as "manager" | "collector" | "admin",
    status: "active" as "active" | "inactive",
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: branch, isLoading } = useQuery<BranchWithStaff>({
    queryKey: ["/api/branches", branchId],
    queryFn: async () => {
      const response = await fetch(`/api/branches/${branchId}`);
      if (!response.ok) throw new Error("Failed to fetch branch");
      return response.json();
    },
    enabled: !!branchId,
  });

  // Get current user to check if they're a manager
  const { data: currentUser } = useQuery({
    queryKey: ["/api/user"],
    queryFn: async () => {
      const response = await fetch("/api/user");
      if (!response.ok) return null;
      return response.json();
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData & { branchId: string }) => {
      const response = await fetch("/api/staff", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to create staff");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/branches", branchId] });
      toast({ title: "Staff member added successfully" });
      handleCloseDialog();
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: typeof formData }) => {
      const response = await fetch(`/api/staff/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to update staff");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/branches", branchId] });
      toast({ title: "Staff member updated successfully" });
      handleCloseDialog();
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/staff/${id}`, { method: "DELETE" });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to delete staff");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/branches", branchId] });
      toast({ title: "Staff member deleted successfully" });
      setDeleteDialogOpen(false);
      setSelectedStaff(null);
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const handleOpenDialog = (staff?: Staff) => {
    if (staff) {
      setSelectedStaff(staff);
      setFormData({
        name: staff.name,
        email: staff.email || "",
        phone: staff.phone || "",
        username: staff.username || "",
        password: "",
        profilePhoto: staff.profilePhoto || "",
        role: staff.role as "manager" | "collector" | "admin",
        status: staff.status as "active" | "inactive",
      });
    } else {
      setSelectedStaff(null);
      setFormData({
        name: "",
        email: "",
        phone: "",
        username: "",
        password: "",
        profilePhoto: "",
        role: "collector",
        status: "active",
      });
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setSelectedStaff(null);
    setFormData({
      name: "",
      email: "",
      phone: "",
      username: "",
      password: "",
      profilePhoto: "",
      role: "collector",
      status: "active",
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedStaff) {
      updateMutation.mutate({ id: selectedStaff.id, data: formData });
    } else {
      createMutation.mutate({ ...formData, branchId: branchId! });
    }
  };

  const handleDelete = (staff: Staff) => {
    setSelectedStaff(staff);
    setDeleteDialogOpen(true);
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case "admin":
        return "destructive";
      case "manager":
        return "default";
      default:
        return "secondary";
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!branch) {
    return (
      <div className="p-6">
        <div className="text-center py-8">
          <p className="text-muted-foreground">Branch not found</p>
          <Button asChild className="mt-4">
            <Link href="/branches">Back to Branches</Link>
          </Button>
        </div>
      </div>
    );
  }

  // Check if current user has access to this branch
  if (currentUser?.role === "manager" && currentUser.branchId !== branchId) {
    return (
      <div className="p-6">
        <div className="text-center py-8">
          <p className="text-muted-foreground">You don't have access to this branch</p>
          <Button asChild className="mt-4">
            <Link href="/branches">Back to Branches</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/branches">
            <ArrowLeft className="w-4 h-4" />
          </Link>
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold">{branch.name}</h1>
          <p className="text-muted-foreground flex items-center gap-2">
            <Badge variant="outline">{branch.code}</Badge>
            Staff Management
          </p>
        </div>
        <Button onClick={() => handleOpenDialog()}>
          <Plus className="w-4 h-4 mr-2" />
          Add Staff
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Staff Members
          </CardTitle>
          <CardDescription>
            {branch.staff?.length || 0} staff member(s) in this branch
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {branch.staff?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                    No staff members in this branch. Add your first staff member.
                  </TableCell>
                </TableRow>
              ) : (
                branch.staff?.map((staff) => (
                  <TableRow key={staff.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-3">
                        {staff.profilePhoto ? (
                          <img
                            src={staff.profilePhoto}
                            alt={staff.name}
                            className="w-8 h-8 rounded-full object-cover"
                            onError={(e) => {
                              e.currentTarget.src = "";
                              e.currentTarget.style.display = "none";
                            }}
                          />
                        ) : (
                          <UserCheck className="w-4 h-4 text-muted-foreground" />
                        )}
                        {staff.name}
                      </div>
                    </TableCell>
                    <TableCell>{staff.email || "-"}</TableCell>
                    <TableCell>{staff.phone || "-"}</TableCell>
                    <TableCell>
                      <Badge variant={getRoleBadgeVariant(staff.role)}>
                        {staff.role}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={staff.status === "active" ? "default" : "secondary"}>
                        {staff.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button variant="ghost" size="icon" onClick={() => handleOpenDialog(staff)}>
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(staff)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selectedStaff ? "Edit Staff Member" : "Add Staff Member"}</DialogTitle>
            <DialogDescription>
              {selectedStaff ? "Update staff member details." : "Add a new staff member to this branch."}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="John Doe"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="john@example.com"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+234 800 000 0000"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="username">Username *</Label>
                <Input
                  id="username"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  placeholder="johndoe"
                  required={!selectedStaff}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">
                  Password {!selectedStaff ? "*" : "(leave blank to keep current)"}
                </Label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="Enter password"
                  required={!selectedStaff}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="profilePhoto">Profile Photo</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="profilePhoto"
                    value={formData.profilePhoto}
                    onChange={(e) => setFormData({ ...formData, profilePhoto: e.target.value })}
                    placeholder="https://example.com/photo.jpg"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => {
                      // TODO: Implement file upload
                      toast({ title: "File upload coming soon" });
                    }}
                  >
                    <Upload className="w-4 h-4" />
                  </Button>
                </div>
                {formData.profilePhoto && (
                  <div className="mt-2">
                    <img
                      src={formData.profilePhoto}
                      alt="Profile preview"
                      className="w-16 h-16 rounded-full object-cover"
                      onError={(e) => {
                        e.currentTarget.src = "";
                        e.currentTarget.style.display = "none";
                      }}
                    />
                  </div>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="role">Role</Label>
                <Select
                  value={formData.role}
                  onValueChange={(value: "manager" | "collector" | "admin") =>
                    setFormData({ ...formData, role: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="collector">Field Staff</SelectItem>
                    <SelectItem value="manager">Manager</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value: "active" | "inactive") =>
                    setFormData({ ...formData, status: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleCloseDialog}>
                Cancel
              </Button>
              <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending || (!selectedStaff && (!formData.username || !formData.password))}>
                {createMutation.isPending || updateMutation.isPending ? "Saving..." : "Save"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Staff Member</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{selectedStaff?.name}"? Members assigned to this staff
              will be unassigned. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => selectedStaff && deleteMutation.mutate(selectedStaff.id)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMutation.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
