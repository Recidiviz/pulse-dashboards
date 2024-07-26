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

import { boot, shutdown, update } from "@intercom/messenger-js-sdk";

import { IntercomClient } from "./IntercomClient";

vi.mock("@intercom/messenger-js-sdk");

let client: IntercomClient;

describe("without app ID in env", () => {
  beforeEach(() => {
    client = new IntercomClient();
  });

  it("does not call boot", () => {
    expect(boot).not.toHaveBeenCalled();
  });

  it("does not call update", () => {
    client.updateUser({
      state_code: "US_XX",
      user_hash: "test-hash",
      user_id: "test-pseudo",
      external_id: "test-user",
    });
    expect(update).not.toHaveBeenCalled();
  });

  it("does not call shutdown", () => {
    client.logOut();
    expect(shutdown).not.toHaveBeenCalled();
  });
});

describe("with app ID in env", () => {
  beforeEach(() => {
    vi.stubEnv("VITE_INTERCOM_APP_ID", "intercom-id-test");
    client = new IntercomClient();
  });

  it("calls boot", () => {
    expect(boot).toHaveBeenCalledWith({
      app_id: "intercom-id-test",
      hide_default_launcher: true,
    });
  });

  it("calls update", () => {
    client.updateUser({
      state_code: "US_XX",
      user_hash: "test-hash",
      user_id: "test-pseudo",
      external_id: "test-user",
    });
    expect(update).toHaveBeenCalledWith({
      user_id: "test-pseudo",
      state_code: "US_XX",
      user_hash: "test-hash",
      external_id: "test-user",
    });
  });

  it("calls shutdown", () => {
    client.logOut();
    expect(shutdown).toHaveBeenCalled();
  });
});
