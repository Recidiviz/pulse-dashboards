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

import { Pill, Sans12, Serif24, spacing } from "@recidiviz/design-system";
import { isThisMonth } from "date-fns";
import { rem } from "polished";
import { Link } from "react-router-dom";
import styled from "styled-components";

import { Icon, palette } from "~design-system";

import useIsMobile from "../../hooks/useIsMobile";
import { SupervisionTask } from "../../WorkflowsStore/Task/types";
import { workflowsUrl } from "../views";

export const HomepageCards = styled.div<{ $isMobile: boolean }>`
  display: flex;
  gap: ${({ $isMobile }) => ($isMobile ? rem(spacing.sm) : rem(spacing.lg))};
  width: 100%;
  margin-bottom: ${rem(spacing.xl)};
`;

const ClickableCard = styled(Link)<{ $isMobile: boolean }>`
  flex: 1;
  min-height: ${rem(125)};
  padding: ${({ $isMobile }) =>
    $isMobile ? rem(spacing.md) : rem(spacing.lg)};

  border: 1px solid ${palette.slate30};
  border-radius: ${rem(4)};

  &:hover,
  &:focus {
    background-color: ${palette.marble2};
  }
`;

const CardHeaderSection = styled.div`
  display: flex;
  flex-direction: row;
  gap: ${rem(spacing.sm)};
  align-items: baseline;
`;

const CardHeading = styled(Sans12)`
  color: ${palette.slate85};
  height: ${rem(20)};
`;

// TODO(#8709): Add color to design system or change to design system color
const CardBadge = styled(Pill).attrs({
  color: "rgba(226, 244, 255, 1)",
  filled: true,
})`
  font-size: ${rem(12)};
  padding: ${rem(spacing.xs)} ${rem(spacing.sm)};
  height: ${rem(20)};
  color: ${palette.pine2};
`;

const CardCTA = styled.div`
  display: flex;
  flex-direction: row;
  gap: ${rem(12)};
  margin-bottom: ${rem(14)};
`;

// TODO(#10706): Migrate typography into pulse-dashboards and add Serif28 to the design system
const CardCTAText = styled(Serif24)<{ $isMobile: boolean }>`
  font-size: ${({ $isMobile }) => ($isMobile ? rem(24) : rem(28))};
  color: ${palette.pine2};
`;

const CardIcon = styled(Icon)`
  flex-shrink: 0;
  align-self: center;
  color: ${palette.slate30Opaque};
  ${ClickableCard}:hover &, ${ClickableCard}:focus & {
    color: ${palette.slate50Opaque};
  }
`;

const CardSubheading = styled(Sans12)`
  color: ${palette.pine4};
`;

export const TasksCards = function TasksCards({
  tasks,
}: {
  tasks: SupervisionTask[];
}) {
  const { isMobile } = useIsMobile(true);
  return (
    <HomepageCards $isMobile={isMobile}>
      {<TasksHomepageCard tasks={tasks} />}
      <RoutePlannerHomepageCard />
    </HomepageCards>
  );
};

const WorkflowsHomepageCard = function WorkflowsHomepageCard({
  url,
  heading,
  callToAction,
  subheading,
  badgeText,
}: {
  url: string;
  heading: string;
  callToAction: string;
  subheading: string;
  badgeText?: string;
}) {
  const { isMobile } = useIsMobile(true);

  return (
    <ClickableCard $isMobile={isMobile} to={url}>
      <CardHeaderSection>
        <CardHeading>{heading}</CardHeading>
        {badgeText !== undefined && <CardBadge>{badgeText}</CardBadge>}
      </CardHeaderSection>
      <CardCTA>
        <CardCTAText $isMobile={isMobile}>{callToAction}</CardCTAText>
        <CardIcon kind={"Arrow"} size={32} />
      </CardCTA>
      <CardSubheading>{subheading}</CardSubheading>
    </ClickableCard>
  );
};

const RoutePlannerHomepageCard = function RoutePlannerHomepageCard() {
  return (
    <WorkflowsHomepageCard
      url={workflowsUrl("tasksRoutePlanner")}
      heading={"Tasks"}
      callToAction={"Open route planner"}
      subheading={"To start planning home contacts, click here"}
      badgeText={"New"}
    />
  );
};

const TasksHomepageCard = function TasksHomepageCard({
  tasks,
}: {
  tasks: SupervisionTask[];
}) {
  const tasksDueThisMonth = tasks.filter((t) => isThisMonth(t.dueDate)).length;

  const subheading =
    tasksDueThisMonth > 0
      ? `${tasksDueThisMonth} tasks are due this month`
      : `${tasks.length} total tasks`;

  return (
    <WorkflowsHomepageCard
      url={workflowsUrl("tasks")}
      heading={"Tasks"}
      callToAction={"Review your tasks"}
      subheading={subheading}
    />
  );
};
