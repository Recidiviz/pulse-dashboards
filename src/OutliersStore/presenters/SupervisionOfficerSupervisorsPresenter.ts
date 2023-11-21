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

import { Hydratable } from "../../core/models/types";
import { castToError } from "../../utils/castToError";
import { SupervisionOfficerSupervisor } from "../models/SupervisionOfficerSupervisor";
import { OutliersSupervisionStore } from "../stores/OutliersSupervisionStore";
import { ConfigLabels } from "./types";

export class SupervisionOfficerSupervisorsPresenter implements Hydratable {
  isLoading?: boolean;

  error?: Error;

  constructor(private supervisionStore: OutliersSupervisionStore) {
    makeAutoObservable(this);
  }

  get isHydrated() {
    return this.supervisionStore.supervisionOfficerSupervisors !== undefined;
  }

  async hydrate(): Promise<void> {
    if (this.isHydrated) return;

    this.isLoading = true;
    this.error = undefined;
    try {
      await flowResult(
        this.supervisionStore.hydrateSupervisionOfficerSupervisors()
      );
      this.setIsLoading(false);
    } catch (e) {
      this.setError(castToError(e));
      this.setIsLoading(false);
    }
  }

  setError(e: Error | undefined) {
    this.error = e;
  }

  setIsLoading(isLoading?: boolean) {
    this.isLoading = isLoading;
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
    return pipe(
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
  }

  get supervisorsWithOutliersCount(): number {
    return this.allSupervisorsWithOutliers?.length ?? 0;
  }

  get labels(): ConfigLabels {
    return this.supervisionStore.labels;
  }
}
