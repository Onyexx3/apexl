import { useState, useEffect } from "react";
import { Home, Users, DollarSign, History, TrendingUp, BarChart3, Bell, Building2, UserCheck, Banknote, Landmark, PiggyBank, Calendar } from "lucide-react";
import { Link, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { Badge } from "@/components/ui/badge";
import type { Notification } from "@shared/schema";

interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

const menuItems = [
  {
    title: "Dashboard",
    url: "/",
    icon: Home,
    roles: ["admin", "manager", "collector"],
  },
  {
    title: "Members",
    url: "/members",
    icon: Users,
    roles: ["admin", "manager", "collector"],
  },
  {
    title: "Savings Plans",
    url: "/plans",
    icon: TrendingUp,
    roles: ["admin", "manager", "collector"],
  },
  {
    title: "Daily Savings",
    url: "/savings",
    icon: DollarSign,
    roles: ["admin", "manager", "collector"],
  },
  {
    title: "Yearly Savings Plans",
    url: "/yearly-plans",
    icon: Calendar,
    roles: ["admin", "manager", "collector"],
  },
  {
    title: "Yearly Savings",
    url: "/yearly-savings",
    icon: TrendingUp,
    roles: ["admin", "manager", "collector"],
  },
  {
    title: "Payouts",
    url: "/payouts",
    icon: TrendingUp,
    roles: ["admin", "manager", "collector"],
  },
  {
    title: "Transactions",
    url: "/transactions",
    icon: History,
    roles: ["admin", "manager", "collector"],
  },
  {
    title: "Analytics",
    url: "/analytics",
    icon: BarChart3,
    roles: ["admin", "manager"],
  },
  {
    title: "Branches",
    url: "/branches",
    icon: Building2,
    roles: ["admin", "manager"],
  },
  {
    title: "Staff",
    url: "/staff",
    icon: UserCheck,
    roles: ["admin", "manager"],
  },
  {
    title: "Loans",
    url: "/loans",
    icon: Banknote,
    roles: ["admin", "manager", "collector"],
  },
  {
    title: "Investment Types",
    url: "/investment-types",
    icon: Landmark,
    roles: ["admin"],
  },
  {
    title: "Investments",
    url: "/investments",
    icon: PiggyBank,
    roles: ["admin", "manager", "collector"],
  },
  {
    title: "Notifications",
    url: "/notifications",
    icon: Bell,
    roles: ["admin", "manager", "collector"],
  },
];

export function AppSidebar() {
  const [location] = useLocation();
  const [unreadCount, setUnreadCount] = useState(0);
  const { user } = useAuth();

  const { data: notifications } = useQuery<PaginatedResponse<Notification>>({
    queryKey: ["/api/notifications"],
    refetchInterval: 30000,
  });

  useEffect(() => {
    if (notifications?.data) {
      const count = notifications.data.filter(n => n.read === "false").length;
      setUnreadCount(count);
    }
  }, [notifications]);

  const visibleMenuItems = menuItems.filter(item => 
    user && item.roles.includes(user.role)
  );

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

  const initials = user?.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) || "??";

  return (
    <Sidebar>
      <SidebarHeader className="p-6 border-b">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-md bg-primary text-primary-foreground">
            <DollarSign className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-semibold">ApexL Investment</h2>
            <p className="text-xs text-muted-foreground">Staff Portal</p>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Management</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {visibleMenuItems.map((item) => {
                const isActive = location === item.url;
                const showBadge = item.title === "Notifications" && unreadCount > 0;
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild data-active={isActive} data-testid={`link-${item.title.toLowerCase().replace(/\s+/g, '-')}`}>
                      <Link href={item.url} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <item.icon className="w-4 h-4" />
                          <span>{item.title}</span>
                        </div>
                        {showBadge && (
                          <Badge variant="destructive" className="text-xs" data-testid="badge-notifications-unread">
                            {unreadCount}
                          </Badge>
                        )}
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="p-6 border-t">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
            <span className="text-sm font-medium">{initials}</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{user?.name || "Staff"}</p>
            <p className="text-xs text-muted-foreground truncate">{user?.email || user?.username}</p>
          </div>
          <Badge variant={getRoleBadgeVariant(user?.role || "collector")} className="text-xs">
            {user?.role?.charAt(0).toUpperCase() + (user?.role?.slice(1) || "")}
          </Badge>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
