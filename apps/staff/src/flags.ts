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

// eslint-disable-next-line no-nested-ternary
export default import.meta.env.VITE_DEPLOY_ENV === "production"
  ? {
      enableTepeAdditionalFields: false,
      // TODO(395): Set to true when we have debugged the issues with the exit rate calculations
      enableRevocationRateByExit: false,
      enableVitalsGoalLine: false,
      defaultMetricBackend: "NEW",
      metricBackendOverrides: {
        // The new backend doesn't have officer names yet
        supervisionToPrisonPopulationByOfficer: "OLD",
        // The new backend doesn't handle projections yet
        projectedPrisonPopulationOverTime: "OLD",
        projectedSupervisionPopulationOverTime: "OLD",
      },
    }
  : import.meta.env.VITE_DEPLOY_ENV === "staging"
    ? {
        enableTepeAdditionalFields: true,
        enableRevocationRateByExit: false,
        enableVitalsGoalLine: false,
        defaultMetricBackend: "NEW",
        metricBackendOverrides: {
          // The new backend doesn't have officer names yet
          supervisionToPrisonPopulationByOfficer: "OLD",
          // The new backend doesn't handle projections yet
          projectedPrisonPopulationOverTime: "OLD",
          projectedSupervisionPopulationOverTime: "OLD",
        },
      }
    : {
        // Development
        enableTepeAdditionalFields: true,
        enableRevocationRateByExit: false,
        enableVitalsGoalLine: false,
        defaultMetricBackend: "NEW",
        metricBackendOverrides: {
          // The new backend doesn't have officer names yet
          supervisionToPrisonPopulationByOfficer: "OLD",
          // The new backend doesn't handle projections yet
          projectedPrisonPopulationOverTime: "OLD",
          projectedSupervisionPopulationOverTime: "OLD",
        },
      };
