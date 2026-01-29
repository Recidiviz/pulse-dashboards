// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2025 Recidiviz, Inc.
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

import type {
  RNAPageId,
  RNAQuestionId,
  RNARadioQuestionFormat,
} from "~@jii/configs";

// Copy used in the form frontend that isn't related to a specific page or question
export const rnaMiscellaneousCopy = {
  INVALID_ANSWER_NOTICE: "You must answer this question to continue.",
  ANSWER_ALL_QUESTIONS_NOTICE:
    "You must answer all of the questions to continue.",
  SAVING: "Saving your answers...",
  SAVING_ERROR: "There was a problem saving your answers.",
  GO_BACK_MODAL: {
    title: "Are you sure you want to go back?",
    message:
      "You can go back to edit your other responses, but if you do, the responses you have entered on this page will be lost.",
    cancelButtonText: "Stay on this page",
    confirmButtonText: "Go back",
  },
  PREVIOUS_BUTTON: "Previous",
  NEXT_BUTTON: "Next",
  SUBMIT_BUTTON: "Submit",
} as const;

// Types related to RNA copy
export type RNAPageCopy = {
  heading: string;
  description?: string;
};
export type RNAQuestionCopy = {
  question: string;
  placeholderText?: string;
};

// Copy that depends on the format of the RNA question and is consistent for all
// questions of the same format, such as answer choices

export const rnaRadioAnswerCopy = {
  FREQUENCY: {
    NEVER: "Never true",
    RARELY: "Rarely true",
    SOMETIMES: "Sometimes true",
    USUALLY: "Usually true",
    ALWAYS: "Always true",
  },
  DAYS_PER_WEEK_RADIO: {
    ZERO: "0 days",
    ONE_TO_TWO: "1-2 days",
    THREE_TO_FIVE: "3-5 days",
    SIX_TO_SEVEN: "6-7 days",
  },
  YES_NO: {
    YES: "Yes",
    NO: "No",
  },
  RATIO: {
    NONE: "None",
    SOME: "Some",
    MOST: "Most",
    ALL: "All",
  },
} as const satisfies Record<RNARadioQuestionFormat, Record<string, string>>;

export const rnaSobrietyAnswerCopy = {
  SOBER: "sober",
  JUST_ALCOHOL: "under the influence of just alcohol",
  JUST_DRUGS: "under the influence of just drugs",
  BOTH: "under the influence of both alcohol and drugs",
} as const;

export const rnaLifeAreasQuestionCopy = {
  interestedInImproving:
    "How much are you interested in improving? (1 = Not at all, 10 = Very)",
  improvement: "What can you do to improve the situation? (optional)",
  improvementPlaceholder:
    "Ways you can improve the situation or obstacles that you may face while improving the situation",
  improvementRatings: ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10"],
} as const;

// Copy for each of the RNA form pages and questions
export const rnaPageCopy = {
  sectionBasicNeeds: {
    heading: "Section 1: Your Needs",
    description: "Select the answer that best shows what is true for you.",
  },
  sectionAlcoholDrugs: {
    heading: "Section 2: Alcohol and Drugs",
    description:
      "Think of a typical week in your life as you answer the questions below. Select the answer that best shows what is true for you.",
  },
  sectionChildhoodTrouble: {
    heading: "Section 3: Your Childhood",
    description:
      "Think of times before you were 15 years old when you got in trouble.",
  },
  sectionFamilyGrowingUp: {
    heading: "Section 4: Your Family Growing Up",
    description:
      "Select the answer that best shows what it was like in your family when you were growing up.",
  },
  sectionFamilyNow: {
    heading: "Section 5: Your Family Now",
    description:
      "Select the answer that best shows what is true for your current family situation.",
  },
  sectionBehavior: {
    heading: "Section 6: Your Behavior",
    description: "Select the answer that best shows what is true for you.",
  },
  sectionBehavior2: {
    heading: "Section 7: Your Behavior",
    description: "Select the answer that best shows what is true for you.",
  },
  sectionFriends: {
    heading: "Section 8: Your Friends",
    description:
      "Think about the friends you have now and keep them in mind when you answer the following questions.",
  },
  sectionLifeAreas: {
    heading: "Section 9: Life Areas",
    description:
      "Below you will see life areas that may or may not be areas of concern to you. For each area you mark as a problem, please rate your interest in improving your situation and what you can do.",
  },
} satisfies Record<RNAPageId, RNAPageCopy>;

