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

// Types related to RNA copy
export type RNASectionCopy = {
  heading: string;
  description?: string;
};
export type RNAQuestionCopy = {
  question: string;
  placeholderText?: string;
};

// Internal identifiers for individual RNA elements
type RNASectionId = keyof typeof rnaSectionCopy;
export type RNAQuestionId = keyof typeof rnaQuestionCopy;

export const isRNAQuestionId = (s: string): s is RNAQuestionId =>
  Object.keys(rnaQuestionCopy).includes(s);

// Types related to RNA configuration:
// everything besides copy that determines how a specific question is displayed
export type RNARadioQuestionFormat = keyof typeof rnaRadioAnswerCopy;
type RNAQuestionFormat =
  | RNARadioQuestionFormat
  | "SOBRIETY"
  | "DAYS_PER_WEEK_ENTRY"
  | "LIFE_AREA";

export type RNAQuestionConfig = {
  questionNumber: number;
  format: RNAQuestionFormat;
};

// The RNA form is a sequence of pages. Each page has a section header and some questions.
// This should only contain internal identifiers, not copy - all copy should be
// in the copy objects below.

type RNAPageSpec = {
  id: RNASectionId;
  questions: RNAQuestionId[];
};
export const fullRNASpec: RNAPageSpec[] = [
  {
    id: "sectionBasicNeeds",
    questions: [
      "needsWorkSchoolSatisfied",
      "needsHasJobSkills",
      "needsImproveJobSchool",
      "needsRanOutOfMoney",
      "needsStruggledWithBills",
      "needsReliedOnOthersForMoney",
      "needsHasPermanentHousing",
      "needsSpecialEducation",
      "needsReadingDifficulty",
      "needsCalculatingChange",
      "needsMedicalPaymentHardship",
    ],
  },
  {
    id: "sectionAlcoholDrugs",
    questions: [
      "alcoholDrugsDaysOfUse",
      "alcoholDrugsMoreThan5Drinks",
      "alcoholDrugsTimeOfOffense",
      "alcoholDrugsArguments",
      "alcoholDrugsHungOver",
      "alcoholDrugsTrouble",
      "alcoholDrugsStopping",
    ],
  },
  {
    id: "sectionChildhoodTrouble",
    questions: [
      "childhoodSkippingSchool",
      "childhoodRunningAway",
      "childhoodFighting",
      "childhoodHavingWeapons",
      "childhoodForcingSexualActivities",
      "childhoodHurtingAnimalsOrPeople",
      "childhoodTearingProperty",
      "childhoodStartingFires",
      "childhoodLying",
      "childhoodStealing",
    ],
  },
  {
    id: "sectionFamilyGrowingUp",
    questions: [
      "familyLawTrouble",
      "familyFights",
      "familyProblemSolving",
      "familyPunished",
      "familyNoRules",
      "familyAnythingGoes",
    ],
  },
  {
    id: "sectionFamilyNow",
    questions: ["familyHappy", "familyUnderstands"],
  },
  {
    id: "sectionBehavior",
    questions: [
      "behaviorCantStop",
      "behaviorImpulsive",
      "behaviorTryGetInTrouble",
      "behaviorAngry",
      "behaviorStayOutOfTrouble",
      "behaviorThinkBeforeActing",
      "behaviorLoseTemper",
      "behaviorApologize",
      "behaviorBlurt",
    ],
  },
  {
    id: "sectionBehavior2",
    questions: [
      "behaviorWorldOwesBetter",
      "behaviorGetEven",
      "behaviorBadLuck",
      "behaviorAffectOthers",
      "behaviorControlSpeech",
      "behaviorNotPlanned",
      "behaviorLawbreaking",
    ],
  },
  {
    id: "sectionFriends",
    questions: [
      "friendsJusticeInvolved",
      "friendsGangMembers",
      "friendsCommittedCrime",
      "friendsDrugs",
      "friendsOrganizations",
      "friendsClose",
    ],
  },
  {
    id: "sectionLifeAreas",
    questions: [
      "lifeAreaBehavior",
      "lifeAreaEmployability",
      "lifeAreaAlcoholDrugs",
      "lifeAreaEducation",
      "lifeAreaEmployment",
      "lifeAreaFamilyFriends",
      "lifeAreaLifeSkills",
      "lifeAreaPhysicalMedical",
      "lifeAreaMentalHealth",
      "lifeAreaFinancial",
      "lifeAreaHousing",
      "lifeAreaTransportation",
      "lifeAreaLegalStatus",
      "lifeAreaCustom",
    ],
  },
];

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
} as const satisfies Record<string, Record<string, string>>;

