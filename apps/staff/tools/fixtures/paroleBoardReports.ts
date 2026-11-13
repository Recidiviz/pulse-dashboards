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

import { subDays } from "date-fns";

import { paroleHearingsFixtureByState } from "~datatypes";

// The first US_ID resident on the Parole docket fixture, so the report is for
// the same hearing the offline docket shows.
const [hearing] = paroleHearingsFixtureByState.US_ID;

const PHI_EMAIL = "phi@example.com";
const EDITED_AT = subDays(new Date(), 1);

/**
 * A US_ID PHI report in progress, for nx offline staff. Offline Parole cases
 * have no record id, so this keys the documents the way the residents
 * collection keys a record: the state code, then the resident's displayed id.
 */
export const paroleBoardReportsFixture = {
  recordId: `us_id_${hearing.displayId}`,
  reportId: "fixture_report",
  parent: {
    stateCode: "US_ID",
    activeReportId: "fixture_report",
    latestReport: {
      reportId: "fixture_report",
      status: "IN_PROGRESS",
      hearingDate: hearing.hearingDate,
    },
  },
  report: {
    stateCode: "US_ID",
    pseudonymizedId: hearing.pseudonymizedId,
    hearing: {
      hearingDate: hearing.hearingDate,
      hearingType: hearing.hearingType,
    },
    status: "IN_PROGRESS",
    createdBy: PHI_EMAIL,
    createdAt: EDITED_AT,
    updatedBy: PHI_EMAIL,
    updatedAt: EDITED_AT,
    sections: {
      offenseInformation: {
        fields: {
          psychologicalEvaluation: {
            value: "NONE",
            updatedBy: PHI_EMAIL,
            updatedAt: EDITED_AT,
          },
          victim: { value: "YES", updatedBy: PHI_EMAIL, updatedAt: EDITED_AT },
        },
      },
      communityReentryPlan: {
        fields: {
          housing: {
            value:
              "Plans to live with a sibling in town. The sibling confirmed " +
              "the room is available, and no one else in the home is on " +
              "supervision.",
            updatedBy: PHI_EMAIL,
            updatedAt: EDITED_AT,
          },
          employment: {
            value:
              "Has an offer to return to a former job at a warehouse, " +
              "starting the week after release.",
            updatedBy: PHI_EMAIL,
            updatedAt: EDITED_AT,
          },
        },
      },
      summary: {
        fields: {
          summary: {
            value:
              "The interview took place in the facility's visiting room, with " +
              "no third party present. The resident was cooperative and " +
              "answered every question, and spoke about the offense with " +
              "remorse.\n\n" +
              "They completed two programs since their last hearing and plan " +
              "to live with family after release.",
            updatedBy: PHI_EMAIL,
            updatedAt: EDITED_AT,
          },
          fourthAmendmentWaiver: {
            value: "YES",
            updatedBy: PHI_EMAIL,
            updatedAt: EDITED_AT,
          },
        },
      },
    },
  },
};
