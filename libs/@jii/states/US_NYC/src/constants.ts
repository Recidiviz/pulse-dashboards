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
 * Ordered list of demographic category names as returned by the Resource API taxonomy.
 * Display order on the CRE landing page is defined by this constant.
 * Values must exactly match the `category` strings in OrganizationSummary.categories.
 */
export const US_NYC_DEMOGRAPHIC_CATEGORIES: readonly string[] = [
  "Formerly Incarcerated People",
  "Immigrants",
  "Veterans",
  "People with Disabilities",
  "Women",
  "Older People",
  "LGBTQI+",
  "Youth",
  "Parents & Caregivers",
];
