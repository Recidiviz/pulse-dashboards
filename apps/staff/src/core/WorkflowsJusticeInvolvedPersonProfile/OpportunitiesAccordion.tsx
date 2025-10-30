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

import { Sans14, Sans16, spacing } from "@recidiviz/design-system";
import { observer } from "mobx-react-lite";
import { rem, rgba } from "polished";
import {
  Accordion,
  AccordionItem,
  AccordionItemButton,
  AccordionItemHeading,
  AccordionItemPanel,
  AccordionItemState,
} from "react-accessible-accordion";
import styled from "styled-components/macro";

import { palette } from "~design-system";
import { withPresenterManager } from "~hydration-utils";

import { useRootStore } from "../../components/StoreProvider";
import { JusticeInvolvedPerson, Opportunity } from "../../WorkflowsStore";
import { OpportunitiesAccordionPresenter } from "../../WorkflowsStore/presenters/OpportunitiesAccordionPresenter";
import ModelHydrator from "../ModelHydrator";
import { OpportunityPreviewPanel } from "../OpportunityCaseloadView/OpportunityPreviewPanel";
import { useStatusColors } from "../utils/workflowsUtils";
import { OpportunityModule } from "./OpportunityModule";
import { OpportunityModuleHeader } from "./OpportunityModuleHeader";
import { useOpportunitySidePanel } from "./OpportunitySidePanelContext";

const OpportunityWrapper = styled.div<{ background: string; border: string }>`
  background-color: ${({ background: backgroundColor }) => backgroundColor};
  border-width: 1px 0;
  border-color: ${({ border: borderColor }) => borderColor};
  border-top-style: solid;

  &:last-child {
    border-bottom-style: solid;
  }
`;

const AccordionButton = styled(AccordionItemButton)`
  padding: ${rem(spacing.md)} ${rem(spacing.md)};
  position: relative;
  cursor: pointer;

  &:not(:first-child) {
    border-top: none;
  }

  &::after {
    display: inline-block;
    content: "+";
    font-size: 1rem;
    position: absolute;
    right: ${rem(spacing.sm)};
    top: calc(${rem(spacing.lg)} - 3px);
    color: ${palette.pine1};
  }

  &[aria-expanded="true"]::after,
  &[aria-selected="true"]::after {
    content: "";
    width: 8px;
    margin-right: 1px;
    top: calc(${rem(spacing.lg)} + 9.5px);
    border-bottom: 1.5px solid ${palette.pine1};
  }

  &[aria-expanded="true"] {
    span[class*="OpportunityLabel"] {
      border-bottom: 1px solid;
    }
  }
`;

const AccordionBody = styled(AccordionItemPanel)`
  padding: 0;
  margin-top: -${rem(spacing.lg)};

  & > *:first-child {
    background-color: transparent;
    border: none;
  }
`;

export const AccordionWrapper = styled(Accordion)`
  margin: 0 -${rem(spacing.md)};

  & + hr {
    display: none;
  }
`;

export const NoOpportunities = styled.div`
  align-items: center;
  background: ${rgba(palette.slate, 0.05)};
  border: 1px solid ${palette.slate20};
  border-radius: ${rem(4)};
  color: ${palette.slate70};
  display: flex;
  flex-direction: column;
  height: ${rem(250)};
  justify-content: center;
  padding: ${rem(spacing.md)};

  ${Sans16} {
    color: ${palette.pine2};
  }
`;

export const AccordionSection = observer(function AccordionSection({
  opportunity,
  formLinkButton = false,
  hideActionButtons = false,
  shouldTrackOpportunityPreviewed = true,
  onDenialButtonClick = () => null,
}: {
  opportunity: Opportunity;
  formLinkButton?: boolean;
  hideActionButtons?: boolean;
  shouldTrackOpportunityPreviewed?: boolean;
  onDenialButtonClick?: () => void;
}) {
  const colors = useStatusColors(opportunity);

  return (
    <OpportunityWrapper className="ProfileOpportunityItem" {...colors}>
      <AccordionItem uuid={opportunity.accordionKey}>
        <AccordionItemHeading>
          <AccordionButton>
            <OpportunityModuleHeader opportunity={opportunity} />
          </AccordionButton>
        </AccordionItemHeading>
        <AccordionBody>
          <AccordionItemState>
            {({ expanded }) => (
              <OpportunityModule
                hideHeader
                isVisible={expanded}
                opportunity={opportunity}
                formLinkButton={formLinkButton && !!opportunity.form}
                hideActionButtons={hideActionButtons}
                shouldTrackOpportunityPreviewed={
                  shouldTrackOpportunityPreviewed
                }
                onDenialButtonClick={onDenialButtonClick}
              />
            )}
          </AccordionItemState>
        </AccordionBody>
      </AccordionItem>
    </OpportunityWrapper>
  );
});

type OpportunitiesAccordionProps = {
  person: JusticeInvolvedPerson;
  hideEmpty?: boolean;
  formLinkButton?: boolean;
};

export const ManagedComponent = observer(function OpportunitiesAccordion({
  presenter: {
    person,
    hideEmpty,
    formLinkButton,
    opportunitiesToDisplayInAccordion,
    selectedOpportunityOnFullProfile,
    updateSelectedOpportunityOnFullProfile,
  },
}: {
  presenter: OpportunitiesAccordionPresenter<JusticeInvolvedPerson>;
}) {
  const { setCurrentView } = useOpportunitySidePanel();
  if (opportunitiesToDisplayInAccordion.length === 0) {
    return hideEmpty ? null : (
      <NoOpportunities>
        <Sans16>None for now</Sans16>
        <Sans14>New opportunities will appear here.</Sans14>
      </NoOpportunities>
    );
  } else {
    return (
      <AccordionWrapper
        allowZeroExpanded
        preExpanded={
          opportunitiesToDisplayInAccordion.length
            ? [opportunitiesToDisplayInAccordion?.[0].accordionKey]
            : [0]
        }
      >
        {opportunitiesToDisplayInAccordion.map((opportunity) => {
          if (!opportunity) return undefined;
          return (
            <AccordionSection
              key={`${opportunity.accordionKey}-${opportunity.selectId}`}
              opportunity={opportunity}
              formLinkButton={formLinkButton}
              onDenialButtonClick={() => {
                updateSelectedOpportunityOnFullProfile(opportunity);
                setCurrentView("MARK_INELIGIBLE");
              }}
            />
          );
        })}
        <OpportunityPreviewPanel
          opportunity={selectedOpportunityOnFullProfile}
          selectedPerson={person}
          onClose={() => updateSelectedOpportunityOnFullProfile(undefined)}
          onSubmit={() => updateSelectedOpportunityOnFullProfile(undefined)}
          clearSelectedPersonOnClose={false}
          shouldTrackOpportunityPreviewed={false}
        />
      </AccordionWrapper>
    );
  }
});

function usePresenter({
  person,
  hideEmpty = false,
  formLinkButton = false,
}: OpportunitiesAccordionProps) {
  const { workflowsStore } = useRootStore();
  if (!workflowsStore) return null;
  return new OpportunitiesAccordionPresenter(
    workflowsStore,
    person,
    hideEmpty,
    formLinkButton,
  );
}

export const OpportunitiesAccordion = withPresenterManager({
  usePresenter,
  ManagedComponent,
  managerIsObserver: true,
  HydratorComponent: ModelHydrator,
});
