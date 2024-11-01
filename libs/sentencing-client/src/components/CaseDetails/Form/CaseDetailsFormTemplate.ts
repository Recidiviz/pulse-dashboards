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

import { Case } from "../../../api/APIClient";
import { ReportType } from "../../Dashboard/types";
import {
  CLIENT_GENDER_KEY,
  GenderToDisplayName,
  LSIR_SCORE_KEY,
  needsToBeAddressed,
  NO_OPTION,
  NOT_SURE_YET_OPTION,
  OFFENSE_KEY,
  REPORT_TYPE_KEY,
  YES_OPTION,
} from "../constants";
import { FormFieldList, NonArrayType, NonNullableKey } from "../types";
import { FALLBACK_POSSESSIVE_PRONOUN } from "./constants";

const genderOptions = Object.values(GenderToDisplayName).filter(
  (gender) => gender !== "Unknown",
);

const reportTypeOptions = Object.values(ReportType);

const needsToBeAddressedOptions = [
  ...Object.values(needsToBeAddressed),
  NOT_SURE_YET_OPTION,
];

const substanceUseDisorderDiagnosisOptions = [
  "None",
  "Mild",
  "Moderate",
  "Severe",
  NOT_SURE_YET_OPTION,
];

export const asamLevelOfCareRecommendation: Record<
  NonNullableKey<Case["asamCareRecommendation"]>,
  string
> = {
  LongTermRemissionMonitoring: "1.0 Long-Term Remission Monitoring",
  OutpatientTherapy: "1.5 Outpatient Therapy",
  MedicallyManagedOutpatient: "1.7 Medically Managed Outpatient",
  IntensiveOutpatient: "2.1 Intensive Outpatient (IOP)",
  HighIntensityOutpatient: "2.5 High-Intensity Outpatient (HIOP)",
  MedicallyManagedIntensiveOutpatient:
    "2.7 Medically Managed Intensive Outpatient",
  ClinicallyManagedLowIntensityResidential:
    "3.1 Clinically Managed Low-Intensity Residential",
  ClinicallyManagedHighIntensityResidential:
    "3.5 Clinically Managed High-Intensity Residential",
  MedicallyManagedResidential: "3.7 Medically Managed Residential",
  MedicallyManagedInpatient: "4 Medically Managed Inpatient",
  None: "None",
};

const asamLevelOfCareRecommendationOptions = Object.values(
  asamLevelOfCareRecommendation,
);

export const mentalHealthDiagnoses: Record<
  NonArrayType<Case["mentalHealthDiagnoses"]>,
  string
> = {
  BipolarDisorder: "Bipolar Disorder",
  BorderlinePersonalityDisorder: "Borderline Personality Disorder",
  DelusionalDisorder: "Delusional Disorder",
  MajorDepressiveDisorder: "Major Depressive Disorder (severe and recurrent)",
  PsychoticDisorder: "Psychotic Disorder",
  Schizophrenia: "Schizophrenia",
  SchizoaffectiveDisorder: "Schizoaffective Disorder",
  Other: "Other",
  None: "None",
};

const mentalHealthDiagnosesOptions = Object.values(mentalHealthDiagnoses);

export const pleas = {
  Guilty: "Guilty",
  NotGuilty: "Not Guilty",
  AlfordPlea: "Alford Plea",
};

const pleaOptions = [...Object.values(pleas), NOT_SURE_YET_OPTION];

const yesNoUnsureOptions = [YES_OPTION, NO_OPTION, NOT_SURE_YET_OPTION];

export const caseDetailsFormTemplate: FormFieldList = [
  {
    key: OFFENSE_KEY,
    label: "Offense",
    value: null,
    description:
      "If there are multiple charges for this case, choose the most severe",
    inputType: "dropdown",
    options: [],
    isRequired: true,
  },
  {
    key: LSIR_SCORE_KEY,
    label: "Draft LSI-R Score",
    value: null,
    inputType: "text",
    disabledMessage:
      "This score has been pulled in from Atlas and is unable to be edited.",
    validationErrorMessage: "Please enter a number between 0 and 54.",
  },
  {
    key: CLIENT_GENDER_KEY,
    label: "Gender",
    value: null,
    inputType: "dropdown",
    options: genderOptions,
    disabledMessage:
      "This field has been pulled in from Atlas and is unable to be edited.",
  },
  {
    key: REPORT_TYPE_KEY,
    label: "Report Type",
    value: null,
    inputType: "dropdown",
    options: reportTypeOptions,
    disabledMessage:
      "This field has been pulled in from Atlas and is unable to be edited.",
  },
  {
    key: "needsToBeAddressed",
    label: `What are ${FALLBACK_POSSESSIVE_PRONOUN} primary needs? Select all that apply.`,
    value: null,
    inputType: "multi-select",
    options: needsToBeAddressedOptions,
    showOtherContextValuesMatch: ["Other"],
    otherContext: {
      key: "otherNeedToBeAddressed",
      placeholder: "Please specify other need",
      value: null,
    },
  },
  {
    key: "substanceUseDisorderDiagnosis",
    label: `Substance use disorder diagnosis`,
    value: null,
    inputType: "radio",
    options: substanceUseDisorderDiagnosisOptions,
    showNestedValuesMatch: ["Mild", "Moderate", "Severe"],
    nested: [
      {
        key: "asamCareRecommendation",
        label: `ASAM level of care recommendation`,
        value: null,
        inputType: "dropdown",
        options: asamLevelOfCareRecommendationOptions,
      },
    ],
  },
  {
    key: "mentalHealthDiagnoses",
    label: `Mental health diagnoses`,
    value: null,
    inputType: "dropdown-multi-select",
    options: mentalHealthDiagnosesOptions,
    showOtherContextValuesMatch: ["Other"],
    otherContext: {
      key: "otherMentalHealthDiagnosis",
      placeholder: "Please specify other diagnosis",
      value: null,
    },
  },
  {
    key: "isVeteran",
    label: "Is a veteran",
    value: null,
    inputType: "radio",
    options: yesNoUnsureOptions,
  },
  {
    key: "previouslyIncarceratedOrUnderSupervision",
    label: "Has a prior history of supervision/incarceration",
    value: null,
    inputType: "radio",
    options: yesNoUnsureOptions,
    showNestedValuesMatch: [YES_OPTION],
    nested: [
      {
        key: "hasPreviousFelonyConviction",
        label: "Has a prior felony conviction",
        value: null,
        inputType: "radio",
        options: yesNoUnsureOptions,
      },
      {
        key: "hasPreviousViolentOffenseConviction",
        label: "Has a prior violent offense conviction",
        value: null,
        inputType: "radio",
        options: yesNoUnsureOptions,
      },
      {
        key: "hasPreviousSexOffenseConviction",
        label: "Has a prior sex offense conviction",
        value: null,
        inputType: "radio",
        options: yesNoUnsureOptions,
      },
      {
        key: "hasPreviousTreatmentCourt",
        label: "Has previously participated in a treatment court",
        value: null,
        inputType: "radio",
        options: yesNoUnsureOptions,
      },
    ],
  },
  {
    key: "hasDevelopmentalDisability",
    label: "Has a developmental disability",
    value: null,
    inputType: "radio",
    options: yesNoUnsureOptions,
  },
  {
    key: "hasOpenChildProtectiveServicesCase",
    label: "Has an open child protective services case",
    value: null,
    inputType: "radio",
    options: yesNoUnsureOptions,
  },
  {
    key: "plea",
    label: "Plea",
    value: null,
    inputType: "radio",
    options: pleaOptions,
  },
];
