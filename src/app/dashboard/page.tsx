"use client";

import { useEffect, useState } from "react";
import { formatCurrency, formatDate } from "@/lib/utils";

interface DashboardStats {
  totalOrders: number;
  pendingOrders: number;
  completedOrders: number;
  totalSpent: number;
}

export default function UserDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalOrders: 0,
    pendingOrders: 0,
    completedOrders: 0,
    totalSpent: 0,
  });
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // Fetch orders
        const ordersRes = await fetch("/api/orders");
        const ordersData = await ordersRes.json();
        
        if (ordersData.success && ordersData.data) {
          const orders = ordersData.data;
          
          // Calculate stats
          const totalOrders = orders.length;
          const pendingOrders = orders.filter(
            (order: any) => order.status === "pending" || order.status === "processing"
          ).length;
          const completedOrders = orders.filter(
            (order: any) => order.status === "completed"
          ).length;
          const totalSpent = orders.reduce(
            (total: number, order: any) => total + order.amount,
            0
          );
          
          setStats({
            totalOrders,
            pendingOrders,
            completedOrders,
            totalSpent,
          });
          
          // Get recent orders (last 5)
          setRecentOrders(orders.slice(0, 5));
        }
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="animate-fadeIn">
      <h1 className="text-3xl font-bold mb-6">Dashboard</h1>
      
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-card rounded-lg shadow-sm p-6 border border-border">
          <h3 className="text-lg font-medium text-muted-foreground mb-2">Total Orders</h3>
          <p className="text-3xl font-bold">{stats.totalOrders}</p>
        </div>
        <div className="bg-card rounded-lg shadow-sm p-6 border border-border">
          <h3 className="text-lg font-medium text-muted-foreground mb-2">Pending Orders</h3>
          <p className="text-3xl font-bold">{stats.pendingOrders}</p>
        </div>
        <div className="bg-card rounded-lg shadow-sm p-6 border border-border">
          <h3 className="text-lg font-medium text-muted-foreground mb-2">Completed Orders</h3>
          <p className="text-3xl font-bold">{stats.completedOrders}</p>
        </div>
        <div className="bg-card rounded-lg shadow-sm p-6 border border-border">
          <h3 className="text-lg font-medium text-muted-foreground mb-2">Total Spent</h3>
          <p className="text-3xl font-bold">{formatCurrency(stats.totalSpent)}</p>
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
                  <th className="text-left py-3 px-4">Service</th>
                  <th className="text-left py-3 px-4">Date</th>
                  <th className="text-left py-3 px-4">Amount</th>
                  <th className="text-left py-3 px-4">Status</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.map((order) => (
                  <tr key={order.id} className="border-b border-border hover:bg-muted/50">
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
