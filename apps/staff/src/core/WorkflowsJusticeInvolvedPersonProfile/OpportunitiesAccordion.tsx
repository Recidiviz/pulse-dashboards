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

import { palette, Sans14, Sans16, spacing } from "@recidiviz/design-system";
import { sortBy } from "lodash";
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

import { useRootStore } from "../../components/StoreProvider";
import { JusticeInvolvedPerson, Opportunity } from "../../WorkflowsStore";
import { SelectedPersonOpportunitiesHydrator } from "../OpportunitiesHydrator";
import { OpportunityDenialView } from "../OpportunityDenial";
import { useStatusColors } from "../utils/workflowsUtils";
import { WorkflowsPreviewModal } from "../WorkflowsPreviewModal";
import { OpportunityModule } from "./OpportunityModule";
import { OpportunityModuleHeader } from "./OpportunityModuleHeader";

const OpportunityWrapper = styled.div<{ background: string; border: string }>`
  background-color: ${({ background: backgroundColor }) => backgroundColor};
  border-width: 1px 0;
  border-color: ${({ border: borderColor }) => borderColor};
  &:first-child {
    border-top-style: solid;
  }
  &:nth-child(n + 1) {
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

const NoOpportunities = styled.div`
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
  onDenialButtonClick = () => null,
}: {
  opportunity: Opportunity;
  formLinkButton?: boolean;
  hideActionButtons?: boolean;
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
                onDenialButtonClick={onDenialButtonClick}
              />
            )}
          </AccordionItemState>
        </AccordionBody>
      </AccordionItem>
    </OpportunityWrapper>
  );
});

export const OpportunitiesAccordion = observer(function OpportunitiesAccordion({
  person,
  hideEmpty = false,
  formLinkButton,
}: {
  person: JusticeInvolvedPerson;
  hideEmpty?: boolean;
  formLinkButton?: boolean;
}) {
  const {
    workflowsStore,
    workflowsStore: { opportunityTypes, selectedOpportunityOnFullProfile },
  } = useRootStore();

  const opportunities = sortBy(
    Object.values(person.opportunities)
      .flat()
      .filter((opp) => opp !== undefined) as unknown as Opportunity[],
    (opp: Opportunity) => opportunityTypes.indexOf(opp.type),
  );

  const empty = hideEmpty ? null : (
    <NoOpportunities>
      <Sans16>None for now</Sans16>
      <Sans14>New opportunities will appear here.</Sans14>
    </NoOpportunities>
  );

  const hydrated = (
    <AccordionWrapper
      allowZeroExpanded
      preExpanded={opportunities.length ? [opportunities[0].accordionKey] : [0]}
    >
      {opportunities.map((opportunity) => {
        if (!opportunity) return undefined;
        return (
          <AccordionSection
            key={`${opportunity.accordionKey}-${opportunity.selectId}`}
            opportunity={opportunity}
            formLinkButton={formLinkButton}
            onDenialButtonClick={() => {
              workflowsStore.updateSelectedOpportunityOnFullProfile(
                opportunity,
              );
            }}
          />
        );
      })}
      <WorkflowsPreviewModal
        isOpen={!!selectedOpportunityOnFullProfile}
        clearSelectedPersonOnClose={false}
        onClose={() =>
          workflowsStore.updateSelectedOpportunityOnFullProfile(undefined)
        }
        pageContent={
          <OpportunityDenialView
            onSubmit={() =>
              workflowsStore.updateSelectedOpportunityOnFullProfile(undefined)
            }
            opportunity={selectedOpportunityOnFullProfile}
          />
        }
      />
    </AccordionWrapper>
  );

  return (
    <SelectedPersonOpportunitiesHydrator
      {...{ empty, hydrated, opportunityTypes, person }}
    />
  );
});
