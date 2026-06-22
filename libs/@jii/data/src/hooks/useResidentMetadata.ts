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

import { WorkflowsResidentMetadata, WorkflowsResidentRecord } from "~datatypes";

import { useSingleResidentContext } from "../contexts/SingleResidentContext";

type StateCode = WorkflowsResidentRecord["metadata"]["stateCode"];

/**
 * Returns the current resident's metadata, narrowed to the correct type
 * for the provided `stateCode`. Will throw if the state code doesn't match
 * the current resident's state code. Must have a `SingleResidentContextProvider`
 * among its ancestors when called.
 */
export function useResidentMetadata<S extends NonNullable<StateCode>>(
  stateCode: S,
): WorkflowsResidentMetadata<S> {
  const {
    resident: { metadata },
  } = useSingleResidentContext();

  if (stateCode === metadata.stateCode) {
    // typescript can't infer this correctly,
    // but if the state codes match then this should be a safe assertion
    return metadata as WorkflowsResidentMetadata<S>;
  }

  throw new Error(
    `Expecting ${stateCode} metadata but got ${metadata.stateCode}`,
  );
}
