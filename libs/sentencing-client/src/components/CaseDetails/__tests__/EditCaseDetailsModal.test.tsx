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

import { createMockPSIStore } from "../../../../src/utils/test";
import { formatPossessiveName } from "../../../../src/utils/utils";
import {
  CaseDetailsFixture,
  StaffInfoFixture,
} from "../../../api/offlineFixtures";
import { PSIStore } from "../../../datastores/PSIStore";
import { CaseDetailsPresenter } from "../../../presenters/CaseDetailsPresenter";
import { CaseDetails } from "../CaseDetails";

let psiStore: PSIStore;
let presenter: CaseDetailsPresenter;
const mockCase = Object.values(CaseDetailsFixture)[0];
const caseId = mockCase.id;

const OFFENSE_FIELD_LABEL = "Offense";
const LSIR_SCORE_FIELD_LABEL = "LSI-R Score";
const GENDER_FIELD_LABEL = "Gender";
const REPORT_TYPE_FIELD_LABEL = "Report Type";
const SUBSTANCE_USE_DISORDER_FIELD_LABEL = "Substance use disorder diagnosis";
const MENTAL_HEALTH_DIAGNOSIS_FIELD_LABEL = "Mental health diagnoses";
const PRIOR_HISTORY_OF_SUPERVISION_FIELD_LABEL =
  "Has a prior history of supervision/incarceration";
const IS_VETERAN_FIELD_LABEL = "Is a veteran";
const DEVELOPMENTAL_DISABILITY_FIELD_LABEL = "Has a developmental disability";
const CPS_FIELD_LABEL = "Has an open child protective services case";
const PLEA_FIELD_LABEL = "Plea";
const ASAM_FIELD_LABEL = "ASAM level of care recommendation";
const PRIOR_FELONY_FIELD_LABEL = "Has a prior felony conviction";
const PRIOR_VIOLENT_OFFENSE_FIELD_LABEL =
  "Has a prior violent offense conviction";
const PRIOR_SEX_OFFENSE_FIELD_LABEL = "Has a prior sex offense conviction";
const PRIOR_TREATMENT_COURT_FIELD_LABEL =
  "Has previously participated in a treatment court";
const ERROR_MESSAGE_STRING = "Please enter a number between 0 and 54.";

beforeEach(() => {
  configure({ safeDescriptors: false });
  psiStore = createMockPSIStore();
  presenter = new CaseDetailsPresenter(psiStore.caseStore, caseId);

  vi.spyOn(psiStore, "activeFeatureVariants", "get").mockReturnValue({
    protectiveFactors: {},
  });
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

  const firstName = presenter.caseAttributes?.client?.firstName;
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

  const offenseField = await screen.getByText(OFFENSE_FIELD_LABEL);
  const draftLsirScoreField = await screen.getByText(LSIR_SCORE_FIELD_LABEL);
  const genderField = await screen.getByText(GENDER_FIELD_LABEL);
  const reportTypeField = await screen.getByText(REPORT_TYPE_FIELD_LABEL);
  const PRIMARY_NEEDS_FIELD_LABEL = `What are ${formatPossessiveName(presenter.caseAttributes.client?.firstName)} primary needs? Select all that apply.`;
  const primaryNeedsField = await screen.getByText(PRIMARY_NEEDS_FIELD_LABEL);
  const substanceUseDisorderField = await screen.getByText(
    SUBSTANCE_USE_DISORDER_FIELD_LABEL,
  );
  const mentalHealthDiagnosisField = await screen.getByText(
    MENTAL_HEALTH_DIAGNOSIS_FIELD_LABEL,
  );
  const priorHistoryOfSupervisionIncarcerationField = await screen.getByText(
    PRIOR_HISTORY_OF_SUPERVISION_FIELD_LABEL,
  );
  const isVeteranField = await screen.getByText(IS_VETERAN_FIELD_LABEL);
  const developmentalDisabilityField = await screen.getByText(
    DEVELOPMENTAL_DISABILITY_FIELD_LABEL,
  );
  const childProtectiveServicesField = await screen.getByText(CPS_FIELD_LABEL);
  const pleaField = await screen.getByText(PLEA_FIELD_LABEL);

  expect(offenseField).toBeInTheDocument();
  expect(draftLsirScoreField).toBeInTheDocument();
  expect(genderField).toBeInTheDocument();
  expect(reportTypeField).toBeInTheDocument();
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

  let asamLevelOfCareField = await screen.queryByText(ASAM_FIELD_LABEL);
  expect(asamLevelOfCareField).toBeNull();

  const noneOption = await screen.getByText("None");
  const mildOption = await screen.getByText("Mild");
  const moderateOption = await screen.getByText("Moderate");
  const severeOption = await screen.getByText("Severe");
  const notSureYetOption = await screen.getAllByText("Not sure yet");

  fireEvent.click(mildOption);

  asamLevelOfCareField = await screen.queryByText(ASAM_FIELD_LABEL);
  expect(asamLevelOfCareField).not.toBeNull();

  fireEvent.click(noneOption);

  asamLevelOfCareField = await screen.queryByText(ASAM_FIELD_LABEL);
  expect(asamLevelOfCareField).toBeNull();

  fireEvent.click(moderateOption);

  asamLevelOfCareField = await screen.queryByText(ASAM_FIELD_LABEL);
  expect(asamLevelOfCareField).not.toBeNull();

  fireEvent.click(notSureYetOption[2]);

  asamLevelOfCareField = await screen.queryByText(ASAM_FIELD_LABEL);
  expect(asamLevelOfCareField).toBeNull();

  fireEvent.click(severeOption);

  asamLevelOfCareField = await screen.queryByText(ASAM_FIELD_LABEL);
  expect(asamLevelOfCareField).not.toBeNull();
});

