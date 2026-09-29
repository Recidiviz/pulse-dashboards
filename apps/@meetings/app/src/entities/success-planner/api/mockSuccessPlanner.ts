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

import { SUCCESS_PLANNER_SECTIONS } from "../config/successPlannerSections";
import { SuccessPlanner, SuccessPlannerAnswers } from "../model/successPlanner";

const SENDER = "first.last@example.com";
const SENT_AT = new Date(2026, 7, 17, 10, 2);
const LAST_UPDATED_AT = new Date(2026, 7, 21, 9, 14);
const COMPLETED_AT = new Date(2026, 7, 28, 15, 40);

const COMPLETED_ANSWERS: SuccessPlannerAnswers = {
  "housing-where": "Staying with family or friends",
  "housing-backup": "Yes",
  "housing-backup-detail":
    "I could look for another job or training program if my current plan doesn't work out. I'd also reach out to my support system and ask about other opportunities. I want to have more than one option lined up so I'm not stuck if something changes at the last minute.",
  "housing-success":
    "My sister has a room for me for six months. I'd pay something toward rent once I'm working and be out of there by spring. While I'm staying with my sister, I want to focus on finding steady work, saving money, and getting back on my feet. I'd like to have a consistent daily routine and work toward having my own place once I'm financially ready.",
  "housing-step": "Call my sister and get it in writing.",

  "education-plans": "Yes",
  "education-detail": null,
  "employment-plans": "Yes",
  "employment-org":
    "I'm interested in working in a warehouse or distribution center in an entry-level position.",
  "education-success": null,
  "education-step":
    "I could research local job openings and training programs and apply to one opportunity this week.",

  "transportation-how": "I'll have my own car",
  "transportation-insured": "Yes",
  "transportation-step":
    "I could look up reliable bus routes in my area and plan how I'll get to work and other important appointments.",

  "hobbies-fun":
    "I like playing basketball, listening to music, watching movies, and spending time with my family.",
  "hobbies-avoid": "Yes",
  "hobbies-avoid-detail": null,

  "money-court": "No",
  "money-debts": "Yes",
  "money-debts-detail":
    "I have some credit card debt and a few unpaid bills that I'll need to manage after release.",
  "money-benefits": "No",
  "money-children": "Yes",
  "money-children-goals":
    "I want to stay in regular contact with my family and be more responsible with my financial obligations. I also plan to stay current on any child support payments.",
  "money-success":
    "I would have steady income, my bills would be paid on time, and I would be able to save some money each month.",
  "money-step":
    "I could make a list of my debts and monthly expenses so I know exactly what I need to pay and can start planning a budget.",

  "wellness-helpful": "Intentional peer support",
  "wellness-step": null,

  "health-concerns": "Yes",
  "health-concerns-detail":
    "I have high blood pressure and need to continue monitoring it after release.",
  "health-medicine": "Yes",
  "health-medicine-detail":
    "I currently take medication to help manage my blood pressure and plan to continue taking it as prescribed.",
  "health-goals":
    "I want to improve my overall health by eating better, staying active, and finding healthy ways to manage stress.",
  "health-step":
    "I could make an appointment with a healthcare provider to discuss my health and make a plan for staying healthy after release.",

  "support-people": [
    { name: "Renata Auer", relationship: "Sister" },
    { name: "Pastor Dale", relationship: "Faith community" },
  ],

  "strengths-first":
    "I'm dependable and willing to work hard, even when things are difficult.",
  "strengths-second":
    "I'm patient and good at staying calm when I'm under pressure.",
  "skills-first": null,
  "skills-second":
    "I'm good at communicating with people and working as part of a team.",

  "track-risks":
    "Stress, getting distracted by old habits, or spending time with people who could lead me back into trouble could make it harder to stay on track.",
  "track-celebrate":
    "I could celebrate by spending time with my family, going out for a good meal, or doing something I enjoy.",
};

const IN_PROGRESS_SECTION_IDS = [
  "housing",
  "education-employment",
  "transportation",
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
