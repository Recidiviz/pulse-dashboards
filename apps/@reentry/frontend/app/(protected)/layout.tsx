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

"use client";
import { usePathname } from "next/navigation";

import AccessDeniedState from "~@reentry/frontend/components/auth/AccessDeniedState";
import AuthErrorState from "~@reentry/frontend/components/auth/AuthErrorState";
import LoadingState from "~@reentry/frontend/components/auth/LoadingState";
import Navbar from "~@reentry/frontend/components/Navbar/Navbar";
import ReadOnlyIndicatorBanner from "~@reentry/frontend/components/ReadOnlyIndicatorBanner";
import { useAuth } from "~@reentry/frontend/lib/auth/authContext";
import {
  hasCPAPermission,
  isInternalUser,
} from "~@reentry/frontend/lib/auth/permissions";
import { ProtectedRoute } from "~@reentry/frontend/lib/auth/routeGuards";

export default function ProtectedLayout({ children }) {
  const auth = useAuth();
  const pathname = usePathname();
  const userEmail = auth.authStore?.user?.email;

  // Exclude specific routes from the layout (not using the Navbar)
  const routesWithoutLayout = ["/audio-recording/"];
  const shouldHideLayout = routesWithoutLayout.some((route) =>
    pathname.includes(route)
  );

  if (auth.state.isLoading) {
    return <LoadingState />;
  }

  if (auth.state.error) {
    return <AuthErrorState />;
  }

  if (!auth.authStore) {
    return <LoadingState />;
  }

  if (!auth.state.isAuthorized) {
    return <AccessDeniedState />;
  }

  if (!hasCPAPermission(auth.userAppMetadata) && !isInternalUser(userEmail)) {
    return <AccessDeniedState />;
  }

  if (shouldHideLayout) {
    return (
      <main className="flex flex-col min-h-full">
        <ProtectedRoute>{children}</ProtectedRoute>
      </main>
    );
  }

  return (
    <>
      <main className="flex flex-col min-h-full">
        <ReadOnlyIndicatorBanner />
        <Navbar />
        <ProtectedRoute>{children}</ProtectedRoute>
      </main>
    </>
  );
}
