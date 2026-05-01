import type { Metadata } from "next";

import localFont from "next/font/local";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { Providers } from "@/components/providers";
import { AppLayout } from "@/components/app/layout/AppLayout";
import { Toaster } from "@/components/ui/toaster";
import { WorkspaceProvider } from "@/contexts/WorkspaceContext";

const averta = localFont({
  src: [
    {
      path: "../public/fonts/Averta/Averta.otf",
      weight: "400",
      style: "normal",
    },
    {
      path: "../public/fonts/Averta/Averta-Semibold.otf",
      weight: "600",
      style: "normal",
    },
  ],
  variable: "--font-averta",
});



export const metadata: Metadata = {
  title: "Instantly",
  description: "Unlimited Cold Email Outreach",
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon.ico",
    apple: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className={averta.variable}>
      <body className={`${averta.className} font-sans antialiased`} suppressHydrationWarning>
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
