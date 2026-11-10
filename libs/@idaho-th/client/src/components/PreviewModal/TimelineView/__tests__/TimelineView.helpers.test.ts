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

import { formatActorRole } from "../TimelineView.helpers";

describe("formatActorRole", () => {
  it("maps timeline actor roles to CM-facing labels from the PRD", () => {
    expect(formatActorRole("STAFF")).toBe("Case Manager");
    expect(formatActorRole("PROVIDER")).toBe("Provider");
    expect(formatActorRole("SYSTEM")).toBe("System");
  });
});
