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

import { Modal, spacing } from "@recidiviz/design-system";
import { observer } from "mobx-react-lite";
import { rem, rgba } from "polished";
import styled from "styled-components";

import { PAGE_WIDTH } from "~@jii/common-ui";

import { AboutVideoPresenter } from "./AboutVideoPresenter";
import UsAzAboutVideo from "./UsAzAboutVideo.mp4";

const StyledVideoModal = styled(Modal)`
  .ReactModal__Content {
    width: ${rem(PAGE_WIDTH)};
    padding: ${rem(spacing.xs)};
    border-radius: unset;
    box-shadow: unset;
    background-color: black;
  }

  .ReactModal__Overlay {
    backdrop-filter: unset;
    background-color: ${rgba("black", 0.9)};
  }
`;

export const AboutVideoModal = observer(function AboutVideoModal({
  presenter,
}: {
  presenter: AboutVideoPresenter;
}) {
  return (
    <StyledVideoModal
      isOpen={presenter.videoIsOpen}
      onRequestClose={() => {
        presenter.videoIsOpen = false;
      }}
    >
      {/* This video has captions embedded in the video itself, though this is not ideal. */}
      {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
      <video width="100%" controls>
        <source src={UsAzAboutVideo} type="video/mp4" />
      </video>
    </StyledVideoModal>
  );
});
