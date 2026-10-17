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

import { useResidentsContext } from "~@jii/data";
import {
  ABOUT_VIDEO_ILLUSTRATION_BACKGROUND,
  aboutVideoIllustration,
} from "~@jii/onboarding-video";
import { useUsMaTranslations } from "~@jii/translation";
import { Icon, palette } from "~design-system";

import {
  Banner,
  Description,
  DismissButton,
  Title,
} from "./ReentryVideoBanner.styles";

export type ReentryVideoBannerProps = {
  onOpenVideo: () => void;
};

export const ReentryVideoBanner = observer(function ReentryVideoBanner({
  onOpenVideo,
}: ReentryVideoBannerProps) {
  const { t } = useUsMaTranslations();
  const { userProperties, residentsStore } = useResidentsContext();

  if (userProperties?.hasSeenReentryOnboarding) return null;

  const title = t(($) => $.reentry.overview.video.title);

  return (
    <Banner
      illustrationSrc={aboutVideoIllustration}
      illustrationAlt={title}
      illustrationBackground={ABOUT_VIDEO_ILLUSTRATION_BACKGROUND}
      illustrationOnClick={onOpenVideo}
    >
      <DismissButton
        type="button"
        aria-label={t(($) => $.reentry.overview.video.dismissBanner)}
        onClick={() => residentsStore.setUserReentryOnboardingSeen()}
      >
        <Icon kind="Close" size={10} color={palette.slate85} />
      </DismissButton>
      <Title>{title}</Title>
      <Description>
        {t(($) => $.reentry.overview.video.bannerDescription)}
      </Description>
    </Banner>
  );
});
