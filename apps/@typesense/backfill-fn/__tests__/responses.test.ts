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

import { parseImportResponse, selectStaleIds } from "../src/responses";

describe("parseImportResponse", () => {
  it("returns a pre-parsed array as-is (modern client)", () => {
    const raw = [{ success: true }, { success: false, error: "boom" }];
    expect(parseImportResponse(raw)).toEqual(raw);
  });

  it("parses NDJSON string into per-doc entries (older client)", () => {
    const raw = '{"success":true}\n{"success":false,"error":"boom"}';
    expect(parseImportResponse(raw)).toEqual([
      { success: true },
      { success: false, error: "boom" },
    ]);
  });

  it("skips blank lines in NDJSON output", () => {
    const raw = '{"success":true}\n\n{"success":true}\n';
    expect(parseImportResponse(raw)).toEqual([
      { success: true },
      { success: true },
    ]);
  });

  it("synthesizes a failure entry for unparseable response lines", () => {
    const raw = '{"success":true}\nnot json\n';
    const result = parseImportResponse(raw);
    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({ success: true });
    expect(result[1]).toEqual({
      success: false,
      error: "unparseable response line: not json",
    });
  });

  it("returns an empty array for an empty string", () => {
    expect(parseImportResponse("")).toEqual([]);
  });
});
describe("selectStaleIds", () => {
  it("returns exported ids that are absent from the keep set", () => {
    const exported = '{"id":"a"}\n{"id":"b"}\n{"id":"c"}';
    expect(selectStaleIds(exported, new Set(["a", "c"]))).toEqual(["b"]);
  });

  it("returns nothing when every exported id is in the keep set", () => {
    const exported = '{"id":"a"}\n{"id":"b"}';
    expect(selectStaleIds(exported, new Set(["a", "b"]))).toEqual([]);
  });

  it("treats an empty export as nothing to prune", () => {
    expect(selectStaleIds("", new Set(["a"]))).toEqual([]);
  });

  it("skips blank, unparseable, and id-less lines", () => {
    const exported = '{"id":"a"}\n\nnot json\n{"foo":"bar"}\n{"id":"b"}';
    expect(selectStaleIds(exported, new Set())).toEqual(["a", "b"]);
  });

  it("skips non-string ids", () => {
    const exported = '{"id":123}\n{"id":"b"}';
    expect(selectStaleIds(exported, new Set())).toEqual(["b"]);
  });
});
