import type { Metadata, Viewport } from "next";
import { Geist_Mono, Outfit } from "next/font/google";
import { AppBoot } from "@/components/app-boot";
import { BottomNav } from "@/components/bottom-nav";
import { Toaster } from "@/components/ui/toast";
import { themeBootScript } from "@/theme/apply";
import { AppearanceProvider } from "@/theme/appearance-provider";
import { brand } from "@/theme/themes";
import "./globals.css";

const outfit = Outfit({ variable: "--font-outfit", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Nutrition",
  description: "Suivi nutritionnel et recettes, 100 % local.",
  applicationName: "Nutrition",
  appleWebApp: { capable: true, title: "Nutrition", statusBarStyle: "default" },
  icons: { icon: "/icons/icon-192.png", apple: "/icons/apple-touch-icon.png" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: brand.paper,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="fr" className={`${outfit.variable} ${geistMono.variable} antialiased`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeBootScript }} />
      </head>
      <body className="min-h-dvh">
        <AppearanceProvider>
          <AppBoot />
          <main className="mx-auto max-w-md px-[22px] pt-[max(env(safe-area-inset-top),24px)] pb-[calc(110px+env(safe-area-inset-bottom))]">
            {children}
          </main>
          <BottomNav />
          <Toaster />
        </AppearanceProvider>
      </body>
    </html>
  );
}
