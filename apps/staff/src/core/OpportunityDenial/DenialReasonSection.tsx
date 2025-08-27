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

import Checkbox from "../../components/Checkbox/Checkbox";
import { DenialReasonsMap } from "../../WorkflowsStore";
import { MenuItem, SidePanelHeader } from "../sharedComponents";

/**
 * A section containing a list of denial reason items (i.e. the relevant labels and
 * checkboxes for the given denial reasons).
 */
export const DenialReasonSection = function DenialReasonSection({
  denialReasonsMap,
  selectedReasons,
  sectionHeading,
  handleSelectReason,
  disabledReasons,
}: {
  denialReasonsMap: DenialReasonsMap;
  selectedReasons: string[];
  disabledReasons: string[];
  handleSelectReason: (code: string) => void;
  sectionHeading: string;
  sectionSubheading?: string;
}) {
  return (
    <>
      <SidePanelHeader>{sectionHeading}</SidePanelHeader>
      {/* TODO(#9163): Add optional section for indefinite snooze subheading */}
      {Object.entries(denialReasonsMap).map(([code, description]) => {
        const disabled = disabledReasons.includes(code);
        return (
          <MenuItem key={code} disabled={disabled}>
            <Checkbox
              value={code}
              checked={selectedReasons.includes(code)}
              name={`denial_reason-${code}`}
              onChange={() => handleSelectReason(code)}
              disabled={disabled}
            >
              {description}
            </Checkbox>
          </MenuItem>
        );
      })}
    </>
  );
};
