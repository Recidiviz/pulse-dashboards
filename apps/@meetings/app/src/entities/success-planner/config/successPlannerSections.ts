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
    id: "housing",
    navLabel: "Housing",
    heading: "HOUSING",
    questions: [
      {
        id: "housing-where",
        label: "Where will you live when you go home?",
        answerType: "text",
      },
      {
        id: "housing-backup",
        label: "Do you have a backup plan if this falls through?",
        answerType: "text",
      },
      {
        id: "housing-backup-detail",
        label: "Do you have a backup plan, just in case?",
        answerType: "text",
      },
      {
        id: "housing-success",
        label:
          "If your housing was successful, what would that look like day to day?",
        answerType: "text",
      },
      {
        id: "housing-step",
        label: "What is one small step you could take right now?",
        answerType: "text",
      },
    ],
  },
  {
    id: "education-employment",
    navLabel: "Education and Employment",
    heading: "EDUCATION & EMPLOYMENT",
    questions: [
      {
        id: "education-plans",
        label: "Do you have plans to further your education after you go home?",
        answerType: "text",
      },
      {
        id: "education-detail",
        label: "What are your plans?",
        answerType: "text",
      },
      {
        id: "employment-plans",
        label: "What are your plans for work? Do you already have a job?",
        answerType: "text",
      },
      {
        id: "employment-org",
        label: "What's the organization and role?",
        answerType: "text",
      },
      {
        id: "education-success",
        label:
          "Think about your school and work plans being successful. What would that look like?",
        answerType: "text",
      },
      {
        id: "education-step",
        label:
          "What is one small step you could take right now that would help your education or work plans?",
        answerType: "text",
      },
    ],
  },
  {
    id: "transportation",
    navLabel: "Transportation",
    heading: "TRANSPORTATION",
    questions: [
      {
        id: "transportation-how",
        label:
          "How will you get to work or to appointments after your release?",
        answerType: "text",
      },
      {
        id: "transportation-insured",
        label: "Is it insured and currently registered?",
        answerType: "text",
      },
      {
        id: "transportation-step",
        label:
          "What is one small step you could take right now to make your transportation plan more solid?",
        answerType: "text",
      },
    ],
  },
  {
    id: "hobbies-leisure",
    navLabel: "Hobbies and Leisure",
    heading: "HOBBIES AND LEISURE",
    questions: [
      {
        id: "hobbies-fun",
        label:
          "Let's talk about hobbies and leisure, what do you like to do for fun?",
        answerType: "text",
      },
      {
        id: "hobbies-avoid",
        label:
          "Is there anything from your past that you're planning to stay away from after release?",
        answerType: "text",
      },
      {
        id: "hobbies-avoid-detail",
        label:
          "Describing anything from client's past that he is planning to stay away from after release",
        answerType: "text",
      },
    ],
  },
  {
    id: "money",
    navLabel: "Money",
    heading: "MONEY",
    questions: [
      {
        id: "money-court",
        label:
          "Let's talk about your finances. Does the court say you owe money, like fines or fees?",
        answerType: "text",
      },
      {
        id: "money-debts",
        label: "Do you have other debts you'll need to manage after release?",
        answerType: "text",
      },
      {
        id: "money-debts-detail",
        label: "Please describe",
        answerType: "text",
      },
      {
        id: "money-benefits",
        label:
          "Have you ever received money from Social Security, like SSI or SSDI?",
        answerType: "text",
      },
      {
        id: "money-children",
        label: "Do you have children?",
        answerType: "text",
      },
      {
        id: "money-children-goals",
        label:
          "What are your goals for your relationships with them? Do you have child support obligations?",
        answerType: "text",
      },
      {
        id: "money-success",
        label: "If your finances were going well, what would that look like?",
        answerType: "text",
      },
      {
        id: "money-step",
        label:
          "What is one small step you could take right now to improve your finances?",
        answerType: "text",
      },
    ],
  },
  {
    id: "wellness",
    navLabel: "Wellness",
    heading: "WELLNESS",
    questions: [
      {
        id: "wellness-helpful",
        label: "Which of the below might be helpful for you?",
        answerType: "text",
      },
      {
        id: "wellness-step",
        label:
          "What is one small step you could take right now to support this plan?",
        answerType: "text",
      },
    ],
  },
  {
    id: "physical-health",
    navLabel: "Physical Health",
    heading: "PHYSICAL HEALTH",
    questions: [
      {
        id: "health-concerns",
        label: "Do you have any medical concerns prior to going home?",
        answerType: "text",
      },
      {
        id: "health-concerns-detail",
        label: "Please describe.",
        answerType: "text",
      },
      {
        id: "health-medicine",
        label: "Do you take any medicine right now?",
        answerType: "text",
      },
      {
        id: "health-medicine-detail",
        label: "Please describe.",
        answerType: "text",
      },
      {
        id: "health-goals",
        label:
          "Is there anything about your health you want to work on? This can be about your body, your mental health, or drug or alcohol use.",
        answerType: "text",
      },
      {
        id: "health-step",
        label:
          "What is one small step you could take right now to improve your health?",
        answerType: "text",
      },
    ],
  },
  {
    id: "support-system",
    navLabel: "Support System",
    heading: "SUPPORT SYSTEM",
    questions: [
      {
        id: "support-people",
        label: "Please name the four people who most support you.",
        answerType: "table",
      },
    ],
  },
  {
    id: "strengths-skills",
    navLabel: "Strengths and Skills",
    heading: "STRENGTHS AND SKILLS",
    questions: [
      {
        id: "strengths-first",
        label:
          "Let's get started by talking about your strengths and skills — what's one strength that will help you after release?",
        answerType: "text",
      },
      {
        id: "strengths-second",
        label: "What's another strength you have?",
        answerType: "text",
      },
      {
        id: "skills-first",
        label: "What is a skill that will help your future?",
        answerType: "text",
      },
      {
        id: "skills-second",
        label:
          "What's another skill you have that will help you when you go home?",
        answerType: "text",
      },
    ],
  },
  {
    id: "staying-on-track",
    navLabel: "Staying on Track",
    heading: "STAYING ON TRACK",
    questions: [
      {
        id: "track-risks",
        label: "What could stop you from doing well with your release plans?",
        answerType: "text",
      },
      {
        id: "track-celebrate",
        label: "What is one way you can celebrate when you do well?",
        answerType: "text",
      },
    ],
  },
];
