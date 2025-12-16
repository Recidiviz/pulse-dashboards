// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2025 Recidiviz, Inc.
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

import assertNever from "assert-never";

import { stateCodeFromCurrentUrl } from "~@jii/data";
import { UsAzRouter } from "~@jii/US_AZ";
import { UsIdRouter } from "~@jii/US_ID";
import { UsMaRouter } from "~@jii/US_MA";
import { UsNcRouter } from "~@jii/US_NC";
import { UsNeRouter } from "~@jii/US_NE";
import { UsTnRouter } from "~@jii/US_TN";
import { UsUtRouter } from "~@jii/US_UT";

export function StateSpecificRouter() {
  const stateCode = stateCodeFromCurrentUrl();

  if (!stateCode) return null;

  switch (stateCode) {
    case "US_AZ":
      return <UsAzRouter />;
    case "US_ID":
      return <UsIdRouter />;
    case "US_MA":
      return <UsMaRouter />;
    case "US_NC":
      return <UsNcRouter />;
    case "US_NE":
      return <UsNeRouter />;
    case "US_TN":
      return <UsTnRouter />;
    case "US_UT":
      return <UsUtRouter />;
    default:
      return assertNever(stateCode);
  }
}
