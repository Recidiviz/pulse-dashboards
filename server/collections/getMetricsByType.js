// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2022 Recidiviz, Inc.
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
const { default: NewRevocationsMetrics } = require("./NewRevocationsMetrics");
const { default: BaseMetrics } = require("./BaseMetrics");
const { COLLECTIONS } = require("../constants/collections");

function getMetricsByType(metricType, stateCode) {
  switch (metricType) {
    case COLLECTIONS.NEW_REVOCATION:
      return new NewRevocationsMetrics(metricType, stateCode);
    case COLLECTIONS.POPULATION_PROJECTIONS:
    case COLLECTIONS.VITALS:
    case COLLECTIONS.PATHWAYS:
      return new BaseMetrics(metricType, stateCode);
    default:
      throw new Error(`No such metric type ${metricType} for ${stateCode}`);
  }
}

exports.default = getMetricsByType;
