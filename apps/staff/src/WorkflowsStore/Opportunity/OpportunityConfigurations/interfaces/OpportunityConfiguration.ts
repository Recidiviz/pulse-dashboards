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

import { OpportunityType } from "~datatypes";

import { SystemId } from "../../../../core/models/types";
import { FeatureVariant, TenantId } from "../../../../RootStore/types";
import {
  DenialReasonsMap,
  Opportunity,
  OpportunityNotification,
  OpportunityPriority,
  OpportunityRequirement,
  OpportunityTab,
  OpportunityTabGroups,
} from "../../types";
import { SnoozeConfiguration } from "../modules/SnoozeConfiguration/interfaces/ISnoozeConfiguration";
import { CriteriaCopy, SortParam } from "./shared";
export interface OpportunityConfiguration {
  systemType: SystemId;
  stateCode: TenantId;
  urlSection: string;
  priority: OpportunityPriority;
  featureVariant?: FeatureVariant;
  inverseFeatureVariant?: FeatureVariant;
  label: string;
  firestoreCollection: string;
  snooze?: SnoozeConfiguration;
  tabGroups: Readonly<Partial<OpportunityTabGroups>>;
  initialHeader?: string;
  callToAction?: string;
  subheading?: string;
  eligibilityTextForCount: (count: number) => string;
  denialButtonText?: string;
  eligibilityDateText?: string;
  eligibilityDateTextForTab: (tab: OpportunityTab) => string | undefined;
  hideDenialRevert?: boolean;
  isEnabled: boolean;
  methodologyUrl: string;
  denialReasons: DenialReasonsMap;
  sidebarComponents: string[];
  isAlert?: boolean;
  notifications?: OpportunityNotification[];
  tooltipEligibilityText?: string;
  omsCriteriaHeader: string;
  eligibleCriteriaCopy: CriteriaCopy;
  ineligibleCriteriaCopy: CriteriaCopy;
  compareBy: SortParam[] | undefined;
  nonOmsCriteriaHeader: string;
  nonOmsCriteria: OpportunityRequirement[];
  homepagePosition: number;
  countByFunction?: (opportunities: Opportunity[]) => number;
  deniedTabTitle: OpportunityTab;
  denialAdjective: string;
  denialNoun: string;
  submittedTabTitle: OpportunityTab;
  emptyTabCopy: Partial<Record<OpportunityTab, string>>;
  tabPrefaceCopy: Partial<Record<OpportunityTab, string>>;
  supportsDenial: boolean;
  supportsAlmostEligible: boolean;
  supportsSubmitted: boolean;
  highlightCasesOnHomepage: boolean;
  highlightedCaseCtaCopy: string;
  subcategoryHeadings?: Record<string, string>;
  zeroGrantsTooltip?: string;
  linkedOverdueOpportunityType?: OpportunityType;
  overdueOpportunityCalloutCopy: string;

  // Map tabs to lists of the subcategories within that tab
  subcategoryOrderings?: Partial<Record<OpportunityTab, string[]>>;

  // Map tabs to lists of the subcategories of Submitted that we are allowed to
  // transition to from that tab. If not present, we show one Mark Submitted button
  markSubmittedOptionsByTab?: Partial<Record<OpportunityTab, string[]>>;

  // List of opportunity types to snooze concurrently when the primary opportunity is snoozed
  snoozeCompanionOpportunityTypes?: OpportunityType[];

  // An optional sorted array of strings that will determine the order of case notes on the client side panel
  caseNoteHeaders: string[];

  caseNotesTitle?: string;

  /**
   * Used to enable the progressive loading feature within Table View to display an initial
   * batch size of rows with a button that allows the user to load more batches of rows.
   * Starts with a default of 30 rows, but can be overridden by the opportunity.
   *
   * NOTE: If an opportunity uses subcategories, each subcategory renders its own table and progressive loading
   * instance, meaning each subcategory will have its own "Load more" button and the batch size will be applied
   * to each subcategory's table.
   *
   * TODO(#8663): Discuss with product how to best handle progressive loading for opportunities with subcategories
   * and implement accordingly.
   */
  enableProgressiveLoading: boolean;
  progressiveLoadingBatchSize: number;
}
