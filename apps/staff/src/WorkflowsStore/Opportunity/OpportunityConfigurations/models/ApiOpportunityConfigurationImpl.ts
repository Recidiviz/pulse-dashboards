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

import assertNever from "assert-never";
import { add, nextDay } from "date-fns";
import simplur from "simplur";

import { OpportunityType } from "~datatypes";

import {
  allFeatureVariants,
  FeatureVariant,
} from "../../../../RootStore/types";
import UserStore from "../../../../RootStore/UserStore";
import {
  OpportunityRequirement,
  OpportunityTab,
  OpportunityTabGroups,
} from "../../types";
import { IApiOpportunityConfiguration } from "../interfaces";
import { OpportunityConfiguration } from "../interfaces/OpportunityConfiguration";

export function formatEligibilityText(dynamicText: string, count: number) {
  return simplur(
    ["", " " + dynamicText],
    [count, (c: number) => (c === 0 ? "Some" : c)],
  );
}

const WEEKDAYS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
] as const;

export function hydrateSnooze(
  snooze: IApiOpportunityConfiguration["snooze"],
): OpportunityConfiguration["snooze"] {
  if (snooze && snooze.autoSnoozeParams) {
    const { type, params } = snooze.autoSnoozeParams;
    return {
      autoSnoozeParams: (snoozedOn: Date) => {
        switch (type) {
          case "snoozeDays":
            return add(snoozedOn, {
              days: params.days,
            });
          case "snoozeUntil":
            return nextDay(snoozedOn, WEEKDAYS.indexOf(params.weekday) as Day);
          default:
            assertNever(type);
        }
      },
    };
  } else {
    return snooze;
  }
}

export class ApiOpportunityConfiguration implements OpportunityConfiguration {
  constructor(
    protected configurationObject: IApiOpportunityConfiguration,
    private userStore: UserStore,
  ) {}

  get systemType() {
    return this.configurationObject.systemType;
  }
  get stateCode() {
    return this.configurationObject.stateCode;
  }
  get urlSection() {
    return this.configurationObject.urlSection;
  }
  get featureVariant() {
    const { featureVariant } = this.configurationObject;
    if (featureVariant && featureVariant in allFeatureVariants) {
      return featureVariant as FeatureVariant;
    }
    return undefined;
  }
  get inverseFeatureVariant() {
    const { inverseFeatureVariant } = this.configurationObject;
    if (inverseFeatureVariant && inverseFeatureVariant in allFeatureVariants) {
      return inverseFeatureVariant as FeatureVariant;
    }
    return undefined;
  }
  get label() {
    return this.configurationObject.displayName;
  }
  get firestoreCollection() {
    return this.configurationObject.firestoreCollection;
  }
  get snooze() {
    return hydrateSnooze(this.configurationObject.snooze);
  }

  get priority() {
    return this.configurationObject.priority;
  }

  get initialHeader() {
    return this.configurationObject.initialHeader;
  }
  get callToAction() {
    return this.configurationObject.callToAction;
  }
  get subheading() {
    return this.configurationObject.subheading;
  }
  get notifications() {
    return this.configurationObject.notifications;
  }

  eligibilityTextForCount = (count: number) =>
    formatEligibilityText(
      this.configurationObject.dynamicEligibilityText,
      count,
    );

  get denialButtonText() {
    return this.configurationObject.denialText;
  }

  get eligibilityDateText() {
    return this.configurationObject.eligibilityDateText;
  }
  eligibilityDateTextForTab(tab?: OpportunityTab): string | undefined {
    return this.eligibilityDateText;
  }

  get hideDenialRevert() {
    return this.configurationObject.hideDenialRevert;
  }

  get tabGroups() {
    const tabs = this.configurationObject.tabGroups as OpportunityTabGroups;
    if (tabs) return tabs;
    return {
      "ELIGIBILITY STATUS": this.defaultEligibilityStatusTabs(),
    };
  }

  protected defaultEligibilityStatusTabs(): ReadonlyArray<OpportunityTab> {
    const almostEligibleTabTitle: OpportunityTab = "Almost Eligible";

    return [
      "Eligible Now",
      ...(this.supportsAlmostEligible ? [almostEligibleTabTitle] : []),
      ...(this.supportsSubmitted ? [this.submittedTabTitle] : []),
      ...(this.supportsDenial ? [this.deniedTabTitle] : []),
    ];
  }

  get methodologyUrl() {
    return this.configurationObject.methodologyUrl;
  }

  get denialReasons() {
    return this.configurationObject.denialReasons;
  }

  get sidebarComponents() {
    return this.configurationObject.sidebarComponents;
  }

  get isAlert() {
    return this.configurationObject.isAlert;
  }

