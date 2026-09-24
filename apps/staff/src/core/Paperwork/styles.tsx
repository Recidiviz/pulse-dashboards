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

import { rem } from "polished";
import { ReactNode, RefObject, useLayoutEffect, useRef } from "react";
import styled, { css } from "styled-components";

import { DIMENSIONS_PX } from "./PDFFormGenerator";

type PrintablePageProps = {
  stretchable?: boolean;
  lineHeight?: number;
  landscape?: boolean;
  hidden?: boolean;
  watermark?: string;
};

function pageHeight(landscape = false): string {
  if (landscape) {
    return rem(DIMENSIONS_PX.WIDTH - DIMENSIONS_PX.MARGIN);
  }
  return rem(DIMENSIONS_PX.HEIGHT - DIMENSIONS_PX.MARGIN);
}

function pageWidth(landscape = false): string {
  if (landscape) {
    return rem(DIMENSIONS_PX.HEIGHT - DIMENSIONS_PX.MARGIN);
  }
  return rem(DIMENSIONS_PX.WIDTH - DIMENSIONS_PX.MARGIN);
}

export const PrintablePageContainer = styled.div.attrs({
  className: "form-page",
})<Exclude<PrintablePageProps, "watermark">>`
  display: ${(p) => (p.hidden ? "none" : "flex")};
  flex-direction: column;
  background-color: white;
  height: ${(p) => (p.stretchable ? undefined : pageHeight(p.landscape))};
  max-height: ${(p) => (p.stretchable ? undefined : pageHeight(p.landscape))};
  min-height: ${(p) => (p.stretchable ? pageHeight(p.landscape) : undefined)};
  width: ${(p) => pageWidth(p.landscape)};
  max-width: ${(p) => pageWidth(p.landscape)};
  overflow: hidden;
  color: black;
  font-family: Arial, serif;
  font-size: 9px;
  position: relative;

  line-height: ${({ lineHeight }) => lineHeight ?? 1.3};
`;

export const PrintablePageMargin = styled.div<
  Exclude<PrintablePageProps, "lineHeight">
>`
  background-color: white;
  padding: ${rem(18)};
  box-sizing: content-box;
  transform-origin: 0 0;

  height: ${(p) => (p.stretchable ? "none" : pageHeight(p.landscape))};
  max-height: ${(p) => (p.stretchable ? "none" : pageHeight(p.landscape))};
  min-height: ${(p) => (p.stretchable ? pageHeight(p.landscape) : "none")};
  width: ${(p) => pageWidth(p.landscape)};
  max-width: ${(p) => pageWidth(p.landscape)};

  ${(p) =>
    p.watermark &&
    css`
      &::before {
        display: flex;
        position: absolute;
        z-index: 1;
        content: "${p.watermark}";
        width: 100%;
        height: 100%;
        font-size: 160pt;
        color: black;
        justify-content: center;
        align-items: center;
        transform: rotate(-45deg);
        opacity: 0.06;
        pointer-events: none;
      }
    `}
`;

/**
 * A fixed-height page drops content past its bottom edge with no visual cue, so
 * report it here. No dependency array: any answer can be the one that overflows.
 */
function useOverflowWarning(
  ref: RefObject<HTMLElement | null>,
  { stretchable, hidden }: PrintablePageProps,
) {
  useLayoutEffect(() => {
    if (import.meta.env.VITE_DEPLOY_ENV === "production") return;
    const page = ref.current;
    if (!page || stretchable || hidden) return;

    const overflow = page.scrollHeight - page.clientHeight;
    if (overflow > 1) {
      console.warn(
        `PrintablePage overflows its fixed height by ${overflow}px. That content is clipped, not paginated, and will be missing from the printed form.`,
        page,
      );
    }
  });
}

export const PrintablePage = (
  props: PrintablePageProps & { children: ReactNode },
) => {
  const pageRef = useRef<HTMLDivElement>(null);
  useOverflowWarning(pageRef, props);

  return (
    <PrintablePageMargin {...props}>
      <PrintablePageContainer {...props} ref={pageRef}>
        {props.children}
      </PrintablePageContainer>
    </PrintablePageMargin>
  );
};
