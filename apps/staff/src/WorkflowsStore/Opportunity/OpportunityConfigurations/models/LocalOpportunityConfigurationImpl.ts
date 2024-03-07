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

import { WorkflowsStore } from "../../../WorkflowsStore";
import {
  ILocalOpportunityConfiguration,
  OpportunityConfiguration,
} from "../interfaces/LocalOpportunityConfiguration";

export class LocalOpportunityConfiguration implements OpportunityConfiguration {
  configurationObject: ILocalOpportunityConfiguration;
  workflowsStore: WorkflowsStore;

  constructor(
    configurationObject: ILocalOpportunityConfiguration,
    workflowsStore: WorkflowsStore,
  ) {
    this.configurationObject = configurationObject;
    this.workflowsStore = workflowsStore;
  }

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
    return this.configurationObject.snooze;
  }
  get tabOrder() {
    return this.configurationObject.tabOrder;
  }
  get initialHeader() {
    return this.configurationObject.initialHeader;
  }
  get hydratedHeader() {
    return this.configurationObject.hydratedHeader;
  }
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

  get isEnabled(): boolean {
    const { featureVariants } = this.workflowsStore;
    const { featureVariant, inverseFeatureVariant } = this;

    const featureVariantEnabled =
      !featureVariant || !!featureVariants[featureVariant];
    const inverseFeatureVariantDisabled =
      !!inverseFeatureVariant && !!featureVariants[inverseFeatureVariant];

    return featureVariantEnabled && !inverseFeatureVariantDisabled;
  }
}
