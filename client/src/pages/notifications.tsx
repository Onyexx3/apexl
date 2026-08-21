import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Pagination } from "@/components/pagination";
import {
  AlertCircle,
  CheckCircle,
  Clock,
  Gift,
  Trash2,
} from "lucide-react";
import type { Notification } from "@shared/schema";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, invalidateAllQueries } from "@/lib/queryClient";

interface PaginatedNotifications {
  data: Notification[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export default function Notifications() {
  const { toast } = useToast();
  const [page, setPage] = useState(1);

  const { data: response, isLoading } = useQuery<PaginatedNotifications>({
    queryKey: ["/api/notifications", page],
    queryFn: async () => {
      const res = await fetch(`/api/notifications?page=${page}&limit=10`);
      return res.json();
    },
  });

  const notifications = response?.data || [];

  const markAsReadMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("PATCH", `/api/notifications/${id}/read`, {});
    },
    onSuccess: () => {
      invalidateAllQueries();
    },
  });

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "pending_payout":
        return <AlertCircle className="w-5 h-5 text-amber-500" />;
      case "payout_approved":
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case "plan_completed":
        return <Gift className="w-5 h-5 text-blue-500" />;
      case "reminder":
        return <Clock className="w-5 h-5 text-slate-500" />;
      default:
        return <AlertCircle className="w-5 h-5" />;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case "pending_payout":
        return "Pending Payout";
      case "payout_approved":
        return "Payout Approved";
      case "plan_completed":
        return "Plan Completed";
      case "reminder":
        return "Reminder";
      default:
        return type;
    }
  };

  const unreadCount = notifications?.filter(n => n.read === "false").length || 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold" data-testid="text-page-title">
          Notifications
        </h1>
        <p className="text-sm text-muted-foreground">
          {unreadCount > 0 ? `${unreadCount} unread notifications` : "All caught up"}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-16" />
              ))}
            </div>
          ) : !notifications || notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <CheckCircle className="w-8 h-8 text-muted-foreground mb-2" />
              <p className="text-sm font-medium">No notifications</p>
              <p className="text-xs text-muted-foreground mt-1">You're all set</p>
            </div>
          ) : (
            <div className="space-y-3">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`flex items-start gap-4 p-4 border rounded-lg transition-colors ${
                    notification.read === "false"
                      ? "bg-primary/5 border-primary/20"
                      : "bg-muted/30 border-muted"
                  }`}
                  data-testid={`notification-${notification.id}`}
                >
                  <div className="flex-shrink-0 mt-1">
                    {getTypeIcon(notification.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-sm">{notification.title}</p>
                        <Badge variant="outline" className="text-xs">
                          {getTypeLabel(notification.type)}
                        </Badge>
                      </div>
                      {notification.read === "false" && (
                        <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0 mt-1" />
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">
                      {notification.message}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(notification.createdAt), "MMM dd, yyyy 'at' h:mm a")}
                    </p>
                  </div>
                  {notification.read === "false" && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => markAsReadMutation.mutate(notification.id)}
                      disabled={markAsReadMutation.isPending}
                      data-testid={`button-mark-read-${notification.id}`}
                    >
                      <CheckCircle className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
          {!isLoading && notifications.length > 0 && response && (
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
