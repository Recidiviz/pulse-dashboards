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

import { render, screen } from "@testing-library/react";
import { Mock } from "vitest";

import { useRootStore } from "../../../../components/StoreProvider";
import { ParolePublicCalendar } from "../ParolePublicCalendar";

vi.mock("../../../../components/StoreProvider", () => ({
  useRootStore: vi.fn(),
}));
vi.mock("../../UsCo/UsCoParolePublicCalendarView", () => ({
  UsCoParolePublicCalendarView: () => <div data-testid="us-co-calendar" />,
}));

describe("ParolePublicCalendar", () => {
  it("renders the Colorado Public Calendar for US_CO", () => {
    (useRootStore as Mock).mockReturnValue({ currentTenantId: "US_CO" });

    render(<ParolePublicCalendar />);

    expect(screen.getByTestId("us-co-calendar")).toBeInTheDocument();
  });

  it.each(["US_ID", undefined])(
    "throws for tenant %s, which has no Public Calendar component",
    (currentTenantId) => {
      vi.spyOn(console, "error").mockImplementation(() => undefined);
      (useRootStore as Mock).mockReturnValue({ currentTenantId });

      expect(() => render(<ParolePublicCalendar />)).toThrow(
        `Tenant [${currentTenantId}] has no Parole Public Calendar component.`,
      );
    },
  );
});
