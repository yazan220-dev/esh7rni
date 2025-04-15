"use client";

import { useEffect, useState } from "react";
import { formatCurrency } from "@/lib/utils";

interface Service {
  id: string;
  serviceId: number;
  name: string;
  category: string;
  rate: number;
  originalRate: number;
  min: number;
  max: number;
  description: string | null;
}

export default function ServiceManagement() {
  const [services, setServices] = useState<Service[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [markupPercentage, setMarkupPercentage] = useState(30);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const fetchServices = async () => {
      try {
        const response = await fetch("/api/services");
        const data = await response.json();
        
        if (data.success && data.data) {
          // Flatten services from categories
          const allServices: Service[] = [];
          const categoryNames: string[] = [];
          
          data.data.forEach((category: any) => {
            categoryNames.push(category.name);
            category.services.forEach((service: any) => {
              allServices.push({
                id: service.id || `service-${service.service}`,
                serviceId: service.service,
                name: service.name,
                category: service.category,
                rate: service.rate,
                originalRate: service.originalRate || service.rate,
                min: service.min,
                max: service.max,
                description: service.description || null,
              });
            });
          });
          
          setServices(allServices);
          setCategories(categoryNames);
          
          // Get current markup from first service
          if (allServices.length > 0) {
            const service = allServices[0];
            const calculatedMarkup = Math.round(((service.rate / service.originalRate) - 1) * 100);
            setMarkupPercentage(calculatedMarkup);
          }
        }
      } catch (error) {
        console.error("Error fetching services:", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchServices();
  }, []);

  const updateMarkup = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/services/markup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ markupPercentage }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        alert("Markup updated successfully!");
        // Refresh services
        window.location.reload();
      } else {
        alert(`Failed to update markup: ${data.error}`);
      }
    } catch (error) {
      console.error("Error updating markup:", error);
      alert("An error occurred while updating markup.");
    } finally {
      setLoading(false);
    }
  };

  const updateServiceDescription = async (serviceId: number, description: string) => {
    try {
      const response = await fetch(`/api/services/${serviceId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ description }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        // Update the service in the local state
        setServices(services.map(service => 
          service.serviceId === serviceId ? { ...service, description } : service
        ));
        alert("Description updated successfully!");
      } else {
        alert(`Failed to update description: ${data.error}`);
      }
    } catch (error) {
      console.error("Error updating service description:", error);
      alert("An error occurred while updating service description.");
    }
  };

  const filteredServices = services.filter(service => {
    const matchesCategory = selectedCategory === "all" || service.category === selectedCategory;
    const matchesSearch = service.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          service.description?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
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
      <h1 className="text-3xl font-bold mb-6">Service Management</h1>
      
      {/* Markup Control */}
      <div className="bg-card rounded-lg shadow-sm border border-border p-6 mb-8">
        <h2 className="text-xl font-bold mb-4">Global Markup</h2>
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="flex items-center">
            <label htmlFor="markup" className="mr-2">Markup Percentage:</label>
            <input
              id="markup"
              type="number"
              min="0"
              max="1000"
              value={markupPercentage}
              onChange={(e) => setMarkupPercentage(parseInt(e.target.value))}
              className="w-20 p-2 rounded-md bg-background border border-input"
            />
            <span className="ml-1">%</span>
          </div>
          <button
            onClick={updateMarkup}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
          >
            Update All Services
          </button>
        </div>
      </div>
      
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
                <option key={category} value={category}>{category}</option>
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
      
      {/* Services Table */}
      <div className="bg-card rounded-lg shadow-sm border border-border p-6 mb-8">
        <h2 className="text-xl font-bold mb-4">Services</h2>
        {filteredServices.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4">ID</th>
                  <th className="text-left py-3 px-4">Name</th>
                  <th className="text-left py-3 px-4">Category</th>
                  <th className="text-left py-3 px-4">Original Price</th>
                  <th className="text-left py-3 px-4">Marked Up Price</th>
                  <th className="text-left py-3 px-4">Min/Max</th>
                  <th className="text-left py-3 px-4">Description</th>
                </tr>
              </thead>
              <tbody>
                {filteredServices.map((service) => (
                  <tr key={service.id} className="border-b border-border hover:bg-muted/50">
                    <td className="py-3 px-4">{service.serviceId}</td>
                    <td className="py-3 px-4">{service.name}</td>
                    <td className="py-3 px-4">{service.category}</td>
                    <td className="py-3 px-4">{formatCurrency(service.originalRate)}</td>
                    <td className="py-3 px-4">{formatCurrency(service.rate)}</td>
                    <td className="py-3 px-4">{service.min} / {service.max}</td>
                    <td className="py-3 px-4">
                      <textarea
                        value={service.description || ""}
                        onChange={(e) => {
                          // Update locally first for responsive UI
                          setServices(services.map(s => 
                            s.serviceId === service.serviceId ? { ...s, description: e.target.value } : s
                          ));
                        }}
                        onBlur={(e) => updateServiceDescription(service.serviceId, e.target.value)}
                        className="w-full p-2 rounded-md bg-background border border-input"
                        rows={2}
                        placeholder="Add description..."
                      />
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
  );
}
