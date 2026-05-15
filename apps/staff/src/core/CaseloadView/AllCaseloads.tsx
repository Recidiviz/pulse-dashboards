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

import { spacing, typography } from "@recidiviz/design-system";
import { observer } from "mobx-react-lite";
import { rem } from "polished";
import React from "react";
import styled from "styled-components";

import { palette } from "~design-system";
import { withPresenterManager } from "~hydration-utils";

import { useRootStore } from "../../components/StoreProvider";
import useIsMobile from "../../hooks/useIsMobile";
import { AllCaseloadsPresenter } from "../../WorkflowsStore/presenters/AllCaseloadsPresenter";
import CaseloadHydrator from "../CaseloadHydrator/CaseloadHydrator";
import { TableViewToggle } from "../OpportunityCaseloadView/TableViewToggle";
import WorkflowsResults from "../WorkflowsResults";
import { AllCaseloadsList } from "./AllCaseloadsList";
import {
  AllCaseloadsTable,
  ClientsResidentsAllCaseloadsTable,
} from "./AllCaseloadsTable";

const HeaderRow = styled.div<{ $isMobile: boolean }>`
  align-items: ${({ $isMobile }) => ($isMobile ? "flex-start" : "center")};
  display: flex;
  flex-direction: ${({ $isMobile }) => ($isMobile ? "column" : "row")};
  gap: ${rem(spacing.md)};
  justify-content: space-between;
  margin-bottom: ${rem(spacing.lg)};
`;

const HeaderText = styled.div<{ $isMobile: boolean }>`
  ${({ $isMobile }) => ($isMobile ? typography.Serif24 : typography.Serif34)}
  color: ${palette.pine2};
  flex: 1;
  margin-right: ${({ $isMobile }) => ($isMobile ? 0 : "20%")};
`;

const AllCaseloadsViz = observer(function AllCaseloadsViz({
  presenter,
}: {
  presenter: AllCaseloadsPresenter;
}) {
  if (presenter.showTnPilotTable) {
    return <AllCaseloadsTable />;
  }

  if (presenter.showClientsResidentsTable) {
    return <ClientsResidentsAllCaseloadsTable presenter={presenter} />;
  }

  return <AllCaseloadsList />;
});

const ManagedComponent = observer(function AllCaseloads({
  presenter,
}: {
  presenter: AllCaseloadsPresenter;
}) {
  const { isMobile } = useIsMobile(true);

  const hydratedHeader = (
    <HeaderRow $isMobile={isMobile}>
      <HeaderText $isMobile={isMobile}>
        {presenter.hydratedHeaderText}
      </HeaderText>
      {presenter.showTableViewToggle && (
        <TableViewToggle presenter={presenter} />
      )}
    </HeaderRow>
  );

  return (
    <CaseloadHydrator
      initial={
        <WorkflowsResults
          headerText={presenter.initialHeaderText}
          callToActionText={presenter.initialCallToActionText}
        />
      }
      hydrated={
        <WorkflowsResults>
          {hydratedHeader}
          <AllCaseloadsViz presenter={presenter} />
        </WorkflowsResults>
      }
      empty={null}
    />
  );
});

function usePresenter() {
  const rootStore = useRootStore();

  return new AllCaseloadsPresenter(rootStore);
}

export const AllCaseloads = withPresenterManager({
  usePresenter,
  ManagedComponent,
  managerIsObserver: true,
});
