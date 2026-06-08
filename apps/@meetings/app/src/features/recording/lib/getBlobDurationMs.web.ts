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

// Chrome's WebM demuxer can hang indefinitely on partially-corrupted buffers
// instead of rejecting (the EBML header sniff catches the obvious cases, but
// truncated clusters can still pass that check). A timeout race converts those
// hangs into a regular rejection.
const DECODE_TIMEOUT_MS = 5000;

export async function getBlobDurationMs(blob: Blob) {
  const arrayBuffer = await blob.arrayBuffer();
  const ctx = new AudioContext();

  let timeoutId: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(
      () => reject(new Error("decodeAudioData timed out")),
      DECODE_TIMEOUT_MS,
    );
  });

  try {
    const audioBuffer = await Promise.race([
      ctx.decodeAudioData(arrayBuffer),
      timeout,
    ]);
    return audioBuffer.duration * 1000;
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
    await ctx.close();
  }
}
