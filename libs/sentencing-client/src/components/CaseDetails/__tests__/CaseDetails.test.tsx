// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2024 Recidiviz, Inc.
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
import { configure } from "mobx";
import { MemoryRouter, Route, Routes } from "react-router-dom";

import {
  CaseDetailsFixture,
  StaffInfoFixture,
} from "../../../api/offlineFixtures";
import { PSIStore } from "../../../datastores/PSIStore";
import { CaseDetailsPresenter } from "../../../presenters/CaseDetailsPresenter";
import { createMockPSIStore } from "../../../utils/test";
import { CaseDetails } from "../CaseDetails";

let psiStore: PSIStore;
let presenter: CaseDetailsPresenter;
const mockCase = Object.values(CaseDetailsFixture)[0];
const caseId = mockCase.id;
// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
const clientExternalId = mockCase.client!.externalId;

beforeEach(() => {
  configure({ safeDescriptors: false });
  psiStore = createMockPSIStore();
  presenter = new CaseDetailsPresenter(psiStore.caseStore, caseId);

  vi.spyOn(psiStore.staffStore, "loadStaffInfo");
  vi.spyOn(psiStore.apiClient, "getStaffInfo").mockResolvedValue(
    StaffInfoFixture,
  );
  vi.spyOn(psiStore.caseStore, "loadCaseDetails");
  vi.spyOn(psiStore.apiClient, "getCaseDetails").mockResolvedValue(mockCase);
});

afterEach(() => {
  vi.restoreAllMocks();
});

test("loads onboarding screen when user first accesses the case", async () => {
  await presenter.hydrate();
  const screen = render(
    <MemoryRouter
      initialEntries={[`/dashboard/${psiStore.staffPseudoId}/case/${caseId}`]}
    >
      <Routes>
        <Route
          path="/dashboard/:staffPseudoId/case/:caseId"
          element={<CaseDetails psiStore={psiStore} />}
        />
      </Routes>
    </MemoryRouter>,
  );

  const firstName = presenter.caseAttributes?.client?.fullName.split(" ")[0];
  const onboardingCaption = await screen.getByText(
    `Let's get some details about ${firstName}'s case to enhance the historical insights`,
  );
  const offenseField = await screen.getByText("Offense");
  const lsirScoreField = await screen.getByText("Draft LSI-R Score");

  expect(onboardingCaption).toBeInTheDocument();
  expect(offenseField).toBeInTheDocument();
  expect(lsirScoreField).toBeInTheDocument();
});

test("display case details page", async () => {
  await presenter.hydrate();
  vi.spyOn(psiStore.caseStore, "caseDetailsById", "get").mockReturnValue({
    ...psiStore.caseStore.caseDetailsById,
    [caseId]: {
      ...psiStore.caseStore.caseDetailsById[caseId],
      currentOnboardingTopic: "Done",
    },
  });

  const screen = render(
    <MemoryRouter
      initialEntries={[`/dashboard/${psiStore.staffPseudoId}/case/${caseId}`]}
    >
      <Routes>
        <Route
          path="/dashboard/:staffPseudoId/case/:caseId"
          element={<CaseDetails psiStore={psiStore} />}
        />
      </Routes>
    </MemoryRouter>,
  );
  const fullName = presenter.caseAttributes?.client?.fullName ?? "";
  const backToDashboard = await screen.getByText(`Back to Dashboard`);
  const clientName = await screen.getByText(fullName);
  const editCaseDetailsButton = await screen.getByText("Edit Case Details");
  const insights = await screen.getByText("Edit Case Details");
  const createRecommendations = await screen.getByText(
    "Create Recommendations",
  );
  const opportunities = await screen.getByText(
    `Opportunities for ${fullName.split(" ")[0]}`,
  );
  const caseIdNode = await screen.getByText(clientExternalId);

  expect(backToDashboard).toBeInTheDocument();
  expect(clientName).toBeInTheDocument();
  expect(editCaseDetailsButton).toBeInTheDocument();
  expect(insights).toBeInTheDocument();
  expect(createRecommendations).toBeInTheDocument();
  expect(opportunities).toBeInTheDocument();
  expect(caseIdNode).toBeInTheDocument();
});

test("probation recommendation selected by default", async () => {
  await presenter.hydrate();
  vi.spyOn(psiStore.caseStore, "caseDetailsById", "get").mockReturnValue({
    ...psiStore.caseStore.caseDetailsById,
    [caseId]: {
      ...psiStore.caseStore.caseDetailsById[caseId],
      currentOnboardingTopic: "Done",
    },
  });

  const screen = render(
    <MemoryRouter
      initialEntries={[`/dashboard/${psiStore.staffPseudoId}/case/${caseId}`]}
    >
      <Routes>
        <Route
          path="/dashboard/:staffPseudoId/case/:caseId"
          element={<CaseDetails psiStore={psiStore} />}
        />
      </Routes>
    </MemoryRouter>,
  );

  const probationInput = (await screen.getByLabelText(
    "Probation",
  )) as HTMLInputElement;
  const riderInput = (await screen.getByLabelText("Rider")) as HTMLInputElement;
  const termInput = (await screen.getByLabelText("Term")) as HTMLInputElement;
  const noRecommendationInput = (await screen.getByLabelText(
    "I do not wish to make a recommendation",
  )) as HTMLInputElement;

  expect(probationInput.checked).toBeTrue();
  expect(riderInput.checked).toBeFalse();
  expect(termInput.checked).toBeFalse();
  expect(noRecommendationInput.checked).toBeFalse();
});
