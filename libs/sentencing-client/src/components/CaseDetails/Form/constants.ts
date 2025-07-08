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

import { Case } from "../../../../src/api";
import { NonArrayType, NonNullableKey } from "../types";

export const FALLBACK_POSSESSIVE_PRONOUN = "their";

export const NO_OPTION = "No";
export const YES_OPTION = "Yes";
export const NOT_SURE_YET_OPTION = "Not sure yet";
export const UNKNOWN_OPTION = "Unknown";
export const NONE_OPTION = "None";
export const OTHER_OPTION = "Other";
export const ANY_OPTION = "Any";
export const MILD_OPTION = "Mild";
export const MODERATE_OPTION = "Moderate";
export const SEVERE_OPTION = "Severe";

export const yesNoUnsureOptions = [YES_OPTION, NO_OPTION, NOT_SURE_YET_OPTION];

export const substanceUseDisorderDiagnosisOptions = [
  NONE_OPTION,
  MILD_OPTION,
  MODERATE_OPTION,
  SEVERE_OPTION,
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
  MedicallyManagedInpatient: "4.0 Medically Managed Inpatient",
  None: NONE_OPTION,
};

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
  Other: OTHER_OPTION,
  None: NONE_OPTION,
};

export const pleas = {
  Guilty: "Guilty",
  NotGuilty: "Not Guilty",
  AlfordPlea: "Alford Plea",
};
