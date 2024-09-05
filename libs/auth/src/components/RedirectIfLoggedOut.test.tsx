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

import { render, screen, waitFor } from "@testing-library/react";
import { configure } from "mobx";
import { useNavigate } from "react-router-dom";
import { z } from "zod";

import { AuthClient } from "../models/AuthClient";
import { RedirectIfLoggedOut } from "./RedirectIfLoggedOut";

vi.mock("react-router-dom");
const mockNavigate = vi.fn();

let client: AuthClient;

const redirectTarget = "/test/path";

beforeEach(() => {
  configure({ safeDescriptors: false });

  client = new AuthClient(
    { client_id: "test", domain: "test" },
    { metadataNamespace: "Foo", metadataSchema: z.any() },
  );
  vi.mocked(useNavigate).mockReturnValue(mockNavigate);
});

afterEach(() => {
  configure({ safeDescriptors: true });
});

test("authorized", () => {
  vi.spyOn(client, "checkForAuthentication").mockResolvedValue(true);
  vi.spyOn(client, "isAuthorized", "get").mockReturnValue(true);
  mockNavigate.mockImplementation(() => {
    throw new Error("mockNavigate should not have be called");
  });

  render(
    <RedirectIfLoggedOut authClient={client} to={redirectTarget}>
      <div>protected content</div>
    </RedirectIfLoggedOut>,
  );

  expect(screen.getByText("protected content")).toBeInTheDocument();
  expect(client.checkForAuthentication).toHaveBeenCalled();
});

test("unauthorized", async () => {
  vi.spyOn(client, "checkForAuthentication").mockResolvedValue(false);
  vi.spyOn(client, "isAuthorized", "get").mockReturnValue(false);

  render(
    <RedirectIfLoggedOut authClient={client} to={redirectTarget}>
      <div>protected content</div>
    </RedirectIfLoggedOut>,
  );

  expect(screen.queryByText("protected content")).not.toBeInTheDocument();
  expect(screen.getByText("Loading data...")).toBeInTheDocument();
  expect(client.checkForAuthentication).toHaveBeenCalled();
  await waitFor(() =>
    expect(mockNavigate).toHaveBeenCalledWith(redirectTarget),
  );
});

test("needs email verification", () => {
  vi.spyOn(client, "checkForAuthentication").mockResolvedValue(true);
  vi.spyOn(client, "isAuthorized", "get").mockReturnValue(false);
  vi.spyOn(client, "isEmailVerificationRequired", "get").mockReturnValue(true);

  render(
    <RedirectIfLoggedOut authClient={client} to={redirectTarget}>
      <div>protected content</div>
    </RedirectIfLoggedOut>,
  );

  expect(screen.queryByText("protected content")).not.toBeInTheDocument();
  expect(screen.getByText("Please verify your email")).toBeInTheDocument();
});
