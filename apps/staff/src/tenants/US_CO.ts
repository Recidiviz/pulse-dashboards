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
import { UsCoOlderDisciplinariesSection } from "../core/PageParole/components/US_CO/UsCoOlderDisciplinariesSection";
import * as dashboard from "../RootStore/TenantStore/dashboardTenants";

const US_CO_CONFIG = {
  name: "Colorado",
  stateCode: "CO",
  domain: "state.co.us",
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
      "riskAndNeedsAssessment",
      "programParticipation",
      "conductHistory",
      "communitySupervisionPlan",
    ],
    docketSubheading: "Hearings in the next two weeks",
    docketSearchEnabled: true,
    // CO's scheduled hearing dates are truncated to the 1st of the month in
    // the source table (see us_co/parole_board_client_profile.py), so a
    // hearing set for this month can already be "in the past" by the 2nd.
    // The look-back covers a full month so that date stays on the docket for
    // as long as it's genuinely still this month's hearing.
    docketWindowDaysBefore: 31,
    docketWindowDaysAfter: 14,
    conductHistory: {
      classificationColors: {
        "Class 1": "BLUE",
        "Class 2": "GREEN",
        "Class 3": "PURPLE",
      },
      visibleYears: 1,
      children: UsCoOlderDisciplinariesSection,
    },
    riskAssessmentConfig: {
      tools: ["LSIR", "PIT", "CARAS", "SRT", "RT", "CST"],
      aggregateView: {
        label: "Entire CTAP Suite",
        tools: ["RT", "SRT", "PIT"],
      },
    },
  },
} satisfies TenantConfig<"US_CO">;

export default US_CO_CONFIG;
