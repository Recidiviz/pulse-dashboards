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

import { OfflineAPIClient } from "../api/OfflineAPIClient";
import { ResidentsStore } from "./ResidentsStore";
import { RootStore } from "./RootStore";

vi.mock("../api/OfflineAPIClient");
vi.mock("./ResidentsStore");

let store: RootStore;

beforeEach(() => {
  store = new RootStore();
});

test("offline api client", () => {
  expect(OfflineAPIClient).toHaveBeenCalledWith(store);
});

test("residents datastore", () => {
  expect(ResidentsStore).toHaveBeenCalledWith(store);
});
