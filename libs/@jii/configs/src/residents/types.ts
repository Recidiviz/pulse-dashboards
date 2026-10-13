// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2024 Recidiviz, Inc.
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

import { StateCode } from "../stateCodes";

export type TranslationConfig = {
  additionalLanguages: Array<string>;
};

// This type must stay in sync with the ResidentFlagId enum
// defined in the prisma schema.
type ResidentFlag =
  | "usNeGoodTimeAlerts"
  | "usNeChecklistDocuments"
  | "usAzClassification"
  // TODO OBT-31989 after usAzFslImprovements launch: remove this flag and all references in
  // libs/@jii/configs, libs/@jii/prisma, and libs/@jii/states/US_AZ
  | "usAzFslImprovements"
  | "usAzIonReferral"
  | "usCoV1Experience"
  | "usCoEdovoV1"
  | "usCoMrdOverride"
  | "usCoMrdOverrideFullState"
  | "usCoEdovoCredits"
  //TODO OBT-34689 remove after launch
  | "usArFslImprovements"
  | "usNcRNAAutoEnablement"
  | "usMaReentry"
  | "usMaSentenceDatesV1"
  | "usNeCheckInTool";

// this type must stay in sync with the UserFlagId enum
// defined in the prisma schema.
type UserFlag = "useNewResidentData" | "intercom";

export type ResidentsConfig = {
  home: {
    footer: {
      about: {
        title: string;
        body: string;
      };
      contact: {
        title: string;
        body: string;
      };
    };
  };
  egt?: EarnedGoodTimeConfig;
  translation: TranslationConfig;
  limitDistrictSearchOptions?: boolean;
  enabledResidentFlags?: Partial<Record<ResidentFlag, Date>>;
  enabledResidentFacilityFlags?: Record<
    string,
    Partial<Record<ResidentFlag, Date>>
  >;
  enabledUserFlags?: Partial<Record<UserFlag, Date>>;
};

export type EarnedGoodTimeConfig = {
  monthlyEarnedTimeLimit?: number;
};

export type StateConfig<Code extends StateCode = StateCode> = {
  stateCode: Code;
  displayName: string;
  urlSlug: string;
};

export type LandingPageConfig = {
  copy: {
    intro: string;
    selectorLabel: string;
    selectorPlaceholder: string;
  };
};
