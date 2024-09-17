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
import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import styled from "styled-components/macro";

import { ActionStrategyCopy } from "../../InsightsStore/presenters/types";
import { InsightsActionStrategyModal } from "../InsightsActionStrategyModal";
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
  bannerViewedCallback: () => void;
  disableBannerCallback: () => void;
  supervisorHomepage?: boolean;
};

const InsightsActionStrategyBanner: React.FC<
  InsightsActionStrategyBannerType
> = ({
  actionStrategy,
  bannerViewedCallback,
  disableBannerCallback,
  supervisorHomepage = false,
}) => {
  const [modalIsOpen, setModalIsOpen] = useState<boolean>(false);

  const openModal = () => {
    setModalIsOpen(true);
  };

  const closeModal = () => {
    setModalIsOpen(false);
  };

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
    <Banner
      style={{
        width: supervisorHomepage ? "100%" : "66%",
        border: `1px solid ${palette.slate10}`,
      }}
    >
      <BannerText>{actionStrategy.prompt}</BannerText>
      <StyledLink to="#" onClick={openModal}>
        Read more
      </StyledLink>
      <InsightsActionStrategyModal
        isOpen={modalIsOpen}
        onBackClick={closeModal}
        actionStrategy={actionStrategy}
        supervisorHomepage={supervisorHomepage}
      />
    </Banner>
  );
};

export default InsightsActionStrategyBanner;
