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

import React from "react";
import styled from "styled-components";

import VizPathways from "../VizPathways";

const NoDataWrapper = styled.div`
  align-items: center;
  display: flex;
  height: 100%;
  justify-content: center;
  padding-top: 3rem;
  width: 100%;
`;

type NoDataVizProps = {
  title: string;
  subtitle?: string;
  latestUpdate?: string;
};

const NoDataViz: React.FC<NoDataVizProps> = ({
  title,
  subtitle,
  latestUpdate,
}) => (
  <VizPathways title={title} subtitle={subtitle} latestUpdate={latestUpdate}>
    <NoDataWrapper>
      <div>No data available for the current selection.</div>
    </NoDataWrapper>
  </VizPathways>
);

export default NoDataViz;
