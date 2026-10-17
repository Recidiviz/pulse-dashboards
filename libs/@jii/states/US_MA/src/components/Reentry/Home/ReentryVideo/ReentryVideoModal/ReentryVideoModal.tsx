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

import type { OnboardingVideoAssets } from "~@jii/onboarding-video";
import { useUsMaTranslations } from "~@jii/translation";
import { Icon, palette } from "~design-system";

import {
  CloseButton,
  Footer,
  Header,
  Title,
  VideoContainer,
  VideoModal,
} from "./ReentryVideoModal.styles";

export type ReentryVideoModalProps = {
  isOpen: boolean;
  onClose: () => void;
  // TODO(REE-200): make this required once the video is ready
  video: OnboardingVideoAssets | undefined;
};

export const ReentryVideoModal = ({
  isOpen,
  onClose,
  video,
}: ReentryVideoModalProps) => {
  const { t } = useUsMaTranslations();
  const title = t(($) => $.reentry.overview.video.modalTitle);

  return (
    <VideoModal isOpen={isOpen} onRequestClose={onClose} contentLabel={title}>
      <Header>
        <Title>{title}</Title>
        <CloseButton
          type="button"
          aria-label={t(($) => $.reentry.overview.video.modalClose)}
          onClick={onClose}
        >
          <Icon kind="Close" size={10} color={palette.slate85} />
        </CloseButton>
      </Header>
      <VideoContainer>
        {/* TODO(REE-200): drop the placeholder once the video is ready */}
        {video ? (
          <video controls>
            <source src={video.source} type="video/mp4" />
            <track kind="captions" default {...video.captions} />
          </video>
        ) : (
          "Video coming soon"
        )}
      </VideoContainer>
      <Footer>{t(($) => $.reentry.overview.video.modalFooter)}</Footer>
    </VideoModal>
  );
};
