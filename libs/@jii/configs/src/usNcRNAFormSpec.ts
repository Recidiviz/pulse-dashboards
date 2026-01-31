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

export const allRNAQuestions: RNAQuestionId[] = fullRNASpec.flatMap(
  (pageSpec) => pageSpec.questions,
);

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
  format: RNAQuestionFormat;
  optional?: boolean;
};

export const rnaQuestionConfig = {
  // Page 1 of the paper form

  needsWorkSchoolSatisfied: {
    format: "FREQUENCY",
  },
  needsHasJobSkills: {
    format: "FREQUENCY",
  },
  needsImproveJobSchool: {
    format: "FREQUENCY",
  },
  needsRanOutOfMoney: {
    format: "FREQUENCY",
  },
  needsStruggledWithBills: {
    format: "FREQUENCY",
  },
  needsReliedOnOthersForMoney: {
    format: "FREQUENCY",
  },
  needsHasPermanentHousing: {
    format: "FREQUENCY",
  },
  needsSpecialEducation: {
    format: "FREQUENCY",
  },
  needsReadingDifficulty: {
    format: "FREQUENCY",
  },
  needsCalculatingChange: {
    format: "FREQUENCY",
  },
  needsMedicalPaymentHardship: {
    format: "FREQUENCY",
  },

  // Page 2 of the paper form

  alcoholDrugsDaysOfUse: {
    format: "DAYS_PER_WEEK_RADIO",
  },
  alcoholDrugsMoreThan5Drinks: {
    format: "DAYS_PER_WEEK_ENTRY",
  },
  alcoholDrugsTimeOfOffense: {
    format: "SOBRIETY",
  },
  alcoholDrugsArguments: {
    format: "FREQUENCY",
  },
  alcoholDrugsHungOver: {
    format: "FREQUENCY",
  },
  alcoholDrugsTrouble: {
    format: "FREQUENCY",
  },
  alcoholDrugsStopping: {
    format: "FREQUENCY",
  },

  // Page 3 of the paper form

  childhoodSkippingSchool: {
    format: "YES_NO",
  },
  childhoodRunningAway: {
    format: "YES_NO",
  },
  childhoodFighting: {
    format: "YES_NO",
  },
  childhoodHavingWeapons: {
    format: "YES_NO",
  },
  childhoodForcingSexualActivities: {
    format: "YES_NO",
  },
  childhoodHurtingAnimalsOrPeople: {
    format: "YES_NO",
  },
  childhoodTearingProperty: {
    format: "YES_NO",
  },
  childhoodStartingFires: {
    format: "YES_NO",
  },
  childhoodLying: {
    format: "YES_NO",
  },
  childhoodStealing: {
    format: "YES_NO",
  },

  familyLawTrouble: {
    format: "FREQUENCY",
  },
  familyFights: {
    format: "FREQUENCY",
  },
  familyProblemSolving: {
    format: "FREQUENCY",
  },
  familyPunished: {
    format: "FREQUENCY",
  },
  familyNoRules: {
    format: "FREQUENCY",
  },
  familyAnythingGoes: {
    format: "FREQUENCY",
  },

  // Page 4 of the paper form

  familyHappy: {
    format: "FREQUENCY",
  },
  familyUnderstands: {
    format: "FREQUENCY",
  },

  behaviorCantStop: {
    format: "FREQUENCY",
  },
  behaviorImpulsive: {
    format: "FREQUENCY",
  },
  behaviorTryGetInTrouble: {
    format: "FREQUENCY",
  },
  behaviorAngry: {
    format: "FREQUENCY",
  },
  behaviorStayOutOfTrouble: {
    format: "FREQUENCY",
  },
  behaviorThinkBeforeActing: {
    format: "FREQUENCY",
  },
  behaviorLoseTemper: {
    format: "FREQUENCY",
  },
  behaviorApologize: {
    format: "FREQUENCY",
  },
  behaviorBlurt: {
    format: "FREQUENCY",
  },

  // Page 5 of the paper form

  behaviorWorldOwesBetter: {
    format: "FREQUENCY",
  },
  behaviorGetEven: {
    format: "FREQUENCY",
  },
  behaviorBadLuck: {
    format: "FREQUENCY",
  },
  behaviorAffectOthers: {
    format: "FREQUENCY",
  },
  behaviorControlSpeech: {
    format: "FREQUENCY",
  },
  behaviorNotPlanned: {
    format: "FREQUENCY",
  },
  behaviorLawbreaking: {
    format: "FREQUENCY",
  },

  // Page 6 of the paper form
  friendsJusticeInvolved: {
    format: "RATIO",
  },
  friendsGangMembers: {
    format: "RATIO",
  },
  friendsCommittedCrime: {
    format: "RATIO",
  },
  friendsDrugs: {
    format: "RATIO",
  },
  friendsOrganizations: {
    format: "RATIO",
  },
  friendsClose: {
    format: "RATIO",
  },

  // Life Areas / Self-Assessment Survey (part 2 of the paper form)

  lifeAreaBehavior: {
    format: "LIFE_AREA",
  },
  lifeAreaEmployability: {
    format: "LIFE_AREA",
  },
  lifeAreaAlcoholDrugs: {
    format: "LIFE_AREA",
  },
  lifeAreaEducation: {
    format: "LIFE_AREA",
  },
  lifeAreaEmployment: {
    format: "LIFE_AREA",
  },
  lifeAreaFamilyFriends: {
    format: "LIFE_AREA",
  },
  lifeAreaLifeSkills: {
    format: "LIFE_AREA",
  },
  lifeAreaPhysicalMedical: {
    format: "LIFE_AREA",
  },
  lifeAreaMentalHealth: {
    format: "LIFE_AREA",
  },
  lifeAreaFinancial: {
    format: "LIFE_AREA",
  },
  lifeAreaHousing: {
    format: "LIFE_AREA",
  },
  lifeAreaTransportation: {
    format: "LIFE_AREA",
  },
  lifeAreaLegalStatus: {
    format: "LIFE_AREA",
  },
  lifeAreaCustom: {
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
