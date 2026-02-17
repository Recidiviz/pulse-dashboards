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

import { useRootStore } from "~@jii/data";
import { EdovoAuthHandler } from "~@jii/data";
import { HydratorWithErrorMessage } from "~hydration-utils";

import { ErrorPage } from "../ErrorPage/ErrorPage";
import { EdovoUnknownUserError } from "../UnknownUserError/EdovoUnknownUserError";

/**
 * Hydrator component with some special logic for handling AuthManager errors.
 * Certain known errors trigger dedicated components that are more user-friendly,
 * and errors in general are not logged to Sentry because they typically represent
 * access denials rather than actual bugs. (Whatever happened during the auth flow
 * should be captured in other logs for troubleshooting if needed.)
 */
export const AuthManagerHydrator: FC<{ children: ReactNode }> = ({
  children,
}) => {
  const {
    userStore: { authManager },
  } = useRootStore();

  return (
    <HydratorWithErrorMessage
      hydratable={authManager}
      fallback={
        authManager.handler instanceof EdovoAuthHandler
          ? EdovoUnknownUserError
          : ErrorPage
      }
    >
      {children}
    </HydratorWithErrorMessage>
  );
};
