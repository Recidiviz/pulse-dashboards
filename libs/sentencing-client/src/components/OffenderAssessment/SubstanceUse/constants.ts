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
import { formatMonthYear } from "../../../utils/utils";

export const SUBSTANCE_USE_CURRENT_USE_COPY =
  "* The defendant reports current use of this substance";
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

export const DRUG_HISTORY_COLUMNS = [
  "Substance",
  "Age of Regular Use",
  "Last Use",
  "Heaviest Use",
  "Method",
] as const;

export type CreateDrugHistoryInput = Omit<DrugHistory, "id">;
export type UpdateDrugHistoryInput = Partial<Omit<DrugHistory, "id">>;

/**
 * Returns the display label for a substance, or null if none is set.
 * e.g. "Methamphetamine", "My Custom Substance" (Other with a name), null
 */
export function formatSubstanceName(
  substance: string | null | undefined,
  otherSubstanceName: string | null | undefined,
): string | null {
  if (!substance) return null;
  if (substance === "Other") return otherSubstanceName ?? "Other";
  return SubstanceTypeLabels[substance as SubstanceType] ?? substance;
}

/**
 * Returns the display label for the "Last Use" cell, or null if neither is set.
 * e.g. "Current*", "01/2024", null
 */
export function formatLastUseDisplay(
  admitsToCurrentUse: boolean | null | undefined,
  lastUse: Date | string | null | undefined,
): string | null {
  if (admitsToCurrentUse) return "Current*";
  if (lastUse) return formatMonthYear(lastUse);
  return null;
}

/**
 * Returns true if at least one drug history record shows current use.
 * e.g. hasCurrentUse([{ admitsToCurrentUse: true, ... }]) => true
 */
export function hasCurrentUse(
  histories: Pick<DrugHistory, "admitsToCurrentUse">[],
): boolean {
  return histories.some((history) => history.admitsToCurrentUse);
}
