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

import { flowResult, makeAutoObservable, when } from "mobx";

import { ResidentRecord } from "~datatypes";
import { Hydratable, HydratesFromSource } from "~hydration-utils";

import {
  IncarcerationOpportunityId,
  ResidentsConfig,
} from "../../configs/types";
import { ResidentsStore } from "../../datastores/ResidentsStore";
import { SingleResidentContext } from "./context";

export class SingleResidentHydratorPresenter implements Hydratable {
  private hydrationSource: HydratesFromSource;

  constructor(
    private residentsStore: ResidentsStore,
    private residentPseudoId: string,
  ) {
    makeAutoObservable(this, {}, { autoBind: true });

    this.hydrationSource = new HydratesFromSource({
      populate: () => this.populateResidentData(),

      expectPopulated: [this.expectResidentDataPopulated],
    });
  }

  private get resident() {
    return this.residentsStore.residentsByPseudoId.get(this.residentPseudoId);
  }

  private get opportunityTypes() {
    return Object.keys(
      this.residentsStore.config.incarcerationOpportunities,
    ) as Array<keyof ResidentsConfig["incarcerationOpportunities"]>;
  }

  private opportunityConfig(opportunityType: IncarcerationOpportunityId) {
    const config =
      this.residentsStore.config.incarcerationOpportunities[opportunityType];
    // in practice we do not expect this and the check is mainly for type safety
    if (!config) {
      throw new Error(`Missing configuration for ${opportunityType}`);
    }
    return config;
  }

  /**
   * We may have this value even if we don't yet have resident data,
   * because it falls back to what is in the user's metadata. This assumes that a JII
   * will never be attempting to look at another's data (because it may result in incorrect data if so)
   */
  private get residentExternalId() {
    return (
      this.resident?.personExternalId ??
      this.residentsStore.userStore.externalId
    );
  }

  private async populateResidentData() {
    const {
      residentsStore,
      residentPseudoId: residentPseudoIdFromUrl,
      residentsStore: {
        userStore: { pseudonymizedId: residentPseudoIdFromUser },
      },
    } = this;

    // we don't support residents looking up data for other residents.
    // it may be possible to inadvertently grant such permission, which could lead to incorrect data being fetched
    // in parallel (resident using the provided pseudoId and opportunity using the user's external ID).
    if (residentPseudoIdFromUrl && residentPseudoIdFromUser) {
      if (residentPseudoIdFromUrl !== residentPseudoIdFromUser) {
        throw new Error(
          `User ${residentPseudoIdFromUser} cannot access resident ${residentPseudoIdFromUrl}`,
        );
      }
    }

    // we have to populate the data before constructing the report from it.
    // these should be no-ops if already populated so we don't need bailing logic

    const residentPopulated = flowResult(
      residentsStore.populateResidentByPseudoId(this.residentPseudoId),
    );

    // we can't look up opportunities by pseudo ID.
    // if we already have the external ID from user data this will resolve immediately,
    // if not it will wait for the resident data to populate
    await when(() => !!this.residentExternalId);

    // safe assertion because we just awaited it
    const externalId = this.residentExternalId as string;

    const opportunitiesPopulated = this.opportunityTypes.map((oppType) =>
      flowResult(
        residentsStore.populateOpportunityRecordByResidentId(
          externalId,
          oppType,
        ),
      ),
    );

    await Promise.all([residentPopulated, ...opportunitiesPopulated]);

    // if we've gotten this far we can be confident that this exists
    const resident = this.resident as ResidentRecord;
    this.opportunityTypes.forEach((oppType) => {
      // no assertion here because it's actually fine/expected for this to be undefined
      const residentEligibility =
        residentsStore.residentOpportunityRecordsByExternalId.get(externalId)?.[
          oppType
        ];

      residentsStore.populateEligibilityReportFromData(
        oppType,
        resident,
        residentEligibility,
      );
    });
  }

  private expectResidentDataPopulated() {
    const {
      resident,
      residentPseudoId: residentPseudoIdFromUrl,
      residentsStore: {
        userStore: { pseudonymizedId: residentPseudoIdFromUser },
      },
    } = this;

    if (!resident) {
      throw new Error(
        `Failed to populate data for resident ${this.residentPseudoId}`,
      );
    }

    // we don't support residents looking up data for other residents.
    // it may be possible to inadvertently grant such permission, which could lead to incorrect data being fetched
    // in parallel (resident using the provided pseudoId and opportunity using the user's external ID).
    if (residentPseudoIdFromUrl && residentPseudoIdFromUser) {
      if (residentPseudoIdFromUrl !== residentPseudoIdFromUser) {
        throw new Error(
          `User ${residentPseudoIdFromUser} cannot access resident ${residentPseudoIdFromUrl}`,
        );
      }
    }

    const opportunities = this.opportunityTypes.map((oppType) => {
      const report = this.residentsStore.residentEligibilityReportsByExternalId
        .get(resident.personExternalId)
        ?.get(oppType);

      if (report) {
        return {
          opportunityId: oppType,
          opportunityConfig: this.opportunityConfig(oppType),
          eligibilityReport: report,
        };
      }

      throw new Error(
        `Failed to populate ${oppType} eligibility report for resident ${this.residentPseudoId}`,
      );
    });

    return { resident, opportunities };
  }

  get hydrationState() {
    return this.hydrationSource.hydrationState;
  }

  hydrate() {
    return this.hydrationSource.hydrate();
  }

  get residentData(): SingleResidentContext {
    return this.expectResidentDataPopulated();
  }
}
