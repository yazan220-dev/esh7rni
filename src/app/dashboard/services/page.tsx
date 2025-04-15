"use client";

import { useEffect, useState } from "react";
import { formatCurrency } from "@/lib/utils";

interface Service {
  id: string;
  serviceId: number;
  name: string;
  category: string;
  rate: number;
  min: number;
  max: number;
  description: string | null;
  dripfeed: boolean;
  refill: boolean;
}

interface Category {
  id: string;
  name: string;
  services: Service[];
}

export default function UserServices() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [orderForm, setOrderForm] = useState({
    link: "",
    quantity: 0,
  });

  useEffect(() => {
    const fetchServices = async () => {
      try {
        const response = await fetch("/api/services");
        const data = await response.json();
        
        if (data.success && data.data) {
          setCategories(data.data);
        }
      } catch (error) {
        console.error("Error fetching services:", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchServices();
  }, []);

  const allServices = categories.flatMap(category => category.services);
  
  const filteredServices = allServices.filter(service => {
    const matchesCategory = selectedCategory === "all" || service.category === selectedCategory;
    const matchesSearch = service.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          service.description?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleServiceSelect = (service: Service) => {
    setSelectedService(service);
    setOrderForm({
      link: "",
      quantity: service.min,
    });
  };

  const handleOrderSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedService) return;
    
    try {
      setLoading(true);
      
      // Create order
      const orderResponse = await fetch("/api/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          serviceId: selectedService.serviceId,
          link: orderForm.link,
          quantity: orderForm.quantity,
        }),
      });
      
      const orderData = await orderResponse.json();
      
      if (orderData.success) {
        // Redirect to payment page
        window.location.href = `/dashboard/payment?orderId=${orderData.data.orderId}`;
      } else {
        alert(`Failed to create order: ${orderData.error}`);
      }
    } catch (error) {
      console.error("Error creating order:", error);
      alert("An error occurred while creating order.");
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
      <h1 className="text-3xl font-bold mb-6">Services</h1>
      
      {/* Service Filters */}
      <div className="bg-card rounded-lg shadow-sm border border-border p-6 mb-8">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <label htmlFor="category" className="block mb-2">Category</label>
            <select
              id="category"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full p-2 rounded-md bg-background border border-input"
            >
              <option value="all">All Categories</option>
              {categories.map((category) => (
                <option key={category.id} value={category.name}>{category.name}</option>
              ))}
            </select>
          </div>
          <div className="flex-1">
            <label htmlFor="search" className="block mb-2">Search</label>
            <input
              id="search"
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search services..."
              className="w-full p-2 rounded-md bg-background border border-input"
            />
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Services List */}
        <div className="lg:col-span-2">
          <div className="bg-card rounded-lg shadow-sm border border-border p-6 mb-8">
            <h2 className="text-xl font-bold mb-4">Available Services</h2>
            {filteredServices.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-3 px-4">Service</th>
                      <th className="text-left py-3 px-4">Price</th>
                      <th className="text-left py-3 px-4">Min/Max</th>
                      <th className="text-left py-3 px-4">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredServices.map((service) => (
                      <tr key={service.id} className="border-b border-border hover:bg-muted/50">
                        <td className="py-3 px-4">
                          <div>
                            <p className="font-medium">{service.name}</p>
                            <p className="text-sm text-muted-foreground">{service.category}</p>
                          </div>
                        </td>
                        <td className="py-3 px-4">{formatCurrency(service.rate)} per 1000</td>
                        <td className="py-3 px-4">{service.min} / {service.max}</td>
                        <td className="py-3 px-4">
                          <button
                            onClick={() => handleServiceSelect(service)}
                            className="px-3 py-1 bg-primary text-primary-foreground text-sm rounded hover:bg-primary/90 transition-colors"
                          >
                            Order
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-muted-foreground">No services found.</p>
            )}
          </div>
        </div>
        
        {/* Order Form */}
        <div className="lg:col-span-1">
          <div className="bg-card rounded-lg shadow-sm border border-border p-6 mb-8 sticky top-6">
            <h2 className="text-xl font-bold mb-4">Place Order</h2>
            {selectedService ? (
              <form onSubmit={handleOrderSubmit}>
                <div className="mb-4">
                  <h3 className="font-medium">{selectedService.name}</h3>
                  <p className="text-sm text-muted-foreground">{selectedService.category}</p>
                  {selectedService.description && (
                    <p className="mt-2 text-sm">{selectedService.description}</p>
                  )}
                </div>
                
                <div className="mb-4">
                  <label htmlFor="link" className="block mb-2">Link</label>
                  <input
                    id="link"
                    type="text"
                    value={orderForm.link}
                    onChange={(e) => setOrderForm({ ...orderForm, link: e.target.value })}
                    placeholder="https://..."
                    required
                    className="w-full p-2 rounded-md bg-background border border-input"
                  />
                </div>
                
                <div className="mb-4">
                  <label htmlFor="quantity" className="block mb-2">Quantity</label>
                  <input
                    id="quantity"
                    type="number"
                    min={selectedService.min}
                    max={selectedService.max}
                    value={orderForm.quantity}
                    onChange={(e) => setOrderForm({ ...orderForm, quantity: parseInt(e.target.value) })}
                    required
                    className="w-full p-2 rounded-md bg-background border border-input"
                  />
                  <p className="mt-1 text-xs text-muted-foreground">
                    Min: {selectedService.min}, Max: {selectedService.max}
                  </p>
                </div>
                
                <div className="mb-6">
                  <p className="font-medium">Total Price:</p>
                  <p className="text-xl font-bold">
                    {formatCurrency((selectedService.rate * orderForm.quantity) / 1000)}
                  </p>
                </div>
                
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2 px-4 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors disabled:opacity-50"
                >
                  {loading ? "Processing..." : "Place Order"}
                </button>
              </form>
            ) : (
              <p className="text-muted-foreground">Select a service to place an order.</p>
            )}
          </div>
        </div>
      </div>
      
      {/* Ad Placeholder */}
      <div className="ad-placeholder">
        Ad Space - Adsterra Banner
      </div>
    </div>
  );
}
