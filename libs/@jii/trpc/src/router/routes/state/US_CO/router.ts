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

import { router } from "../../../../init";
import { restrictedProcedureForState } from "../restrictedProcedureForState";

export type Program = {
  dateAddedOrUpdated: Date;
  programId: string;
  category: string;
  title: string;
  description: string;
  facilitiesOffered: string;
  numberOfDaysThatCanBeEarned: number;
  eligibilityRequirements: string;
  prerequisites: string;
};

const coloradoProcedure = restrictedProcedureForState("US_CO");

export const usCoRouter = router({
  getPrograms: coloradoProcedure.query(async (): Promise<Program[]> => {
    return [
      {
        dateAddedOrUpdated: new Date("2025-12-15"),
        programId: "CO-EDU-001",
        category: "Education",
        title: "High School Equivalency Program",
        description:
          "Prepare for and complete GED testing to earn a high school equivalency credential.",
        facilitiesOffered:
          "Sterling Correctional Facility, Limon Correctional Facility",
        numberOfDaysThatCanBeEarned: 90,
        eligibilityRequirements:
          "Must be at least 6 months from release date; no active disciplinary sanctions",
        prerequisites: "None",
      },
      {
        dateAddedOrUpdated: new Date("2026-01-05"),
        programId: "CO-VOC-002",
        category: "Vocational Training",
        title: "Welding Certification Course",
        description:
          "Hands-on training in various welding techniques leading to AWS certification.",
        facilitiesOffered:
          "Fremont Correctional Facility, Buena Vista Correctional Complex",
        numberOfDaysThatCanBeEarned: 120,
        eligibilityRequirements:
          "Minimum 18 months remaining on sentence; clean conduct record for 90 days",
        prerequisites: "Completion of shop safety orientation",
      },
      {
        dateAddedOrUpdated: new Date("2025-11-20"),
        programId: "CO-TRT-003",
        category: "Treatment",
        title: "Cognitive Behavioral Therapy Program",
        description:
          "Evidence-based program focusing on changing thinking patterns and developing coping strategies.",
        facilitiesOffered: "All facilities",
        numberOfDaysThatCanBeEarned: 60,
        eligibilityRequirements:
          "Voluntary enrollment or case plan requirement",
        prerequisites: "Psychological assessment completed",
      },
      {
        dateAddedOrUpdated: new Date("2025-10-12"),
        programId: "CO-VOC-004",
        category: "Vocational Training",
        title: "Culinary Arts Program",
        description:
          "Professional kitchen training covering food preparation, safety, and kitchen management.",
        facilitiesOffered:
          "Colorado Territorial Correctional Facility, Denver Women's Correctional Facility",
        numberOfDaysThatCanBeEarned: 100,
        eligibilityRequirements:
          "At least 12 months to serve; no food handling restrictions",
        prerequisites: "Food handler safety certification",
      },
    ];
  }),
});
