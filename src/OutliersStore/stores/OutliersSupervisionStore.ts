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

import { makeAutoObservable, observable } from "mobx";

import { OutliersConfig } from "../models/OutliersConfig";
import type { OutliersStore } from "../OutliersStore";

export class OutliersSupervisionStore {
  constructor(
    public readonly outliersStore: OutliersStore,
    public readonly config: OutliersConfig
  ) {
    makeAutoObservable(this, {
      // this object will be static so there's no need to deeply observe it
      config: observable.ref,
    });
  }

  get adverseMetricsConfig() {
    return this.config.metrics.filter((m) => m.outcomeType === "ADVERSE");
  }
}
