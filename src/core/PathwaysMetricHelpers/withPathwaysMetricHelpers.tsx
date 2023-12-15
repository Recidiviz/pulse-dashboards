// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2021 Recidiviz, Inc.
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
import React from "react";
import styled from "styled-components/macro";

import styles from "../CoreConstants.module.scss";
import ModelHydrator from "../ModelHydrator";
import { HydratablePathwaysMetric } from "../models/types";
import { PathwaysNoDataHelper } from "./PathwaysNoDataHelper";

type withPathwaysMetricHelperProps = {
  metric: HydratablePathwaysMetric;
};

const MetricVizHydrator = styled(ModelHydrator)`
  ${typography.Sans14}
  width: 100%;
  min-height: 558px;
  background-color: white;
  border-radius: 0.5rem;
  box-shadow: ${styles.insetShadow30};
`;

const withPathwaysMetricHelpers = <Props extends withPathwaysMetricHelperProps>(
  OriginalComponent: React.ComponentType<Props>
): React.ComponentType<Props> => {
  const ComponentWithHydrator: React.ComponentType<Props> = (props) => {
    const { metric } = props;
    return (
      <MetricVizHydrator model={metric}>
        <PathwaysNoDataHelper metric={metric}>
          <OriginalComponent {...props} />
        </PathwaysNoDataHelper>
      </MetricVizHydrator>
    );
  };

  return ComponentWithHydrator;
};

export default withPathwaysMetricHelpers;
