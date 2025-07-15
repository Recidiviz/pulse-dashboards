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

import { render } from "@testing-library/react";
import { configure } from "mobx";
import { MemoryRouter } from "react-router-dom";

import { AuthClient } from "~auth";
import { AuthorizedUserProfile } from "~auth0-jii";
import { allResidents } from "~datatypes";

import { App } from "../../../components/App/App";
import * as hooks from "../../../components/StoreProvider/useRootStore";
import { RootStore } from "../../../datastores/RootStore";

/**
 * Renders the entire route tree defined in {@link App}, setting current route
 * to the path provided.
 * @returns the RenderResult from testing-library
 */
export function renderAtRoute(currentRoute: string) {
  return render(
    <MemoryRouter initialEntries={[currentRoute]}>
      <App />
    </MemoryRouter>,
  );
}

export function mockUnauthorized() {
  return vi
    .spyOn(AuthClient.prototype, "isAuthorized", "get")
    .mockReturnValue(false);
}

export function mockAuthorized({
  stateCode = "US_ME",
  userOverrides,
}: {
  stateCode?: string;
  userOverrides?: Partial<AuthorizedUserProfile>;
} = {}) {
  configure({ safeDescriptors: false });
  onTestFinished(() => {
    configure({ safeDescriptors: true });
  });

  const rootStore = new RootStore();
  vi.spyOn(hooks, "useRootStore").mockReturnValue(rootStore);

  const residentFixture = allResidents.filter(
    (r) => r.stateCode === stateCode,
  )[0];
  const personPseudoId = residentFixture.pseudonymizedId;

  vi.spyOn(rootStore.userStore.authManager, "authState", "get").mockReturnValue(
    {
      status: "authorized",
      userProfile: {
        stateCode,
        externalId: residentFixture.personExternalId,
        pseudonymizedId: personPseudoId,
        ...userOverrides,
      },
    },
  );

  return { rootStore, residentFixture, personPseudoId };
}
