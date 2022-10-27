// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2022 Recidiviz, Inc.
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
  animation,
  Button,
  palette,
  TooltipTrigger,
} from "@recidiviz/design-system";
import { observer } from "mobx-react-lite";
import { rem, transparentize } from "polished";
import styled from "styled-components/macro";

import { EarlyTerminationForm } from "../../../../WorkflowsStore";
import { useOpportunityFormContext } from "../../OpportunityFormContext";
import FormTextarea from "./FormTextarea";

const AddALine = styled.button.attrs({ type: "button" })`
  display: inline-block;
  background-color: ${transparentize(0.9, palette.signal.highlight)};
  box-sizing: content-box;
  border-width: 0;
  border-bottom: 1px solid ${palette.signal.links};
  color: ${palette.slate85};
  transition: background-color ease-in ${animation.defaultDurationMs}ms;

  &:hover {
    background-color: ${transparentize(0.7, palette.signal.highlight)};
    cursor: pointer;
  }
`;

const AddLineListItem = styled.li`
  position: relative;
`;

const REMOVE_ICON_SIZE = 7;

const RemoveButtonContainer = styled.span`
  position: absolute;
  top: 50%;
  right: ${rem(REMOVE_ICON_SIZE / 2)};
  margin-top: ${rem(-10)};
`;

const RemoveButton = styled(Button).attrs({
  kind: "link",
  icon: "Close",
  iconSize: REMOVE_ICON_SIZE,
})`
  color: black;
`;

const AdditionalDepositionLineFormTextarea = styled(FormTextarea)`
  vertical-align: text-top;
  width: 100%;
`;

const AdditionalDepositionLines: React.FC = () => {
  const opportunityForm = useOpportunityFormContext() as EarlyTerminationForm;

  return (
    <>
      {opportunityForm.additionalDepositionLines.map((key) => {
        return (
          <AddLineListItem key={key}>
            <AdditionalDepositionLineFormTextarea name={key} minRows={2} />
            <RemoveButtonContainer>
              <TooltipTrigger contents={<span>Remove</span>}>
                <RemoveButton
                  onClick={() => opportunityForm.removeDepositionLine(key)}
                />
              </TooltipTrigger>
            </RemoveButtonContainer>
          </AddLineListItem>
        );
      })}
      <li>
        <AddALine onClick={() => opportunityForm.addDepositionLine()}>
          Add a line...
        </AddALine>
      </li>
    </>
  );
};

export default observer(AdditionalDepositionLines);
