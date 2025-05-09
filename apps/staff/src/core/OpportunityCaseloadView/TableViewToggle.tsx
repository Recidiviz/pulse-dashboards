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

import { Button, palette, TooltipTrigger } from "@recidiviz/design-system";
import { observer } from "mobx-react-lite";
import styled from "styled-components/macro";

import ListViewIcon from "../../assets/static/images/oppListView.svg?react";
import TableViewIcon from "../../assets/static/images/oppTableView.svg?react";
import useIsMobile from "../../hooks/useIsMobile";
import { TableViewSelectInterface } from "../../WorkflowsStore/presenters/TableViewSelectPresenter";

const ViewTypeButton = styled(Button)<{ $selected: boolean }>`
  width: 40px;
  height: 40px;
  ${({ $selected }) =>
    $selected ? `color: ${palette.marble4};` : `color: ${palette.slate30};`};
  transition-duration: unset;
`;

const ButtonTooltipTrigger = styled(TooltipTrigger)`
  &:first-child ${ViewTypeButton} {
    border-top-right-radius: 0;
    border-bottom-right-radius: 0;
  }
  &:last-child ${ViewTypeButton} {
    border-top-left-radius: 0;
    border-bottom-left-radius: 0;
  }
`;

const ButtonGroup = styled.div`
  display: inline-flex;
  vertical-align: bottom;
`;

export const TableViewToggle = observer(function TableViewToggle({
  presenter,
}: {
  presenter: TableViewSelectInterface;
}) {
  const { isMobile } = useIsMobile(true);

  return (
    <ButtonGroup>
      <ButtonTooltipTrigger contents={!isMobile && "List View"}>
        <ViewTypeButton
          kind={presenter.showListView ? "primary" : "secondary"}
          shape={"block"}
          $selected={presenter.showListView}
          onClick={() => {
            presenter.showListView = true;
          }}
        >
          <ListViewIcon />
        </ViewTypeButton>
      </ButtonTooltipTrigger>
      <ButtonTooltipTrigger contents={!isMobile && "Table View"}>
        <ViewTypeButton
          kind={presenter.showListView ? "secondary" : "primary"}
          shape={"block"}
          $selected={!presenter.showListView}
          onClick={() => {
            presenter.showListView = false;
          }}
        >
          <TableViewIcon />
        </ViewTypeButton>
      </ButtonTooltipTrigger>
    </ButtonGroup>
  );
});
