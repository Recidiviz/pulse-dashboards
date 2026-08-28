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

import { normalizeNameCasing } from "~@meetings/tasks/llm/utils";

describe("formatPersonName", () => {
  test("normalizes all-caps names", () => {
    expect(normalizeNameCasing("JEWEL HILPERT")).toBe("Jewel Hilpert");
  });

  test("keeps compound names intact", () => {
    expect(normalizeNameCasing("PATTIE SCHILLER-GRAHAM")).toBe(
      "Pattie Schiller-Graham",
    );
    expect(normalizeNameCasing("SEAN O'BRIEN")).toBe("Sean O'Brien");
    expect(normalizeNameCasing("D'ANGELO VANDERVORT")).toBe(
      "D'Angelo Vandervort",
    );
  });

  test("normalizes accented names", () => {
    expect(normalizeNameCasing("JOSÉ GONÇALVES")).toBe("José Gonçalves");
  });

  test("leaves words that already have lowercase letters alone", () => {
    expect(normalizeNameCasing("Jane McDonald")).toBe("Jane McDonald");
    expect(normalizeNameCasing("Ana de la Cruz")).toBe("Ana de la Cruz");
    expect(normalizeNameCasing("MARIA de la Cruz")).toBe("Maria de la Cruz");
  });

  test("handles names with initials and empty input", () => {
    expect(normalizeNameCasing("J.R. SMITH")).toBe("J.R. Smith");
    expect(normalizeNameCasing("")).toBe("");
  });
});
