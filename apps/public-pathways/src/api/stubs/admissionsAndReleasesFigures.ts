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

/**
 * Sample Admissions & Releases figures, copied from the v2 design prototype,
 * which labels them "Sample data only — not real DOCCS figures". They exist so
 * the dashboard can be built and reviewed before the real endpoints land, and
 * they are served only in development. See `./index.ts`.
 */

export const STUB_YEARS = [2023, 2024, 2025] as const;

export type StubYear = (typeof STUB_YEARS)[number];

export const STUB_LAST_UPDATED = "2026-02-01";

/** Total admissions and releases per calendar year. */
export const TOTALS_BY_YEAR: Record<
  "ADMISSIONS" | "RELEASES",
  Record<StubYear, number>
> = {
  ADMISSIONS: { 2023: 20450, 2024: 21180, 2025: 20890 },
  RELEASES: { 2023: 22600, 2024: 23980, 2025: 23540 },
};

/** A share of a total, keyed by the label the chart shows. */
export type StubShare = { label: string; share: number };

export const CUSTODY_STATUS_SHARES: StubShare[] = [
  { label: "Incarcerated Individual", share: 0.85 },
  { label: "Incarcerated Parolee", share: 0.15 },
];

export const ADMISSION_TYPE_SHARES: Record<string, StubShare[]> = {
  "Incarcerated Individual": [
    { label: "Court Commitment", share: 0.62 },
    { label: "Returned Parole Violator", share: 0.3 },
    { label: "Other", share: 0.08 },
  ],
  "Incarcerated Parolee": [
    { label: "Drug Treatment-Judicially Sanctioned", share: 0.55 },
    { label: "Drug Treatment-Parole Violation", share: 0.35 },
    { label: "Other", share: 0.1 },
  ],
};

export const RELEASE_TYPE_SHARES: Record<string, StubShare[]> = {
  "Incarcerated Individual": [
    { label: "Parole", share: 0.4 },
    { label: "Conditional Release", share: 0.28 },
    { label: "Maximum Expiration with Post-Release Supervision", share: 0.18 },
    { label: "Maximum Expiration", share: 0.1 },
    { label: "Other", share: 0.04 },
  ],
  "Incarcerated Parolee": [
    { label: "Drug Treatment-Judicially Sanctioned", share: 0.5 },
    { label: "Drug Treatment-Parole Violation", share: 0.38 },
    { label: "Other", share: 0.12 },
  ],
};

export const COMMUNITY_SUPERVISION_SHARES: StubShare[] = [
  { label: "Released to Community Supervision", share: 0.68 },
  { label: "Not Released to Community Supervision", share: 0.32 },
];
