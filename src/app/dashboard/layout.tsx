import { Metadata } from "next";
import AdManager from "@/components/ui/AdManager";

export const metadata: Metadata = {
  title: "Dashboard - Esh7rni",
  description: "Manage your orders, view services, and track your social media marketing campaigns.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="container mx-auto px-4 py-8">
      {/* Main content */}
      {children}
      
      {/* Bottom ad banner */}
      <div className="mt-8">
        <AdManager positions={["content"]} />
      </div>
    </div>
  );
}
