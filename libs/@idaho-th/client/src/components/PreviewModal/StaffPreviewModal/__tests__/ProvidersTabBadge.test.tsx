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

import { render } from "@testing-library/react";

import { APPLICATION_STAGE, APPLICATION_SUB_STAGE } from "~@idaho-th/shared";

import { ProvidersTabBadge } from "../ProvidersTabBadge";

const testDoubles = vi.hoisted(() => ({
  application: {
    sentToProvidersAt: new Date("2026-04-01") as Date | null,
    homePlan: null as unknown,
  },
  providers: [] as Array<{ stage: string; subStage: string }>,
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

vi.mock("../../../../hooks/useApplicationDetail", () => ({
  useStaffApplicationById: () => ({
    data: testDoubles.application,
  }),
  useStaffApplicationProviders: () => ({
    data: { providers: testDoubles.providers },
  }),
}));

describe("ProvidersTabBadge", () => {
  beforeEach(() => {
    testDoubles.application = {
      sentToProvidersAt: new Date("2026-04-01"),
      homePlan: null,
    };
    testDoubles.providers = [
      {
        stage: APPLICATION_STAGE.APPLICATION,
        subStage: APPLICATION_SUB_STAGE.CONDITIONALLY_APPROVED,
      },
      {
        stage: APPLICATION_STAGE.APPLICATION,
        subStage: APPLICATION_SUB_STAGE.INFO_NEEDED,
      },
      {
        stage: APPLICATION_STAGE.APPLICATION,
        subStage: APPLICATION_SUB_STAGE.PROVIDER_REVIEW,
      },
      {
        stage: APPLICATION_STAGE.CLOSED,
        subStage: APPLICATION_SUB_STAGE.CONDITIONALLY_APPROVED,
      },
    ];
  });

  it("shows a badge counting Approved and Info Needed responses", () => {
    const screen = render(<ProvidersTabBadge detailLoaded />);
    expect(screen.getByText("2")).toBeInTheDocument();
  });

  it("hides the badge before the application is sent to providers", () => {
    testDoubles.application.sentToProvidersAt = null;
    const { container } = render(<ProvidersTabBadge detailLoaded />);
    expect(container).toBeEmptyDOMElement();
  });

  it("hides the badge once a home plan is set", () => {
    testDoubles.application.homePlan = { type: "PROVIDER" };
    const { container } = render(<ProvidersTabBadge detailLoaded />);
    expect(container).toBeEmptyDOMElement();
  });

  it("caps large counts at 99+", () => {
    testDoubles.providers = Array.from({ length: 100 }, () => ({
      stage: APPLICATION_STAGE.APPLICATION,
      subStage: APPLICATION_SUB_STAGE.CONDITIONALLY_APPROVED,
    }));
    const screen = render(<ProvidersTabBadge detailLoaded />);
    expect(screen.getByText("99+")).toBeInTheDocument();
  });

  it("hides the badge when no providers need Approved or Info Needed actions", () => {
    testDoubles.providers = [
      {
        stage: APPLICATION_STAGE.APPLICATION,
        subStage: APPLICATION_SUB_STAGE.PROVIDER_REVIEW,
      },
      {
        stage: APPLICATION_STAGE.CLOSED,
        subStage: APPLICATION_SUB_STAGE.DECLINED,
      },
    ];
    const { container } = render(<ProvidersTabBadge detailLoaded />);
    expect(container).toBeEmptyDOMElement();
  });
});
