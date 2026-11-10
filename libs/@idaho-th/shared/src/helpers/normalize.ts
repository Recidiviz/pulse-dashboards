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

import * as phoneFns from "phone-fns";

import { NONE_OPTION } from "../constants/housingApplication.options";
import type { HousingApplicationForm } from "../types/housingApplication";

type PhoneFns = {
  isValid: (raw: string) => boolean;
};

const resolvedPhoneFns: PhoneFns =
  "isValid" in phoneFns
    ? (phoneFns as unknown as PhoneFns)
    : (phoneFns as unknown as { default: PhoneFns }).default;

export const { isValid: isPhoneValid } = resolvedPhoneFns;

export const digitsOnly = (raw: string) => raw.replace(/[^\d]/g, "");

// Strips formatting, drops a leading US country code, and renders a complete
// 10-digit number as XXX-XXX-XXXX; anything else comes back as bare digits.
export const normalizeUsPhoneNumber = (raw: string) => {
  const digits = digitsOnly(raw ?? "");
  const tenDigits =
    digits.length === 11 && digits.startsWith("1") ? digits.slice(1) : digits;
  if (tenDigits.length !== 10) return tenDigits;
  return `${tenDigits.slice(0, 3)}-${tenDigits.slice(3, 6)}-${tenDigits.slice(6)}`;
};

// Valid when the number normalizes to a complete 10-digit US number.
export const isValidUsPhoneNumber = (raw: string) =>
  /^\d{3}-\d{3}-\d{4}$/.test(normalizeUsPhoneNumber(raw));

export const formatPhone = (raw: string) => {
  const trimmed = raw?.trim() ?? "";
  const rawDigits = digitsOnly(trimmed);
  const tenDigits =
    rawDigits.length === 11 && rawDigits.startsWith("1")
      ? rawDigits.slice(1)
      : rawDigits;
  const digits = tenDigits.slice(0, 10);
  const preserveTrailingDash = trimmed.endsWith("-");

  if (trimmed.startsWith("(")) {
    if (trimmed === "(") return "(";
    if (digits.length <= 3) {
      return preserveTrailingDash ? `(${digits}-` : `(${digits}`;
    }

    if (digits.length <= 6) {
      const formatted = `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
      return preserveTrailingDash ? `${formatted}-` : formatted;
    }

    const formatted = `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
    return digits.length < 10 && preserveTrailingDash
      ? `${formatted}-`
      : formatted;
  }

  if (digits.length <= 3) {
    return preserveTrailingDash ? `${digits}-` : digits;
  }

  if (digits.length <= 6) {
    const formatted = `${digits.slice(0, 3)}-${digits.slice(3)}`;
    return preserveTrailingDash ? `${formatted}-` : formatted;
  }

  const formatted = `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`;
  return digits.length < 10 && preserveTrailingDash
    ? `${formatted}-`
    : formatted;
};

export function normalizeExtractedPhoneFields(
  values: HousingApplicationForm,
): HousingApplicationForm {
  return {
    ...values,
    cmPoName: values.cmPoName ?? "",
    cmPoEmail: values.cmPoEmail ?? "",
    cmPoPhone: formatPhone(values.cmPoPhone ?? ""),
    currentFacilityLocation: values.currentFacilityLocation ?? "",
    clientFullName: values.clientFullName ?? "",
    personalPhoneNumber: formatPhone(values.personalPhoneNumber ?? ""),
    emergencyContactName: values.emergencyContactName ?? "",
    emergencyContactRelationship: values.emergencyContactRelationship ?? "",
    emergencyContactPhone: formatPhone(values.emergencyContactPhone ?? ""),
    legalMostRecentConviction: values.legalMostRecentConviction ?? "",
    employerContact: formatPhone(values.employerContact ?? ""),
  };
}

const PREFERRED_PROVIDER_SLOT_COUNT = 3;

function normalizePreferredProviders(
  providers: string[] | undefined | null,
): [string, string, string] {
  const slots = (providers ?? []).slice(0, PREFERRED_PROVIDER_SLOT_COUNT);
  while (slots.length < PREFERRED_PROVIDER_SLOT_COUNT) {
    slots.push("");
  }
  return slots as [string, string, string];
}

// "None" means no selection, so it can't coexist with any other option.
export function dropNoneWhenMixed(selections: string[]): string[] {
  if (selections.length < 2) return selections;
  return selections.filter((option) => option !== NONE_OPTION);
}

export function normalizeDefaultValues(
  values: HousingApplicationForm,
): HousingApplicationForm {
  let normalized = normalizeExtractedPhoneFields(values);
  if (normalized.age === 0) {
    normalized = { ...normalized, age: null };
  }
  return {
    ...normalized,
    childFamilyServicesDocumentation: dropNoneWhenMixed(
      normalized.childFamilyServicesDocumentation ?? [],
    ),
    preferredProviders: normalizePreferredProviders(
      normalized.preferredProviders,
    ),
  };
}
