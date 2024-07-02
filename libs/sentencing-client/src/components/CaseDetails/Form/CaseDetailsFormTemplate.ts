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

import { FormFieldList } from "../types";

export const needsToBeAddressedOptions = [
  "Anger management",
  "Case management",
  "Clothing and toiletries",
  "Domestic violence issues",
  "Education",
  "Family services",
  "Financial assistance",
  "Food insecurity",
  "General re-entry support",
  "Healthcare",
  "Housing opportunities",
  "Job training or opportunities",
  "Mental health",
  "Substance use",
  "Transportation",
  "Other",
  "Not sure yet",
];

export const substanceUseDisorderDiagnosisOptions = [
  "None",
  "Mild",
  "Moderate",
  "Severe",
  "Not sure yet",
];

export const asamLevelOfCareRecommendationOptions = [
  "1.0 Long-Term Remission Monitoring",
  "1.5 Outpatient Therapy",
  "1.7 Medically Managed Outpatient",
  "2.1 Intensive Outpatient (IOP)",
  "2.5 High-Intensity Outpatient (HIOP)",
  "2.7 Medically Managed Intensive Outpatient",
  "3.1 Clinically Managed Low-Intensity Residential",
  "3.5 Clinically Managed High-Intensity Residential",
  "3.7 Medically Managed Residential",
  "4 Medically Managed Inpatient",
  "None",
];

export const mentalHealthDiagnosesOptions = [
  "Bipolar Disorder",
  "Borderline Personality Disorder",
  "Delusional Disorder",
  "Major Depressive Disorder (severe and recurrent)",
  "Psychotic Disorder",
  "Schizophrenia",
  "Schizoaffective Disorder",
  "Other",
  "None",
];

export const yesNoUnsureOptions = ["Yes", "No", "Not sure yet"];

export const caseDetailsFormTemplate: FormFieldList = [
  {
    key: "primaryCharge",
    label: "Offense",
    value: null,
    description:
      "If there are multiple charges for this case, choose the most severe",
    inputType: "text",
  },
  {
    key: "lsirScore",
    label: "LSI-R Score",
    value: null,
    inputType: "text",
  },
  {
    key: "needsToBeAddressed",
    label: `What are X's primary needs`,
    value: null,
    inputType: "multi-select",
    options: needsToBeAddressedOptions,
    showOtherContextValueMatch: "Other Need",
    otherContext: {
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
    showNestedValueMatch: "Moderate",
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
    showOtherContextValueMatch: "Other",
    otherContext: {
      placeholder: "Please specify other need",
      value: null,
    },
  },
  {
    key: "veteranStatus",
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
    showNestedValueMatch: "Yes",
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
        key: "previousTreatmentCourt",
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
];
