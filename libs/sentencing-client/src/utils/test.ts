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

import { PSIStore } from "../datastores/PSIStore";

export const createMockRootStore = (userPseudoIdOverride?: string | null) => {
  const mockRootStore = {
    userStore: {
      userPseudoId:
        userPseudoIdOverride === null
          ? undefined
          : userPseudoIdOverride ?? "TestID-123",
      getToken: () => Promise.resolve("auth0-token"),
    },
  };
  return mockRootStore;
};

export const createMockPSIStore = (options?: {
  userPseudoIdOverride?: string | null;
  hideApiUrl?: boolean;
}) => {
  import.meta.env["VITE_SENTENCING_API_URL"] = options?.hideApiUrl
    ? undefined
    : "mockUrl";

  const mockRootStore = createMockRootStore(options?.userPseudoIdOverride);
  const psiStore = new PSIStore(mockRootStore);
  return psiStore;
};
