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

import type { ProviderHousingApplication } from "~@idaho-th/client/interfaces/common";
import { APPLICATION_SUB_STAGE } from "~@idaho-th/shared";

import { ProviderDetailView } from "../ProviderDetailView";

vi.mock("~@idaho-th/client/datastores/IdahoTHStoreContext", () => ({
  useIdahoTHStore: () => ({
    rootStore: { userStore: { user: { role: "STAFF", nickname: "Tester" } } },
  }),
  useUserStore: () => ({ user: { role: "STAFF", nickname: "Tester" } }),
  useHousingApplicationsStore: () => ({ currentApplicationId: "app-1" }),
}));

vi.mock("~@idaho-th/client/hooks/housingApplication", () => ({
  usePostStaffInfoReply: () => ({ mutateAsync: vi.fn() }),
}));

const RESPONSE: ProviderHousingApplication = {
  providerApplicationId: "provider-app-1",
  providerId: "provider-1",
  providerName: "Fake Provider",
  stage: "APPLICATION",
  subStage: APPLICATION_SUB_STAGE.PROVIDER_REVIEW,
  status: "WAITING",
  providerLocation: {
    id: "loc-1",
    providerId: "provider-1",
    district: "District 1",
    streetAddress: "100 Fake St",
    city: "Boise",
    state: "ID",
    zip: "83702",
    acceptedGenders: ["ALL"],
    acceptsRiders: true,
    acceptsSexOffenders: false,
    acceptsViolentCriminals: false,
    faithBased: false,
    housingType: null,
    populationsServed: null,
    addressUsedForPPInvestigation: false,
  },
  infoRequests: [],
  contact: {
    contactName: "Jane Doe",
    email: "jane.doe@example.com",
    contactPhone: "208-555-0100",
  },
  labels: [],
  isPreferred: false,
};

const noop = () => undefined;

function renderProviderDetailView() {
  return render(<ProviderDetailView provider={RESPONSE} onBack={noop} />);
}

describe("ProviderDetailView Location section", () => {
  it("renders the Location section header collapsed on mount", () => {
    renderProviderDetailView();

    expect(screen.getByText("Location")).toBeInTheDocument();
    expect(screen.queryByText("100 Fake St")).not.toBeInTheDocument();
  });

  it("renders the application's selected location once expanded, without the street address", () => {
    renderProviderDetailView();
    fireEvent.click(screen.getByText("Location"));

    expect(screen.queryByText("100 Fake St")).not.toBeInTheDocument();
    expect(screen.queryByText("Boise, ID 83702")).not.toBeInTheDocument();
    expect(screen.getByText("District")).toBeInTheDocument();
    expect(screen.getByText("District 1")).toBeInTheDocument();
  });
});
