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

import { CheckInSectionId } from "~@jii/configs";

import { SUCCESS_PLANNER_SECTIONS } from "../config/successPlannerSections";
import { SuccessPlanner, SuccessPlannerAnswers } from "../model/successPlanner";

const SENDER = "first.last@example.com";
const SENT_AT = new Date(2026, 7, 17, 10, 2);
const LAST_UPDATED_AT = new Date(2026, 7, 21, 9, 14);
const COMPLETED_AT = new Date(2026, 7, 28, 15, 40);

const COMPLETED_ANSWERS: Required<SuccessPlannerAnswers> = {
  WHERE_WILL_YOU_LIVE: "FAMILY_OR_FRIENDS",
  HOUSING_BACKUP_PLAN: "YES",
  HOUSING_BACKUP_PLAN_DESCRIPTION:
    "I could look for another job or training program if my current plan doesn't work out. I'd also reach out to my support system and ask about other opportunities. I want to have more than one option lined up so I'm not stuck if something changes at the last minute.",
  HOUSING_SUCCESS:
    "My sister has a room for me for six months. I'd pay something toward rent once I'm working and be out of there by spring. While I'm staying with my sister, I want to focus on finding steady work, saving money, and getting back on my feet. I'd like to have a consistent daily routine and work toward having my own place once I'm financially ready.",
  HOUSING_STEP: "Call my sister and get it in writing.",

  EDUCATION_PLANS: "YES",
  EDUCATION_PLANS_DESCRIPTION: null,
  WORK_PLANS: "YES",
  WORK_PLANS_DESCRIPTION:
    "I'm interested in working in a warehouse or distribution center in an entry-level position.",
  EDUCATION_WORK_SUCCESS: null,
  EDUCATION_WORK_STEP:
    "I could research local job openings and training programs and apply to one opportunity this week.",

  TRANSPORTATION_PLAN: "OWN_CAR",
  CAR_INSURANCE_REGISTRATION: "YES",
  TRANSPORTATION_STEP:
    "I could look up reliable bus routes in my area and plan how I'll get to work and other important appointments.",

  DO_FOR_FUN:
    "I like playing basketball, listening to music, watching movies, and spending time with my family.",
  STAY_AWAY_FROM: "YES",
  STAY_AWAY_FROM_DESCRIPTION: null,

  FINES_AND_FEES: "NO",
  DEBTS:
    "I have some credit card debt and a few unpaid bills that I'll need to manage after release.",
  SOCIAL_SECURITY: "NO",
  CHILDREN: "YES",
  CHILDREN_DESCRIPTION:
    "I want to stay in regular contact with my family and be more responsible with my financial obligations. I also plan to stay current on any child support payments.",
  FINANCES_SUCCESS:
    "I would have steady income, my bills would be paid on time, and I would be able to save some money each month.",
  FINANCES_STEP:
    "I could make a list of my debts and monthly expenses so I know exactly what I need to pay and can start planning a budget.",

  WELLNESS_SUPPORT: ["PEER_SUPPORT"],
  WELLNESS_SUPPORT_OTHER: null,
  WELLNESS_STEP: "I could look for nearby support groups after getting out.",

  MEDICAL_CONCERNS: "YES",
  MEDICAL_CONCERNS_DESCRIPTION:
    "I have high blood pressure and need to continue monitoring it after release.",
  MEDICINE: "YES",
  MEDICINE_DESCRIPTION:
    "I currently take medication to help manage my blood pressure and plan to continue taking it as prescribed.",
  HEALTH_GOALS:
    "I want to improve my overall health by eating better, staying active, and finding healthy ways to manage stress.",
  HEALTH_STEP:
    "I could make an appointment with a healthcare provider to discuss my health and make a plan for staying healthy after release.",

  SUPPORT_SYSTEM: [
    { name: "Renata Auer", relationship: "Sister" },
    { name: "Pastor Dale", relationship: "Faith community" },
  ],

  STRENGTH_1:
    "I'm dependable and willing to work hard, even when things are difficult.",
  STRENGTH_2: "I'm patient and good at staying calm when I'm under pressure.",
  SKILL_1:
    "I'm good at communicating with people and working as part of a team.",
  SKILL_2: null,

  OBSTACLES:
    "Stress, getting distracted by old habits, or spending time with people who could lead me back into trouble could make it harder to stay on track.",
  CELEBRATION:
    "I could celebrate by spending time with my family, going out for a good meal, or doing something I enjoy.",
};

const IN_PROGRESS_SECTION_IDS: CheckInSectionId[] = [
  "sectionHousing",
  "sectionEducationWork",
  "sectionTransportation",
];

const IN_PROGRESS_ANSWERS: SuccessPlannerAnswers = Object.fromEntries(
  SUCCESS_PLANNER_SECTIONS.filter((section) =>
    IN_PROGRESS_SECTION_IDS.includes(section.id),
  )
    .flatMap((section) => section.questions)
    .map((question) => [question.id, COMPLETED_ANSWERS[question.id]]),
);

export const NOT_STARTED_PLANNER: SuccessPlanner = {
  id: "mock-planner-not-started",
  assignedBy: SENDER,
  createdAt: SENT_AT,
  updatedAt: SENT_AT,
  completedAt: null,
  answers: {},
};

export const IN_PROGRESS_PLANNER: SuccessPlanner = {
  id: "mock-planner-in-progress",
  assignedBy: SENDER,
  createdAt: SENT_AT,
  updatedAt: LAST_UPDATED_AT,
  completedAt: null,
  answers: IN_PROGRESS_ANSWERS,
};

export const COMPLETED_PLANNER: SuccessPlanner = {
  id: "mock-planner-completed",
  assignedBy: SENDER,
  createdAt: SENT_AT,
  updatedAt: COMPLETED_AT,
  completedAt: COMPLETED_AT,
  answers: COMPLETED_ANSWERS,
};

export const MOCK_SUCCESS_PLANNER: SuccessPlanner | null = COMPLETED_PLANNER;
