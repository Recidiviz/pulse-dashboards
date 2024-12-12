// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2024 Recidiviz, Inc.
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

import { FC, ReactNode } from "react";

import { Hydratable, HydratorWithErrorLogging } from "~hydration-utils";

import { ErrorPage } from "../ErrorPage/ErrorPage";

/**
 * In case of error this Hydrator logs to Sentry and renders an error page with its own PageLayout.
 * Intended mainly for hydrating routes that are not nested under a layout route.
 */
export const PageHydrator: FC<{
  children: ReactNode;
  hydratable: Hydratable;
}> = ({ children, hydratable }) => {
  return (
    <HydratorWithErrorLogging hydratable={hydratable} fallback={ErrorPage}>
      {children}
    </HydratorWithErrorLogging>
  );
};
