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

import { animation, spacing } from "@recidiviz/design-system";
import { observer } from "mobx-react-lite";
import { rem } from "polished";
import styled, { css, keyframes } from "styled-components";

import {
  Card,
  JIIDropdownMenuItem,
  JIIDropdownToggle,
  SlateCopy,
} from "~@jii/common-ui";
import { useUsAzTranslations } from "~@jii/translation";
import {
  Dropdown,
  DropdownMenu,
  Icon,
  palette,
  typography,
} from "~design-system";

import ctaIllustration from "./AboutVideoCtaIllustration.svg";
import { AboutVideoPresenter } from "./AboutVideoPresenter";

type FadeOutAnimationProps = { $fadeOut: boolean };

const fadeOutKeyframes = keyframes`
  100% { opacity: 0; }
`;

const fadeOutAnimation = (props: FadeOutAnimationProps) =>
  props.$fadeOut &&
  css`
    animation: ${fadeOutKeyframes} ${animation.defaultDurationMs}ms forwards;
  `;

const CtaCard = styled(Card)<FadeOutAnimationProps>`
  margin-top: ${rem(spacing.md)};
  padding: 0;
  display: flex;
  flex-wrap: wrap;
  overflow: hidden;

  ${fadeOutAnimation}
`;

const IllustrationWrapper = styled.button`
  background-color: #121c3f;
  border: none;

  flex: 1;
  min-width: ${rem(200)};

  display: flex;
  align-items: center;
  justify-content: center;

  padding: ${rem(spacing.md)} 0;
`;

const CLICK_TARGET_SIZE = 30;
const CLOSE_ICON_SIZE = 14;

const CardContent = styled.div`
  position: relative;

  flex: 2;
  min-width: ${rem(300)};
  padding: ${rem(spacing.lg)};
  padding-right: ${rem(spacing.lg + CLICK_TARGET_SIZE)};

  > h3 {
    ${typography.Sans24}
    margin: unset;
    color: unset;

    margin-bottom: ${rem(spacing.md)};
    padding-right: ${rem(spacing.sm)};
  }
`;

const StyledDropdown = styled(Dropdown)`
  position: absolute;
  right: ${rem(spacing.lg - (CLICK_TARGET_SIZE - CLOSE_ICON_SIZE) / 2)};
  top: ${rem(spacing.lg - (CLICK_TARGET_SIZE - CLOSE_ICON_SIZE) / 2)};
`;

const StyledDropdownToggle = styled(JIIDropdownToggle)`
  height: ${rem(CLICK_TARGET_SIZE)};
  width: ${rem(CLICK_TARGET_SIZE)};

  display: flex;
  justify-content: center;
  align-items: center;

  border-width: 0;
  background-color: unset !important;
`;

// show the menu below the close icon, not overlapping with it
const StyledDropdownMenu = styled(DropdownMenu)`
  top: ${rem(CLICK_TARGET_SIZE)};
`;

const CloseIcon = styled(Icon).attrs({
  kind: "Close",
  color: palette.slate60,
  size: CLOSE_ICON_SIZE,
})``;

export const AboutVideoCtaCard = observer(function AboutVideoCtaCard({
  presenter,
}: {
  presenter: AboutVideoPresenter;
}) {
  const { t } = useUsAzTranslations();

  return (
    <CtaCard
      $fadeOut={presenter.userRequestedCtaHide}
      onAnimationEnd={async () => {
        await presenter.hideCta();
      }}
    >
      <IllustrationWrapper
        onClick={() => {
          presenter.videoIsOpen = true;
        }}
      >
        <img
          src={ctaIllustration}
          alt={t(($) => $.aboutVideo.homepageCta.videoButtonAltText)}
        />
      </IllustrationWrapper>

      <CardContent>
        {presenter.onHomepage && (
          <StyledDropdown>
            <StyledDropdownToggle>
              {/* @ts-expect-error https://github.com/styled-components/styled-components/issues/4314 */}
              <CloseIcon
                aria-label={t(
                  ($) => $.aboutVideo.homepageCta.closeButtonAltText,
                )}
              />
            </StyledDropdownToggle>
            <StyledDropdownMenu alignment="right">
              <JIIDropdownMenuItem
                onClick={() => {
                  presenter.userRequestedCtaHide = true;
                }}
              >
                {t(($) => $.aboutVideo.homepageCta.confirmClose)}
              </JIIDropdownMenuItem>
              <JIIDropdownMenuItem
                onClick={() => {
                  // do nothing, clicking automatically closes the menu
                }}
              >
                {t(($) => $.aboutVideo.homepageCta.cancelClose)}
              </JIIDropdownMenuItem>
            </StyledDropdownMenu>
          </StyledDropdown>
        )}

        <h3>{t(($) => $.aboutVideo.homepageCta.heading)}</h3>

        <SlateCopy>{t(($) => $.aboutVideo.homepageCta.description)}</SlateCopy>
      </CardContent>
    </CtaCard>
  );
});
