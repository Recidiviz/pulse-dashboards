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
import React, { useEffect } from "react";
import { Link } from "react-router-dom";
import styled from "styled-components/macro";

import { ActionStrategyCopy } from "~datatypes";

import { useInsightsActionStrategyModal } from "../InsightsActionStrategyModal";
import { Banner } from "../sharedComponents";

const BannerTextWrapper = styled.div`
  display: flex;
  align-items: center;
  gap: ${rem(spacing.xs)};
  padding-bottom: ${rem(spacing.sm)};
  line-height: 1.5;
`;

const BannerText = styled.div`
  ${typography.Sans16};
  color: ${palette.pine1};
`;

const StyledLink = styled(Link)`
  color: ${palette.signal.links} !important;
  padding-top: ${rem(spacing.sm)};
  &:hover {
    text-decoration: underline;
  }
`;

type InsightsActionStrategyBannerType = {
  actionStrategy: ActionStrategyCopy[string];
  bannerViewedCallback: () => void;
  disableBannerCallback: () => void;
};

const InsightsActionStrategyBanner: React.FC<
  InsightsActionStrategyBannerType
> = ({ actionStrategy, bannerViewedCallback, disableBannerCallback }) => {
  const { openModal } = useInsightsActionStrategyModal();

  useEffect(() => {
    bannerViewedCallback();

    // These must be in different callbacks because the cleanup function
    // is only called when the component is unmounted, which does not happen
    // when a tab/window is closed. So we want to notify the BE that a banner
    // was viewed when the banner is first rendered, then disable it on navigation (unmount).
    return () => {
      disableBannerCallback();
    };
  }, [bannerViewedCallback, disableBannerCallback]);

  return (
    // (#7264): Wrap with the shared banner
    <Banner
      style={{
        width: "100%",
        border: `1px solid ${palette.slate10}`,
      }}
    >
      <BannerTextWrapper>
        <Icon
          kind={IconSVG.Lightbulb}
          fill={palette.pine2}
          height={16}
          width={16}
        />
        <BannerText>{actionStrategy.prompt}</BannerText>
      </BannerTextWrapper>
      <StyledLink
        to="#"
        onClick={() => openModal({ showActionStrategyList: false })}
      >
        Read more
      </StyledLink>
    </Banner>
  );
};

export default InsightsActionStrategyBanner;
