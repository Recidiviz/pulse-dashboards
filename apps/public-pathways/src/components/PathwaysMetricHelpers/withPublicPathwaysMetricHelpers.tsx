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

import { typography } from "@recidiviz/design-system";
import { observer } from "mobx-react-lite";
import { rem } from "polished";
import React from "react";
import styled from "styled-components";

import { Hydrator } from "~hydration-utils";
import { HydratablePathwaysMetric } from "~shared-pathways";
import useIsMobile from "~utils/react/useIsMobile";

import PublicPathwaysLoading from "../PublicPathwaysLoading";

type WithMetricHelperProps = {
  metric: HydratablePathwaysMetric;
};

const MAX_HEIGHT = rem(531);
const MOBILE_MAX_HEIGHT = rem(675);

const MetricVizHydrator = styled(Hydrator)<{ $isMobile?: boolean }>`
  ${typography.Sans14}
  width: 100%;
  min-height: 40rem;
  max-height: ${({ $isMobile }) =>
    $isMobile ? MOBILE_MAX_HEIGHT : MAX_HEIGHT};
  overflow: hidden;
  border-radius: 8px;
  border: 1px solid rgba(0, 0, 0, 0.15);

  & > div {
    min-height: inherit;
  }
`;

const NoDataWrapper = styled.div`
  align-items: center;
  display: flex;
  height: 100%;
  justify-content: center;
  width: 100%;
`;

const NoDataHelper: React.FC<
  WithMetricHelperProps & { children?: React.ReactNode }
> = observer(function NoDataHelper({ metric, children }) {
  if (metric.isEmpty) {
    return (
      <NoDataWrapper>
        <div>No data available for the current selection.</div>
      </NoDataWrapper>
    );
  }
  return <>{children}</>;
});

const withPublicPathwaysMetricHelpers = <Props extends WithMetricHelperProps>(
  OriginalComponent: React.ComponentType<Props>,
): React.ComponentType<Props> => {
  const ComponentWithHydrator: React.ComponentType<Props> = (props) => {
    const { metric } = props;
    const isMobile = useIsMobile();
    return (
      <MetricVizHydrator
        $isMobile={isMobile}
        hydratable={metric}
        loading={<PublicPathwaysLoading />}
        failed={<div>Failed to load data.</div>}
      >
        <NoDataHelper metric={metric}>
          <OriginalComponent {...props} />
        </NoDataHelper>
      </MetricVizHydrator>
    );
  };

  return ComponentWithHydrator;
};

export default withPublicPathwaysMetricHelpers;
