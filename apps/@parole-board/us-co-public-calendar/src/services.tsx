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

import { createContext, ReactNode, useContext } from "react";

import type { PageCounts } from "./analytics/pageCounts";
import type { PublicCalendarTrpc } from "./api/client";

/** What the pages need from outside React: the API client and page counts. */
export interface PublicCalendarServices {
  trpc: PublicCalendarTrpc;
  pageCounts: PageCounts;
}

const ServicesContext = createContext<PublicCalendarServices | undefined>(
  undefined,
);

export function PublicCalendarServicesProvider({
  services,
  children,
}: {
  services: PublicCalendarServices;
  children: ReactNode;
}) {
  return (
    <ServicesContext.Provider value={services}>
      {children}
    </ServicesContext.Provider>
  );
}

export function usePublicCalendarServices(): PublicCalendarServices {
  const services = useContext(ServicesContext);
  if (!services) {
    throw new Error(
      "usePublicCalendarServices must be used inside a PublicCalendarServicesProvider",
    );
  }
  return services;
}
