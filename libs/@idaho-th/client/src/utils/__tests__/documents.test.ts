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

import { formatFileSize, resolveMimeType } from "../documents";

describe("resolveMimeType", () => {
  it("prefers the browser-provided MIME type when present", () => {
    const file = new File([""], "scan.pdf", { type: "application/pdf" });
    expect(resolveMimeType(file)).toBe("application/pdf");
  });

  it("infers MIME type from allowed extensions when type is empty", () => {
    expect(resolveMimeType(new File([""], "photo.JPG", { type: "" }))).toBe(
      "image/jpeg",
    );
    expect(resolveMimeType(new File([""], "doc.docx", { type: "" }))).toBe(
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    );
    expect(resolveMimeType(new File([""], "img.heic", { type: "" }))).toBe(
      "image/heic",
    );
  });

  it("returns an empty string for unknown extensions without a MIME type", () => {
    expect(resolveMimeType(new File([""], "notes.txt", { type: "" }))).toBe("");
  });
});

describe("formatFileSize", () => {
  it("formats byte sizes as megabytes with two decimals", () => {
    expect(formatFileSize(0)).toBe("0.00 MB");
    expect(formatFileSize(1024 * 1024)).toBe("1.00 MB");
  });
});
