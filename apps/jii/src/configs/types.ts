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

import {
  EligibilityReport,
  EligibilityStatus,
} from "../models/EligibilityReport/types";
import { residentOpportunitySchemas } from "./residentsOpportunitySchemas";
import { stateCodes } from "./stateConstants";

export type ProfileField = {
  label: string;
  value: string;
  moreInfo?: string;
};

export type RequirementCopy = { criterion: string; ineligibleReason?: string };

export type SummaryContent = {
  heading: string;
  body: string;
};

type FullPageConfig = {
  linkText: string;
  urlSlug: string;
  heading: string;
  body: string;
};

type EligibilityPageSection = {
  /**
   * Short version that appears on the main eligibility page
   */
  summary: SummaryContent;
  /**
   * Long version that is linked to from the main eligibility page
   */
  fullPage: FullPageConfig;
  /**
   * Sections are always shown by default; set true to suppress for ineligible people
   */
  hideWhenIneligible?: boolean;
};

export type OpportunityConfig = {
  urlSlug: string;
  firestoreCollection: string;
  name: string;
  description: string;
  /**
   * Required section that has a specific format
   */
  requirements: {
    summary: {
      heading: string;
      trackedCriteria: Record<string, RequirementCopy>;
      untrackedCriteria: Array<RequirementCopy>;
      /**
       * Template strings are supported here
       */
      highlights: Array<{ label: string; value: string }>;
    };
    fullPage?: FullPageConfig;
  };
  /**
   * Optional copy-only sections that will appear below requirements
   */
  sections: Array<EligibilityPageSection>;
  /**
   * Could be an abbreviation or other identifier that may be inserted
   * into menus and headings to refer to this opportunity generically
   */
  shortName: string;

  statusLabels: Record<EligibilityStatus, string>;
};

export type IncarcerationOpportunityId = "usMeSCCP" | "usMeWorkRelease";

export type ResidentsConfig = {
  headerProfileFields: Array<ProfileField>;
  incarcerationOpportunities: Partial<
    Record<IncarcerationOpportunityId, OpportunityConfig>
  >;
  home: {
    progress: {
      title: string;
    };
    eligibility: {
      title: string;
    };
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
    ...args: [ResidentRecord, OpportunityConfig, OpportunityRecord<Id>]
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
