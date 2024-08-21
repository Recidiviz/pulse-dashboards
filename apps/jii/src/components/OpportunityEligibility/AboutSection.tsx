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
  animation,
  palette,
  spacing,
  typography,
} from "@recidiviz/design-system";
import { observer } from "mobx-react-lite";
import { rem } from "polished";
import { FC } from "react";
import {
  Accordion as AccordionBase,
  AccordionItem as AccordionItemBase,
  AccordionItemButton as AccordionItemButtonBase,
  AccordionItemHeading as AccordionItemHeadingBase,
  AccordionItemPanel as AccordionItemPanelBase,
} from "react-accessible-accordion";
import styled from "styled-components/macro";

import { CopyWrapper } from "../CopyWrapper/CopyWrapper";
import { ButtonLink } from "./ButtonLink";
import { OpportunityEligibilityPresenter } from "./OpportunityEligibilityPresenter";
import { Section, SectionHeading } from "./styles";

const Accordion = styled(AccordionBase)`
  border-top: 1px solid ${palette.slate20};
  margin-top: ${rem(spacing.xl)};
`;

const AccordionItem = styled(AccordionItemBase)`
  border-bottom: 1px solid ${palette.slate20};
  padding: 0 ${rem(spacing.xs)};
`;

const AccordionMarker = styled.div``;

const LINE_THICKNESS = 2;
const SIGN_SIZE = 20;

const AccordionItemButton = styled(AccordionItemButtonBase)`
  align-items: center;
  cursor: pointer;
  display: flex;
  justify-content: space-between;
  min-height: ${rem(56)};
  transition: color ${animation.defaultDurationMs}ms ease-out;

  &:hover {
    color: ${palette.signal.highlight};
  }

  /* minus sign */
  ${AccordionMarker} {
    background: currentColor;
    content: "";
    display: block;
    height: ${rem(LINE_THICKNESS)};
    position: relative;
    width: ${rem(SIGN_SIZE)};
  }

  /* plus sign */
  &[aria-expanded="false"] ${AccordionMarker}::after {
    background: currentColor;
    content: "";
    height: ${rem(SIGN_SIZE)};
    left: ${rem(SIGN_SIZE / 2 - LINE_THICKNESS / 2)};
    position: absolute;
    top: ${rem(-SIGN_SIZE / 2 + LINE_THICKNESS / 2)};
    width: ${rem(2)};
  }
`;

const AccordionItemHeading = styled(AccordionItemHeadingBase)`
  ${typography.Sans16}

  color: ${palette.signal.links};
`;
const AccordionItemPanel = styled(AccordionItemPanelBase)`
  margin-bottom: ${rem(spacing.xl)};
`;

export const AboutSection: FC<{
  presenter: OpportunityEligibilityPresenter;
}> = observer(function AboutSection({ presenter }) {
  const [mainSection, ...collapsibleSections] = presenter.aboutContent.sections;

  return (
    <Section>
      <SectionHeading>{mainSection.heading}</SectionHeading>
      <CopyWrapper>{mainSection.body}</CopyWrapper>

      {collapsibleSections.length > 0 && (
        <Accordion
          allowZeroExpanded
          onChange={([openSectionHeadingEncoded]) => {
            // this is configured for only one section to be open at a time
            if (openSectionHeadingEncoded) {
              // set this to a string below when rendering AccordionItem
              presenter.trackAccordionOpened(
                decodeURIComponent(openSectionHeadingEncoded as string),
              );
            }
          }}
        >
          {collapsibleSections.map((section) => (
            <AccordionItem
              key={section.heading}
              uuid={encodeURIComponent(section.heading)}
            >
              <AccordionItemHeading>
                <AccordionItemButton>
                  {section.heading} <AccordionMarker />
                </AccordionItemButton>
              </AccordionItemHeading>
              <AccordionItemPanel>
                <CopyWrapper>{section.body}</CopyWrapper>
              </AccordionItemPanel>
            </AccordionItem>
          ))}
        </Accordion>
      )}

      <ButtonLink to={presenter.aboutContent.linkUrl}>
        {presenter.aboutContent.linkText}
      </ButtonLink>
    </Section>
  );
});
