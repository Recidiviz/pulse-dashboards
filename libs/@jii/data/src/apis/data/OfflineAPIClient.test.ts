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

import { residentsConfigByState } from "~@jii/configs";

import { RootStore } from "../../datastores/RootStore";
import { OfflineAPIClient } from "./OfflineAPIClient";

let api: OfflineAPIClient;

const stateCodeMock = "US_AZ";

beforeEach(() => {
  const authManager = new RootStore().userStore.authManager;
  api = new OfflineAPIClient({ authManager });
});

test("local config object", async () => {
  const expectedConfig = residentsConfigByState.US_AZ;

  const fetched = await api.residentsConfig(stateCodeMock);

  expect(fetched).toEqual(expectedConfig);
});
