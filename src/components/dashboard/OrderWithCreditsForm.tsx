"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import CreditBalance from "@/components/dashboard/CreditBalance";
import { useSession } from "next-auth/react";

export default function OrderWithCreditsForm({ service, userId }) {
  const { data: session } = useSession();
  const router = useRouter();
  const [link, setLink] = useState("");
  const [quantity, setQuantity] = useState(service.min);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Calculate order cost
  const calculateCost = () => {
    return ((service.rate * quantity) / 1000).toFixed(2);
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    try {
      // Validate inputs
      if (!link) {
        throw new Error("Please enter a valid link");
      }
      
      if (quantity < service.min || quantity > service.max) {
        throw new Error(`Quantity must be between ${service.min} and ${service.max}`);
      }
      
      // Place order using credits
      const response = await fetch("/api/orders/credit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          serviceId: service.id,
          link,
          quantity,
        }),
      });
      
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || "Failed to place order");
      }
      
      // Redirect to order confirmation page
      router.push(`/dashboard/orders/${data.data.order.id}?success=true`);
    } catch (error) {
      console.error("Error placing order:", error);
      setError(error.message || "Failed to place order. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div className="md:col-span-2">
        <div className="bg-card rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-bold mb-6">Order with Credits</h2>
          
          {error && (
            <div className="bg-red-100 dark:bg-red-900 p-4 rounded-md mb-4">
              <p className="text-red-800 dark:text-red-200">{error}</p>
            </div>
          )}
          
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">
                Service
              </label>
              <div className="bg-muted p-3 rounded-md">
                <p className="font-medium">{service.name}</p>
                <p className="text-sm text-muted-foreground mt-1">
                  {service.category} • ${service.rate.toFixed(2)} per 1000
                </p>
              </div>
            </div>
            
            <div className="mb-4">
              <label htmlFor="link" className="block text-sm font-medium mb-2">
                Link
              </label>
              <input
                id="link"
                type="text"
                value={link}
                onChange={(e) => setLink(e.target.value)}
                placeholder="https://..."
                className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                required
              />
            </div>
            
            <div className="mb-6">
              <label htmlFor="quantity" className="block text-sm font-medium mb-2">
                Quantity
              </label>
              <input
                id="quantity"
                type="number"
                min={service.min}
                max={service.max}
                value={quantity}
                onChange={(e) => setQuantity(Number(e.target.value))}
                className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                required
              />
              <p className="text-xs text-muted-foreground mt-1">
                Min: {service.min} • Max: {service.max}
              </p>
            </div>
            
            <div className="bg-muted/50 p-4 rounded-md mb-6">
              <div className="flex justify-between items-center">
                <span className="font-medium">Total Cost:</span>
                <span className="text-xl font-bold">${calculateCost()}</span>
              </div>
            </div>
            
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary text-white py-3 px-4 rounded-md hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Processing..." : "Place Order with Credits"}
            </button>
          </form>
        </div>
      </div>
      
      <div>
        <CreditBalance userId={userId} />
      </div>
    </div>
  );
}
