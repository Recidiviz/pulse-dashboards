/*
 * Recidiviz - a data platform for criminal justice reform
 * Copyright (C) 2022 Recidiviz, Inc.
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
 * =============================================================================
 *
 */
import { render, screen } from "@testing-library/react";
import { parseISO } from "date-fns";

import { Opportunity, OpportunityCaseNote } from "../../../WorkflowsStore";
import { CaseNotes } from "../Details";

describe("CaseNotes tests", () => {
  it("can display notes for multiple criteria", () => {
    const caseNotes: Record<string, OpportunityCaseNote[]> = {
      foo: [
        {
          noteTitle: "title1",
          noteBody: "body1",
          eventDate: parseISO("2022-08-02"),
        },
        {
          noteTitle: "title2",
          noteBody: "body2",
          eventDate: parseISO("2022-05-02"),
        },
      ],
      bar: [
        {
          noteTitle: "title3",
          noteBody: "body3",
          eventDate: parseISO("2022-01-05"),
        },
      ],
    };

    render(
      <CaseNotes
        opportunity={{ record: { caseNotes } } as unknown as Opportunity}
      />
    );

    const fooTag = screen.getByText("foo");
    const barTag = screen.getByText("bar");

    expect(fooTag.nextSibling).toContainElement(
      screen.getByText("title1", { exact: false })
    );
    expect(fooTag.nextSibling).toContainElement(
      screen.getByText("title2", { exact: false })
    );
    expect(barTag.nextSibling).toContainElement(
      screen.getByText("title3", { exact: false })
    );
  });

  it("displays most recent note first", () => {
    const unorderedNotes: Record<string, OpportunityCaseNote[]> = {
      foo: [
        {
          noteTitle: "title1",
          noteBody: "body1",
          eventDate: parseISO("2022-01-05"),
        },
        {
          noteTitle: "title2",
          noteBody: "body2",
          eventDate: parseISO("2022-08-02"),
        },
        {
          noteTitle: "title3",
          noteBody: "body3",
          eventDate: parseISO("2022-05-02"),
        },
      ],
    };

    render(
      <CaseNotes
        opportunity={
          { record: { caseNotes: unorderedNotes } } as unknown as Opportunity
        }
      />
    );

    const fooTag = screen.getByText("foo");
    const fooNoteTexts = fooTag.nextSibling?.textContent ?? "";

    expect(fooNoteTexts.indexOf("title2")).toBeLessThan(
      fooNoteTexts.indexOf("title3")
    );
    expect(fooNoteTexts.indexOf("title3")).toBeLessThan(
      fooNoteTexts.indexOf("title1")
    );
  });
});
