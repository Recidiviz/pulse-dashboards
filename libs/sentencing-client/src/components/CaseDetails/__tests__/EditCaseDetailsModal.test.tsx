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

import { fireEvent, render } from "@testing-library/react";
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
import { caseDetailsFormTemplate } from "../Form/CaseDetailsFormTemplate";

let psiStore: PSIStore;
let presenter: CaseDetailsPresenter;
const mockCase = Object.values(CaseDetailsFixture)[0];
const caseId = mockCase.id;

const nonNestedFormLabels = caseDetailsFormTemplate.map((field) => field.label);
const nestedFormLabels = caseDetailsFormTemplate.reduce((acc, field) => {
  if (field.nested) {
    field.nested.forEach((nestedField) => acc.push(nestedField.label));
  }
  return acc;
}, [] as string[]);

beforeEach(() => {
  configure({ safeDescriptors: false });
  psiStore = createMockPSIStore();
  presenter = new CaseDetailsPresenter(psiStore.caseStore, caseId);

  vi.spyOn(psiStore.staffStore, "loadStaffInfo");
  vi.spyOn(psiStore.apiClient, "getStaffInfo").mockResolvedValue(
    StaffInfoFixture,
  );
  vi.spyOn(psiStore.caseStore, "loadCaseDetails");
  vi.spyOn(psiStore.apiClient, "getCaseDetails").mockResolvedValue(
    CaseDetailsFixture[caseId],
  );
  vi.spyOn(psiStore.caseStore, "caseDetailsById", "get").mockReturnValue({
    ...psiStore.caseStore.caseDetailsById,
    [caseId]: {
      ...mockCase,
      currentOnboardingTopic: "Done",
    },
  });
});

afterEach(() => {
  vi.restoreAllMocks();
});

test("clicking edit case details button opens the edit case details modal", async () => {
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

  const editCaseDetailsButton = await screen.getByText("Edit Case Details");
  expect(editCaseDetailsButton).toBeInTheDocument();
  fireEvent.click(editCaseDetailsButton);

  const firstName = presenter.clientInfo?.fullName.split(" ")[0];
  const editCaseDetailsTitles = await screen.getAllByText("Edit Case Details");
  const editCaseDetailsDescription = await screen.getByText(
    `We will use this data to generate opportunities for ${firstName}. If you don't have this information yet, you can add it in later.`,
  );
  const cancelButton = await screen.getByText("Cancel");
  const saveButton = await screen.getByText("Save");

  expect(editCaseDetailsTitles[1]).toBeInTheDocument();
  expect(editCaseDetailsDescription).toBeInTheDocument();
  expect(cancelButton).toBeInTheDocument();
  expect(saveButton).toBeInTheDocument();
});

test("shows all of the non-nested fields", async () => {
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

  const editCaseDetailsButton = await screen.getByText("Edit Case Details");
  fireEvent.click(editCaseDetailsButton);

  const offenseField = await screen.getByText(nonNestedFormLabels[0]);
  const draftLsirScoreField = await screen.getByText(nonNestedFormLabels[1]);
  const primaryNeedsField = await screen.getByText(nonNestedFormLabels[2]);
  const substanceUseDisorderField = await screen.getByText(
    nonNestedFormLabels[3],
  );
  const mentalHealthDiagnosisField = await screen.getByText(
    nonNestedFormLabels[4],
  );
  const priorHistoryOfSupervisionIncarcerationField = await screen.getByText(
    nonNestedFormLabels[5],
  );
  const isVeteranField = await screen.getByText(nonNestedFormLabels[6]);
  const developmentalDisabilityField = await screen.getByText(
    nonNestedFormLabels[7],
  );
  const childProtectiveServicesField = await screen.getByText(
    nonNestedFormLabels[8],
  );
  const pleaField = await screen.getByText(nonNestedFormLabels[9]);

  expect(offenseField).toBeInTheDocument();
  expect(draftLsirScoreField).toBeInTheDocument();
  expect(primaryNeedsField).toBeInTheDocument();
  expect(substanceUseDisorderField).toBeInTheDocument();
  expect(mentalHealthDiagnosisField).toBeInTheDocument();
  expect(priorHistoryOfSupervisionIncarcerationField).toBeInTheDocument();
  expect(isVeteranField).toBeInTheDocument();
  expect(developmentalDisabilityField).toBeInTheDocument();
  expect(childProtectiveServicesField).toBeInTheDocument();
  expect(pleaField).toBeInTheDocument();
});

test("shows ASAM level of care recommendation only when 'Mild', 'Moderate', or 'Severe' option is selected for substance use disorder diagnosis", async () => {
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

  const editCaseDetailsButton = await screen.getByText("Edit Case Details");
  fireEvent.click(editCaseDetailsButton);

  let asamLevelOfCareField = await screen.queryByText(nestedFormLabels[0]);
  expect(asamLevelOfCareField).toBeNull();

  const noneOption = await screen.getByText("None");
  const mildOption = await screen.getByText("Mild");
  const moderateOption = await screen.getByText("Moderate");
  const severeOption = await screen.getByText("Severe");
  const notSureYetOption = await screen.getAllByText("Not sure yet");

  fireEvent.click(mildOption);

  asamLevelOfCareField = await screen.queryByText(nestedFormLabels[0]);
  expect(asamLevelOfCareField).not.toBeNull();

  fireEvent.click(noneOption);

  asamLevelOfCareField = await screen.queryByText(nestedFormLabels[0]);
  expect(asamLevelOfCareField).toBeNull();

  fireEvent.click(moderateOption);

  asamLevelOfCareField = await screen.queryByText(nestedFormLabels[0]);
  expect(asamLevelOfCareField).not.toBeNull();

  fireEvent.click(notSureYetOption[1]);

  asamLevelOfCareField = await screen.queryByText(nestedFormLabels[0]);
  expect(asamLevelOfCareField).toBeNull();

  fireEvent.click(severeOption);

  asamLevelOfCareField = await screen.queryByText(nestedFormLabels[0]);
  expect(asamLevelOfCareField).not.toBeNull();
});

