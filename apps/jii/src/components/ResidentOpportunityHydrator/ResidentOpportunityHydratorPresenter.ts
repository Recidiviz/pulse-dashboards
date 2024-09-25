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

import { ResidentsStore } from "../../datastores/ResidentsStore";

export class ResidentOpportunityHydratorPresenter implements Hydratable {
  private hydrationSource: HydratesFromSource;

  constructor(
    private opportunitySlug: string,
    private residentsStore: ResidentsStore,
  ) {
    makeAutoObservable(this, {}, { autoBind: true });

    this.hydrationSource = new HydratesFromSource({
      populate: () =>
        flowResult(
          this.residentsStore.populateEligibilityReportByResidentId(
            this.residentExternalId,
            this.opportunityId,
            this.opportunityConfig,
          ),
        ),
      expectPopulated: [this.expectReportPopulated],
    });
  }

  get opportunityId() {
    // we don't expect this to throw unless someone typed nonsense into their address bar
    return this.residentsStore.opportunitySlugToIdOrThrow(this.opportunitySlug);
  }

  get opportunityConfig() {
    const config =
      this.residentsStore.config.incarcerationOpportunities[this.opportunityId];
    // in practice we do not expect this and the check is mainly for type safety
    if (!config) {
      throw new Error(`Missing configuration for ${this.opportunityId}`);
    }
    return config;
  }

  get residentExternalId() {
    const { externalId } = this.residentsStore.userStore;
    // this we do expect, for any non-Resident user (staff, internal, etc)
    if (!externalId) {
      throw new Error("missing Resident ID");
    }
    return externalId;
  }

  private expectReportPopulated() {
    const report = this.residentsStore.residentEligibilityReportsByExternalId
      .get(this.residentExternalId)
      ?.get(this.opportunityId);
    if (!report) {
      throw new Error(
        `Failed to populate ${this.opportunityId} eligibility report for ${this.residentExternalId}`,
      );
    }
    return report;
  }

  get hydrationState() {
    return this.hydrationSource.hydrationState;
  }

  hydrate() {
    return this.hydrationSource.hydrate();
  }

  /**
   * This is an annoyance that mostly affects staff/internal users, since searches do not
   * persist across browser sessions. Catches the error before it bubbles up the component tree
   * so we have a chance to redirect the user somewhere more useful.
   */
  get redirectToSearch() {
    try {
      if (this.residentExternalId) {
        return false;
      }
    } catch {
      if (this.residentsStore.userStore.hasPermission("enhanced")) {
        return true;
      }
    }
    return false;
  }

  get eligibilityReport() {
    return this.expectReportPopulated();
  }
}
