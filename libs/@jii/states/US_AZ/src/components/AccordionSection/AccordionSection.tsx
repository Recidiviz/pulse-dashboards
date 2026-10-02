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

import { rem } from "polished";
import styled from "styled-components";

import { Accordion, HomepageSectionHeading } from "~@jii/common-ui";
import { Button, palette, spacing } from "~design-system";

import {
  AccordionSectionProps,
  useAccordionSection,
} from "./useAccordionSection";

const SpacedSection = styled.section`
  margin-bottom: ${rem(spacing.xxl)};
`;

const SectionHeading = styled(HomepageSectionHeading)`
  margin: 0;
`;

const HeaderRow = styled.div`
  display: flex;
  justify-content: space-between;
  gap: ${rem(spacing.md)};
  align-items: flex-start;
  margin-bottom: ${rem(spacing.md)};
`;

const PaddedButton = styled(Button)`
  flex-shrink: 0;
  padding: ${rem(12)} ${rem(spacing.md)};
  color: ${palette.pine3};
  min-width: ${rem(160)};
  white-space: nowrap;
`;

/**
 * An accordion with an optional header and button that opens/closes all accordion panels.
 */
export function AccordionSection(props: AccordionSectionProps) {
  const { id, accordionCopy, sectionCopy } = props;
  const { toggledPanels, toggle, showOrHideAll } = useAccordionSection(props);

  return (
    <SpacedSection id={id}>
      <HeaderRow>
        <SectionHeading>{sectionCopy.header}</SectionHeading>
        <PaddedButton
          kind={"secondary"}
          shape={"block"}
          onClick={showOrHideAll.onButtonClick}
        >
          {showOrHideAll.buttonCopy}
        </PaddedButton>
      </HeaderRow>

      <Accordion
        id={id}
        copy={accordionCopy}
        toggledPanels={toggledPanels}
        onToggle={toggle}
      />
    </SpacedSection>
  );
}
