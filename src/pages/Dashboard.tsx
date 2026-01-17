import { useNavigate } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import Layout from "@/components/Layout";
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
  Calendar,
  AlertCircle
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from "recharts";

import { useUser } from "@/integrations/supabase/hooks/useUser";
import { useDocuments } from "@/integrations/supabase/hooks/useDocuments";
import { useBills } from "@/integrations/supabase/hooks/useBills";
import { DashboardSkeleton } from "@/components/dashboard/DashboardSkeleton";

const Dashboard = () => {
  const navigate = useNavigate();

  // Use centralized user hook
  const { data: user, isLoading: userLoading } = useUser();

  // Use cached data hooks with the user ID
  const { data: documentsData, isLoading: docsLoading } = useDocuments(user?.id);
  const { data: billsData, isLoading: billsLoading } = useBills(user?.id);

  // Calculate totals from cached data
  const documentCount = documentsData?.pages?.reduce((acc, page) => acc + page.length, 0) || 0;
  const billCount = billsData?.length || 0;

  // Process data for charts
  const monthlyStats = billsData ? Object.entries(
    billsData.reduce((acc: any, bill) => {
      const month = new Date(bill.due_date).toLocaleString('default', { month: 'short' });
      acc[month] = (acc[month] || 0) + bill.amount;
      return acc;
    }, {})
  ).map(([name, amount]) => ({ name, amount })) : [];

  const categoryStats = billsData ? Object.entries(
    billsData.reduce((acc: any, bill) => {
      acc[bill.bill_type] = (acc[bill.bill_type] || 0) + 1;
      return acc;
    }, {})
  ).map(([name, value]) => ({ name, value })) : [];

  const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

  const expiringSoon = documentsData?.pages?.flatMap(page => page)
    .filter(doc => doc.expiry_date && new Date(doc.expiry_date) > new Date() &&
      new Date(doc.expiry_date).getTime() - new Date().getTime() < 30 * 24 * 60 * 60 * 1000)
    .sort((a, b) => new Date(a.expiry_date!).getTime() - new Date(b.expiry_date!).getTime())
    .slice(0, 5) || [];

  if (userLoading || docsLoading || billsLoading) {
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

        {/* Analytics Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="overflow-hidden border-border bg-card shadow-lg hover:shadow-xl transition-all duration-300">
            <CardHeader className="border-b border-border bg-muted/30">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-primary" />
                    Spending Trends
                  </CardTitle>
                  <CardDescription>Monthly bill expenditure</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="h-[300px] w-full">
                {monthlyStats.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={monthlyStats}>
                      <defs>
                        <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#888888" opacity={0.1} />
                      <XAxis
                        dataKey="name"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: '#888888', fontSize: 12 }}
                        dy={10}
                      />
                      <YAxis
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: '#888888', fontSize: 12 }}
                        tickFormatter={(value) => `₹${value}`}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'hsl(var(--card))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '12px',
                          boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'
                        }}
                        itemStyle={{ color: '#10b981', fontWeight: 'bold' }}
                      />
                      <Area
                        type="monotone"
                        dataKey="amount"
                        stroke="#10b981"
                        strokeWidth={3}
                        fillOpacity={1}
                        fill="url(#colorAmount)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-muted-foreground">
                    <TrendingUp className="h-12 w-12 opacity-20 mb-2" />
                    <p>No bill data available for trends</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="overflow-hidden border-border bg-card shadow-lg hover:shadow-xl transition-all duration-300">
            <CardHeader className="border-b border-border bg-muted/30">
              <div>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-amber-500" />
                  Bill Distribution
                </CardTitle>
                <CardDescription>Breakdown by category</CardDescription>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="h-[300px] w-full">
                {categoryStats.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={categoryStats}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {categoryStats.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'hsl(var(--card))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '12px'
                        }}
                      />
                      <Legend
                        layout="vertical"
                        align="right"
                        verticalAlign="middle"
                        iconType="circle"
                        formatter={(value) => <span className="text-xs font-medium text-muted-foreground capitalize">{value}</span>}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-muted-foreground">
                    <Sparkles className="h-12 w-12 opacity-20 mb-2" />
                    <p>No bill data available for distribution</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Upcoming Expirations */}
        {expiringSoon.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-amber-500" />
                Upcoming Expirations
              </h2>
              <Button variant="ghost" size="sm" onClick={() => navigate("/documents")} className="text-primary hover:text-primary/80">
                View all documents <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {expiringSoon.map((doc) => (
                <div
                  key={doc.id}
                  onClick={() => navigate("/documents")}
                  className="flex items-center gap-4 p-4 rounded-xl border border-border bg-card hover:border-amber-500/50 cursor-pointer transition-all group"
                >
                  <div className="p-3 rounded-lg bg-amber-500/10 text-amber-500 group-hover:bg-amber-500/20 transition-colors">
                    <FileText className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-sm text-foreground truncate">{doc.name}</h4>
                    <p className="text-xs text-muted-foreground">Expires in {Math.ceil((new Date(doc.expiry_date!).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))} days</p>
                  </div>
                  <div className="text-xs font-medium text-amber-600 dark:text-amber-400">
                    {new Date(doc.expiry_date!).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

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