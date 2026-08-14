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

import Intercom, { shutdown } from "@intercom/messenger-js-sdk";

import { IntercomClient } from "./IntercomClient";

vi.mock("@intercom/messenger-js-sdk");

let client: IntercomClient;

const testUserArgs = {
  stateCode: "US_XX",
  intercomToken: "test-token",
  pseudonymizedId: "test-pseudo",
  externalId: "test-user",
};

describe("without app ID in env", () => {
  beforeEach(() => {
    client = new IntercomClient();
  });

  it("does not call Intercom on init", () => {
    client.init(testUserArgs);
    expect(Intercom).not.toHaveBeenCalled();
  });

  it("does not call shutdown on log out", () => {
    client.init(testUserArgs);
    client.logOut();
    expect(shutdown).not.toHaveBeenCalled();
  });
});

describe("with app ID in env", () => {
  beforeEach(() => {
    vi.stubEnv("VITE_INTERCOM_APP_ID", "intercom-id-test");
    client = new IntercomClient();
  });

  it("calls Intercom with app config and user args on init", () => {
    client.init(testUserArgs);
    expect(Intercom).toHaveBeenCalledWith({
      app_id: "intercom-id-test",
      hide_default_launcher: true,
      state_code: testUserArgs.stateCode,
      external_id: testUserArgs.externalId,
      intercom_user_jwt: testUserArgs.intercomToken,
      user_id: testUserArgs.pseudonymizedId,
    });
  });

  it("does not call shutdown before init has been called", () => {
    client.logOut();
    expect(shutdown).not.toHaveBeenCalled();
  });

  it("calls shutdown on log out after init", () => {
    client.init(testUserArgs);
    client.logOut();
    expect(shutdown).toHaveBeenCalled();
  });
});