test("shows/hides Other text field when 'Other' option is selected/deselected", async () => {
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

  const editCaseDetailsButton = await screen.getByText("Edit Case Details");
  fireEvent.click(editCaseDetailsButton);

  const otherOption = await screen.getByText("Other");

  fireEvent.click(otherOption);

  let otherTextField: HTMLElement | null = await screen.getByPlaceholderText(
    "Please specify other need",
  );

  expect(otherTextField).toBeInTheDocument();

  fireEvent.click(otherOption); // Deselect Other option

  otherTextField = await screen.queryByPlaceholderText(
    "Please specify other need",
  );
  expect(otherTextField).toBeNull();
});

test("shows supervision/incarceration nested fields when 'No' is selected for prior history of incarceration", async () => {
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

  const editCaseDetailsButton = await screen.getByText("Edit Case Details");
  fireEvent.click(editCaseDetailsButton);

  const priorHistoryOfSupervisionIncarcerationNoOptions =
    await screen.getAllByText("Yes");
  const priorHistoryOfSupervisionIncarcerationNoOption =
    priorHistoryOfSupervisionIncarcerationNoOptions[1];

  let hasPriorFelonyConvictionField = await screen.queryByText(
    nestedFormLabels[1],
  );
  let hasPriorViolentOffenseField = await screen.queryByText(
    nestedFormLabels[2],
  );
  let hasPriorSexOffenseField = await screen.queryByText(nestedFormLabels[3]);
  let hasPriorTreatmentCourtField = await screen.queryByText(
    nestedFormLabels[4],
  );

  expect(hasPriorFelonyConvictionField).toBeNull();
  expect(hasPriorViolentOffenseField).toBeNull();
  expect(hasPriorSexOffenseField).toBeNull();
  expect(hasPriorTreatmentCourtField).toBeNull();

  fireEvent.click(priorHistoryOfSupervisionIncarcerationNoOption);

  hasPriorFelonyConvictionField = await screen.queryByText(nestedFormLabels[1]);
  hasPriorViolentOffenseField = await screen.queryByText(nestedFormLabels[2]);
  hasPriorSexOffenseField = await screen.queryByText(nestedFormLabels[3]);
  hasPriorTreatmentCourtField = await screen.queryByText(nestedFormLabels[4]);

  expect(hasPriorFelonyConvictionField).not.toBeNull();
  expect(hasPriorViolentOffenseField).not.toBeNull();
  expect(hasPriorSexOffenseField).not.toBeNull();
  expect(hasPriorTreatmentCourtField).not.toBeNull();
});

test("error message displays when invalid lsir score is given and saving is disabled", async () => {
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

  const editCaseDetailsButton = await screen.getByText("Edit Case Details");
  fireEvent.click(editCaseDetailsButton);

  const lsirScoreInput = await screen.getByLabelText("Draft LSI-R Score");
  let errorMessage = await screen.queryByText(
    "Please enter a number between 0 and 54.",
  );
  const saveButton = await screen.getByText("Save");

  expect(lsirScoreInput).toHaveValue("");
  expect(errorMessage).toBeNull();
  expect(saveButton).not.toBeDisabled();

  fireEvent.change(lsirScoreInput, { target: { value: "55" } });
  expect(lsirScoreInput).toHaveValue("55");

  errorMessage = await screen.queryByText(
    "Please enter a number between 0 and 54.",
  );
  expect(errorMessage).not.toBeNull();
  expect(saveButton).toBeDisabled();

  fireEvent.change(lsirScoreInput, { target: { value: "54" } });
  expect(lsirScoreInput).toHaveValue("54");

  errorMessage = await screen.queryByText(
    "Please enter a number between 0 and 54.",
  );
  expect(errorMessage).toBeNull();
  expect(saveButton).not.toBeDisabled();

  fireEvent.change(lsirScoreInput, { target: { value: "23" } });
  expect(lsirScoreInput).toHaveValue("23");

  errorMessage = await screen.queryByText(
    "Please enter a number between 0 and 54.",
  );
  expect(errorMessage).toBeNull();
  expect(saveButton).not.toBeDisabled();

  fireEvent.change(lsirScoreInput, { target: { value: "0" } });
  expect(lsirScoreInput).toHaveValue("0");

  errorMessage = await screen.queryByText(
    "Please enter a number between 0 and 54.",
  );
  expect(errorMessage).toBeNull();
  expect(saveButton).not.toBeDisabled();

  fireEvent.change(lsirScoreInput, { target: { value: "99" } });
  expect(lsirScoreInput).toHaveValue("99");

  errorMessage = await screen.queryByText(
    "Please enter a number between 0 and 54.",
  );
  expect(errorMessage).not.toBeNull();
  expect(saveButton).toBeDisabled();

  fireEvent.change(lsirScoreInput, { target: { value: "9xyz" } });
  expect(lsirScoreInput).toHaveValue("9xyz");

  errorMessage = await screen.queryByText(
    "Please enter a number between 0 and 54.",
  );
  expect(errorMessage).not.toBeNull();
  expect(saveButton).toBeDisabled();
});
