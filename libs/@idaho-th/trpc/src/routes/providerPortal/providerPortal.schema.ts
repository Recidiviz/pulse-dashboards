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

import {
  ACCEPTED_GENDER,
  DISTRICT_OPTIONS,
  providerContactFieldSchemas,
  providerLocationAddressSchema,
} from "~@idaho-th/shared";

/**
 * The organization half of settings. Only the name is editable here, and only
 * on the organization the caller is acting as — the id is never part of the
 * input, so a multi-organization caller cannot name the record to rename.
 */
export const updateHousingProviderSchema = z
  .object({
    housingProviderName: providerContactFieldSchemas.housingProviderName,
  })
  .strict();

export type UpdateHousingProviderInput = z.infer<
  typeof updateHousingProviderSchema
>;

/**
 * The person half of settings. These belong to the caller and are the same in
 * every organization they manage, so nothing here is organization-scoped.
 */
export const updateProviderProfileSchema = z
  .object({
    contactName: providerContactFieldSchemas.contactName.optional(),
    contactPhone: providerContactFieldSchemas.contactPhone.optional(),
  })
  .strict()
  .refine((value) => Object.keys(value).length > 0, {
    message: "At least one field must be provided",
  });

export type UpdateProviderProfileInput = z.infer<
  typeof updateProviderProfileSchema
>;

// locationId identifies the row; every other field is optional, but at least
// one must be present.
export const updateProviderLocationSchema = z
  .object({
    locationId: z.string().min(1),
    ...providerLocationAddressSchema.partial().shape,
    district: z.enum(DISTRICT_OPTIONS).optional(),
    acceptedGender: z.nativeEnum(ACCEPTED_GENDER).optional(),
    acceptsRiders: z.boolean().optional(),
    acceptsSexOffenders: z.boolean().optional(),
    acceptsViolentCriminals: z.boolean().optional(),
    faithBased: z.boolean().optional(),
  })
  .strict()
  .refine((value) => Object.keys(value).some((key) => key !== "locationId"), {
    message: "At least one field must be provided",
  });

export type UpdateProviderLocationInput = z.infer<
  typeof updateProviderLocationSchema
>;
