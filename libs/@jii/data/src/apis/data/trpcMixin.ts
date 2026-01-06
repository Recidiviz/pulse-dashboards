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

import { createTRPCClient, httpBatchLink } from "@trpc/client";
import { when } from "mobx";
import superjson from "superjson";

import type { JiiAppRouter } from "~@jii/trpc-types";

import { stateCodeFromCurrentUrl } from "../../utils/stateCodeFromCurrentUrl";
import { JII_BACKEND_PATH } from "./constants";
import { DataAPI } from "./interface";

export function createTrpcClientForApi(apiClient: DataAPI) {
  return createTRPCClient<JiiAppRouter>({
    links: [
      httpBatchLink({
        url: `${JII_BACKEND_PATH}/trpc`,
        headers: async () => {
          await when(() => apiClient.isAuthenticated);
          const Authorization = `Bearer ${await apiClient.getApiToken()}`;

          return {
            Authorization,
            StateCode: stateCodeFromCurrentUrl(),
          };
        },
        // Required to get Date objects to serialize correctly.
        transformer: superjson,
      }),
    ],
  });
}
