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

import { Card } from "~@jii/common-ui";
import { formatFullDate } from "~@jii/data";

import { RNADescription, RNAHeading } from "../styles";
import { useRNAFormContext } from "../UsNcRNAFormContext/UsNcRNAFormContextProvider";

/**
 * Landing page for Risks and Needs Assessment when the form has been completed.
 */
export function UsNcRNASuccessfulSubmission() {
  const { form } = useRNAFormContext();

  return (
    <Card>
      <RNAHeading>Thanks for filling out your Self-Report</RNAHeading>
      <RNADescription>
        You completed the form on {formatFullDate(form.updatedAt)}. A staff
        member will be in touch about next steps.
      </RNADescription>
    </Card>
  );
}
