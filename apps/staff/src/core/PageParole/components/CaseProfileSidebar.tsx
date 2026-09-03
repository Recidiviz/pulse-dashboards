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
import { Fragment, useState } from "react";
import styled, { css } from "styled-components";

import { ParoleCase } from "~datatypes";
import { Icon, IconSVG, palette } from "~design-system";

import useIsStuck from "../../../hooks/useIsStuck";
import type { ParoleConfig } from "../../models/types";
import { NAV_BAR_HEIGHT } from "../../NavigationLayout";
import { PaddedSectionCardBody } from "./PaddedSectionCardBody";
import { DefaultParoleGeneralInfo } from "./ParoleGeneralInfo";
import { PAROLE_SECTION_LABELS } from "./ParoleSectionComponents";
import {
  AlertBanner,
  Hr,
  PAROLE_SECTION_IDS,
  scrollToSection,
  SectionCard,
  SectionStack,
} from "./shared";

const PAROLE_RETURN_COLOR = palette.signal.notification;
const PAROLE_RETURN_BACKGROUND_COLOR = "rgba(35, 124, 175, 0.08)";

const FullWidthAlertBanner = styled(AlertBanner)`
  margin-left: -1rem;
  margin-right: -1rem;
`;

const StickyNavSentinel = styled.div`
  height: 0;
`;

const InfoCard = styled(SectionCard)<{ $isNavStuck: boolean }>`
  ${({ $isNavStuck }) =>
    !$isNavStuck &&
    css`
      border-bottom: none;
      border-bottom-left-radius: 0;
      border-bottom-right-radius: 0;
    `}
`;

const SectionNavCard = styled(SectionCard)<{ $isNavStuck: boolean }>`
  position: sticky;
  top: ${rem(NAV_BAR_HEIGHT + spacing.lg)};

  ${({ $isNavStuck }) =>
    !$isNavStuck &&
    css`
      border-top-left-radius: 0;
      border-top-right-radius: 0;
    `}
`;

const NavCardBody = styled.div`
  padding: 1rem 0;
`;

const SectionNav = styled.nav`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
`;

const SectionNavButton = styled.button`
  ${typography.Sans14}
  display: block;
  width: 100%;
  padding: 0 1rem;
  border: none;
  background: none;
  color: ${palette.pine1};
  text-align: left;
  cursor: pointer;

  &:hover {
    color: ${palette.signal.links};
  }
`;

export function CaseProfileSidebar({
  caseDetail,
  config,
}: {
  caseDetail: ParoleCase;
  config: ParoleConfig;
}) {
  const [sentinel, setSentinel] = useState<HTMLDivElement | null>(null);
  const isNavStuck = useIsStuck(
    sentinel,
    `-${NAV_BAR_HEIGHT + spacing.lg}px 0px 0px 0px`,
  );

  const SidebarBody = config.sidebarComponent ?? DefaultParoleGeneralInfo;

  // Resolve the section nav labels, letting a tenant override the
  // conduct-history label the same way it overrides the section title.
  const sectionLabels = {
    ...PAROLE_SECTION_LABELS,
    conductHistory:
      config.conductHistoryTitle ?? PAROLE_SECTION_LABELS.conductHistory,
  };

  return (
    <>
      <InfoCard $isNavStuck={isNavStuck}>
        <PaddedSectionCardBody>
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

            <SidebarBody caseDetail={caseDetail} config={config} />
          </SectionStack>
        </PaddedSectionCardBody>
      </InfoCard>

      <StickyNavSentinel ref={setSentinel} />
      <SectionNavCard $isNavStuck={isNavStuck}>
        <NavCardBody>
          <SectionNav>
            {config.sections.map((sectionName, index) => (
              <Fragment key={sectionName}>
                {index > 0 && <Hr />}
                <SectionNavButton
                  type="button"
                  onClick={() =>
                    scrollToSection(PAROLE_SECTION_IDS[sectionName])
                  }
                >
                  {sectionLabels[sectionName]}
                </SectionNavButton>
              </Fragment>
            ))}
          </SectionNav>
        </NavCardBody>
      </SectionNavCard>
    </>
  );
}
