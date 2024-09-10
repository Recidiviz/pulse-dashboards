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

import { ParsedRecord, ResidentRecord } from "~datatypes";

import { EligibilityReport } from "../models/EligibilityReport/interface";
import { residentOpportunitySchemas } from "./residentsOpportunitySchemas";
import { stateCodes } from "./stateConstants";

export type ProfileField = {
  label: string;
  value: string;
  moreInfo?: string;
};

export type RequirementCopy = { criterion: string; ineligibleReason?: string };

export type OpportunityConfig = {
  urlSection: string;
  firestoreCollection: string;
  htmlTitle: string;
  copy: {
    headline: string;
    subheading: string;
    about: {
      title: string;
      body: string;
      linkText: string;
      fullPage: string;
      fullPageHtmlTitle: string;
    };
    requirements: {
      title: string;
      trackedCriteria: Record<string, RequirementCopy>;
      untrackedCriteria: Array<RequirementCopy>;
      staticRequirementsLabel: string;
      linkText: string;
      fullPage: string;
      fullPageHtmlTitle: string;
    };
    nextSteps: {
      title: string;
      body: string;
      linkText: string;
      fullPage: string;
      fullPageHtmlTitle: string;
    };
    menuLabel: string;
    formPreview: {
      title: string;
    };
  };
};

export type IncarcerationOpportunityId = "usMeSCCP";

export type ResidentsConfig = {
  headerProfileFields: Array<ProfileField>;
  incarcerationOpportunities: Partial<
    Record<IncarcerationOpportunityId, OpportunityConfig>
  >;
};

export type StateCode = z.infer<typeof stateCodes>;

export type ResidentOpportunitySchemaMapping =
  typeof residentOpportunitySchemas;

/**
 * Maps opportunity ID to its successfully parsed record format
 */
export type OpportunityRecord<O extends IncarcerationOpportunityId> =
  ParsedRecord<ResidentOpportunitySchemaMapping[O]>["output"];

/**
 * Mapping of opportunity IDs to their compatible EligibilityReport constructors
 */
export type ResidentEligibilityReportMapping = {
  [Id in IncarcerationOpportunityId]: new (
    ...args: [
      ResidentRecord["output"],
      OpportunityConfig,
      OpportunityRecord<Id> | undefined,
    ]
  ) => EligibilityReport;
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

export type StateLandingPageConfig = {
  copy: {
    intro: string;
    selectorLabel: string;
    selectorPlaceholder: string;
    useCases: {
      intro: string;
      examples: Array<{
        icon: string;
        description: string;
      }>;
    };
  };
  connections: {
    [key: string]: { displayName: string; connectionName: string };
  };
};
