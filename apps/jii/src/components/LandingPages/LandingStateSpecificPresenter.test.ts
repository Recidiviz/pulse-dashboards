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

import { hydrationFailure } from "~hydration-utils";

import { getConfig } from "../../configs/US_ME/landingPageConfig/config";
import { RootStore } from "../../datastores/RootStore";
import { LandingStateSpecificPresenter } from "./LandingStateSpecificPresenter";

let rootStore: RootStore;
let presenter: LandingStateSpecificPresenter;

beforeEach(() => {
  rootStore = new RootStore();
});

describe("valid state URL", () => {
  beforeEach(async () => {
    presenter = new LandingStateSpecificPresenter(
      rootStore.loginConfigStore,
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      rootStore.userStore.authManager.authClient!,
      "maine",
    );

    await presenter.hydrate();
  });

  test("copy for state", () => {
    // "test" is not an expected value but it shouldn't actually matter for copy
    expect(presenter.copy).toEqual(getConfig("test").copy);
  });

  test("login with a specific connection", () => {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    vi.spyOn(rootStore.userStore.authManager.authClient!, "logIn");
    vi.stubGlobal("location", { pathname: "/maine" });

    const connection = presenter.selectorOptions[0].value;

    presenter.setSelectedConnection(connection);
    presenter.goToLogin();
    expect(
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      rootStore.userStore.authManager.authClient!.logIn,
    ).toHaveBeenCalledWith({
      targetPath: "/maine",
      connection: connection.connectionName,
    });
  });
});

describe("invalid state URL", () => {
  test("cannot hydrate", async () => {
    presenter = new LandingStateSpecificPresenter(
      rootStore.loginConfigStore,
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      rootStore.userStore.authManager.authClient!,
      "narnia",
    );

    await presenter.hydrate();

    const hydrationError = hydrationFailure(presenter);
    expect(hydrationError).toBeDefined();
    expect(hydrationError).toMatchInlineSnapshot(`[Error: Unknown state URL]`);
  });
});
