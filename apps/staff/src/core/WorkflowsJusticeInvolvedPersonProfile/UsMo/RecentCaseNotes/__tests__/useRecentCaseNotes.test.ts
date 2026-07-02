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

import { renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { UsMoClientMetadata } from "~datatypes";

import { Client } from "../../../../../WorkflowsStore";
import { MAX_RECENT_NOTES, useRecentCaseNotes } from "../useRecentCaseNotes";

type SupervisionContacts = UsMoClientMetadata["supervisionContacts"];

// Builds a minimal Client stand-in whose `metadata.supervisionContacts` getter
// returns the provided contacts. The hook only reads `client.metadata`, so an
// otherwise-empty object cast is sufficient.
function clientWithContacts(supervisionContacts: SupervisionContacts): Client {
  return { metadata: { supervisionContacts } } as unknown as Client;
}

const contact = (
  contactDate: Date | null,
  contactNote: string | null,
  contactTypes: string[] = [],
) => ({ contactDate, contactNote, contactTypes });

describe("useRecentCaseNotes", () => {
  it("maps supervision contacts into recent case notes", () => {
    const client = clientWithContacts([
      contact(new Date("2026-05-19"), "Reported as directed.", ["POV", "UA"]),
    ]);
    const { result } = renderHook(() => useRecentCaseNotes(client));

    expect(result.current.notes).toHaveLength(1);
    expect(result.current.notes[0]).toMatchObject({
      source: "POV, UA",
      body: "Reported as directed.",
      date: new Date("2026-05-19"),
    });
  });

  it("sorts notes by date descending", () => {
    const client = clientWithContacts([
      contact(new Date("2026-04-07"), "Oldest."),
      contact(new Date("2026-05-19"), "Newest."),
      contact(new Date("2026-04-16"), "Middle."),
    ]);
    const { result } = renderHook(() => useRecentCaseNotes(client));

    expect(result.current.notes.map((n) => n.body)).toEqual([
      "Newest.",
      "Middle.",
      "Oldest.",
    ]);
  });

  it("caps the returned notes at MAX_RECENT_NOTES", () => {
    const client = clientWithContacts(
      Array.from({ length: MAX_RECENT_NOTES + 2 }, (_, i) =>
        contact(new Date(2026, 0, i + 1), `Note ${i}`),
      ),
    );
    const { result } = renderHook(() => useRecentCaseNotes(client));

    expect(result.current.notes).toHaveLength(MAX_RECENT_NOTES);
  });

  it("drops contacts missing a date or note", () => {
    const client = clientWithContacts([
      contact(null, "No date."),
      contact(new Date("2026-05-19"), null),
      contact(new Date("2026-04-16"), "Renderable."),
    ]);
    const { result } = renderHook(() => useRecentCaseNotes(client));

    expect(result.current.notes).toHaveLength(1);
    expect(result.current.notes[0].body).toBe("Renderable.");
  });

  it("assigns each note a non-empty, unique id even for same-day contacts", () => {
    const client = clientWithContacts([
      contact(new Date("2026-05-19"), "First same-day note."),
      contact(new Date("2026-05-19"), "Second same-day note."),
    ]);
    const { result } = renderHook(() => useRecentCaseNotes(client));
    const ids = result.current.notes.map((n) => n.id);

    for (const id of ids) {
      expect(id).not.toBe("");
    }
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("returns an empty list when there are no supervision contacts", () => {
    expect(
      renderHook(() => useRecentCaseNotes(clientWithContacts([]))).result
        .current.notes,
    ).toEqual([]);
    expect(
      renderHook(() => useRecentCaseNotes(clientWithContacts(undefined))).result
        .current.notes,
    ).toEqual([]);
  });

  it("reports isLoading === false", () => {
    const client = clientWithContacts([]);
    const { result } = renderHook(() => useRecentCaseNotes(client));
    expect(result.current.isLoading).toBe(false);
  });
});
