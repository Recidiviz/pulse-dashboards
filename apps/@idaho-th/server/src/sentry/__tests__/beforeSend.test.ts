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

import type { ErrorEvent, EventHint, NodeOptions } from "@sentry/node";
import { TRPCError } from "@trpc/server";

import { serverFaultTrpcError } from "~@idaho-th/trpc/utils/serverFaultTrpcError";

const sentryMocks = vi.hoisted(() => ({
  init: vi.fn<(options: NodeOptions) => void>(),
}));

vi.mock("@sentry/node", () => ({
  init: sentryMocks.init,
  prismaIntegration: vi.fn(),
}));

vi.mock("@sentry/profiling-node", () => ({
  nodeProfilingIntegration: vi.fn(),
}));

async function loadBeforeSend() {
  await import("~@idaho-th/server/sentry/index");
  const options = sentryMocks.init.mock.calls[0]?.[0];
  if (!options?.beforeSend) throw new Error("Sentry init had no beforeSend");
  const { beforeSend } = options;
  return (originalException: unknown) =>
    beforeSend(
      {
        exception: { values: [{ type: "Error", value: "boom" }] },
      } as ErrorEvent,
      { originalException } as EventHint,
    );
}

describe("Sentry beforeSend", () => {
  it("drops an expected sub-500 tRPC error", async () => {
    const beforeSend = await loadBeforeSend();

    expect(beforeSend(new TRPCError({ code: "BAD_REQUEST" }))).toBeNull();
  });

  it("keeps a server-fault tRPC error despite its sub-500 code, tagged with that code", async () => {
    const beforeSend = await loadBeforeSend();

    const event = beforeSend(serverFaultTrpcError({ code: "TIMEOUT" }));

    expect(event).not.toBeNull();
    expect(event).toMatchObject({
      tags: { "trpc.code": "TIMEOUT", "trpc.http_status": "408" },
    });
  });
});
