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

/**
 * Configuration and types relating to the RNA (Risks and Needs Assessment) survey
 * for North Carolina.
 *
 * This file should only contain internal identifiers, not copy. All copy should be
 * in the @jii/US_NC library.
 */

// The RNA form is a sequence of pages. Each page has a section header and some questions.

export type RNAPageId =
  | "sectionBasicNeeds"
  | "sectionAlcoholDrugs"
  | "sectionChildhoodTrouble"
  | "sectionFamilyGrowingUp"
  | "sectionFamilyNow"
  | "sectionBehavior"
  | "sectionBehavior2"
  | "sectionFriends"
  | "sectionLifeAreas";

type RNAPageSpec = {
  id: RNAPageId;
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

// RNA questions have different formats. These correspond to different answer types,
// which are stored in the database differently.

const rnaRadioQuestionFormats = [
  "FREQUENCY",
  "DAYS_PER_WEEK_RADIO",
  "YES_NO",
  "RATIO",
] as const;
export type RNARadioQuestionFormat = (typeof rnaRadioQuestionFormats)[number];
const isRNARadioFormat = (s: string): s is RNARadioQuestionFormat =>
  rnaRadioQuestionFormats.includes(s as RNARadioQuestionFormat);

type RNAQuestionFormat =
  | RNARadioQuestionFormat
  | "SOBRIETY"
  | "DAYS_PER_WEEK_ENTRY"
  | "LIFE_AREA";

export type RNAQuestionId = keyof typeof rnaQuestionConfig;

export type RNAQuestionConfig = {
  questionNumber: number; // TODO: remove this and just count questions as they appear
  format: RNAQuestionFormat;
  optional?: boolean;
};

export const rnaQuestionConfig = {
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
    optional: true,
  },
} satisfies Record<string, RNAQuestionConfig>;

export const rnaTextQuestionConfig = Object.fromEntries(
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  Object.entries(rnaQuestionConfig).filter(([_, config]) => {
    return (
      isRNARadioFormat(config.format) || config.format === "DAYS_PER_WEEK_ENTRY"
    );
  }),
);

export const rnaCheckboxQuestionConfig = Object.fromEntries(
  Object.entries(rnaQuestionConfig).filter(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    ([_, config]) => config.format === "SOBRIETY",
  ),
);

export const rnaLifeAreaQuestionConfig = Object.fromEntries(
  Object.entries(rnaQuestionConfig).filter(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    ([_, config]) => config.format === "LIFE_AREA",
  ),
);
