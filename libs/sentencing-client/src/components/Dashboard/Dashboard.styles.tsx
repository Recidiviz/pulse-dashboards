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

import { palette, typography } from "@recidiviz/design-system";
import styled from "styled-components/macro";

export const PageContainer = styled.div`
  width: 100%;
  height: 100%;
  padding: 50px 100px;

  a {
    color: ${palette.text.normal};
  }
`;

export const WelcomeMessage = styled.div`
  background-color: ${palette.marble3};
  padding: 13px 30px 30px 30px;
  margin-bottom: 50px;
`;

export const CloseButton = styled.div`
  display: flex;
  justify-content: flex-end;
  width: 100%;
  height: 20px;
  position: relative;

  &::before {
    content: "";
    width: 1px;
    height: 14px;
    background: ${palette.slate70};
    position: absolute;
    rotate: 45deg;
  }

  &::after {
    content: "";
    width: 1px;
    height: 14px;
    background: ${palette.slate70};
    position: absolute;
    rotate: -45deg;
  }

  &:hover {
    cursor: pointer;
  }
`;

export const WelcomeTitle = styled.div`
  ${typography.Body14}
  font-weight: 700;
  margin-bottom: 5px;
`;

export const WelcomeDescription = styled.div`
  ${typography.Body14}
  margin-bottom: 0;
  max-width: 80%;
`;

export const Cases = styled.div``;

export const CaseListContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

export const Header = styled.div`
  display: flex;
  justify-content: space-between;
`;

export const TitleWrapper = styled.div`
  display: flex;
  flex-direction: column;
`;

export const CaseOverviewItem = styled.div`
  border: 2px solid ${palette.slate30};
  border-radius: 5px;
  background: transparent;
  position: relative;
  z-index: 1;

  &::before {
    content: "";
    height: 100%;
    width: 5px;
    background-color: ${palette.slate30};
    position: absolute;
    left: 0px;
    top: 0px;
    z-index: 0;
    border-radius: 3px 0px 0px 3px;
  }
`;

export const Cell = styled.div<{
  sortable?: boolean;
  isAscending?: boolean;
  isActiveSort?: boolean;
}>`
  display: flex;
  align-items: center;
  position: relative;
  padding-right: 10px;

  ${({ sortable, isAscending, isActiveSort }) =>
    sortable &&
    `
      &::after {
        content: "";
        display: ${isActiveSort ? "block" : "none"};
        width: 0; 
        height: 0; 
        border-left: 6px solid transparent;
        border-right: 6px solid transparent;
        border-${isAscending ? "bottom" : "top"}: 6px solid ${palette.pine2};
        margin-left: 5px;
      }
      
      &:hover {
        cursor: pointer;
      }

      &:hover::after {
        display: block;
      }
    `}
`;

export const CaseOverviewWrapper = styled.div<{ isHeader?: boolean }>`
  padding: ${({ isHeader }) => (isHeader ? "0" : "18px")} 24px;
  display: grid;
  grid-template-columns: 2fr repeat(4, 1fr) 2fr;
  column-gap: 20px;

  & > ${Cell} {
    &:first-child {
      ${({ isHeader }) => !isHeader && `color: ${palette.pine2};`}
    }
    align-self: center;
  }

  & > ${Cell}:last-child {
    justify-self: flex-end;
  }
`;

export const SectionTitle = styled.div`
  ${typography.Body32}
  color: ${palette.slate85};
  margin-bottom: 0;
`;

export const SectionSubtitle = styled.div`
  ${typography.Body19}
  margin-bottom: 35px;
`;

export const Button = styled.button`
  width: 117px;
  justify-self: end;
  background-color: ${palette.slate85};
  color: white;
  border: 1px solid transparent;
  border-radius: 4px;
  padding: 8px 16px;

  &:hover {
    cursor: pointer;
    background-color: ${palette.slate80};
  }
`;

export const DropdownContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  position: relative;
`;

export const DropdownButton = styled.button<{ isOpen?: boolean }>`
  display: flex;
  align-items: center;
  width: fit-content;
  padding: 12px 16px;
  background-color: transparent;
  border: 1px solid ${palette.slate30};
  border-radius: 40px;
  color: ${palette.pine3};
  margin-bottom: 1px;

  &::after {
    content: "";
    width: 0;
    height: 0;
    border-left: 6px solid transparent;
    border-right: 6px solid transparent;
    margin-left: 5px;
    ${({ isOpen }) =>
      isOpen
        ? `border-bottom: 6px solid ${palette.pine3}`
        : `border-top: 6px solid ${palette.pine3}`};
  }
`;

export const Dropdown = styled.div`
  width: 208px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  background-color: ${palette.white};
  padding: 16px;
  border: 1px solid ${palette.slate30};
  border-radius: 10px;
  position: absolute;
  top: 44px;
  z-index: 100;
`;

export const DropdownHeader = styled.div`
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
`;

export const ClearButton = styled.div`
  color: ${palette.text.links};

  &:hover {
    cursor: pointer;
  }
`;

export const DropdownOption = styled.div<{ isNested?: boolean }>`
  display: flex;
  align-items: center;
  gap: 8px;
  ${({ isNested }) => isNested && `margin-left: 20px;`}

  input[type="checkbox"] {
    accent-color: rgba(98, 98, 98, 1);
  }

  label {
    margin-bottom: unset;
  }
`;
