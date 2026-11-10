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

import type { CreateFastifyContextOptions } from "@trpc/server/adapters/fastify";

import { IDAHO_TH_ACTIVE_PROVIDER_HEADER } from "~@idaho-th/shared";
import { APP_METADATA_KEY, USER_ROLE } from "~@idaho-th/trpc/auth/constants";
import { createContext } from "~@idaho-th/trpc/context";
import { verifyAuth0Token } from "~server-setup-plugin";

vi.mock("~server-setup-plugin", () => ({
  verifyAuth0Token: vi.fn(),
}));

const verifyAuth0TokenMock = vi.mocked(verifyAuth0Token);

function fastifyOptions(headers: Record<string, string | string[]> = {}) {
  return {
    req: { id: "request-1", headers },
    res: {},
  } as unknown as CreateFastifyContextOptions;
}

function auth0Payload(role: string, pseudonymizedId: unknown) {
  return { [APP_METADATA_KEY]: { role, pseudonymizedId } };
}

describe("createContext", () => {
  it("attaches the staff identity when the token resolves to a staff user", async () => {
    verifyAuth0TokenMock.mockResolvedValue(
      auth0Payload(USER_ROLE.STAFF, "staff-pseudo-1"),
    );

    const context = await createContext(fastifyOptions());

    expect(context).toMatchObject({
      isAuthorized: true,
      role: USER_ROLE.STAFF,
      staffPseudonymizedId: "staff-pseudo-1",
      providerPseudonymizedId: undefined,
    });
    expect(context.prisma).toBeDefined();
  });

  it("attaches the provider identity when the token resolves to a provider", async () => {
    verifyAuth0TokenMock.mockResolvedValue(
      auth0Payload(USER_ROLE.PROVIDER, "provider-pseudo-1"),
    );

    const context = await createContext(fastifyOptions());

    expect(context).toMatchObject({
      isAuthorized: true,
      role: USER_ROLE.PROVIDER,
      staffPseudonymizedId: undefined,
      providerPseudonymizedId: "provider-pseudo-1",
    });
  });

  it("is unauthorized with no identity when the token fails verification", async () => {
    verifyAuth0TokenMock.mockResolvedValue(undefined);

    const context = await createContext(fastifyOptions());

    expect(context).toMatchObject({
      isAuthorized: false,
      role: undefined,
      staffPseudonymizedId: undefined,
      providerPseudonymizedId: undefined,
    });
  });

  it("stays authorized but role-less when the payload has no usable app metadata", async () => {
    verifyAuth0TokenMock.mockResolvedValue({ sub: "auth0|abc" });

    const context = await createContext(fastifyOptions());

    // A verified token still authenticates the request; the role gates in
    // init.ts are what stop it from reaching any staff or provider procedure.
    expect(context).toMatchObject({
      isAuthorized: true,
      role: undefined,
      staffPseudonymizedId: undefined,
      providerPseudonymizedId: undefined,
    });
  });

  it("ignores an unknown role", async () => {
    verifyAuth0TokenMock.mockResolvedValue(
      auth0Payload("SUPERUSER", "pseudo-1"),
    );

    const context = await createContext(fastifyOptions());

    expect(context.role).toBeUndefined();
  });

  it("ignores a payload whose pseudonymized id is missing", async () => {
    verifyAuth0TokenMock.mockResolvedValue(
      auth0Payload(USER_ROLE.STAFF, undefined),
    );

    const context = await createContext(fastifyOptions());

    expect(context.role).toBeUndefined();
    expect(context.staffPseudonymizedId).toBeUndefined();
  });

  it("carries the requested provider through from the header", async () => {
    verifyAuth0TokenMock.mockResolvedValue(
      auth0Payload(USER_ROLE.PROVIDER, "provider-pseudo-1"),
    );

    const context = await createContext(
      fastifyOptions({
        [IDAHO_TH_ACTIVE_PROVIDER_HEADER]: "housing-provider-1",
      }),
    );

    // Carried, never verified: the provider middleware is what checks the
    // claim against the caller's assignments.
    expect(context.requestedProviderId).toBe("housing-provider-1");
  });

  it("leaves the requested provider unset when the header is absent", async () => {
    verifyAuth0TokenMock.mockResolvedValue(
      auth0Payload(USER_ROLE.PROVIDER, "provider-pseudo-1"),
    );

    const context = await createContext(fastifyOptions());

    expect(context.requestedProviderId).toBeUndefined();
  });
});
