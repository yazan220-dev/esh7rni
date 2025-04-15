"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface CreditBalanceProps {
  userId: string;
}

export default function CreditBalance({ userId }: CreditBalanceProps) {
  const [balance, setBalance] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [recentTransactions, setRecentTransactions] = useState<any[]>([]);

  // Fetch user's credit balance
  const fetchCreditBalance = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/credits`);
      const data = await response.json();
      
      if (data.success) {
        setBalance(data.data.balance);
        setRecentTransactions(data.data.recentTransactions || []);
      } else {
        setError(data.error || "Failed to fetch credit balance");
      }
    } catch (error) {
      console.error("Error fetching credit balance:", error);
      setError("Failed to fetch credit balance. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCreditBalance();
    
    // Refresh balance every 60 seconds
    const interval = setInterval(fetchCreditBalance, 60000);
    
    return () => clearInterval(interval);
  }, [userId]);

  // Format transaction date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + " " + date.toLocaleTimeString();
  };

  // Get transaction type color
  const getTransactionTypeColor = (type: string) => {
    switch (type) {
      case "purchase":
      case "bonus":
        return "text-green-600 dark:text-green-400";
      case "usage":
        return "text-red-600 dark:text-red-400";
      case "refund":
        return "text-blue-600 dark:text-blue-400";
      default:
        return "text-gray-600 dark:text-gray-400";
    }
  };

  // Get transaction type icon
  const getTransactionTypeIcon = (type: string) => {
    switch (type) {
      case "purchase":
        return "💰";
      case "bonus":
        return "🎁";
      case "usage":
        return "🛒";
      case "refund":
        return "↩️";
      default:
        return "📝";
    }
  };

  return (
    <div className="bg-card rounded-lg shadow-md p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Credit Balance</h2>
        <Link
          href="/dashboard/credits/purchase"
          className="bg-primary text-white px-4 py-2 rounded-md hover:bg-primary/90 transition-colors"
        >
          Add Credits
        </Link>
      </div>
      
      {isLoading ? (
        <div className="flex justify-center items-center h-24">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : error ? (
        <div className="bg-red-100 dark:bg-red-900 p-4 rounded-md">
          <p className="text-red-800 dark:text-red-200">{error}</p>
        </div>
      ) : (
        <>
          <div className="bg-muted/50 rounded-lg p-6 mb-6 text-center">
            <p className="text-sm text-muted-foreground mb-1">Available Credits</p>
            <h3 className="text-4xl font-bold">${balance.toFixed(2)}</h3>
          </div>
          
          <div>
            <h3 className="text-lg font-medium mb-3">Recent Transactions</h3>
            {recentTransactions.length > 0 ? (
              <div className="space-y-3">
                {recentTransactions.map((transaction) => (
                  <div
                    key={transaction.id}
                    className="flex items-center justify-between p-3 bg-muted/30 rounded-md"
                  >
                    <div className="flex items-center">
                      <div className="mr-3 text-xl">
                        {getTransactionTypeIcon(transaction.type)}
                      </div>
                      <div>
                        <p className="font-medium">
                          <span className={getTransactionTypeColor(transaction.type)}>
                            {transaction.type === "purchase" || transaction.type === "bonus"
                              ? "+"
                              : "-"}
                            ${transaction.amount.toFixed(2)}
                          </span>
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatDate(transaction.createdAt)}
                        </p>
                      </div>
                    </div>
                    <div className="text-sm capitalize">
                      {transaction.type}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-4">
                No transactions yet
              </p>
            )}
            
            <div className="mt-4 text-center">
              <Link
                href="/dashboard/credits/history"
                className="text-primary hover:underline text-sm"
              >
                View All Transactions
              </Link>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