export const rnaQuestionCopy: Record<RNAQuestionId, RNAQuestionCopy> = {
  // Page 1 of the paper form

  needsWorkSchoolSatisfied: {
    question: "I have been satisfied in my work and school situation.",
  },
  needsHasJobSkills: {
    question: "I have the skills that I need to get a good job.",
  },
  needsImproveJobSchool: {
    question: "I try to make my job or school situation better.",
  },
  needsRanOutOfMoney: {
    question: "I often ran out of money.",
  },
  needsStruggledWithBills: {
    question: "I struggled to pay the rent or things like my light bill.",
  },
  needsReliedOnOthersForMoney: {
    question: "I often relied on others for money.",
  },
  needsHasPermanentHousing: {
    question: "I have a permanent place to live upon release.",
  },
  needsSpecialEducation: {
    question: "When I was in school I was in special education classes.",
  },
  needsReadingDifficulty: {
    question: "I find it difficult to read.",
  },
  needsCalculatingChange: {
    question:
      "When I bought something with cash, I could figure out how much change I should get back.",
  },
  needsMedicalPaymentHardship: {
    question: "It was hard for me to pay for my medical needs.",
  },

  // Page 2 of the paper form

  alcoholDrugsDaysOfUse: {
    question:
      "In a typical week how many days a week did you drink alcohol or use drugs?",
  },
  alcoholDrugsMoreThan5Drinks: {
    question:
      "How many days in a typical week did you drink more than 5 drinks at one sitting?",
    placeholderText: "Number of days",
  },
  alcoholDrugsTimeOfOffense: {
    question:
      "At the time of the offense for which I am currently incarcerated, I was (mark all that apply):",
  },
  alcoholDrugsArguments: {
    question:
      "When I drank alcohol or used drugs I got in arguments with others.",
  },
  alcoholDrugsHungOver: {
    question: "I would feel “hung over” or sick when I woke up.",
  },
  alcoholDrugsTrouble: {
    question: "When I drank or used drugs I got in trouble at work/school.",
  },
  alcoholDrugsStopping: {
    question: "I think about stopping drinking or doing drugs.",
  },

  // Page 3 of the paper form

  childhoodSkippingSchool: {
    question: "Skipping school",
  },
  childhoodRunningAway: {
    question: "Running away",
  },
  childhoodFighting: {
    question: "Fighting",
  },
  childhoodHavingWeapons: {
    question: "Having weapons",
  },
  childhoodForcingSexualActivities: {
    question: "Forcing sexual activities on others",
  },
  childhoodHurtingAnimalsOrPeople: {
    question: "Hurting animals or people",
  },
  childhoodTearingProperty: {
    question: "Tearing up others' property",
  },
  childhoodStartingFires: {
    question: "Starting fires",
  },
  childhoodLying: {
    question: "Lying",
  },
  childhoodStealing: {
    question: "Stealing something from others",
  },

  familyLawTrouble: {
    question: "Family members were in trouble with the law.",
  },
  familyFights: {
    question: "There were fights and arguments in my home.",
  },
  familyProblemSolving: {
    question:
      "When I had a problem I knew someone in my family would help me solve it.",
  },
  familyPunished: {
    question: "I knew I would be punished if rules were broken.",
  },
  familyNoRules: {
    question: "We didn’t hold to any rules or standards.",
  },
  familyAnythingGoes: {
    question: "Anything goes in our family.",
  },

  // Page 4 of the paper form

  familyHappy: {
    question: "I was happy with my family life prior to becoming incarcerated.",
  },
  familyUnderstands: {
    question: "My family understands my situation and problems.",
  },

  behaviorCantStop: {
    question:
      "Sometimes I can’t stop myself from doing something, even if I know it is wrong.",
  },
  behaviorImpulsive: {
    question: "People would describe me as impulsive.",
  },
  behaviorTryGetInTrouble: {
    question: "It’s exciting to try something that might get me in trouble.",
  },
  behaviorAngry: {
    question: "I become angry when people try to tell me what to do.",
  },

  behaviorStayOutOfTrouble: {
    question: "I try to stay out of situations that might get me in trouble.",
  },
  behaviorThinkBeforeActing: {
    question: "I think about what could happen before acting.",
  },
  behaviorLoseTemper: {
    question: "I lose my temper easily.",
  },
  behaviorApologize: {
    question: "I apologize to others when I do wrong.",
  },
  behaviorBlurt: {
    question: "I blurt out whatever is on my mind.",
  },

  // Page 5 of the paper form
  behaviorWorldOwesBetter: {
    question: "I think the world owes me a better life.",
  },
  behaviorGetEven: {
    question: "I get even with people who mess with me.",
  },
  behaviorBadLuck: {
    question: "I get in trouble because I have bad luck.",
  },
  behaviorAffectOthers: {
    question: "I think about how my actions will affect others.",
  },
  behaviorControlSpeech: {
    question: "I can control the things I say.",
  },
  behaviorNotPlanned: {
    question: "I do things I had not planned to do.",
  },
  behaviorLawbreaking: {
    question:
      "Breaking the law is not a big deal as long as you don’t hurt someone.",
  },

  // Page 6 of the paper form
  friendsJusticeInvolved: {
    question:
      "How many of those friends are in prison or on probation, parole or post release supervision?",
  },
  friendsGangMembers: {
    question: "How many of those friends are members of a gang?",
  },
  friendsCommittedCrime: {
    question:
      "How many of those friends have ever committed a crime, whether or not they were arrested?",
  },
  friendsDrugs: {
    question: "How many of those friends sell or use drugs (including pot)?",
  },
  friendsOrganizations: {
    question:
      "How many of those friends are involved in community or social organizations?",
  },
  friendsClose: {
    question: "How many of those friends would you consider “close friends”?",
  },

  // Life Areas / Self-Assessment Survey (part 2 of the paper form)

  lifeAreaBehavior: {
    question: "Is your behavior a problem for you?",
  },
  lifeAreaEmployability: {
    question: "Is your employability a problem for you?",
  },
  lifeAreaAlcoholDrugs: {
    question: "Are alcohol or other drugs a problem for you?",
  },
  lifeAreaEducation: {
    question: "Is education a problem for you?",
  },
  lifeAreaEmployment: {
    question: "Is employment a problem for you?",
  },
  lifeAreaFamilyFriends: {
    question: "Are family / friends a problem for you?",
  },
  lifeAreaLifeSkills: {
    question: "Are life skills a problem for you?",
  },
  lifeAreaPhysicalMedical: {
    question: "Are physical / medical concerns a problem for you?",
  },
  lifeAreaMentalHealth: {
    question: "Are mental health concerns a problem for you?",
  },
  lifeAreaFinancial: {
    question: "Are financial matters a problem for you?",
  },
  lifeAreaHousing: {
    question: "Is housing a problem for you?",
  },
  lifeAreaTransportation: {
    question: "Is transportation a problem for you?",
  },
  lifeAreaLegalStatus: {
    question: "Is legal status a problem for you?",
  },
  lifeAreaCustom: {
    question: "Any other areas you'd like to improve? (optional)",
    placeholderText: "Another life area",
  },
};
