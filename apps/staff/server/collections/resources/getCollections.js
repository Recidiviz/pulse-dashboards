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

const { COLLECTIONS } = require("../../constants/collections");
const { removeAllValue } = require("./dimensionValues/shared");
const dimensionsByStateCode = require("./dimensionValues");
const { stateCodes } = require("../../constants/stateCodes");

function newRevocations(dimensions) {
  return {
    [COLLECTIONS.NEW_REVOCATION]: {
      revocations_matrix_supervision_location_ids_to_names: {
        filename: "revocations_matrix_supervision_location_ids_to_names.json",
      },
      state_race_ethnicity_population: {
        filename: "state_race_ethnicity_population.json",
      },
      state_gender_population: { filename: "state_gender_population.json" },
      revocations_matrix_events_by_month: {
        filename: "revocations_matrix_events_by_month.txt",
        dimensions: {
          charge_category: dimensions.charge_category,
          month: dimensions.month,
          reported_violations: dimensions.reported_violations,
          supervision_type: dimensions.supervision_type,
          supervision_level: dimensions.supervision_level,
          violation_type: dimensions.violation_type,
        },
      },
      revocations_matrix_cells: {
        filename: "revocations_matrix_cells.txt",
        dimensions: {
          charge_category: dimensions.charge_category,
          metric_period_months: dimensions.metric_period_months,
          reported_violations: removeAllValue(dimensions.reported_violations),
          supervision_type: dimensions.supervision_type,
          supervision_level: dimensions.supervision_level,
          violation_type: removeAllValue(dimensions.violation_type),
        },
      },
      revocations_matrix_distribution_by_district: {
        filename: "revocations_matrix_distribution_by_district.txt",
        dimensions: {
          charge_category: dimensions.charge_category,
          metric_period_months: dimensions.metric_period_months,
          reported_violations: dimensions.reported_violations,
          supervision_type: dimensions.supervision_type,
          supervision_level: dimensions.supervision_level,
          violation_type: dimensions.violation_type,
        },
      },
      revocations_matrix_distribution_by_gender: {
        filename: "revocations_matrix_distribution_by_gender.txt",
        dimensions: {
          risk_level: dimensions.risk_level,
          gender: dimensions.gender,
          charge_category: dimensions.charge_category,
          metric_period_months: dimensions.metric_period_months,
          reported_violations: dimensions.reported_violations,
          supervision_type: dimensions.supervision_type,
          supervision_level: dimensions.supervision_level,
          violation_type: dimensions.violation_type,
        },
      },
      revocations_matrix_distribution_by_officer: {
        filename: "revocations_matrix_distribution_by_officer.txt",
        dimensions: {
          charge_category: dimensions.charge_category,
          metric_period_months: dimensions.metric_period_months,
          reported_violations: dimensions.reported_violations,
          supervision_type: dimensions.supervision_type,
          supervision_level: dimensions.supervision_level,
          violation_type: dimensions.violation_type,
        },
      },
      revocations_matrix_distribution_by_race: {
        filename: "revocations_matrix_distribution_by_race.txt",
        dimensions: {
          risk_level: dimensions.risk_level,
          race: dimensions.race,
          charge_category: dimensions.charge_category,
          metric_period_months: dimensions.metric_period_months,
          reported_violations: dimensions.reported_violations,
          supervision_type: dimensions.supervision_type,
          supervision_level: dimensions.supervision_level,
          violation_type: dimensions.violation_type,
        },
      },
      revocations_matrix_distribution_by_risk_level: {
        filename: "revocations_matrix_distribution_by_risk_level.txt",
        dimensions: {
          risk_level: dimensions.risk_level,
          charge_category: dimensions.charge_category,
          metric_period_months: dimensions.metric_period_months,
          reported_violations: dimensions.reported_violations,
          supervision_type: dimensions.supervision_type,
          supervision_level: dimensions.supervision_level,
          violation_type: dimensions.violation_type,
        },
      },
      revocations_matrix_distribution_by_violation: {
        filename: "revocations_matrix_distribution_by_violation.txt",
        dimensions: {
          charge_category: dimensions.charge_category,
          metric_period_months: dimensions.metric_period_months,
          reported_violations: dimensions.reported_violations,
          supervision_type: dimensions.supervision_type,
          supervision_level: dimensions.supervision_level,
          violation_type: dimensions.violation_type,
        },
      },
      revocations_matrix_filtered_caseload: {
        filename: "revocations_matrix_filtered_caseload.txt",
        dimensions: {
          charge_category: removeAllValue(dimensions.charge_category),
          metric_period_months: dimensions.metric_period_months,
          reported_violations: removeAllValue(dimensions.reported_violations),
          supervision_type: removeAllValue(dimensions.supervision_type),
          supervision_level: removeAllValue(dimensions.supervision_level),
          violation_type: removeAllValue(dimensions.violation_type),
        },
      },
    },
  };
}

const VITALS_COLLECTION = {
  [COLLECTIONS.VITALS]: {
    vitals_summaries: {
      filename: "vitals_summaries.txt",
    },
    vitals_time_series: {
      filename: "vitals_time_series.txt",
    },
  },
};

const PATHWAYS_COLLECTIONS = {
  [COLLECTIONS.PATHWAYS]: {
    prison_population_projection_time_series: {
      filename: "prison_population_projection_time_series.txt",
    },
    supervision_population_projection_time_series: {
      filename: "supervision_population_projection_time_series.txt",
    },
    supervision_to_prison_population_snapshot_by_officer: {
      filename: "supervision_to_prison_population_snapshot_by_officer.txt",
    },
  },
};

function getCollections(stateCode = null) {
  switch (stateCode) {
    case stateCodes.US_MO:
      return {
        ...newRevocations(dimensionsByStateCode[stateCode]),
        ...PATHWAYS_COLLECTIONS,
      };
    case stateCodes.US_PA:
      return newRevocations(dimensionsByStateCode[stateCode]);
    case stateCodes.US_ID:
    case stateCodes.US_ND:
      return {
        ...VITALS_COLLECTION,
        ...PATHWAYS_COLLECTIONS,
      };
    case stateCodes.US_TN:
      return PATHWAYS_COLLECTIONS;
    default:
      throw new Error(
        `getCollections received an unexpected state code: ${stateCode}`,
      );
  }
}

exports.default = getCollections;
