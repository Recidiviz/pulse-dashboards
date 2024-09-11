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

import { CaseDetailsFixture } from "../../../../api/offlineFixtures";
import { CaseDetailsPresenter } from "../../../../presenters/CaseDetailsPresenter";
import { createMockPSIStore } from "../../../../utils/test";
import {
  ASAM_CARE_RECOMMENDATION_KEY,
  HAS_DEVELOPMENTAL_DISABILITY_KEY,
  HAS_OPEN_CHILD_PROTECTIVE_SERVICES_CASE_KEY,
  HAS_PREVIOUS_VIOLENT_OFFENSE_KEY,
  IS_VETERAN_KEY,
  LSIR_SCORE_KEY,
  MENTAL_HEALTH_DIAGNOSES_KEY,
  NEEDS_TO_BE_ADDRESSED_KEY,
  OFFENSE_KEY,
  PLEA_KEY,
  PREVIOUSLY_INCARCERATED_OR_UNDER_SUPERVISION_KEY,
  SUBSTANCE_USER_DISORDER_DIAGNOSIS_KEY,
} from "../../constants";
import { FormUpdates } from "../../types";
import { CaseDetailsForm } from "../CaseDetailsForm";
import { caseDetailsFormTemplate } from "../CaseDetailsFormTemplate";
import { parseAttributeValue } from "../utils";

const caseId = Object.keys(CaseDetailsFixture)[0];
const mockPSIStore = createMockPSIStore();
const mockCaseStore = mockPSIStore.caseStore;
mockPSIStore.caseStore.caseDetailsById = CaseDetailsFixture;

const caseDetailsPresenter = new CaseDetailsPresenter(mockCaseStore, caseId);
const caseAttributes = CaseDetailsFixture[caseId];
const form = new CaseDetailsForm(caseDetailsPresenter, []);
// caseDetailsPresenter.caseAttributes = caseAttributes;
// vi.spyOn(mockCaseStore, "caseDetailsById", "get").mockResolvedValue(
//   CaseDetailsFixture,
// );
// vi.spyOn(caseDetailsPresenter, "caseAttributes", "get").mockResolvedValue(
//   caseAttributes,
// );

test("form is initialized with case attribute values", () => {
  expect(Object.keys(form.content).length).toBe(caseDetailsFormTemplate.length);
  expect(form.content[OFFENSE_KEY].value).toBe(caseAttributes[OFFENSE_KEY]);
  expect(form.content[LSIR_SCORE_KEY].value).toBe(
    caseAttributes[LSIR_SCORE_KEY],
  );
  expect(form.content[SUBSTANCE_USER_DISORDER_DIAGNOSIS_KEY].value).toBe(
    caseAttributes[SUBSTANCE_USER_DISORDER_DIAGNOSIS_KEY],
  );
  expect(
    form.content[SUBSTANCE_USER_DISORDER_DIAGNOSIS_KEY].nested?.[
      ASAM_CARE_RECOMMENDATION_KEY
    ].value,
  ).toBe(caseAttributes[ASAM_CARE_RECOMMENDATION_KEY]);
});

test("getFormValue returns the latest value for a field", () => {
  expect(form.getFormValue(OFFENSE_KEY)).toBe(
    parseAttributeValue(OFFENSE_KEY, caseAttributes[OFFENSE_KEY]),
  );
  expect(form.getFormValue(LSIR_SCORE_KEY)).toBe(
    parseAttributeValue(LSIR_SCORE_KEY, caseAttributes[LSIR_SCORE_KEY]),
  );
  expect(
    form.getFormValue(
      HAS_PREVIOUS_VIOLENT_OFFENSE_KEY,
      PREVIOUSLY_INCARCERATED_OR_UNDER_SUPERVISION_KEY,
    ),
  ).toBe(
    parseAttributeValue(
      HAS_PREVIOUS_VIOLENT_OFFENSE_KEY,
      caseAttributes[HAS_PREVIOUS_VIOLENT_OFFENSE_KEY],
    ),
  );

  expect(
    form.getFormValue(
      ASAM_CARE_RECOMMENDATION_KEY,
      SUBSTANCE_USER_DISORDER_DIAGNOSIS_KEY,
    ),
  ).toBe(
    parseAttributeValue(
      ASAM_CARE_RECOMMENDATION_KEY,
      caseAttributes[ASAM_CARE_RECOMMENDATION_KEY],
    ),
  );
});

