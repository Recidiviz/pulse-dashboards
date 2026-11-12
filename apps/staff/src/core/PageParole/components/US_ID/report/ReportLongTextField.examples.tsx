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

import { useState } from "react";

import { ParoleBoardReportMode } from "../../../../../ParoleStore/presenters/ParoleBoardReportPresenter";
import { ReportLongTextField } from "./ReportLongTextField";

// Required by the custom CSF indexer. Title auto-derives from the file path.
export default {};

// Description of Crime(s) limits each box to 1,500 characters.
const MAX_LENGTH = 1500;

const DESCRIPTION =
  "On the night of August 3, 2025, the resident entered a convenience store, " +
  "showed the clerk a handgun in their waistband, and demanded the cash in " +
  "the register. They left with about $300. Police stopped their car two " +
  "blocks away and found the cash and the handgun inside.\n\n" +
  "The resident pleaded guilty to Robbery under a plea agreement.";

const FULL_DESCRIPTION = DESCRIPTION.repeat(
  Math.ceil(MAX_LENGTH / DESCRIPTION.length),
).slice(0, MAX_LENGTH);

/**
 * A Description field backed by local state, so typing saves as it would
 * against the report.
 */
function DescriptionField({
  mode,
  startingValue,
  saveFails = false,
}: {
  mode: ParoleBoardReportMode;
  startingValue: string | null;
  saveFails?: boolean;
}) {
  const [value, setValue] = useState(startingValue);

  return (
    <div style={{ width: 760, padding: 24 }}>
      <ReportLongTextField
        mode={mode}
        label="Description"
        placeholder="Enter description"
        maxLength={MAX_LENGTH}
        value={value}
        onSave={async (text) => {
          if (saveFails) throw new Error("Couldn't reach Firestore");
          setValue(text);
        }}
      />
    </div>
  );
}

export const EditMode = () => (
  <DescriptionField mode="EDIT" startingValue={DESCRIPTION} />
);

export const EmptyField = () => (
  <DescriptionField mode="EDIT" startingValue={null} />
);

export const AtLimit = () => (
  <DescriptionField mode="EDIT" startingValue={FULL_DESCRIPTION} />
);

export const ReadMode = () => (
  <DescriptionField mode="READ" startingValue={DESCRIPTION} />
);

export const EmptyReadMode = () => (
  <DescriptionField mode="READ" startingValue={null} />
);

/**
 * Every save fails. Type in the box, and the error shows once the text tries
 * to save.
 */
export const SaveFails = () => (
  <DescriptionField mode="EDIT" startingValue={DESCRIPTION} saveFails />
);
