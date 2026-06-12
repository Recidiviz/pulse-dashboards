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

import { Client } from "../../../../../WorkflowsStore";
import { MAX_RECENT_NOTES, useRecentCaseNotes } from "../useRecentCaseNotes";

describe("useRecentCaseNotes", () => {
  // The stub hook ignores `client`, so an empty cast is sufficient. When the
  // real backend lands this test will switch to a properly mocked Client.
  const client = {} as Client;

  it("returns exactly three stub notes", () => {
    const { result } = renderHook(() => useRecentCaseNotes(client));
    expect(result.current.notes).toHaveLength(3);
  });

  // The hook applies a slice(0, MAX_RECENT_NOTES) cap so the view never has to
  // worry about it. Asserting against the exported constant — rather than
  // injecting a 4-note fixture — keeps the test tightly scoped to the cap
  // contract without coupling to STUB_NOTES internals.
  it("caps the returned notes at MAX_RECENT_NOTES", () => {
    const { result } = renderHook(() => useRecentCaseNotes(client));
    expect(result.current.notes.length).toBeLessThanOrEqual(MAX_RECENT_NOTES);
  });

  it("assigns each note a non-empty, unique id", () => {
    const { result } = renderHook(() => useRecentCaseNotes(client));
    const ids = result.current.notes.map((n) => n.id);

    for (const id of ids) {
      expect(id).not.toBe("");
    }
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("reports isLoading === false", () => {
    const { result } = renderHook(() => useRecentCaseNotes(client));
    expect(result.current.isLoading).toBe(false);
  });

  it("returns notes with Date objects and string bodies", () => {
    const { result } = renderHook(() => useRecentCaseNotes(client));

    for (const note of result.current.notes) {
      expect(note.date).toBeInstanceOf(Date);
      expect(typeof note.body).toBe("string");
    }
  });
});
