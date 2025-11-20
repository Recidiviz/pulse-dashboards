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

import Navbar from "~@reentry/frontend/components/Navbar/Navbar";
import { ProtectedRoute } from "~@reentry/frontend/lib/auth/routeGuards";

export default function ProtectedLayout({ children }) {
  const pathname = usePathname();

  // Exclude specific routes from the layout (not using the Navbar)
  const routesWithoutLayout = ["/clients/audio-recording"];
  const shouldHideLayout = routesWithoutLayout.some((route) =>
    pathname.startsWith(route),
  );
  if (shouldHideLayout) {
    return (
      <main className="flex flex-col h-full">
        <ProtectedRoute>{children}</ProtectedRoute>
      </main>
    );
  }

  return (
    <>
      <main className="flex flex-col h-full">
        <Navbar />
        <ProtectedRoute>{children}</ProtectedRoute>
      </main>
    </>
  );
}
