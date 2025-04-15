"use client";

import { useEffect, useState } from "react";
import { formatCurrency, formatDate } from "@/lib/utils";

interface Order {
  id: string;
  userId: string;
  serviceId: string;
  link: string;
  quantity: number;
  amount: number;
  status: string;
  apiOrderId: string | null;
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    name: string | null;
    email: string | null;
  };
  service: {
    id: string;
    name: string;
    category: string;
  };
}

export default function AdminOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("all");

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const response = await fetch("/api/orders");
        const data = await response.json();
        
        if (data.success && data.data) {
          setOrders(data.data);
        }
      } catch (error) {
        console.error("Error fetching orders:", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchOrders();
  }, []);

  const syncOrderStatus = async (orderId: string) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/orders/${orderId}/sync`, {
        method: "POST",
      });
      
      const data = await response.json();
      
      if (data.success) {
        // Update the order in the local state
        setOrders(orders.map(order => 
          order.id === orderId ? { ...order, status: data.data.status } : order
        ));
        alert("Order status synced successfully!");
      } else {
        alert(`Failed to sync order status: ${data.error}`);
      }
    } catch (error) {
      console.error("Error syncing order status:", error);
      alert("An error occurred while syncing order status.");
    } finally {
      setLoading(false);
    }
  };

  const submitOrder = async (orderId: string) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/orders/${orderId}/submit`, {
        method: "POST",
      });
      
      const data = await response.json();
      
      if (data.success) {
        // Update the order in the local state
        setOrders(orders.map(order => 
          order.id === orderId ? { ...order, apiOrderId: data.data.apiOrderId, status: "processing" } : order
        ));
        alert("Order submitted to API successfully!");
      } else {
        alert(`Failed to submit order: ${data.error}`);
      }
    } catch (error) {
      console.error("Error submitting order:", error);
      alert("An error occurred while submitting order.");
    } finally {
      setLoading(false);
    }
  };

  const filteredOrders = statusFilter === "all" 
    ? orders 
    : orders.filter(order => order.status === statusFilter);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="animate-fadeIn">
      <h1 className="text-3xl font-bold mb-6">All Orders</h1>
      
      {/* Filters */}
      <div className="bg-card rounded-lg shadow-sm border border-border p-6 mb-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div>
            <label htmlFor="status" className="mr-2">Status:</label>
            <select
              id="status"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="p-2 rounded-md bg-background border border-input"
            >
              <option value="all">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="processing">Processing</option>
              <option value="completed">Completed</option>
              <option value="canceled">Canceled</option>
              <option value="failed">Failed</option>
            </select>
          </div>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/90 transition-colors"
          >
            Refresh
          </button>
        </div>
      </div>
      
      {/* Orders Table */}
      <div className="bg-card rounded-lg shadow-sm border border-border p-6 mb-8">
        <h2 className="text-xl font-bold mb-4">Orders</h2>
        {filteredOrders.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4">ID</th>
                  <th className="text-left py-3 px-4">User</th>
                  <th className="text-left py-3 px-4">Service</th>
                  <th className="text-left py-3 px-4">Quantity</th>
                  <th className="text-left py-3 px-4">Amount</th>
                  <th className="text-left py-3 px-4">Status</th>
                  <th className="text-left py-3 px-4">Date</th>
                  <th className="text-left py-3 px-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map((order) => (
                  <tr key={order.id} className="border-b border-border hover:bg-muted/50">
                    <td className="py-3 px-4">{order.id.slice(0, 8)}...</td>
                    <td className="py-3 px-4">{order.user.email}</td>
                    <td className="py-3 px-4">{order.service.name}</td>
                    <td className="py-3 px-4">{order.quantity}</td>
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
                    <td className="py-3 px-4">{formatDate(order.createdAt)}</td>
                    <td className="py-3 px-4">
                      <div className="flex space-x-2">
                        {!order.apiOrderId && (
                          <button
                            onClick={() => submitOrder(order.id)}
                            className="px-2 py-1 bg-primary text-primary-foreground text-xs rounded hover:bg-primary/90 transition-colors"
                          >
                            Submit
                          </button>
                        )}
                        {order.apiOrderId && (
                          <button
                            onClick={() => syncOrderStatus(order.id)}
                            className="px-2 py-1 bg-secondary text-secondary-foreground text-xs rounded hover:bg-secondary/90 transition-colors"
                          >
                            Sync Status
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-muted-foreground">No orders found.</p>
        )}
      </div>
    </div>
  );
}
