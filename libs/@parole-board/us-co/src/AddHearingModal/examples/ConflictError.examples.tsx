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

import {
  calendarApiError,
  september2026Config,
  september2026MonthDetail,
} from "~@parole-board/common/fixtures";

import { facilityValue } from "../hearingChoices";
import { ExampleAddHearingModal } from "./support/ExampleAddHearingModal";

export default {};

// The server's CONFLICT message when another editor added the same hearing first.
export const Default = () => (
  <ExampleAddHearingModal
    config={september2026Config}
    month={september2026MonthDetail}
    initialChoice={facilityValue("resource-FCF")}
    initialDay="2026-09-14"
    send={() =>
      Promise.reject(
        calendarApiError("CONFLICT", "FCF is already on September 14."),
      )
    }
    submitOnOpen
  />
);