test("form value changes update content and updates properties", () => {
  const localForm = new CaseDetailsForm(caseDetailsPresenter, []);

  localForm.updateForm(LSIR_SCORE_KEY, "22");

  expect(localForm.getFormValue(LSIR_SCORE_KEY)).toBe("22");
  expect(localForm.updates[LSIR_SCORE_KEY]).toBe(22);

  localForm.updateForm(
    HAS_PREVIOUS_VIOLENT_OFFENSE_KEY,
    "Yes",
    PREVIOUSLY_INCARCERATED_OR_UNDER_SUPERVISION_KEY,
  );

  expect(
    localForm.getFormValue(
      HAS_PREVIOUS_VIOLENT_OFFENSE_KEY,
      PREVIOUSLY_INCARCERATED_OR_UNDER_SUPERVISION_KEY,
    ),
  ).toBe("Yes");
  expect(localForm.updates[HAS_PREVIOUS_VIOLENT_OFFENSE_KEY]).toBe("Yes");
  expect(localForm.updates[LSIR_SCORE_KEY]).toBe(22);
});

test("form sets error flag to true when caseAttributes has an error in values", () => {
  let localForm = new CaseDetailsForm(caseDetailsPresenter, []);
  expect(localForm.hasError).toBeFalse();

  vi.spyOn(
    caseDetailsPresenter.caseAttributes,
    "lsirScore",
    "get",
  ).mockResolvedValue(222);

  localForm = new CaseDetailsForm(caseDetailsPresenter, []);
  expect(localForm.hasError).toBeTrue();
});

test("onboardingFields returns the expected onboarding fields", () => {
  expect(form.onboardingFields).toHaveProperty("OFFENSE_LSIR_SCORE_FIELDS");
  expect(form.onboardingFields).toHaveProperty("PRIMARY_NEEDS_FIELD");
  expect(form.onboardingFields).toHaveProperty("ADDITIONAL_NEEDS_FIELDS");

  expect(form.onboardingFields["OFFENSE_LSIR_SCORE_FIELDS"].length).toBe(2);
  expect(form.onboardingFields["OFFENSE_LSIR_SCORE_FIELDS"][0].key).toBe(
    OFFENSE_KEY,
  );
  expect(form.onboardingFields["OFFENSE_LSIR_SCORE_FIELDS"][1].key).toBe(
    LSIR_SCORE_KEY,
  );

  expect(form.onboardingFields["PRIMARY_NEEDS_FIELD"].length).toBe(1);
  expect(form.onboardingFields["PRIMARY_NEEDS_FIELD"][0].key).toBe(
    NEEDS_TO_BE_ADDRESSED_KEY,
  );

  expect(form.onboardingFields["ADDITIONAL_NEEDS_FIELDS"].length).toBe(7);
  expect(form.onboardingFields["ADDITIONAL_NEEDS_FIELDS"][0].key).toBe(
    SUBSTANCE_USER_DISORDER_DIAGNOSIS_KEY,
  );
  expect(form.onboardingFields["ADDITIONAL_NEEDS_FIELDS"][1].key).toBe(
    MENTAL_HEALTH_DIAGNOSES_KEY,
  );
  expect(form.onboardingFields["ADDITIONAL_NEEDS_FIELDS"][2].key).toBe(
    IS_VETERAN_KEY,
  );
  expect(form.onboardingFields["ADDITIONAL_NEEDS_FIELDS"][3].key).toBe(
    PREVIOUSLY_INCARCERATED_OR_UNDER_SUPERVISION_KEY,
  );
  expect(form.onboardingFields["ADDITIONAL_NEEDS_FIELDS"][4].key).toBe(
    HAS_DEVELOPMENTAL_DISABILITY_KEY,
  );
  expect(form.onboardingFields["ADDITIONAL_NEEDS_FIELDS"][5].key).toBe(
    HAS_OPEN_CHILD_PROTECTIVE_SERVICES_CASE_KEY,
  );
  expect(form.onboardingFields["ADDITIONAL_NEEDS_FIELDS"][6].key).toBe(
    PLEA_KEY,
  );
});

test("transformedUpdates converts values to enums/expected BE values", () => {
  const localForm = new CaseDetailsForm(caseDetailsPresenter, []);
  const updates = {
    [ASAM_CARE_RECOMMENDATION_KEY]: "2.5 High-Intensity Outpatient (HIOP)",
    [PLEA_KEY]: "Alford Plea",
    [IS_VETERAN_KEY]: "Yes",
    [HAS_DEVELOPMENTAL_DISABILITY_KEY]: "No",
    [HAS_OPEN_CHILD_PROTECTIVE_SERVICES_CASE_KEY]: "Not sure yet",
  } as FormUpdates;
  localForm.updates = updates;

  expect(localForm.transformedUpdates).toEqual({
    asamCareRecommendation: "HighIntensityOutpatient",
    plea: "AlfordPlea",
    isVeteran: true,
    hasDevelopmentalDisability: false,
    hasOpenChildProtectiveServicesCase: null,
  });
});
