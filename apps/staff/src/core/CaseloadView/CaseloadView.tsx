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

import { rem } from "polished";
import React from "react";
import styled from "styled-components";

import useIsMobile from "../../hooks/useIsMobile";
import { CaseloadSelect } from "../CaseloadSelect";
import CaseloadTypeSelect from "../CaseloadTypeSelect/CaseloadTypeSelect";
import { PersonLookup } from "../PersonLookup";
import { WorkflowsNavLayout } from "../WorkflowsLayouts";
import { AllCaseloads } from "./AllCaseloads";

const SelectRow = styled.div<{ $isMobile: boolean }>`
  display: flex;
  flex-direction: ${({ $isMobile }) => ($isMobile ? "column" : "row")};
  gap: ${rem(8)};
  align-items: ${({ $isMobile }) => ($isMobile ? "stretch" : "flex-start")};
`;

export const CaseloadView: React.FC = () => {
  const { isMobile } = useIsMobile(true);

  return (
    <WorkflowsNavLayout>
      <CaseloadTypeSelect />
      <SelectRow $isMobile={isMobile}>
        <CaseloadSelect />
        <PersonLookup />
      </SelectRow>
      <AllCaseloads />
    </WorkflowsNavLayout>
  );
};
