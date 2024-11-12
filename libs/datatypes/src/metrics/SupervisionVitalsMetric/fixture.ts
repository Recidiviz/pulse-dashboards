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

import {
  rawExcludedSupervisionOfficerFixture,
  rawSupervisionOfficerFixture,
} from "../../people/Staff/Supervision/Insights/SupervisionOfficer/fixture";
import { VITALS_METRIC_IDS } from "../utils/constants";
import {
  RawSupervisionVitalsMetric,
  supervisionVitalsMetricSchema,
} from "./schema";

const timelyContactValues = [
  {
    metricValue: 87.0,
    metric30DDelta: -7.0,
  },
  {
    metricValue: 57.0,
    metric30DDelta: -1.0,
  },
  {
    metricValue: 31.0,
    metric30DDelta: 1.2,
  },
  {
    metricValue: 22.0,
    metric30DDelta: 3.4,
  },
  {
    metricValue: 50.0,
    metric30DDelta: -3.0,
  },
  {
    metricValue: 22.0,
    metric30DDelta: -0.2,
  },
  {
    metricValue: 79.0,
    metric30DDelta: 5.9,
  },
  {
    metricValue: 89.0,
    metric30DDelta: 1.5,
  },
];

const timelyRiskAssessmentValues = [
  {
    metricValue: 99.0,
    metric30DDelta: -4.0,
  },
  {
    metricValue: 86.0,
    metric30DDelta: -1.7,
  },
  {
    metricValue: 97.0,
    metric30DDelta: 0.7,
  },
  {
    metricValue: 98.0,
    metric30DDelta: 0.9,
  },
  {
    metricValue: 89.0,
    metric30DDelta: -5.9,
  },
  {
    metricValue: 90.0,
    metric30DDelta: 1.0,
  },
  {
    metricValue: 100.0,
    metric30DDelta: 0.0,
  },
  {
    metricValue: 79.0,
    metric30DDelta: -3.4,
  },
];

const allOfficerPseudoIds = rawSupervisionOfficerFixture
  .map((o) => o.pseudonymizedId)
  .concat(rawExcludedSupervisionOfficerFixture.map((o) => o.pseudonymizedId));
export const rawSupervisionVitalsMetricFixture: RawSupervisionVitalsMetric[] = [
  {
    metricId: VITALS_METRIC_IDS.enum.timely_contact,
    vitalsMetrics: timelyContactValues.map((contact, idx) => {
      return { ...contact, officerPseudonymizedId: allOfficerPseudoIds[idx] };
    }),
  },
  {
    metricId: VITALS_METRIC_IDS.enum.timely_risk_assessment,
    vitalsMetrics: timelyRiskAssessmentValues.map((assessment, idx) => {
      return {
        ...assessment,
        officerPseudonymizedId: allOfficerPseudoIds[idx],
      };
    }),
  },
];

export const supervisionOfficerVitalsMetricFixture =
  rawSupervisionVitalsMetricFixture.map((m) =>
    supervisionVitalsMetricSchema.parse(m),
  );
