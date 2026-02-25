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

// TODO(#12060) remove this entire file once  FiltersStore is added to public-pathways
// along with the filters config
import { EnabledFiltersByMetric, FILTER_TYPES } from "~shared-pathways";

const PRISON_SNAPSHOT_FILTERS = [
  FILTER_TYPES.FACILITY,
  FILTER_TYPES.GENDER,
  FILTER_TYPES.SEX,
  FILTER_TYPES.AGE_GROUP,
  FILTER_TYPES.RACE,
  FILTER_TYPES.ETHNICITY,
  FILTER_TYPES.SENTENCE_LENGTH_MIN,
  FILTER_TYPES.SENTENCE_LENGTH_MAX,
];

export const publicPathwaysEnabledFilters: Partial<EnabledFiltersByMetric> = {
  prisonPopulationOverTime: {
    enabledFilters: [FILTER_TYPES.TIME_PERIOD, ...PRISON_SNAPSHOT_FILTERS],
  },
  prisonFacilityPopulation: {
    enabledFilters: PRISON_SNAPSHOT_FILTERS,
  },
  prisonPopulationByRace: {
    enabledFilters: PRISON_SNAPSHOT_FILTERS,
  },
  prisonPopulationByAgeGroup: {
    enabledFilters: PRISON_SNAPSHOT_FILTERS,
  },
  prisonPopulationByGender: {
    enabledFilters: PRISON_SNAPSHOT_FILTERS,
  },
  prisonPopulationBySex: {
    enabledFilters: PRISON_SNAPSHOT_FILTERS,
  },
  prisonPopulationByEthnicity: {
    enabledFilters: PRISON_SNAPSHOT_FILTERS,
  },
  prisonPopulationBySentenceLengthMin: {
    enabledFilters: PRISON_SNAPSHOT_FILTERS,
  },
  prisonPopulationBySentenceLengthMax: {
    enabledFilters: PRISON_SNAPSHOT_FILTERS,
  },
};
