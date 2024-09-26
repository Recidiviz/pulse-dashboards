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

import { captureException } from "@sentry/react";
import { render, screen } from "@testing-library/react";
import { useNavigate } from "react-router-dom";
import { MockInstance } from "vitest";
import { z } from "zod";

import { AuthClient } from "../models/AuthClient";
import { HandleRedirectAfterLogin } from "./HandleRedirectAfterLogin";

vi.mock("@sentry/react");
vi.mock("react-router-dom");

let client: AuthClient;
let handlerSpy: MockInstance;
const navigateMock = vi.fn();

beforeEach(() => {
  client = new AuthClient(
    { client_id: "test", domain: "test" },
    { metadataNamespace: "Foo", metadataSchema: z.any() },
  );

  handlerSpy = vi
    .spyOn(client, "handleRedirectFromLogin")
    .mockResolvedValue(undefined);

  vi.mocked(useNavigate).mockReturnValue(navigateMock);
});

test("handle redirect", async () => {
  render(<HandleRedirectAfterLogin authClient={client} />);

  expect(handlerSpy).toHaveBeenCalledWith(navigateMock, undefined);
  expect(screen.getByText("Loading data...")).toBeInTheDocument();
});

test("override default path", () => {
  render(
    <HandleRedirectAfterLogin authClient={client} defaultRedirectPath="/foo" />,
  );

  expect(handlerSpy).toHaveBeenCalledWith(navigateMock, "/foo");
});

test("error during handling", async () => {
  handlerSpy.mockRejectedValue("test");

  render(<HandleRedirectAfterLogin authClient={client} />);

  expect(
    await screen.findByRole("heading", { name: "Authorization required" }),
  ).toBeInTheDocument();

  expect(captureException).toHaveBeenCalledWith("test");
});