test("shows/hides Other need text field when 'Other' option is selected/deselected", async () => {
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

  const otherOption = await screen.getAllByText("Other")[0];

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

test("shows/hides Other protective factor text field when 'Other' option is selected/deselected", async () => {
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

  const otherOption = await screen.getAllByText("Other");

  fireEvent.click(otherOption[otherOption.length - 1]);

  let otherTextField: HTMLElement | null = await screen.getByPlaceholderText(
    "Please specify other protective factor",
  );

  expect(otherTextField).toBeInTheDocument();

  fireEvent.click(otherOption[otherOption.length - 1]); // Deselect Other option

  otherTextField = await screen.queryByPlaceholderText(
    "Please specify other protective factor",
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
    PRIOR_FELONY_FIELD_LABEL,
  );
  let hasPriorViolentOffenseField = await screen.queryByText(
    PRIOR_VIOLENT_OFFENSE_FIELD_LABEL,
  );
  let hasPriorSexOffenseField = await screen.queryByText(
    PRIOR_SEX_OFFENSE_FIELD_LABEL,
  );
  let hasPriorTreatmentCourtField = await screen.queryByText(
    PRIOR_TREATMENT_COURT_FIELD_LABEL,
  );

  expect(hasPriorFelonyConvictionField).toBeNull();
  expect(hasPriorViolentOffenseField).toBeNull();
  expect(hasPriorSexOffenseField).toBeNull();
  expect(hasPriorTreatmentCourtField).toBeNull();

  fireEvent.click(priorHistoryOfSupervisionIncarcerationNoOption);

  hasPriorFelonyConvictionField = await screen.queryByText(
    PRIOR_FELONY_FIELD_LABEL,
  );
  hasPriorViolentOffenseField = await screen.queryByText(
    PRIOR_VIOLENT_OFFENSE_FIELD_LABEL,
  );
  hasPriorSexOffenseField = await screen.queryByText(
    PRIOR_SEX_OFFENSE_FIELD_LABEL,
  );
  hasPriorTreatmentCourtField = await screen.queryByText(
    PRIOR_TREATMENT_COURT_FIELD_LABEL,
  );

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

  const lsirScoreInput = await screen.getByLabelText("LSI-R Score Required*");
  let errorMessage = await screen.queryByText(ERROR_MESSAGE_STRING);
  const saveButton = await screen.getByText("Save");

  expect(lsirScoreInput).toHaveValue("");
  expect(saveButton).toBeDisabled();

  fireEvent.change(lsirScoreInput, { target: { value: "55" } });
  expect(lsirScoreInput).toHaveValue("55");

  errorMessage = await screen.queryByText(ERROR_MESSAGE_STRING);
  expect(errorMessage).not.toBeNull();
  expect(saveButton).toBeDisabled();

  fireEvent.change(lsirScoreInput, { target: { value: "54" } });
  expect(lsirScoreInput).toHaveValue("54");

  errorMessage = await screen.queryByText(ERROR_MESSAGE_STRING);
  expect(errorMessage).toBeNull();
  expect(saveButton).not.toBeDisabled();

  fireEvent.change(lsirScoreInput, { target: { value: "23" } });
  expect(lsirScoreInput).toHaveValue("23");

  errorMessage = await screen.queryByText(ERROR_MESSAGE_STRING);
  expect(errorMessage).toBeNull();
  expect(saveButton).not.toBeDisabled();

  fireEvent.change(lsirScoreInput, { target: { value: "0" } });
  expect(lsirScoreInput).toHaveValue("0");

  errorMessage = await screen.queryByText(ERROR_MESSAGE_STRING);
  expect(errorMessage).toBeNull();
  expect(saveButton).not.toBeDisabled();

  fireEvent.change(lsirScoreInput, { target: { value: "99" } });
  expect(lsirScoreInput).toHaveValue("99");

  errorMessage = await screen.queryByText(ERROR_MESSAGE_STRING);
  expect(errorMessage).not.toBeNull();
  expect(saveButton).toBeDisabled();

  fireEvent.change(lsirScoreInput, { target: { value: "9xyz" } });
  expect(lsirScoreInput).toHaveValue("9xyz");

  errorMessage = await screen.queryByText(ERROR_MESSAGE_STRING);
  expect(errorMessage).not.toBeNull();
  expect(saveButton).toBeDisabled();
});
