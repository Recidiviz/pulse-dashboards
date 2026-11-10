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

import { describe, expect, it } from "vitest";

import { parseGcsFinalizedEvent } from "../gcsFinalizedEvent";

describe("parseGcsFinalizedEvent", () => {
  it("parses a structured-mode CloudEvent body", () => {
    const result = parseGcsFinalizedEvent(
      {},
      {
        specversion: "1.0",
        type: "google.cloud.storage.object.v1.finalized",
        data: { bucket: "clean-bucket", name: "doc.pdf" },
      },
    );

    expect(result).toEqual({ bucket: "clean-bucket", name: "doc.pdf" });
  });

  it("parses a binary-mode CloudEvent (ce-type header, raw StorageObjectData body)", () => {
    const result = parseGcsFinalizedEvent(
      { "ce-type": "google.cloud.storage.object.v1.finalized" },
      { bucket: "quarantine-bucket", name: "doc.pdf" },
    );

    expect(result).toEqual({ bucket: "quarantine-bucket", name: "doc.pdf" });
  });

  it("returns undefined for a body without a ce-type header and without a data wrapper", () => {
    const result = parseGcsFinalizedEvent(
      {},
      { bucket: "quarantine-bucket", name: "doc.pdf" },
    );

    expect(result).toBeUndefined();
  });

  it("returns undefined for the flat test/manual-call shape", () => {
    const result = parseGcsFinalizedEvent(
      {},
      { bucketName: "test-bucket", objectKey: "doc.pdf", verdict: "CLEAN" },
    );

    expect(result).toBeUndefined();
  });

  it("returns undefined when data is present but missing bucket/name", () => {
    const result = parseGcsFinalizedEvent(
      {},
      { data: { contentType: "application/pdf" } },
    );

    expect(result).toBeUndefined();
  });

  it("returns undefined for a non-object body", () => {
    expect(parseGcsFinalizedEvent({}, null)).toBeUndefined();
    expect(parseGcsFinalizedEvent({}, "not json")).toBeUndefined();
    expect(parseGcsFinalizedEvent({}, undefined)).toBeUndefined();
  });
});
