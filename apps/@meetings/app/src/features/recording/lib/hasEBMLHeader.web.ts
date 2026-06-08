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

// Every Matroska/WebM stream begins with the EBML header magic. If a persisted
// chunk sequence doesn't start with these bytes, the first chunk (which carries
// the container headers) is missing or the buffer is otherwise unparseable —
// feeding it to AudioContext.decodeAudioData can hang Chrome's WebM demuxer
// indefinitely rather than rejecting.
const EBML_MAGIC = [0x1a, 0x45, 0xdf, 0xa3];

export async function hasEBMLHeader(blob: Blob) {
  if (blob.size < EBML_MAGIC.length) return false;
  const bytes = new Uint8Array(
    await blob.slice(0, EBML_MAGIC.length).arrayBuffer(),
  );
  return EBML_MAGIC.every((byte, i) => bytes[i] === byte);
}
