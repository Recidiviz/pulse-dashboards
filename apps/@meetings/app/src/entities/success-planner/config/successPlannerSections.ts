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

import { mapValues } from "lodash";

import {
  checkInQuestionConfig,
  CheckInSectionId,
  CheckInSectionSpec,
  checkInToolSpecs,
  CheckInVersion,
} from "~@jii/configs";

import { SuccessPlannerSection } from "../model/successPlanner";
import copy from "./successPlannerCopy";

const NAV_LABELS: Record<CheckInSectionId, string> = {
  sectionHousing: "Housing",
  sectionEducationWork: "Education & Work",
  sectionTransportation: "Transportation",
  sectionHobbiesLeisure: "Hobbies & Leisure",
  sectionMoney: "Money",
  sectionWellness: "Wellness",
  sectionHealth: "Mental & Physical Health",
  sectionSupportSystem: "Support System",
  sectionStrengthsSkills: "Strengths & Skills",
  sectionEnd: "Wrap Up",
};

const toSuccessPlannerSection: (
  spec: CheckInSectionSpec[],
) => SuccessPlannerSection[] = (spec) =>
  spec.map(({ id, questions }) => {
    return {
      id,
      navLabel: NAV_LABELS[id],
      heading: NAV_LABELS[id].toUpperCase(),
      questions: questions.map((questionId) => {
        return {
          id: questionId,
          label: copy.questions[questionId].question,
          answerType:
            checkInQuestionConfig[questionId].format === "SUPPORT_SYSTEM"
              ? "table"
              : "text",
        };
      }),
    };
  });

export const SUCCESS_PLANNER_SECTIONS: Record<
  CheckInVersion,
  SuccessPlannerSection[]
> = mapValues(checkInToolSpecs, toSuccessPlannerSection);
