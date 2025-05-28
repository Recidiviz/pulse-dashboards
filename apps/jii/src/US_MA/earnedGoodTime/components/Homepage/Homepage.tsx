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

import { pick } from "lodash";

import { useEGTDataContext } from "../EGTDataContext/context";

export const Homepage = () => {
  const { data } = useEGTDataContext();
  // this is a placeholder UI as proof of concept, will replace shortly
  return (
    <div>
      <article>
        <h2>Important dates</h2>
        <pre>
          {JSON.stringify(
            pick(data, [
              "adjustedMaxReleaseDate",
              "originalMaxReleaseDate",
              "rtsDate",
              "totalStateCreditDaysCalculated",
            ]),
            undefined,
            2,
          )}
        </pre>
      </article>

      <article>
        <h2>Time you've earned</h2>
        <pre>
          {JSON.stringify(
            pick(data, [
              "totalCompletionCredit",
              "totalStateCredit",
              "creditActivity",
            ]),
            undefined,
            2,
          )}
        </pre>
      </article>
    </div>
  );
};
