// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2026 Recidiviz, Inc.
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

import { spacing, typography } from "@recidiviz/design-system";
import { observer } from "mobx-react-lite";
import { rem } from "polished";
import { ReactNode } from "react";
import { Link } from "react-router-dom";
import simplur from "simplur";
import styled from "styled-components";

import { OpportunityType } from "~datatypes";
import { Icon, IconSVG, palette } from "~design-system";

import { PartialRecord } from "../../utils/typeUtils";
import { Opportunity } from "../../WorkflowsStore";
import { OpportunityConfiguration } from "../../WorkflowsStore/Opportunity/OpportunityConfigurations";
import { workflowsUrl } from "../views";

const Container = styled.section`
  background-color: rgba(255, 245, 245, 1);
  border-color: ${palette.logoRed};
  border-style: solid;
  border-width: 0 0 0 ${rem(spacing.xs)};

  padding: ${rem(spacing.md)};
  padding-left: ${rem(22)};

  display: flex;
  flex-direction: column;
  gap: ${rem(spacing.sm)};

  width: 100%;

  &:not(:last-child) {
    margin-bottom: ${rem(spacing.md)};
  }
`;

const Header = styled.h2`
  ${typography.Sans12}
  text-transform: uppercase;
  font-weight: 700;
  color: ${palette.pine1};
  margin: 0 0 ${rem(spacing.sm)};
`;

const EntryList = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0;
`;

const EntryRow = styled.li`
  ${typography.Sans14}
  color: ${palette.pine1};

  display: flex;
  align-items: center;
  gap: ${rem(14)};

  &:not(:last-child) {
    margin-bottom: ${rem(spacing.sm)};
  }
`;

const EntryLink = styled(Link)`
  display: flex;
  align-items: center;
  gap: ${rem(spacing.sm)};
  color: ${palette.pine1};
  text-decoration: none;

  &:hover,
  &:focus-visible {
    color: ${palette.pine1};
  }

  &:hover svg,
  &:focus-visible svg {
    stroke: ${palette.signal.links};
  }
`;

const Strong = styled.span`
  font-weight: 600;
`;

type AlertEntry = {
  key: string;
  tab: string;
  body: ReactNode;
  ariaLabel: string;
};

function formatThresholdDuration(days: number): string {
  if (days > 0 && days % 7 === 0) {
    const weeks = days / 7;
    return simplur`${weeks} [week|weeks]`;
  }
  return simplur`${days} [day|days]`;
}

function buildEntries(
  opportunities: Opportunity[],
  config: OpportunityConfiguration,
): AlertEntry[] {
  const { label, submittedTabTitle } = config;
  const eligibleNowTabTitle = config.tabGroups?.["ELIGIBILITY STATUS"]?.find(
    (tab) => tab === "Eligible Now",
  );
  const entries: AlertEntry[] = [];

  const pendingOverdueCount = opportunities.filter(
    (o) => o.isPendingOverdue,
  ).length;
  if (pendingOverdueCount > 0 && config.pendingOverdueDaysThreshold != null) {
    const duration = formatThresholdDuration(
      config.pendingOverdueDaysThreshold,
    );
    entries.push({
      key: "pending-overdue",
      tab: submittedTabTitle,
      body: (
        <span>
          {simplur`${pendingOverdueCount} [client has|clients have] been `}
          <Strong>{submittedTabTitle}</Strong> {label} for over {duration}
        </span>
      ),
      ariaLabel: simplur`${pendingOverdueCount} [client has|clients have] been ${submittedTabTitle} ${label} for over ${duration}`,
    });
  }

  const eligibleStaleCount = opportunities.filter(
    (o) => o.isEligibleStaleViewed,
  ).length;
  if (
    eligibleStaleCount > 0 &&
    config.eligibleNotViewedDaysThreshold != null &&
    eligibleNowTabTitle
  ) {
    const duration = formatThresholdDuration(
      config.eligibleNotViewedDaysThreshold,
    );
    entries.push({
      key: "eligible-stale",
      tab: eligibleNowTabTitle,
      body: (
        <span>
          {simplur`${eligibleStaleCount} [client has|clients have] been `}
          <Strong>Eligible</Strong> for {label} but not viewed for over{" "}
          {duration}
        </span>
      ),
      ariaLabel: simplur`${eligibleStaleCount} [client has|clients have] been Eligible for ${label} but not viewed for over ${duration}`,
    });
  }

  return entries;
}

const OutstandingItemsAlertForOpportunity = observer(
  function OutstandingItemsAlertForOpportunity({
    opportunities,
  }: {
    opportunities: Opportunity[];
  }) {
    const { config } = opportunities[0];
    const entries = buildEntries(opportunities, config);

    if (entries.length === 0) return null;

    const baseUrl = workflowsUrl("opportunityClients", {
      urlSection: config.urlSection,
    });

    return (
      <Container aria-label={`Outstanding items for ${config.label}`}>
        <Header>Overdue for {config.label}</Header>
        <EntryList>
          {entries.map(({ key, tab, body, ariaLabel }) => (
            <EntryRow key={key}>
              <Icon
                kind={IconSVG.Error}
                size={16}
                color={palette.signal.error}
                aria-hidden
              />
              <EntryLink
                to={{ pathname: baseUrl }}
                state={{ initialTab: tab }}
                aria-label={ariaLabel}
              >
                {body}
                <Icon
                  kind={IconSVG.Arrow}
                  size={16}
                  strokeWidth={1.7}
                  color={palette.slate85}
                  aria-hidden
                />
              </EntryLink>
            </EntryRow>
          ))}
        </EntryList>
      </Container>
    );
  },
);

export const OutstandingItemsAlerts = observer(function OutstandingItemsAlerts({
  opportunityTypes,
  opportunitiesByType,
}: {
  opportunityTypes: OpportunityType[];
  opportunitiesByType: PartialRecord<OpportunityType, Opportunity[]>;
}) {
  return (
    <>
      {opportunityTypes.map((opportunityType) => {
        const opportunities = opportunitiesByType[opportunityType];
        if (!opportunities?.length) return null;
        return (
          <OutstandingItemsAlertForOpportunity
            key={opportunityType}
            opportunities={opportunities}
          />
        );
      })}
    </>
  );
});
