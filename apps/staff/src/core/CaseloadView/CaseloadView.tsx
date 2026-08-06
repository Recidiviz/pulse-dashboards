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

import { observer } from "mobx-react-lite";
import { rem } from "polished";
import React, { useMemo } from "react";
import styled from "styled-components";

import { useRootStore } from "../../components/StoreProvider";
import useIsMobile from "../../hooks/useIsMobile";
import { AllCaseloadsPresenter } from "../../WorkflowsStore/presenters/AllCaseloadsPresenter";
import { CaseloadSelect } from "../CaseloadSelect";
import CaseloadTypeSelect from "../CaseloadTypeSelect/CaseloadTypeSelect";
import { TableViewToggle } from "../OpportunityCaseloadView/TableViewToggle";
import { PersonLookup } from "../PersonLookup";
import { WorkflowsNavLayout } from "../WorkflowsLayouts";
import { WorkflowsResultsHeader } from "../WorkflowsResults";
import { AllCaseloads } from "./AllCaseloads";

const SelectRow = styled.div<{ $isMobile: boolean }>`
  display: flex;
  flex-direction: ${({ $isMobile }) => ($isMobile ? "column" : "row")};
  gap: ${rem(8)};
  align-items: ${({ $isMobile }) => ($isMobile ? "stretch" : "flex-start")};
`;

export const CaseloadView: React.FC = observer(function CaseloadView() {
  const { isMobile } = useIsMobile(true);
  const rootStore = useRootStore();
  const presenter = useMemo(
    () => new AllCaseloadsPresenter(rootStore),
    [rootStore],
  );

  const { isTypesenseSearchEnabled } = presenter;

  const header = (
    <WorkflowsResultsHeader
      headerText={presenter.headerText}
      callToActionText={presenter.headerCallToActionText}
      verticallyCentered={!isTypesenseSearchEnabled}
      align="center"
    />
  );

  return (
    <WorkflowsNavLayout>
      {isTypesenseSearchEnabled && header}
      <CaseloadTypeSelect />
      <SelectRow $isMobile={isMobile}>
        <CaseloadSelect />
        <PersonLookup />
        {presenter.showTableViewToggleInSearchRow && (
          <TableViewToggle presenter={presenter} />
        )}
      </SelectRow>
      <AllCaseloads
        presenter={presenter}
        initialContent={isTypesenseSearchEnabled ? null : header}
      />
    </WorkflowsNavLayout>
  );
});
