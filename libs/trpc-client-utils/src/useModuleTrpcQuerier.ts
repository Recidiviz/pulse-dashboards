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

import type { QueryClient } from "@tanstack/react-query";
import { createTRPCClient, httpBatchLink } from "@trpc/client";
import type { TRPCBuiltRouter } from "@trpc/server";
import {
  createTRPCOptionsProxy,
  type TRPCOptionsProxy,
} from "@trpc/tanstack-react-query";
import superjson from "superjson";

import type {
  AppRouter,
  CalendarRouter,
  UserSettingsRouter,
  UsTnReclassModuleRouter,
} from "~@modules-server/trpc-types";

import { subrouteScopedLink } from "./subrouteScopedLink";

const LOCAL_URL = "http://localhost:3022";

type ModuleTrpcSettings = {
  url: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  tokenStore: { getToken?: () => Promise<any> | undefined };
  queryClient: QueryClient;
};

type ModuleRouter = TRPCBuiltRouter<
  AppRouter["_def"]["_config"]["$types"], // router config should be common
  Record<never, never> // but the procedures can be anything
>;

type RouterByModule = {
  UsTnReclassification: UsTnReclassModuleRouter;
  Calendar: CalendarRouter;
  UserSettings: UserSettingsRouter;
};

type ModuleName = keyof RouterByModule;
type BackendLocation = "local" | "deployed";
type ModuleTrpcClient<Module extends ModuleName> = TRPCOptionsProxy<
  RouterByModule[Module],
  { keyPrefix: true }
>;

// Store settings and previously generated clients
// This factory is a singleton per app, so we only need once global instance of these as well
let SETTINGS: ModuleTrpcSettings;
const MODULE_CLIENTS: {
  [Module in ModuleName]?: Partial<
    Record<BackendLocation, ModuleTrpcClient<Module>>
  >;
} = {};

export function initModuleTrpcClients(settings: ModuleTrpcSettings) {
  SETTINGS = settings;
}

export function useModuleTrpcQuerier<Module extends ModuleName>(
  moduleName: Module,
  useLocalInstance = false,
): ModuleTrpcClient<Module> {
  if (SETTINGS === undefined) {
    throw new Error(
      "Settings uninitialized. Call initModuleTrpcClients() first.",
    );
  }

  const { url, tokenStore, queryClient } = SETTINGS;
  const location = useLocalInstance ? "local" : "deployed";

  if (MODULE_CLIENTS[moduleName]?.[location])
    return MODULE_CLIENTS[moduleName][location];

  const baseClient = createTRPCClient<RouterByModule[Module]>({
    links: [
      subrouteScopedLink(moduleName),
      httpBatchLink<ModuleRouter>({
        url: useLocalInstance ? LOCAL_URL : url,
        transformer: superjson,
        async headers() {
          return {
            Authorization: `Bearer ${await tokenStore.getToken?.()}`,
          };
        },
      }),
    ],
  });

  const proxyClient = createTRPCOptionsProxy<
    RouterByModule[Module],
    { keyPrefix: true }
  >({
    client: baseClient,
    queryClient,
    keyPrefix: moduleName,
  });

  if (MODULE_CLIENTS[moduleName] === undefined) MODULE_CLIENTS[moduleName] = {};

  MODULE_CLIENTS[moduleName][location] = proxyClient;

  return proxyClient;
}
