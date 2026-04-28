import type { Metadata } from "next";

import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { Providers } from "@/components/providers";
import { AppLayout } from "@/components/app/layout/AppLayout";
import { Toaster } from "@/components/ui/toaster";
import { WorkspaceProvider } from "@/contexts/WorkspaceContext";



export const metadata: Metadata = {
  title: "Instantly",
  description: "Unlimited Cold Email Outreach",
  icons: {
    icon: "/favicon.png",
    shortcut: "/favicon.png",
    apple: "/favicon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="font-sans antialiased" suppressHydrationWarning>
        <Providers>
          <ThemeProvider
            attribute="data-theme"
            defaultTheme="dark"
            enableSystem={true}
            disableTransitionOnChange
          >
            <WorkspaceProvider>
              <AppLayout>
                {children}
              </AppLayout>
            </WorkspaceProvider>
            <Toaster />
          </ThemeProvider>
        </Providers>
      </body>
    </html>
  );
}
