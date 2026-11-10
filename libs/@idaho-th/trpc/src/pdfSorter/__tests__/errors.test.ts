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

import { PdfProcessingError } from "~@idaho-th/trpc/pdfSorter/errors";

describe("PdfProcessingError", () => {
  it("is server-caused unless a throw site says the document caused it", () => {
    expect(new PdfProcessingError("queue is full").userCaused).toBe(false);
    expect(
      new PdfProcessingError("too many pages", { userCaused: true }).userCaused,
    ).toBe(true);
  });

  it("keeps its cause alongside the flag", () => {
    const cause = new Error("underlying");

    const error = new PdfProcessingError("wrapped", {
      cause,
      userCaused: true,
    });

    expect(error.cause).toBe(cause);
    expect(error.name).toBe("PdfProcessingError");
  });
});
