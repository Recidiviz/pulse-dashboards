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

import { palette, spacing, typography } from "@recidiviz/design-system";
import { rem } from "polished";
import { Link } from "react-router-dom";
import styled from "styled-components/macro";

import { ActionStrategyCopy } from "../../InsightsStore/models/ActionStrategies";
import { Banner } from "../sharedComponents";

const BannerText = styled.div`
  ${typography.Sans16};
  color: ${palette.pine1};
  line-height: 1.5;
  padding-bottom: ${rem(spacing.sm)};
`;

const StyledLink = styled(Link)`
  color: ${palette.signal.links} !important;
  padding-top: ${rem(spacing.sm)};
`;

type InsightsActionStrategyBannerType = {
  actionStrategy: ActionStrategyCopy;
};

const InsightsActionStrategyBanner: React.FC<
  InsightsActionStrategyBannerType
> = ({ actionStrategy }) => {
  return (
    <Banner
      style={{
        width: "66%",
      }}
    >
      <BannerText>{actionStrategy.prompt}</BannerText>
      <StyledLink to={""}>Read more</StyledLink>
    </Banner>
  );
};

export default InsightsActionStrategyBanner;
