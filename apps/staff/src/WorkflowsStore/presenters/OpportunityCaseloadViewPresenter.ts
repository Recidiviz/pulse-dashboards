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

import { computed, makeObservable } from "mobx";
import pluralize from "pluralize";

import { OpportunityType } from "~datatypes";

import { OpportunityConfigurationStore } from "../Opportunity/OpportunityConfigurations/OpportunityConfigurationStore";
import { WorkflowsStore } from "../WorkflowsStore";
import { CaseloadOpportunitiesPresenter } from "./CaseloadOpportunitiesPresenter";

export class OpportunityCaseloadViewPresenter extends CaseloadOpportunitiesPresenter {
  constructor(
    protected readonly workflowsStore: WorkflowsStore,
    protected readonly opportunityConfigurationStore: OpportunityConfigurationStore,
    private readonly _opportunityType: OpportunityType,
  ) {
    super(workflowsStore);
    makeObservable<
      OpportunityCaseloadViewPresenter,
      "opportunityConfiguration"
    >(this, {
      labels: computed,
      opportunityConfiguration: computed,
    });
  }

  private get opportunityConfiguration() {
    return this.opportunityConfigurationStore.opportunities[
      this.opportunityType
    ];
  }

  public override get opportunityType(): OpportunityType {
    return this._opportunityType;
  }

  // ===== COPY =====

  get ctaTextAndHeaderText() {
    const { workflowsSearchFieldTitle, justiceInvolvedPersonTitle } =
      this.labels;

    const opportunityDisplayName =
      this.opportunityConfiguration?.label || undefined;
    const defaultOpportunityInitialHeader =
      this.opportunityConfiguration?.initialHeader;

    const selectedSearchIdsCount = this.selectedSearchIds?.length || 0;

    if (selectedSearchIdsCount === 0)
      return {
        headerText: opportunityDisplayName,
        ctaText:
          defaultOpportunityInitialHeader ||
          `Search for ${pluralize(workflowsSearchFieldTitle)} \
    above to review and refer eligible \
    ${pluralize(justiceInvolvedPersonTitle)} for \
    ${opportunityDisplayName?.toLowerCase()}.`,
      };
    else if (!this.hasOpportunities)
      return {
        ctaText: `None of the ${justiceInvolvedPersonTitle} on the selected \
    ${pluralize(workflowsSearchFieldTitle, selectedSearchIdsCount)} caseloads \
    are eligible for ${opportunityDisplayName?.toLowerCase()}. Search for \
    another ${workflowsSearchFieldTitle}.`,
      };
    else
      return {
        headerText: opportunityDisplayName,
      };
  }

  hydrate(): void {
    this.opportunityConfigurationStore.hydrate();
    super.hydrate();
  }
}
