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

import { z } from "zod";

import { toZodMessage } from "~@idaho-th/trpc/routes/vertex/vertex.zod";

const schema = z.object({
  relation: z.enum(["Parent", "Sibling"]),
  count: z.number(),
});

describe("toZodMessage", () => {
  it("names the path and the allowed enum values without echoing the received value", () => {
    const result = schema.safeParse({ relation: "Jane Q Public", count: 1 });
    if (result.success) throw new Error("expected validation to fail");

    const message = toZodMessage(result.error);

    expect(message).toBe(
      "relation: Invalid enum value. Expected 'Parent' | 'Sibling'",
    );
    expect(message).not.toContain("Jane");
  });

  it("keeps Zod's own text for issues that only name a type", () => {
    const result = schema.safeParse({ relation: "Parent", count: "many" });
    if (result.success) throw new Error("expected validation to fail");

    expect(toZodMessage(result.error)).toBe(
      "count: Expected number, received string",
    );
  });

  it("joins several issues", () => {
    const result = schema.safeParse({ relation: "x", count: "y" });
    if (result.success) throw new Error("expected validation to fail");

    expect(toZodMessage(result.error)).toBe(
      "relation: Invalid enum value. Expected 'Parent' | 'Sibling'; count: Expected number, received string",
    );
  });
});
