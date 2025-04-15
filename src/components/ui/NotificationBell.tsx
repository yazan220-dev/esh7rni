"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface NotificationProps {
  userId: string;
}

export default function NotificationBell({ userId }: NotificationProps) {
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch unread notifications count
  const fetchUnreadCount = async () => {
    try {
      const response = await fetch(`/api/notifications?status=unread&limit=1`);
      const data = await response.json();
      
      if (data.success) {
        setUnreadCount(data.data.pagination.total);
      }
    } catch (error) {
      console.error("Error fetching unread notifications count:", error);
    }
  };

  // Fetch notifications
  const fetchNotifications = async () => {
    if (isOpen && notifications.length === 0) {
      setIsLoading(true);
      try {
        const response = await fetch(`/api/notifications?limit=5`);
        const data = await response.json();
        
        if (data.success) {
          setNotifications(data.data.notifications);
        }
      } catch (error) {
        console.error("Error fetching notifications:", error);
      } finally {
        setIsLoading(false);
      }
    }
  };

  // Mark all notifications as read
  const markAllAsRead = async () => {
    try {
      const response = await fetch(`/api/notifications`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ all: true }),
      });
      
      if (response.ok) {
        setUnreadCount(0);
        // Update the read status in the notifications list
        setNotifications(notifications.map((notification: any) => ({
          ...notification,
          read: true,
        })));
      }
    } catch (error) {
      console.error("Error marking notifications as read:", error);
    }
  };

  // Toggle notification panel
  const toggleNotifications = () => {
    setIsOpen(!isOpen);
  };

  // Fetch unread count on mount and periodically
  useEffect(() => {
    fetchUnreadCount();
    
    // Set up polling for new notifications
    const interval = setInterval(fetchUnreadCount, 60000); // Check every minute
    
    return () => clearInterval(interval);
  }, [userId]);

  // Fetch notifications when panel is opened
  useEffect(() => {
    fetchNotifications();
  }, [isOpen]);

  return (
    <div className="relative">
      {/* Notification Bell */}
      <button
        onClick={toggleNotifications}
        className="relative p-2 rounded-full hover:bg-muted transition-colors"
        aria-label="Notifications"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-6 w-6"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
          />
        </svg>
        
        {/* Unread Badge */}
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-primary rounded-full">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {/* Notification Panel */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-card rounded-md shadow-lg overflow-hidden z-50 border border-border">
          <div className="p-3 border-b border-border flex justify-between items-center">
            <h3 className="text-sm font-medium">Notifications</h3>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="text-xs text-primary hover:text-primary/80 transition-colors"
              >
                Mark all as read
              </button>
            )}
          </div>
          
          <div className="max-h-96 overflow-y-auto">
            {isLoading ? (
              <div className="p-4 text-center text-muted-foreground">
                Loading notifications...
              </div>
            ) : notifications.length > 0 ? (
              notifications.map((notification: any) => (
                <div
                  key={notification.id}
                  className={`p-3 border-b border-border hover:bg-muted/50 transition-colors ${
                    !notification.read ? "bg-muted/20" : ""
                  }`}
                >
                  <div className="flex items-start">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-foreground">
                        {notification.content}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(notification.createdAt).toLocaleString()}
                      </p>
                      {notification.orderId && (
                        <Link
                          href={`/dashboard/orders/${notification.orderId}`}
                          className="text-xs text-primary hover:underline mt-1 inline-block"
                        >
                          View Order
                        </Link>
                      )}
                    </div>
                    {!notification.read && (
                      <span className="h-2 w-2 bg-primary rounded-full"></span>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="p-4 text-center text-muted-foreground">
                No notifications yet
              </div>
            )}
          </div>
          
          <div className="p-2 border-t border-border">
            <Link
              href="/dashboard/notifications"
              className="block text-xs text-center text-primary hover:underline"
            >
              View all notifications
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
