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

import UserStore from "../../../../RootStore/UserStore";
import { OpportunityConfig } from "../../OpportunityConfigs";
import { Opportunity, OpportunityTabGroups } from "../../types";
import { generateTabs } from "../../utils/tabUtils";
import { OpportunityConfiguration } from "../interfaces/OpportunityConfiguration";
import {
  formatEligibilityText,
  hydrateSnooze,
} from "./ApiOpportunityConfigurationImpl";

export class LocalOpportunityConfiguration implements OpportunityConfiguration {
  constructor(
    private configurationObject: OpportunityConfig<Opportunity>,
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
    if (
      this.configurationObject.newPolicyCopyLabel &&
      this.userStore.activeFeatureVariants?.opportunityPolicyCopy
    ) {
      return this.configurationObject.newPolicyCopyLabel;
    }
    return this.configurationObject.label;
  }
  get firestoreCollection() {
    return this.configurationObject.firestoreCollection;
  }
  get snooze() {
    return hydrateSnooze(this.configurationObject.snooze);
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
    return this.configurationObject.denialButtonText;
  }
  get priority() {
    return this.configurationObject.priority ?? "NORMAL";
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

  get homepagePosition() {
    return this.configurationObject.homepagePosition;
  }

  get countByFunction() {
    return this.configurationObject.countByFunction;
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
