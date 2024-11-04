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
import { generateTabs } from "../../utils/tabUtils";
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
    private configurationObject: IApiOpportunityConfiguration,
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
  get hideDenialRevert() {
    return this.configurationObject.hideDenialRevert;
  }

  get tabGroups() {
    const tabs = this.configurationObject.tabGroups as OpportunityTabGroups;
    if (tabs) return tabs;
    return {
      "ELIGIBILITY STATUS": generateTabs(this),
    } as OpportunityTabGroups;
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

  get nonOMSCriteria(): OpportunityRequirement[] {
    return [];
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
    return this.isAlert ? "Overridden" : "Marked Ineligible";
  }

  get denialAdjective(): string {
    return this.isAlert ? "Overridden" : "Ineligible";
  }

  get denialNoun(): string {
    return this.isAlert ? "Override Status" : "Ineligibility";
  }

  get submittedTabTitle(): OpportunityTab {
    switch (this.stateCode) {
      case "US_MI":
        return "Pending";
      default:
        return "Submitted";
    }
  }

  get omsCriteriaHeader(): string {
    switch (this.stateCode) {
      case "US_ME":
        return "Validated by data from CORIS";
      case "US_MI":
        return "Validated by data from COMS";
      default:
        return "Requirements validated by OMS data";
    }
  }

  get nonOMSCriteriaHeader() {
    switch (this.stateCode) {
      // Setting header for ME/MI explicitly in case we want to change the default
      case "US_ME":
      case "US_MI":
        return "Requirements to check";
      default:
        return "Requirements to check";
    }
  }

  get emptyTabCopy() {
    return {};
  }

  get supportsDenial() {
    return Object.keys(this.denialReasons).length > 0;
  }

  get supportsAlmostEligible() {
    return !!this.ineligibleCriteriaCopy;
  }

  get highlightCasesOnHomepage() {
    return false;
  }
}
