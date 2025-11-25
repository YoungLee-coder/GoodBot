import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { isAppInitialized } from "@/lib/settings";
import { isAuthenticated } from "@/lib/auth";
import { LanguageProvider } from "@/components/language-provider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "GoodBot",
  description: "Telegram Bot Manager",
};

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const initialized = await isAppInitialized();
  const authenticated = await isAuthenticated();

  // 如果未初始化，只允许访问 setup 页面
  if (!initialized) {
    return (
      <html lang="en">
        <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
          <LanguageProvider>
            <main>{children}</main>
          </LanguageProvider>
        </body>
      </html>
    );
  }

  // 如果已初始化但未登录，显示登录页面
  if (!authenticated) {
    return (
      <html lang="en">
        <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
          <LanguageProvider>
            <main>{children}</main>
          </LanguageProvider>
        </body>
      </html>
    );
  }

  // 已登录，显示完整界面
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <LanguageProvider>
          <SidebarProvider>
            <AppSidebar />
            <main className="w-full">
              <div className="p-4">
                <SidebarTrigger />
                {children}
              </div>
            </main>
          </SidebarProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
