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

import groupBy from "lodash/fp/groupBy";
import map from "lodash/fp/map";
import pipe from "lodash/fp/pipe";
import values from "lodash/fp/values";
import { flowResult, makeAutoObservable } from "mobx";

import { SupervisionOfficerSupervisor } from "~datatypes";
import { Hydratable, HydratesFromSource } from "~hydration-utils";

import { FeatureVariantValue } from "../../RootStore/types";
import { InsightsSupervisionStore } from "../stores/InsightsSupervisionStore";
import { ConfigLabels } from "./types";

export class SupervisionOfficerSupervisorsPresenter implements Hydratable {
  constructor(
    private supervisionStore: InsightsSupervisionStore,
    private insightsLeadershipPageAllDistricts?: FeatureVariantValue,
  ) {
    makeAutoObservable(this);

    this.hydrator = new HydratesFromSource({
      expectPopulated: [
        () => {
          if (this.supervisionStore.supervisionOfficerSupervisors === undefined)
            throw new Error("Failed to populate supervisors");
        },
      ],
      populate: () =>
        flowResult(
          this.supervisionStore.populateSupervisionOfficerSupervisors(),
        ),
    });
    this.hydrator.isIgnored = this.supervisionStore.isUserEnriched;
  }

  private hydrator: HydratesFromSource;

  get hydrationState() {
    return this.hydrator.hydrationState;
  }

  hydrate(): Promise<void> {
    return this.hydrator.hydrate();
  }

  get allSupervisors() {
    const launchedDistricts =
      this.supervisionStore.insightsStore.rootStore.tenantStore
        .insightsLaunchedDistricts;
    const supervisors =
      this.supervisionStore.supervisionOfficerSupervisors ?? [];
    if (launchedDistricts && !this.insightsLeadershipPageAllDistricts) {
      return supervisors.filter(
        ({ supervisionLocationForListPage }) =>
          supervisionLocationForListPage &&
          launchedDistricts.includes(
            supervisionLocationForListPage.toUpperCase(),
          ),
      );
    }
    return supervisors;
  }

  private get allSupervisorsWithOutliers() {
    return this.allSupervisors.filter((s) => s.hasOutliers);
  }

  /**
   * Organize supervisors by district. This includes
   * all supervisors, not just supervisors with outlier officers.
   */
  get supervisorsByLocation(): Array<{
    location: string | null;
    supervisors: Array<SupervisionOfficerSupervisor>;
  }> {
    const result = pipe(
      groupBy(
        (d: SupervisionOfficerSupervisor) => d.supervisionLocationForListPage,
      ),
      values,
      map((dataset) => {
        const { supervisionLocationForListPage } = dataset[0];
        return {
          location: supervisionLocationForListPage,
          supervisors: dataset as SupervisionOfficerSupervisor[],
        };
      }),
    )(
      (this.isWorkflowsHomepageEnabled
        ? this.allSupervisors
        : this.allSupervisorsWithOutliers) ?? [],
    );

    result.map(({ supervisors }) =>
      supervisors.sort((a, b) => a.displayName.localeCompare(b.displayName)),
    );

    result.sort((a, b) => {
      if (!a.location) return 1;
      if (!b.location) return -1;

      return a.location
        .toLowerCase()
        .localeCompare(b.location.toLowerCase(), "en", {
          numeric: true,
        });
    });

    return result;
  }

  get supervisorsWithOutliersCount(): number {
    return this.allSupervisorsWithOutliers?.length ?? 0;
  }

  get labels(): ConfigLabels {
    return this.supervisionStore.labels;
  }

  get isWorkflowsHomepageEnabled(): boolean {
    return !!this.supervisionStore.insightsStore.rootStore.userStore
      .activeFeatureVariants.supervisorHomepageWorkflows;
  }

  get pageTitle(): string {
    return "Select a supervisor to view their overview";
  }

  trackViewed(): void {
    const { userPseudoId } =
      this.supervisionStore.insightsStore.rootStore.userStore;
    this.supervisionStore.insightsStore.rootStore.analyticsStore.trackInsightsSupervisorsListPageViewed(
      {
        viewedBy: userPseudoId,
      },
    );
  }

  trackPageViewed30Seconds(path: string): void {
    this.supervisionStore.trackPageViewed30Seconds(path);
  }
}
