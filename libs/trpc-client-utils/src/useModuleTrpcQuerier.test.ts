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

import {
  initModuleTrpcClients,
  useModuleTrpcQuerier,
} from "./useModuleTrpcQuerier";

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false, gcTime: 0 } },
});

describe("useModuleTrpcQuerier", () => {
  it("throws if settings are not initialized", () => {
    expect(() => useModuleTrpcQuerier("UserSettings")).toThrowError(
      "Settings uninitialized. Call initModuleTrpcClients() first.",
    );
  });

  describe("singleton properties", () => {
    beforeEach(() => {
      initModuleTrpcClients({
        url: "fake_url",
        queryClient,
        tokenStore: {
          async getToken() {
            return "fake_token";
          },
        },
      });
    });

    it("creates a singleton client for a module", () => {
      const clientA = useModuleTrpcQuerier("UserSettings");
      const clientB = useModuleTrpcQuerier("UserSettings");

      expect(clientA).toBe(clientB);
    });

    it("creates a different clients for each module", () => {
      const clientA = useModuleTrpcQuerier("UserSettings");
      const clientB = useModuleTrpcQuerier("Calendar");

      expect(clientA).not.toBe(clientB);
    });

    it("creates different singletons for local and remote servers", () => {
      const localA = useModuleTrpcQuerier("UserSettings", true);
      const localB = useModuleTrpcQuerier("UserSettings", true);

      const remoteA = useModuleTrpcQuerier("UserSettings", false);
      const remoteB = useModuleTrpcQuerier("UserSettings", false);

      expect(localA).toBe(localB);
      expect(remoteA).toBe(remoteB);
      expect(localA).not.toBe(remoteA);
    });
  });
});
