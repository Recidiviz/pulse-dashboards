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
  Icon,
  palette,
  Sans16,
  spacing,
  typography,
} from "@recidiviz/design-system";
import { observer } from "mobx-react-lite";
import { rem, rgba } from "polished";
import React from "react";
import { useInView } from "react-intersection-observer";
import styled from "styled-components/macro";

import { BrandedLink } from "../../components/BrandedLink";
import { useRootStore } from "../../components/StoreProvider";
import { OPPORTUNITY_LABELS, OpportunityType } from "../../PracticesStore";
import { pluralize } from "../../utils";
import { OpportunityCapsule } from "../ClientCapsule";
import { workflowsUrl } from "../views";
import { Heading } from "./styles";

const ListHeader = styled(Heading)`
  align-items: center;
  display: flex;
  gap: ${rem(spacing.sm)};
`;

const ScrollShadowContainer = styled.div`
  position: relative;
`;

const ScrollShadow = styled.div<{ show: boolean; side: "right" | "left" }>`
  bottom: 0;
  background: linear-gradient(
    ${(props) => (props.side === "right" ? 270 : 90)}deg,
    ${palette.marble1} 0%,
    ${rgba(palette.marble1, 0)} 100%
  );
  pointer-events: none;
  position: absolute;
  opacity: ${(props) => (props.show ? 1 : 0)};
  top: 0;
  transition: opacity 500ms ease-in-out;
  ${(props) => props.side}: 0;
  width: ${rem(80)};
  z-index: 1;
`;

const ScrollContainer = styled.div`
  display: flex;
  overflow-x: auto;
  padding-bottom: ${rem(spacing.md)};
`;

const ScrollSentinel = styled.div`
  flex: 0 0 1px;
`;

const ClientList = styled.ul`
  display: flex;
  gap: ${rem(spacing.md)};
  list-style-type: none;
  margin: 0;
  padding: 0;
  white-space: nowrap;
`;

const ClientListItem = styled.li`
  border-right: 1px solid ${palette.slate20};
  padding: ${rem(spacing.md)} ${rem(spacing.md)} 0 0;

  &:last-child {
    border: none;
  }
`;

const ClientLink = styled(BrandedLink)`
  display: flex;
  gap: ${rem(spacing.lg)};
`;

const OpportunityLink = styled(BrandedLink)`
  ${typography.Sans16}
  align-items: center;
  display: flex;
  gap: 0.3em;
  margin-left: auto;
`;

type OpportunityListProps = { opportunityType: OpportunityType };

export const OpportunityList = observer(
  ({ opportunityType }: OpportunityListProps) => {
    const {
      practicesStore: { eligibleOpportunities },
    } = useRootStore();

    const leftShadow = useInView({ initialInView: true });
    const rightShadow = useInView({ initialInView: true });

    const opportunities = eligibleOpportunities[opportunityType];

    if (!opportunities.length) return null;

    const items = opportunities.map((opportunity) => {
      const { client } = opportunity;
      return (
        <ClientListItem key={client.id}>
          <ClientLink
            to={workflowsUrl(opportunity.type, {
              clientId: client.pseudonymizedId,
            })}
          >
            <OpportunityCapsule
              avatarSize="md"
              client={client}
              opportunity={opportunity}
              textSize="sm"
            />
            <Sans16>
              <Icon kind="Arrow" size={14} />
            </Sans16>
          </ClientLink>
        </ClientListItem>
      );
    });

    return (
      <>
        <ListHeader>
          <Icon kind="StarCircled" color={palette.signal.highlight} size={14} />
          <span>
            {pluralize(items.length, "client")} eligible for{" "}
            {OPPORTUNITY_LABELS[opportunityType]}
          </span>
          <OpportunityLink to={workflowsUrl(opportunityType)}>
            View all <Icon kind="Arrow" size={14} />
          </OpportunityLink>
        </ListHeader>
        <ScrollShadowContainer>
          <ScrollShadow show={!leftShadow.inView} side="left" />
          <ScrollContainer>
            <ScrollSentinel ref={leftShadow.ref} />
            <ClientList>{items}</ClientList>
            <ScrollSentinel ref={rightShadow.ref} />
          </ScrollContainer>
          <ScrollShadow show={!rightShadow.inView} side="right" />
        </ScrollShadowContainer>
      </>
    );
  }
);
