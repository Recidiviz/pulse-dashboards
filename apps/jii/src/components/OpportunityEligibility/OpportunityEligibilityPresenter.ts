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

import { flowResult, makeAutoObservable } from "mobx";

import { Hydratable, HydratesFromSource } from "~hydration-utils";

import {
  IncarcerationOpportunityId,
  OpportunityConfig,
} from "../../configs/types";
import { ResidentsStore } from "../../datastores/ResidentsStore";

export class OpportunityEligibilityPresenter implements Hydratable {
  private hydrationSource: HydratesFromSource;

  constructor(
    private residentsStore: ResidentsStore,
    public residentExternalId: string,
    public opportunityId: IncarcerationOpportunityId,
    private config: OpportunityConfig,
  ) {
    makeAutoObservable(this, undefined, { autoBind: true });

    this.hydrationSource = new HydratesFromSource({
      populate: async () => {
        await Promise.all([
          flowResult(
            this.residentsStore.populateResidentById(this.residentExternalId),
          ),
          flowResult(
            this.residentsStore.populateEligibilityRecordByResidentId(
              this.residentExternalId,
              this.opportunityId,
            ),
          ),
        ]);
      },
      expectPopulated: [
        this.expectResidentPopulated,
        this.expectResidentEligibilityPopulated,
      ],
    });
  }

  private expectResidentPopulated() {
    if (!this.residentsStore.isResidentPopulated(this.residentExternalId)) {
      throw new Error(
        `Failed to populate resident data for ${this.residentExternalId}`,
      );
    }
  }

  private expectResidentEligibilityPopulated() {
    if (
      !this.residentsStore.isResidentEligibilityPopulated(
        this.residentExternalId,
        this.opportunityId,
      )
    ) {
      throw new Error(
        `Failed to populate ${this.opportunityId} eligibility for resident ${this.residentExternalId}`,
      );
    }
  }

  get hydrationState() {
    return this.hydrationSource.hydrationState;
  }

  hydrate() {
    return this.hydrationSource.hydrate();
  }

  get aboutContent() {
    return {
      ...this.config.copy.about,
      linkUrl: `/eligibility/${this.config.urlSection}/about`,
    };
  }

  get nextStepsContent() {
    return {
      ...this.config.copy.nextSteps,
      linkUrl: `/eligibility/${this.config.urlSection}/nextSteps`,
    };
  }
}
