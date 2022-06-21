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
import { Icon, palette, spacing } from "@recidiviz/design-system";
import { observer } from "mobx-react-lite";
import { rem, rgba } from "polished";
import React from "react";
import { Link } from "react-router-dom";
import styled from "styled-components/macro";

import { IconPeopleSvg } from "../../components/Icons";
import { useRootStore } from "../../components/StoreProvider";
import { Client } from "../../PracticesStore/Client";
import { CaseloadSelect } from "../CaseloadSelect";
import { OpportunityCapsule } from "../ClientCapsule";
import { PRACTICES_METHODOLOGY_URL } from "../utils/constants";
import { workflowsUrl } from "../views";
import { FORM_SIDEBAR_WIDTH } from "../WorkflowsLayouts";

const FOOTER_HEIGHT = 64;

const Heading = styled.div`
  color: ${palette.slate85};
  line-height: 1.3;
  margin-bottom: ${rem(spacing.lg)};

  a {
    color: ${palette.text.links};
    text-decoration: underline;
  }
`;

const Label = styled.label`
  display: block;
  font-style: normal;
  font-size: ${rem(13)};

  letter-spacing: -0.01em;

  color: ${palette.slate60};
`;

const ClientListEmptyState: React.FC = observer(() => {
  const { practicesStore } = useRootStore();

  const text = practicesStore.selectedOfficers.length
    ? "No clients eligible for Compliant Reporting. Search for another officer."
    : "";

  return <div>{text}</div>;
});

const ClientListElement = styled.ul`
  list-style: none;
  margin-top: ${rem(spacing.md)};
  padding: 0;
  padding-bottom: ${rem(FOOTER_HEIGHT)};
`;

const ClientListItem = styled.li`
  margin-bottom: ${rem(spacing.md)};
`;

const ClientList: React.FC = observer(() => {
  const {
    practicesStore: { compliantReportingEligibleClients },
  } = useRootStore();

  const items = compliantReportingEligibleClients.map((client: Client) => (
    <ClientListItem key={client.id}>
      <Link
        to={workflowsUrl("compliantReporting", {
          clientId: client.pseudonymizedId,
        })}
      >
        <OpportunityCapsule
          avatarSize="lg"
          client={client}
          opportunity="compliantReporting"
          textSize="sm"
        />
      </Link>
    </ClientListItem>
  ));

  return (
    <ClientListElement>
      {items.length === 0 ? <ClientListEmptyState /> : items}
    </ClientListElement>
  );
});

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

export const PracticesCaseloadSelection = (): JSX.Element => {
  return (
    <>
      <Heading>
        Search for officer(s) below to review and refer eligible clients for
        Compliant Reporting.{" "}
        <a
          href={PRACTICES_METHODOLOGY_URL}
          target="_blank"
          rel="noopener noreferrer"
        >
          Learn more
        </a>
      </Heading>

      <Label>
        Officer
        <CaseloadSelect hideIndicators />
      </Label>

      <ClientList />
      <AllClientsLink to={workflowsUrl("general")}>
        <Icon kind={IconPeopleSvg} size={16} /> View all clients
      </AllClientsLink>
    </>
  );
};
