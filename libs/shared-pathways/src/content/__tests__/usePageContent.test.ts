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

import { PathwaysPage } from "../../views";
import usePageContent from "../usePageContent";

vi.mock("../page/default");
vi.mock("../page/us_id");

describe("Tests for usePageContent()", () => {
  it("uses the default prison copy.", () => {
    const { title, summary } = usePageContent(
      "US_XX",
      "prison" as PathwaysPage,
    );
    expect(title).toBe("Prison");
    expect(summary).toBe("Default prison summary");
  });

  it("uses the default supervision to liberty copy.", () => {
    const { title, summary } = usePageContent(
      "US_XX",
      "supervisionToLiberty" as PathwaysPage,
    );
    expect(title).toBe("Supervision to Liberty");
    expect(summary).toBe("Default supervision to liberty summary");
  });

  it("uses state-specific overrides when present", () => {
    const { title, summary } = usePageContent(
      "US_ID",
      "prison" as PathwaysPage,
    );
    expect(title).toBe("Prison");
    expect(summary).toBe("ID-specific prison summary");
  });

  it("falls back to defaults if page not in state-specific file", () => {
    const { title, summary } = usePageContent(
      "US_ID",
      "supervisionToLiberty" as PathwaysPage,
    );
    expect(title).toBe("Supervision to Liberty");
    expect(summary).toBe("Default supervision to liberty summary");
  });
});
