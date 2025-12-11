// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2025 Recidiviz, Inc.
//
// This program is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
//
// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.
//
// You should have received a copy of the GNU General Public License
// along with this program.  If not, see <https://www.gnu.org/licenses/>.
// =============================================================================

import "./globals.css";

import { AppRouterCacheProvider } from "@mui/material-nextjs/v14-appRouter";
import { GoogleAnalytics } from "@next/third-parties/google";
import type { Metadata } from "next";
import localFont from "next/font/local";
import { ToastContainer } from "react-toastify";

import { AuthUserCapabilitiesProvider } from "~@reentry/frontend/contexts/AuthUserCapabilitiesContext";
import { AuthProvider } from "~@reentry/frontend/lib/auth/authContext";
import { TrpcReactQueryProvider } from "~@reentry/frontend/trpc/TrpcReactQueryProvider";
import { QueryProvider } from "~@reentry/frontend-shared";

import { AnalyticsProvider } from "./contexts/AnalyticsProvider";
import { IntakeIntegrationProvider } from "./contexts/IntakeIntegrationProvider";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});
const publicSans = localFont({
  src: "./fonts/Public_Sans/PublicSans-VariableFont_wght.ttf",
  variable: "--font-public-sans",
  weight: "400 700",
});

export const metadata: Metadata = {
  title: "Recidiviz",
  description: "Recidiviz app",
  // This ensures that even if a search engine discovers the page (e.g., through links or direct access), it will not index it.
  // same as <meta name="robots" content="noindex, nofollow">
  robots: {
    index: false, // Prevent indexing
    follow: false, // Prevent following links
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${publicSans.variable} ${geistSans.variable} ${geistMono.variable} antialiased h-screen`}
      >
        <QueryProvider>
          <AppRouterCacheProvider>
            <AuthProvider>
              <AuthUserCapabilitiesProvider>
                <AnalyticsProvider
                  writeKey={process.env["NEXT_PUBLIC_SEGMENT_WRITE_KEY"]}
                >
                  <TrpcReactQueryProvider>
                    <IntakeIntegrationProvider>
                      {children}
                    </IntakeIntegrationProvider>
                    {process.env["NEXT_PUBLIC_GA_ID"] && (
                      <GoogleAnalytics
                        gaId={process.env["NEXT_PUBLIC_GA_ID"]}
                      />
                    )}
                  </TrpcReactQueryProvider>
                </AnalyticsProvider>
              </AuthUserCapabilitiesProvider>
            </AuthProvider>
            <ToastContainer />
          </AppRouterCacheProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
