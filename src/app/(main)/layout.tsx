import { Metadata } from "next";
import AdManager from "@/components/ui/AdManager";

export const metadata: Metadata = {
  title: "Esh7rni - Social Media Marketing Services",
  description: "Professional SMM services for all your social media needs. Boost your social media presence with our high-quality services.",
  keywords: "SMM, social media marketing, Instagram followers, TikTok likes, Telegram members, social media services",
  openGraph: {
    title: "Esh7rni - Social Media Marketing Services",
    description: "Professional SMM services for all your social media needs. Boost your social media presence with our high-quality services.",
    url: "https://esh7rni.me",
    siteName: "Esh7rni",
    images: [
      {
        url: "/images/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "Esh7rni - Social Media Marketing Services",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Esh7rni - Social Media Marketing Services",
    description: "Professional SMM services for all your social media needs. Boost your social media presence with our high-quality services.",
    images: ["/images/og-image.jpg"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  alternates: {
    canonical: "https://esh7rni.me",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      {/* Top ad banner */}
      <AdManager positions={["top"]} />
      
      {/* Main content */}
      {children}
      
      {/* Footer ad banner */}
      <AdManager positions={["footer"]} />
    </>
  );
}
