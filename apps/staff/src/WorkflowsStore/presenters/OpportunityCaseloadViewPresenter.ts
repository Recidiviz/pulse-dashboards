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

import { OpportunityType } from "~datatypes";

import { OpportunityConfigurationStore } from "../Opportunity/OpportunityConfigurations/OpportunityConfigurationStore";
import { JusticeInvolvedPerson } from "../types";
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

  private get surfacedOpportunityTypes(): OpportunityType[] {
    const linked = this.opportunityConfiguration?.linkedOverdueOpportunityType;
    return linked ? [this.opportunityType, linked] : [this.opportunityType];
  }

  protected override get personsToHydrate(): JusticeInvolvedPerson[] {
    return this.workflowsStore.caseloadPersons.filter((person) =>
      person.opportunityManager.incomingOpportunityTypes.some((type) =>
        this.surfacedOpportunityTypes.includes(type),
      ),
    );
  }

  hydrate(): void {
    this.opportunityConfigurationStore.hydrate();
    super.hydrate();
  }
}
