// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2024 Recidiviz, Inc.
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

export const profileMilestoneTypes = [
  "BIRTHDAY_THIS_MONTH",
  "MONTHS_WITHOUT_VIOLATION",
  "MONTHS_ON_SUPERVISION",
  "MONTHS_WITH_CURRENT_EMPLOYER",
] as const;

export const congratulationsMilestoneTypes = [
  "HOUSING_TYPE_IS_NOT_TRANSIENT",
  "SUSTAINABLE_HOUSING_6_MONTHS",
  "SUSTAINABLE_HOUSING_12_MONTHS",
  "NO_VIOLATION_WITHIN_6_MONTHS",
  "NO_VIOLATION_WITHIN_12_MONTHS",
  "GAINED_EMPLOYMENT",
  "EMPLOYED_6_MONTHS",
  "EMPLOYED_12_MONTHS",
  "PARTICIPATED_IN_PROGRAMMING_FOR_6_TO_8_MONTHS",
  "PARTICIPATED_IN_PROGRAMMING_FOR_12_TO_14_MONTHS",
] as const;

export const milestoneTypes = [
  ...profileMilestoneTypes,
  ...congratulationsMilestoneTypes,
];

export type MilestoneType =
  | (typeof profileMilestoneTypes)[number]
  | (typeof congratulationsMilestoneTypes)[number];
