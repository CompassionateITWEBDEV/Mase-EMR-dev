"use client";

import { useState, useEffect } from "react";
import type { FC } from "react";
import { useRouter } from "next/navigation";
import {
  Bell,
  Search,
  Settings,
  User,
  LogOut,
  UserCircle,
  Briefcase,
  Building2,
  CreditCard,
  Users,
  Cog,
  Check,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Notification {
  id: string;
  title: string;
  message: string;
  time: string;
  read: boolean;
  link: string;
  type: string;
  created_at: string;
}

export interface DashboardHeaderProps {
  title?: string;
  subtitle?: string;
  description?: string;
  className?: string;
}

export const DashboardHeader: FC<DashboardHeaderProps> = ({ title, subtitle, description, className }) => {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  // Fetch real notifications from the database
  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        setLoading(true);
        const response = await fetch("/api/notifications");
        if (response && response.ok) {
          const data = await response.json();
          setNotifications(data.notifications || []);
        }
      } catch (error) {
        console.error("Failed to fetch notifications:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchNotifications();
    // Poll for new notifications every 30 seconds
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/patients?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const handleNotificationClick = async (notification: Notification) => {
    // Mark as read in database
    try {
      await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notificationId: notification.id }),
      });
    } catch (error) {
      console.error("Failed to mark notification as read:", error);
    }

    setNotifications((prev) =>
      prev.map((n) => (n.id === notification.id ? { ...n, read: true } : n))
    );
    setNotificationOpen(false);
    router.push(notification.link);
  };

  const markAllRead = async () => {
    try {
      await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ markAllRead: true }),
      });
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch (error) {
      console.error("Failed to mark all as read:", error);
    }
  };

  const handleSettingsNavigation = (path: string) => {
    router.push(path);
  };

  const handleUserNavigation = (path: string) => {
    router.push(path);
  };

  const handleSignOut = () => {
    // Clear super admin status from localStorage
    if (typeof window !== "undefined") {
      localStorage.removeItem("isSuperAdmin");
    }
    router.push("/landing");
  };

  // Format time for display
  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffHours < 24)
      return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
    return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`;
  };

  return (
    <header
      className={`border-b px-6 py-4 ${className || ''}`}
      style={{ backgroundColor: "#f8fafc", borderColor: "#e2e8f0" }}
      role="banner"
      aria-label="Main header">
      <div className="flex items-center justify-between">
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
          <div>
            <h1 className="text-2xl font-bold" style={{ color: "#1e293b" }}>
              {title || "MASE Behavioral Health EMR"}
            </h1>
            {(subtitle || description) && (
              <p className="text-sm text-muted-foreground mt-1">
                {subtitle || description}
              </p>
            )}
          </div>
          <Badge
            variant="secondary"
            style={{ backgroundColor: "#f1f5f9", color: "#1e293b" }}
            aria-label="AI-Assisted application"
            className="hidden sm:inline-flex">
            AI-Assisted
          </Badge>
        </div>

        <nav className="flex items-center space-x-4" aria-label="Header actions">
          <form onSubmit={handleSearch} className="relative" role="search">
            <Search
              className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4"
              aria-hidden="true"
              style={{ color: "#64748b" }}
            />
            <Input
              placeholder="Search patients, records..."
              className="pl-10 w-80"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              aria-label="Search patients and records"
            />
          </form>

          {/* Notifications Sheet */}
          <Sheet open={notificationOpen} onOpenChange={setNotificationOpen}>
            <SheetTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon" 
                className="relative"
                aria-label={`Notifications${unreadCount > 0 ? `, ${unreadCount} unread` : ''}`}
              >
                <Bell className="h-5 w-5" aria-hidden="true" />
                {unreadCount > 0 && (
                  <Badge
                    className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
                    style={{ backgroundColor: "#0891b2", color: "#ffffff" }}
                    aria-hidden="true">
                    {unreadCount}
                  </Badge>
                )}
              </Button>
            </SheetTrigger>
            <SheetContent className="w-[400px] sm:w-[540px]">
              <SheetHeader className="flex flex-row items-center justify-between">
                <SheetTitle>Notifications</SheetTitle>
                {unreadCount > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={markAllRead}
                    className="text-xs">
                    <Check className="h-3 w-3 mr-1" />
                    Mark all read
                  </Button>
                )}
              </SheetHeader>
              <ScrollArea className="h-[calc(100vh-100px)] mt-4">
                <div className="space-y-2">
                  {loading ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                    </div>
                  ) : notifications.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      No notifications
                    </div>
                  ) : (
                    notifications.map((notification) => (
                      <div
                        key={notification.id}
                        onClick={() => handleNotificationClick(notification)}
                        className={`p-4 rounded-lg cursor-pointer transition-colors ${
                          notification.read
                            ? "bg-gray-50 hover:bg-gray-100"
                            : "bg-cyan-50 hover:bg-cyan-100 border-l-4 border-cyan-500"
                        }`}>
                        <div className="flex justify-between items-start">
                          <h4 className="font-medium text-sm">
                            {notification.title}
                          </h4>
                          <span className="text-xs text-gray-500">
                            {formatTime(notification.created_at)}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mt-1">
                          {notification.message}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>
            </SheetContent>
          </Sheet>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <Settings className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>Settings</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onSelect={() => handleSettingsNavigation("/settings")}>
                <Cog className="mr-2 h-4 w-4" />
                General Settings
              </DropdownMenuItem>
              <DropdownMenuItem
                onSelect={() => handleSettingsNavigation("/subscription")}>
                <CreditCard className="mr-2 h-4 w-4" />
                Subscription & Billing
              </DropdownMenuItem>
              <DropdownMenuItem
                onSelect={() => handleSettingsNavigation("/staff")}>
                <Users className="mr-2 h-4 w-4" />
                User Management
              </DropdownMenuItem>
              <DropdownMenuItem
                onSelect={() => handleSettingsNavigation("/facility")}>
                <Building2 className="mr-2 h-4 w-4" />
                Facility Settings
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <User className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>
                <div className="flex flex-col">
                  <span>Dr. Sarah Johnson</span>
                  <span className="text-xs font-normal text-gray-500">
                    Medical Director
                  </span>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onSelect={() => handleUserNavigation("/settings")}>
                <UserCircle className="mr-2 h-4 w-4" />
                My Profile
              </DropdownMenuItem>
              <DropdownMenuItem
                onSelect={() => handleUserNavigation("/my-work")}>
                <Briefcase className="mr-2 h-4 w-4" />
                My Work Queue
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onSelect={handleSignOut}
                className="text-red-600">
                <LogOut className="mr-2 h-4 w-4" aria-hidden="true" />
                Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </nav>
      </div>
    </header>
  );
};
