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

import { makeAutoObservable } from "mobx";

import { isTestEnv } from "~client-env-utils";
import { OpportunityType } from "~datatypes";
import { Hydratable, HydrationState, isHydrated } from "~hydration-utils";

import FirestoreStore from "../../FirestoreStore";
import TenantStore from "../../RootStore/TenantStore";
import { JusticeInvolvedPerson, Opportunity } from "../../WorkflowsStore";

export class WorkflowsFormLayoutPresenter implements Hydratable {
  constructor(
    public selectedPerson: JusticeInvolvedPerson,
    public selectedOpportunityType: OpportunityType,
    protected firestoreStore: FirestoreStore,
    protected tenantStore: TenantStore,
  ) {
    makeAutoObservable(this);
  }

  /**
   * GET METHODS
   */
  public get selectedOpportunity(): Opportunity | undefined {
    return this.selectedPerson.flattenedOpportunities.find(
      (opp) => opp.type === this.selectedOpportunityType,
    );
  }

  public get workflowsMethodologyUrl(): string {
    if (!this.tenantStore.workflowsMethodologyUrl) {
      throw new Error(
        "WorkflowsFormLayoutPresenter: workflowsMethodologyUrl is undefined",
      );
    }
    return this.tenantStore.workflowsMethodologyUrl;
  }

  /**
   * HYDRATION
   *
   * The hydrate() method assumes that selectedOpportunity, selectedPerson, and selectedOpportunityType
   * are already defined externally. It will hydrate for the given person and opportunity type.
   */
  hydrate() {
    if (!this.isDebug) {
      this.hydrateOpportunity();
    }
  }

  private async hydrateOpportunity() {
    if (!isHydrated(this.selectedPerson.opportunityManager)) {
      await this.selectedPerson.opportunityManager.hydrate();
    }
  }

  /**
   * HYDRATION STATE
   */
  get hydrationState(): HydrationState {
    if (this.isDebug) return { status: "hydrated" };

    if (!isHydrated(this.selectedPerson.opportunityManager))
      return this.selectedPerson.opportunityManager.hydrationState;

    // if we've gotten this far it means the opportunities are fully hydrated,
    // so we can expect to find one for our specified OpportunityType and fail hydration if it's missing
    if (!this.selectedOpportunity) {
      return {
        status: "failed",
        error: new Error(
          "WorkflowsFormLayoutPresenter: failed to hydrate opportunity",
        ),
      };
    }

    return { status: "hydrated" };
  }

  /**
   * TESTING
   */
  get isDebug() {
    return isTestEnv();
  }
}
