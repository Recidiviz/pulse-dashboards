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

import { describe, expect, test, vi } from "vitest";

import {
  probeMp4,
  RangeReader,
} from "~@meetings/server/scripts/meetings-oncall/probe-mp4";

/** Builds a top-level MP4 box with `payloadBytes` of filler after the header. */
function box(type: string, payloadBytes: number): Buffer {
  const header = Buffer.alloc(8);
  header.writeUInt32BE(8 + payloadBytes, 0);
  header.write(type, 4, "latin1");
  return Buffer.concat([header, Buffer.alloc(payloadBytes, 0x11)]);
}

/** A box using the 64-bit `largesize` form (32-bit size field set to 1). */
function largeBox(type: string, payloadBytes: number): Buffer {
  const header = Buffer.alloc(16);
  header.writeUInt32BE(1, 0);
  header.write(type, 4, "latin1");
  header.writeBigUInt64BE(BigInt(16 + payloadBytes), 8);
  return Buffer.concat([header, Buffer.alloc(payloadBytes, 0x11)]);
}

/** A box whose size field is 0, meaning "runs to end of file". */
function openEndedBox(type: string, payloadBytes: number): Buffer {
  const header = Buffer.alloc(8);
  header.writeUInt32BE(0, 0);
  header.write(type, 4, "latin1");
  return Buffer.concat([header, Buffer.alloc(payloadBytes, 0x11)]);
}

function readerFor(buffer: Buffer): RangeReader {
  // GCS treats both ends as inclusive; mirror that here.
  return async (start, end) => buffer.subarray(start, end + 1);
}

describe("probeMp4", () => {
  test("a cleanly finalized recording has ftyp, mdat and moov", async () => {
    const file = Buffer.concat([
      box("ftyp", 16),
      box("mdat", 2048),
      box("moov", 512),
    ]);

    const probe = await probeMp4(readerFor(file), file.length);

    expect(probe.parseError).toBeUndefined();
    expect(probe.truncatedAt).toBeUndefined();
    expect(probe.hasFtyp).toBe(true);
    expect(probe.hasMdat).toBe(true);
    expect(probe.hasMoov).toBe(true);
    expect(probe.boxes.map((b) => b.type)).toEqual(["ftyp", "mdat", "moov"]);
  });

  test("an interrupted recording has media data but no moov", async () => {
    // The exact shape of a killed recorder: the payload streamed out, then the
    // process died before the index could be appended.
    const file = Buffer.concat([box("ftyp", 16), box("mdat", 4096)]);

    const probe = await probeMp4(readerFor(file), file.length);

    expect(probe.hasMdat).toBe(true);
    expect(probe.hasMoov).toBe(false);
    expect(probe.parseError).toBeUndefined();
    expect(probe.truncatedAt).toBeUndefined();
  });

  test("faststart files with moov before mdat are still recognized", async () => {
    const file = Buffer.concat([
      box("ftyp", 16),
      box("moov", 512),
      box("mdat", 2048),
    ]);

    const probe = await probeMp4(readerFor(file), file.length);

    expect(probe.hasMoov).toBe(true);
    expect(probe.boxes.map((b) => b.type)).toEqual(["ftyp", "moov", "mdat"]);
  });

  test("detects a box that runs past the end of the object", async () => {
    // A complete header claiming 4096 bytes, with the payload cut short.
    const truncated = Buffer.concat([
      box("ftyp", 16),
      box("mdat", 4096),
    ]).subarray(0, 24 + 100);

    const probe = await probeMp4(readerFor(truncated), truncated.length);

    expect(probe.truncatedAt).toBe(24);
    expect(probe.hasMoov).toBe(false);
  });

  test("handles 64-bit largesize boxes", async () => {
    const file = Buffer.concat([
      box("ftyp", 16),
      largeBox("mdat", 1024),
      box("moov", 256),
    ]);

    const probe = await probeMp4(readerFor(file), file.length);

    expect(probe.parseError).toBeUndefined();
    expect(probe.hasMoov).toBe(true);
    expect(probe.boxes.map((b) => b.type)).toEqual(["ftyp", "mdat", "moov"]);
  });

  test("treats a zero size as the final box rather than looping", async () => {
    const file = Buffer.concat([box("ftyp", 16), openEndedBox("mdat", 1024)]);

    const probe = await probeMp4(readerFor(file), file.length);

    expect(probe.parseError).toBeUndefined();
    expect(probe.hasMdat).toBe(true);
    expect(probe.boxes).toHaveLength(2);
  });

  test("rejects a file that is not an MP4 container at all", async () => {
    // WebM/Matroska magic — a plausible mistake given web clients record webm.
    const file = Buffer.concat([
      Buffer.from([0x1a, 0x45, 0xdf, 0xa3]),
      Buffer.alloc(64, 0x00),
    ]);

    const probe = await probeMp4(readerFor(file), file.length);

    expect(probe.parseError).toContain("not an MP4/M4A container");
    expect(probe.hasMoov).toBe(false);
  });

  test("reports an impossible box size instead of looping forever", async () => {
    const header = Buffer.alloc(8);
    header.writeUInt32BE(3, 0); // smaller than the 8-byte header
    header.write("mdat", 4, "latin1");
    const file = Buffer.concat([header, Buffer.alloc(64)]);

    const probe = await probeMp4(readerFor(file), file.length);

    expect(probe.parseError).toContain("impossible size");
  });

  test("reads only headers, not the payload", async () => {
    const file = Buffer.concat([
      box("ftyp", 16),
      box("mdat", 10_000_000),
      box("moov", 512),
    ]);
    const read = vi.fn(readerFor(file));

    const probe = await probeMp4(read, file.length);

    expect(probe.hasMoov).toBe(true);
    // One ranged read per box, each at most 16 bytes.
    expect(read).toHaveBeenCalledTimes(3);
    const bytesRead = read.mock.calls.reduce(
      (total, [start, end]) => total + (end - start + 1),
      0,
    );
    expect(bytesRead).toBeLessThanOrEqual(48);
  });

  test("stops rather than spinning on a file of repeating tiny boxes", async () => {
    const file = Buffer.concat(
      Array.from({ length: 500 }, () => box("free", 0)),
    );

    const probe = await probeMp4(readerFor(file), file.length);

    expect(probe.boxes.length).toBeLessThanOrEqual(64);
  });

  test("an empty object yields no boxes and no crash", async () => {
    const probe = await probeMp4(readerFor(Buffer.alloc(0)), 0);

    expect(probe.boxes).toEqual([]);
    expect(probe.hasMoov).toBe(false);
  });
});
