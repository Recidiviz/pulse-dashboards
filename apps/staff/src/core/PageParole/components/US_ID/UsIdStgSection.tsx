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
  ParoleSmallFactValue,
  ParoleSubsection,
  ParoleSubsectionCaption,
  ParoleSubsectionHeading,
  ParoleSubsectionTitle,
} from "../ParoleCaseProfileStyles";

/**
 * US_ID's Gang / Security Threat Group (STG) subsection.
 *
 * @param stg - The resident's current STG affiliations, as the backend sends
 *   them: group names joined by "; ". Undefined when there are none.
 */
export function UsIdStgSection({ stg }: { stg: string | undefined }) {
  return (
    <ParoleSubsection>
      <ParoleSubsectionHeading>
        <ParoleSubsectionTitle>
          Gang / Security Threat Group (STG)
        </ParoleSubsectionTitle>
        {!stg && (
          <ParoleSubsectionCaption>
            No STG affiliation on record.
          </ParoleSubsectionCaption>
        )}
      </ParoleSubsectionHeading>
      {stg && <ParoleSmallFactValue>{stg}</ParoleSmallFactValue>}
    </ParoleSubsection>
  );
}
