// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2023 Recidiviz, Inc.
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

import { HydratesFromSource } from "../../core/models/HydratesFromSource";
import { Hydratable } from "../../core/models/types";
import { SupervisionOfficerSupervisor } from "../models/SupervisionOfficerSupervisor";
import { OutliersSupervisionStore } from "../stores/OutliersSupervisionStore";
import { ConfigLabels } from "./types";

export class SupervisionOfficerSupervisorsPresenter implements Hydratable {
  constructor(private supervisionStore: OutliersSupervisionStore) {
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
          this.supervisionStore.populateSupervisionOfficerSupervisors()
        ),
    });
  }

  private hydrator: HydratesFromSource;

  get hydrationState() {
    return this.hydrator.hydrationState;
  }

  hydrate(): Promise<void> {
    return this.hydrator.hydrate();
  }

  get allSupervisors() {
    return this.supervisionStore.supervisionOfficerSupervisors ?? [];
  }

  private get allSupervisorsWithOutliers() {
    return this.allSupervisors.filter((s) => s.hasOutliers);
  }

  get supervisorsWithOutliersByDistrict(): Array<{
    district: string | null;
    supervisors: Array<SupervisionOfficerSupervisor>;
  }> {
    const result = pipe(
      groupBy((d: SupervisionOfficerSupervisor) => d.supervisionDistrict),
      values,
      map((dataset) => {
        const { supervisionDistrict } = dataset[0];
        return {
          district: supervisionDistrict,
          supervisors: dataset as SupervisionOfficerSupervisor[],
        };
      })
    )(this.allSupervisorsWithOutliers ?? []);

    result.map(({ supervisors }) =>
      supervisors.sort((a, b) => a.displayName.localeCompare(b.displayName))
    );

    result.sort((a, b) => {
      if (!a.district) return 1;
      if (!b.district) return -1;

      return a.district
        .toLowerCase()
        .localeCompare(b.district.toLowerCase(), "en", {
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
}
