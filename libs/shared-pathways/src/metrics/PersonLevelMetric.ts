// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2026 Recidiviz, Inc.
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

import { PersonLevelDataRecord } from "../types";
import PathwaysNewBackendMetric from "./PathwaysNewBackendMetric";
import { SharedMetricConstructorOptions } from "./types";

export default class PersonLevelMetric extends PathwaysNewBackendMetric<PersonLevelDataRecord> {
  constructor(props: SharedMetricConstructorOptions<PersonLevelDataRecord>) {
    super(props);

    makeObservable<PersonLevelMetric>(this, {
      dataSeries: computed,
    });
  }

  get dataSeries(): PersonLevelDataRecord[] {
    return this.allRecords ?? [];
  }

  get dataSeriesForDiffing(): PersonLevelDataRecord[] {
    return this.dataSeries.map((record: PersonLevelDataRecord) => {
      const mappedRecord = { ...record };
      if (this.lastUpdated) {
        mappedRecord.lastUpdated = this.lastUpdated;
      }
      return mappedRecord;
    });
  }

  get isEmpty(): boolean {
    return !this.dataSeries.length;
  }
}
