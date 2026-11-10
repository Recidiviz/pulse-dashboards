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

export const YES_NO_OPTIONS = ["Yes", "No"] as const;

export const GENDER_OPTIONS = [
  "Male",
  "Female",
  "Non-binary",
  "Other",
  "Prefer not to say",
] as const;

export const CURRENT_STATUS_OPTIONS = [
  "Termer",
  "Rider",
  "Parole Violator",
] as const;

export const COUNTY_OPTIONS = [
  "Ada",
  "Adams",
  "Bannock",
  "Bear Lake",
  "Benewah",
  "Bingham",
  "Blaine",
  "Boise",
  "Bonner",
  "Bonneville",
  "Boundary",
  "Butte",
  "Camas",
  "Canyon",
  "Caribou",
  "Cassia",
  "Clark",
  "Clearwater",
  "Custer",
  "Elmore",
  "Franklin",
  "Fremont",
  "Gem",
  "Gooding",
  "Idaho",
  "Jefferson",
  "Jerome",
  "Kootenai",
  "Latah",
  "Lemhi",
  "Lewis",
  "Lincoln",
  "Madison",
  "Minidoka",
  "Nez Perce",
  "Oneida",
  "Owyhee",
  "Payette",
  "Power",
  "Shoshone",
  "Teton",
  "Twin Falls",
  "Valley",
  "Washington",
] as const;

export const IDS_ON_FILE_OPTIONS = [
  "Driver's License",
  "State ID",
  "Social Security Card",
  "Birth Certificate",
] as const;

export const DISTRICT_OPTIONS = [
  "D1",
  "D2",
  "D3",
  "D4",
  "D5",
  "D6",
  "D7",
] as const;

export const ACCOMMODATIONS_OPTIONS = [
  "Wheelchair",
  "Walker",
  "Stairs",
  "Diabetic",
  "Insulin",
  "Oxygen",
  "Vision Impaired",
  "Hearing Impaired",
  "Gender",
  "Other",
] as const;

/** Selecting this option clears every other option in the same multi-select. */
export const NONE_OPTION = "None";

export const CHILD_FAMILY_SERVICES_DOCUMENTATION_OPTIONS = [
  NONE_OPTION,
  "Order of Guardianship",
  "Supervision Order",
  "Custody Agreement",
] as const;

export const MEDICAL_ACCOMMODATIONS_OPTIONS = [
  "Prescription Medication",
  "Assistance CBRS",
  "MOUD/MAT Program",
  "Contagious Disease",
  "Ongoing Medical/MH Treatment",
] as const;
