import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import {
  FileText,
  Receipt,
  Bell,
  User as UserIcon,
  LogOut,
  Home,
  Menu,
  X,
  Sun,
  Moon,
  Sparkles
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useTheme } from "next-themes";
import { useUser } from "@/integrations/supabase/hooks/useUser";

interface LayoutProps {
  children: React.ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Prevent hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  const { data: userObject, isLoading: userLoading } = useUser();
  const user = userObject ?? null;

  useEffect(() => {
    // Initial session check for redirection
    const checkSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (mounted) {
          setLoading(false);

          if (!session?.user && location.pathname !== "/auth") {
            navigate("/auth");
          }
        }
      } catch (error) {
        console.error("Session check error:", error);
        if (mounted) setLoading(false);
      }
    };

    checkSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (mounted) {
        setLoading(false);

        if (event === 'SIGNED_OUT') {
          navigate("/auth");
        }
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate, mounted, location.pathname]);

  useEffect(() => {
    if (user) {
      loadNotificationCount(user.id);
      const interval = setInterval(() => {
        loadNotificationCount(user.id);
      }, 30000);
      return () => clearInterval(interval);
    }
  }, [user]);

  const loadNotificationCount = async (userId: string) => {
    try {
      const stored = localStorage.getItem(`notifications_${userId}`);
      if (stored) {
        const notifications = JSON.parse(stored);
        const unread = notifications.filter((n: any) => !n.read).length;
        setUnreadNotifications(unread);
      }
    } catch (error) {
      console.error("Error loading notification count:", error);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    toast({
      title: "Signed out",
      description: "You have been signed out successfully.",
    });
    navigate("/auth");
  };

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  const navItems = [
    { icon: Home, label: "Dashboard", path: "/dashboard", gradient: "from-emerald-500 to-teal-500" },
    { icon: FileText, label: "Documents", path: "/documents", gradient: "from-blue-500 to-cyan-500" },
    { icon: Receipt, label: "Bills", path: "/bills", gradient: "from-amber-500 to-orange-500" },
    { icon: Bell, label: "Notifications", path: "/notifications", gradient: "from-violet-500 to-purple-500" },
    { icon: UserIcon, label: "Profile", path: "/profile", gradient: "from-pink-500 to-rose-500" },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="min-h-screen bg-background flex">
      {/* Mobile Menu Button */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2.5 rounded-xl bg-card border border-border shadow-lg hover:shadow-xl transition-all"
      >
        {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>

      {/* Sidebar */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-40 w-72 bg-card border-r border-border transform transition-transform duration-300 ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
          }`}
      >
        <div className="flex flex-col h-full">
          {/* Logo with Gradient */}
          <div className="p-6 border-b border-border">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-primary to-emerald-400 rounded-xl blur opacity-50" />
                <div className="relative bg-gradient-to-br from-primary/10 to-emerald-500/10 p-2 rounded-xl border border-primary/20 shadow-lg">
                  <img src="/logo.png" alt="SmartDocs Logo" className="h-7 w-7 object-contain" />
                </div>
              </div>
              <div>
                <span className="text-xl font-bold text-foreground">
                  Smart<span className="bg-gradient-to-r from-primary to-emerald-500 bg-clip-text text-transparent">Docs</span>
                </span>
                <p className="text-xs text-muted-foreground">Digital Vault</p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 overflow-y-auto">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4 px-3">Menu</p>
            <ul className="space-y-1">
              {navItems.map((item, index) => (
                <li key={index}>
                  <button
                    onClick={() => {
                      navigate(item.path);
                      setSidebarOpen(false);
                      if (item.path === "/notifications") {
                        if (user) loadNotificationCount(user.id);
                      }
                    }}
                    className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 relative group ${isActive(item.path)
                      ? "bg-gradient-to-r from-primary/10 to-emerald-500/10 text-foreground shadow-sm"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                      }`}
                  >
                    {/* Active indicator */}
                    {isActive(item.path) && (
                      <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-gradient-to-b from-primary to-emerald-500 rounded-r-full" />
                    )}

                    {/* Icon with gradient background when active */}
                    <div className={`p-2 rounded-lg transition-all duration-200 ${isActive(item.path)
                      ? `bg-gradient-to-br ${item.gradient} shadow-md`
                      : "bg-muted group-hover:bg-gradient-to-br group-hover:" + item.gradient
                      }`}>
                      <item.icon className={`h-4 w-4 ${isActive(item.path) ? "text-white" : "text-muted-foreground group-hover:text-white"}`} />
                    </div>

                    <span className="font-medium">{item.label}</span>

                    {item.path === "/notifications" && unreadNotifications > 0 && (
                      <span className="ml-auto bg-gradient-to-r from-red-500 to-pink-500 text-white text-xs font-bold rounded-full min-w-[22px] h-[22px] flex items-center justify-center px-1.5 shadow-lg shadow-red-500/30">
                        {unreadNotifications > 99 ? "99+" : unreadNotifications}
                      </span>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          </nav>

          {/* Theme Toggle - Enhanced */}
          <div className="px-4 py-3 mx-3 mb-2 rounded-xl bg-gradient-to-r from-muted/50 to-muted/30">
            <button
              onClick={toggleTheme}
              className="w-full flex items-center gap-3 transition-all text-foreground group"
            >
              {mounted && (
                <>
                  <div className={`p-2 rounded-lg ${theme === 'dark' ? 'bg-indigo-500/20' : 'bg-amber-500/20'}`}>
                    <div className="relative w-4 h-4">
                      <Sun className={`h-4 w-4 absolute transition-all duration-500 ${theme === 'dark' ? 'opacity-100 rotate-0 text-amber-400' : 'opacity-0 -rotate-90 text-amber-500'}`} />
                      <Moon className={`h-4 w-4 absolute transition-all duration-500 ${theme === 'light' ? 'opacity-100 rotate-0 text-indigo-500' : 'opacity-0 rotate-90 text-indigo-400'}`} />
                    </div>
                  </div>
                  <span className="text-sm font-medium">{theme === 'dark' ? 'Dark Mode' : 'Light Mode'}</span>
                  <div className="ml-auto">
                    <div className={`w-12 h-7 flex items-center rounded-full p-1 transition-all duration-300 ${theme === 'dark' ? 'bg-gradient-to-r from-indigo-500 to-purple-500' : 'bg-gradient-to-r from-amber-400 to-orange-400'}`}>
                      <div className={`w-5 h-5 rounded-full bg-white shadow-md transform transition-transform duration-300 flex items-center justify-center ${theme === 'dark' ? 'translate-x-5' : 'translate-x-0'}`}>
                        {theme === 'dark' ? (
                          <Moon className="h-3 w-3 text-indigo-500" />
                        ) : (
                          <Sun className="h-3 w-3 text-amber-500" />
                        )}
                      </div>
                    </div>
                  </div>
                </>
              )}
            </button>
          </div>

          {/* User & Logout - Enhanced */}
          <div className="p-4 border-t border-border">
            <button
              onClick={() => {
                navigate("/profile");
                setSidebarOpen(false);
              }}
              className="w-full flex items-center gap-3 px-3 py-3 mb-2 rounded-xl hover:bg-muted transition-all text-left group"
            >
              {/* Avatar with gradient ring */}
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-primary to-emerald-500 rounded-full blur-sm opacity-50 group-hover:opacity-75 transition-opacity" />
                <div className="relative w-11 h-11 rounded-full bg-gradient-to-br from-primary to-emerald-500 p-[2px]">
                  <div className="w-full h-full rounded-full bg-card flex items-center justify-center">
                    <span className="text-lg font-bold text-primary">
                      {(user?.user_metadata?.full_name || user?.email || "U")[0].toUpperCase()}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground truncate">
                  {user?.user_metadata?.full_name || user?.user_metadata?.name || user?.email?.split("@")[0] || "User"}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {user?.email}
                </p>
              </div>
              <Sparkles className="h-4 w-4 text-primary opacity-0 group-hover:opacity-100 transition-opacity" />
            </button>
            <Button
              variant="ghost"
              onClick={handleSignOut}
              className="w-full justify-start text-muted-foreground hover:text-red-500 hover:bg-red-500/10 rounded-xl"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-6 lg:p-8 overflow-auto">
        {children}
      </main>

      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-background/80 backdrop-blur-sm z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
};

export default Layout;


