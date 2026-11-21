import { TooltipProvider } from "@/components/ui/tooltip";
import { FinanceProvider } from "@/context/finance-context";
import { ThemeProvider } from "@/context/theme-context";
import { cn } from "@/utils";
import { DirectionProvider } from "@base-ui/react/direction-provider";
import "flatpickr/dist/flatpickr.css";
import type { Metadata, Viewport } from "next";
import { Vazirmatn } from "next/font/google";
import "simplebar-react/dist/simplebar.min.css";
import "swiper/css/bundle";
import "./globals.css";

const font = Vazirmatn({ subsets: ["arabic", "latin"], variable: "--font-vazirmatn" });

export const metadata: Metadata = {
  title: "حساب",
  description: "مدیریت مالی شخصی",
  manifest: "/manifest.json",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#f5f6f8",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="fa" dir="rtl" className={font.variable}>
      <body className={cn("relative isolate dark:bg-gray-900")}>
        <ThemeProvider>
          <FinanceProvider>
            <DirectionProvider direction="rtl">
              <TooltipProvider>{children}</TooltipProvider>
            </DirectionProvider>
          </FinanceProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
