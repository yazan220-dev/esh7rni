import { Metadata } from "next";
import AdManager from "@/components/ui/AdManager";

export const metadata: Metadata = {
  title: "Services - Esh7rni",
  description: "Browse our comprehensive range of social media marketing services for Instagram, TikTok, Telegram, and more.",
  keywords: "SMM services, Instagram followers, TikTok likes, Telegram members, social media growth",
  openGraph: {
    title: "Services - Esh7rni",
    description: "Browse our comprehensive range of social media marketing services for Instagram, TikTok, Telegram, and more.",
    url: "https://esh7rni.me/services",
    siteName: "Esh7rni",
    images: [
      {
        url: "/images/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "Esh7rni Services",
      },
    ],
    locale: "en_US",
    type: "website",
  },
};

export default function ServicesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="lg:col-span-3">
          {children}
        </div>
        
        {/* Sidebar with ad */}
        <div className="space-y-6">
          <AdManager positions={["sidebar"]} />
        </div>
      </div>
      
      {/* Content ad */}
      <div className="my-12">
        <AdManager positions={["content"]} />
      </div>
    </div>
  );
}
