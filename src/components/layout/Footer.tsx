"use client";

import { useTheme } from "next-themes";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function Footer() {
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // After mounting, we can access the theme
  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <footer className="border-t border-border mt-auto">
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="mb-4 md:mb-0">
            {mounted && (
              <Image
                src={theme === "dark" ? "/images/logo-white.png" : "/images/logo-black.png"}
                alt="Esh7rni Logo"
                width={150}
                height={50}
                className="h-10 w-auto"
              />
            )}
          </div>
          
          <div className="flex flex-col md:flex-row gap-6 mb-4 md:mb-0">
            <Link href="/terms" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Terms of Service
            </Link>
            <Link href="/privacy" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Privacy Policy
            </Link>
            <Link href="/contact" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Contact Us
            </Link>
          </div>
          
          <div className="flex flex-col items-center">
            <Image
              src="/images/signature.png"
              alt="Signature"
              width={40}
              height={40}
              className="h-10 w-auto mb-2"
            />
            <p className="text-xs text-muted-foreground">
              © {new Date().getFullYear()} Esh7rni. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
