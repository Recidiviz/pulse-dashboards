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

import { observer } from "mobx-react-lite";
import { rem } from "polished";
import styled from "styled-components";

import { Accordion, HomepageSectionHeading } from "~@jii/common-ui";
import { Button, palette, spacing } from "~design-system";
import { withPresenterManager } from "~hydration-utils";

import {
  AccordionSectionPresenter,
  AccordionSectionProps,
} from "./AccordionSectionPresenter";

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
  align-items: center;
  margin-bottom: ${rem(spacing.md)};
`;

const PaddedButton = styled(Button)`
  flex-shrink: 0;
  padding: ${rem(12)} ${rem(spacing.md)};
  color: ${palette.pine3};
`;

const ManagedComponent = observer(function AccordionSection({
  presenter,
}: {
  presenter: AccordionSectionPresenter;
}) {
  return (
    <SpacedSection id={presenter.id}>
      <HeaderRow>
        <SectionHeading>{presenter.sectionCopy.header}</SectionHeading>
        <PaddedButton
          kind={"secondary"}
          shape={"block"}
          onClick={() => {
            presenter.showOrHideAll.onButtonClick();
          }}
        >
          {presenter.showOrHideAll.buttonCopy}
        </PaddedButton>
      </HeaderRow>

      <Accordion
        id={presenter.id}
        copy={presenter.accordionCopy}
        toggledPanels={presenter.toggledPanels}
        onToggle={presenter.toggle}
      />
    </SpacedSection>
  );
});

function usePresenter({
  id,
  accordionCopy,
  sectionCopy,
  faqPresenter,
}: AccordionSectionProps) {
  return new AccordionSectionPresenter(
    id,
    accordionCopy,
    sectionCopy,
    faqPresenter,
  );
}

/**
 * An accordion with a header and button that opens/closes all accordion panels.
 */
export const AccordionSection = withPresenterManager({
  usePresenter,
  ManagedComponent,
  managerIsObserver: true,
});
