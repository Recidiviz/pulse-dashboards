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

import simplur from "simplur";

import {
  allFeatureVariants,
  FeatureVariant,
} from "../../../../RootStore/types";
import { WorkflowsStore } from "../../../WorkflowsStore";
import { OpportunityTabGroups } from "../../types";
import { generateTabs } from "../../utils/tabUtils";
import { IApiOpportunityConfiguration } from "../interfaces";
import { OpportunityConfiguration } from "../interfaces/OpportunityConfiguration";

export function formatEligibilityText(dynamicText: string, count: number) {
  return simplur(
    ["", " " + dynamicText],
    [count, (c: number) => (c === 0 ? "Some" : c)],
  );
}

export class ApiOpportunityConfiguration implements OpportunityConfiguration {
  configurationObject: IApiOpportunityConfiguration;
  workflowsStore: WorkflowsStore;

  constructor(
    configurationObject: IApiOpportunityConfiguration,
    workflowsStore: WorkflowsStore,
  ) {
    this.configurationObject = configurationObject;
    this.workflowsStore = workflowsStore;
  }

  get systemType() {
    return "INCARCERATION" as const; // TODO FIX
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
    return undefined;
  }
  get label() {
    return this.configurationObject.displayName;
  }
  get firestoreCollection() {
    return this.configurationObject.firestoreCollection;
  }
  get snooze() {
    return this.configurationObject.snooze;
  }

  get initialHeader() {
    return "INITIAL HEADER";
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
    return undefined;
  }
  get eligibilityDateText() {
    return "ELIGIBILITY DATE TEXT";
  }
  get hideDenialRevert() {
    return false;
  }

  get tabGroups() {
    const tabs = this.configurationObject.tabGroups as OpportunityTabGroups;
    if (tabs) return tabs;
    return {
      "ELIGIBILITY STATUS": generateTabs({ isAlert: this.isAlert }),
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
    return undefined;
  }

  get tooltipEligibilityText() {
    return undefined;
  }

  get eligibleCriteriaCopy() {
    return this.configurationObject.eligibleCriteriaCopy;
  }

  get ineligibleCriteriaCopy() {
    return this.configurationObject.ineligibleCriteriaCopy;
  }

  get compareBy() {
    return this.configurationObject.compareBy;
  }

  get isEnabled(): boolean {
    const { featureVariants } = this.workflowsStore;
    const { featureVariant, inverseFeatureVariant } = this;
    if (!featureVariant) return true;

    const featureVariantEnabled = !!featureVariants[featureVariant];
    const inverseFeatureVariantDisabled = inverseFeatureVariant
      ? !featureVariants[inverseFeatureVariant]
      : true;

    return featureVariantEnabled && inverseFeatureVariantDisabled;
  }
}
