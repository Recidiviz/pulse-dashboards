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
  Body14,
  Icon,
  palette,
  spacing,
  typography,
} from "@recidiviz/design-system";
import assertNever from "assert-never";
import { observer } from "mobx-react-lite";
import { rem, rgba } from "polished";
import React from "react";
import { Link } from "react-router-dom";
import styled from "styled-components/macro";

import { IconPeopleSvg } from "../../components/Icons";
import { useRootStore } from "../../components/StoreProvider";
import { Client, OpportunityType } from "../../WorkflowsStore";
import { CaseloadSelect } from "../CaseloadSelect";
import { OpportunityCapsule } from "../ClientCapsule";
import { TenantId } from "../models/types";
import { WORKFLOWS_METHODOLOGY_URL } from "../utils/constants";
import { workflowsUrl } from "../views";
import { FORM_SIDEBAR_WIDTH } from "../WorkflowsLayouts";

const FOOTER_HEIGHT = 64;

const Heading = styled(Body14)`
  color: ${palette.slate85};
  margin-bottom: ${rem(spacing.lg)};
`;

const LabelText = styled.div`
  ${typography.Sans14}
  color: ${palette.slate60};
  margin-bottom: ${rem(spacing.sm)};
  margin-top: ${rem(spacing.lg)};
`;

const Label = styled.label`
  display: block;
`;

const ClientListEmptyState: React.FC = observer(() => {
  const { workflowsStore } = useRootStore();

  const text = workflowsStore.selectedOfficers.length
    ? "No clients eligible. Search for another officer."
    : "";

  return <div>{text}</div>;
});

const OpportunityListWrapper = styled.div`
  padding-bottom: ${rem(FOOTER_HEIGHT)};
`;

const ClientListElement = styled.ul`
  list-style: none;
  margin-top: ${rem(spacing.md)};
  padding: 0;
`;

const ClientListItem = styled.li`
  margin-bottom: ${rem(spacing.md)};
`;

const OpportunityListLink: React.FC<
  OpportunityCaseloadProps & { client: Client }
> = ({ children, client, opportunityType: opportunity }) => {
  return (
    <ClientListItem key={client.id}>
      <Link
        to={workflowsUrl(opportunity, {
          clientId: client.pseudonymizedId,
        })}
      >
        {children}
      </Link>
    </ClientListItem>
  );
};

const AllClientsLink = styled(Link)`
  align-items: center;
  background: ${palette.marble1};
  border-top: 1px solid ${rgba(palette.slate, 0.15)};
  bottom: 0;
  color: ${palette.slate85};
  display: flex;
  gap: ${rem(spacing.md)};
  height: ${rem(FOOTER_HEIGHT)};
  margin-left: -${rem(spacing.md)};
  padding: 0 ${rem(spacing.lg)};
  position: fixed;
  width: ${rem(FORM_SIDEBAR_WIDTH)};

  &:hover,
  &:focus {
    color: ${palette.slate};
  }
`;

type OpportunityCaseloadProps = {
  opportunityType: OpportunityType;
};

export const OpportunityCaseloadSelection = observer(
  ({ opportunityType }: OpportunityCaseloadProps) => {
    const {
      workflowsStore: { eligibleOpportunities, almostEligibleOpportunities },
      currentTenantId,
    } = useRootStore();

    const eligibleNow = eligibleOpportunities[opportunityType];
    const almostEligible = almostEligibleOpportunities[opportunityType];

    let introText: React.ReactNode;
    switch (opportunityType) {
      case "compliantReporting":
        introText = (
          <>
            Search for officer(s) below to review and refer eligible clients for
            Compliant Reporting.{" "}
            <a
              // currentTenantId is coming from the StoreProvider RootStore which
              // is only partially typed at this point but will always be of type TenantId.
              href={WORKFLOWS_METHODOLOGY_URL[currentTenantId as TenantId]}
              target="_blank"
              rel="noopener noreferrer"
            >
              Learn more
            </a>
          </>
        );
        break;
      case "earlyTermination":
        introText = (
          <>
            Search for officer(s) below to review clients eligible for early
            termination and download paperwork to file with the Court{" "}
            <a
              // currentTenantId is coming from the StoreProvider RootStore which
              // is only partially typed at this point but will always be of type TenantId.
              href={WORKFLOWS_METHODOLOGY_URL[currentTenantId as TenantId]}
              target="_blank"
              rel="noopener noreferrer"
            >
              Learn more
            </a>
          </>
        );
        break;
      default:
        assertNever(opportunityType);
    }

    return (
      <>
        <OpportunityListWrapper>
          <Heading>{introText}</Heading>
          <Label>
            <LabelText>Caseloads</LabelText>
            <CaseloadSelect hideIndicators />
          </Label>
          {!eligibleNow.length && !almostEligible.length && (
            <ClientListEmptyState />
          )}
          {eligibleNow.length ? (
            <>
              <LabelText>Eligible now</LabelText>
              <ClientListElement>
                {eligibleNow.map((opportunity) => {
                  const { client } = opportunity;
                  return (
                    <OpportunityListLink
                      key={client.pseudonymizedId}
                      {...{ client, opportunityType }}
                    >
                      <OpportunityCapsule
                        avatarSize="lg"
                        client={client}
                        opportunity={opportunity}
                        textSize="sm"
                      />
                    </OpportunityListLink>
                  );
                })}
              </ClientListElement>
            </>
          ) : null}
          {almostEligible.length ? (
            <>
              <LabelText>Almost eligible</LabelText>
              <ClientListElement>
                {almostEligible.map((opportunity) => {
                  const { client } = opportunity;
                  return (
                    <OpportunityListLink
                      key={client.pseudonymizedId}
                      {...{ client, opportunityType }}
                    >
                      <OpportunityCapsule
                        avatarSize="lg"
                        client={client}
                        opportunity={opportunity}
                        textSize="sm"
                      />
                    </OpportunityListLink>
                  );
                })}
              </ClientListElement>
            </>
          ) : null}
        </OpportunityListWrapper>

        <AllClientsLink to={workflowsUrl("general")}>
          <Icon kind={IconPeopleSvg} size={16} /> View all clients
        </AllClientsLink>
      </>
    );
  }
);
