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
import { Opportunity } from "../../types";
import { ILocalOpportunityConfiguration } from "../interfaces/ILocalOpportunityConfiguration";

export class LocalOpportunityConfiguration<
  OpportunityVariant extends Opportunity,
> {
  [key: string]: any;
  configurationObject: ILocalOpportunityConfiguration<OpportunityVariant>;
  workflowsStore: WorkflowsStore;

  constructor(
    configurationObject: ILocalOpportunityConfiguration<OpportunityVariant>,
    workflowsStore: WorkflowsStore,
  ) {
    this.configurationObject = configurationObject;
    this.workflowsStore = workflowsStore;
    (
      Object.keys(
        this.configurationObject,
      ) as (keyof typeof configurationObject)[]
    ).forEach((key) => {
      const value = configurationObject[key];
      if (typeof value === "function") this[key] = value.bind(this);
      else this[key] = value;
    });
  }

  isEnabled(): boolean {
    const { featureVariants } = this.workflowsStore;
    const { featureVariant, inverseFeatureVariant } = this.configurationObject;
    if (!featureVariant) return false;

    const featureVariantEnabled = !!featureVariants[featureVariant];
    const inverseFeatureVariantDisabled = inverseFeatureVariant
      ? !featureVariants[inverseFeatureVariant]
      : true;

    return featureVariantEnabled && inverseFeatureVariantDisabled;
  }
}
