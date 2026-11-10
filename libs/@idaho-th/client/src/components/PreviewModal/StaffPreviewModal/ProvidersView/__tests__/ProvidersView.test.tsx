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

import { APPLICATION_STAGE } from "~@idaho-th/shared";

import { ProvidersView } from "../ProvidersView";

const testDoubles = vi.hoisted(() => ({
  application: {
    sentToProvidersAt: null as Date | null,
    homePlan: null as unknown,
    stage: "APPLICATION" as string,
  },
}));

vi.mock("../../../../../datastores/IdahoTHStoreContext", () => ({
  useHousingApplicationsStore: () => ({
    currentApplicationId: "app-1",
  }),
}));

vi.mock("../../../../../hooks/useApplicationDetail", () => ({
  useStaffApplicationById: () => ({
    data: testDoubles.application,
  }),
}));

vi.mock("../../ProviderResponses", () => ({
  ProviderResponses: () => <div>Provider responses view</div>,
}));

vi.mock("../../ProviderSelectionView/ProviderSelectionView", () => ({
  ProviderSelectionView: () => <div>Provider selection view</div>,
}));

describe("ProvidersView", () => {
  beforeEach(() => {
    testDoubles.application = {
      sentToProvidersAt: null,
      homePlan: null,
      stage: APPLICATION_STAGE.APPLICATION,
    };
  });

  it("shows provider selection before the application is sent", () => {
    render(<ProvidersView />);
    expect(screen.getByText("Provider selection view")).toBeInTheDocument();
    expect(
      screen.queryByText("Provider responses view"),
    ).not.toBeInTheDocument();
  });

  it("shows provider responses after the application has been sent", () => {
    testDoubles.application.sentToProvidersAt = new Date("2026-04-01");
    render(<ProvidersView />);
    expect(screen.getByText("Provider responses view")).toBeInTheDocument();
  });

  it("shows provider responses once a home plan is set", () => {
    testDoubles.application.homePlan = { id: "home-plan-1" };
    render(<ProvidersView />);
    expect(screen.getByText("Provider responses view")).toBeInTheDocument();
  });

  it("shows provider responses when the case is closed", () => {
    testDoubles.application.stage = APPLICATION_STAGE.CLOSED;
    render(<ProvidersView />);
    expect(screen.getByText("Provider responses view")).toBeInTheDocument();
  });
});
