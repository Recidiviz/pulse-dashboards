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

import { isRider } from "~@idaho-th/shared/helpers/housingApplication";

// ---------------------------------------------------------------------------
// Eligibility params — single source of truth shared by client and tRPC.
// `preferredDistricts` defaults to [] so callers may omit it on input while
// the parsed output is always a concrete array.
// ---------------------------------------------------------------------------
export const eligibilityParamsSchema = z.object({
  preferredDistricts: z.array(z.string()).default([]),
  gender: z.string().optional(),
  isRider: z.boolean().nullable(),
  isSexOffender: z.boolean().nullable(),
  faithBasedPreferred: z.boolean().nullable(),
  preferredProviders: z.array(z.string()),
});

export type EligibilityParams = z.infer<typeof eligibilityParamsSchema>;

// ---------------------------------------------------------------------------
// Provider / location domain shapes — lean structural types that both Prisma
// query results (tRPC) and router-inferred rows (client) are assignable to.
// ---------------------------------------------------------------------------
export const ACCEPTED_GENDER = {
  MALE: "MALE",
  FEMALE: "FEMALE",
  ALL: "ALL",
} as const;

export type AcceptedGender =
  (typeof ACCEPTED_GENDER)[keyof typeof ACCEPTED_GENDER];

export interface ProviderLocationCore {
  id: string;
  district: string;
  acceptedGenders: AcceptedGender[];
  acceptsRiders: boolean;
  acceptsSexOffenders: boolean;
  acceptsViolentCriminals: boolean;
  faithBased: boolean;
}

export interface ProviderCore {
  id: string;
  name: string;
  locations: ProviderLocationCore[];
}

// ---------------------------------------------------------------------------
// Matching helpers — the one place gender/eligibility semantics live.
// `isMale`/`isFemale` expect an already-normalized (trimmed, lower-cased)
// gender string, matching how `normalizeEligibilityParams` produces it.
// ---------------------------------------------------------------------------
export function isMale(gender: string): boolean {
  return ["male", "man", "m"].includes(gender);
}

export function isFemale(gender: string): boolean {
  return ["female", "woman", "f", "women"].includes(gender);
}

export function acceptsMale(
  location: Pick<ProviderLocationCore, "acceptedGenders">,
): boolean {
  return (
    location.acceptedGenders.includes(ACCEPTED_GENDER.MALE) ||
    location.acceptedGenders.includes(ACCEPTED_GENDER.ALL)
  );
}

export function acceptsFemale(
  location: Pick<ProviderLocationCore, "acceptedGenders">,
): boolean {
  return (
    location.acceptedGenders.includes(ACCEPTED_GENDER.FEMALE) ||
    location.acceptedGenders.includes(ACCEPTED_GENDER.ALL)
  );
}

export function normalizeEligibilityParams(
  params: EligibilityParams,
): EligibilityParams {
  return {
    ...params,
    preferredDistricts: (params.preferredDistricts ?? []).map((d) =>
      d.trim().toLowerCase(),
    ),
    gender: params.gender?.trim().toLowerCase(),
    // preferredProviders are provider IDs, not names — never normalize casing.
    preferredProviders: params.preferredProviders,
  };
}

export type EligibilityFormFields = {
  preferredDistrict?: string[] | null;
  gender?: string | null;
  legalCurrentStatus?: string | null;
  legalSexOffenderRegistry?: boolean | string | null;
  faithBasedPreferred?: boolean | string | null;
  preferredProviders?: string[] | null;
};

// Blank stays unknown so eligibility does not filter on it; otherwise the one
// Rider rule the release flow also uses.
function parseRiderStatus(value: string | null | undefined): boolean | null {
  if (!value?.trim()) return null;
  return isRider(value);
}

function parseBoolean(
  value: string | null | boolean | undefined,
): boolean | null {
  if (typeof value === "boolean") return value;
  const lookup: Record<string, boolean> = {
    yes: true,
    true: true,
    no: false,
    false: false,
  };
  return lookup[value?.trim().toLowerCase() ?? ""] ?? null;
}

function parsePreferredProviders(value: string[] | null | undefined): string[] {
  return (value ?? []).map((s) => s.trim()).filter((s) => s.length > 0);
}

// Returns empty/unset params when form is absent. Guard at the call site if
// unfiltered results would be incorrect for your context.
export function extractEligibilityParams(
  form: EligibilityFormFields | undefined,
): EligibilityParams {
  if (!form) {
    return {
      preferredDistricts: [],
      gender: undefined,
      isRider: null,
      isSexOffender: null,
      faithBasedPreferred: null,
      preferredProviders: [],
    };
  }
  const preferredDistricts = (form.preferredDistrict ?? [])
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
  return {
    preferredDistricts,
    gender: form.gender?.trim() || undefined,
    isRider: parseRiderStatus(form.legalCurrentStatus),
    isSexOffender: parseBoolean(form.legalSexOffenderRegistry),
    faithBasedPreferred: parseBoolean(form.faithBasedPreferred),
    preferredProviders: parsePreferredProviders(form.preferredProviders),
  };
}
