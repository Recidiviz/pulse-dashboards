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

import { SuccessPlannerSection } from "../model/successPlanner";

export const SUCCESS_PLANNER_SECTIONS: SuccessPlannerSection[] = [
  {
    id: "sectionHousing",
    navLabel: "Housing",
    heading: "HOUSING",
    questions: [
      {
        id: "WHERE_WILL_YOU_LIVE",
        label: "Where will you live when you go home?",
        answerType: "text",
      },
      {
        id: "HOUSING_BACKUP_PLAN",
        label: "Do you have a backup plan if this falls through?",
        answerType: "text",
      },
      {
        id: "HOUSING_BACKUP_PLAN_DESCRIPTION",
        label: "What is your housing backup plan?",
        answerType: "text",
      },
      {
        id: "HOUSING_SUCCESS",
        label:
          "If your housing was successful, what would that look like day to day?",
        answerType: "text",
      },
      {
        id: "HOUSING_STEP",
        label:
          "What is one small step you could take right now to support your housing plan?",
        answerType: "text",
      },
    ],
  },
  {
    id: "sectionEducationWork",
    navLabel: "Education & Work",
    heading: "EDUCATION & WORK",
    questions: [
      {
        id: "EDUCATION_PLANS",
        label: "Do you have plans to further your education after you go home?",
        answerType: "text",
      },
      {
        id: "EDUCATION_PLANS_DESCRIPTION",
        label:
          "What are your plans to further your education after you go home?",
        answerType: "text",
      },
      {
        id: "WORK_PLANS",
        label: "What are your plans for work? Do you already have a job?",
        answerType: "text",
      },
      {
        id: "WORK_PLANS_DESCRIPTION",
        label: "What's the organization and role?",
        answerType: "text",
      },
      {
        id: "EDUCATION_WORK_SUCCESS",
        label:
          "Think about your school and work plans being successful. What would that look like?",
        answerType: "text",
      },
      {
        id: "EDUCATION_WORK_STEP",
        label:
          "What is one small step you could take right now that would help your education or work plans?",
        answerType: "text",
      },
    ],
  },
  {
    id: "sectionTransportation",
    navLabel: "Transportation",
    heading: "TRANSPORTATION",
    questions: [
      {
        id: "TRANSPORTATION_PLAN",
        label:
          "How will you get to work or to appointments after your release?",
        answerType: "text",
      },
      {
        id: "CAR_INSURANCE_REGISTRATION",
        label: "Is your car insured and currently registered?",
        answerType: "text",
      },
      {
        id: "TRANSPORTATION_STEP",
        label:
          "What is one small step you could take right now to make your transportation plan more solid?",
        answerType: "text",
      },
    ],
  },
  {
    id: "sectionHobbiesLeisure",
    navLabel: "Hobbies & Leisure",
    heading: "HOBBIES & LEISURE",
    questions: [
      {
        id: "DO_FOR_FUN",
        label: "What do you like to do for fun?",
        answerType: "text",
      },
      {
        id: "STAY_AWAY_FROM",
        label:
          "Is there anything from your past that you're planning to stay away from after release?",
        answerType: "text",
      },
      {
        id: "STAY_AWAY_FROM_DESCRIPTION",
        label:
          "Please share what you're planning to stay away from after release.",
        answerType: "text",
      },
    ],
  },
  {
    id: "sectionMoney",
    navLabel: "Money",
    heading: "MONEY",
    questions: [
      {
        id: "FINES_AND_FEES",
        label: "Does the court say you owe money, like fines or fees?",
        answerType: "text",
      },
      {
        id: "DEBTS",
        label:
          "Do you have other debts you'll need to manage after release? If so, what are they?",
        answerType: "text",
      },
      {
        id: "SOCIAL_SECURITY",
        label:
          "Have you ever received money from Social Security, like SSI or SSDI?",
        answerType: "text",
      },
      {
        id: "CHILDREN",
        label: "Do you have children?",
        answerType: "text",
      },
      {
        id: "CHILDREN_DESCRIPTION",
        label:
          "What are your goals for your relationships with your children? Do you have child support obligations?",
        answerType: "text",
      },
      {
        id: "FINANCES_SUCCESS",
        label: "If your finances were going well, what would be different?",
        answerType: "text",
      },
      {
        id: "FINANCES_STEP",
        label:
          "What is one small step you could take right now to improve your finances?",
        answerType: "text",
      },
    ],
  },
  {
    id: "sectionWellness",
    navLabel: "Wellness",
    heading: "WELLNESS",
    questions: [
      {
        id: "WELLNESS_SUPPORT",
        label: "Which of the following options could help you?",
        answerType: "text",
      },
      {
        id: "WELLNESS_SUPPORT_OTHER",
        label: "What sort of wellness support do you need?",
        answerType: "text",
      },
      {
        id: "WELLNESS_STEP",
        label:
          "What is one small step you could take right now to support this plan?",
        answerType: "text",
      },
    ],
  },
  {
    id: "sectionPhysicalHealth",
    navLabel: "Physical Health",
    heading: "PHYSICAL HEALTH",
    questions: [
      {
        id: "MEDICAL_CONCERNS",
        label: "Do you have any medical concerns prior to going home?",
        answerType: "text",
      },
      {
        id: "MEDICAL_CONCERNS_DESCRIPTION",
        label:
          "Please describe any medical concerns you have prior to going home.",
        answerType: "text",
      },
      {
        id: "MEDICINE",
        label: "Do you take any medicine right now?",
        answerType: "text",
      },
      {
        id: "MEDICINE_DESCRIPTION",
        label: "Please share what medicine you are currently taking.",
        answerType: "text",
      },
      {
        id: "HEALTH_GOALS",
        label:
          "Is there anything about your health you want to work on? This can be about your body, your mental health, or drug or alcohol use.",
        answerType: "text",
      },
      {
        id: "HEALTH_STEP",
        label:
          "What is one small step you could take right now to improve your health?",
        answerType: "text",
      },
    ],
  },
  {
    id: "sectionSupportSystem",
    navLabel: "Support System",
    heading: "SUPPORT SYSTEM",
    questions: [
      {
        id: "SUPPORT_SYSTEM",
        label: "Who are the four people who most support you?",
        answerType: "table",
      },
    ],
  },
  {
    id: "sectionStrengthsSkills",
    navLabel: "Strengths & Skills",
    heading: "STRENGTHS & SKILLS",
    questions: [
      {
        id: "STRENGTH_1",
        label: "What's one strength that will help you after release?",
        answerType: "text",
      },
      {
        id: "STRENGTH_2",
        label: "What's another strength you have?",
        answerType: "text",
      },
      {
        id: "SKILL_1",
        label: "What is a skill that will help your future?",
        answerType: "text",
      },
      {
        id: "SKILL_2",
        label:
          "What's another skill you have that will help you when you go home?",
        answerType: "text",
      },
    ],
  },
  {
    id: "sectionEnd",
    navLabel: "Wrap Up",
    heading: "WRAP UP",
    questions: [
      {
        id: "OBSTACLES",
        label: "What could stop you from doing well with your release plans?",
        answerType: "text",
      },
      {
        id: "CELEBRATION",
        label: "What is one way you can celebrate when you do well?",
        answerType: "text",
      },
    ],
  },
];
