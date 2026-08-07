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

import { Sans18, typography } from "@recidiviz/design-system";
import { rem } from "polished";
import React, { useRef } from "react";
import styled from "styled-components";

import { palette } from "~design-system";

import useIsMobile from "../../hooks/useIsMobile";

// A CSS grid whose single row animates between `1fr` (expanded) and `0fr`
// (collapsed). This lets the block smoothly collapse to zero height — sliding
// whatever renders below it up — without needing to measure the content.
const Collapsible = styled.div<{ $expanded: boolean }>`
  display: grid;
  grid-template-rows: ${({ $expanded }) => ($expanded ? "1fr" : "0fr")};
  transition: grid-template-rows 300ms ease;
`;

// `min-height: 0` + `overflow: hidden` let the grid row shrink below the
// content's intrinsic height and clip it (including the bottom spacing) while
// the row collapses.
const CollapsibleInner = styled.div`
  min-height: 0;
  overflow: hidden;
`;

const Content = styled.div<{
  $hero: boolean;
  $isMobile: boolean;
  $align: "left" | "center";
}>`
  max-width: 60rem;
  margin-bottom: 2rem;

  ${({ $align }) =>
    $align === "center"
      ? `margin-left: auto;
         margin-right: auto;
         text-align: center;`
      : `text-align: left;`}

  ${({ $hero, $isMobile }) =>
    $hero &&
    ($isMobile
      ? `min-height: 70vh;
         display: grid;
         align-content: center;`
      : `margin-top: ${rem(108)};`)}
`;

const HeaderText = styled.div<{ $isMobile: boolean; $hasCta: boolean }>`
  ${({ $isMobile }) => ($isMobile ? typography.Serif24 : typography.Serif34)}
  color: ${palette.pine2};
  margin-bottom: ${({ $hasCta }) => ($hasCta ? 1 : 0)}rem;
`;

const CallToActionText = styled(Sans18)`
  color: ${palette.slate70};
  text-wrap: balance;
  min-height: 2lh;
`;

// Renders next to the header text (e.g. an understaffed pill). Inline so it
// flows with the header and stays centered/left per the parent's alignment.
const HeaderAccessory = styled.span`
  display: inline-flex;
  vertical-align: middle;
  margin-left: 0.5rem;
`;

type WorkflowsResultsHeaderProps = {
  headerText?: string;
  callToActionText?: React.ReactNode;
  /** Optional element rendered next to the header text (e.g. a pill). */
  headerAccessory?: React.ReactNode;
  /**
   * When true (and a CTA is present), reproduces the original full-height
   * "hero" spacing — vertically centered on mobile, large top margin on
   * desktop. Used when the header renders in place of the results (i.e. below
   * the caseload selects) rather than above them.
   */
  verticallyCentered?: boolean;
  /** Horizontal alignment of the header + CTA. Defaults to "center". */
  align?: "left" | "center";
};

/**
 * The header + call-to-action shown alongside the caseload selects. When
 * neither `headerText` nor `callToActionText` is provided, the block smoothly
 * collapses to zero height, sliding whatever renders below it up.
 */
export function WorkflowsResultsHeader({
  headerText,
  callToActionText,
  headerAccessory,
  verticallyCentered = false,
  align = "center",
}: WorkflowsResultsHeaderProps): React.ReactElement {
  const { isMobile } = useIsMobile(true);
  const expanded = Boolean(headerText || callToActionText);

  // While collapsing, the parent has already cleared `headerText`/
  // `callToActionText`. Keep rendering the last non-empty content so it stays
  // mounted and can animate out (clipped by `overflow: hidden`) instead of
  // vanishing instantly. When expanding, the content is present, so we show it.
  const lastContentRef = useRef({ headerText, callToActionText });
  if (expanded) {
    lastContentRef.current = { headerText, callToActionText };
  }
  const shown = expanded
    ? { headerText, callToActionText }
    : lastContentRef.current;

  const hero = verticallyCentered && Boolean(shown.callToActionText);

  return (
    <Collapsible
      $expanded={expanded}
      aria-hidden={!expanded}
      className="WorkflowsResultsHeader"
    >
      <CollapsibleInner>
        <Content $hero={hero} $isMobile={isMobile} $align={align}>
          {shown.headerText && (
            <HeaderText
              $isMobile={isMobile}
              $hasCta={Boolean(shown.callToActionText)}
            >
              {shown.headerText}
              {headerAccessory && (
                <HeaderAccessory>{headerAccessory}</HeaderAccessory>
              )}
            </HeaderText>
          )}
          {shown.callToActionText && (
            <CallToActionText>{shown.callToActionText}</CallToActionText>
          )}
        </Content>
      </CollapsibleInner>
    </Collapsible>
  );
}
