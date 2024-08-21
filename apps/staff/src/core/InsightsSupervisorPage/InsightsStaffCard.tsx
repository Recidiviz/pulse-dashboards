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

import {
  Icon,
  IconSVG,
  palette,
  spacing,
  typography,
} from "@recidiviz/design-system";
import { rem } from "polished";
import React from "react";
import { Link } from "react-router-dom";
import styled from "styled-components/macro";

import { useRootStore } from "../../components/StoreProvider";
import useIsMobile from "../../hooks/useIsMobile";
import { SupervisionOfficer } from "../../InsightsStore/models/SupervisionOfficer";
import { OutlierOfficerData } from "../../InsightsStore/presenters/types";
import { toTitleCase } from "../../utils";
import InsightsInfoModal from "../InsightsInfoModal";
import { InsightsLegend } from "../InsightsLegend";
import { InsightsSwarmPlot } from "../InsightsSwarmPlot";
import { insightsUrl } from "../views";

export const CardWrapper = styled.div<{ noFlex: boolean; isSticky?: boolean }>`
  border: 1px solid ${palette.slate30};
  display: ${({ noFlex }) => (noFlex ? "block" : "flex")};
  color: ${palette.slate85};

  ${({ isSticky }) => isSticky && `position: sticky; top: 5rem;`}
`;

export const CardHeader = styled.div<{ hasBorder: boolean }>`
  flex-basis: 24%;
  padding: ${rem(spacing.lg)};
  border-right: ${({ hasBorder }) =>
    hasBorder ? `1px solid ${palette.slate30}` : "none"};
  min-width: ${rem(200)};
`;

export const CardTitle = styled.div`
  font-size: 22px;
  color: ${palette.pine2};
`;

const CardSubtitle = styled.div`
  ${typography.Sans12}
  margin-top: ${rem(spacing.xs)};
`;

export const CardContent = styled.div<{
  $hasLegend?: boolean;
  noFlex: boolean;
}>`
  padding-top: ${rem(spacing.md)};
  ${({ $hasLegend }) =>
    $hasLegend ? `padding-bottom: ${rem(spacing.sm)}` : "none"};
  ${({ noFlex }) =>
    !noFlex &&
    `display: flex;
      flex-wrap: wrap;
      column-gap: ${rem(spacing.lg * 3)};
      row-gap: ${rem(spacing.lg)}`}
`;

const CardBody = styled.div`
  width: 100%;
`;

const MetricHeader = styled.div`
  display: flex;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: ${rem(spacing.xs)};
`;

const MetricTitle = styled.div`
  ${typography.Sans16}
  color: ${palette.pine1};
  display: flex;
  gap: ${rem(spacing.xs)};
`;

const MetricHint = styled.div`
  display: flex;
  align-items: center;
  color: ${palette.signal.links};
  border-bottom: 1px solid transparent;
  & svg {
    margin-left: ${rem(spacing.sm)};
  }
`;

const MetricSection = styled(Link)<{ $hasBorder: boolean }>`
  padding: ${rem(spacing.lg)};
  border-top: ${({ $hasBorder }) =>
    $hasBorder ? `1px solid ${palette.slate30}` : "none"};
  display: block;

  & + a {
    border-top: 1px solid ${palette.slate30};
    width: 100%;
  }

  &:hover {
    background: #f9fafa;

    ${MetricHint} {
      border-color: ${palette.signal.links};
    }
  }
`;

type InsightsStaffCardType = {
  officer: OutlierOfficerData<SupervisionOfficer>;
  officerIndex: number;
  title?: string;
  subtitle?: string;
  hasLegend?: boolean;
};

const InsightsStaffCard: React.FC<InsightsStaffCardType> = ({
  officer,
  officerIndex,
  title,
  subtitle,
  hasLegend = false,
}) => {
  const { isTablet } = useIsMobile(true);

  const {
    insightsStore: { supervisionStore },
  } = useRootStore();

  return (
    <CardWrapper noFlex={isTablet}>
      <CardHeader hasBorder={!isTablet}>
        <CardTitle>{title || officer.displayName}</CardTitle>
        <CardSubtitle>{subtitle}</CardSubtitle>
      </CardHeader>
      <CardBody>
        {officer.outlierMetrics.map((metric, metricIndex) => {
          return (
            <MetricSection
              to={insightsUrl("supervisionStaffMetric", {
                officerPseudoId: officer.pseudonymizedId,
                metricId: metric.metricId,
              })}
              key={metric.metricId}
              $hasBorder={isTablet}
              data-intercom-target={
                officerIndex === 0 && metricIndex === 0
                  ? "First outlier on supervisor page"
                  : undefined
              }
            >
              <MetricHeader>
                <MetricTitle>
                  {toTitleCase(metric.config.eventName)}
                  <InsightsInfoModal
                    title={toTitleCase(metric.config.eventName)}
                    copy={metric.config.descriptionMarkdown}
                    methodologyLink={supervisionStore?.methodologyUrl}
                    supervisorHomepage={false}
                  />
                </MetricTitle>
                <MetricHint>
                  See trends and cases
                  <Icon
                    kind={IconSVG.Arrow}
                    fill={palette.signal.links}
                    height={16}
                    width={16}
                  />
                </MetricHint>
              </MetricHeader>
              <CardContent $hasLegend={hasLegend} noFlex>
                <InsightsSwarmPlot metric={metric} />
              </CardContent>
              {hasLegend && (
                <InsightsLegend
                  direction="row"
                  outcomeType={metric.config.outcomeType}
                />
              )}
            </MetricSection>
          );
        })}
      </CardBody>
    </CardWrapper>
  );
};

export default InsightsStaffCard;
