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

import { QueryClient } from "@tanstack/react-query";
import { httpBatchLink } from "@trpc/client";
import { createTRPCReact } from "@trpc/react-query";
import { useState } from "react";
import superjson from "superjson";

import type { UsTnReclassModuleRouter } from "~@modules-server/trpc-types";
import { subrouteScopedLink } from "~trpc-client-utils";

import { useRootStore } from "../../../../../components/StoreProvider";

export const trpc = createTRPCReact<UsTnReclassModuleRouter>();

const ONE_WEEK_MS = 1000 * 60 * 60 * 24 * 7;

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      gcTime: ONE_WEEK_MS,
    },
  },
});

const UsTnReclassTrpcProvider: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  const { userStore } = useRootStore();
  const [trpcClient] = useState(() =>
    trpc.createClient({
      links: [
        subrouteScopedLink("usTnReclass"),
        httpBatchLink({
          // url: "https://modules-staging.recidiviz.org",
          url: "http://localhost:3022",
          transformer: superjson,
          async headers() {
            return {
              Authorization: `Bearer ${await userStore.getToken?.()}`,
            };
          },
        }),
      ],
    }),
  );

  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      {children}
    </trpc.Provider>
  );
};

export default UsTnReclassTrpcProvider;
