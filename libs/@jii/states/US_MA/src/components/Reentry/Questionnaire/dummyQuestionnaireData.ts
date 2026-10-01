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

// TEMPORARY - FOR REVIEW AND TESTING ONLY.
// Dummy copy and sections for viewing the flow before OBT-51840 wires real data.

import { ReentryQuestionnaireQuestionId } from "~@jii/configs";

export const questionCopy: Record<ReentryQuestionnaireQuestionId, string> = {
  housing: "Where are you planning to live when you get out?",
  planToWork: "Do you plan to work when you get out?",
  healthcareNeeded: "Will you need health care or medicine when you get out?",
  healthcareDetails:
    "What health care or medicine would you need when you get out?",
  receivedBenefitsBefore:
    "Have you received benefits like this before, or think you might qualify?",
  benefitsType:
    "Which of these have you received before or think you might qualify for?",
  transportation: "How do you plan to get around once you're out?",
  highestEducationLevel: "What's your highest level of education?",
  servedInMilitary: "Have you served in the military?",
};

export const optionCopy: Record<
  ReentryQuestionnaireQuestionId,
  Record<string, string>
> = {
  housing: {
    FAMILY: "With family",
    FRIENDS_OR_ROOMMATES: "With friends or roommates",
    LONG_TERM_RESIDENTIAL_PROGRAM: "A long term residential program (LTRP)",
    OWN_PLACE: "My own place",
    UNSURE: "I don't know yet / depends on parole",
    DECLINE_TO_ANSWER: "I'd rather not say",
  },
  planToWork: {
    YES_JOB_LINED_UP: "Yes, and I already have a job lined up",
    YES_NEED_TO_LOOK: "Yes, and I need to look for jobs",
    NO_DISABLED: "No, I am disabled and can't work",
    NO_RETIRED: "No, I am retired",
    NO_SCHOOL: "No, I plan to go to school full time",
    UNSURE: "I'm not sure",
    DECLINE_TO_ANSWER: "I'd rather not say",
  },
  healthcareNeeded: {
    YES: "Yes",
    NO: "No",
    UNSURE: "I'm not sure",
    DECLINE_TO_ANSWER: "I'd rather not say",
  },
  healthcareDetails: {
    PRESCRIPTION_MEDICINE: "Prescription medicine",
    ONGOING_CONDITION: "Healthcare for an ongoing medical condition",
    MENTAL_HEALTH: "Mental health support",
    SUBSTANCE_USE: "Substance use support",
    MEDICATION_ASSISTED_TREATMENT: "Medication-assisted treatment (MAT)",
  },
  receivedBenefitsBefore: {
    YES: "Yes",
    NONE_OF_THESE: "No, none of these",
    UNSURE: "I'm not sure",
    DECLINE_TO_ANSWER: "I'd rather not say",
  },
  benefitsType: {
    SSI: "SSI",
    SSDI: "SSDI",
  },
  transportation: {
    FAMILY_OR_FRIENDS: "Family or friends will drive me",
    PUBLIC_TRANSIT: "Public transit",
    BIKE: "I'll ride a bike",
    OWN_CAR: "My own car",
    UNSURE: "I'm not sure",
    DECLINE_TO_ANSWER: "I'd rather not say",
  },
  highestEducationLevel: {
    LESS_THAN_HIGH_SCHOOL: "Less than high school",
    HS_DIPLOMA_OR_GED_OR_HISET: "High school diploma, GED or HiSET",
    SOME_COLLEGE: "Some college",
    COLLEGE_DEGREE: "College degree or higher",
    DECLINE_TO_ANSWER: "I'd rather not say",
  },
  servedInMilitary: {
    YES_HAVE_DD214: "Yes, and I have my DD-214 (military discharge papers)",
    YES_MISSING_DD214:
      "Yes, but I don't have a copy of my DD-214 (military discharge papers)",
    NO: "No",
    DECLINE_TO_ANSWER: "I'd rather not say",
  },
};

export const domainLabels: Record<string, string> = {
  housing: "Housing",
  work: "Work",
  health: "Health",
  money: "Money",
  transportation: "Transportation",
  education: "Education",
  documents: "Documents",
};

export const domainOrder = [
  "housing",
  "work",
  "health",
  "money",
  "transportation",
  "education",
  "documents",
];
