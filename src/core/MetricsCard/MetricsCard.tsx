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
import { Card } from "@recidiviz/design-system";
import React from "react";
import styled from "styled-components/macro";

import * as fontStyles from "../CoreConstants.scss";

const MetricsCardComponent = styled(Card)`
  width: 100%;
  :first-child {
    margin-right: 1rem;
  }
  display: flex;
  flex-flow: row nowrap;
  min-height: 120px;
  padding: 20px 40px;
  justify-content: space-between;
`;

const MetricHeading = styled.div`
  color: ${fontStyles.pine1};
  font: ${fontStyles.fontUiSans16};
  letter-spacing: -0.01em;
`;

const MetricSubHeading = styled.div`
  color: ${fontStyles.slate80};
  font: ${fontStyles.fontUiSans14};
  letter-spacing: -0.01em;
`;

const HeadingContainer = styled.div`
  display: flex;
  flex-flow: column;
  justify-content: center;
  height: 64px;
`;

const CardSection = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: center;
`;

interface MetricsCardProps {
  heading: string;
  subheading?: string;
  children: React.ReactNode;
}

const MetricsCard: React.FC<MetricsCardProps> = ({
  heading,
  subheading,
  children,
}) => {
  return (
    <MetricsCardComponent>
      <CardSection>
        <HeadingContainer>
          <MetricHeading>{heading}</MetricHeading>
          {subheading && <MetricSubHeading>{subheading}</MetricSubHeading>}
        </HeadingContainer>
      </CardSection>
      <CardSection>{children}</CardSection>
    </MetricsCardComponent>
  );
};

export default MetricsCard;
