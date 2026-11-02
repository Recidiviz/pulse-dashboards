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

import { PrismaClient } from "./client/client";
import { getPrismaClient } from "./getPrismaClient";

vi.mock("./client/client", () => ({ PrismaClient: vi.fn() }));

describe("getPrismaClient", () => {
  it("throws, naming the variable, when CALENDAR__US_CO_DATABASE_URL is unset", () => {
    vi.stubEnv("CALENDAR__US_CO_DATABASE_URL", "");
    vi.stubEnv("DATABASE_URL", "postgresql://localhost:5432/shared");

    expect(() => getPrismaClient("US_CO")).toThrow(
      "CALENDAR__US_CO_DATABASE_URL is not set",
    );
  });

  it("throws for a state with no Calendar variable without printing any URL", () => {
    vi.stubEnv(
      "CALENDAR__US_CO_DATABASE_URL",
      "postgresql://localhost:5432/calendar",
    );
    vi.stubEnv("DATABASE_URL", "postgresql://localhost:5432/shared");

    expect(() => getPrismaClient("US_XX")).toThrow(
      new Error("CALENDAR__US_XX_DATABASE_URL is not set"),
    );
  });

  it("returns one client per state, reused on every call", () => {
    vi.stubEnv(
      "CALENDAR__US_CO_DATABASE_URL",
      "postgresql://localhost:5432/calendar",
    );

    const first = getPrismaClient("US_CO");

    expect(getPrismaClient("US_CO")).toBe(first);
    expect(PrismaClient).toHaveBeenCalledTimes(1);
  });
});
