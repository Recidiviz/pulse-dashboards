import { palette, Pill, spacing } from "@recidiviz/design-system";
import { rem, transparentize } from "polished";
import styled from "styled-components/macro";

import { DIMENSIONS_PX } from "./PDFFormGenerator";

export const FormViewerStatus = styled(Pill)`
  display: flex;
  flex-direction: row;
  align-items: center;
  padding: ${rem(spacing.md)} ${rem(spacing.lg)};
  margin-top: ${rem(spacing.sm)};

  background-color: ${transparentize(0.85, palette.signal.highlight)};
  color: white;
`;

export const PrintablePage = styled.div.attrs({ className: "form-page" })`
  background-color: white;
  height: ${rem(DIMENSIONS_PX.HEIGHT - DIMENSIONS_PX.MARGIN)};
  max-height: ${rem(DIMENSIONS_PX.HEIGHT - DIMENSIONS_PX.MARGIN)};
  width: ${rem(DIMENSIONS_PX.WIDTH - DIMENSIONS_PX.MARGIN)};
  max-width: ${rem(DIMENSIONS_PX.WIDTH - DIMENSIONS_PX.MARGIN)};
  overflow: hidden;
  color: black;
  font-family: Arial, serif;
  font-size: 9px;
  position: relative;

  line-height: 1.3;
`;

export const PrintablePageMargin = styled.div`
  background-color: white;
  padding: ${rem(18)};
  box-sizing: content-box;
  transform-origin: 0 0;

  height: ${rem(DIMENSIONS_PX.HEIGHT - DIMENSIONS_PX.MARGIN)};
  max-height: ${rem(DIMENSIONS_PX.HEIGHT - DIMENSIONS_PX.MARGIN)};
  width: ${rem(DIMENSIONS_PX.WIDTH - DIMENSIONS_PX.MARGIN)};
  max-width: ${rem(DIMENSIONS_PX.WIDTH - DIMENSIONS_PX.MARGIN)};
`;
