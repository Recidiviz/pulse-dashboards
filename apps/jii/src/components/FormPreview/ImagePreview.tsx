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
  Button,
  Icon,
  palette,
  Sans24,
  spacing,
  typography,
} from "@recidiviz/design-system";
import { withErrorBoundary } from "@sentry/react";
import { observer } from "mobx-react-lite";
import { rem } from "polished";
import { FC } from "react";
import styled from "styled-components/macro";

import { MAX_MODAL_HEIGHT, MODAL_PADDING } from "../Modal/Modal";
import { NotFound } from "../NotFound/NotFound";
import { useRootStore } from "../StoreProvider/useRootStore";
import { ImagePreviewPresenter } from "./ImagePreviewPresenter";

const Wrapper = styled.article`
  display: flex;
  flex-direction: column;
  gap: ${rem(spacing.md)};
  /* This has to be a fixed value to prevent the contents from overflowing, 100% doesn't work */
  max-height: calc(${MAX_MODAL_HEIGHT} - ${rem(MODAL_PADDING * 2)});
`;

const FormImage = styled.div`
  background-position: center;
  background-repeat: no-repeat;
  background-size: contain;
  border: 1px solid ${palette.slate20};
  border-radius: ${rem(4)};
  min-height: 0;
  overflow: hidden;
`;

const ImageSizer = styled.img`
  max-width: 100%;
  visibility: hidden;
`;

const Controls = styled.div`
  ${typography.Sans14}

  align-items: center;
  color: ${palette.slate85};
  display: flex;
  justify-content: space-between;

  button {
    gap: ${rem(spacing.sm)};
  }
`;

/**
 * Image responds to screen size by adjusting its height as needed
 * to maximize size while fitting inside the modal
 */
const ResponsiveImage: FC<{ presenter: ImagePreviewPresenter }> = observer(
  function ResponsiveImage({ presenter }) {
    return (
      <FormImage
        role="img"
        aria-label={`Form preview: ${presenter.title} page ${presenter.currentPage}`}
        // this will be the actual image display, scaled to fit within this container;
        // the sizing is controlled by the invisible "sizer" element below
        style={{ backgroundImage: `url(${presenter.currentUrl})` }}
      >
        {/* this is used for sizing the container but will be invisible; it limits the container height
        based on the image's aspect ratio, but doesn't actually display the image correctly in all
        circumstances (it will be cropped rather than shrinking to fit on overflow) */}
        <ImageSizer src={presenter.currentUrl} />
      </FormImage>
    );
  },
);

const ImagePreviewWithPresenter: FC<{ presenter: ImagePreviewPresenter }> =
  observer(function ImagePreviewWithPresenter({ presenter }) {
    return (
      <Wrapper>
        <Sans24 as="h2">{presenter.title}</Sans24>
        <ResponsiveImage presenter={presenter} />
        <Controls>
          <Button shape="block" onClick={() => presenter.previous()}>
            <Icon kind="Arrow" size={14} rotate={180} /> Previous page
          </Button>
          <div>
            Page {presenter.currentPage} of {presenter.totalPages}
          </div>
          <Button shape="block" onClick={() => presenter.next()}>
            Next page
            <Icon kind="Arrow" size={14} />
          </Button>
        </Controls>
      </Wrapper>
    );
  });

export const ImagePreview: FC<{ opportunityUrl: string | undefined }> =
  withErrorBoundary(
    observer(function ImagePreview({ opportunityUrl }) {
      const { residentsStore } = useRootStore();
      if (!residentsStore) return;

      // in practice we don't expect this, something further up the component tree
      // should have already failed to render before we reach this point
      if (!opportunityUrl) {
        throw new Error(
          "URL does not contain a valid opportunity for image preview",
        );
      }

      return (
        <ImagePreviewWithPresenter
          presenter={new ImagePreviewPresenter(opportunityUrl, residentsStore)}
        />
      );
    }),
    { fallback: <NotFound /> },
  );