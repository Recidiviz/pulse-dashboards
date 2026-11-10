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

import { Prisma, type PrismaClient } from "~@idaho-th/prisma/client";
import { FIELD_KEYS, type HousingApplicationFormKeys } from "~@idaho-th/shared";
import { IDAHO_TH_STATE_CODE } from "~@idaho-th/trpc/auth/constants";
import type {
  GetOverridesInput,
  OverrideFieldBreakdown,
  OverrideMetrics,
} from "~@idaho-th/trpc/routes/aiExtractionMetrics/aiExtractionMetrics.types";

const TRAILING_WINDOW_DAYS = 30;
const MS_PER_DAY = 24 * 60 * 60 * 1000;

function resolveWindow(input: GetOverridesInput): {
  from: Date;
  to: Date;
} {
  const to = input.to ?? new Date();
  const from =
    input.from ?? new Date(to.getTime() - TRAILING_WINDOW_DAYS * MS_PER_DAY);
  return { from, to };
}

export async function getOverrides(
  prisma: PrismaClient,
  input: GetOverridesInput,
): Promise<OverrideMetrics> {
  const { from, to } = resolveWindow(input);

  const [aggregate, overridesByField] = await Promise.all([
    prisma.aiExtractionMetrics.aggregate({
      where: {
        scannedAt: { gte: from, lte: to },
        application: { stateCode: IDAHO_TH_STATE_CODE },
      },
      _count: { _all: true, submittedAt: true },
      _sum: { overriddenFieldCount: true },
    }),
    prisma.$queryRaw<OverrideFieldBreakdown[]>(Prisma.sql`
      SELECT field, COUNT(*)::int AS count
      FROM "AiExtractionMetrics"
      JOIN "HousingApplication" ON "HousingApplication"."id" = "AiExtractionMetrics"."applicationId",
        unnest("overriddenFields") AS field
      WHERE "scannedAt" >= ${from}
        AND "scannedAt" <= ${to}
        AND "HousingApplication"."stateCode" = ${IDAHO_TH_STATE_CODE}::"public"."StateCode"
      GROUP BY field
      ORDER BY count DESC
    `),
  ]);

  const applicationsScanned = aggregate._count._all;
  const applicationsSubmitted = aggregate._count.submittedAt;
  const totalOverrides = aggregate._sum.overriddenFieldCount ?? 0;

  return {
    window: { from, to },
    applicationsScanned,
    applicationsSubmitted,
    totalOverrides,
    avgOverridesPerApplicationSubmitted:
      applicationsSubmitted === 0 ? 0 : totalOverrides / applicationsSubmitted,
    overridesByField,
  };
}

// Server-set from the submitting CM's Auth0 login email, never AI-extracted
// or CM-editable — excluded so it's never counted as an override.
const NON_OVERRIDABLE_FIELD_KEYS: ReadonlySet<HousingApplicationFormKeys> =
  new Set([FIELD_KEYS.cmEmailOnFile]);

// Fields compared as order-insensitive sets rather than by strict equality —
// a CM reordering a list without changing its contents isn't an override.
const ARRAY_FIELD_KEYS: ReadonlySet<HousingApplicationFormKeys> = new Set([
  FIELD_KEYS.preferredDistrict,
  FIELD_KEYS.idsOnFile,
  // preferredProviders has no meaningful order today, so reordering isn't an override.
  FIELD_KEYS.preferredProviders,
  FIELD_KEYS.medicalAccommodations,
  FIELD_KEYS.accommodations,
  FIELD_KEYS.childFamilyServicesDocumentation,
]);

function isEmpty(value: unknown): boolean {
  if (value === null || value === undefined) return true;
  if (typeof value === "string") return value.trim().length === 0;
  if (Array.isArray(value)) return value.length === 0;
  return false;
}

// Strips blank entries before comparing: normalizeDefaultValues pads
// preferredProviders to 3 display slots on the baseline side but the write
// schema strips empty slots on the submitted side, so an unfiltered length
// check would spuriously flag most submissions as overridden.
function nonBlankEntries(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter(
    (entry): entry is string =>
      typeof entry === "string" && entry.trim().length > 0,
  );
}

function arraysEqualUnordered(a: unknown, b: unknown): boolean {
  const arrA = nonBlankEntries(a).sort();
  const arrB = nonBlankEntries(b).sort();
  if (arrA.length !== arrB.length) return false;
  return arrA.every((value, index) => value === arrB[index]);
}

function fieldValuesMatch(
  field: HousingApplicationFormKeys,
  baselineValue: unknown,
  currentValue: unknown,
): boolean {
  if (ARRAY_FIELD_KEYS.has(field)) {
    return arraysEqualUnordered(baselineValue, currentValue);
  }
  if (isEmpty(baselineValue) && isEmpty(currentValue)) return true;
  return baselineValue === currentValue;
}

export type FieldOverridesSummary = {
  overriddenFieldCount: number;
  overriddenFields: string[];
};

/**
 * Diffs a normalized AI-extraction baseline against the CM's submitted form
 * values, field by field.
 */
export function computeFieldOverrides(
  baseline: Record<string, unknown>,
  current: Record<string, unknown>,
): FieldOverridesSummary {
  const overriddenFields: string[] = [];
  for (const field of Object.values(FIELD_KEYS)) {
    if (NON_OVERRIDABLE_FIELD_KEYS.has(field)) continue;
    if (!fieldValuesMatch(field, baseline[field], current[field])) {
      overriddenFields.push(field);
    }
  }
  return { overriddenFieldCount: overriddenFields.length, overriddenFields };
}
