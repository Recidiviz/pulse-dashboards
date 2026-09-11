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

import { fireEvent, render, screen } from "@testing-library/react";
import { ThemeProvider } from "styled-components";
import { Mock } from "vitest";

import { defaultPathwaysTheme } from "~shared-pathways";

import { EVENT_TYPES, EventType } from "../../../datastores/eventTypes";
import { useRootStore } from "../../StoreProvider";
import { EventTypeSelector } from "../EventTypeSelector";

vi.mock("../../StoreProvider");

const mockSetEventType = vi.fn();
const mockTrackEventTypeSelected = vi.fn();
const mockUseRootStore = useRootStore as Mock;

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <ThemeProvider theme={defaultPathwaysTheme}>{children}</ThemeProvider>
);

function renderSelector(eventType: EventType) {
  mockUseRootStore.mockReturnValue({
    eventType,
    setEventType: mockSetEventType,
    analyticsStore: { trackEventTypeSelected: mockTrackEventTypeSelected },
  });
  render(<EventTypeSelector />, { wrapper });
}

describe("EventTypeSelector", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("offers admissions, releases, and both", () => {
    renderSelector(EVENT_TYPES.ALL);

    expect(
      screen.getAllByRole("radio").map((radio) => radio.getAttribute("value")),
    ).toEqual([EVENT_TYPES.ADMISSIONS, EVENT_TYPES.ALL, EVENT_TYPES.RELEASES]);
  });

  it("checks the event type the store holds", () => {
    renderSelector(EVENT_TYPES.RELEASES);

    expect(screen.getByRole("radio", { name: "Releases" })).toBeChecked();
    expect(screen.getByRole("radio", { name: "Admissions" })).not.toBeChecked();
  });

  it("stores and tracks a newly picked event type", () => {
    renderSelector(EVENT_TYPES.ALL);

    fireEvent.click(screen.getByRole("radio", { name: "Admissions" }));

    expect(mockSetEventType).toHaveBeenCalledWith(EVENT_TYPES.ADMISSIONS);
    expect(mockTrackEventTypeSelected).toHaveBeenCalledWith({
      eventType: EVENT_TYPES.ADMISSIONS,
    });
  });

  it("ignores a pick of the event type already selected", () => {
    renderSelector(EVENT_TYPES.ADMISSIONS);

    fireEvent.click(screen.getByRole("radio", { name: "Admissions" }));

    expect(mockSetEventType).not.toHaveBeenCalled();
    expect(mockTrackEventTypeSelected).not.toHaveBeenCalled();
  });
});
