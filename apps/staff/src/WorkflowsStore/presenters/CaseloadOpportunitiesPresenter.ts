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

import { isTestEnv } from "~client-env-utils";
import {
  compositeHydrationState,
  Hydratable,
  HydrationState,
  isHydrated,
} from "~hydration-utils";

import { WorkflowsStore } from "../WorkflowsStore";

// TODO: (#6695) [Workflows] Colocate the presenters on Workflows with their components
export class CaseloadOpportunitiesPresenter implements Hydratable {
  constructor(protected workflowsStore: WorkflowsStore) {
    makeObservable(this, {
      selectedSearchIds: computed,
      opportunitiesByType: computed,
      activeOpportunityTypes: computed,
      opportunityType: computed,
    });
  }

  // =========================
  // Caseload Filters
  // =========================

  /**
   * The list of selected search ids. This is used to filter the caseloads to only show
   * the opportunities that match the selected search ids (i.e. Location, Case Manager, etc.)
   */
  get selectedSearchIds() {
    return this.workflowsStore.searchStore.selectedSearchIds;
  }

  get opportunityType() {
    return this.workflowsStore.selectedOpportunityType;
  }

  /**
   * The list of active opportunity types. This is used to filter the caseloads to only
   * show opportunities with the types that the user is allowed to see.
   */
  get activeOpportunityTypes() {
    return this.workflowsStore.opportunityTypes;
  }

  // =========================
  // Caseload Content (Opportunities)
  // =========================

  get opportunitiesByType() {
    return this.workflowsStore.allOpportunitiesByType;
  }

  // =========================
  // Copy
  // =========================

  get labels() {
    return {
      justiceInvolvedPersonTitle:
        this.workflowsStore.justiceInvolvedPersonTitle,
      workflowsSearchFieldTitle: this.workflowsStore.workflowsSearchFieldTitle,
    };
  }

  // =========================
  // Population Methods
  // =========================

  async populateCaseloads() {
    this.workflowsStore.caseloadPersons.forEach((person) => {
      if (!isHydrated(person.opportunityManager))
        person.opportunityManager.hydrate();
    });
  }

  hydrate() {
    if (!this.isDebug) this.populateCaseloads();
  }

  // =========================
  // Caseload Hydration State
  // =========================

  get hasOpportunities() {
    return this.workflowsStore.hasOpportunities(this.activeOpportunityTypes);
  }

  get hydrationState(): HydrationState {
    return this.isDebug
      ? { status: "hydrated" }
      : compositeHydrationState(
          [this.workflowsStore as Hydratable].concat(
            this.workflowsStore.caseloadPersons
              .map((person) => person.opportunityManager)
              .concat(),
          ),
        );
  }

  // =========================
  // Testing
  // =========================

  get isDebug() {
    return isTestEnv();
  }
}
