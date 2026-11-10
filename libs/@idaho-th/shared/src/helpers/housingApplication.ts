// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2026 Recidiviz, Inc.
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
  GENDER_OPTIONS,
  MEDICAL_ACCOMMODATIONS_OPTIONS,
} from "~@idaho-th/shared/constants/housingApplication.options";

/**
 * TODO: drop the null/unknown -> Termer/PV fallback once every row has a valid Q6.
 */
export function isRider(
  legalCurrentStatus: string | null | undefined,
): boolean {
  return legalCurrentStatus?.trim().toLowerCase() === "rider";
}

export type GenderOption = (typeof GENDER_OPTIONS)[number];

/**
 * Maps OCR / free-text gender values to a {@link GENDER_OPTIONS} label, or null if empty/unknown.
 */
export function normalizeGenderLabel(
  value: string | null | undefined,
): GenderOption | null {
  if (value == null) return null;
  const trimmed = value.trim();
  if (trimmed.length === 0) return null;

  const normalized = trimmed.toLowerCase();
  if (normalized === "m" || normalized === "male") return "Male";
  if (normalized === "f" || normalized === "female") return "Female";
  if (
    normalized === "non-binary" ||
    normalized === "nonbinary" ||
    normalized === "nb"
  ) {
    return "Non-binary";
  }
  if (normalized === "prefer not to say") return "Prefer not to say";
  if (normalized === "other") return "Other";

  return null;
}

/** Like {@link normalizeGenderLabel}, but unknown/empty values become `fallback` (default `"Other"`). */
export function normalizeGenderLabelStrict(
  value: string | null | undefined,
  fallback: GenderOption = "Other",
): GenderOption {
  return normalizeGenderLabel(value) ?? fallback;
}

export type MedicalAccommodationLabel =
  (typeof MEDICAL_ACCOMMODATIONS_OPTIONS)[number];

export type MedicalAccommodationBooleans = {
  prescriptionMedication: boolean | null;
  assistanceCbrs: boolean | null;
  moudMatProgram: boolean | null;
  contagiousRowSelected: boolean | null;
  ongoingMedicalMhTreatment: boolean | null;
};

/**
 * {@link MEDICAL_ACCOMMODATIONS_OPTIONS} (used by the housing application form).
 */
export function buildMedicalAccommodationSelections(
  opts: MedicalAccommodationBooleans,
): MedicalAccommodationLabel[] {
  const out: MedicalAccommodationLabel[] = [];
  const push = (label: MedicalAccommodationLabel) => {
    out.push(label);
  };
  if (opts.prescriptionMedication === true) push("Prescription Medication");
  if (opts.assistanceCbrs === true) push("Assistance CBRS");
  if (opts.moudMatProgram === true) push("MOUD/MAT Program");
  if (opts.contagiousRowSelected === true) push("Contagious Disease");
  if (opts.ongoingMedicalMhTreatment === true)
    push("Ongoing Medical/MH Treatment");
  return out;
}