  get tooltipEligibilityText() {
    return this.configurationObject.tooltipEligibilityText;
  }

  get eligibleCriteriaCopy() {
    return this.configurationObject.eligibleCriteriaCopy;
  }

  get ineligibleCriteriaCopy() {
    return this.configurationObject.ineligibleCriteriaCopy;
  }

  get nonOmsCriteria(): OpportunityRequirement[] {
    return this.configurationObject.nonOmsCriteria;
  }

  get compareBy() {
    return this.configurationObject.compareBy;
  }

  get homepagePosition() {
    return this.configurationObject.homepagePosition;
  }

  get isEnabled(): boolean {
    const { activeFeatureVariants } = this.userStore;
    const { featureVariant, inverseFeatureVariant } = this;

    const featureVariantEnabled =
      !featureVariant || !!activeFeatureVariants[featureVariant];
    const inverseFeatureVariantDisabled =
      !!inverseFeatureVariant && !!activeFeatureVariants[inverseFeatureVariant];

    return featureVariantEnabled && !inverseFeatureVariantDisabled;
  }

  get deniedTabTitle(): OpportunityTab {
    if (this.configurationObject.deniedTabTitle)
      return this.configurationObject.deniedTabTitle as OpportunityTab;

    return this.isAlert ? "Overridden" : "Marked Ineligible";
  }

  get denialAdjective(): string {
    return (
      this.configurationObject.denialAdjective ??
      (this.isAlert ? "Overridden" : "Ineligible")
    );
  }

  get denialNoun(): string {
    return this.configurationObject.denialNoun ?? this.isAlert
      ? "Override Status"
      : "Ineligibility";
  }

  get submittedTabTitle(): OpportunityTab {
    return (this.configurationObject.submittedTabTitle ??
      "Pending") as OpportunityTab;
  }

  get omsCriteriaHeader(): string {
    if (this.configurationObject.omsCriteriaHeader)
      return this.configurationObject.omsCriteriaHeader;

    switch (this.stateCode) {
      case "US_ME":
        return "Validated by data from CORIS";
      case "US_MI":
        return "Validated by data from COMS";
      default:
        return "Requirements validated by OMS data";
    }
  }

  get nonOmsCriteriaHeader() {
    return (
      this.configurationObject.nonOmsCriteriaHeader ?? "Requirements to check"
    );
  }

  get emptyTabCopy() {
    return this.configurationObject.emptyTabCopy;
  }

  get tabPrefaceCopy() {
    return this.configurationObject.tabPrefaceCopy;
  }

  get supportsDenial() {
    return Object.keys(this.denialReasons).length > 0;
  }

  get supportsAlmostEligible() {
    return Object.keys(this.ineligibleCriteriaCopy).length > 0;
  }

  get supportsSubmitted() {
    return this.configurationObject.supportsSubmitted;
  }

  get highlightCasesOnHomepage() {
    return this.configurationObject.highlightCasesOnHomepage;
  }

  get overdueOpportunityCalloutCopy() {
    return this.configurationObject.overdueOpportunityCalloutCopy ?? "overdue";
  }

  get highlightedCaseCtaCopy(): string {
    if (this.configurationObject.highlightedCaseCtaCopy)
      return this.configurationObject.highlightedCaseCtaCopy;
    // note: this error only triggers if highlightCasesOnHomepage is true but
    // highlightedCaseCtaCopy is not set, as it is not requested otherwise
    throw new Error(`Implement highlightedCaseCtaCopy() for ${this.label}`);
  }

  // TODO(#6450): Stop coalescing once the recidiviz-data config change deploys
  get zeroGrantsTooltip() {
    return (
      this.configurationObject.zeroGrantsTooltip ??
      "This officer has not granted any clients this opportunity in the past 12 months."
    );
  }

  get subcategoryHeadings() {
    return this.configurationObject.subcategoryHeadings;
  }

  get subcategoryOrderings() {
    return this.configurationObject.subcategoryOrderings;
  }

  get markSubmittedOptionsByTab() {
    return this.configurationObject.markSubmittedOptionsByTab;
  }

  get snoozeCompanionOpportunityTypes(): OpportunityType[] {
    // TODO(#8022): Once this configuration is available via the admin panel, it should be appear here
    return (this.configurationObject.snoozeCompanionOpportunityTypes ??
      []) as OpportunityType[];
  }

  get caseNoteHeaders(): string[] {
    return (this.configurationObject.caseNoteHeaders ?? []) as string[];
  }

  get caseNotesTitle() {
    return this.configurationObject.caseNotesTitle ?? "Relevant Contact Notes";
  }

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
  enableProgressiveLoading = false;
  progressiveLoadingBatchSize = 30;
}
