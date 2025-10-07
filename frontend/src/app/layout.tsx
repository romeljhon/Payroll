import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from "@/components/theme-provider";
import { ReactQueryProvider } from '@/lib/react-query-provider';
import Aurora from '@/components/auth/Aurora';
import { SubscriptionProvider } from '@/hooks/use-subscription';
import { RolesAndPermissionsProvider } from '@/hooks/roles-and-permissions';

export const metadata: Metadata = {
  title: 'KazuPay Solutions - Payroll Management System',
  description: 'Efficient and easy payroll management by KazuPay Solutions .',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <ReactQueryProvider>
            <SubscriptionProvider>
              <RolesAndPermissionsProvider>
                {children}
                <Toaster />
              </RolesAndPermissionsProvider>
            </SubscriptionProvider>
          </ReactQueryProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
