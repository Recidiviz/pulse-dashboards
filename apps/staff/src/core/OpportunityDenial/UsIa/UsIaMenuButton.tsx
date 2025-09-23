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

import { TooltipTrigger } from "@recidiviz/design-system";
import { observer } from "mobx-react-lite";

import { Dropdown, DropdownMenu } from "~design-system";

import { useRootStore } from "../../../components/StoreProvider";
import {
  UsIaEarlyDischargeOpportunity,
  UsIaSupervisionLevelDowngradeOpportunity,
} from "../../../WorkflowsStore/Opportunity/UsIa";
import { useOpportunitySidePanel } from "../../WorkflowsJusticeInvolvedPersonProfile/OpportunitySidePanelContext";
import {
  OpportunityStatusDropdownMenuItem,
  StatusAwareToggle,
} from "../MenuButton.styles";
import { getEdButtonConfig, getSldButtonConfig } from "./menuConfigs";

const UsIaMenuButton = observer(function MenuButton({
  opportunity,
  markSubmittedAndToast,
  deleteSubmitted,
}: {
  opportunity:
    | UsIaEarlyDischargeOpportunity
    | UsIaSupervisionLevelDowngradeOpportunity;
  markSubmittedAndToast: (subcategory?: string) => Promise<void>;
  deleteSubmitted: () => Promise<void>;
}) {
  const { workflowsStore } = useRootStore();
  const { setCurrentView } = useOpportunitySidePanel();
  const { buttonLabel = "Update Eligibility", options } =
    opportunity.type === "usIaCompleteSupervisionLevelDowngrade"
      ? getSldButtonConfig({
          opportunity: opportunity as UsIaSupervisionLevelDowngradeOpportunity,
          setCurrentView,
          deleteSubmitted,
        })
      : getEdButtonConfig({
          opportunity: opportunity as UsIaEarlyDischargeOpportunity,
          setCurrentView,
          markSubmittedAndToast,
          deleteSubmitted,
        });
  return (
    <Dropdown>
      <StatusAwareToggle>{buttonLabel}</StatusAwareToggle>
      <DropdownMenu>
        {options.map((option) => {
          const contents = (
            <OpportunityStatusDropdownMenuItem
              key={option.label}
              onClick={() => {
                option.onClick();
                workflowsStore.updateSelectedOpportunityOnFullProfile(
                  opportunity,
                );
              }}
            >
              {option.label}
            </OpportunityStatusDropdownMenuItem>
          );
          return option.tooltip ? (
            <TooltipTrigger key={option.tooltip} contents={option.tooltip}>
              {contents}
            </TooltipTrigger>
          ) : (
            contents
          );
        })}
      </DropdownMenu>
    </Dropdown>
  );
});

export default UsIaMenuButton;
