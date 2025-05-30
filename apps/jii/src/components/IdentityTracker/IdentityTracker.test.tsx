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

import { render } from "@testing-library/react";
import { configure } from "mobx";

import { RootStore } from "../../datastores/RootStore";
import * as hooks from "../StoreProvider/useRootStore";
import { IdentityTracker } from "./IdentityTracker";

let rootStore: RootStore;

beforeEach(async () => {
  configure({ safeDescriptors: false });
  rootStore = new RootStore();
  vi.spyOn(hooks, "useRootStore").mockReturnValue(rootStore);
});

test("side effect", () => {
  vi.spyOn(rootStore.userStore.authManager, "authState", "get").mockReturnValue(
    {
      status: "authorized",
      userProfile: {
        stateCode: "US_ME",
        externalId: "123456",
        pseudonymizedId: "test-pid",
      },
    },
  );

  vi.spyOn(rootStore.userStore, "identifyToTrackers");

  render(<IdentityTracker />);

  expect(rootStore.userStore.identifyToTrackers).toHaveBeenCalled();
});
