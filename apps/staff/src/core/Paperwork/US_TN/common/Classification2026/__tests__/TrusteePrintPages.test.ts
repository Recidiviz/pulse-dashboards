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

import { TRUSTEE_CRITERIA_GROUPS } from "~datatypes";

import { TRUSTEE_PRINT_BLOCKS, TRUSTEE_PRINT_PAGES } from "../TrusteeChecklist";
import { TRUSTEE_SECTIONS } from "../TrusteeCriteriaSection";

const plannedGroups = TRUSTEE_PRINT_PAGES.flatMap((p) => [...p.groups]);

describe("TRUSTEE_PRINT_PAGES", () => {
  it("places every group exactly once", () => {
    expect([...plannedGroups].sort()).toEqual(
      Object.keys(TRUSTEE_CRITERIA_GROUPS).sort(),
    );
  });

  it("keeps groups in their display order", () => {
    const displayOrder = TRUSTEE_SECTIONS.flatMap((s) =>
      s.groups.map((g) => g.key),
    );

    expect(plannedGroups).toEqual(displayOrder);
  });

  it("never splits a section's groups across non-adjacent pages", () => {
    const sectionOf = (key: string) =>
      TRUSTEE_SECTIONS.find((s) => s.groups.some((g) => g.key === key))
        ?.section;

    const sectionRun = plannedGroups.map(sectionOf);
    const firstSeen = new Map<string, number>();

    sectionRun.forEach((section, index) => {
      if (section === undefined) return;
      const previous = firstSeen.get(section);
      if (previous === undefined) {
        firstSeen.set(section, index);
      } else {
        expect(sectionRun.slice(previous, index + 1)).toEqual(
          Array(index - previous + 1).fill(section),
        );
      }
    });
  });

  it("places every trailing block exactly once", () => {
    const planned = TRUSTEE_PRINT_PAGES.flatMap((p) => [...p.blocks]);

    expect([...planned].sort()).toEqual([...TRUSTEE_PRINT_BLOCKS].sort());
  });

  it("starts a page with the approvals table", () => {
    const approvals = TRUSTEE_PRINT_PAGES.find((p) =>
      (p.blocks as readonly string[]).includes("approvals"),
    );

    expect(approvals?.groups).toHaveLength(0);
  });

  it("keeps the notes with the approvals rather than on a sheet of their own", () => {
    const approvals = TRUSTEE_PRINT_PAGES.findIndex((p) =>
      (p.blocks as readonly string[]).includes("approvals"),
    );
    const notes = TRUSTEE_PRINT_PAGES.findIndex((p) =>
      (p.blocks as readonly string[]).includes("notes"),
    );

    expect(notes).toBe(approvals);
  });

  it("never leaves a criteria group on a page by itself with nothing else", () => {
    TRUSTEE_PRINT_PAGES.forEach(({ groups, blocks }) => {
      expect(groups.length + blocks.length).toBeGreaterThan(0);
    });
  });

  it("keeps the blocks in the order the form reads them", () => {
    const planned = TRUSTEE_PRINT_PAGES.flatMap((p) => [...p.blocks]);

    expect(planned).toEqual([...TRUSTEE_PRINT_BLOCKS]);
  });

  it("carries the last block on the last page", () => {
    expect(
      TRUSTEE_PRINT_PAGES[TRUSTEE_PRINT_PAGES.length - 1].blocks.length,
    ).toBeGreaterThan(0);
  });
});
