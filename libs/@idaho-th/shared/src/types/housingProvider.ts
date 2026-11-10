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

import { z } from "zod";

import { digitsOnly, isPhoneValid } from "../helpers/normalize";

// Shared so the contact editor caps input at exactly what the update
// mutation accepts. Measured after trimming.
export const PROVIDER_CONTACT_MAX_LENGTH = {
  housingProviderName: 120,
  contactName: 100,
} as const;

const requiredTrimmedField = (label: string) =>
  z.string().trim().min(1, `${label} is required`);

// Shared so the location editor rejects exactly what the mutation would.
export const providerLocationAddressSchema = z.object({
  streetAddress: requiredTrimmedField("Street address"),
  city: requiredTrimmedField("City"),
  state: requiredTrimmedField("State"),
  zip: z
    .string()
    .trim()
    .regex(/^\d{5}$/, "ZIP must be exactly 5 digits"),
});

export type ProviderLocationAddress = z.infer<
  typeof providerLocationAddressSchema
>;

export const providerContactFieldSchemas = {
  housingProviderName: requiredTrimmedField("Provider name").max(
    PROVIDER_CONTACT_MAX_LENGTH.housingProviderName,
    `Provider name must be at most ${PROVIDER_CONTACT_MAX_LENGTH.housingProviderName} characters`,
  ),
  // A person's name is required: HousingProviderUser.name is NOT NULL, and the
  // import falls back to the organization name rather than storing a blank. So
  // this field is never cleared, unlike the nullable phone below.
  contactName: requiredTrimmedField("Name").max(
    PROVIDER_CONTACT_MAX_LENGTH.contactName,
    `Name must be at most ${PROVIDER_CONTACT_MAX_LENGTH.contactName} characters`,
  ),
  contactPhone: z
    .string()
    .transform((raw) => raw.trim())
    .refine((trimmed) => {
      if (trimmed.length === 0) return true;
      const digits = digitsOnly(trimmed);
      return digits.length === 10 && isPhoneValid(digits);
    }, "Phone number must be a valid 10-digit US phone number")
    .transform((trimmed) => (trimmed.length === 0 ? null : trimmed)),
};
