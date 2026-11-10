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

import { cropBottomStrip } from "~@idaho-th/trpc/pdfSorter/image/crop";
import {
  enhanceGrayscale,
  rotate180,
} from "~@idaho-th/trpc/pdfSorter/image/grayscale";
import { toPgm } from "~@idaho-th/trpc/pdfSorter/image/pgm";

/** A width×height ramp, so every transform's effect is easy to read back. */
function ramp(width: number, height: number): Uint8Array {
  return Uint8Array.from({ length: width * height }, (_, index) => index % 256);
}

describe("toPgm", () => {
  it("writes a P5 header followed by the raw bytes", () => {
    const gray = Uint8Array.from([0, 128, 255, 7]);

    const pgm = toPgm(2, 2, gray);

    expect(pgm.subarray(0, 11).toString("ascii")).toBe("P5 2 2\n255\n");
    expect(pgm.subarray(11)).toEqual(Buffer.from(gray));
  });

  it("round-trips the pixel data byte for byte", () => {
    const gray = ramp(4, 3);

    const pgm = toPgm(4, 3, gray);
    const headerLength = `P5 4 3\n255\n`.length;

    expect(Uint8Array.from(pgm.subarray(headerLength))).toEqual(gray);
    expect(pgm).toHaveLength(headerLength + gray.length);
  });

  it("emits a header-only image for zero dimensions", () => {
    expect(toPgm(0, 0, new Uint8Array()).toString("ascii")).toBe(
      "P5 0 0\n255\n",
    );
  });
});

describe("cropBottomStrip", () => {
  it("keeps the rows from floor(height * ratio) onward", () => {
    const source = ramp(3, 4);

    const strip = cropBottomStrip(source, 3, 4, 0.5);

    expect(strip).toEqual({
      data: Uint8Array.from([6, 7, 8, 9, 10, 11]),
      width: 3,
      height: 2,
    });
  });

  it("floors a fractional start row", () => {
    const source = ramp(2, 5);

    // floor(5 * 0.8) = 4, so only the last row survives.
    expect(cropBottomStrip(source, 2, 5, 0.8)).toEqual({
      data: Uint8Array.from([8, 9]),
      width: 2,
      height: 1,
    });
  });

  it("returns the whole image for a ratio of 0", () => {
    const source = ramp(2, 2);

    expect(cropBottomStrip(source, 2, 2, 0).data).toEqual(source);
  });

  it("returns an empty strip for a ratio of 1", () => {
    expect(cropBottomStrip(ramp(2, 2), 2, 2, 1)).toEqual({
      data: new Uint8Array(0),
      width: 2,
      height: 0,
    });
  });
});

describe("rotate180", () => {
  it("reverses the pixel order", () => {
    const source = Uint8Array.from([1, 2, 3, 4, 5, 6]);

    expect(rotate180(source, 3, 2)).toEqual(
      Uint8Array.from([6, 5, 4, 3, 2, 1]),
    );
  });

  it("is its own inverse", () => {
    const source = ramp(5, 4);

    expect(rotate180(rotate180(source, 5, 4), 5, 4)).toEqual(source);
  });

  it("treats a short source as zero-filled", () => {
    // A truncated buffer must not produce undefined pixels.
    expect(rotate180(Uint8Array.from([9]), 2, 1)).toEqual(
      Uint8Array.from([0, 9]),
    );
  });
});

describe("enhanceGrayscale", () => {
  it("returns one byte per source pixel", () => {
    expect(enhanceGrayscale(ramp(6, 5), 6, 5)).toHaveLength(30);
  });

  it("keeps every output byte in range", () => {
    const enhanced = enhanceGrayscale(ramp(8, 8), 8, 8);

    for (const value of enhanced) {
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThanOrEqual(255);
    }
  });

  it("flattens a uniform image to a single value", () => {
    // Contrast is centred on the mean, so a flat image has no edges to sharpen.
    const flat = new Uint8Array(16).fill(128);

    expect([...new Set(enhanceGrayscale(flat, 4, 4))]).toHaveLength(1);
  });

  it("drives a dark background to zero and keeps a bright mark", () => {
    const source = new Uint8Array(25).fill(10);
    source[12] = 250;

    const enhanced = enhanceGrayscale(source, 5, 5);

    expect(enhanced[12]).toBe(255);
    expect(enhanced[0]).toBe(0);
  });

  it("handles a single-pixel image without reading out of bounds", () => {
    expect(enhanceGrayscale(Uint8Array.from([200]), 1, 1)).toHaveLength(1);
  });

  it("handles a single-row and a single-column image", () => {
    expect(enhanceGrayscale(ramp(4, 1), 4, 1)).toHaveLength(4);
    expect(enhanceGrayscale(ramp(1, 4), 1, 4)).toHaveLength(4);
  });
});
