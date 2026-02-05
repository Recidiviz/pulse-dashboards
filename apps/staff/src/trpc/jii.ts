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

import { createTRPCClient, httpBatchLink } from "@trpc/client";
import { createTRPCOptionsProxy } from "@trpc/tanstack-react-query";
import superjson from "superjson";

import { JiiStaffAppRouter } from "~@jii/trpc-types";
import { isDemoMode } from "~client-env-utils";
import type { FirebaseAuthClient } from "~firebase-auth";

import { queryClient } from "../reactQuery/client";

type Externals = {
  firebaseAuthClient: FirebaseAuthClient;
  currentTenantId: () => string | undefined;
};

export function createJiiTrpcClient({
  firebaseAuthClient,
  currentTenantId,
}: Externals) {
  const trpcClient = createTRPCClient<JiiStaffAppRouter>({
    links: [
      httpBatchLink({
        url: import.meta.env["VITE_JII_API_URL"],
        headers: async () => {
          return {
            Authorization: `Bearer ${await firebaseAuthClient.getIdToken()}`,
            StateCode: currentTenantId(),
            UseDemoData: `${isDemoMode()}`,
          };
        },
        // Required to get Date objects to serialize correctly.
        transformer: superjson,
      }),
    ],
  });

  return createTRPCOptionsProxy<JiiStaffAppRouter>({
    client: trpcClient,
    queryClient,
  });
}
