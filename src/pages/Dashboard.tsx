import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import Layout from "@/components/Layout";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import {
  FileText,
  Receipt,
  Bell,
  ArrowRight,
  TrendingUp,
  Shield,
  Clock,
  Sparkles,
  ChevronRight,
  Upload,
  Calendar
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

import { useDocuments } from "@/integrations/supabase/hooks/useDocuments";
import { useBills } from "@/integrations/supabase/hooks/useBills";
import { DashboardSkeleton } from "@/components/dashboard/DashboardSkeleton";

const Dashboard = () => {
  const navigate = useNavigate();

  // Use cached data hooks
  const { data: documentsData, isLoading: docsLoading } = useDocuments();
  const { data: billsData, isLoading: billsLoading } = useBills();

  // Calculate totals from cached data
  const documentCount = documentsData?.pages?.reduce((acc, page) => acc + page.length, 0) || 0;
  const billCount = billsData?.length || 0;

  // Let Layout.tsx handle the session monitoring, we just get the current user for display
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
    });
  }, []);

  if (docsLoading || billsLoading) {
    return (
      <Layout>
        <DashboardSkeleton />
      </Layout>
    );
  }

  const userName = user?.user_metadata?.full_name?.split(" ")[0] || user?.email?.split("@")[0] || "User";
  const greeting = new Date().getHours() < 12 ? "Good morning" : new Date().getHours() < 18 ? "Good afternoon" : "Good evening";

  return (
    <Layout>
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Hero Header with Gradient */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-primary via-emerald-500 to-teal-500 p-8 text-white shadow-xl">
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 right-0 w-96 h-96 bg-white rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-white rounded-full blur-3xl transform -translate-x-1/2 translate-y-1/2" />
          </div>

          <div className="relative">
            <div className="flex justify-between items-start">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="h-5 w-5 text-yellow-300 animate-pulse" />
                  <span className="text-sm font-medium text-white/90">{greeting}</span>
                </div>
                <h1 className="text-3xl md:text-4xl font-bold mb-2">
                  Welcome back, {userName}! 👋
                </h1>
                <p className="text-white/80 max-w-xl">
                  Your digital document vault is secure and ready. Manage your important documents and track bills all in one place.
                </p>
              </div>

              <Avatar className="h-16 w-16 border-2 border-white/20 shadow-lg shrink-0">
                <AvatarImage src={user?.user_metadata?.avatar_url} alt={userName} />
                <AvatarFallback className="bg-white/10 text-white text-xl font-bold backdrop-blur-sm">
                  {userName.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
            </div>

            {/* Quick Stats Mini */}
            <div className="flex flex-wrap gap-6 mt-6">
              <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-full px-4 py-2">
                <Shield className="h-4 w-4" />
                <span className="text-sm font-medium">256-bit Secured</span>
              </div>
              <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-full px-4 py-2">
                <TrendingUp className="h-4 w-4" />
                <span className="text-sm font-medium">{documentCount + billCount} Total Items</span>
              </div>
              <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-full px-4 py-2">
                <Clock className="h-4 w-4" />
                <span className="text-sm font-medium">
                  Last sync: {user?.last_sign_in_at
                    ? formatDistanceToNow(new Date(user.last_sign_in_at), { addSuffix: true })
                    : "Just now"}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Cards with Enhanced Design */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Documents Card */}
          <div
            onClick={() => navigate("/documents")}
            className="group relative overflow-hidden rounded-2xl bg-card border border-border p-6 cursor-pointer hover:shadow-xl hover:shadow-primary/5 transition-all duration-300 hover:-translate-y-1"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-500/10 to-cyan-500/10 rounded-full blur-2xl transform translate-x-8 -translate-y-8 group-hover:scale-150 transition-transform duration-500" />
            <div className="relative">
              <div className="flex items-start justify-between mb-4">
                <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 shadow-lg shadow-blue-500/20">
                  <FileText className="h-6 w-6 text-white" />
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
              </div>
              <h3 className="text-4xl font-bold text-foreground mb-1">{documentCount}</h3>
              <p className="text-muted-foreground font-medium">Documents</p>
              <div className="mt-4 h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full transition-all duration-1000"
                  style={{ width: `${Math.min(documentCount * 10, 100)}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground mt-2">Storage usage</p>
            </div>
          </div>

          {/* Bills Card */}
          <div
            onClick={() => navigate("/bills")}
            className="group relative overflow-hidden rounded-2xl bg-card border border-border p-6 cursor-pointer hover:shadow-xl hover:shadow-primary/5 transition-all duration-300 hover:-translate-y-1"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-amber-500/10 to-orange-500/10 rounded-full blur-2xl transform translate-x-8 -translate-y-8 group-hover:scale-150 transition-transform duration-500" />
            <div className="relative">
              <div className="flex items-start justify-between mb-4">
                <div className="p-3 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 shadow-lg shadow-amber-500/20">
                  <Receipt className="h-6 w-6 text-white" />
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
              </div>
              <h3 className="text-4xl font-bold text-foreground mb-1">{billCount}</h3>
              <p className="text-muted-foreground font-medium">Active Bills</p>
              <div className="mt-4 h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-amber-500 to-orange-500 rounded-full transition-all duration-1000"
                  style={{ width: `${Math.min(billCount * 20, 100)}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground mt-2">Tracking progress</p>
            </div>
          </div>

          {/* Notifications Card */}
          <div
            onClick={() => navigate("/notifications")}
            className="group relative overflow-hidden rounded-2xl bg-card border border-border p-6 cursor-pointer hover:shadow-xl hover:shadow-primary/5 transition-all duration-300 hover:-translate-y-1"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-violet-500/10 to-purple-500/10 rounded-full blur-2xl transform translate-x-8 -translate-y-8 group-hover:scale-150 transition-transform duration-500" />
            <div className="relative">
              <div className="flex items-start justify-between mb-4">
                <div className="p-3 rounded-xl bg-gradient-to-br from-violet-500 to-purple-500 shadow-lg shadow-violet-500/20">
                  <Bell className="h-6 w-6 text-white" />
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
              </div>
              <h3 className="text-4xl font-bold text-foreground mb-1">0</h3>
              <p className="text-muted-foreground font-medium">Notifications</p>
              <div className="mt-4 flex items-center gap-2">
                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                  ✓ All caught up
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions Section */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-foreground">Quick Actions</h2>
            <span className="text-sm text-muted-foreground">Get started quickly</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Upload Documents Card */}
            <div
              onClick={() => navigate("/documents")}
              className="group relative overflow-hidden rounded-2xl border border-border bg-card p-6 cursor-pointer hover:border-primary/50 transition-all duration-300"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <div className="relative flex items-start gap-4">
                <div className="p-4 rounded-2xl bg-gradient-to-br from-primary/10 to-emerald-500/10 group-hover:from-primary/20 group-hover:to-emerald-500/20 transition-colors">
                  <Upload className="h-8 w-8 text-primary" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-foreground group-hover:text-primary transition-colors">
                      Upload Documents
                    </h3>
                    <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                  </div>
                  <p className="text-muted-foreground mt-1">
                    Store your Aadhaar, PAN, certificates and more securely in your digital vault.
                  </p>
                  <div className="flex flex-wrap gap-2 mt-3">
                    <span className="text-xs px-2 py-1 rounded-md bg-muted text-muted-foreground">Aadhaar</span>
                    <span className="text-xs px-2 py-1 rounded-md bg-muted text-muted-foreground">PAN Card</span>
                    <span className="text-xs px-2 py-1 rounded-md bg-muted text-muted-foreground">Certificates</span>
                    <span className="text-xs px-2 py-1 rounded-md bg-primary/10 text-primary">+5 more</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Track Bills Card */}
            <div
              onClick={() => navigate("/bills")}
              className="group relative overflow-hidden rounded-2xl border border-border bg-card p-6 cursor-pointer hover:border-primary/50 transition-all duration-300"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-amber-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <div className="relative flex items-start gap-4">
                <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-500/10 to-orange-500/10 group-hover:from-amber-500/20 group-hover:to-orange-500/20 transition-colors">
                  <Calendar className="h-8 w-8 text-amber-500" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-foreground group-hover:text-amber-500 transition-colors">
                      Track Bills
                    </h3>
                    <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-amber-500 group-hover:translate-x-1 transition-all" />
                  </div>
                  <p className="text-muted-foreground mt-1">
                    Add your utility bills and never miss a payment with smart reminders.
                  </p>
                  <div className="flex flex-wrap gap-2 mt-3">
                    <span className="text-xs px-2 py-1 rounded-md bg-muted text-muted-foreground">Electricity</span>
                    <span className="text-xs px-2 py-1 rounded-md bg-muted text-muted-foreground">Water</span>
                    <span className="text-xs px-2 py-1 rounded-md bg-muted text-muted-foreground">Internet</span>
                    <span className="text-xs px-2 py-1 rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400">+4 more</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Security Badge */}
        <div className="rounded-2xl border border-border bg-gradient-to-r from-card to-muted/30 p-6">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
            <div className="p-3 rounded-xl bg-gradient-to-br from-primary to-emerald-500">
              <Shield className="h-6 w-6 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-foreground">Your data is protected</h3>
              <p className="text-sm text-muted-foreground">
                All your documents are encrypted with 256-bit AES encryption and stored securely in the cloud.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary">
                🔒 End-to-end encrypted
              </span>
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary">
                ☁️ Cloud backup
              </span>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Dashboard;