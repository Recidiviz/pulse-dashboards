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

import { z } from "zod";

import { residentOpportunitySchemas } from "./residentsOpportunitySchemas";
import { stateCodes } from "./stateConstants";

export type OpportunityConfig = {
  firestoreCollection: string;
};

export const incarcerationOpportunityIdEnum = z.enum([
  "usMeSCCP",
  "usMeWorkRelease",
]);

export type IncarcerationOpportunityId = z.infer<
  typeof incarcerationOpportunityIdEnum
>;

export type TranslationConfig = {
  additionalLanguages: Array<string>;
};

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
  eligibility?: EligibilityModuleConfig;
  egt?: EarnedGoodTimeConfig;
  translation: TranslationConfig;
  limitDistrictSearchOptions?: boolean;
};

export type EligibilityModuleConfig = {
  incarcerationOpportunities: Partial<
    Record<IncarcerationOpportunityId, OpportunityConfig>
  >;
  // this is an array to support later expansion, but for now we don't support
  // there being more than one of these pages in the implementation
};

export type EarnedGoodTimeConfig = {
  monthlyEarnedTimeLimit?: number;
};

export type StateCode = z.infer<typeof stateCodes>;

export type ResidentOpportunitySchemaMapping =
  typeof residentOpportunitySchemas;

/**
 * Maps opportunity ID to its successfully parsed record format
 */
export type OpportunityRecord<O extends IncarcerationOpportunityId> = z.infer<
  ResidentOpportunitySchemaMapping[O]
>;

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
