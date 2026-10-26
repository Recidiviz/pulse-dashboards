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

import { RawUsArResidentJiiData } from "~@jii/schemas";
import { usArResidentCommonDataFixtures } from "~datatypes";

// The view gives every resident the same Edovo refresh time
const edovoLastRefreshedAt = "2021-12-16T20:10:12Z";

export const usArResidentJiiDataFixtures: RawUsArResidentJiiData[] = [
  {
    ...usArResidentCommonDataFixtures[0],
    lastUpdatedDate: "2021-12-16",
    // Edovo: in progress, with hours carried in from last month
    cohortCode: "4",
    hasApprovedCasePlan: true,
    maxCpus: 4,
    isEligibleForCpus: true,
    edovoHoursThisMonth: 6.5,
    edovoCarryInHours: 3,
    edovoHoursToNextCpu: 6.5,
    edovoIsCreditingMonth: false,
    edovoLastRefreshedAt,
  },
  {
    ...usArResidentCommonDataFixtures[1],
    lastUpdatedDate: "2021-12-16",
    // Edovo: not Protect Act, so not eligible
    hasApprovedCasePlan: false,
    maxCpus: null,
    isEligibleForCpus: false,
    edovoHoursThisMonth: 0,
    edovoCarryInHours: 0,
    edovoHoursToNextCpu: 16,
    edovoIsCreditingMonth: false,
    edovoLastRefreshedAt,
  },
  {
    ...usArResidentCommonDataFixtures[2],
    // Protect Act residents have an RE date, not a TE date
    eligibilityDateName: "Release Eligibility Date",
    lastUpdatedDate: "2021-12-16",
    // Edovo: case plan allows 0 CPUs, no completions
    cohortCode: "4",
    hasApprovedCasePlan: true,
    maxCpus: 0,
    isEligibleForCpus: false,
    edovoHoursThisMonth: 0,
    edovoCarryInHours: 0,
    edovoHoursToNextCpu: 16,
    edovoIsCreditingMonth: false,
    edovoLastRefreshedAt,
  },
  {
    ...usArResidentCommonDataFixtures[3],
    // Protect Act residents have an RE date, not a TE date
    eligibilityDateName: "Release Eligibility Date",
    lastUpdatedDate: "2021-12-16",
    // Edovo: earned a CPU this month with exactly 16 hours
    cohortCode: "4",
    hasApprovedCasePlan: true,
    maxCpus: 4,
    isEligibleForCpus: true,
    edovoHoursThisMonth: 16,
    edovoCarryInHours: 0,
    edovoHoursToNextCpu: 0,
    edovoIsCreditingMonth: true,
    edovoLastRefreshedAt,
  },
  {
    ...usArResidentCommonDataFixtures[4],
    lastUpdatedDate: "2021-12-16",
  },
  {
    ...usArResidentCommonDataFixtures[5],
    cohortCode: "4",
    lastUpdatedDate: "2025-04-01",
    // Edovo: earned a CPU this month with hours over 16
    hasApprovedCasePlan: true,
    maxCpus: 4,
    isEligibleForCpus: true,
    edovoHoursThisMonth: 18.5,
    edovoCarryInHours: 0,
    edovoHoursToNextCpu: 0,
    edovoIsCreditingMonth: true,
    edovoLastRefreshedAt,
  },
];
