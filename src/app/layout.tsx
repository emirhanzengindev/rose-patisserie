import type { Metadata, Viewport } from "next";
import { SITE_URL } from "@/lib/site";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    template: "%s · Rose Patisserie",
    default: "Rose Patisserie",
  },
  description: "Bursa'da ev yapımı cupcake, cheesecake ve daha fazlası.",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fbf6f1" },
    { media: "(prefers-color-scheme: dark)", color: "#1c1514" },
  ],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="tr" className="h-full">
      {/* Ziyaretçi çerçevesi (site)/layout.tsx'te; yönetim paneli kendi çerçevesini kullanır. */}
      <body className="flex min-h-full flex-col">{children}</body>
    </html>
  );
}
