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

/**
 * Walks the top-level box structure of an MP4-family file (`.m4a`, `.mp4`).
 *
 * Why: the most common malformed-audio failure is an interrupted recording. The
 * encoder streams `mdat` (the media payload) as it records and only writes
 * `moov` (the index needed to decode it) when the recording is closed cleanly.
 * Kill the app, close the tab, or lose the process mid-recording and you get a
 * multi-megabyte file with no `moov`. ffmpeg reports that as the maddeningly
 * generic "Invalid data found when processing input".
 *
 * Object metadata cannot see this — the file has a healthy size and content
 * type — so detecting it means reading the bytes. Reading the *whole* file
 * would be far too expensive for a dashboard, but the box structure is a linked
 * list of headers: read 16 bytes, learn the box's length, skip to the next one.
 * A typical file resolves in a handful of ranged reads regardless of its size.
 */

/**
 * Reads bytes in `[start, end]` — both inclusive, matching GCS range semantics.
 */
export type RangeReader = (start: number, end: number) => Promise<Buffer>;

export interface Mp4Box {
  type: string;
  offset: number;
  size: number;
}

export interface Mp4Probe {
  boxes: Mp4Box[];
  hasFtyp: boolean;
  hasMoov: boolean;
  hasMdat: boolean;
  /** Offset of a box that claimed to extend past the end of the object. */
  truncatedAt?: number;
  /** Set when the structure isn't parseable as MP4 at all. */
  parseError?: string;
  /** True when the walk stopped because it hit MAX_BOXES, not end-of-file. */
  boxLimitReached?: boolean;
}

/** Guards against walking a pathological or non-MP4 file forever. */
const MAX_BOXES = 64;

const BOX_HEADER_BYTES = 8;
const LARGE_BOX_HEADER_BYTES = 16;

/** Box types are four printable ASCII characters. */
function isPlausibleBoxType(type: string): boolean {
  return /^[\x20-\x7e]{4}$/.test(type);
}

export async function probeMp4(
  read: RangeReader,
  objectSize: number,
): Promise<Mp4Probe> {
  const boxes: Mp4Box[] = [];
  let offset = 0;
  let truncatedAt: number | undefined;
  let parseError: string | undefined;

  while (offset + BOX_HEADER_BYTES <= objectSize && boxes.length < MAX_BOXES) {
    // Over-read to cover a 64-bit `largesize`, clamped to the object.
    const end = Math.min(offset + LARGE_BOX_HEADER_BYTES - 1, objectSize - 1);
    // eslint-disable-next-line no-await-in-loop
    const header = await read(offset, end);

    if (header.length < BOX_HEADER_BYTES) {
      parseError = `Could not read a box header at offset ${offset}.`;
      break;
    }

    const type = header.toString("latin1", 4, 8);
    if (!isPlausibleBoxType(type)) {
      parseError =
        offset === 0
          ? "Does not begin with an MP4 box header — the file is not an MP4/M4A container."
          : `Unreadable box type at offset ${offset}; the structure is corrupt from here on.`;
      break;
    }

    let size = header.readUInt32BE(0);
    let headerSize: number = BOX_HEADER_BYTES;

    if (size === 1) {
      // 64-bit size: the real length follows the type.
      if (header.length < LARGE_BOX_HEADER_BYTES) {
        parseError = `Box "${type}" at offset ${offset} declares a 64-bit size but is truncated inside its own header.`;
        break;
      }
      size = Number(header.readBigUInt64BE(8));
      headerSize = LARGE_BOX_HEADER_BYTES;
    } else if (size === 0) {
      // A zero size means "extends to end of file", so this is the last box.
      size = objectSize - offset;
    }

    if (size < headerSize) {
      parseError = `Box "${type}" at offset ${offset} declares an impossible size of ${size} bytes.`;
      break;
    }

    boxes.push({ type, offset, size });

    if (offset + size > objectSize) {
      truncatedAt = offset;
      break;
    }

    offset += size;
  }

  const boxLimitReached =
    boxes.length >= MAX_BOXES && offset + BOX_HEADER_BYTES <= objectSize;

  return {
    boxes,
    hasFtyp: boxes.some((box) => box.type === "ftyp"),
    hasMoov: boxes.some((box) => box.type === "moov"),
    hasMdat: boxes.some((box) => box.type === "mdat"),
    truncatedAt,
    parseError,
    boxLimitReached: boxLimitReached || undefined,
  };
}
