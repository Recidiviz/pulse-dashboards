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

import {
  ASAM_CARE_RECOMMENDATION_KEY,
  CLIENT_GENDER_KEY,
  HAS_DEVELOPMENTAL_DISABILITY_KEY,
  HAS_OPEN_CHILD_PROTECTIVE_SERVICES_CASE_KEY,
  HAS_PREVIOUS_FELONY_KEY,
  HAS_PREVIOUS_SEX_OFFENSE_KEY,
  HAS_PREVIOUS_TREATMENT_COURT_KEY,
  HAS_PREVIOUS_VIOLENT_OFFENSE_KEY,
  IS_VETERAN_KEY,
  LSIR_SCORE_KEY,
  MENTAL_HEALTH_DIAGNOSES_KEY,
  NEEDS_TO_BE_ADDRESSED_KEY,
  OFFENSE_KEY,
  PLEA_KEY,
  PREVIOUSLY_INCARCERATED_OR_UNDER_SUPERVISION_KEY,
  REPORT_TYPE_KEY,
  SUBSTANCE_USER_DISORDER_DIAGNOSIS_KEY,
} from "../constants";
import ASAMCareRecommendationField from "./FormFields/ASAMCareRecommendationField";
import ChildProtectiveServicesStatus from "./FormFields/ChildProtectiveServicesStatusField";
import DevelopmentalDisabilityStatusField from "./FormFields/DevelopmentalDisabilityStatusField";
import GenderField from "./FormFields/GenderField";
import LsirScoreField from "./FormFields/LsirScoreField";
import MentalHealthDiagnosisField from "./FormFields/MentalHealthDiagnosisField";
import NeedsToBeAddressedField from "./FormFields/NeedsToBeAddressedField";
import OffenseField from "./FormFields/OffenseField";
import PleaStatusField from "./FormFields/PleaStatusField";
import PriorFelonyConvictionField from "./FormFields/PriorFelonyConvictionField";
import PriorIncarcerationOrSupervisionField from "./FormFields/PriorIncarcerationOrSupervisionField";
import PriorSexOffenseConvictionField from "./FormFields/PriorSexOffenseConvictionField";
import PriorTreatmentCourtField from "./FormFields/PriorTreatmentCourtField";
import PriorViolentOffenseConvictionField from "./FormFields/PriorViolentOffenseConvictionField";
import ReportTypeField from "./FormFields/ReportTypeField";
import SubstanceUseDisorderDiagnosisField from "./FormFields/SubstanceUseDisorderDiagnosisField";
import VeteranStatusField from "./FormFields/VeteranStatusField";
import { FormField, FormFieldWithNestedFields } from "./types";

const PriorIncarcerationOrSupervisionNestedFields: FormField[] = [
  { key: HAS_PREVIOUS_FELONY_KEY, FieldComponent: PriorFelonyConvictionField },
  {
    key: HAS_PREVIOUS_VIOLENT_OFFENSE_KEY,
    FieldComponent: PriorViolentOffenseConvictionField,
  },
  {
    key: HAS_PREVIOUS_SEX_OFFENSE_KEY,
    FieldComponent: PriorSexOffenseConvictionField,
  },
  {
    key: HAS_PREVIOUS_TREATMENT_COURT_KEY,
    FieldComponent: PriorTreatmentCourtField,
  },
];

const FormFields: { [key: string]: FormFieldWithNestedFields } = {
  [OFFENSE_KEY]: {
    key: OFFENSE_KEY,
    FieldComponent: OffenseField,
    isRequired: true,
  },
  [LSIR_SCORE_KEY]: {
    key: LSIR_SCORE_KEY,
    FieldComponent: LsirScoreField,
    isRequired: true,
  },
  [CLIENT_GENDER_KEY]: { key: CLIENT_GENDER_KEY, FieldComponent: GenderField },
  [REPORT_TYPE_KEY]: { key: REPORT_TYPE_KEY, FieldComponent: ReportTypeField },
  [NEEDS_TO_BE_ADDRESSED_KEY]: {
    key: NEEDS_TO_BE_ADDRESSED_KEY,
    FieldComponent: NeedsToBeAddressedField,
  },
  [SUBSTANCE_USER_DISORDER_DIAGNOSIS_KEY]: {
    key: SUBSTANCE_USER_DISORDER_DIAGNOSIS_KEY,
    FieldComponent: SubstanceUseDisorderDiagnosisField,
    nestedFields: [
      {
        key: ASAM_CARE_RECOMMENDATION_KEY,
        FieldComponent: ASAMCareRecommendationField,
      },
    ],
  },
  [MENTAL_HEALTH_DIAGNOSES_KEY]: {
    key: MENTAL_HEALTH_DIAGNOSES_KEY,
    FieldComponent: MentalHealthDiagnosisField,
  },
  [IS_VETERAN_KEY]: { key: IS_VETERAN_KEY, FieldComponent: VeteranStatusField },
  [PREVIOUSLY_INCARCERATED_OR_UNDER_SUPERVISION_KEY]: {
    key: PREVIOUSLY_INCARCERATED_OR_UNDER_SUPERVISION_KEY,
    FieldComponent: PriorIncarcerationOrSupervisionField,
    nestedFields: PriorIncarcerationOrSupervisionNestedFields,
  },
  [HAS_DEVELOPMENTAL_DISABILITY_KEY]: {
    key: HAS_DEVELOPMENTAL_DISABILITY_KEY,
    FieldComponent: DevelopmentalDisabilityStatusField,
  },
  [HAS_OPEN_CHILD_PROTECTIVE_SERVICES_CASE_KEY]: {
    key: HAS_OPEN_CHILD_PROTECTIVE_SERVICES_CASE_KEY,
    FieldComponent: ChildProtectiveServicesStatus,
  },
  [PLEA_KEY]: { key: PLEA_KEY, FieldComponent: PleaStatusField },
};

export const formFields: FormField[] = Object.values(FormFields);

export const onboardingStepOneFields = [
  FormFields[OFFENSE_KEY],
  FormFields[LSIR_SCORE_KEY],
  FormFields[CLIENT_GENDER_KEY],
  FormFields[REPORT_TYPE_KEY],
];

export const onboardingStepTwoFields = [FormFields[NEEDS_TO_BE_ADDRESSED_KEY]];

export const onboardingStepThreeFields = [
  FormFields[SUBSTANCE_USER_DISORDER_DIAGNOSIS_KEY],
  FormFields[MENTAL_HEALTH_DIAGNOSES_KEY],
  FormFields[IS_VETERAN_KEY],
  FormFields[PREVIOUSLY_INCARCERATED_OR_UNDER_SUPERVISION_KEY],
  FormFields[HAS_DEVELOPMENTAL_DISABILITY_KEY],
  FormFields[HAS_OPEN_CHILD_PROTECTIVE_SERVICES_CASE_KEY],
  FormFields[PLEA_KEY],
];
