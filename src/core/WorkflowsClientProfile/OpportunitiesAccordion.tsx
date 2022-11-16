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

import { palette, Sans14, Sans16, spacing } from "@recidiviz/design-system";
import { sortBy } from "lodash";
import { keys } from "mobx";
import { observer } from "mobx-react-lite";
import { rem, rgba } from "polished";
import React from "react";
import {
  Accordion,
  AccordionItem,
  AccordionItemButton,
  AccordionItemHeading,
  AccordionItemPanel,
} from "react-accessible-accordion";
import styled from "styled-components/macro";

import {
  JusticeInvolvedPerson,
  Opportunity,
  OpportunityType,
} from "../../WorkflowsStore";
import { SelectedPersonOpportunitiesHydrator } from "../OpportunitiesHydrator";
import { useStatusColors } from "../utils/workflowsUtils";
import { OpportunityModule } from "./OpportunityModule";
import { OpportunityModuleHeader } from "./OpportunityModuleHeader";

const OpportunityWrapper = styled.div<{ background: string; border: string }>`
  background-color: ${({ background: backgroundColor }) => backgroundColor};
  border-color: ${({ border: borderColor }) => borderColor};
  border-style: solid;
  border-width: 1px 0;
`;

const AccordionButton = styled(AccordionItemButton)`
  padding: ${rem(spacing.lg)};
  position: relative;
  cursor: pointer;

  &:not(:first-child) {
    border-top: none;
  }

  &:after {
    display: inline-block;
    content: "";
    height: 10px;
    width: 10px;
    margin-right: 12px;
    border-bottom: 2px solid ${palette.slate70};
    border-right: 2px solid ${palette.slate70};
    transform: rotate(-45deg);
    position: absolute;
    right: ${rem(spacing.lg)};
    top: calc(${rem(spacing.lg)} + 5px);
  }

  &[aria-expanded="true"]::after,
  &[aria-selected="true"]::after {
    transform: rotate(45deg);
  }

  &:focus {
    span[class*="OpportunityLabel"] {
      text-decoration: underline;
    }
  }
`;

const AccordionBody = styled(AccordionItemPanel)`
  padding: 0 ${rem(spacing.lg)};
  margin-top: -${rem(spacing.lg)};

  & > *:first-child {
    background-color: transparent;
    border: none;
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

export const OpportunitiesAccordion = observer(
  ({ person }: { person: JusticeInvolvedPerson }) => {
    const opportunityTypes = keys(
      person.potentialOpportunities
    ) as OpportunityType[];

    const opportunities = sortBy(
      Object.values(person.verifiedOpportunities).filter(
        (opp) => opp !== undefined
      ) as Opportunity[],
      (opp: Opportunity) => opportunityTypes.indexOf(opp.type)
    );

    const empty = (
      <NoOpportunities>
        <Sans16>None for now</Sans16>
        <Sans14>New opportunities will appear here.</Sans14>
      </NoOpportunities>
    );

    const hydrated =
      opportunities.length === 1 ? (
        <OpportunityModule
          opportunity={opportunities[0]}
          formLinkButton={!!opportunities[0].form}
        />
      ) : (
        <Accordion allowZeroExpanded preExpanded={[0]}>
          {opportunities.map((opportunity, index) => {
            if (!opportunity) return undefined;
            const colors = useStatusColors(opportunity);
            return (
              <OpportunityWrapper {...colors}>
                <AccordionItem uuid={index}>
                  <AccordionItemHeading>
                    <AccordionButton>
                      <OpportunityModuleHeader opportunity={opportunity} />
                    </AccordionButton>
                  </AccordionItemHeading>
                  <AccordionBody>
                    <OpportunityModule
                      opportunity={opportunity}
                      formLinkButton={!!opportunity.form}
                      hideHeader
                    />
                  </AccordionBody>
                </AccordionItem>
              </OpportunityWrapper>
            );
          })}
        </Accordion>
      );

    return (
      <SelectedPersonOpportunitiesHydrator
        {...{ empty, hydrated, opportunityTypes }}
      />
    );
  }
);
