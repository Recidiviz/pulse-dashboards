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

import {
  palette,
  Pill,
  spacing,
  TooltipTrigger,
} from "@recidiviz/design-system";
import { observer } from "mobx-react-lite";
import { rem } from "polished";
import React from "react";
import styled from "styled-components/macro";

import { withPresenterManager } from "~hydration-utils";

import { useRootStore } from "../../components/StoreProvider";
import {
  TooltipContainer,
  TooltipSection,
  TooltipSectionDetails,
} from "../sharedComponents";
import { WorkflowsUnderstaffedPresenter } from "./WorkflowsUnderstaffedPresenter";

const UnderstaffedPillElement = styled(Pill)`
  display: flex;
  gap: ${rem(spacing.xs)};
  width: fit-content;
`;

const TooltipDetails = () => {
  return (
    <TooltipContainer>
      <TooltipSection>
        <TooltipSectionDetails>
          One or more of the selected officers are in a ‘Critically
          Understaffed’ office as designated by TDCJ for the current calendar
          month. The frequency and type of contacts due have been adjusted to
          reflect this designation.
        </TooltipSectionDetails>
      </TooltipSection>
    </TooltipContainer>
  );
};

const ManagedComponent = observer(function WorkflowsUnderstaffedPill({
  presenter,
}: {
  presenter: WorkflowsUnderstaffedPresenter;
}) {
  if (!presenter.understaffedOfficerSelected) {
    return null;
  }

  return (
    <TooltipTrigger contents={<TooltipDetails />}>
      <UnderstaffedPillElement
        color={"rgba(226, 244, 255, 1)"}
        filled
        textColor={palette.pine2}
      >
        <i className="fa fa-flag" />
        Critically Understaffed
      </UnderstaffedPillElement>
    </TooltipTrigger>
  );
});

function usePresenter() {
  const {
    workflowsStore: { searchStore },
  } = useRootStore();

  return new WorkflowsUnderstaffedPresenter(searchStore);
}

export const WorkflowsUnderstaffedPill = withPresenterManager({
  usePresenter,
  managerIsObserver: true,
  ManagedComponent,
});