export const rnaSobrietyAnswerCopy = {
  SOBER: "sober",
  JUST_ALCOHOL: "under the influence of just alcohol",
  JUST_DRUGS: "under the influence of just drugs",
  BOTH: "under the influence of both alcohol and drugs",
};

export const rnaLifeAreasQuestionCopy = {
  interestedInImproving:
    "How much are you interested in improving? (1 = Not at all, 10 = Very)",
  improvement: "What can you do to improve the situation? (optional)",
  improvementPlaceholder:
    "Ways you can improve the situation or obstacles that you may face while improving the situation",
  improvementRatings: ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10"],
};

// Copy for each of the questions on RNA form pages
export const rnaSectionCopy = {
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
} satisfies Record<string, RNASectionCopy>;

export const rnaQuestionCopy = {
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
    question: "Any other areas you'd like to improve?",
    placeholderText: "Another life area",
  },
} satisfies Record<string, RNAQuestionCopy>;

export const rnaQuestionConfig: Record<RNAQuestionId, RNAQuestionConfig> = {
  // Page 1 of the paper form

  needsWorkSchoolSatisfied: {
    questionNumber: 1,
    format: "FREQUENCY",
  },
  needsHasJobSkills: {
    questionNumber: 2,
    format: "FREQUENCY",
  },
  needsImproveJobSchool: {
    questionNumber: 3,
    format: "FREQUENCY",
  },
  needsRanOutOfMoney: {
    questionNumber: 4,
    format: "FREQUENCY",
  },
  needsStruggledWithBills: {
    questionNumber: 5,
    format: "FREQUENCY",
  },
  needsReliedOnOthersForMoney: {
    questionNumber: 6,
    format: "FREQUENCY",
  },
  needsHasPermanentHousing: {
    questionNumber: 7,
    format: "FREQUENCY",
  },
  needsSpecialEducation: {
    questionNumber: 8,
    format: "FREQUENCY",
  },
  needsReadingDifficulty: {
    questionNumber: 9,
    format: "FREQUENCY",
  },
  needsCalculatingChange: {
    questionNumber: 10,
    format: "FREQUENCY",
  },
  needsMedicalPaymentHardship: {
    questionNumber: 11,
    format: "FREQUENCY",
  },

  // Page 2 of the paper form

  alcoholDrugsDaysOfUse: {
    questionNumber: 12,
    format: "DAYS_PER_WEEK_RADIO",
  },
  alcoholDrugsMoreThan5Drinks: {
    questionNumber: 13,
    format: "DAYS_PER_WEEK_ENTRY",
  },
  alcoholDrugsTimeOfOffense: {
    questionNumber: 14,
    format: "SOBRIETY",
  },
  alcoholDrugsArguments: {
    questionNumber: 15,
    format: "FREQUENCY",
  },
  alcoholDrugsHungOver: {
    questionNumber: 16,
    format: "FREQUENCY",
  },
  alcoholDrugsTrouble: {
    questionNumber: 17,
    format: "FREQUENCY",
  },
  alcoholDrugsStopping: {
    questionNumber: 18,
    format: "FREQUENCY",
  },

  // Page 3 of the paper form

  childhoodSkippingSchool: {
    questionNumber: 19,
    format: "YES_NO",
  },
  childhoodRunningAway: {
    questionNumber: 20,
    format: "YES_NO",
  },
  childhoodFighting: {
    questionNumber: 21,
    format: "YES_NO",
  },
  childhoodHavingWeapons: {
    questionNumber: 22,
    format: "YES_NO",
  },
  childhoodForcingSexualActivities: {
    questionNumber: 23,
    format: "YES_NO",
  },
  childhoodHurtingAnimalsOrPeople: {
    questionNumber: 24,
    format: "YES_NO",
  },
  childhoodTearingProperty: {
    questionNumber: 25,
    format: "YES_NO",
  },
  childhoodStartingFires: {
    questionNumber: 26,
    format: "YES_NO",
  },
  childhoodLying: {
    questionNumber: 27,
    format: "YES_NO",
  },
  childhoodStealing: {
    questionNumber: 28,
    format: "YES_NO",
  },

  familyLawTrouble: {
    questionNumber: 29,
    format: "FREQUENCY",
  },
  familyFights: {
    questionNumber: 30,
    format: "FREQUENCY",
  },
  familyProblemSolving: {
    questionNumber: 31,
    format: "FREQUENCY",
  },
  familyPunished: {
    questionNumber: 32,
    format: "FREQUENCY",
  },
  familyNoRules: {
    questionNumber: 33,
    format: "FREQUENCY",
  },
  familyAnythingGoes: {
    questionNumber: 34,
    format: "FREQUENCY",
  },

  // Page 4 of the paper form

  familyHappy: {
    questionNumber: 35,
    format: "FREQUENCY",
  },
  familyUnderstands: {
    questionNumber: 36,
    format: "FREQUENCY",
  },

  behaviorCantStop: {
    questionNumber: 37,
    format: "FREQUENCY",
  },
  behaviorImpulsive: {
    questionNumber: 38,
    format: "FREQUENCY",
  },
  behaviorTryGetInTrouble: {
    questionNumber: 39,
    format: "FREQUENCY",
  },
  behaviorAngry: {
    questionNumber: 40,
    format: "FREQUENCY",
  },
  behaviorStayOutOfTrouble: {
    questionNumber: 41,
    format: "FREQUENCY",
  },
  behaviorThinkBeforeActing: {
    questionNumber: 42,
    format: "FREQUENCY",
  },
  behaviorLoseTemper: {
    questionNumber: 43,
    format: "FREQUENCY",
  },
  behaviorApologize: {
    questionNumber: 44,
    format: "FREQUENCY",
  },
  behaviorBlurt: {
    questionNumber: 45,
    format: "FREQUENCY",
  },

  // Page 5 of the paper form

  behaviorWorldOwesBetter: {
    questionNumber: 46,
    format: "FREQUENCY",
  },
  behaviorGetEven: {
    questionNumber: 47,
    format: "FREQUENCY",
  },
  behaviorBadLuck: {
    questionNumber: 48,
    format: "FREQUENCY",
  },
  behaviorAffectOthers: {
    questionNumber: 49,
    format: "FREQUENCY",
  },
  behaviorControlSpeech: {
    questionNumber: 50,
    format: "FREQUENCY",
  },
  behaviorNotPlanned: {
    questionNumber: 51,
    format: "FREQUENCY",
  },
  behaviorLawbreaking: {
    questionNumber: 52,
    format: "FREQUENCY",
  },

  // Page 6 of the paper form
  friendsJusticeInvolved: {
    questionNumber: 53,
    format: "RATIO",
  },
  friendsGangMembers: {
    questionNumber: 54,
    format: "RATIO",
  },
  friendsCommittedCrime: {
    questionNumber: 55,
    format: "RATIO",
  },
  friendsDrugs: {
    questionNumber: 56,
    format: "RATIO",
  },
  friendsOrganizations: {
    questionNumber: 57,
    format: "RATIO",
  },
  friendsClose: {
    questionNumber: 58,
    format: "RATIO",
  },

  // Life Areas / Self-Assessment Survey (part 2 of the paper form)

  lifeAreaBehavior: {
    questionNumber: 59,
    format: "LIFE_AREA",
  },
  lifeAreaEmployability: {
    questionNumber: 60,
    format: "LIFE_AREA",
  },
  lifeAreaAlcoholDrugs: {
    questionNumber: 61,
    format: "LIFE_AREA",
  },
  lifeAreaEducation: {
    questionNumber: 62,
    format: "LIFE_AREA",
  },
  lifeAreaEmployment: {
    questionNumber: 63,
    format: "LIFE_AREA",
  },
  lifeAreaFamilyFriends: {
    questionNumber: 64,
    format: "LIFE_AREA",
  },
  lifeAreaLifeSkills: {
    questionNumber: 65,
    format: "LIFE_AREA",
  },
  lifeAreaPhysicalMedical: {
    questionNumber: 66,
    format: "LIFE_AREA",
  },
  lifeAreaMentalHealth: {
    questionNumber: 67,
    format: "LIFE_AREA",
  },
  lifeAreaFinancial: {
    questionNumber: 68,
    format: "LIFE_AREA",
  },
  lifeAreaHousing: {
    questionNumber: 69,
    format: "LIFE_AREA",
  },
  lifeAreaTransportation: {
    questionNumber: 70,
    format: "LIFE_AREA",
  },
  lifeAreaLegalStatus: {
    questionNumber: 71,
    format: "LIFE_AREA",
  },
  lifeAreaCustom: {
    questionNumber: 72,
    format: "LIFE_AREA",
  },
};
