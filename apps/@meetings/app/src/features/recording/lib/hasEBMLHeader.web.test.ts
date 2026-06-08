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

import { hasEBMLHeader } from "./hasEBMLHeader.web";

const EBML_MAGIC_BYTES = [0x1a, 0x45, 0xdf, 0xa3];

describe("hasEBMLHeader", () => {
  it("returns true when the blob starts with the EBML magic", async () => {
    const blob = new Blob([
      new Uint8Array([...EBML_MAGIC_BYTES, 0x9f, 0x42, 0x86, 0x81]),
    ]);
    expect(await hasEBMLHeader(blob)).toBe(true);
  });

  it("returns true for a blob containing only the magic bytes", async () => {
    const blob = new Blob([new Uint8Array(EBML_MAGIC_BYTES)]);
    expect(await hasEBMLHeader(blob)).toBe(true);
  });

  it("returns false when the magic bytes are not at the start", async () => {
    const blob = new Blob([new Uint8Array([0x00, ...EBML_MAGIC_BYTES])]);
    expect(await hasEBMLHeader(blob)).toBe(false);
  });

  it("returns false when only some of the magic bytes match", async () => {
    const blob = new Blob([new Uint8Array([0x1a, 0x45, 0xdf, 0x00])]);
    expect(await hasEBMLHeader(blob)).toBe(false);
  });

  it("returns false for arbitrary non-WebM bytes", async () => {
    const blob = new Blob([new Uint8Array([0x00, 0x00, 0x00, 0x00])]);
    expect(await hasEBMLHeader(blob)).toBe(false);
  });

  it("returns false for a blob smaller than the magic length", async () => {
    const blob = new Blob([new Uint8Array([0x1a, 0x45, 0xdf])]);
    expect(await hasEBMLHeader(blob)).toBe(false);
  });

  it("returns false for an empty blob", async () => {
    const blob = new Blob([]);
    expect(await hasEBMLHeader(blob)).toBe(false);
  });
});
