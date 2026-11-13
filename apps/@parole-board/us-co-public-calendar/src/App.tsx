// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2026 Recidiviz, Inc.
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

import { QueryClientProvider } from "@tanstack/react-query";
import { lazy } from "react";
import { Route, Routes, useLocation } from "react-router-dom";

import {
  PublicCalendarLoadError,
  PublicCalendarSkeleton,
  SuspenseBoundary,
} from "~@parole-board/common";
import { GlobalStyle } from "~design-system";

import {
  type PublicCalendarServices,
  PublicCalendarServicesProvider,
} from "./services";

const LandingPage = lazy(() => import("./pages/LandingPage"));
const MonthPage = lazy(() => import("./pages/MonthPage"));
const NotFoundPage = lazy(() =>
  import("./pages/MonthPage").then((module) => ({
    default: module.NotFoundPage,
  })),
);

/**
 * The page's routes in one SuspenseBoundary: the skeleton while a page's code
 * or its month loads, and the load error if either fails. A new address
 * clears the error.
 */
function PublicCalendarRoutes() {
  const { pathname } = useLocation();
  return (
    <SuspenseBoundary
      fallback={<PublicCalendarSkeleton />}
      renderError={() => <PublicCalendarLoadError />}
      resetKeys={[pathname]}
    >
      <Routes>
        <Route index element={<LandingPage />} />
        <Route path=":month" element={<MonthPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </SuspenseBoundary>
  );
}

/**
 * Colorado's public Parole Board hearing calendar: one published month per
 * address, read from the Modules server with no sign-in. Render it inside a
 * router.
 */
export function App({ services }: { services: PublicCalendarServices }) {
  return (
    <PublicCalendarServicesProvider services={services}>
      <QueryClientProvider client={services.trpc.queryClient}>
        <GlobalStyle />
        <PublicCalendarRoutes />
      </QueryClientProvider>
    </PublicCalendarServicesProvider>
  );
}
