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

import {
  september2026Config,
  september2026MonthDetail,
} from "~@parole-board/common/fixtures";

import { toGridEntries } from "../toGridEntries";

const { entries } = september2026MonthDetail;
const { resources } = september2026Config;

const byId = (id: string) => {
  const found = toGridEntries(entries, resources).find((e) => e.id === id);
  if (!found) throw new Error(`No entry ${id}`);
  return found;
};

describe("toGridEntries", () => {
  test("maps a hearing's fields, with the kind code and the facility's full name", () => {
    expect(byId("2026-09-14:HEARING:FCF")).toEqual({
      id: "2026-09-14:HEARING:FCF",
      date: "2026-09-14",
      label: "FCF",
      kind: "HEARING",
      cancelled: false,
      title: "Fremont Correctional Facility",
    });
  });

  test("titles a meeting with its kind label", () => {
    expect(byId("2026-09-25:BUSINESS_MEETING:Business Meeting")).toMatchObject({
      label: "Business Mtg",
      kind: "BUSINESS_MEETING",
      title: "Business Mtg",
    });
  });

  test("keeps the server's order", () => {
    expect(toGridEntries(entries, resources).map((e) => e.id)).toEqual(
      entries.map((e) => e.id),
    );
  });

  test("carries the cancelled flag", () => {
    const cancelled = entries.map((e) =>
      e.id === "2026-09-11:FULL_BOARD:Full Board"
        ? { ...e, cancelled: true }
        : e,
    );

    const mapped = toGridEntries(cancelled, resources);

    expect(mapped.filter((e) => e.cancelled).map((e) => e.id)).toEqual([
      "2026-09-11:FULL_BOARD:Full Board",
    ]);
  });

  test("falls back to the label for a resource with no name or not in the config", () => {
    const fcf = entries.find((e) => e.id === "2026-09-14:HEARING:FCF");
    if (!fcf?.resource) throw new Error("No FCF hearing");
    const unnamed = resources.map((r) =>
      r.id === fcf.resource?.id ? { ...r, name: null } : r,
    );

    expect(toGridEntries([fcf], unnamed)[0].title).toBe("FCF");
    expect(toGridEntries([fcf], [])[0].title).toBe("FCF");
  });
});
