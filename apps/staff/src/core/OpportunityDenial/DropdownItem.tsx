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

import styled from "styled-components/macro";

import { palette } from "~design-system";

export const DropdownItem = styled.div<{ first?: boolean }>`
  color: ${(props) => (props.first ? palette.pine3 : palette.pine4)};
  border-bottom: ${(props) =>
    props.first ? `1px solid ${palette.slate20}` : 0};
  padding: ${(props) => (props.first ? "1rem" : "0.25rem 1rem 0.25rem")};
  line-height: 16px;

  > .Checkbox__container {
    height: 100%;
    width: 100%;
    margin-bottom: 0;
    display: inline-block;

    &:hover {
      > .Checkbox__box {
        background-color: ${palette.slate10};
      }

      > .Checkbox__input:checked ~ .Checkbox__box {
        background-color: ${palette.signal.links};
      }
    }

    > .Checkbox__label {
      top: -1px;
      white-space: normal;
    }

    > .Checkbox__box {
      border-radius: 3px;
    }

    > .Checkbox__input:checked ~ .Checkbox__box {
      background-color: ${palette.signal.highlight};
      border-color: transparent;
    }
  }
`;
