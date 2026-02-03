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

import { FC, memo, ReactNode } from "react";

import { useRootStore } from "~@jii/data";
import {
  ApplicationContextProvider,
  createApiClient,
  createSocket,
} from "~@reentry/frontend-shared";

import {
  REENTRY_BACKEND_PATH,
  REENTRY_DEV_BACKEND_PATH,
} from "../../constants";
import { Image } from "../Image";

/**
 * Provides the application context required by the shared CPA components
 */
export const IntakeIntegrationProvider: FC<{ children: ReactNode }> = memo(
  function IntakeIntegrationProvider({ children }) {
    const {
      userStore: { segmentClient, hasPermission },
    } = useRootStore();

    // client SDKs want a fully qualified URL, not just an absolute path. A proxy will handle this.
    const REENTRY_BACKEND_URL = `${window.location.origin}${hasPermission("live_data") ? REENTRY_BACKEND_PATH : REENTRY_DEV_BACKEND_PATH}`;

    const socket = createSocket(REENTRY_BACKEND_URL);
    const $api = createApiClient(REENTRY_BACKEND_URL);

    const applicationContext = { socket, $api, Image };

    return (
      <ApplicationContextProvider
        value={{
          ...applicationContext,
          analytics: segmentClient,
          features: { enableSTT: false },
        }}
      >
        {children}
      </ApplicationContextProvider>
    );
  },
);
