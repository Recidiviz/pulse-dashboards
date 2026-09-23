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

import { describe, expect, test } from "vitest";

import {
  buildFindings,
  GCSObject,
} from "~@meetings/server/scripts/meetings-oncall/diagnose";

/** A probe result for a container that is structurally fine. */
const intactMp4 = {
  boxes: [
    { type: "ftyp", offset: 0, size: 24 },
    { type: "mdat", offset: 24, size: 2048 },
    { type: "moov", offset: 2072, size: 512 },
  ],
  hasFtyp: true,
  hasMoov: true,
  hasMdat: true,
};

/** A probe result for a recording that was cut off before finalizing. */
const noMoovMp4 = {
  boxes: [
    { type: "ftyp", offset: 0, size: 24 },
    { type: "mdat", offset: 24, size: 4096 },
  ],
  hasFtyp: true,
  hasMoov: false,
  hasMdat: true,
};

function object(
  overrides: Partial<GCSObject> & { basename: string },
): GCSObject {
  return {
    name: `US_NE/ck1/${overrides.basename}`,
    size: 1_000_000,
    contentType: "audio/m4a",
    updated: "2026-09-09T19:40:11.000Z",
    isAudio: true,
    ...overrides,
  };
}

const chunk = (basename: string, size = 1_000_000) =>
  object({ basename, size });

/** Levels present in the findings, for terse assertions. */
const levels = (findings: { level: string }[]) => findings.map((f) => f.level);

describe("buildFindings", () => {
  test("an empty folder is the zero-chunk failure", () => {
    const findings = buildFindings([], null);

    expect(levels(findings)).toEqual(["error"]);
    expect(findings[0].message).toContain("never made it off the device");
  });

  test("a healthy folder produces only an informational finding", () => {
    const findings = buildFindings(
      [chunk("1760832000.m4a"), chunk("1760832611.m4a")],
      "US_NE/ck1/final.m4a",
    );

    expect(levels(findings)).toEqual(["info"]);
    expect(findings[0].message).toContain("2 audio chunk(s)");
  });

  test("flags a zero-byte chunk and names it", () => {
    const findings = buildFindings(
      [chunk("1760832000.m4a"), chunk("1760832611.m4a", 0)],
      null,
    );

    const error = findings.find((f) => f.level === "error");
    expect(error?.message).toContain("1 zero-byte object(s)");
    expect(error?.message).toContain("1760832611.m4a");
  });

  test("flags a non-audio object, since stitching does not filter by extension", () => {
    const findings = buildFindings(
      [
        chunk("1760832000.m4a"),
        object({
          basename: "label-studio-task.json",
          contentType: "application/json",
          isAudio: false,
          size: 1240,
        }),
      ],
      null,
    );

    const messages = findings.map((f) => f.message).join("\n");
    expect(messages).toContain("label-studio-task.json");
    expect(messages).toContain("does not filter by extension");
  });

  test("flags mixed audio extensions", () => {
    const findings = buildFindings(
      [chunk("1760832000.m4a"), chunk("1760832611.webm")],
      null,
    );

    expect(
      findings.some(
        (f) => f.level === "error" && f.message.includes("Mixed audio"),
      ),
    ).toBe(true);
  });

  test("a folder of only non-audio objects reports no supported extension", () => {
    const findings = buildFindings(
      [object({ basename: "notes.txt", isAudio: false })],
      null,
    );

    expect(
      findings.some((f) => f.message.includes("supported audio extension")),
    ).toBe(true);
  });

  test("a stitched final with no DB path points at the post-upload ffprobe step", () => {
    const findings = buildFindings(
      [chunk("1760832000.m4a"), chunk("final.m4a")],
      null,
    );

    const warn = findings.find((f) => f.level === "warn");
    expect(warn?.message).toContain("ffprobe");
  });

  test("a stitched final that matches the DB is only informational", () => {
    const findings = buildFindings(
      [chunk("1760832000.m4a"), chunk("final.m4a")],
      "US_NE/ck1/final.m4a",
    );

    expect(findings.some((f) => f.level === "warn")).toBe(false);
    expect(
      findings.some((f) => f.message.includes("duplicating the audio")),
    ).toBe(true);
  });

  test("flags a missing moov atom, which metadata alone cannot reveal", () => {
    const findings = buildFindings(
      [
        object({ basename: "1760832000.m4a", size: 2_500_000, mp4: intactMp4 }),
        object({ basename: "1760832611.m4a", size: 4_100_000, mp4: noMoovMp4 }),
      ],
      null,
    );

    const error = findings.find(
      (f) => f.level === "error" && f.message.includes("moov"),
    );
    expect(error?.message).toContain("1760832611.m4a");
    expect(error?.message).toContain("recording was interrupted");
    // The whole point: the file is multi-megabyte and passes every size check.
    expect(findings.some((f) => f.message.includes("zero-byte"))).toBe(false);
  });

  test("a healthy-looking folder of intact containers says so explicitly", () => {
    const findings = buildFindings(
      [
        object({ basename: "1760832000.m4a", size: 2_500_000, mp4: intactMp4 }),
        object({ basename: "1760832611.m4a", size: 1_900_000, mp4: intactMp4 }),
      ],
      "US_NE/ck1/final.m4a",
    );

    expect(levels(findings)).not.toContain("error");
    expect(findings.some((f) => f.message.includes("look intact"))).toBe(true);
  });

  test("flags a truncated upload with the offset that overran", () => {
    const findings = buildFindings(
      [
        object({
          basename: "1760832611.m4a",
          size: 124,
          mp4: { ...noMoovMp4, truncatedAt: 24 },
        }),
      ],
      null,
    );

    const error = findings.find((f) => f.message.includes("truncated"));
    expect(error?.level).toBe("error");
    expect(error?.message).toContain("offset 24");
  });

  test("flags a file that is not a readable MP4", () => {
    const findings = buildFindings(
      [
        object({
          basename: "1760832611.m4a",
          size: 5000,
          mp4: {
            boxes: [],
            hasFtyp: false,
            hasMoov: false,
            hasMdat: false,
            parseError: "Does not begin with an MP4 box header.",
          },
        }),
      ],
      null,
    );

    expect(
      findings.some(
        (f) => f.level === "error" && f.message.includes("not readable as MP4"),
      ),
    ).toBe(true);
  });

  test("notes re-uploaded files, which a re-stitch would also consume", () => {
    const findings = buildFindings(
      [chunk("1760832000.m4a"), chunk("reupload-1760900000.m4a")],
      null,
    );

    expect(
      findings.some((f) => f.message.includes("re-uploaded file(s)")),
    ).toBe(true);
  });
});
