import AuthGate from "@/components/auth-gate";
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
  title: "Hashem-Budget",
  description: "مدیریت مالی شخصی",
  manifest: "/manifest.json",
  icons: { icon: "/icon.svg" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#12b76a",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="fa" dir="rtl" className={font.variable}>
      <body className={cn("relative isolate dark:bg-gray-900")}>
        <ThemeProvider>
          <AuthGate>
            <FinanceProvider>
              <DirectionProvider direction="rtl">
                <TooltipProvider>{children}</TooltipProvider>
              </DirectionProvider>
            </FinanceProvider>
          </AuthGate>
        </ThemeProvider>
      </body>
    </html>
  );
}
