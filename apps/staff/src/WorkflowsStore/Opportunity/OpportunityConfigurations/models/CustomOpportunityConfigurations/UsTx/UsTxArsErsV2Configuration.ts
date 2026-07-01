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

import { ApiOpportunityConfiguration } from "../../ApiOpportunityConfigurationImpl";

export class UsTxArsErsV2Configuration extends ApiOpportunityConfiguration {
  // TODO(#9880): Add custom denial reason snooze lengths to admin panel
  get maxSnoozeDaysByDenialReason(): Record<string, number | undefined> {
    return { ...super.maxSnoozeDaysByDenialReason, DISCRETION: 365 };
  }

  get markSubmittedOnFormDownload() {
    return false;
  }

  // Granted records (metadata.grantedAt set by ETL) have isEligible: false in
  // Firestore. We need to fetch them so the "Approved by Supervisor" tab is populated
  // for 90 days after the opportunity is granted.
  get hydrateIneligibleRecordsInOpportunityManager() {
    return true;
  }

  get hidePreviewModal(): boolean {
    return true;
  }

  get enableSupervisorReviewChain(): boolean {
    return true;
  }
}
