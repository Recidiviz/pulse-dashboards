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
import React from "react";
import styled, { css } from "styled-components";

import { Hydrator } from "~hydration-utils";
import {
  FiltersStoreBase,
  HydratablePathwaysMetric,
  NoDataViz,
} from "~shared-pathways";
import useIsMobile from "~utils/react/useIsMobile";

import PublicPathwaysLoading from "../PublicPathwaysLoading";

type WithMetricHelperProps = {
  metric: HydratablePathwaysMetric & {
    chartTitle: string;
    latestUpdateLabel?: string;
  };
  filtersStore: FiltersStoreBase;
};

/** The border and type that every chart's box shares. */
const cardStyle = css`
  ${typography.Sans14}
  width: 100%;
  border-radius: 8px;
  border: 1px solid rgba(0, 0, 0, 0.15);
`;

/** The box one chart draws around itself, for a section whose viz renders more than one chart. */
export const MetricVizCard = styled.div`
  ${cardStyle}
`;

/**
 * No box sets a minimum height. A chart sizes itself — a horizontal one to its
 * bar count — so a floor would leave empty space under a short chart. The
 * loading spinner reserves the space instead, while data is on its way.
 *
 * `$noCardStyle` skips the box below: a section with several charts draws its
 * own `MetricVizCard` around each one, so the hydrator wrapping all of them
 * must not draw a second box around the set.
 */
const MetricVizHydrator = styled(Hydrator)<{
  $isMobile?: boolean;
  $noCardStyle: boolean;
}>`
  width: 100%;

  ${({ $noCardStyle }) => !$noCardStyle && cardStyle}
`;

const NoDataHelper: React.FC<
  WithMetricHelperProps & { children?: React.ReactNode }
> = observer(function NoDataHelper({ metric, filtersStore, children }) {
  if (metric.isEmpty) {
    return (
      <NoDataViz
        title={metric.chartTitle}
        subtitle={filtersStore.filtersDescription}
        latestUpdate={metric.latestUpdateLabel}
      />
    );
  }
  return <>{children}</>;
});

const withPublicPathwaysMetricHelpers = <Props extends WithMetricHelperProps>(
  OriginalComponent: React.ComponentType<Props>,
  {
    /**
     * Set when the wrapped component draws its own `MetricVizCard` per chart,
     * so the hydrator does not draw a box around the whole set.
     */
    rendersOwnCards = false,
  }: { rendersOwnCards?: boolean } = {},
): React.ComponentType<Props> => {
  const ComponentWithHydrator: React.ComponentType<Props> = (props) => {
    const { metric, filtersStore } = props;
    const isMobile = useIsMobile();
    return (
      <MetricVizHydrator
        $noCardStyle={rendersOwnCards}
        $isMobile={isMobile}
        hydratable={metric}
        loading={<PublicPathwaysLoading />}
        failed={<div>Failed to load data.</div>}
      >
        <NoDataHelper metric={metric} filtersStore={filtersStore}>
          <OriginalComponent {...props} />
        </NoDataHelper>
      </MetricVizHydrator>
    );
  };

  return ComponentWithHydrator;
};

export default withPublicPathwaysMetricHelpers;
