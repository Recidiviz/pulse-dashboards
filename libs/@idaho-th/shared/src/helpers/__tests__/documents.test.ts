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

import { getDisplayFileName } from "../documents";

describe("getDisplayFileName", () => {
  it("uses PRD naming for digitized and handwritten application PDFs", () => {
    expect(getDisplayFileName("DIGITIZED", "ignored.pdf", "Jane Doe")).toBe(
      "Jane Doe_digitized-application.pdf",
    );
    expect(
      getDisplayFileName("HANDWRITTEN_SOURCE", "ignored.pdf", "Jane Doe"),
    ).toBe("Jane Doe_handwritten-application.pdf");
  });

  it("falls back to application prefix when client name is empty", () => {
    expect(getDisplayFileName("DIGITIZED", "x.pdf", "")).toBe(
      "application_digitized-application.pdf",
    );
  });

  it("returns the stored file name for user-uploaded documents", () => {
    expect(getDisplayFileName("USER_UPLOAD", "rules.pdf", "Jane Doe")).toBe(
      "rules.pdf",
    );
  });
});
