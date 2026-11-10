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

import { Accommodations } from "./sections/Accommodations";
import { AdditionalInfo } from "./sections/AdditionalInfo";
import { ChildFamilyServices } from "./sections/ChildFamilyServices";
import { EmploymentMilitary } from "./sections/EmploymentMilitary";
import { HealthSupport } from "./sections/HealthSupport";
import { HousingRequirements } from "./sections/HousingRequirements";
import { LegalStatus } from "./sections/LegalStatus";
import { PersonalInfo } from "./sections/PersonalInfo";
import { Preferences } from "./sections/Preferences";
import { SectionConfig, SectionId } from "./types";

export const SECTIONS: SectionConfig[] = [
  { id: "personalInfo", title: "Personal info", Component: PersonalInfo },
  { id: "legalStatus", title: "Legal Status", Component: LegalStatus },
  {
    id: "housingRequirements",
    title: "Housing Requirements",
    Component: HousingRequirements,
  },
  {
    id: "employmentMilitary",
    title: "Employment & Military",
    Component: EmploymentMilitary,
  },
  { id: "healthSupport", title: "Health & Support", Component: HealthSupport },
  { id: "preferences", title: "Preferences", Component: Preferences },
  {
    id: "accommodations",
    title: "Accommodations",
    Component: Accommodations,
  },
  {
    id: "childFamilyServices",
    title: "Child/Family Services",
    Component: ChildFamilyServices,
  },
  { id: "additionalInfo", title: "Additional Info", Component: AdditionalInfo },
];

export const ALL_SECTION_IDS: SectionId[] = SECTIONS.map(({ id }) => id);
