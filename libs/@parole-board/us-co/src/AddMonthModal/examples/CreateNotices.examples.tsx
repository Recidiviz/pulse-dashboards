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

import { CreateNotices } from "../CreateNotices";

export default {};

// The copy months.create returns, from the draft generator's notices.
const BUSINESS_MEETING_NOTICE =
  "Business Mtg entries weren't added because their schedule isn't set yet. Add them by hand if this month needs any.";

// After adding November and December 2026, the month view shows what
// months.create reported, grouped by month, until the editor dismisses it.
// The design has no notice state.
export const Default = () => (
  <CreateNotices
    groups={[
      {
        year: 2026,
        month: 11,
        messages: [BUSINESS_MEETING_NOTICE],
      },
      {
        year: 2026,
        month: 12,
        messages: [
          BUSINESS_MEETING_NOTICE,
          "2 hearings fall after December ends and weren't added: DCC and SCC on Thursday, January 1.",
        ],
      },
    ]}
    onDismiss={() => undefined}
  />
);
