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

import { SyntheticEvent, useRef } from "react";

import type { OnboardingVideoAssets } from "~@jii/onboarding-video";
import { useUsMaTranslations } from "~@jii/translation";

import { useReentryAnalytics } from "../../../../../hooks/useReentryAnalytics";
import { getPositionSeconds, hasWatchedWholeVideo } from "../utils";
import { VideoContainer, VideoModal } from "./ReentryVideoModal.styles";

export type ReentryVideoModalProps = {
  isOpen: boolean;
  onClose: () => void;
  video: OnboardingVideoAssets;
};

// TODO(OBT-55332): replace this modal with the ~@jii/onboarding-video lightbox.
export const ReentryVideoModal = ({
  isOpen,
  onClose,
  video,
}: ReentryVideoModalProps) => {
  const trackEvent = useReentryAnalytics();

  const { t } = useUsMaTranslations();
  const title = t(($) => $.reentry.overview.video.modalTitle);

  const videoRef = useRef<HTMLVideoElement>(null);

  const trackPlay = (event: SyntheticEvent<HTMLVideoElement>) => {
    trackEvent("frontend_reentry_video_played", {
      positionSeconds: getPositionSeconds(event.currentTarget),
    });
  };

  const trackPause = (event: SyntheticEvent<HTMLVideoElement>) => {
    // Browsers also fire pause when the video ends on its own.
    const isEndOfVideo = event.currentTarget.ended;
    if (isEndOfVideo) return;

    trackEvent("frontend_reentry_video_paused", {
      positionSeconds: getPositionSeconds(event.currentTarget),
    });
  };

  const close = () => {
    if (videoRef.current) {
      trackEvent("frontend_reentry_video_closed", {
        positionSeconds: getPositionSeconds(videoRef.current),
        completed: hasWatchedWholeVideo(videoRef.current),
      });
    }
    onClose();
  };

  return (
    <VideoModal isOpen={isOpen} onRequestClose={close} contentLabel={title}>
      <VideoContainer>
        <video
          ref={videoRef}
          autoPlay
          controls
          onPlay={trackPlay}
          onPause={trackPause}
        >
          <source src={video.source} type="video/mp4" />
          <track kind="captions" {...video.captions} />
        </video>
      </VideoContainer>
    </VideoModal>
  );
};
