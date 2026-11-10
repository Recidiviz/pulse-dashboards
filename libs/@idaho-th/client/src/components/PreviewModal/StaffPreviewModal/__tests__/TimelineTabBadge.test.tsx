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

import {
  ProviderTimelineTabBadge,
  StaffTimelineTabBadge,
} from "../TimelineTabBadge";

const testDoubles = vi.hoisted(() => ({
  staffNewEventCount: 0,
  providerNewEventCount: 0,
}));

vi.mock("../../../../datastores/IdahoTHStoreContext", () => ({
  useHousingApplicationsStore: () => ({
    currentApplicationId: "app-1",
  }),
  useIdahoTHStore: () => ({
    housingApplicationsStore: {
      currentApplicationId: "app-1",
    },
  }),
}));

vi.mock("../../../../hooks/useTimeline", () => ({
  useStaffTimeline: () => ({
    data: { newEventCount: testDoubles.staffNewEventCount },
  }),
  useProviderTimeline: () => ({
    data: { newEventCount: testDoubles.providerNewEventCount },
  }),
}));

describe("TimelineTabBadge", () => {
  beforeEach(() => {
    testDoubles.staffNewEventCount = 0;
    testDoubles.providerNewEventCount = 0;
  });

  it("hides the staff badge when there are no new timeline events", () => {
    const { container } = render(<StaffTimelineTabBadge detailLoaded />);
    expect(container).toBeEmptyDOMElement();
  });

  it("shows the staff new-event count and caps at 99+", () => {
    testDoubles.staffNewEventCount = 3;
    const { unmount } = render(<StaffTimelineTabBadge detailLoaded />);
    expect(screen.getByText("3")).toBeInTheDocument();
    unmount();

    testDoubles.staffNewEventCount = 120;
    render(<StaffTimelineTabBadge detailLoaded />);
    expect(screen.getByText("99+")).toBeInTheDocument();
  });

  it("shows the provider new-event count", () => {
    testDoubles.providerNewEventCount = 1;
    render(<ProviderTimelineTabBadge detailLoaded />);
    expect(screen.getByText("1")).toBeInTheDocument();
  });
});
