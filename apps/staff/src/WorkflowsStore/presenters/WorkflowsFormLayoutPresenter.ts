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

import { makeAutoObservable, runInAction } from "mobx";

import { OpportunityType } from "~datatypes";
import {
  awaitHydration,
  castToError,
  Hydratable,
  HydrationState,
  isHydrated,
  isHydrationUntouched,
} from "~hydration-utils";

import FirestoreStore from "../../FirestoreStore";
import TenantStore from "../../RootStore/TenantStore";
import {
  getRecordForIneligible,
  isEligibleOrAlmostEligible,
  JusticeInvolvedPerson,
  Opportunity,
  WorkflowsStore,
} from "../../WorkflowsStore";
import { opportunityConstructors } from "../Opportunity/opportunityConstructors";

export class WorkflowsFormLayoutPresenter implements Hydratable {
  constructor(
    public selectedPerson: JusticeInvolvedPerson,
    public selectedOpportunityType: OpportunityType,
    protected workflowsStore: WorkflowsStore,
    protected firestoreStore: FirestoreStore,
    protected tenantStore: TenantStore,
  ) {
    makeAutoObservable(this);
  }

  private ineligibleOpportunity: Opportunity | undefined;
  private hydrationStateOverride?: HydrationState;

  /**
   * GET METHODS
   *
   * get selectedOpportunity either returns the corresponding opportunity to cur oppType & person or
   * creates a new opportunity from a retrieved record (only if they're ineligible & us_tn_expiration opp)
   */
  public get selectedOpportunity(): Opportunity | undefined {
    if (!isHydrated(this.selectedPerson.opportunityManager)) {
      throw new Error(
        "WorkflowsFormLayoutPresenter: opportunityManager isn't hydrated.",
      );
    }
    return this.ineligibleOpportunity
      ? this.ineligibleOpportunity
      : this.selectedPerson.flattenedOpportunities.find(
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
  async hydrate() {
    if (isHydrationUntouched(this)) {
      try {
        runInAction(() => {
          this.hydrationStateOverride = undefined;
        });
        await this.hydrateOpportunity();
      } catch (e) {
        runInAction(() => {
          this.hydrationStateOverride = {
            status: "failed",
            error: castToError(e),
          };
        });
      }
    }
  }

  private async hydrateOpportunity() {
    // for eligible/almost eligible case
    if (!isHydrated(this.selectedPerson.opportunityManager)) {
      await awaitHydration(this.selectedPerson.opportunityManager);
    }

    // for ineligible case: create opp from record (only used for usTnExpiration opportunity)
    if (
      !isEligibleOrAlmostEligible(
        this.selectedPerson,
        this.selectedOpportunityType,
      ) &&
      this.workflowsStore.featureVariants.usTnTEPENotesForAll
    ) {
      const record = await getRecordForIneligible(
        this.selectedPerson,
        this.selectedOpportunityType,
        this.workflowsStore,
        this.firestoreStore,
      );

      if (record !== undefined) {
        const constructor =
          opportunityConstructors[this.selectedOpportunityType];
        const opp = new constructor(
          this.selectedPerson as any,
          record,
          this.selectedOpportunityType,
        );
        this.ineligibleOpportunity = opp;
        await this.ineligibleOpportunity.hydrate();
      } else {
        throw new Error(
          "WorkflowsFormLayoutPresenter: selectedPerson has no record.",
        );
      }
    }
  }

  /**
   * HYDRATION STATE
   */
  get hydrationState(): HydrationState {
    if (this.hydrationStateOverride) return this.hydrationStateOverride;

    if (!isHydrated(this.selectedPerson.opportunityManager))
      return this.selectedPerson.opportunityManager.hydrationState;

    // if we've gotten this far it means the opportunities are fully hydrated,
    // so we can expect to find one for our specified OpportunityType and fail hydration if it's missing
    if (!this.selectedOpportunity) {
      // unless if they're ineligible, that means we don't expect to find our specified oppType
      if (
        !isEligibleOrAlmostEligible(
          this.selectedPerson,
          this.selectedOpportunityType,
        )
      )
        return { status: "needs hydration" };

      return {
        status: "failed",
        error: new Error(
          "WorkflowsFormLayoutPresenter: failed to hydrate opportunity",
        ),
      };
    }

    return this.selectedOpportunity.hydrationState;
  }
}
