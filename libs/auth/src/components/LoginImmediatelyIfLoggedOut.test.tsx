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

import { render, screen } from "@testing-library/react";
import { configure } from "mobx";

import { AuthClient } from "../models/AuthClient";
import { LoginImmediatelyIfLoggedOut } from "./LoginImmediatelyIfLoggedOut";

let client: AuthClient;

beforeEach(() => {
  configure({ safeDescriptors: false });

  client = new AuthClient({ client_id: "test", domain: "test" });
  vi.spyOn(client, "logInIfLoggedOut").mockImplementation(vi.fn());
});

afterEach(() => {
  configure({ safeDescriptors: true });
});

test("authorized", () => {
  vi.spyOn(client, "isAuthorized", "get").mockReturnValue(true);

  render(
    <LoginImmediatelyIfLoggedOut authClient={client}>
      <div>protected content</div>
    </LoginImmediatelyIfLoggedOut>,
  );

  expect(client.logInIfLoggedOut).toHaveBeenCalled();
  expect(screen.getByText("protected content")).toBeInTheDocument();
});

test("unauthorized", () => {
  vi.spyOn(client, "isAuthorized", "get").mockReturnValue(false);

  render(
    <LoginImmediatelyIfLoggedOut authClient={client}>
      <div>protected content</div>
    </LoginImmediatelyIfLoggedOut>,
  );

  expect(screen.queryByText("protected content")).not.toBeInTheDocument();
  expect(screen.getByText("Loading data...")).toBeInTheDocument();
});

test("needs email verification", () => {
  vi.spyOn(client, "isAuthorized", "get").mockReturnValue(false);
  vi.spyOn(client, "isEmailVerificationRequired", "get").mockReturnValue(true);

  render(
    <LoginImmediatelyIfLoggedOut authClient={client}>
      <div>protected content</div>
    </LoginImmediatelyIfLoggedOut>,
  );

  expect(screen.queryByText("protected content")).not.toBeInTheDocument();
  expect(screen.getByText("Please verify your email")).toBeInTheDocument();
});
