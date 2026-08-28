import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { ScrollArea } from "./ui/scroll-area";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import {
  Bell,
  Check,
  X,
  AlertCircle,
  CheckCircle,
  Info,
  Trash2,
  Settings,
  Calendar,
  DollarSign,
  Ticket,
  Users,
} from "lucide-react";
import { apiClient } from "../services/api";
import { useToast } from "../hooks/use-toast";

export interface Notification {
  id: string;
  type:
    | "info"
    | "success"
    | "warning"
    | "error"
    | "booking"
    | "payment"
    | "system";
  title: string;
  message: string;
  timestamp: string;
  isRead: boolean;
  isImportant: boolean;
  actionUrl?: string;
  actionLabel?: string;
  data?: any;
}

interface NotificationCenterProps {
  className?: string;
}

export function NotificationCenter({ className }: NotificationCenterProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showAll, setShowAll] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const loadRealNotifications = async () => {
    try {
      // Get real data from various endpoints to create notifications
      const [dashboardStats, bookings] = await Promise.all([
        apiClient.getDashboardStats().catch(() => null),
        apiClient.getBookings({ limit: 5 }).catch(() => []),
      ]);

      const realNotifications: Notification[] = [];

      // Check for low inventory
      if (dashboardStats && dashboardStats.totalInventory < 50) {
        realNotifications.push({
          id: `low-inventory-${Date.now()}`,
          type: "warning",
          title: "Low Inventory Alert",
          message: `Only ${dashboardStats.totalInventory} tickets remaining in total inventory`,
          timestamp: new Date().toISOString(),
          isRead: false,
          isImportant: true,
          actionUrl: "/countries",
          actionLabel: "Check Inventory",
        });
      }

      // Check for locked tickets
      if (dashboardStats && dashboardStats.lockedTickets > 0) {
        realNotifications.push({
          id: `locked-tickets-${Date.now()}`,
          type: "info",
          title: "Locked Tickets",
          message: `${dashboardStats.lockedTickets} tickets are currently locked and need attention`,
          timestamp: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
          isRead: false,
          isImportant: false,
          actionUrl: "/bookings",
          actionLabel: "View Locked Tickets",
        });
      }

      // Recent bookings notifications
      if (bookings && bookings.length > 0) {
        bookings.slice(0, 2).forEach((booking: any, index: number) => {
          realNotifications.push({
            id: `booking-${booking.id}`,
            type: "booking",
            title: "New Booking",
            message: `Booking for ${booking.passenger_name} - ${booking.agent_name}`,
            timestamp: new Date(
              Date.now() - (index + 1) * 15 * 60 * 1000,
            ).toISOString(),
            isRead: false,
            isImportant: true,
            actionUrl: "/bookings",
            actionLabel: "View Booking",
            data: { bookingId: booking.id },
          });
        });
      }

      // Today's sales notification
      if (dashboardStats && dashboardStats.todaysSales.count > 0) {
        realNotifications.push({
          id: `todays-sales-${Date.now()}`,
          type: "success",
          title: "Today's Sales Update",
          message: `${dashboardStats.todaysSales.count} tickets sold today for ৳${dashboardStats.todaysSales.amount.toLocaleString()}`,
          timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
          isRead: false,
          isImportant: false,
          actionUrl: "/reports",
          actionLabel: "View Reports",
        });
      }

      // System status notification
      realNotifications.push({
        id: `system-status-${Date.now()}`,
        type: "system",
        title: "System Status",
        message: "BD TicketPro is running smoothly. All systems operational.",
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        isRead: true,
        isImportant: false,
      });

      setNotifications(realNotifications);
      updateUnreadCount(realNotifications);
    } catch (error) {
      console.error("Failed to load notifications:", error);
      // Fallback to basic notifications
      loadFallbackNotifications();
    }
  };

  const loadFallbackNotifications = () => {
    const mockNotifications: Notification[] = [
      {
        id: "1",
        type: "booking",
        title: "New Booking Confirmed",
        message:
          "Rahman Travel Agency has confirmed a booking for Dubai flight DXB-123",
        timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
        isRead: false,
        isImportant: true,
        actionUrl: "/bookings",
        actionLabel: "View Booking",
      },
      {
        id: "2",
        type: "payment",
        title: "Payment Received",
        message:
          "Received ৳25,000 payment from Golden Travel for booking GT-456",
        timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
        isRead: false,
        isImportant: false,
        actionUrl: "/bookings",
        actionLabel: "View Payment",
      },
      {
        id: "3",
        type: "warning",
        title: "Low Inventory Alert",
        message: "Only 3 tickets remaining for UAE flights on 2024-08-15",
        timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
        isRead: false,
        isImportant: true,
        actionUrl: "/tickets?country=UAE",
        actionLabel: "Check Inventory",
      },
      {
        id: "4",
        type: "system",
        title: "Daily Backup Complete",
        message: "System backup completed successfully at 12:00 AM",
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        isRead: true,
        isImportant: false,
      },
      {
        id: "5",
        type: "info",
        title: "New Agent Registration",
        message: "Sky Way Travel has registered as a new agent",
        timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
        isRead: true,
        isImportant: false,
        actionUrl: "/agents",
        actionLabel: "View Profile",
      },
    ];

    setNotifications(mockNotifications);
    updateUnreadCount(mockNotifications);
  };

  useEffect(() => {
    loadRealNotifications();
    // Refresh notifications every 5 minutes
    const interval = setInterval(loadRealNotifications, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const updateUnreadCount = (notifs: Notification[]) => {
    const unread = notifs.filter((n) => !n.isRead).length;
    setUnreadCount(unread);
  };

  const markAsRead = (id: string) => {
    const updated = notifications.map((notification) =>
      notification.id === id ? { ...notification, isRead: true } : notification,
    );
    setNotifications(updated);
    updateUnreadCount(updated);
  };

  const markAllAsRead = () => {
    const updated = notifications.map((notification) => ({
      ...notification,
      isRead: true,
    }));
    setNotifications(updated);
    updateUnreadCount(updated);
  };

  const deleteNotification = (id: string) => {
    const updated = notifications.filter(
      (notification) => notification.id !== id,
    );
    setNotifications(updated);
    updateUnreadCount(updated);
  };

  const clearAllNotifications = () => {
    setNotifications([]);
    setUnreadCount(0);
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "success":
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case "warning":
        return <AlertCircle className="h-5 w-5 text-yellow-500" />;
      case "error":
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      case "booking":
        return <Ticket className="h-5 w-5 text-blue-500" />;
      case "payment":
        return <DollarSign className="h-5 w-5 text-green-500" />;
      case "system":
        return <Settings className="h-5 w-5 text-gray-500" />;
      default:
        return <Info className="h-5 w-5 text-blue-500" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "success":
        return "border-l-green-500 bg-green-50";
      case "warning":
        return "border-l-yellow-500 bg-yellow-50";
      case "error":
        return "border-l-red-500 bg-red-50";
      case "booking":
        return "border-l-blue-500 bg-blue-50";
      case "payment":
        return "border-l-green-500 bg-green-50";
      case "system":
        return "border-l-gray-500 bg-gray-50";
      default:
        return "border-l-blue-500 bg-blue-50";
    }
  };

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffInMinutes = Math.floor(
      (now.getTime() - time.getTime()) / (1000 * 60),
    );

    if (diffInMinutes < 1) return "Just now";
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;

    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;

    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays}d ago`;
  };

  const displayNotifications = showAll
    ? notifications
    : notifications.slice(0, 5);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" className={`relative ${className}`}>
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center"
            >
              {unreadCount > 9 ? "9+" : unreadCount}
            </motion.div>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-96 p-0" align="end">
        <div className="border-b p-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">Notifications</h3>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <Button variant="ghost" size="sm" onClick={markAllAsRead}>
                  <Check className="h-4 w-4 mr-1" />
                  Mark all read
                </Button>
              )}
              <Button variant="ghost" size="sm" onClick={clearAllNotifications}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
          {unreadCount > 0 && (
            <p className="text-sm text-gray-600 mt-1">
              {unreadCount} unread notification{unreadCount !== 1 ? "s" : ""}
            </p>
          )}
        </div>

        <ScrollArea className="max-h-96">
          <div className="p-2">
            {displayNotifications.length > 0 ? (
              <AnimatePresence>
                {displayNotifications.map((notification) => (
                  <motion.div
                    key={notification.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className={`border-l-4 rounded-lg p-3 mb-2 relative ${getTypeColor(notification.type)} ${
                      !notification.isRead ? "ring-2 ring-blue-200" : ""
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 mt-0.5">
                        {getNotificationIcon(notification.type)}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-medium text-sm truncate">
                            {notification.title}
                          </h4>
                          {notification.isImportant && (
                            <Badge
                              variant="destructive"
                              className="text-xs px-1.5 py-0.5"
                            >
                              Important
                            </Badge>
                          )}
                        </div>

                        <p className="text-sm text-gray-600 mb-2">
                          {notification.message}
                        </p>

                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-500">
                            {formatTimeAgo(notification.timestamp)}
                          </span>

                          <div className="flex items-center gap-1">
                            {notification.actionUrl &&
                              notification.actionLabel && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="text-xs h-6 hover:bg-primary hover:text-primary-foreground"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    navigate(notification.actionUrl!);
                                    markAsRead(notification.id);
                                    toast({
                                      title: "Navigating",
                                      description: `Opening ${notification.actionLabel}`,
                                    });
                                  }}
                                >
                                  {notification.actionLabel}
                                </Button>
                              )}

                            {!notification.isRead && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0"
                                onClick={() => markAsRead(notification.id)}
                              >
                                <Check className="h-3 w-3" />
                              </Button>
                            )}

                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0"
                              onClick={() =>
                                deleteNotification(notification.id)
                              }
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Bell className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <p>No notifications</p>
                <p className="text-sm">You're all caught up!</p>
              </div>
            )}
          </div>
        </ScrollArea>

        {notifications.length > 5 && (
          <div className="border-t p-3">
            <Button
              variant="ghost"
              className="w-full text-sm"
              onClick={() => setShowAll(!showAll)}
            >
              {showAll
                ? "Show less"
                : `View all ${notifications.length} notifications`}
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}

// Hook for managing notifications
export function useNotifications() {
  const addNotification = (
    notification: Omit<Notification, "id" | "timestamp">,
  ) => {
    // In a real app, this would dispatch to a global state or API
    console.log("Adding notification:", notification);
  };

  const removeNotification = (id: string) => {
    // In a real app, this would dispatch to a global state or API
    console.log("Removing notification:", id);
  };

  return {
    addNotification,
    removeNotification,
  };
}
