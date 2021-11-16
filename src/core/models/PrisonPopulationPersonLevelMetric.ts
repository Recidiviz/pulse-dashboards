/*
 * Recidiviz - a data platform for criminal justice reform
 * Copyright (C) 2021 Recidiviz, Inc.
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
 * =============================================================================
 *
 */
// TODO #1428 Add tests
import PathwaysMetric from "./PathwaysMetric";
import { PrisonPopulationPersonLevelRecord } from "./types";

export default class PrisonPopulationPersonLevelMetric extends PathwaysMetric<PrisonPopulationPersonLevelRecord> {
  get dataSeries(): PrisonPopulationPersonLevelRecord[] {
    if (!this.rootStore || !this.allRecords?.length) return [];
    const {
      gender,
      ageGroup,
      facility,
      legalStatus,
    } = this.rootStore.filtersStore.filters;

    const handleFilters = (filter: string[] | string, recordFilter: string) => {
      if (filter === "ALL") {
        return recordFilter !== "ALL";
      }
      return Array.isArray(filter)
        ? filter.includes(recordFilter)
        : recordFilter === filter;
    };
    return this.allRecords.filter(
      (record: PrisonPopulationPersonLevelRecord) => {
        return (
          handleFilters(facility, record.facility) &&
          handleFilters(gender, record.gender) &&
          handleFilters(ageGroup, record.ageGroup) &&
          handleFilters(legalStatus, record.legalStatus)
        );
      }
    );
  }
}
