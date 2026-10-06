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

import type { FlaggedMeetingSummary } from "~@meetings/app/admin/api/flaggedMeetings";

import { filterFlaggedMeetings } from "./filterFlaggedMeetings";

type Sections = FlaggedMeetingSummary["sections"];

const none = { llm: false, labelStudio: false, vote: false };

function meeting(id: string, sections: Partial<Sections>) {
  return {
    meetingId: id,
    sections: {
      CASE_NOTE: none,
      ACTION_ITEMS: none,
      OVERALL: none,
      ...sections,
    },
  } as FlaggedMeetingSummary;
}

const llmCaseNote = meeting("a", { CASE_NOTE: { ...none, llm: true } });
const lsActionItems = meeting("b", {
  ACTION_ITEMS: { ...none, labelStudio: true },
});
const voteOverall = meeting("c", { OVERALL: { ...none, vote: true } });
const all = [llmCaseNote, lsActionItems, voteOverall];

const ids = (rows: FlaggedMeetingSummary[]) => rows.map((r) => r.meetingId);

describe("filterFlaggedMeetings", () => {
  it("returns every row for any source and any dimension", () => {
    expect(filterFlaggedMeetings(all, "any", "any")).toEqual(all);
  });

  it("filters by source across all sections", () => {
    expect(ids(filterFlaggedMeetings(all, "llm", "any"))).toEqual(["a"]);
    expect(ids(filterFlaggedMeetings(all, "labelStudio", "any"))).toEqual([
      "b",
    ]);
    expect(ids(filterFlaggedMeetings(all, "vote", "any"))).toEqual(["c"]);
  });

  it("filters by dimension across all sources", () => {
    expect(ids(filterFlaggedMeetings(all, "any", "CASE_NOTE"))).toEqual(["a"]);
    expect(ids(filterFlaggedMeetings(all, "any", "OVERALL"))).toEqual(["c"]);
  });

  it("requires that source to have flagged that section when both are set", () => {
    expect(ids(filterFlaggedMeetings(all, "llm", "CASE_NOTE"))).toEqual(["a"]);
    expect(filterFlaggedMeetings(all, "llm", "ACTION_ITEMS")).toEqual([]);
  });

  it("does not match a source on one section and a dimension on another", () => {
    const mixed = meeting("d", {
      CASE_NOTE: { ...none, llm: true },
      OVERALL: { ...none, vote: true },
    });
    expect(filterFlaggedMeetings([mixed], "llm", "OVERALL")).toEqual([]);
  });
});
