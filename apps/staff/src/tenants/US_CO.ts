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

import { TenantConfig } from "../core/models/types";
import * as dashboard from "../RootStore/TenantStore/dashboardTenants";

const US_CO_CONFIG = {
  name: "Colorado",
  stateCode: "CO",
  // TODO(OBT-40957): Set the real SSO domain for CO users once known.
  availableStateCodes: [dashboard.US_CO],
  enableUserRestrictions: false,
  navigation: {
    parole: ["docket"],
  },
  // TODO(OBT-43104): Add "alerts" once the CO-only Alerts section is built.
  paroleConfig: {
    sections: [
      "offenseHistory",
      "riskAssessment",
      "programParticipation",
      "conductHistory",
      "attachments",
    ],
    docketSubheading: "Hearings in the next two weeks",
    docketSearchEnabled: true,
    conductClassificationColors: {
      "Class 1": "BLUE",
      "Class 2": "GREEN",
      "Class 3": "PURPLE",
    },
    // OBT-43413: CO-specific Risk Score Trajectory redesign (raw-score axis,
    // CARAS component list, RT/CST tools, "Entire CTAP Suite" aggregate
    // view). Other tenants (e.g. US_ID) omit this and keep the original
    // LSI/PIT/CARAS/SRT percent-of-max behavior.
    riskAssessmentConfig: {
      tools: ["LSI", "PIT", "CARAS", "SRT", "RT", "CST"],
      aggregateView: {
        label: "Entire CTAP Suite",
        tools: ["RT", "SRT", "PIT"],
      },
    },
  },
} satisfies TenantConfig<"US_CO">;

export default US_CO_CONFIG;
