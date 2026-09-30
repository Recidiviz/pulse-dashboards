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

import { spacing, typography } from "@recidiviz/design-system";
import { rem } from "polished";
import { ReactNode, useState } from "react";
import styled, { css } from "styled-components";

import { ParoleCase } from "~datatypes";
import { Icon, IconSVG, palette } from "~design-system";

import useIsStuck from "../../../hooks/useIsStuck";
import { NAV_BAR_HEIGHT } from "../../NavigationLayout";
import {
  AlertBanner,
  PAROLE_SIDEBAR_PADDING_HORIZONTAL,
  PAROLE_SIDEBAR_PADDING_VERTICAL,
  scrollToSection,
  SectionCard,
  SectionStack,
} from "./shared";

const PAROLE_RETURN_COLOR = palette.signal.notification;
const PAROLE_RETURN_BACKGROUND_COLOR = "rgba(35, 124, 175, 0.08)";

const FullWidthAlertBanner = styled(AlertBanner)`
  margin-left: -${PAROLE_SIDEBAR_PADDING_HORIZONTAL};
  margin-right: -${PAROLE_SIDEBAR_PADDING_HORIZONTAL};
`;

const InfoCardBody = styled.div`
  padding: ${PAROLE_SIDEBAR_PADDING_VERTICAL}
    ${PAROLE_SIDEBAR_PADDING_HORIZONTAL};
`;

const StickyNavSentinel = styled.div`
  height: 0;
`;

const cornerRadiusStyles = ({ $cornerRadius }: { $cornerRadius?: string }) =>
  $cornerRadius &&
  css`
    border-radius: ${$cornerRadius};
  `;

// With a banner, the card stops clipping so the banner can cover its border.
const InfoCard = styled(SectionCard)<{
  $isNavStuck: boolean;
  $hasBanner: boolean;
  $cornerRadius?: string;
}>`
  ${cornerRadiusStyles}

  ${({ $hasBanner }) =>
    $hasBanner &&
    css`
      overflow: visible;
    `}

  ${({ $isNavStuck }) =>
    !$isNavStuck &&
    css`
      border-bottom: none;
      border-bottom-left-radius: 0;
      border-bottom-right-radius: 0;
    `}
`;

const BannerSlot = styled.div`
  margin: -1px -1px 0;
  border-top-left-radius: inherit;
  border-top-right-radius: inherit;
  overflow: hidden;
`;

const SectionNavCard = styled(SectionCard)<{
  $isNavStuck: boolean;
  $cornerRadius?: string;
}>`
  position: sticky;
  top: ${rem(NAV_BAR_HEIGHT + spacing.lg)};

  ${cornerRadiusStyles}

  ${({ $isNavStuck }) =>
    !$isNavStuck &&
    css`
      border-top-left-radius: 0;
      border-top-right-radius: 0;
    `}
`;

const NavCardBody = styled.div`
  padding: ${rem(14)} ${rem(spacing.md)};
`;

const SectionNav = styled.nav`
  display: flex;
  flex-direction: column;
  gap: ${rem(spacing.md)};
`;

const SectionNavButton = styled.button`
  ${typography.Sans14}
  display: block;
  width: 100%;
  padding: 0;
  border: none;
  background: none;
  color: ${palette.pine4};
  text-align: left;
  cursor: pointer;

  &:hover {
    color: ${palette.pine3};
  }
`;

/** One "jump to section" nav entry. `id` is the DOM id it scrolls to. */
export type ParoleSectionNavItem = {
  id: string;
  label: string;
};

/**
 * Case info card, with a sticky "jump to section" nav below it.
 *
 * @param caseDetail - The case the card describes.
 * @param sections - Nav entries, in the order the sections render in.
 * @param banner - Drawn across the top of the info card, above its padded
 *   body, covering the card's top border. The slot sets the corners; the
 *   banner sets its own height.
 * @param cornerRadius - Corner radius of both sidebar cards, in place of the
 *   SectionCard default.
 * @param children - Body of the info card.
 */
export function CaseProfileSidebar({
  caseDetail,
  sections,
  banner,
  cornerRadius,
  children,
}: {
  caseDetail: ParoleCase;
  sections: ReadonlyArray<ParoleSectionNavItem>;
  banner?: ReactNode;
  cornerRadius?: string;
  children: ReactNode;
}) {
  const [sentinel, setSentinel] = useState<HTMLDivElement | null>(null);
  const isNavStuck = useIsStuck(
    sentinel,
    `-${NAV_BAR_HEIGHT + spacing.lg}px 0px 0px 0px`,
  );

  return (
    <>
      <InfoCard
        $isNavStuck={isNavStuck}
        $hasBanner={banner !== undefined}
        $cornerRadius={cornerRadius}
      >
        {banner && <BannerSlot>{banner}</BannerSlot>}
        <InfoCardBody>
          <SectionStack>
            {caseDetail.isParoleReturn && (
              <FullWidthAlertBanner
                $color={PAROLE_RETURN_COLOR}
                $backgroundColor={PAROLE_RETURN_BACKGROUND_COLOR}
                $textColor={PAROLE_RETURN_COLOR}
                $fontWeight="600"
                $alignItems="center"
                $marginBottom="0"
              >
                <Icon
                  kind={IconSVG.Info}
                  width={16}
                  color={PAROLE_RETURN_COLOR}
                  aria-hidden="true"
                />
                Parole Return
              </FullWidthAlertBanner>
            )}

            {children}
          </SectionStack>
        </InfoCardBody>
      </InfoCard>

      <StickyNavSentinel ref={setSentinel} />
      <SectionNavCard $isNavStuck={isNavStuck} $cornerRadius={cornerRadius}>
        <NavCardBody>
          <SectionNav>
            {sections.map((section) => (
              <SectionNavButton
                key={section.id}
                type="button"
                onClick={() => scrollToSection(section.id)}
              >
                {section.label}
              </SectionNavButton>
            ))}
          </SectionNav>
        </NavCardBody>
      </SectionNavCard>
    </>
  );
}
