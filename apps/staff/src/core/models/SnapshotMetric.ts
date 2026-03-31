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

import { isDemoMode, isOfflineMode } from "~client-env-utils";
import {
  downloadChartAsData,
  SnapshotDataRecord,
  SnapshotMetric as SharedSnapshotMetric,
} from "~shared-pathways";

import CoreStore from "../CoreStore";
import {
  BaseNewMetricConstructorProps,
  generateStaffNewMetricOptions,
} from "./generateStaffNewMetricOptions";

export default class SnapshotMetric extends SharedSnapshotMetric {
  readonly rootStore: CoreStore;

  constructor(
    props: BaseNewMetricConstructorProps & {
      accessor: keyof SnapshotDataRecord;
    },
  ) {
    super({
      ...generateStaffNewMetricOptions<SnapshotDataRecord>(props),
      accessor: props.accessor,
    });
    this.rootStore = props.rootStore;

    this.download = this.download.bind(this);
  }

  override get tenantId(): string | undefined {
    return isOfflineMode() || isDemoMode()
      ? undefined
      : this.store.currentTenantId;
  }

  async download(): Promise<void> {
    return downloadChartAsData({
      fileContents: [this.downloadableData],
      chartTitle: this.chartTitle,
      includeFiltersDescriptionInCSV: true,
      filters: this.rootStore?.filtersStore.filtersDescription,
      methodologyContent: this.methodology,
    });
  }
}
