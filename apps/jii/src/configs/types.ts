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

import { ParsedRecord } from "~datatypes";

import { residentsConfigByState } from "./residentsConfig";
import { residentOpportunitySchemas } from "./residentsOpportunitySchemas";

type AboutSection = {
  heading: string;
  body: string;
};

export type OpportunityConfig = {
  urlSection: string;
  copy: {
    eligibilityHeadingPhrase: string;
    about: {
      sections: [AboutSection, ...AboutSection[]];
      linkText: string;
    };
    eligibility: {
      untrackedCriteria: Array<string>;
      linkText: string;
    };
    nextSteps: {
      body: string;
      linkText: string;
    };
  };
};

export type IncarcerationOpportunityId = "usMeSCCP";

export type ResidentsConfig = {
  incarcerationOpportunities: Partial<
    Record<IncarcerationOpportunityId, OpportunityConfig>
  >;
};

export type StateCode = keyof typeof residentsConfigByState;

export type ResidentOpportunitySchemaMapping =
  typeof residentOpportunitySchemas;

/**
 * Maps opportunity ID to its successfully parsed record format
 */
export type OpportunityRecord<O extends IncarcerationOpportunityId> =
  ParsedRecord<ResidentOpportunitySchemaMapping[O]>["output"];