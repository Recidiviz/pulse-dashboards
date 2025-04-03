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

import { rgba } from "polished";
import { components, OptionProps } from "react-select";
import styled from "styled-components/macro";

import { SelectOption } from "../../../CaseloadSelect";
import { SelectOptionWithLocation } from "../../types";

const SelectOptionWrapper = styled.div`
  display: flex;
  flex-flow: row;
  justify-content: space-between;
`;
const SelectOptionLocation = styled.div`
  color: ${rgba(43, 84, 105, 0.5)};
`;

export const Option = ({
  children,
  ...props
}: OptionProps<SelectOptionWithLocation | SelectOption, true>) => {
  return (
    <components.Option className="fs-exclude" {...props}>
      <SelectOptionWrapper>
        <div>{children}</div>
        {"location" in props.data && (
          <SelectOptionLocation>{props.data.location}</SelectOptionLocation>
        )}
      </SelectOptionWrapper>
    </components.Option>
  );
};
