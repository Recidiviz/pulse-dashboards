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

import { flowResult } from "mobx";

import { OfflineAPIClient } from "../apis/data/OfflineAPIClient";
import { residentsConfigByState } from "../configs/residentsConfig";
import { RootStore } from "./RootStore";

let store: RootStore;

beforeEach(() => {
  store = new RootStore();
});

test("initialize residents datastore", async () => {
  vi.spyOn(OfflineAPIClient.prototype, "residentsConfig");
  vi.spyOn(store.translationStore, "updateI18n");

  expect(store.residentsStore).toBeUndefined();

  await flowResult(store.populateResidentsStore("US_MA"));

  expect(store.residentsStore).toBeDefined();
  expect(store.apiClient.residentsConfig).toHaveBeenCalledWith("US_MA");
  expect(store.residentsStore?.config).toEqual(residentsConfigByState.US_MA);

  expect(store.translationStore.updateI18n).toHaveBeenCalledWith(
    residentsConfigByState.US_MA.translation,
  );
});
