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

// TODO: Unify this copy with the copy in `successPlannerSections.ts`. Either
// remove the `label` from each question there or the `question` from each question here.
export default {
  standardRadioAnswers: {
    YES: "Yes",
    NO: "No",
  },
  questions: {
    WHERE_WILL_YOU_LIVE: {
      question: "Where will you live when you go home?",
      answers: {
        FAMILY_OR_FRIENDS: "Staying with family or friends",
        OWN_PLACE: "My own place (rented or owned)",
        TRANSITIONAL: "Transitional housing",
        FIGURING_IT_OUT: "Still figuring it out",
      },
    },
    HOUSING_BACKUP_PLAN: {
      question: "Do you have a backup plan if this falls through?",
    },
    HOUSING_SUCCESS: {
      question:
        "If your housing was successful, what would that look like day to day?",
    },
    HOUSING_BACKUP_PLAN_DESCRIPTION: {
      question: "What is your housing backup plan?",
    },
    HOUSING_STEP: {
      question:
        "What is one small step you could take right now to support your housing plan?",
    },
    EDUCATION_PLANS: {
      question:
        "Do you have plans to further your education after you go home?",
    },
    EDUCATION_PLANS_DESCRIPTION: {
      question:
        "What are your plans to further your education after you go home?",
    },
    WORK_PLANS: {
      question:
        "What are your plans for work, {{name}}? Do you already have a job?",
    },
    WORK_PLANS_DESCRIPTION: {
      question: "What’s the organization and role?",
    },
    EDUCATION_WORK_SUCCESS: {
      question:
        "Think about your school and work plans being successful. What would that look like?",
    },
    EDUCATION_WORK_STEP: {
      question:
        "What is one small step you could take right now that would help your education or work plans?",
    },
    TRANSPORTATION_PLAN: {
      question:
        "How will you get to work or to appointments after your release?",
      answers: {
        PUBLIC_TRANSPORT: "I’ll take public transportation",
        GET_A_RIDE: "I’ll get a ride with a friend or family member",
        OWN_CAR: "I’ll have my own car",
        FIGURING_IT_OUT: "Still figuring it out",
      },
    },
    CAR_INSURANCE_REGISTRATION: {
      question: "Is it insured and currently registered?",
    },
    TRANSPORTATION_STEP: {
      question:
        "What is one small step you could take right now to make your transportation plan more solid?",
    },
    DO_FOR_FUN: {
      question: "What do you like to do for fun, {{name}}?",
    },
    STAY_AWAY_FROM: {
      question:
        "Is there anything from your past that you’re planning to stay away from after release?",
    },
    STAY_AWAY_FROM_DESCRIPTION: {
      question:
        "Please share what you’re planning to stay away from after release.",
    },
    FINES_AND_FEES: {
      question: "Does the court say you owe money, like fines or fees?",
      answers: {
        DONT_KNOW: "I don’t know",
      },
    },
    DEBTS: {
      question:
        "Do you have other debts you’ll need to manage after release? If so, what are they?",
    },
    SOCIAL_SECURITY: {
      question:
        "Have you ever received money from Social Security, like SSI or SSDI?",
    },
    CHILDREN: {
      question: "Do you have children?",
    },
    CHILDREN_DESCRIPTION: {
      question:
        "What are your goals for your relationships with your children? Do you have child support obligations?",
    },
    FINANCES_SUCCESS: {
      question: "If your finances were going well, what would be different?",
    },
    FINANCES_STEP: {
      question:
        "What is one small step you could take right now to improve your finances?",
    },
    WELLNESS_SUPPORT: {
      question: "Which of the following options could help you?",
      answers: {
        SUPPORT_GROUP: "Support groups for alcohol or drug use, like AA or NA",
        COUNSELOR: "Talking one-on-one with a counselor",
        MEDICATION: "Medication-assisted treatment",
        RESIDENTIAL_TREATMENT: "Living at a residential treatment center",
        PEER_SUPPORT: "Intentional peer support",
        OTHER: "Other",
      },
    },
    WELLNESS_SUPPORT_OTHER: {
      question: "What sort of wellness support do you need?",
    },
    WELLNESS_STEP: {
      question:
        "What is one small step you could take right now to support this plan?",
    },
    MEDICAL_CONCERNS: {
      question: "Do you have any medical concerns prior to going home?",
    },
    MEDICAL_CONCERNS_DESCRIPTION: {
      question:
        "Please describe any medical concerns you have prior to going home.",
    },
    MEDICINE: {
      question: "Do you take any medicine right now?",
    },
    MEDICINE_DESCRIPTION: {
      question: "Please share what medicine you are currently taking.",
    },
    HEALTH_GOALS: {
      question:
        "Is there anything about your health you want to work on? This can be about your body, your mental health, or drug or alcohol use.",
    },
    HEALTH_STEP: {
      question:
        "What is one small step you could take right now to improve your health?",
    },
    SUPPORT_SYSTEM: {
      question: "Who are the four people who most support you?",
    },
    STRENGTH_1: {
      question: "What’s one strength that will help you after release?",
    },
    STRENGTH_2: {
      question: "What’s another strength you have?",
    },
    SKILL_1: {
      question: "What is a skill that will help your future?",
    },
    SKILL_2: {
      question:
        "What’s another skill you have that will help you when you go home?",
    },
    OBSTACLES: {
      question:
        "What could stop you from doing well with your release plans, {{name}}?",
    },
    CELEBRATION: {
      question: "What is one way you can celebrate when you do well?",
    },
  },
} as const;
