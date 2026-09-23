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

import { RootStore } from "..";
import { resetOnTenantOrUserChange } from "../resetOnTenantOrUserChange";

describe("resetOnTenantOrUserChange", () => {
  let rootStore: RootStore;
  let onReset: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    rootStore = new RootStore();
    rootStore.tenantStore.currentTenantId = "US_CO";
    onReset = vi.fn();
    resetOnTenantOrUserChange(rootStore, onReset);
  });

  it("does not fire before anything changes", () => {
    expect(onReset).not.toHaveBeenCalled();
  });

  it("fires when the tenant changes", () => {
    rootStore.tenantStore.currentTenantId = "US_ID";

    expect(onReset).toHaveBeenCalledTimes(1);
  });

  it("fires when the user's identity changes", () => {
    rootStore.userStore.user = { email: "user@example.com" };
    rootStore.userStore.user = { email: "impersonated@example.com" };

    expect(onReset).toHaveBeenCalledTimes(2);
  });

  // Auth0 rehydrates the app_metadata claim shortly after login: a new user
  // object with new nested references but identical content. Without
  // structural comparison this resets every populated store on each login.
  it("does not fire when the user is replaced with identical content", () => {
    const identicalUser = () => ({
      email: "user@example.com",
      "https://dashboard.recidiviz.org/app_metadata": { stateCode: "US_CO" },
    });
    rootStore.userStore.user = identicalUser();
    onReset.mockClear();

    rootStore.userStore.user = identicalUser();

    expect(onReset).not.toHaveBeenCalled();
  });

  it("stops firing once disposed", () => {
    const dispose = resetOnTenantOrUserChange(rootStore, onReset);
    dispose();

    rootStore.tenantStore.currentTenantId = "US_ID";

    // Only the reaction created in beforeEach is still live.
    expect(onReset).toHaveBeenCalledTimes(1);
  });
});
