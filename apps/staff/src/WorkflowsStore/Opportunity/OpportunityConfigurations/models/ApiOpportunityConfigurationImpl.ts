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
import { CountFormatter } from "../../utils";
import { IApiOpportunityConfiguration } from "../interfaces";
import { OpportunityConfiguration } from "../interfaces/LocalOpportunityConfiguration";

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
    return "SUPERVISION" as const; // TODO FIX
  }
  get stateCode() {
    return this.configurationObject.stateCode;
  }
  get urlSection() {
    return this.configurationObject.urlSection;
  }
  get featureVariant() {
    const { featureVariant } = this.configurationObject;
    if (featureVariant in allFeatureVariants) {
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
  get tabOrder() {
    return ["Eligible Now"] as const;
  }
  get initialHeader() {
    return "INITIAL HEADER";
  }
  get hydratedHeader() {
    // todooo actually hydrate
    return (formattedCount: CountFormatter) => ({
      callToAction: this.configurationObject.callToAction,
      opportunityText: "",
      eligibilityText: simplur(
        ["", " " + this.configurationObject.dynamicEligibilityText],
        formattedCount,
      ),
    });
  }
  get denialButtonText() {
    return "DENIAL BUTTON TEXT";
  }
  get eligibilityDateText() {
    return "ELIGIBILITY DATE TEXT";
  }
  get hideDenialRevert() {
    return false;
  }

  get isEnabled(): boolean {
    const { featureVariants } = this.workflowsStore;
    const { featureVariant, inverseFeatureVariant } = this;
    if (!featureVariant) return false;

    const featureVariantEnabled = !!featureVariants[featureVariant];
    const inverseFeatureVariantDisabled = inverseFeatureVariant
      ? !featureVariants[inverseFeatureVariant]
      : true;

    return featureVariantEnabled && inverseFeatureVariantDisabled;
  }
}
