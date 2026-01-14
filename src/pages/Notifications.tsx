import { useState, useEffect } from "react";
import Layout from "@/components/Layout";
import { supabase } from "@/integrations/supabase/client";
import { Bell, CheckCircle2, XCircle, AlertCircle, Info, Calendar, X } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";

interface Notification {
  id: string;
  type: "success" | "error" | "warning" | "info" | "reminder";
  title: string;
  message: string;
  created_at: string;
  read: boolean;
  user_id: string;
}

const Notifications = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadNotifications();
    // Check for reminders every 30 seconds
    const interval = setInterval(() => {
      checkBillReminders();
      checkDocumentUpdates();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const loadNotifications = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Load from localStorage
      const stored = localStorage.getItem(`notifications_${user.id}`);
      let existingNotifications: Notification[] = stored ? JSON.parse(stored) : [];

      // Check for bill reminders and document updates
      await checkBillReminders();
      await checkDocumentUpdates();

      // Reload after checking reminders
      const updated = localStorage.getItem(`notifications_${user.id}`);
      if (updated) {
        setNotifications(JSON.parse(updated));
      } else {
        // Create default welcome notification
        const defaultNotifications: Notification[] = [
          {
            id: "1",
            type: "info",
            title: "Welcome to SmartDocs!",
            message: "Start by uploading your important documents and bills.",
            created_at: new Date().toISOString(),
            read: false,
            user_id: user.id,
          },
        ];
        setNotifications(defaultNotifications);
        localStorage.setItem(`notifications_${user.id}`, JSON.stringify(defaultNotifications));
      }
    } catch (error) {
      console.error("Error loading notifications:", error);
    } finally {
      setLoading(false);
    }
  };

  const checkBillReminders = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Load bills from localStorage
      const billsStored = localStorage.getItem(`bills_${user.id}`);
      if (!billsStored) return;

      const bills = JSON.parse(billsStored);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Check notifications for existing bill reminders
      const notificationsStored = localStorage.getItem(`notifications_${user.id}`);
      const existingNotifications: Notification[] = notificationsStored
        ? JSON.parse(notificationsStored)
        : [];

      bills.forEach((bill: any) => {
        if (bill.paid) return;

        const dueDate = new Date(bill.due_date);
        dueDate.setHours(0, 0, 0, 0);
        const daysUntilDue = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

        // Create reminder for bills due in 7 days or less
        if (daysUntilDue <= 7 && daysUntilDue >= 0) {
          const reminderId = `bill_reminder_${bill.id}`;
          const reminderExists = existingNotifications.some((n) => n.id === reminderId);

          if (!reminderExists) {
            const notification: Notification = {
              id: reminderId,
              type: "reminder",
              title: `Bill Reminder: ${bill.bill_type}`,
              message: `Your ${bill.bill_type} bill of ₹${bill.amount} is due in ${daysUntilDue} day(s). Due date: ${new Date(bill.due_date).toLocaleDateString()}`,
              created_at: new Date().toISOString(),
              read: false,
              user_id: user.id,
            };

            existingNotifications.unshift(notification);
          }
        }

        // Create overdue notification
        if (daysUntilDue < 0) {
          const overdueId = `bill_overdue_${bill.id}`;
          const overdueExists = existingNotifications.some((n) => n.id === overdueId);

          if (!overdueExists) {
            const notification: Notification = {
              id: overdueId,
              type: "warning",
              title: `Overdue Bill: ${bill.bill_type}`,
              message: `Your ${bill.bill_type} bill of ₹${bill.amount} is overdue by ${Math.abs(daysUntilDue)} day(s). Please pay immediately.`,
              created_at: new Date().toISOString(),
              read: false,
              user_id: user.id,
            };

            existingNotifications.unshift(notification);
          }
        }
      });

      localStorage.setItem(`notifications_${user.id}`, JSON.stringify(existingNotifications));
      setNotifications(existingNotifications);
    } catch (error) {
      console.error("Error checking bill reminders:", error);
    }
  };

  const checkDocumentUpdates = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Optional: Check for document expiry dates (if you add expiry_date field)
      // This is a placeholder for future document expiry reminders
      const documentsStored = localStorage.getItem(`documents_${user.id}`);
      if (!documentsStored) return;

      // Future implementation: Check for documents with expiry dates
      // Example: Driving License, Passport, etc.
    } catch (error) {
      console.error("Error checking document updates:", error);
    }
  };

  const markAsRead = async (id: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const updated = notifications.map((notif) =>
        notif.id === id ? { ...notif, read: true } : notif
      );
      setNotifications(updated);
      localStorage.setItem(`notifications_${user.id}`, JSON.stringify(updated));
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  const deleteNotification = async (id: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const updated = notifications.filter((notif) => notif.id !== id);
      setNotifications(updated);
      localStorage.setItem(`notifications_${user.id}`, JSON.stringify(updated));

      toast({
        title: "Notification deleted",
        description: "The notification has been removed.",
      });
    } catch (error) {
      console.error("Error deleting notification:", error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const updated = notifications.map((notif) => ({ ...notif, read: true }));
      setNotifications(updated);
      localStorage.setItem(`notifications_${user.id}`, JSON.stringify(updated));

      toast({
        title: "All notifications marked as read",
        description: "All notifications have been marked as read.",
      });
    } catch (error) {
      console.error("Error marking all as read:", error);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "success":
        return <CheckCircle2 className="h-5 w-5 text-green-500" />;
      case "error":
        return <XCircle className="h-5 w-5 text-red-500" />;
      case "warning":
        return <AlertCircle className="h-5 w-5 text-yellow-500" />;
      case "reminder":
        return <Calendar className="h-5 w-5 text-blue-500" />;
      default:
        return <Info className="h-5 w-5 text-blue-500" />;
    }
  };

  const getNotificationBadge = (type: string) => {
    const badges = {
      success: <Badge className="bg-green-500/10 text-green-500 border-green-500/20">Success</Badge>,
      error: <Badge className="bg-red-500/10 text-red-500 border-red-500/20">Error</Badge>,
      warning: <Badge className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20">Warning</Badge>,
      reminder: <Badge className="bg-blue-500/10 text-blue-500 border-blue-500/20">Reminder</Badge>,
      info: <Badge className="bg-blue-500/10 text-blue-500 border-blue-500/20">Info</Badge>,
    };
    return badges[type as keyof typeof badges] || badges.info;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return "Just now";
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} days ago`;

    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  if (loading) {
    return (
      <Layout>
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
                🔔 Notifications
              </h1>
              <p className="text-muted-foreground">
                Stay updated with your document and bill reminders
              </p>
            </div>
            {unreadCount > 0 && (
              <Button onClick={markAllAsRead} variant="outline">
                Mark all as read
              </Button>
            )}
          </div>
        </div>

        {/* Notifications List */}
        {notifications.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Bell className="h-16 w-16 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No notifications</h3>
              <p className="text-muted-foreground text-center">
                You're all caught up! Check back later for updates.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {notifications.map((notification) => (
              <Card
                key={notification.id}
                className={`hover:border-primary/30 transition-colors ${
                  !notification.read ? "border-primary/50 bg-primary/5" : ""
                }`}
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3 flex-1">
                      <div className="mt-1">{getNotificationIcon(notification.type)}</div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <CardTitle className="text-lg">{notification.title}</CardTitle>
                          {getNotificationBadge(notification.type)}
                          {!notification.read && (
                            <Badge variant="default" className="bg-primary text-primary-foreground">
                              New
                            </Badge>
                          )}
                        </div>
                        <CardDescription className="text-sm mb-2">
                          {notification.message}
                        </CardDescription>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          <span>{formatDate(notification.created_at)}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {!notification.read && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => markAsRead(notification.id)}
                          className="h-8 w-8 p-0"
                        >
                          <CheckCircle2 className="h-4 w-4" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteNotification(notification.id)}
                        className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Notifications;
