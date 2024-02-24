import { rem } from "polished";
import styled from "styled-components/macro";

import { DIMENSIONS_PX } from "./PDFFormGenerator";

type PrintablePageProps = {
  stretchable?: boolean;
};

export const PrintablePage = styled.div.attrs({
  className: "form-page",
})<PrintablePageProps>`
  background-color: white;
  height: ${(p) =>
    p.stretchable
      ? undefined
      : rem(DIMENSIONS_PX.HEIGHT - DIMENSIONS_PX.MARGIN)};
  max-height: ${(p) =>
    p.stretchable
      ? undefined
      : rem(DIMENSIONS_PX.HEIGHT - DIMENSIONS_PX.MARGIN)};
  min-height: ${(p) =>
    p.stretchable
      ? rem(DIMENSIONS_PX.HEIGHT - DIMENSIONS_PX.MARGIN)
      : undefined};
  width: ${rem(DIMENSIONS_PX.WIDTH - DIMENSIONS_PX.MARGIN)};
  max-width: ${rem(DIMENSIONS_PX.WIDTH - DIMENSIONS_PX.MARGIN)};
  overflow: hidden;
  color: black;
  font-family: Arial, serif;
  font-size: 9px;
  position: relative;

  line-height: 1.3;
`;

export const PrintablePageMargin = styled.div<{ stretchable?: boolean }>`
  background-color: white;
  padding: ${rem(18)};
  box-sizing: content-box;
  transform-origin: 0 0;

  height: ${(p) =>
    p.stretchable ? "none" : rem(DIMENSIONS_PX.HEIGHT - DIMENSIONS_PX.MARGIN)};
  max-height: ${(p) =>
    p.stretchable ? "none" : rem(DIMENSIONS_PX.HEIGHT - DIMENSIONS_PX.MARGIN)};
  min-height: ${(p) =>
    p.stretchable ? rem(DIMENSIONS_PX.HEIGHT - DIMENSIONS_PX.MARGIN) : "none"};
  width: ${rem(DIMENSIONS_PX.WIDTH - DIMENSIONS_PX.MARGIN)};
  max-width: ${rem(DIMENSIONS_PX.WIDTH - DIMENSIONS_PX.MARGIN)};
`;
