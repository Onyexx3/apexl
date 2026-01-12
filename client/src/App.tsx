import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { AuthProvider, useAuth } from "@/hooks/use-auth";
import { ProtectedRoute } from "@/lib/protected-route";
import Dashboard from "@/pages/dashboard";
import Members from "@/pages/members";
import MemberDetail from "@/pages/member-detail";
import MemberPlans from "@/pages/member-plans";
import MemberTransactions from "@/pages/member-transactions";
import MemberWallet from "@/pages/member-wallet";
import Savings from "@/pages/savings";
import YearlySavings from "@/pages/yearly-savings";
import Payouts from "@/pages/payouts";
import Transactions from "@/pages/transactions";
import SavingsPlans from "@/pages/savings-plans";
import YearlySavingsPlans from "@/pages/yearly-savings-plans";
import PlanDetail from "@/pages/plan-detail";
import Analytics from "@/pages/analytics";
import Notifications from "@/pages/notifications";
import Branches from "@/pages/branches";
import BranchStaff from "@/pages/branch-staff";
import Staff from "@/pages/staff";
import Loans from "@/pages/loans";
import InvestmentTypes from "@/pages/investment-types";
import InvestmentTypeDetail from "@/pages/investment-type-detail";
import Investments from "@/pages/investments";
import InvestmentDetail from "@/pages/investment-detail";
import MemberInvestments from "@/pages/member-investments";
import Login from "@/pages/login";
import NotFound from "@/pages/not-found";
import { Button } from "@/components/ui/button";
import { LogOut, User } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

function UserMenu() {
  const { user, logoutMutation } = useAuth();

  if (!user) return null;

  const initials = user.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

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

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-10 w-10 rounded-full">
          <Avatar className="h-10 w-10">
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{user.name}</p>
            <p className="text-xs leading-none text-muted-foreground">
              {user.email || user.username}
            </p>
            <Badge variant={getRoleBadgeVariant(user.role)} className="w-fit mt-1">
              {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
            </Badge>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => logoutMutation.mutate()}
          disabled={logoutMutation.isPending}
        >
          <LogOut className="mr-2 h-4 w-4" />
          <span>{logoutMutation.isPending ? "Logging out..." : "Log out"}</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();

  if (!user) return null;

  const style = {
    "--sidebar-width": "16rem",
    "--sidebar-width-icon": "3rem",
  };

  return (
    <SidebarProvider style={style as React.CSSProperties}>
      <div className="flex h-screen w-full">
        <AppSidebar />
        <div className="flex flex-col flex-1 overflow-hidden">
          <header className="flex items-center justify-between p-4 border-b bg-background">
            <SidebarTrigger data-testid="button-sidebar-toggle" />
            <UserMenu />
          </header>
          <main className="flex-1 overflow-y-auto">
            <div className="max-w-7xl mx-auto p-6 lg:p-8">{children}</div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}

function AppRoutes() {
  return (
    <Switch>
      <Route path="/login" component={Login} />
      <ProtectedRoute path="/" component={() => (
        <ProtectedLayout><Dashboard /></ProtectedLayout>
      )} />
      <ProtectedRoute path="/members" component={() => (
        <ProtectedLayout><Members /></ProtectedLayout>
      )} />
      <ProtectedRoute path="/members/:id" component={() => (
        <ProtectedLayout><MemberDetail /></ProtectedLayout>
      )} />
      <ProtectedRoute path="/members/:memberId/plans" component={() => (
        <ProtectedLayout><MemberPlans /></ProtectedLayout>
      )} />
      <ProtectedRoute path="/members/:memberId/plans/:planId" component={() => (
        <ProtectedLayout><PlanDetail /></ProtectedLayout>
      )} />
      <ProtectedRoute path="/members/:memberId/transactions" component={() => (
        <ProtectedLayout><MemberTransactions /></ProtectedLayout>
      )} />
      <ProtectedRoute path="/members/:memberId/wallet" component={() => (
        <ProtectedLayout><MemberWallet /></ProtectedLayout>
      )} />
      <ProtectedRoute path="/savings" component={() => (
        <ProtectedLayout><Savings /></ProtectedLayout>
      )} />
      <ProtectedRoute path="/yearly-savings" component={() => (
        <ProtectedLayout><YearlySavings /></ProtectedLayout>
      )} />
      <ProtectedRoute path="/payouts" component={() => (
        <ProtectedLayout><Payouts /></ProtectedLayout>
      )} />
      <ProtectedRoute path="/transactions" component={() => (
        <ProtectedLayout><Transactions /></ProtectedLayout>
      )} />
      <ProtectedRoute path="/plans" component={() => (
        <ProtectedLayout><SavingsPlans /></ProtectedLayout>
      )} />
      <ProtectedRoute path="/yearly-plans" component={() => (
        <ProtectedLayout><YearlySavingsPlans /></ProtectedLayout>
      )} />
      <ProtectedRoute path="/analytics" component={() => (
        <ProtectedLayout><Analytics /></ProtectedLayout>
      )} />
      <ProtectedRoute path="/notifications" component={() => (
        <ProtectedLayout><Notifications /></ProtectedLayout>
      )} />
      <ProtectedRoute path="/branches" roles={["admin", "manager"]} component={() => (
        <ProtectedLayout><Branches /></ProtectedLayout>
      )} />
      <ProtectedRoute path="/branches/:branchId/staff" roles={["admin", "manager"]} component={() => (
        <ProtectedLayout><BranchStaff /></ProtectedLayout>
      )} />
      <ProtectedRoute path="/staff" roles={["admin", "manager"]} component={() => (
        <ProtectedLayout><Staff /></ProtectedLayout>
      )} />
      <ProtectedRoute path="/loans" component={() => (
        <ProtectedLayout><Loans /></ProtectedLayout>
      )} />
      <ProtectedRoute path="/investment-types" roles={["admin"]} component={() => (
        <ProtectedLayout><InvestmentTypes /></ProtectedLayout>
      )} />
      <ProtectedRoute path="/investment-types/:id" roles={["admin"]} component={() => (
        <ProtectedLayout><InvestmentTypeDetail /></ProtectedLayout>
      )} />
      <ProtectedRoute path="/investments" component={() => (
        <ProtectedLayout><Investments /></ProtectedLayout>
      )} />
      <ProtectedRoute path="/investments/:id" component={() => (
        <ProtectedLayout><InvestmentDetail /></ProtectedLayout>
      )} />
      <ProtectedRoute path="/members/:memberId/investments" component={() => (
        <ProtectedLayout><MemberInvestments /></ProtectedLayout>
      )} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <AppRoutes />
          <Toaster />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
