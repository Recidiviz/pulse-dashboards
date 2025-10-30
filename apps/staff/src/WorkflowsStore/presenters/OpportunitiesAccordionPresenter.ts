// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2025 Recidiviz, Inc.
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

import { sortBy } from "lodash";
import { makeAutoObservable, reaction } from "mobx";

import { Hydratable, HydrationState, isHydrated } from "~hydration-utils";

import { Opportunity } from "../Opportunity";
import { JusticeInvolvedPerson } from "../types";
import { WorkflowsStore } from "../WorkflowsStore";

export class OpportunitiesAccordionPresenter<
  PersonType extends JusticeInvolvedPerson,
> implements Hydratable
{  

  constructor(
    private workflowsStore: WorkflowsStore,
    /**
     * Whether to show ineligible opportunities in the accordion.
     */
    public person: PersonType,
    public hideEmpty = false,
    public formLinkButton = false,
  ) {

    makeAutoObservable(this, undefined, { autoBind: true });

    reaction(
      () => workflowsStore.opportunityTypes,
      (opportunityTypes) => {
        person.opportunityManager.setSelectedOpportunityTypes(opportunityTypes);
      },
    );
  }

  get opportunityConfigurations() {
    return this.workflowsStore.opportunityConfigurationStore?.opportunities;
  }

  /**
   * Hydrated opportunities to display in the accordion, sorted by homepage position.
   */
  get opportunitiesToDisplayInAccordion() {
    return sortBy(
      Array.from(Object.values(this.person.opportunities)).flat(),
      (opportunity) => opportunity?.config.homepagePosition,
    ) as Opportunity[];
  }

  get selectedOpportunityOnFullProfile() {
    return this.workflowsStore.selectedOpportunityOnFullProfile;
  }

  updateSelectedOpportunityOnFullProfile(
    ...params: Parameters<
      WorkflowsStore["updateSelectedOpportunityOnFullProfile"]
    >
  ) {
    return this.workflowsStore.updateSelectedOpportunityOnFullProfile(
      ...params,
    );
  }

  async hydrate() {
    if (!isHydrated(this.person.opportunityManager))
      await this.person.opportunityManager.hydrate();
  }

  /**
   * The hydration state of the presenter, which is based on whether all opportunity types to display in the accordion have been populated.
   */
  get hydrationState(): HydrationState {
    return this.person.opportunityManager.hydrationState;
  }
}
