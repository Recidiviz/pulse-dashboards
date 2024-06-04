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
  padding: 20px;
  margin-bottom: 50px;
`;

export const WelcomeTitle = styled.div`
  ${typography.Body14}
  font-weight: 700;
  margin-bottom: 5px;
`;

export const WelcomeDescription = styled.div`
  ${typography.Body14}
`;

export const Cases = styled.div``;

export const CaseListContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
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

export const Cell = styled.div``;

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
  width: fit-content;
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
