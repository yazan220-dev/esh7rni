"use client";

import { useEffect, useState } from "react";
import { formatCurrency, formatDate } from "@/lib/utils";

interface Payment {
  id: string;
  userId: string;
  orderId: string;
  amount: number;
  method: string;
  status: string;
  transactionId: string | null;
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    name: string | null;
    email: string | null;
  };
  order: {
    id: string;
    service: {
      name: string;
    };
  };
}

export default function AdminPayments() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [methodFilter, setMethodFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  useEffect(() => {
    const fetchPayments = async () => {
      try {
        const response = await fetch("/api/admin/payments");
        const data = await response.json();
        
        if (data.success && data.data) {
          setPayments(data.data);
        }
      } catch (error) {
        console.error("Error fetching payments:", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchPayments();
  }, []);

  const filteredPayments = payments.filter(payment => {
    const matchesMethod = methodFilter === "all" || payment.method === methodFilter;
    const matchesStatus = statusFilter === "all" || payment.status === statusFilter;
    return matchesMethod && matchesStatus;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="animate-fadeIn">
      <h1 className="text-3xl font-bold mb-6">Transactions</h1>
      
      {/* Filters */}
      <div className="bg-card rounded-lg shadow-sm border border-border p-6 mb-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div>
            <label htmlFor="method" className="mr-2">Payment Method:</label>
            <select
              id="method"
              value={methodFilter}
              onChange={(e) => setMethodFilter(e.target.value)}
              className="p-2 rounded-md bg-background border border-input"
            >
              <option value="all">All Methods</option>
              <option value="paypal">PayPal</option>
              <option value="binance">Binance Pay</option>
              <option value="googlepay">Google Pay</option>
            </select>
          </div>
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
              <option value="completed">Completed</option>
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
      
      {/* Payments Table */}
      <div className="bg-card rounded-lg shadow-sm border border-border p-6 mb-8">
        <h2 className="text-xl font-bold mb-4">Transactions</h2>
        {filteredPayments.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4">ID</th>
                  <th className="text-left py-3 px-4">User</th>
                  <th className="text-left py-3 px-4">Service</th>
                  <th className="text-left py-3 px-4">Amount</th>
                  <th className="text-left py-3 px-4">Method</th>
                  <th className="text-left py-3 px-4">Status</th>
                  <th className="text-left py-3 px-4">Transaction ID</th>
                  <th className="text-left py-3 px-4">Date</th>
                </tr>
              </thead>
              <tbody>
                {filteredPayments.map((payment) => (
                  <tr key={payment.id} className="border-b border-border hover:bg-muted/50">
                    <td className="py-3 px-4">{payment.id.slice(0, 8)}...</td>
                    <td className="py-3 px-4">{payment.user.email}</td>
                    <td className="py-3 px-4">{payment.order.service.name}</td>
                    <td className="py-3 px-4">{formatCurrency(payment.amount)}</td>
                    <td className="py-3 px-4">
                      <span className="capitalize">{payment.method}</span>
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                          payment.status === "completed"
                            ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                            : payment.status === "pending"
                            ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                            : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                        }`}
                      >
                        {payment.status.charAt(0).toUpperCase() + payment.status.slice(1)}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      {payment.transactionId ? payment.transactionId.slice(0, 10) + "..." : "N/A"}
                    </td>
                    <td className="py-3 px-4">{formatDate(payment.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-muted-foreground">No transactions found.</p>
        )}
      </div>
    </div>
  );
}
