"use client";

import { useEffect, useState } from "react";
import { formatCurrency, formatDate } from "@/lib/utils";

interface AdminDashboardStats {
  totalUsers: number;
  totalOrders: number;
  totalRevenue: number;
  pendingOrders: number;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<AdminDashboardStats>({
    totalUsers: 0,
    totalOrders: 0,
    totalRevenue: 0,
    pendingOrders: 0,
  });
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAdminDashboardData = async () => {
      try {
        // Fetch orders
        const ordersRes = await fetch("/api/orders");
        const ordersData = await ordersRes.json();
        
        // Fetch users (admin only endpoint)
        const usersRes = await fetch("/api/admin/users");
        const usersData = await usersRes.json();
        
        if (ordersData.success && ordersData.data && usersData.success && usersData.data) {
          const orders = ordersData.data;
          const users = usersData.data;
          
          // Calculate stats
          const totalUsers = users.length;
          const totalOrders = orders.length;
          const totalRevenue = orders.reduce(
            (total: number, order: any) => total + order.amount,
            0
          );
          const pendingOrders = orders.filter(
            (order: any) => order.status === "pending" || order.status === "processing"
          ).length;
          
          setStats({
            totalUsers,
            totalOrders,
            totalRevenue,
            pendingOrders,
          });
          
          // Get recent orders (last 5)
          setRecentOrders(orders.slice(0, 5));
        }
      } catch (error) {
        console.error("Error fetching admin dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchAdminDashboardData();
  }, []);

  const syncServices = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/services/sync", {
        method: "POST",
      });
      const data = await response.json();
      
      if (data.success) {
        alert("Services synced successfully!");
      } else {
        alert(`Failed to sync services: ${data.error}`);
      }
    } catch (error) {
      console.error("Error syncing services:", error);
      alert("An error occurred while syncing services.");
    } finally {
      setLoading(false);
    }
  };

  const syncOrders = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/orders/sync", {
        method: "POST",
      });
      const data = await response.json();
      
      if (data.success) {
        alert("Orders synced successfully!");
      } else {
        alert(`Failed to sync orders: ${data.error}`);
      }
    } catch (error) {
      console.error("Error syncing orders:", error);
      alert("An error occurred while syncing orders.");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="animate-fadeIn">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <div className="flex flex-col sm:flex-row gap-2 mt-4 md:mt-0">
          <button
            onClick={syncServices}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
          >
            Sync Services
          </button>
          <button
            onClick={syncOrders}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
          >
            Sync Orders
          </button>
        </div>
      </div>
      
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-card rounded-lg shadow-sm p-6 border border-border">
          <h3 className="text-lg font-medium text-muted-foreground mb-2">Total Users</h3>
          <p className="text-3xl font-bold">{stats.totalUsers}</p>
        </div>
        <div className="bg-card rounded-lg shadow-sm p-6 border border-border">
          <h3 className="text-lg font-medium text-muted-foreground mb-2">Total Orders</h3>
          <p className="text-3xl font-bold">{stats.totalOrders}</p>
        </div>
        <div className="bg-card rounded-lg shadow-sm p-6 border border-border">
          <h3 className="text-lg font-medium text-muted-foreground mb-2">Total Revenue</h3>
          <p className="text-3xl font-bold">{formatCurrency(stats.totalRevenue)}</p>
        </div>
        <div className="bg-card rounded-lg shadow-sm p-6 border border-border">
          <h3 className="text-lg font-medium text-muted-foreground mb-2">Pending Orders</h3>
          <p className="text-3xl font-bold">{stats.pendingOrders}</p>
        </div>
      </div>
      
      {/* Recent Orders */}
      <div className="bg-card rounded-lg shadow-sm border border-border p-6 mb-8">
        <h2 className="text-xl font-bold mb-4">Recent Orders</h2>
        {recentOrders.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4">User</th>
                  <th className="text-left py-3 px-4">Service</th>
                  <th className="text-left py-3 px-4">Date</th>
                  <th className="text-left py-3 px-4">Amount</th>
                  <th className="text-left py-3 px-4">Status</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.map((order) => (
                  <tr key={order.id} className="border-b border-border hover:bg-muted/50">
                    <td className="py-3 px-4">{order.user.email}</td>
                    <td className="py-3 px-4">{order.service.name}</td>
                    <td className="py-3 px-4">{formatDate(order.createdAt)}</td>
                    <td className="py-3 px-4">{formatCurrency(order.amount)}</td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                          order.status === "completed"
                            ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                            : order.status === "processing"
                            ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                            : order.status === "pending"
                            ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                            : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                        }`}
                      >
                        {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-muted-foreground">No orders yet.</p>
        )}
      </div>
      
      {/* Ad Placeholder */}
      <div className="ad-placeholder">
        Ad Space - Adsterra Banner
      </div>
    </div>
  );
}
