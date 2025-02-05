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

import { FC, ReactNode } from "react";

import { Hydratable } from "~hydration-utils";

import ModelHydrator from "../../core/ModelHydrator";

/**
 * In case of error this Hydrator logs to Sentry and renders an error message suitable
 * to serve as the main content of a layout route or component
 */
export const ModelHydratorWithoutLoader: FC<{
  children: ReactNode;
  hydratable: Hydratable;
}> = ({ children, hydratable }) => {
  return (
    <ModelHydrator hydratable={hydratable} loading={null}>
      {children}
    </ModelHydrator>
  );
};
