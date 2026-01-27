import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
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
import { useToast } from "@/hooks/use-toast";
import { insertMemberSchema, type InsertMember, type Member, type Staff } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { PlanForm } from "./plan-form";
import { Calculator } from "lucide-react";

interface MemberDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  member?: Member | null;
}

export function MemberDialog({ open, onOpenChange, member }: MemberDialogProps) {
  const { toast } = useToast();
  const isEdit = !!member;
  const [showPlanForm, setShowPlanForm] = useState(false);
  const [createdMemberId, setCreatedMemberId] = useState<string | null>(null);

  const { data: allStaff } = useQuery<Staff[]>({
    queryKey: ["/api/staff/all"],
    queryFn: async () => {
      const response = await fetch("/api/staff/all");
      if (!response.ok) throw new Error("Failed to fetch staff");
      return response.json();
    },
  });

  const form = useForm<InsertMember>({
    resolver: zodResolver(insertMemberSchema),
    defaultValues: {
      name: member?.name || "",
      email: member?.email || "",
      phone: member?.phone || "",
      address: member?.address || "",
      status: (member?.status as "active" | "inactive") || "active",
      staffId: member?.staffId || undefined,
    },
  });

  const mutation = useMutation({
    mutationFn: async (data: InsertMember) => {
      if (isEdit && member) {
        return apiRequest("PUT", `/api/members/${member.id}`, data);
      }
      const response = await apiRequest("POST", "/api/members", data);
      return response;
    },
    onSuccess: (response: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/members"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      
      if (!isEdit && response?.id) {
        setCreatedMemberId(response.id);
        setShowPlanForm(true);
        toast({
          title: "Member added",
          description: "New member has been added successfully. You can now create a savings/investment plan.",
        });
      } else {
        toast({
          title: isEdit ? "Member updated" : "Member added",
          description: isEdit
            ? "Member information has been updated successfully."
            : "New member has been added successfully.",
        });
        onOpenChange(false);
        form.reset();
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to save member. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: InsertMember) => {
    mutation.mutate(data);
  };

  const handlePlanCreated = (planData: any) => {
    toast({
      title: "Plan created",
      description: "Savings/Investment plan has been created successfully.",
    });
    setTimeout(() => {
      onOpenChange(false);
      form.reset();
      setShowPlanForm(false);
      setCreatedMemberId(null);
    }, 2000);
  };

  const handleSkipPlan = () => {
    onOpenChange(false);
    form.reset();
    setShowPlanForm(false);
    setCreatedMemberId(null);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {showPlanForm ? "Create Savings/Investment Plan" : isEdit ? "Edit Member" : "Add New Member"}
          </DialogTitle>
          <DialogDescription>
            {showPlanForm
              ? "Create a savings or investment plan for the new member. The plan will be automatically linked to their account."
              : isEdit
              ? "Update member information and status."
              : "Enter the details of the new member to add them to the system."}
          </DialogDescription>
        </DialogHeader>

        {!showPlanForm ? (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full Name *</FormLabel>
                    <FormControl>
                      <Input placeholder="John Doe" {...field} data-testid="input-member-name" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="john@example.com" {...field} data-testid="input-member-email" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone</FormLabel>
                      <FormControl>
                        <Input placeholder="+234 800 000 0000" {...field} data-testid="input-member-phone" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Address</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Enter member address" rows={2} {...field} data-testid="input-member-address" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-member-status">
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="active">Active</SelectItem>
                          <SelectItem value="inactive">Inactive</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="staffId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Assigned Staff</FormLabel>
                      <Select 
                        onValueChange={(value) => field.onChange(value === "none" ? null : value)} 
                        defaultValue={field.value || "none"}
                      >
                        <FormControl>
                          <SelectTrigger data-testid="select-member-staff">
                            <SelectValue placeholder="Select staff" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="none">No Staff Assigned</SelectItem>
                          {allStaff?.filter(s => s.status === "active").map((staff) => (
                            <SelectItem key={staff.id} value={staff.id}>
                              {staff.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  disabled={mutation.isPending}
                  data-testid="button-cancel-member"
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={mutation.isPending} data-testid="button-submit-member">
                  {mutation.isPending ? "Saving..." : isEdit ? "Update Member" : "Add Member"}
                </Button>
              </div>
            </form>
          </Form>
        ) : (
          <div className="space-y-4">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Calculator className="w-5 h-5 text-green-600" />
                <h3 className="font-semibold text-green-800">Member Created Successfully!</h3>
              </div>
              <p className="text-sm text-green-700">
                You can now create a savings or investment plan for this member. This step is optional - you can skip it and create plans later.
              </p>
            </div>
            
            <PlanForm 
              memberId={createdMemberId || undefined} 
              onPlanCreated={handlePlanCreated}
            />
            
            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={handleSkipPlan}
              >
                Skip Plan Creation
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
