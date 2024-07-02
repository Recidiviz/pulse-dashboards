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

import {
  add,
  nextFriday,
  nextMonday,
  nextSaturday,
  nextSunday,
  nextThursday,
  nextTuesday,
  nextWednesday,
} from "date-fns";

import UserStore from "../../../../RootStore/UserStore";
import { OpportunityTabGroups } from "../../types";
import { generateTabs } from "../../utils/tabUtils";
import { ILocalOpportunityConfiguration } from "../interfaces/LocalOpportunityConfiguration";
import { OpportunityConfiguration } from "../interfaces/OpportunityConfiguration";
import { formatEligibilityText } from "./ApiOpportunityConfigurationImpl";

export class LocalOpportunityConfiguration implements OpportunityConfiguration {
  constructor(
    private configurationObject: ILocalOpportunityConfiguration,
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
    return this.configurationObject.featureVariant;
  }
  get inverseFeatureVariant() {
    return this.configurationObject.inverseFeatureVariant;
  }
  get label() {
    return this.configurationObject.label;
  }
  get firestoreCollection() {
    return this.configurationObject.firestoreCollection;
  }
  get snooze() {
    const { snooze } = this.configurationObject;
    if (snooze && snooze.autoSnoozeParams) {
      const { autoSnoozeParams } = snooze;
      const repeatFn = {
        Monday: nextMonday,
        Tuesday: nextTuesday,
        Wednesday: nextWednesday,
        Thursday: nextThursday,
        Friday: nextFriday,
        Saturday: nextSaturday,
        Sunday: nextSunday,
      };

      return {
        autoSnoozeParams: (snoozedOn: Date) => {
          switch (autoSnoozeParams.type) {
            case "snoozeDays":
              return add(snoozedOn, { days: autoSnoozeParams.params.days });
            case "snoozeUntil":
              return repeatFn[autoSnoozeParams.params.weekday](snoozedOn);
          }
        },
      };
    } else {
      return snooze;
    }
  }
  get tabGroups() {
    const tabs = this.configurationObject.tabOrder;
    if (Array.isArray(tabs)) return { "ELIGIBILITY STATUS": tabs };
    else if (tabs && typeof tabs === "object")
      return tabs as OpportunityTabGroups;
    return {
      "ELIGIBILITY STATUS": generateTabs({ isAlert: this.isAlert }),
    } as OpportunityTabGroups;
  }

  get initialHeader() {
    return this.configurationObject.initialHeader;
  }
  get callToAction() {
    return this.configurationObject.callToAction;
  }
  eligibilityTextForCount = (count: number) =>
    formatEligibilityText(
      this.configurationObject.dynamicEligibilityText,
      count,
    );
  get denialButtonText() {
    return this.configurationObject.denialButtonText;
  }
  get eligibilityDateText() {
    return this.configurationObject.eligibilityDateText;
  }
  get hideDenialRevert() {
    return this.configurationObject.hideDenialRevert;
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
    return this.configurationObject.eligibleCriteriaCopy ?? {};
  }

  get ineligibleCriteriaCopy() {
    return this.configurationObject.ineligibleCriteriaCopy ?? {};
  }

  get compareBy() {
    return this.configurationObject.compareBy;
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
}
