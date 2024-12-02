// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2024 Recidiviz, Inc.
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

import * as Styled from "../../CaseDetails.styles";
import { NOT_SURE_YET_OPTION } from "../constants";
import { RadioInputProps } from "./types";

export function RadioInput({
  options,
  selection,
  updateSelection,
}: RadioInputProps) {
  return (
    <Styled.MultiSelectContainer>
      {options.map((option) => {
        const selected = selection === option;
        const hasNoSelection =
          selection === NOT_SURE_YET_OPTION || selection === null;
        const isDefaultNotSureYetSelected =
          option === NOT_SURE_YET_OPTION && selection === null;

        return (
          <Styled.SelectChip
            key={option}
            selected={selected || isDefaultNotSureYetSelected}
            onClick={() => updateSelection(option)}
            isNotSureYetOption={hasNoSelection}
          >
            {option}
          </Styled.SelectChip>
        );
      })}
    </Styled.MultiSelectContainer>
  );
}
