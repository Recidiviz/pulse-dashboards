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

import { SelectOption } from "../constants";
import { TreatmentProgramCategory } from "./types";

export const TREATMENT_PROGRAM_CATEGORY_LABELS: Record<
  TreatmentProgramCategory,
  { singular: string; plural: string }
> = {
  Anger: {
    singular: "Anger Management",
    plural: "Anger Management",
  },
  CareerTechnical: {
    singular: "Career / Technical",
    plural: "Career / Technical",
  },
  Cognitive: {
    singular: "Cognitive Program",
    plural: "Cognitive Programs",
  },
  College: {
    singular: "College",
    plural: "College",
  },
  CommunityPartnership: {
    singular: "Community Partnership",
    plural: "Community Partnerships",
  },
  CommunityTreatment: {
    singular: "Community Treatment",
    plural: "Community Treatments",
  },
  Education: {
    singular: "Education Program",
    plural: "Education Programs",
  },
  FaithBased: {
    singular: "Faith Based",
    plural: "Faith Based",
  },
  InstitutionalTreatment: {
    singular: "Institutional Treatment",
    plural: "Institutional Treatments",
  },
  LifeSkills: {
    singular: "Life Skills",
    plural: "Life Skills",
  },
  Parenting: {
    singular: "Parenting",
    plural: "Parenting",
  },
  ReEntry: {
    singular: "Reentry",
    plural: "Reentry",
  },
  SexOffender: {
    singular: "Sex Offender Program",
    plural: "Sex Offender Programs",
  },
  ShockIncarceration: {
    singular: "Shock Incarceration",
    plural: "Shock Incarceration",
  },
};

export const MAX_DOC_HISTORIES_PER_CATEGORY = 5;

export const DOC_INCARCERATION_DESCRIPTION =
  "The defendant has participated in the following treatments/programs while previously incarcerated. Records limited to DOC-tracked programming only. This summary does not account for external, private, or non-DOC-affiliated services completed by the defendant.";

export function getYearOptions(): SelectOption[] {
  const currentYear = new Date().getFullYear();
  const years: SelectOption[] = [];

  // Generate years from current year back to 1900
  for (let year = currentYear; year >= 1900; year -= 1) {
    years.push({
      label: year.toString(),
      value: year.toString(),
    });
  }

  return years;
}
