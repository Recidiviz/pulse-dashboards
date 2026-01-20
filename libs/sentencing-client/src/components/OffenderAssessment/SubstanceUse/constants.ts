// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2025 Recidiviz, Inc.
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

import { SAR } from "../../../api";

export type DrugHistory = NonNullable<SAR["drugHistories"]>[number];
export type SubstanceType = NonNullable<DrugHistory["substance"]>;
export type FrequencyOfUse = NonNullable<DrugHistory["heaviestUse"]>;
export type MethodOfUse = NonNullable<DrugHistory["method"]>;

export const SubstanceTypeLabels: Record<SubstanceType, string> = {
  Alcohol: "Alcohol",
  Marijuana: "Marijuana",
  Cocaine: "Cocaine",
  Methamphetamine: "Methamphetamine",
  Heroin: "Heroin",
  Prescription_Opioids: "Prescription Opioids",
  Benzodiazepines: "Benzodiazepines",
  Hallucinogens: "Hallucinogens",
  Inhalants: "Inhalants",
  Other: "Other",
};

export const FrequencyOfUseLabels: Record<FrequencyOfUse, string> = {
  Daily: "Daily",
  Weekly: "Weekly",
  Monthly: "Monthly",
  Occasionally: "Occasionally",
  Rarely: "Rarely",
};

export const MethodOfUseLabels: Record<MethodOfUse, string> = {
  Oral: "Oral",
  Smoking: "Smoking",
  Injection: "Injection",
  Snorting: "Snorting",
  Other: "Other",
};

// Dropdown options (for react-select)
export const SUBSTANCE_OPTIONS = Object.entries(SubstanceTypeLabels).map(
  ([value, label]) => ({ value, label }),
);

export const FREQUENCY_OPTIONS = Object.entries(FrequencyOfUseLabels).map(
  ([value, label]) => ({ value, label }),
);

export const METHOD_OPTIONS = Object.entries(MethodOfUseLabels).map(
  ([value, label]) => ({ value, label }),
);

// Age dropdown options (1-100)
export const AGE_OPTIONS = Array.from({ length: 100 }, (_, i) => ({
  value: (i + 1).toString(),
  label: (i + 1).toString(),
}));
