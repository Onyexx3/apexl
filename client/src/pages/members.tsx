import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Plus, Search, Edit, Trash2, Eye, TrendingUp, Checkbox, MoreVertical } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { MemberDialog } from "@/components/member-dialog";
import type { Member } from "@shared/schema";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, invalidateAllQueries } from "@/lib/queryClient";
import { Link } from "wouter";

interface PaginatedMembers {
  data: Member[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export default function Members() {
  const [searchQuery, setSearchQuery] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [memberToDelete, setMemberToDelete] = useState<Member | null>(null);
  const [page, setPage] = useState(1);
  const [selectedMemberIds, setSelectedMemberIds] = useState<Set<string>>(new Set());
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const { toast } = useToast();

  const { data: response, isLoading } = useQuery<PaginatedMembers>({
    queryKey: ["/api/members", page, searchQuery],
    queryFn: async () => {
      const res = await fetch(`/api/members?page=${page}&limit=10&search=${encodeURIComponent(searchQuery)}`);
      return res.json();
    },
  });

  const members = response?.data || [];

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("DELETE", `/api/members/${id}`, {});
    },
    onSuccess: () => {
      invalidateAllQueries();
      toast({
        title: "Member deleted",
        description: "Member has been removed from the system.",
      });
      setDeleteDialogOpen(false);
      setMemberToDelete(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete member.",
        variant: "destructive",
      });
    },
  });

  const bulkDeleteMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      return Promise.all(ids.map(id => apiRequest("DELETE", `/api/members/${id}`, {})));
    },
    onSuccess: () => {
      invalidateAllQueries();
      const count = selectedMemberIds.size;
      toast({
        title: "Members deleted",
        description: `${count} member${count > 1 ? 's' : ''} have been removed from the system.`,
      });
      setSelectedMemberIds(new Set());
      setBulkDeleteOpen(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete members.",
        variant: "destructive",
      });
    },
  });

  const bulkStatusMutation = useMutation({
    mutationFn: async ({ ids, status }: { ids: string[]; status: string }) => {
      return Promise.all(
        ids.map(id => apiRequest("PATCH", `/api/members/${id}`, { status }))
      );
    },
    onSuccess: () => {
      invalidateAllQueries();
      const count = selectedMemberIds.size;
      toast({
        title: "Status updated",
        description: `${count} member${count > 1 ? 's' : ''} status has been updated.`,
      });
      setSelectedMemberIds(new Set());
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update members.",
        variant: "destructive",
      });
    },
  });

  const handleAddMember = () => {
    setSelectedMember(null);
    setDialogOpen(true);
  };

  const handleEditMember = (member: Member) => {
    setSelectedMember(member);
    setDialogOpen(true);
  };

  const handleDeleteClick = (member: Member) => {
    setMemberToDelete(member);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (memberToDelete) {
      deleteMutation.mutate(memberToDelete.id);
    }
  };

  const toggleMemberSelection = (memberId: string) => {
    const newSelected = new Set(selectedMemberIds);
    if (newSelected.has(memberId)) {
      newSelected.delete(memberId);
    } else {
      newSelected.add(memberId);
    }
    setSelectedMemberIds(newSelected);
  };

  const toggleSelectAll = () => {
    if (selectedMemberIds.size === filteredMembers.length) {
      setSelectedMemberIds(new Set());
    } else {
      setSelectedMemberIds(new Set(filteredMembers.map(m => m.id)));
    }
  };

  const handleBulkDelete = () => {
    setBulkDeleteOpen(true);
  };

  const handleBulkDeleteConfirm = () => {
    bulkDeleteMutation.mutate(Array.from(selectedMemberIds));
  };

  const handleBulkStatusChange = (status: string) => {
    bulkStatusMutation.mutate({ ids: Array.from(selectedMemberIds), status });
  };

  // Search is applied server-side (see the /api/members query above), scoped
  // to whatever this user's role can already see.
  const filteredMembers = members;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold" data-testid="text-page-title">Members</h1>
          <p className="text-sm text-muted-foreground">Manage ApexL Investment members</p>
        </div>
        <Button onClick={handleAddMember} data-testid="button-add-member">
          <Plus className="w-4 h-4 mr-2" />
          Add Member
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <CardTitle className="text-lg">All Members</CardTitle>
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search members..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setPage(1);
                }}
                className="pl-9"
                data-testid="input-search-members"
              />
            </div>
          </div>
        </CardHeader>
        {selectedMemberIds.size > 0 && (
          <div className="px-6 py-3 border-b bg-muted/50 flex items-center justify-between">
            <div className="text-sm font-medium">
              {selectedMemberIds.size} member{selectedMemberIds.size > 1 ? 's' : ''} selected
            </div>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  const activeCount = Array.from(selectedMemberIds).filter(
                    id => members.find(m => m.id === id)?.status === "inactive"
                  ).length;
                  handleBulkStatusChange(activeCount > 0 ? "active" : "inactive");
                }}
                data-testid="button-bulk-status"
              >
                {Array.from(selectedMemberIds).some(
                  id => members.find(m => m.id === id)?.status === "inactive"
                )
                  ? "Activate"
                  : "Deactivate"}
              </Button>
              <Button
                size="sm"
                variant="destructive"
                onClick={handleBulkDelete}
                data-testid="button-bulk-delete"
              >
                Delete
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setSelectedMemberIds(new Set())}
                data-testid="button-clear-selection"
              >
                Clear
              </Button>
            </div>
          </div>
        )}
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : !filteredMembers || filteredMembers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="p-3 rounded-full bg-muted mb-4">
                <Search className="w-6 h-6 text-muted-foreground" />
              </div>
              <p className="text-sm font-medium">
                {searchQuery ? "No members found" : "No members yet"}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {searchQuery
                  ? "Try adjusting your search query"
                  : "Add your first member to get started"}
              </p>
              {!searchQuery && (
                <Button onClick={handleAddMember} className="mt-4" data-testid="button-add-first-member">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Member
                </Button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <input
                        type="checkbox"
                        checked={selectedMemberIds.size === filteredMembers.length && filteredMembers.length > 0}
                        onChange={toggleSelectAll}
                        className="rounded border-input"
                        data-testid="checkbox-select-all"
                      />
                    </TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Join Date</TableHead>
                    <TableHead className="text-right">Balance</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredMembers.map((member) => (
                    <TableRow key={member.id} data-testid={`row-member-${member.id}`} className={selectedMemberIds.has(member.id) ? "bg-muted/50" : ""}>
                      <TableCell className="w-12">
                        <input
                          type="checkbox"
                          checked={selectedMemberIds.has(member.id)}
                          onChange={() => toggleMemberSelection(member.id)}
                          className="rounded border-input"
                          data-testid={`checkbox-member-${member.id}`}
                        />
                      </TableCell>
                      <TableCell className="font-medium">{member.name}</TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {member.email && <div>{member.email}</div>}
                          {member.phone && (
                            <div className="text-muted-foreground">{member.phone}</div>
                          )}
                          {!member.email && !member.phone && (
                            <span className="text-muted-foreground">N/A</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">
                        {format(new Date(member.joinDate), "MMM dd, yyyy")}
                      </TableCell>
                      <TableCell className="text-right tabular-nums font-medium">
                        ₦{parseFloat(member.walletBalance).toFixed(2)}
                      </TableCell>
                      <TableCell>
                        <Badge variant={member.status === "active" ? "default" : "secondary"}>
                          {member.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              data-testid={`button-menu-${member.id}`}
                            >
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem asChild data-testid={`menu-view-${member.id}`}>
                              <Link href={`/members/${member.id}`}>
                                <Eye className="w-4 h-4 mr-2" />
                                View Details
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild data-testid={`menu-plans-${member.id}`}>
                              <Link href={`/members/${member.id}/plans`}>
                                <TrendingUp className="w-4 h-4 mr-2" />
                                Manage Plans
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleEditMember(member)}
                              data-testid={`menu-edit-${member.id}`}
                            >
                              <Edit className="w-4 h-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => handleDeleteClick(member)}
                              className="text-destructive focus:text-destructive"
                              data-testid={`menu-delete-${member.id}`}
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
          {response && response.totalPages > 1 && (
            <Pagination
              currentPage={page}
              totalPages={response.totalPages}
              onPageChange={setPage}
            />
          )}
        </CardContent>
      </Card>

      <MemberDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        member={selectedMember}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Member</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong>{memberToDelete?.name}</strong>? This action
              cannot be undone and will also delete all associated transactions.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMutation.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={bulkDeleteOpen} onOpenChange={setBulkDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Members</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong>{selectedMemberIds.size} member{selectedMemberIds.size > 1 ? 's' : ''}</strong>? 
              This action cannot be undone and will also delete all associated transactions.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBulkDeleteConfirm}
              disabled={bulkDeleteMutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {bulkDeleteMutation.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
