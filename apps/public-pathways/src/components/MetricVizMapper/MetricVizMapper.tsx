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

import { observer } from "mobx-react-lite";
import React from "react";

import {
  AdmissionsAndReleasesOverTimeMetric,
  OverTimeMetric,
  PATHWAYS_SECTIONS,
  SnapshotMetric,
  VizPopulationOverTime,
  VizPopulationSnapshot,
} from "~shared-pathways";

import { chartColorForSection } from "../../datastores/eventTypes";
import { CARD_SPLIT_DIMENSION_BY_SECTION } from "../../datastores/sectionCards";
import withPublicPathwaysMetricHelpers from "../PathwaysMetricHelpers/withPublicPathwaysMetricHelpers";
import { useRootStore } from "../StoreProvider";
import VizAdmissionsAndReleasesOverTime from "./VizAdmissionsAndReleasesOverTime";
import VizCustodyStatusSnapshot from "./VizCustodyStatusSnapshot";
import VizSnapshotCards from "./VizSnapshotCards";

const HydratedOverTimeViz = withPublicPathwaysMetricHelpers(
  VizPopulationOverTime,
);
const HydratedSnapshotViz = withPublicPathwaysMetricHelpers(
  VizPopulationSnapshot,
);

const HydratedAdmissionsAndReleasesViz = withPublicPathwaysMetricHelpers(
  VizAdmissionsAndReleasesOverTime,
);

const HydratedSnapshotCards = withPublicPathwaysMetricHelpers(
  VizSnapshotCards,
  { rendersOwnCards: true },
);

const HydratedCustodyStatusViz = withPublicPathwaysMetricHelpers(
  VizCustodyStatusSnapshot,
);

type MetricVizMapperProps = {
  metric: AdmissionsAndReleasesOverTimeMetric | OverTimeMetric | SnapshotMetric;
};

const MetricVizMapper: React.FC<MetricVizMapperProps> = observer(
  function MetricVizMapper({ metric }) {
    const { filtersStore, section } = useRootStore();

    if (metric instanceof AdmissionsAndReleasesOverTimeMetric) {
      return (
        <HydratedAdmissionsAndReleasesViz
          metric={metric}
          filtersStore={filtersStore}
        />
      );
    }

    if (metric instanceof OverTimeMetric) {
      return (
        <HydratedOverTimeViz metric={metric} filtersStore={filtersStore} />
      );
    }

    if (section === PATHWAYS_SECTIONS["countByCustodyStatus"]) {
      return (
        <HydratedCustodyStatusViz metric={metric} filtersStore={filtersStore} />
      );
    }

    const splitDimension = CARD_SPLIT_DIMENSION_BY_SECTION[section];
    if (splitDimension) {
      return (
        <HydratedSnapshotCards
          metric={metric}
          filtersStore={filtersStore}
          splitDimension={splitDimension}
          barColor={chartColorForSection(section)}
        />
      );
    }

    return (
      <HydratedSnapshotViz
        metric={metric}
        filtersStore={filtersStore}
        barColor={chartColorForSection(section)}
      />
    );
  },
);

export default MetricVizMapper;
